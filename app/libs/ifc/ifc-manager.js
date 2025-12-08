import { Matrix4, Box3, Vector3 } from "three";
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

    const box = new Box3().setFromObject(ifcModel);
    const center = new Vector3();
    box.getCenter(center);

    ifcModel.position.x -= center.x;
    ifcModel.position.z -= center.z;
    ifcModel.position.y -= box.min.y;

    const stop = window.performance.now()

    console.log(`Time Taken to load = ${(stop - start) / 1000} seconds`);
  }

  /**
   * Here we support import 1 model at a time -> maybe extend later
   */
  clearModels() {
    console.log("Clearing IFC models...");
    this.ifcModels.forEach((m) => this.scene.remove(m));
    this.ifcModels.length = 0;
  }
}
