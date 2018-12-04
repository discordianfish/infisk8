import {
  Scene,
  PerspectiveCamera,
  Camera,
  Vector3,
  Object3D,
  WebGLRenderer,
  Renderer,
} from 'three';

import Lobby from './lobby';
import HUD from './hud';
interface Subject {
  update(delta: number): void;
  onWindowResize?(): void;
}

const PI_2 = Math.PI / 2;

export default class SceneManager {
  canvas: HTMLCanvasElement
  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  subjects: Array<Subject>
  object: Object3D
  pitchObject: Object3D
  menu: Lobby
  hud: HUD
  lastFrameTime: number

    constructor(canvas: HTMLCanvasElement, menu: Lobby, hud: HUD) {
      this.menu = menu;
      this.hud = hud;
      let camera = new PerspectiveCamera(75, canvas.width / canvas.height, 0.01, 1000);
      let renderer = new WebGLRenderer({ canvas: canvas }); //, antialias: true, alpha: true });
      renderer.autoClear = false;
      renderer.setClearColor(0xBDFFFD);
      this.canvas = canvas;
      this.renderer = renderer;
      this.camera = camera
      this.subjects = [];
      this.scene = new Scene();

      this.camera.rotation.set(0, 0, 0);
      this.pitchObject = new Object3D();
      this.pitchObject.add(this.camera)
      this.pitchObject.position.y = 1.5;

      this.object = new Object3D()
      this.object.add(this.pitchObject);
      console.log("object child", this.camera);
      this.lastFrameTime = performance.now();
    }

  onMouseMove( event ) {
    if (this.menu.open) return;
    let movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    let movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    // console.log("movementX", movementX, "movementY", movementY);
    this.object.rotation.y -= movementX * 0.002;
    this.pitchObject.rotation.x -= movementY * 0.002;

    this.pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, this.pitchObject.rotation.x));
  }

  update(): void {
    let time = performance.now();
    let delta = (time - this.lastFrameTime) / 1000;
    this.lastFrameTime = time;
    this.subjects.forEach((s) => s.update(delta));
    this.renderer.clear(true, true, true);
    this.renderer.render(this.scene, this.camera);
    this.renderer.render(this.hud.scene, this.hud.camera);
  }

  onWindowResize(): void {
    console.log("@onWindowREsize");
    this.subjects.forEach((s) => {
      if (typeof s.onWindowResize === 'function') {
        s.onWindowResize()
    }});
    this.camera.aspect = this.canvas.width / this.canvas.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.canvas.width, this.canvas.height);
    console.log("set size to", this.canvas.width, this.canvas.height)
  }
}

