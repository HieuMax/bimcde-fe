import { Matrix4, Raycaster, Vector2 } from "three";
import { IFCLoader } from "web-ifc-three/IFCLoader";
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from "three-mesh-bvh";
import {
  IFCSPACE,
  IFCOPENINGELEMENT,
} from "web-ifc";

import * as THREE from "three";

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
    else this.ifcLoader.ifcManager.createSubset({modelID: 0, ids, applyBVH: false, removePrevious: false})
  }

  async setupLoader() {
    await this.ifcLoader.ifcManager.parser.setupOptionalCategories({
      [IFCSPACE]: false,
      [IFCOPENINGELEMENT]: false,
    });

    this.ifcLoader.ifcManager.setupThreeMeshBVH(
      computeBoundsTree,
      disposeBoundsTree,
      acceleratedRaycast
    );
  }

  async dispose() {
    this.ifcModels.length = 0;
    await this.ifcLoader.ifcManager.dispose();
    this.ifcLoader = null;
    this.ifcLoader = new IFCLoader();

    await this.setupLoader();
  }

  subset = {};

  async loadIfcUrl(ifcURL) {
    const start = window.performance.now()

    this.ifcLoader.ifcManager.setOnProgress((event) => console.log(event));

    const firstModel = Boolean(this.ifcModels.length === 0);

    await this.ifcLoader.ifcManager.applyWebIfcConfig({
        COORDINATE_TO_ORIGIN: firstModel,
        USE_FAST_BOOLS: true,
    });
    // console.log("Loading IFC from URL:", ifcURL);
    const ifcModel = await this.ifcLoader.loadAsync(ifcURL);

    if (firstModel) {
        const matrixArr = await this.ifcLoader.ifcManager.ifcAPI.GetCoordinationMatrix(ifcModel.modelID);
        const matrix = new Matrix4().fromArray(matrixArr);
        this.ifcLoader.ifcManager.setupCoordinationMatrix(matrix);
    }

    this.ifcModels.push(ifcModel);
    this.scene.add(ifcModel);

    const stop = window.performance.now()

    console.log(`Time Taken to load = ${(stop - start) / 1000} seconds`);

    return ifcModel
  }

  /**
   * Here we support import 1 model at a time -> maybe extend later
   */
  clearModels() {
    // console.log("Clearing IFC models...");
    // this.ifcModels.forEach((m) => this.scene.remove(m));
    // this.ifcModels.length = 0;
  }

  raycaster = new Raycaster();
  mouse = new Vector2();
  highlightSubset = null;

  pick(event, camera, renderer) {
    const bounds = renderer.domElement.getBoundingClientRect();

    this.mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    this.mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);

    const intersects = this.raycaster.intersectObjects(this.ifcModels);

    if (intersects.length === 0) return;

    const found = intersects[0];
    const faceIndex = found.faceIndex;
    const geometry = found.object.geometry;

    const expressID = this.ifcLoader.ifcManager.getExpressId(geometry, faceIndex);
    const modelID = found.object.modelID;


    this.highlight(modelID, expressID);
    this.getIFCProps(found.object.modelID, expressID);
  }
  
  async getIFCProps(modelID, expressID) {
    console.log(modelID)
    const props = await this.ifcLoader.ifcManager.getItemProperties(modelID, expressID, true);
    console.log("IFC Properties:", props);

    const type = await this.ifcLoader.ifcManager.getIfcType(modelID, expressID);
    const spatial = await this.ifcLoader.ifcManager.getSpatialStructure(modelID);
    const materials = await this.ifcLoader.ifcManager.getMaterialsProperties(modelID, expressID);

    console.log("Type:", type);
    console.log("Spatial:", spatial);
    console.log("Materials:", materials);
  }

  async getItemName(modelID, expressID) {
    const props = await this.ifcLoader.ifcManager.getItemProperties(modelID, expressID, false);
    return props.Name || `#${expressID}`;
  }

  async highlight(modelID, expressID) {
    if (this.highlightEdges) {
      this.scene.remove(this.highlightEdges);
      this.highlightEdges.geometry.dispose();
      this.highlightEdges.material.dispose();
      this.highlightEdges = null;
    }

    if (this.highlightFill) {
      this.scene.remove(this.highlightFill);
      this.highlightFill.geometry.dispose();
      this.highlightFill.material.dispose();
      this.highlightFill = null;
    }

    const subset = this.ifcLoader.ifcManager.createSubset({
      modelID,
      ids: [expressID],
      applyBVH: true,
      removePrevious: true
    });

    if (!subset) return;


    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.12,
      depthTest: false,
      side: THREE.DoubleSide
    });

    this.highlightFill = new THREE.Mesh(subset.geometry, glowMaterial);
    this.highlightFill.position.copy(subset.position);
    this.highlightFill.rotation.copy(subset.rotation);
    this.highlightFill.scale.copy(subset.scale);

    this.scene.add(this.highlightFill);

    const edgesGeom = new THREE.EdgesGeometry(subset.geometry, 25);

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.6,
      depthTest: false
    });

    this.highlightEdges = new THREE.LineSegments(edgesGeom, edgeMaterial);

    this.highlightEdges.position.copy(subset.position);
    this.highlightEdges.rotation.copy(subset.rotation);
    this.highlightEdges.scale.copy(subset.scale);

    this.scene.add(this.highlightEdges);
  }

  async getSpatialTree(modelID) {
    const tree = await this.ifcLoader.ifcManager.getSpatialStructure(modelID);
    return tree;
  }
}
