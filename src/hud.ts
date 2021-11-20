import {
  OrthographicCamera,
  Scene,
  Texture,
  PlaneGeometry,
  Mesh,
  Camera,
  MeshBasicMaterial,
} from 'three';

function nextPow2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log(n)/Math.log(2)));
}

class Feed {
  buffer: Array<string>
  size: number
  gridX: number
  gridY: number

  constructor(size: number, gridX: number, gridY: number) {
    this.size = size;
    this.gridX = gridX;
    this.gridY = gridY;
    this.buffer = [];
  }

  add(line: string) {
    console.log("adding this to buffeR", line);
    this.buffer.push(line)
    if (this.buffer.length > this.size) {
      this.buffer.shift();
    }
  }

  render(canvas: CanvasRenderingContext2D, x: number, y: number) {
    let i = 0;
    this.buffer.forEach((l) => {
      canvas.fillText(l, x * this.gridX, (y * this.gridY) + (this.gridY * i))
      i++;
    });
  }
}

export default class HUD {
  scene: Scene
  camera: Camera
  canvas: HTMLCanvasElement
  cc: CanvasRenderingContext2D | null
  texture: Texture
  flashed: number
  flashTimeout: number

  gridX: number
  gridY: number

  // Game stats
  message: string
  boost: number = 0
  health: number = 0
  status: string
  debug: Feed
  kills: Feed

  constructor(window: Window, document: Document) {
    let width = window.innerWidth;
    let height = window.innerHeight;

    let canvas = document.createElement('canvas');
    this.canvas = canvas;

    this.onWindowResize();

    this.debug = new Feed(100, this.gridX, this.gridY);
    this.kills = new Feed(10, this.gridX, this.gridY);

    this.texture = new Texture(canvas)
    this.message = ''

    this.flashTimeout = 1000;

    this.cc = canvas.getContext('2d');

    this.camera = new OrthographicCamera(-width/2, width/2, height/2, -height/2, 0, 30);
    this.scene = new Scene();

    this.drawCrosshair()

    let material = new MeshBasicMaterial({map: this.texture});
    material.transparent = true;

    var geometry = new PlaneGeometry(width, height);
    var plane = new Mesh(geometry, material)
    this.scene.add(plane)
  }

  onWindowResize() {
    this.canvas.height = nextPow2(window.innerHeight);
    this.canvas.width = nextPow2(window.innerWidth);

    this.gridY = this.canvas.height / 20;
    this.gridX = this.canvas.width / 20;


  }

  drawCrosshair() {
    this.cc.font = 'Normal 40px Sans-Serif';
    this.cc.fillStyle = 'rgb(255, 0, 0)';
    this.cc.fillText("+", this.canvas.width / 2, this.canvas.height / 2);
    this.texture.needsUpdate = true;
  }

  flash(message: string) {
    this.message = message;
    this.flashed = performance.now();
  }

  clear() {
      this.cc.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  update(delta: number) {
    if (performance.now() - this.flashed > this.flashTimeout) {
      this.message = ""
    }

    this.clear()
    this.cc.textAlign = 'center';
    this.drawCrosshair()

    this.cc.font = 'Normal 60px Sans-Serif';
    this.cc.fillStyle = 'rgb(255, 0, 255)';
    this.cc.fillText(this.message, this.gridX * 10, this.gridX * 5);

    this.cc.textAlign = 'left';
    this.cc.fillText("Boost: " + this.boost.toFixed(0) + "%", this.gridX, this.gridY);
    this.cc.fillStyle = 'rgb(255, 0, 0)';
    this.cc.fillText("Health: " + this.health.toFixed(0) + "%", this.gridX, this.gridY * 2);

    this.cc.font = 'Normal 30px Sans-Serif';
    this.cc.fillText(this.status, this.gridX * 16, this.gridY);
    this.texture.needsUpdate = true;

    this.cc.font = 'Normal 20px Sans-Serif';
    this.cc.fillStyle = 'rgb(0, 0, 0)';

    this.debug.render(this.cc, 16, 10);
    this.kills.render(this.cc, 16, 2);

    this.texture.needsUpdate = true;
  }
}
