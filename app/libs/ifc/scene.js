import {
  AmbientLight,
  Color,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  AxesHelper,
  OrthographicCamera,
  Sprite,
  SpriteMaterial,
  CanvasTexture,
  Vector3,
} from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'stats.js/src/Stats';

export class ThreeScene {
  constructor(canvas) {
    this.threeCanvas = canvas;
    this.scene = new Scene();

    const parent = canvas.parentElement;
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    this.camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
    // this.camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.renderer = new WebGLRenderer({
      antialias: true,
      canvas: this.threeCanvas,
      alpha: true,
    });

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.stats = new Stats();

    // axis
    this.axisScene = new Scene();
    this.axisHelper = new AxesHelper(1.2);
    this.axisCamera = new OrthographicCamera(-2.2, 2.2, 2.2, -2.2, 0, 10);

    this.setupScene();
  }

  setupScene() {
    this.setupBasics();
    this.setupLights();
    this.setupWindowResize();
    this.setupMonitoring();
    this.setupAnimation();
    this.setupCamera();
    this.setupAxisGizmo();
  }

  setupAxisGizmo() {
    /**
     * Set up axis helper XYZ
     */

    this.axisScene.add(this.axisHelper);

    const xLabel = this.createAxisLabel('X');
    xLabel.position.set(1, 0, 0);

    const yLabel = this.createAxisLabel('Y');
    yLabel.position.set(0, 1, 0);

    const zLabel = this.createAxisLabel('Z');
    zLabel.position.set(0, 0, 1);

    this.axisScene.add(xLabel, yLabel, zLabel);
    this.axisScene.background = null;
  }

  setupAnimation = () => {
    this.stats.begin();

    const canvas = this.renderer.domElement;
    const fullWidth = canvas.width;
    const fullHeight = canvas.height;

    this.renderer.setViewport(0, 0, fullWidth, fullHeight);
    this.renderer.setScissorTest(false);
    this.renderer.setClearColor(0xcccccc, 1);
    this.renderer.clear(true, true, true);

    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    const size = SIZE_AXIS.size;
    const margin = SIZE_AXIS.margin;

    const x = fullWidth - size - margin;
    const y = margin;

    this.renderer.setScissorTest(true);
    this.renderer.setScissor(x, y, size, size);
    this.renderer.setViewport(x, y, size, size);

    this.axisCamera.position
      .copy(this.camera.position)
      .sub(this.controls.target)
      .normalize()
      .multiplyScalar(6);

    this.axisCamera.lookAt(0, 0, 0);

    this.renderer.render(this.axisScene, this.axisCamera);

    this.renderer.setScissorTest(false);

    this.stats.end();
    requestAnimationFrame(this.setupAnimation);
  };

  setupBasics() {
    this.scene.background = new Color(0xcccccc);
    this.renderer.autoClear = false;
    const parent = this.threeCanvas.parentElement;
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    this.renderer.setSize(width, height);
    // this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.camera.position.z = 5;
  }

  setupLights() {
    const light1 = new DirectionalLight(0xffeeff, 0.8);
    light1.position.set(1, 1, 1);
    this.scene.add(light1);

    const light2 = new DirectionalLight(0xffffff, 0.8);
    light2.position.set(-1, 0.5, -1);
    this.scene.add(light2);

    const ambient = new AmbientLight(0xffffee, 0.25);
    this.scene.add(ambient);
  }

  setupWindowResize() {
    window.addEventListener('resize', () => {
      const parent = this.threeCanvas.parentElement;
      if (!parent) return;

      const width = parent.clientWidth;
      const height = parent.clientHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
    });
  }

  setupMonitoring() {
    this.stats.showPanel(0);
    this.stats.dom.style.cssText = 'position:absolute;top:1rem;left:1rem;z-index:1;';
    requestAnimationFrame(() => {
      document.body.appendChild(this.stats.dom);
    });
  }

  setupCamera() {
    this.camera.position.set(10, 10, 10);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  getRenderer() {
    return this.renderer;
  }

  getCamera() {
    return this.camera;
  }

  createAxisLabel(text) {
    const color = AXIS_COLORS[text];
    const size = 256;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 90, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 96px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, size / 2, size / 2);

    const texture = new CanvasTexture(canvas);

    const material = new SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });

    const sprite = new Sprite(material);
    sprite.scale.set(0.6, 0.6, 0.6);

    return sprite;
  }

  /**
   * Returns the current camera state including position and target.
   * @returns 
   */
  getCameraState() {
    return {
      position: this.camera.position.toArray(), // [x, y, z]
      target: this.controls.target.toArray()    // [x, y, z]
    };
  }

  setCameraState(state) {
    if (!state || !state.position || !state.target) return;

    const savedPos = state.position;
    const savedTarget = state.target;

    if (savedPos && savedTarget) {
      if (Array.isArray(savedPos)) {
        const newPos = new Vector3().fromArray(savedPos);
        const newTarget = new Vector3().fromArray(savedTarget);

        this.camera.position.copy(newPos);
        this.controls.target.copy(newTarget);
      }
      else {
        this.camera.position.set(savedPos.x, savedPos.y, savedPos.z);
        this.controls.target.set(savedTarget.x, savedTarget.y, savedTarget.z);
      }

      this.controls.update();
    }
  }

  // For thumbnail generation
  getScreenshot() {
    const width = this.threeCanvas.width;
    const height = this.threeCanvas.height;

    this.renderer.setViewport(0, 0, width, height);
    this.renderer.setScissorTest(false);

    this.renderer.setClearColor(0xcccccc, 1);
    this.renderer.clear(true, true, true);

    this.renderer.render(this.scene, this.camera);

    const dataURL = this.renderer.domElement.toDataURL('image/png');

    return dataURL;
  }
}

const AXIS_COLORS = {
  X: '#ff0000', // red
  Y: '#00ff00', // green
  Z: '#0000ff', // blue
};

const SIZE_AXIS = {
  size: 200,
  margin: -24,
};
