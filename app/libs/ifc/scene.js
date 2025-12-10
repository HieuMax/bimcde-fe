// scene.js — phiên bản hoàn chỉnh cho Next.js

import {
  AmbientLight,
  Color,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  GridHelper,
} from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "stats.js/src/Stats";

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
    });

    // this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // this.renderer.setSize(width, height);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.stats = new Stats();
    // this.grid = new GridHelper(200,200);

    this.setupScene();
  }

  setupScene() {
    this.setupBasics();
    this.setupLights();
    this.setupWindowResize();
    this.setupMonitoring();
    this.setupAnimation();
    this.setupCamera();
    // this.scene.add(this.grid);
  }

  setupAnimation = () => {
    this.stats.begin();

    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    this.stats.end();
    requestAnimationFrame(this.setupAnimation);
  };

  setupBasics() {
    this.scene.background = new Color(0xcccccc);
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
    window.addEventListener("resize", () => {
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
}
