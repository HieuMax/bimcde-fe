import * as THREE from 'three';
import { Matrix4, Raycaster, Vector2 } from 'three';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import {
  IFCWALL, IFCWALLSTANDARDCASE, IFCSLAB, IFCWINDOW, IFCDOOR, IFCCOLUMN, IFCBEAM,
  IFCROOF, IFCSTAIR, IFCRAMP, IFCRAILING, IFCCURTAINWALL, IFCBUILDINGELEMENTPROXY,
  IFCPIPESEGMENT, IFCPIPEFITTING, IFCDUCTSEGMENT, IFCDUCTFITTING,
  IFCFLOWTERMINAL, IFCFLOWCONTROLLER, IFCFLOWFITTING, IFCFLOWSEGMENT,
  IFCELEMENTASSEMBLY, IFCFURNISHINGELEMENT, IFCMEMBER, IFCPLATE,
  IFCSPACE, IFCOPENINGELEMENT
} from 'web-ifc';
import { TransformControls } from 'three-stdlib';

const IGNORED_TYPES = [
  IFCSPACE,
  IFCOPENINGELEMENT,
  1289199279, // IFCSITE
  3124254112, // IFCPROJECT
  1451395588  // IFCBUILDING
];

const SOLID_TYPES = [
  IFCWALL, IFCWALLSTANDARDCASE, IFCSLAB, IFCWINDOW, IFCDOOR, IFCCOLUMN, IFCBEAM,
  IFCROOF, IFCSTAIR, IFCRAMP, IFCRAILING, IFCCURTAINWALL, IFCBUILDINGELEMENTPROXY,
  IFCPIPESEGMENT, IFCPIPEFITTING, IFCDUCTSEGMENT, IFCDUCTFITTING,
  IFCFLOWTERMINAL, IFCFLOWCONTROLLER, IFCFLOWFITTING, IFCFLOWSEGMENT,
  IFCELEMENTASSEMBLY, IFCFURNISHINGELEMENT, IFCMEMBER, IFCPLATE
];

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));
const degToRad = (deg) => deg * (Math.PI / 180);
const radToDeg = (rad) => rad * (180 / Math.PI);

const timeBudget = 12;
let lastYieldTime = performance.now();

const checkYield = async () => {
  const now = performance.now();
  if (now - lastYieldTime > timeBudget) {
    await new Promise(resolve => setTimeout(resolve, 0));
    lastYieldTime = performance.now(); // Reset
  }
};

export class IfcManager {
  constructor(scene, ifcModels) {
    this.scene = scene;
    this.ifcModels = ifcModels;
    this.ifcLoader = new IFCLoader();
    this.ifcLoader.ifcManager.setWasmPath('/wasm/');

    this.raycaster = new Raycaster();
    this.raycaster.firstHitOnly = true;
    this.mouse = new Vector2();

    // --- CLIPPING STATE ---
    this.planes = [];
    this.planeObjects = [];
    this.scissorIcons = []
    this.pendingPlaneMesh = null;
    this.transformControls = null;

    this.setupLoader();
  }

  get clippingPlanes() {
    return [];
  }

  async editSubset(type) {
    const ids = await this.ifcLoader.ifcManager.getAllItemsOfType(0, type, false);
    if (this.remove) this.ifcLoader.ifcManager.removeFromSubset(0, ids);
    else
      this.ifcLoader.ifcManager.createSubset({
        modelID: 0,
        ids,
        applyBVH: false,
        removePrevious: false,
      });
  }

  async setupLoader() {
    await this.ifcLoader.ifcManager.parser.setupOptionalCategories({
      [IFCSPACE]: false,
      [IFCOPENINGELEMENT]: false,
    });

    this.ifcLoader.ifcManager.setupThreeMeshBVH(
      computeBoundsTree,
      disposeBoundsTree,
      acceleratedRaycast,
    );
  }

  async dispose() {
    await this.clearModels()
    this.ifcModels.length = 0;
    await this.ifcLoader.ifcManager.dispose();
    this.ifcLoader = null;
    this.ifcLoader = new IFCLoader();

    if (this.transformControls) {
      this.transformControls.dispose();
      this.scene.remove(this.transformControls);
    }
    this.planeObjects.forEach(obj => {
      this.scene.remove(obj);
      obj.geometry.dispose();
      obj.material.dispose();
    });

    await this.setupLoader();
  }

  // HELPER
  _disposeMaterial(material) {
    if (!material) return;

    if (Array.isArray(material)) {
      material.forEach(m => m && m.dispose && m.dispose());
    }
    else if (material.dispose) {
      material.dispose();
    }
  }

  async loadIfcUrl(ifcURL) {
    const start = window.performance.now();

    this.ifcLoader.ifcManager.setOnProgress((event) => console.log(event));

    const firstModel = Boolean(this.ifcModels.length === 0);

    await this.ifcLoader.ifcManager.applyWebIfcConfig({
      COORDINATE_TO_ORIGIN: firstModel,
      USE_FAST_BOOLS: true,
    });
    console.log("Loading IFC model from URL:", ifcURL);
    const ifcModel = await this.ifcLoader.loadAsync(ifcURL);
    ifcModel.url = ifcURL;
    if (firstModel) {
      const matrixArr = await this.ifcLoader.ifcManager.ifcAPI.GetCoordinationMatrix(
        ifcModel.modelID,
      );
      const matrix = new Matrix4().fromArray(matrixArr);
      this.ifcLoader.ifcManager.setupCoordinationMatrix(matrix);
    }

    this.ifcModels.push(ifcModel);
    this.scene.add(ifcModel);
    this.updateModelClipPlanes();
    await this.initializeAllExpressIDs(ifcModel.modelID);

    const stop = window.performance.now();

    console.log(`Time Taken to load = ${(stop - start) / 1000} seconds`);

    return ifcModel;
  }

  /**
   * Here we support import 1 model at a time -> maybe extend later
   */
  async clearModels() {
    console.log("Clearing IFC models...");
    if (this.layerMap) this.layerMap.clear();
    this.ifcModels.forEach(async (m) => {
      if (m.mesh) {
        this.scene.remove(m.mesh);
        if (m.mesh.geometry) m.mesh.geometry.dispose();

        if (m.mesh.material) {
          if (Array.isArray(m.mesh.material)) m.mesh.material.forEach(mat => mat.dispose());
          else m.mesh.material.dispose();
        }
      }

      if (this.ifcLoader && this.ifcLoader.ifcManager) {
        try {
          await this.ifcLoader.ifcManager.closeModel(m.modelID);
        } catch (e) {
          console.warn("Failed to close model:", e);
        }
      }
    });

    this.hiddenSubsets.forEach((subset) => {
      this.scene.remove(subset);

      if (subset.geometry) subset.geometry.dispose();
      if (subset.material) {
        if (Array.isArray(subset.material)) {
          subset.material.forEach(m => m && m.dispose && m.dispose());
        } else if (subset.material.dispose) {
          subset.material.dispose();
        }
      }
      // subset.geometry.dispose();
      // if (subset.material) subset.material.dispose();
    });
    this.hiddenSubsets.clear();

    this.ifcModels.length = 0;
    this.hiddenExpressIDs.clear();
    this.modelHidden.clear();
    this.removeHighlight();
  }

  raycaster = new Raycaster();
  mouse = new Vector2();

  pick(event, camera, renderer) {
    const bounds = renderer.domElement.getBoundingClientRect();

    this.mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    this.mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);

    const previousFirstHitOnly = this.raycaster.firstHitOnly;
    this.raycaster.firstHitOnly = false;

    const pickTargets = [];

