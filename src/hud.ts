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

  constructor(window: Window, document: Document) {
    let width = window.innerWidth;
    let height = window.innerHeight;

    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    let bitmap = canvas.getContext('2d');
    bitmap.font = 'Normal 40px Sans-Serif';
    bitmap.textAlign = 'center';
    bitmap.fillText("+", width / 2, height / 2);

    this.camera = new OrthographicCamera(-width/2, width/2, height/2, -height/2, 0, 30);
    this.scene = new Scene();

    var texture = new Texture(canvas)
    texture.needsUpdate = true;

    let material = new MeshBasicMaterial({map: texture});
    material.transparent = true;

    var geometry = new PlaneGeometry(width, height);
    var plane = new Mesh(geometry, material)
    this.scene.add(plane)
  }
}
