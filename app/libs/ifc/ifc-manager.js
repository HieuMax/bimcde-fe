import { Matrix4, Raycaster, Vector2 } from 'three';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { IFCSPACE, IFCOPENINGELEMENT } from 'web-ifc';

import * as THREE from 'three';

export class IfcManager {
  constructor(scene, ifcModels) {
    this.scene = scene;
    this.ifcModels = ifcModels;
    this.ifcLoader = new IFCLoader();
    this.ifcLoader.ifcManager.setWasmPath('/wasm/');

    this.setupLoader();
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
    this.ifcModels.length = 0;
    await this.ifcLoader.ifcManager.dispose();
    this.ifcLoader = null;
    this.ifcLoader = new IFCLoader();

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

    if (firstModel) {
      const matrixArr = await this.ifcLoader.ifcManager.ifcAPI.GetCoordinationMatrix(
        ifcModel.modelID,
      );
      const matrix = new Matrix4().fromArray(matrixArr);
      this.ifcLoader.ifcManager.setupCoordinationMatrix(matrix);
    }

    this.ifcModels.push(ifcModel);
    this.scene.add(ifcModel);

    await this.initializeAllExpressIDs(ifcModel.modelID);

    const stop = window.performance.now();

    console.log(`Time Taken to load = ${(stop - start) / 1000} seconds`);

    return ifcModel;
  }

  /**
   * Here we support import 1 model at a time -> maybe extend later
   */
  clearModels() {
    console.log("Clearing IFC models...");

    this.ifcModels.forEach((m) => {
      if (m.mesh) {
        this.scene.remove(m.mesh);
        if (m.mesh.geometry) m.mesh.geometry.dispose();

        if (m.mesh.material) {
          if (Array.isArray(m.mesh.material)) m.mesh.material.forEach(mat => mat.dispose());
          else m.mesh.material.dispose();
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

    if (pickTargets.length === 0) return;

    const intersects = this.raycaster.intersectObjects(pickTargets, false);
    this.removeHighlight();
    if (intersects.length === 0) return;

    const found = intersects[0];
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


    const geometry = subset.geometry.clone();
    const glowMaterial = new THREE.MeshPhongMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.3,
      depthTest: false,
      side: THREE.DoubleSide,
      wireframe: false,
    });

    const glowMesh = new THREE.Mesh(geometry, glowMaterial);
    glowMesh.position.copy(subset.position);
    glowMesh.rotation.copy(subset.rotation);
    glowMesh.scale.copy(subset.scale);

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
    edgesMesh.position.copy(subset.position);
    edgesMesh.rotation.copy(subset.rotation);
    edgesMesh.scale.copy(subset.scale);

    this.scene.add(edgesMesh);
    this.highlightMeshes.push(edgesMesh);
  }

  // async highlight(modelID, expressID) {
  //   this.removeHighlight();

  //   this.highlightModelID = modelID;
  //   this.highlightExpressID = expressID;

  //   const subset = this.ifcLoader.ifcManager.createSubset({
  //     modelID,
  //     ids: [expressID],
  //     applyBVH: true,
  //     removePrevious: true,
  //   });

  //   if (!subset) return;

  //   const geometry = subset.geometry.clone();

  //   const glowMaterial = new THREE.MeshPhongMaterial({
  //     color: 0xffff00,
  //     emissive: 0xffff00,
  //     emissiveIntensity: 0.4,
  //     transparent: true,
  //     opacity: 0.3,
  //     depthTest: false,
  //     side: THREE.DoubleSide,
  //     wireframe: false,
  //   });

  //   const glowMesh = new THREE.Mesh(geometry, glowMaterial);
  //   glowMesh.position.copy(subset.position);
  //   glowMesh.rotation.copy(subset.rotation);
  //   glowMesh.scale.copy(subset.scale);
  //   this.scene.add(glowMesh);
  //   this.highlightMeshes.push(glowMesh);

  //   const edgesGeom = new THREE.EdgesGeometry(geometry, 25);
  //   const edgeMaterial = new THREE.LineBasicMaterial({
  //     color: 0xffff00,
  //     transparent: true,
  //     opacity: 0.8,
  //     depthTest: false,
  //     linewidth: 3,
  //   });

  //   const edgesMesh = new THREE.LineSegments(edgesGeom, edgeMaterial);
  //   edgesMesh.position.copy(subset.position);
  //   edgesMesh.rotation.copy(subset.rotation);
  //   edgesMesh.scale.copy(subset.scale);
  //   this.scene.add(edgesMesh);
  //   this.highlightMeshes.push(edgesMesh);

  //   this.rebuildSubset(modelID);
  // }

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
}