    for (const model of this.ifcModels) {
      const modelID = model.modelID;

      if (model.mesh?.visible) {
        pickTargets.push(model.mesh);
      }

      const subset = this.hiddenSubsets.get(modelID);
      if (subset && subset.visible) {
        pickTargets.push(subset);
      }
    }

    if (pickTargets.length === 0) {
      this.raycaster.firstHitOnly = previousFirstHitOnly;
      return;
    }

    const intersects = this.raycaster.intersectObjects(pickTargets, false);
    this.raycaster.firstHitOnly = previousFirstHitOnly;

    this.removeHighlight();
    if (intersects.length === 0) return;

    let found = null;

    for (const hit of intersects) {
      const point = hit.point;
      let isVisible = true;

      for (const plane of this.planes) {
        if (plane.distanceToPoint(point) < -0.0001) {
          isVisible = false;
          break;
        }
      }

      if (isVisible) {
        found = hit;
        break;
      }
    }

    if (!found) return;
    const faceIndex = found.faceIndex;
    const geometry = found.object.geometry;

    const expressID = this.ifcLoader.ifcManager.getExpressId(geometry, faceIndex);
    const modelID = found.object.modelID;

    this.highlight(modelID, expressID);

    return { modelID, expressID };
  }

  async getIFCProps(modelID, expressID) {
    console.log(modelID);
    const props = await this.ifcLoader.ifcManager.getItemProperties(modelID, expressID, true);
    console.log('IFC Properties:', props);
  }

  async getItemName(modelID, expressID) {
    const props = await this.ifcLoader.ifcManager.getItemProperties(modelID, expressID, false);
    return props.Name || `#${expressID}`;
  }

  async showProperties(item) {
    if (!item || !item.modelID || !item.expressID) return;
    const props = await this.ifcLoader.ifcManager.getItemProperties(
      item.modelID,
      item.expressID,
      true,
    );
    console.log('Item Properties:', props);
  }

  async getSpatialTree(modelID) {
    const rawTree = await this.ifcLoader.ifcManager.getSpatialStructure(modelID);
    console.log('Spatial Tree with flags:', rawTree);

    const getProperty = async (node) => {
      return await this.ifcLoader.ifcManager.getItemProperties(modelID, node.expressID, false);
    };

    /**
     * Optimize by limiting depth of property fetching -> can be adjusted
     */
    async function enrichNode(node, depth = 0, maxDepth = 5) {
      let properties = null;

      if (node.expressID && depth <= maxDepth) {
        properties = await getProperty(node);
      }

      const children = node.children
        ? await Promise.all(node.children.map((child) => enrichNode(child, depth + 1, maxDepth)))
        : [];

      return {
        ...node,
        properties,
        children,
      };
    }

    const tree = await enrichNode(rawTree);
    const layers = this.buildLayersFromTree(tree);
    // console.log('Spatial Tree with flags:', tree);

    return {
      tree,
      layers,
    };
    // return tree;
  }

  /**
   * HIGHLIGHT MANAGEMENT
   */

  highlightModelID = null;
  highlightExpressID = null;
  highlightMeshes = [];

  async createHighlightSubset(modelID, ids) {
    const subset = this.ifcLoader.ifcManager.createSubset({
      modelID,
      ids,
      applyBVH: true,
      removePrevious: true,
      customID: "highlight-subset-" + modelID
    });

    if (!subset) return;


    const model = this.ifcModels.find(m => m.modelID === modelID);
    const parentMesh = model ? model.mesh : null;

    const geometry = subset.geometry.clone();
    const glowMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFFF39,
      emissive: 0xFFFF39,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.3,
      depthTest: false,
      side: THREE.DoubleSide,
      wireframe: false,
    });

    const glowMesh = new THREE.Mesh(geometry, glowMaterial);
    if (parentMesh) {
      glowMesh.position.copy(parentMesh.position);
      glowMesh.rotation.copy(parentMesh.rotation);
      glowMesh.scale.copy(parentMesh.scale);
      glowMesh.updateMatrixWorld(true);
    } else {
      glowMesh.position.copy(subset.position);
      glowMesh.rotation.copy(subset.rotation);
      glowMesh.scale.copy(subset.scale);
    }

    glowMesh.userData = { isHighlight: true, modelID };

    this.scene.add(glowMesh);
    this.highlightMeshes.push(glowMesh);

    const edgesGeom = new THREE.EdgesGeometry(geometry, 25);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
      depthTest: false,
      linewidth: 3,
    });

    const edgesMesh = new THREE.LineSegments(edgesGeom, edgeMaterial);
    if (parentMesh) {
      edgesMesh.position.copy(parentMesh.position);
      edgesMesh.rotation.copy(parentMesh.rotation);
      edgesMesh.scale.copy(parentMesh.scale);
      edgesMesh.updateMatrixWorld(true);
    } else {
      edgesMesh.position.copy(subset.position);
      edgesMesh.rotation.copy(subset.rotation);
      edgesMesh.scale.copy(subset.scale);
    }
    edgesMesh.userData = { isHighlight: true, modelID };
    this.scene.add(edgesMesh);
    this.highlightMeshes.push(edgesMesh);
  }

  async highlight(modelID, expressID) {
    await this.highlightItems([{ modelID, expressID }]);
  }

  async highlightItems(items) {

    this.removeHighlight();

    if (!items || items.length === 0) return;


    const itemsByModel = {};

    items.forEach(item => {
      const mId = parseInt(item.modelID);
      const eId = parseInt(item.expressID || item.expressId);
      if (!isNaN(mId) && !isNaN(eId)) {
        if (!itemsByModel[mId]) {
          itemsByModel[mId] = [];
        }
        itemsByModel[mId].push(eId);
      }
    });


    for (const modelIDStr in itemsByModel) {
      const modelID = parseInt(modelIDStr);
      const ids = itemsByModel[modelID];

      await this.createHighlightSubset(modelID, ids);
    }
  }

  removeHighlight() {
    for (const mesh of this.highlightMeshes) {
      this.scene.remove(mesh);

      if (mesh.geometry) mesh.geometry.dispose();

      this._disposeMaterial(mesh.material);
    }
    this.highlightMeshes = [];
  }

  clearHighlightIfBelongsToModel(modelID) {
    if (this.highlightModelID === modelID) {
      this.removeHighlight();
    }
  }

  /**
   * VISIBILITY MANAGEMENT
   */

  hiddenSubsets = new Map();
  hiddenExpressIDs = new Map();
  modelHidden = new Map();

  toggleModelVisibility(modelID) {
    const model = this.ifcModels.find((m) => m.modelID === modelID);
    if (!model) return;

    const isHidden = this.modelHidden.get(modelID) === true;

    if (!isHidden) {
      // HIDE MODEL
      this.modelHidden.set(modelID, true);

      model.mesh.visible = false;

      const subset = this.hiddenSubsets.get(modelID);
      if (subset) subset.visible = false;

      this.clearHighlightIfBelongsToModel(modelID);
    } else {
      // SHOW MODEL - clear all hidden items and show everything
      this.modelHidden.set(modelID, false);

      this.hiddenExpressIDs.delete(modelID);

      const oldSubset = this.hiddenSubsets.get(modelID);
      if (oldSubset) {
        this.scene.remove(oldSubset);
        oldSubset.geometry.dispose();
        this.hiddenSubsets.delete(modelID);
      }

      model.mesh.visible = true;
    }
  }

  async initializeAllExpressIDs(modelID) {
    const model = this.ifcModels.find((m) => m.modelID === modelID);
    if (!model || model._allExpressIDs) return;

    const attr = model.mesh.geometry.attributes.expressID.array;
    model._allExpressIDs = [...new Set(attr)];
  }

  async toggleItemVisibility(modelID, expressID) {
    const model = this.ifcModels.find((m) => m.modelID === modelID);
    if (!model) return;

    await this.initializeAllExpressIDs(modelID);

    if (!this.hiddenExpressIDs.has(modelID)) {
      this.hiddenExpressIDs.set(modelID, new Set());
    }

    const set = this.hiddenExpressIDs.get(modelID);

    set.has(expressID) ? set.delete(expressID) : set.add(expressID);

    if (this.highlightModelID === modelID && this.highlightExpressID === expressID) {
      this.removeHighlight();
    }

    this.rebuildSubset(modelID);
  }

  async rebuildSubset(modelID) {
    const model = this.ifcModels.find((m) => m.modelID === modelID);
    if (!model) return;

    const hiddenSet = this.hiddenExpressIDs.get(modelID);
    const isModelHidden = this.modelHidden.get(modelID) === true;

    // const oldSubset = this.hiddenSubsets.get(modelID);
    // if (oldSubset) {
    //   this.scene.remove(oldSubset);
    //   oldSubset.geometry.dispose();
    //   this.hiddenSubsets.delete(modelID);
    // }
    const oldSubset = this.hiddenSubsets.get(modelID);
    if (oldSubset) {
      this.scene.remove(oldSubset);

      if (oldSubset.geometry) oldSubset.geometry.dispose();

      this._disposeMaterial(oldSubset.material);

      this.hiddenSubsets.delete(modelID);
    }

    if (!hiddenSet || hiddenSet.size === 0) {
      model.mesh.visible = !isModelHidden;
      return;
    }

    if (!model._allExpressIDs) {
      const attr = model.mesh.geometry.attributes.expressID.array;
      model._allExpressIDs = [...new Set(attr)];
    }

    const visibleIDs = model._allExpressIDs.filter((id) => !hiddenSet.has(id));

    const subset = this.ifcLoader.ifcManager.createSubset({
      modelID,
      ids: visibleIDs,
      scene: this.scene,
      removePrevious: true,
      applyBVH: true,
    });

    if (model.mesh) {
      subset.position.copy(model.mesh.position);
      subset.rotation.copy(model.mesh.rotation);
      subset.scale.copy(model.mesh.scale);
      subset.updateMatrixWorld(true);
    }

    model.mesh.visible = false;
    subset.visible = !isModelHidden;

    this.hiddenSubsets.set(modelID, subset);
  }

  /**
   *
   * LAYER BUILDING FROM SPATIAL TREE
   *
   */
  buildLayersFromTree(tree) {
    const layerMap = new Map();

    function traverse(node) {
      const isLeaf = !node.children || node.children.length === 0;

      if (isLeaf && node.properties) {
        const label = node.type; // ex: IFCWALL - we can refine it
        const typeId = node.properties?.type; // numeric IFC type id

        if (!label || !typeId) return;

        if (!layerMap.has(typeId)) {
          layerMap.set(typeId, {
            label,
            typeId,
          });
        }
      }

      if (node.children) {
        node.children.forEach(traverse);
      }
    }

    traverse(tree);
    return Array.from(layerMap.values());
  }

  async toggleTypeVisibility(modelID, ifcType) {
    const model = this.ifcModels.find((m) => m.modelID === modelID);
    if (!model) return;

    await this.initializeAllExpressIDs(modelID);

    const ids = await this.ifcLoader.ifcManager.getAllItemsOfType(modelID, ifcType, false);

    if (!ids || ids.length === 0) return;

    if (!this.hiddenExpressIDs.has(modelID)) {
      this.hiddenExpressIDs.set(modelID, new Set());
    }

    const hiddenSet = this.hiddenExpressIDs.get(modelID);

    const isCurrentlyVisible = ids.some((id) => !hiddenSet.has(id));

    if (isCurrentlyVisible) {
      ids.forEach((id) => hiddenSet.add(id));

      if (this.highlightModelID === modelID && ids.includes(this.highlightExpressID)) {
        this.removeHighlight();
      }
    } else {
      ids.forEach((id) => hiddenSet.delete(id));
    }

    this.rebuildSubset(modelID);
  }

  // This function has yet completed
  async isolateTypeVisibility(modelID, ifcType) {
    const model = this.ifcModels.find((m) => m.modelID === modelID);
    if (!model) return;

    await this.initializeAllExpressIDs(modelID);

    const allIDs = model._allExpressIDs;

    const visibleIDs = await this.ifcLoader.ifcManager.getAllItemsOfType(modelID, ifcType, false);

    if (!visibleIDs || visibleIDs.length === 0) return;

    const hiddenSet = new Set();

    for (const id of allIDs) {
      if (!visibleIDs.includes(id)) {
        hiddenSet.add(id);
      }
    }

    this.hiddenExpressIDs.set(modelID, hiddenSet);

    if (this.highlightModelID === modelID && !visibleIDs.includes(this.highlightExpressID)) {
      this.removeHighlight();
    }

    this.rebuildSubset(modelID);
  }

  unIsolateModel(modelID) {
    this.hiddenExpressIDs.delete(modelID);
    this.removeHighlight();
    this.rebuildSubset(modelID);
  }

  getVisibilityState() {
    const state = [];
    this.hiddenExpressIDs.forEach((idsSet, modelID) => {
      if (idsSet.size > 0) {
        state.push({
          modelID: modelID,
          ids: Array.from(idsSet) // Convert Set to Array
        });
      }
    });
    return state;
  }

  async restoreVisibilityState(savedState) {
    const modelsToReset = Array.from(this.hiddenExpressIDs.keys());
    this.hiddenExpressIDs.clear();
    this.modelHidden.clear()

    modelsToReset.forEach(modelID => this.rebuildSubset(modelID));

    // if (!savedState || !Array.isArray(savedState)) return;

    // for (const item of savedState) {
    //   const { modelID, ids } = item;
    //   this.hiddenExpressIDs.set(modelID, new Set(ids));
    //   this.rebuildSubset(modelID);
    // }

    modelsToReset.forEach(modelID => {
      const model = this.ifcModels.find(m => m.modelID === modelID);
      if (model) {
        model.mesh.visible = true;
        this.rebuildSubset(modelID);
      }
    });

    if (!savedState || !Array.isArray(savedState) || savedState.length === 0) return;

    for (const item of savedState) {
      const modelID = parseInt(item.modelID);
      const ids = item.ids.map(id => parseInt(id));

      if (!isNaN(modelID) && ids.length > 0) {
        this.hiddenExpressIDs.set(modelID, new Set(ids));

        this.rebuildSubset(modelID);
      }
    }
  }



  // --- PROPERTIES MANAGEMENT ---

  async getSelectionProperties(items) {
    if (!items || items.length === 0) return null;

    if (items.length === 1) {
      return await this.getSingleItemProperties(items[0]);
    } else {
      return await this.getSharedProperties(items);
    }
  }

  async getSingleItemProperties(item, computeGeometry = true) {
    const { modelID, expressID, fileUrl } = item;
    const modelIdInt = parseInt(modelID);
    const expressIdInt = parseInt(expressID);

    try {
      const props = await this.ifcLoader.ifcManager.getItemProperties(modelIdInt, expressIdInt);

      if (!props) {
        console.warn(`Warning: Could not fetch properties for Item ${expressID} in Model ${modelID}`);
        return null;
      }
      const psets = await this.ifcLoader.ifcManager.getPropertySets(modelIdInt, expressIdInt, true);
      const typeProps = await this.ifcLoader.ifcManager.getTypeProperties(modelIdInt, expressIdInt, true);
      const materials = await this.ifcLoader.ifcManager.getMaterialsProperties(modelIdInt, expressIdInt, true);
      let geoData = {};
      if (computeGeometry) {
        geoData = await this._calculateGeometryData(modelIdInt, expressIdInt);
      }
      let className = "Unknown";
      if (props && props.type) {
        className = this.ifcLoader.ifcManager.ifcAPI.GetNameFromTypeCode(props.type);
      }
      const formatted = {};

      formatted["Reference Object"] = {
        "Name": props?.Name?.value || props?.Name || "Unnamed",
        "GUID (MS)": props?.GlobalId?.value || "N/A",
        "GUID (IFC)": props?.GlobalId?.value || props?.GlobalId,
        "File Format": "IFC",
        "Common Type": this._decodeIfcString(props?.ObjectType) || "Unknown",
        "File Name": this._getFileName(fileUrl),
        "Model ID": modelID,
        "Express ID": expressID,
      };

      // --- GROUP: PRESENTATION LAYERS ---
      formatted["Presentation Layers"] = {
        "Layer": className
      };

      // --- GROUP: PRODUCT ---
      const productName = props?.Name?.value || props?.Name || "Unnamed";
      const productType = typeProps && typeProps.length > 0 ? (typeProps[0].Name?.value || "N/A") : "N/A";

      formatted["Product"] = {
        "Product Name": productName,
        "Product Description": this._decodeIfcString(props?.Description) || "N/A",
        "Product Object Type": productType,
        "Owning User": "@Company XYZ",
        "Creation Date": "Unknown",
        "Last Modified Date": "Unknown",
        "Change Action": "NoChange",
        "State": "Undefined",
        "Application": "Autodesk Revit 2013 (Revit v2013)"
      };

      // --- GROUP: CALCULATED GEOMETRY VALUES ---
      formatted["Calculated Geometry Values"] = {
        "Volume": geoData.volume ? `${geoData.volume} m³` : "N/A",
        "Area": geoData.area ? `${geoData.area} m²` : "N/A",
        "Center Of Gravity X": geoData.cog ? `${Math.round(geoData.cog.x)} mm` : "N/A",
        "Center Of Gravity Y": geoData.cog ? `${Math.round(geoData.cog.y)} mm` : "N/A",
        "Center Of Gravity Z": geoData.cog ? `${Math.round(geoData.cog.z)} mm` : "N/A",
        "Is Solid": "True"
      };

      // --- GROUP: ORIENTED BOUNDING BOX ---
      formatted["Oriented Bounding Box"] = {
        "Name": productName,
        "OX": geoData.bbox ? `${Math.round(geoData.bbox.min.x)} mm` : "N/A",
        "OY": geoData.bbox ? `${Math.round(geoData.bbox.min.y)} mm` : "N/A",
        "OZ": geoData.bbox ? `${Math.round(geoData.bbox.min.z)} mm` : "N/A",

        "Size X": geoData.size ? `${(geoData.size.x * 1000).toFixed(3)}` : "N/A",
        "Size Y": geoData.size ? `${(geoData.size.y * 1000).toFixed(3)}` : "N/A",
        "Size Z": geoData.size ? `${(geoData.size.z * 1000).toFixed(3)}` : "N/A",
      };

      // --- GROUP: MATERIALS (Ifc Material Layer Set Usage) ---
      if (materials && materials.length > 0) {
        const matGroup = {};
        materials.forEach((mat, index) => {
          if (mat.MaterialLayers) {
            mat.MaterialLayers.forEach((layer, idx) => {
              const matName = this._decodeIfcString(layer.Material?.Name);
              matGroup[`Layer ${idx + 1}.Material`] = matName;
              matGroup[`Layer ${idx + 1}.Thickness`] = layer.LayerThickness?.value ? parseFloat(layer.LayerThickness.value.toFixed(2)) + " mm" : "N/A";
            });
          } else if (mat.Materials) {
            mat.Materials.forEach((m, idx) => {
              matGroup[`Material ${idx + 1}`] = this._decodeIfcString(m.Name);
            });
          } else if (mat.Name) {
            matGroup[`Material`] = this._decodeIfcString(mat.Name);
          }
        });

        if (Object.keys(matGroup).length > 0) {
          formatted["Ifc Material Layer Set Usage"] = matGroup;
        }
      }

      // --- PROCESS PSETS (Identity Data, Phasing, Other, Constraints...) ---
      for (const pset of psets) {
        const rawPsetName = this._decodeIfcString(pset.Name);
        if (!rawPsetName) continue;

        let displayGroupName = rawPsetName;
        if (rawPsetName === "Pset_ElectricalDeviceCommon") displayGroupName = "Other";
        if (rawPsetName === "Pset_DistributionPortTypeCable") displayGroupName = "Other";
        // ... custom mappings

        const groupData = {};

        const propsToIterate = pset.HasProperties || pset.Quantities || [];

        for (const prop of propsToIterate) {
          const rawKey = this._decodeIfcString(prop.Name);
          if (!rawKey) continue;

          // FORMAT KEY: "RatedVoltage" -> "Rated Voltage"
          const formattedKey = this._formatPropName(rawKey);

          const val = this._extractPropValue(prop, rawKey);

          if (val !== null && val !== undefined) {
            groupData[formattedKey] = val;
          }
        }

        if (Object.keys(groupData).length > 0) {
          if (formatted[displayGroupName]) {
            formatted[displayGroupName] = { ...formatted[displayGroupName], ...groupData };
          } else {
            formatted[displayGroupName] = groupData;
          }
        }
      }

      return {
        title: productName,
        groups: formatted
      };
    } catch (error) {
      console.error("Error getting item properties:", error);
      return null;
    }
  }

  // --- (GEOMETRY) ---
  async _calculateGeometryData(modelID, expressID) {
    try {
      const model = this.ifcModels.find(m => m.modelID === modelID);
      if (!model) return {};

      const subset = this.ifcLoader.ifcManager.createSubset({
        modelID,
        ids: [expressID],
        removePrevious: true,
        customID: "temp-calc-subset",
        applyBVH: false
      });

      if (!subset || !subset.geometry) return {};

      // 1. Calculate Bounding Box
      subset.geometry.computeBoundingBox();
      const bbox = subset.geometry.boundingBox;
      const size = new THREE.Vector3();
      bbox.getSize(size);

      // 2. Calculate Center of Gravity (Centroid of BBox approximation)
      const center = new THREE.Vector3();
      bbox.getCenter(center);

      const matrixWorld = model.mesh.matrixWorld;

      // Apply matrix
      center.applyMatrix4(matrixWorld);

      const minWorld = bbox.min.clone().applyMatrix4(matrixWorld);
      const maxWorld = bbox.max.clone().applyMatrix4(matrixWorld);

      let volume = 0;
      let area = 0;

      const pos = subset.geometry.attributes.position;
      const index = subset.geometry.index;

      if (pos && index) {
        const p1 = new THREE.Vector3();
        const p2 = new THREE.Vector3();
        const p3 = new THREE.Vector3();

        for (let i = 0; i < index.count; i += 3) {
          const a = index.getX(i);
          const b = index.getX(i + 1);
          const c = index.getX(i + 2);

          p1.fromBufferAttribute(pos, a);
          p2.fromBufferAttribute(pos, b);
          p3.fromBufferAttribute(pos, c);

          // Area: 0.5 * |(p2-p1) x (p3-p1)|
          const edge1 = new THREE.Vector3().subVectors(p2, p1);
          const edge2 = new THREE.Vector3().subVectors(p3, p1);
          const cross = new THREE.Vector3().crossVectors(edge1, edge2);
          area += 0.5 * cross.length();

          // Signed Volume of tetrahedron with origin
          volume += p1.dot(cross) / 6.0;
        }
      }

      this.ifcLoader.ifcManager.removeSubset(modelID, undefined, "temp-calc-subset");

      return {
        volume: Math.abs(volume).toFixed(3),
        area: area.toFixed(3),
        cog: {
          x: (center.x * 1000), // Convert m to mm
          y: (center.y * 1000),
          z: (center.z * 1000)
        },
        bbox: {
          min: { x: minWorld.x * 1000, y: minWorld.y * 1000, z: minWorld.z * 1000 },
          max: { x: maxWorld.x * 1000, y: maxWorld.y * 1000, z: maxWorld.z * 1000 }
        },
        size: size
      };
    } catch (e) {
      console.warn("Error calculating geometry:", e);
      return {};
    }
  }


  async getSharedProperties(items) {
    const allProps = await Promise.all(items.map(i => this.getSingleItemProperties(i)));

    if (allProps.length === 0) return null;

    let sharedGroups = { ...allProps[0].groups };

    for (let i = 1; i < allProps.length; i++) {
      const currentItemGroups = allProps[i].groups;

      for (const groupName in sharedGroups) {

        if (!currentItemGroups[groupName]) {
          delete sharedGroups[groupName];
          continue;
        }

        const groupProps = sharedGroups[groupName];
        const currentProps = currentItemGroups[groupName];

        for (const key in groupProps) {
          if (currentProps[key] === undefined) {
            delete groupProps[key];
            continue;
          }

          const val1 = groupProps[key];
          const val2 = currentProps[key];

          if (val1 !== val2) {
            groupProps[key] = "Varies";
          }
        }

        if (Object.keys(groupProps).length === 0) {
          delete sharedGroups[groupName];
        }
      }
    }

    return {
      title: "Shared Properties",
      count: items.length,
      groups: sharedGroups
    };
  }

  // --- HELPERS ---
  _formatPropName(name) {
    if (!name) return "Unknown";
    const result = name.replace(/([A-Z])/g, ' $1');
    return result.trim();
  }

  _getFileName(url) {
    if (!url) return "Unknown";
    try {
      const parts = url.split('/');
      return parts[parts.length - 1];
    } catch (e) { return url; }
  }

  _decodeIfcString(ifcString) {
    if (!ifcString) return null;
    const raw = ifcString.value || ifcString;
    return raw;
  }

  _extractPropValue(prop, keyName) {
    if (!prop) return "N/A";

    if (prop.NominalValue) {
      const val = prop.NominalValue.value;
      if (typeof val === 'number' && !Number.isInteger(val)) {

        const lowerKey = keyName.toLowerCase();
        const isLengthProp =
          lowerKey.includes('height') ||
          lowerKey.includes('width') ||
          lowerKey.includes('depth') ||
          lowerKey.includes('length') ||
          lowerKey.includes('offset') ||
          lowerKey.includes('elevation') ||
          lowerKey.includes('radius') ||
          lowerKey.includes('diameter');

        if (isLengthProp && Math.abs(val) < 100) {
          return (val * 304.8).toFixed(0) + " mm";
        }

        return Number.isInteger(val) ? val : parseFloat(val.toFixed(3));
      }
      return val === "T" ? "True" : val === "F" ? "False" : val;
    }

    // Quantity Value
    if (prop.LengthValue !== undefined) return (prop.LengthValue.value * 1000).toFixed(0) + " mm";
    if (prop.AreaValue !== undefined) return parseFloat(prop.AreaValue.value.toFixed(3)) + " m²";
    if (prop.VolumeValue !== undefined) return parseFloat(prop.VolumeValue.value.toFixed(3)) + " m³";
    if (prop.CountValue !== undefined) return prop.CountValue.value;

    return "N/A";
  }











  // --------------------------------
  // DATA TABLE
  // --------------------------------
  async getAllVisibleItems() {
    const visibleItems = [];
    const YIELD_THRESHOLD = 2000;
    for (const model of this.ifcModels) {
      if (model.mesh.visible === false) continue;

      const modelID = model.modelID;
      const fileUrl = model.url || "";

      await this.initializeAllExpressIDs(modelID);
      const hiddenSet = this.hiddenExpressIDs.get(modelID); // Set<ExpressID>
      const allIDs = model._allExpressIDs || [];

      if (!allIDs) continue;

      // Yield aggressively to unblock main thread
      if (!hiddenSet || hiddenSet.size === 0) {
        for (let i = 0; i < allIDs.length; i++) {
          visibleItems.push({ modelID, expressID: allIDs[i], fileUrl });
          if (i % YIELD_THRESHOLD === 0) await yieldToMain();
        }
      } else {
        for (let i = 0; i < allIDs.length; i++) {
          const expressID = allIDs[i];
          if (!hiddenSet.has(expressID)) {
            visibleItems.push({ modelID, expressID, fileUrl });
          }
          if (i % YIELD_THRESHOLD === 0) await yieldToMain();
        }
      }
    }
    return visibleItems;
  }

  async getPropertiesBatch(itemsChunk) {
    const results = [];
    // Process items with frequent yields
    for (let i = 0; i < itemsChunk.length; i++) {
      const item = itemsChunk[i];

      // Use true to get Geometry for table rows (volume/area)
      const props = await this.getSingleItemProperties(item, true);

      const flatProps = {
        id: `${item.modelID}-${item.expressID}`,
        modelID: item.modelID,
        expressID: item.expressID,
      };

      if (props && props.groups) {
        Object.entries(props.groups).forEach(([groupName, groupData]) => {
          Object.entries(groupData).forEach(([key, val]) => {
            flatProps[`${groupName}.${key}`] = val;
          });
        });
      }
      results.push(flatProps);

      // Yield EVERY ITEM because _fetchItemData is heavy
      await yieldToMain();
    }
    return results;
  }



  async getAllUniquePropertyNames(visibleItems) {
    const uniqueKeys = new Set();

    // Default columns
    uniqueKeys.add("Presentation Layers.Layer");
    uniqueKeys.add("Reference Object.Name");
    uniqueKeys.add("Reference Object.File Name");


    const sampleSize = Math.min(visibleItems.length, 15);
    const step = Math.floor(visibleItems.length / sampleSize) || 1;

    for (let i = 0; i < sampleSize; i++) {
      const item = visibleItems[i * step];
      if (!item) continue;

      // CRITICAL: false to skip geometry calculation during scan -> No freeze
      const props = await this.getSingleItemProperties(item, false);

      if (props && props.groups) {
        Object.entries(props.groups).forEach(([groupName, groupData]) => {
          Object.keys(groupData).forEach((key) => {
            uniqueKeys.add(`${groupName}.${key}`);
          });
        });
      }
      await yieldToMain();
    }

    return Array.from(uniqueKeys).sort();
  }





  /**
   * --- MODEL TRANSPARENCY ---
   *
   * @param {number} opacity - 0 -> 1
   */
  setModelOpacity(opacity) {
    const factor = Math.max(0.2, Math.min(1, opacity));

    const isGhostMode = factor < 0.99;

    this.ifcModels.forEach((model) => {
      if (!model.mesh) return;

      const materials = Array.isArray(model.mesh.material)
        ? model.mesh.material
        : [model.mesh.material];

      materials.forEach((mat) => {
        if (mat.userData.originalOpacity === undefined) {
          mat.userData.originalOpacity = mat.opacity;
          mat.userData.originalTransparent = mat.transparent;
          mat.userData.originalDepthWrite = mat.depthWrite;
        }

        if (isGhostMode) {
          mat.opacity = mat.userData.originalOpacity * factor;
          mat.transparent = true;
          mat.depthWrite = true;
          mat.side = THREE.FrontSide;
          mat.alphaTest = 0;

        } else {

          mat.opacity = mat.userData.originalOpacity;
          mat.transparent = mat.userData.originalTransparent;
          mat.depthWrite = mat.userData.originalDepthWrite !== undefined ? mat.userData.originalDepthWrite : true;
          mat.side = THREE.DoubleSide;
        }

        mat.needsUpdate = true;
      });
    });
  }







  /**
   * --- MODEL TRANSFORM (Move / Rotate / Scale) ---
   */
  getModelTransform(modelID) {
    const model = this.ifcModels.find(m => m.modelID === modelID);
    if (!model || !model.mesh) return null;

    const m = model.mesh;

    return {
      position: {
        x: m.position.x,
        y: m.position.y,
        z: m.position.z
      },
      rotation: {
        x: radToDeg(m.rotation.x),
        y: radToDeg(m.rotation.y),
        z: radToDeg(m.rotation.z)
      },
      scale: m.scale.x
    };
  }

  setModelTransform(modelID, data) {
    const targetModelID = parseInt(modelID);

    const model = this.ifcModels.find(m => m.modelID === targetModelID);
    if (!model || !model.mesh) return;

    const m = model.mesh;

    // 1. Position
    if (data.position) {
      m.position.set(
        parseFloat(data.position.x),
        parseFloat(data.position.y),
        parseFloat(data.position.z)
      );
    }

    // 2. Rotation
    if (data.rotation) {
      m.rotation.set(
        degToRad(parseFloat(data.rotation.x)),
        degToRad(parseFloat(data.rotation.y)),
        degToRad(parseFloat(data.rotation.z))
      );
    }

    // 3. Scale
    if (data.scale) {
      const s = parseFloat(data.scale);
      m.scale.set(s, s, s);
    }

    // 4. Update Matrix 
    m.updateMatrixWorld(true);

    this.highlightMeshes.forEach(mesh => {
      if (mesh.userData.modelID === modelID) {
        mesh.position.copy(m.position);
        mesh.rotation.copy(m.rotation);
        mesh.scale.copy(m.scale);
        mesh.updateMatrixWorld(true);
      }
    });

    const subset = this.hiddenSubsets.get(modelID);
    if (subset) {
      subset.position.copy(m.position);
      subset.rotation.copy(m.rotation);
      subset.scale.copy(m.scale);
      subset.updateMatrixWorld(true);
    }
  }

  getAllModelsTransform() {
    return this.ifcModels.map(m => {
      if (!m.mesh) return null;
      return {
        modelID: m.modelID,
        fileUrl: m.url,
        position: { x: m.mesh.position.x, y: m.mesh.position.y, z: m.mesh.position.z },
        rotation: { x: m.mesh.rotation.x, y: m.mesh.rotation.y, z: m.mesh.rotation.z },
        scale: m.mesh.scale.x
      };
    }).filter(item => item !== null);
  }

  restoreAllModelsTransform(transforms) {
    if (!transforms || !Array.isArray(transforms)) return;

    transforms.forEach(t => {
      const model = this.ifcModels.find(m => m.url === t.fileUrl);
      if (model && model.mesh) {
        model.mesh.position.set(t.position.x, t.position.y, t.position.z);
        model.mesh.rotation.set(t.rotation.x, t.rotation.y, t.rotation.z);
        model.mesh.scale.set(t.scale, t.scale, t.scale);
        model.mesh.updateMatrixWorld(true);
      }
    });
  }

  // =========================================================================
  // CLASH DETECTION ENGINE
  // =========================================================================

  _getPreciseBoundingBox(mesh, matrixWorld) {
    const geometry = mesh.geometry;
    const index = geometry.index;
    const position = geometry.attributes.position;

    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    const v = new THREE.Vector3();

    if (index) {
      for (let i = 0; i < index.count; i++) {
        const idx = index.getX(i);
        v.fromBufferAttribute(position, idx);
        v.applyMatrix4(matrixWorld);

        min.min(v);
        max.max(v);
      }
    }
    else {
      for (let i = 0; i < position.count; i++) {
        v.fromBufferAttribute(position, i);
        v.applyMatrix4(matrixWorld);

        min.min(v);
        max.max(v);
      }
    }

    const bbox = new THREE.Box3(min, max);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    // Validation
    const maxDim = Math.max(size.x, size.y, size.z);
    const minDim = Math.min(size.x, size.y, size.z);


    if (bbox.isEmpty() || maxDim < 0.001 || maxDim > 10000.0) return null;

    return { bbox, size, minThickness: minDim };
  }

  async runClashTest(modelIDs, tolerance = 0.01, onProgress) {
    console.time("ClashTest");
    console.log("🚀 Starting Precise Clash Test (Verify Phase Added)...", modelIDs);

    if (!modelIDs || modelIDs.length < 2) return [];

    const itemsCache = {};
    const candidates = [];
    const confirmedClashes = [];
    let totalItemsToScan = 0;

    // =========================================================
    // PHASE 1: SCANNING BOUNDS
    // =========================================================
    if (onProgress) onProgress(0, "Phase 1: Scanning Geometry...");

    for (const id of modelIDs) {
      const modelID = parseInt(id);
      const model = this.ifcModels.find(m => m.modelID === modelID);
      if (!model) continue;

      // Force update world matrix
      if (model.mesh) model.mesh.updateMatrixWorld(true);

      itemsCache[modelID] = [];
      const solidIDs = [];

      for (const type of SOLID_TYPES) {
        if (IGNORED_TYPES.includes(type)) continue;
        try {
          const ids = await this.ifcLoader.ifcManager.getAllItemsOfType(modelID, type, false);
          if (ids && ids.length > 0) solidIDs.push(...ids);
        } catch (e) { }
      }

      model._solidExpressIDs = [...new Set(solidIDs)];
      totalItemsToScan += model._solidExpressIDs.length;
    }

    if (totalItemsToScan === 0) return [];

    let processedCount = 0;

    for (const id of modelIDs) {
      const modelID = parseInt(id);
      const model = this.ifcModels.find(m => m.modelID === modelID);
      const validIDs = model._solidExpressIDs || [];

      for (let i = 0; i < validIDs.length; i++) {
        const expressID = validIDs[i];
        const customID = `scan_${modelID}_${expressID}`;

        const subset = this.ifcLoader.ifcManager.createSubset({
          modelID, ids: [expressID], removePrevious: true,
          customID: customID, applyBVH: false
        });

        if (subset && subset.geometry) {
          const data = this._getPreciseBoundingBox(subset, model.mesh.matrixWorld);

          if (data) {
            itemsCache[modelID].push({
              modelID, expressID,
              bbox: data.bbox,
              size: data.size,
              minThickness: data.minThickness,
              matrixWorld: model.mesh.matrixWorld
            });
          }
        }
        this.ifcLoader.ifcManager.removeSubset(modelID, undefined, customID);

        processedCount++;
        if (processedCount % 100 === 0) {
          const percent = Math.round((processedCount / totalItemsToScan) * 30);
          if (onProgress) onProgress(percent, `Scanning Bounds...`);
          await checkYield();
        }
      }
    }

    console.log("Phase 1 Done. Valid Items:", Object.values(itemsCache).reduce((a, b) => a + b.length, 0));

    // =========================================================
    // PHASE 2: FIND CANDIDATES (AABB OVERLAP)
    // =========================================================
    const uniquePairs = [];
    for (let i = 0; i < modelIDs.length; i++) {
      for (let j = i + 1; j < modelIDs.length; j++) {
        uniquePairs.push([modelIDs[i], modelIDs[j]]);
      }
    }

    for (const [idA, idB] of uniquePairs) {
      const listA = itemsCache[parseInt(idA)] || [];
      const listB = itemsCache[parseInt(idB)] || [];

      for (const itemA of listA) {
        for (const itemB of listB) {
          const boxAExpanded = itemA.bbox.clone().expandByScalar(-tolerance);
          if (boxAExpanded.intersectsBox(itemB.bbox)) {
            candidates.push({ itemA, itemB });
          }
        }
      }
    }

    console.log(`Phase 2 Done. Potential Candidates: ${candidates.length}`);
    if (onProgress) onProgress(30, `Verifying ${candidates.length} candidates...`);

    // =========================================================
    // PHASE 3: VERIFY GEOMETRY
    // =========================================================

    const totalCandidates = candidates.length;
    let falsePositives = 0;

    for (let i = 0; i < totalCandidates; i++) {
      const { itemA, itemB } = candidates[i];
      const idGeoA = `verify_A_${i}_${Math.random()}`;
      const idGeoB = `verify_B_${i}_${Math.random()}`;

      const meshA = this.ifcLoader.ifcManager.createSubset({
        modelID: itemA.modelID, ids: [itemA.expressID], removePrevious: true,
        customID: idGeoA, applyBVH: true
      });

      const meshB = this.ifcLoader.ifcManager.createSubset({
        modelID: itemB.modelID, ids: [itemB.expressID], removePrevious: true,
        customID: idGeoB, applyBVH: true
      });

      if (meshA && meshB && meshA.geometry && meshB.geometry) {

        if (!meshA.geometry.boundsTree) meshA.geometry.computeBoundsTree();
        if (!meshB.geometry.boundsTree) meshB.geometry.computeBoundsTree();

        const matA = itemA.matrixWorld;
        const matB = itemB.matrixWorld;

        const isClashing = meshA.geometry.boundsTree.intersectsGeometry(
          meshB.geometry,
          matA.clone().invert().multiply(matB)
        );

        if (!isClashing) {
          falsePositives++;
        }
        else {
          const boxA = itemA.bbox;
          const boxB = itemB.bbox;

          const xOverlap = Math.max(0, Math.min(boxA.max.x, boxB.max.x) - Math.max(boxA.min.x, boxB.min.x));
          const yOverlap = Math.max(0, Math.min(boxA.max.y, boxB.max.y) - Math.max(boxA.min.y, boxB.min.y));
          const zOverlap = Math.max(0, Math.min(boxA.max.z, boxB.max.z) - Math.max(boxA.min.z, boxB.min.z));

          let rawPenetration = Math.min(xOverlap, yOverlap, zOverlap);
          if (xOverlap < 0.0001 || yOverlap < 0.0001 || zOverlap < 0.0001) rawPenetration = 0;

          const minThickness = Math.min(itemA.minThickness, itemB.minThickness);
          const penetration = Math.min(rawPenetration, minThickness);

          let distanceStr = "";
          let clashPoint = new THREE.Vector3();

          if (penetration > 0.0001) {
            distanceStr = "-" + penetration.toFixed(3) + "m";
            const intersectBox = boxA.clone().intersect(boxB);
            if (!intersectBox.isEmpty()) intersectBox.getCenter(clashPoint);
            else clashPoint.addVectors(boxA.getCenter(new THREE.Vector3()), boxB.getCenter(new THREE.Vector3())).multiplyScalar(0.5);
          } else {
            const cA = new THREE.Vector3(); boxA.getCenter(cA);
            const cB = new THREE.Vector3(); boxB.getCenter(cB);
            const dist = cA.distanceTo(cB);
            distanceStr = dist.toFixed(3) + "m";
            clashPoint.addVectors(cA, cB).multiplyScalar(0.5);
          }

          confirmedClashes.push({
            name: `Clash #${confirmedClashes.length + 1}`,
            distance: distanceStr,
            status: "Active",
            item1: { modelID: itemA.modelID, expressID: itemA.expressID },
            item2: { modelID: itemB.modelID, expressID: itemB.expressID },
            point: { x: clashPoint.x, y: clashPoint.y, z: clashPoint.z }
          });
        }
      }

      this.ifcLoader.ifcManager.removeSubset(itemA.modelID, undefined, idGeoA);
      this.ifcLoader.ifcManager.removeSubset(itemB.modelID, undefined, idGeoB);

      if (i % 20 === 0) {
        const percent = 30 + Math.round((i / totalCandidates) * 70);
        if (onProgress) onProgress(percent, `Verifying (${i}/${totalCandidates}) - Ignored ${falsePositives} false positives...`);
        await checkYield();
      }
    }

    if (onProgress) onProgress(100, "Done");
    console.log(`Clash detection finished. Real Clashes: ${confirmedClashes.length} (Filtered ${falsePositives} false positives)`);
    console.timeEnd("ClashTest");

    return confirmedClashes;
  }



  // =========================================================================
  // CLIPPING
  // =========================================================================

  updateModelClipPlanes() {
    for (const model of this.ifcModels) {
      if (model.mesh && model.mesh.material) {
        const materials = Array.isArray(model.mesh.material) ? model.mesh.material : [model.mesh.material];
        materials.forEach(mat => {
          mat.clippingPlanes = this.planes;
          mat.needsUpdate = true;
        });
      }
    }
  }

  toggleClipping(active, camera, renderer) {
    // renderer.localClippingEnabled = active;
    renderer.localClippingEnabled = true;

    if (active) {
      if (!this.transformControls) {
        if (typeof TransformControls === 'undefined') return;
        this.transformControls = new TransformControls(camera, renderer.domElement);
        this.transformControls.addEventListener('change', () => this.updateClippingPlanes());
        // ViewerClient handle dragging-changed
        this.transformControls.addEventListener('dragging-changed', (event) => { });
        this.scene.add(this.transformControls);
      }

      if (this.pendingPlaneMesh) {
        this.transformControls.attach(this.pendingPlaneMesh);
        this.transformControls.visible = true;
      }
    } else {
      if (this.transformControls) {
        this.transformControls.detach();
        this.transformControls.visible = false;
      }
      this.cancelCurrentClipping();
    }
  }

  createCanvasIcon() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.arc(64, 64, 50, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();

    ctx.lineWidth = 6;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    ctx.font = "80px Arial";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✂", 64, 70);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      depthWrite: false,
      clippingPlanes: []
    });

    const sprite = new THREE.Sprite(material);
    sprite.renderOrder = 9999;
    sprite.userData.isIcon = true;

    return sprite;
  }

  createPlaneFromIntersection(intersection) {
    this.removePendingPlane();

    const normal = intersection.face.normal.clone().applyQuaternion(intersection.object.quaternion).negate();
    const constant = -intersection.point.dot(normal);

    const plane = new THREE.Plane(normal, constant);
    // this.clippingPlanes.push(plane);
    this.planes.push(plane);
    this.updateModelClipPlanes();

    const size = 30;
    const geom = new THREE.PlaneGeometry(size, size);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      depthTest: false,
      clippingPlanes: []
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    // Offset
    const offset = 0.1;
    const visualPosition = normal.clone().multiplyScalar(-constant).add(normal.clone().multiplyScalar(offset));

    mesh.lookAt(normal);
    mesh.position.copy(visualPosition);
    mesh.userData.plane = plane;
    mesh.isPlaneHelper = true;
    mesh.renderOrder = 1000;

    const edgesGeom = new THREE.EdgesGeometry(geom);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xffff00, transparent: true, opacity: 1.0,
      depthTest: false, depthWrite: false, clippingPlanes: []
    });
    const edgesMesh = new THREE.LineSegments(edgesGeom, edgeMaterial);
    mesh.userData.border = edgesMesh;
    mesh.add(edgesMesh);

    const icon = this.createCanvasIcon();
    icon.position.copy(visualPosition);
    icon.visible = false;

    mesh.userData.linkedIcon = icon;
    mesh.userData.icon = icon;
    icon.userData.linkedMesh = mesh;

    this.scene.add(mesh);
    this.scene.add(icon);

    this.scissorIcons.push(icon);

    this.planeObjects.push(mesh);

    if (!this.iconObjects) this.iconObjects = [];
    this.iconObjects.push(icon);
    this.pendingPlaneMesh = mesh;

    if (this.transformControls) {
      this.transformControls.attach(mesh);
      this.transformControls.visible = true;
    }
  }

  // --- LOGIC SAVE ---
  saveCurrentClipping() {
    if (this.pendingPlaneMesh) {
      const mesh = this.pendingPlaneMesh;
      const icon = mesh.userData.linkedIcon;

      if (this.transformControls) {
        this.transformControls.detach();
        this.transformControls.visible = false;
      }

      mesh.material.visible = false;

      if (icon) icon.visible = true;

      this.pendingPlaneMesh = null;
    }
  }

  // --- LOGIC EDIT ---
  editPlane(mesh) {
    this.cancelCurrentClipping();

    const icon = mesh.userData.linkedIcon;

    mesh.visible = true;
    mesh.material.opacity = 0.3;
    mesh.material.visible = true;

    if (icon) icon.visible = false;

    this.pendingPlaneMesh = mesh;

    if (this.transformControls) {
      this.transformControls.attach(mesh);
      this.transformControls.visible = true;
    }
  }

  // --- LOGIC CLICK ---
  pickClipPlane(event, camera, renderer) {
    const bounds = renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    this.mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);

    const visibleIcons = this.scissorIcons.filter(icon => icon.visible);
    const iconIntersects = this.raycaster.intersectObjects(visibleIcons, false);

    if (iconIntersects.length > 0) {
      const icon = iconIntersects[0].object;
      return icon.userData.linkedMesh;
    }

    const visibleMeshes = this.planeObjects.filter(m => m.material.visible);
    const meshIntersects = this.raycaster.intersectObjects(visibleMeshes, false);

    if (meshIntersects.length > 0) {
      return meshIntersects[0].object;
    }

    return null;
  }

  updateClippingPlanes() {
    if (this.pendingPlaneMesh) {
      const mesh = this.pendingPlaneMesh;
      const plane = mesh.userData.plane;

      const icon = mesh.userData.linkedIcon;
      if (plane) {
        const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.quaternion);
        const constant = -mesh.position.dot(normal) + 0.1;
        plane.normal.copy(normal);
        plane.constant = constant;
      }

      if (icon) {
        icon.position.copy(mesh.position);
      }
    }
  }

  cancelCurrentClipping() {
    if (this.pendingPlaneMesh) {
      this.removePlane(this.pendingPlaneMesh);
      this.pendingPlaneMesh = null;
    }
    if (this.transformControls) {
      this.transformControls.detach();
      this.transformControls.visible = false;
    }
  }

  removePendingPlane() {
    if (this.pendingPlaneMesh) {
      this.removePlane(this.pendingPlaneMesh);
      this.pendingPlaneMesh = null;
    }
  }

  removePlane(mesh) {
    this.scene.remove(mesh);
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) mesh.material.dispose();

    const icon = mesh.userData.linkedIcon;
    if (icon) {
      this.scene.remove(icon);
      if (icon.material) icon.material.dispose();
      if (this.iconObjects) {
        this.iconObjects = this.iconObjects.filter(i => i !== icon);
        this.updateModelClipPlanes();
      }
    }

    if (mesh.userData.icon) {
      this.scissorIcons = this.scissorIcons.filter(i => i !== mesh.userData.icon);
    }

    this.planeObjects = this.planeObjects.filter(p => p !== mesh);

    const plane = mesh.userData.plane;
    if (plane) {
      // this.clippingPlanes = this.clippingPlanes.filter(p => p !== plane);
      this.planes = this.planes.filter(p => p !== plane);
      this.updateModelClipPlanes();
    }
  }

  deleteAllPlanes() {
    this.planeObjects.forEach(obj => {
      this.scene.remove(obj);
      if (obj.userData.linkedIcon) this.scene.remove(obj.userData.linkedIcon);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    this.planeObjects = [];
    this.iconObjects = [];
    this.scissorIcons = [];
    // this.clippingPlanes = [];
    this.planes = [];
    this.pendingPlaneMesh = null;
    this.updateModelClipPlanes();
    if (this.transformControls) this.transformControls.detach();
  }

  getClippingState() {
    // if (this.clippingPlanes.length === 0) return null;
    // return this.clippingPlanes.map(p => ({
    //   normal: p.normal.toArray(),
    //   constant: p.constant
    // }));
    if (this.planes.length === 0) return null;
    return this.planes.map(p => ({
      normal: p.normal.toArray(),
      constant: p.constant
    }));
  }

  restoreClippingState(planesData) {
    this.deleteAllPlanes();
    if (!planesData || planesData.length === 0) return;
    planesData.forEach(pData => {
      const normal = new THREE.Vector3().fromArray(pData.normal);
      this.createClippingPlane(normal, pData.constant);
    });
  }

  createClippingPlane(normal, constant) {
    const plane = new THREE.Plane(normal, constant);
    // this.clippingPlanes.push(plane);
    this.planes.push(plane);
    this.updateModelClipPlanes();
    const size = 30;
    const geom = new THREE.PlaneGeometry(size, size);

    // SAVED: material.visible = false
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      depthTest: false,
      clippingPlanes: []
    });
    mat.visible = false;
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    // Offset
    const offset = 0.1;
    const visualPosition = normal.clone().multiplyScalar(-constant).add(normal.clone().multiplyScalar(offset));

    mesh.lookAt(normal);
    mesh.position.copy(visualPosition);
    mesh.userData.plane = plane;
    mesh.isPlaneHelper = true;
    mesh.renderOrder = 1000;

    const edgesGeom = new THREE.EdgesGeometry(geom);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 1.0,
      depthTest: false,
      depthWrite: false,
      clippingPlanes: []
    });
    const edgesMesh = new THREE.LineSegments(edgesGeom, edgeMaterial);
    mesh.userData.border = edgesMesh;
    mesh.add(edgesMesh);

    const icon = this.createCanvasIcon();
    icon.position.copy(visualPosition);
    icon.visible = true;

    // Link
    mesh.userData.linkedIcon = icon;
    mesh.userData.icon = icon;
    icon.userData.linkedMesh = mesh;

    this.scene.add(mesh);
    this.scene.add(icon);

    this.scissorIcons.push(icon);

    this.planeObjects.push(mesh);
    if (!this.iconObjects) this.iconObjects = [];
    this.iconObjects.push(icon);
  }

  handleClippingClick(event, camera, renderer) {
    const bounds = renderer.domElement.getBoundingClientRect();
    const mouse = new Vector2();
    mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

    this.raycaster.setFromCamera(mouse, camera);

    const models = this.ifcModels.map(m => m.mesh).filter(m => m && m.visible);
    const intersects = this.raycaster.intersectObjects(models, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      this.createPlaneFromIntersection(hit);
    }
  }

  getClippingState() {
    if (this.planes.length === 0) return null;

    return this.planes.map(p => ({
      normal: p.normal.toArray(),
      constant: p.constant
    }));
  }
}