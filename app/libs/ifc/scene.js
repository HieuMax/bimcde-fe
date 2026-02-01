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
  Clock,
  MOUSE,
  TOUCH,
  Raycaster
} from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'stats.js/src/Stats';

export class ThreeScene {
  constructor(canvas) {
    this.threeCanvas = canvas;
    this.scene = new Scene();
    this.clock = new Clock();

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

    this.renderer.localClippingEnabled = true;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;

    this.keys = {
      KeyW: false, KeyA: false, KeyS: false, KeyD: false,
      ShiftLeft: false, ShiftRight: false, Space: false,
      KeyR: false, KeyT: false
    };
    this.cameraMode = 'orbit';

    this.velocity = new Vector3();
    this.direction = new Vector3();
    this.onGround = false;

    this.moveSpeed = 8.0;
    this.runSpeedMultiplier = 2.5;
    this.jumpHeight = 12.0;
    // this.gravity = 35.0;
    // this.playerHeight = 1.7;
    this.maxStepHeight = 0.35;

    this.raycaster = new Raycaster(new Vector3(), new Vector3(0, -1, 0), 0, 50);

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);


    this.stats = new Stats();

    // axis
    this.axisScene = new Scene();
    this.axisHelper = new AxesHelper(1.2);
    this.axisCamera = new OrthographicCamera(-2.2, 2.2, 2.2, -2.2, 0, 10);

    this.setupScene();

    this.setCameraMode('orbit');
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.renderer.dispose();
  }

  onKeyDown = (event) => {
    if (event.code === 'Space') event.preventDefault();

    if (this.keys.hasOwnProperty(event.code)) {
      this.keys[event.code] = true;
    }
  }

  onKeyUp = (event) => {
    if (this.keys.hasOwnProperty(event.code)) {
      this.keys[event.code] = false;
    }
  }


  setCameraMode(mode) {
    if (!this.controls) return;
    this.cameraMode = mode;
    console.log(`Switching Camera to: ${mode}`);

    // Reset Physics
    this.velocity.set(0, 0, 0);
    Object.keys(this.keys).forEach(k => this.keys[k] = false);
    this.onGround = true;

    // Reset Controls
    this.controls.enableRotate = true;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = true;
    this.controls.maxPolarAngle = Math.PI;
    this.controls.minPolarAngle = 0;

    this.controls.mouseButtons = {
      LEFT: MOUSE.ROTATE,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.PAN
    };

    switch (mode) {
      case 'orbit': break;
      case 'pan':
        this.controls.enableRotate = false;
        this.controls.mouseButtons = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN };
        break;
      case 'look-around':
        this.controls.enablePan = false;
        this.controls.enableZoom = false;
        this.controls.maxPolarAngle = Math.PI - 0.2;
        this.controls.minPolarAngle = 0.2;
        break;
      case 'walk':
        console.log("Walk Mode Active");
        this.controls.enablePan = false;
        this.controls.screenSpacePanning = false;
        this.controls.maxPolarAngle = Math.PI;
        break;
    }
    this.controls.update();
  }

  updateMovement(delta) {
    if (this.cameraMode !== 'walk') return;

    const speed = (this.keys.ShiftLeft || this.keys.ShiftRight)
      ? this.moveSpeed * this.runSpeedMultiplier
      : this.moveSpeed;
    const actualMoveSpeed = speed * delta;

    const forward = new Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new Vector3();
    right.crossVectors(forward, this.camera.up).normalize();

    const moveVec = new Vector3();
    if (this.keys.KeyW) moveVec.add(forward);
    if (this.keys.KeyS) moveVec.sub(forward);
    if (this.keys.KeyA) moveVec.sub(right);
    if (this.keys.KeyD) moveVec.add(right);

    if (moveVec.length() > 0) moveVec.normalize().multiplyScalar(actualMoveSpeed);

    if (this.keys.KeyR) moveVec.y += actualMoveSpeed;
    if (this.keys.KeyT) moveVec.y -= actualMoveSpeed;

    this.camera.position.add(moveVec);
    this.controls.target.add(moveVec);

    this.controls.update();
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

    const delta = this.clock.getDelta();
    if (this.cameraMode === 'walk') {
      this.updateMovement(delta);
    } else {
      this.controls.update();
    }

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
    // this.stats.dom.style.cssText = 'position:absolute;top:1rem;left:1rem;z-index:1;';
    // requestAnimationFrame(() => {
    //   document.body.appendChild(this.stats.dom);
    // });
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


  animateCameraTo(targetPosition, targetLookAt, duration = 800) {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startTime = performance.now();

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      let progress = elapsed / duration;

      if (progress < 1) {
        const ease = easeOutCubic(progress);

        this.camera.position.lerpVectors(startPos, targetPosition, ease);
        this.controls.target.lerpVectors(startTarget, targetLookAt, ease);

        this.controls.update();
        requestAnimationFrame(animate);
      } else {
        this.camera.position.copy(targetPosition);
        this.controls.target.copy(targetLookAt);
        this.controls.update();
      }
    };

    requestAnimationFrame(animate);
  }

  // --- LOGIC SET VIEW ---
  setView(viewType) {
    if (!this.camera || !this.controls) return;

    this.camera.up.set(0, 1, 0);

    const distance = this.camera.position.distanceTo(this.controls.target);
    const target = this.controls.target.clone();
    const newPosition = new Vector3();

    switch (viewType) {
      case 'axon':
        const isoVec = new Vector3(1, 1, 1).normalize().multiplyScalar(distance);
        newPosition.copy(target).add(isoVec);
        break;

      case 'top':
        newPosition.set(target.x, target.y + distance, target.z);
        break;

      case 'bottom':
        newPosition.set(target.x, target.y - distance, target.z);
        break;

      case 'front':
        newPosition.set(target.x, target.y, target.z + distance);
        break;

      case 'back':
        newPosition.set(target.x, target.y, target.z - distance);
        break;

      case 'left':
        newPosition.set(target.x - distance, target.y, target.z);
        break;

      case 'right':
        newPosition.set(target.x + distance, target.y, target.z);
        break;
    }
    this.animateCameraTo(newPosition, target);
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
