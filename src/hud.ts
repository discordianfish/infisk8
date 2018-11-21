import {
  OrthographicCamera,
  Scene,
  Texture,
  PlaneGeometry,
  Mesh,
  Camera,
  MeshBasicMaterial,
} from 'three';

export default class HUD {
  scene: Scene
  camera: Camera
  canvas: HTMLCanvasElement
  cc: CanvasRenderingContext2D
  texture: Texture
  flashed: number
  flashTimeout: number

  constructor(window: Window, document: Document) {
    let width = window.innerWidth;
    let height = window.innerHeight;

    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    this.canvas = canvas;
    this.texture = new Texture(canvas)

    this.flashTimeout = 1000;

    this.cc = canvas.getContext('2d');
    this.cc.textAlign = 'center';

    this.camera = new OrthographicCamera(-width/2, width/2, height/2, -height/2, 0, 30);
    this.scene = new Scene();

    this.drawCrosshair()

    let material = new MeshBasicMaterial({map: this.texture});
    material.transparent = true;

    var geometry = new PlaneGeometry(width, height);
    var plane = new Mesh(geometry, material)
    this.scene.add(plane)
  }

  drawCrosshair() {
    this.cc.font = 'Normal 40px Sans-Serif';
    this.cc.fillStyle = 'rgb(255, 0, 0)';
    this.cc.fillText("+", this.canvas.width / 2, this.canvas.height / 2);
    this.texture.needsUpdate = true;
  }

  flash(message: string) {
    this.cc.font = 'Normal 60px Sans-Serif';
    this.cc.fillStyle = 'rgb(255, 0, 255)';
    this.cc.fillText(message, this.canvas.width / 2, this.canvas.height / 4)
    this.texture.needsUpdate = true;
    this.flashed = performance.now();
  }

  update(delta: number) {
    if (performance.now() - this.flashed > this.flashTimeout) {
      this.cc.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.drawCrosshair()
    }
  }
}
