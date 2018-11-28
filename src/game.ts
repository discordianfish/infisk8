import {
  Object3D,
  BufferGeometry,
  Intersection,
  Camera,
  Float32BufferAttribute,
  DirectionalLight,
  Mesh,
  Material,
  MeshLambertMaterial,
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  AxesHelper,
  Vector3,
  Raycaster,
  Matrix3,
  ArrowHelper,
  Renderer,
  Quaternion,
} from 'three';

import Player from './player/player';
import Lobby from './lobby';
import Terrain from './terrain/terrain';
import Controls from './controls';
import HUD from './hud';
import Enemy from './enemy';
import Audio from './audio';
import Network from './network';
import Model from './player/model';

const vectorDown = new Vector3(0, -1, 0);

export default class Game {
  window: Window
  player: Player
  enemies: Array<Enemy>
  controls: Controls
  terrain: Terrain
  scene: Scene
  renderer: WebGLRenderer
  camera: PerspectiveCamera
  hud: HUD
  audio: Audio
  terrainSize: number
  net: Network
  pplayer: Object3D
  started: true

  raycaster: Raycaster

  prevTime: number
  debug: boolean
  scoreCounter: number
  constructor(window: Window, document: Document) {
    this.window = window
    let url = new URL(window.location.href);
    this.debug = url.searchParams.get('debug') == '1';

    this.enemies = []
    this.scene = new Scene()
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000)
    let renderer = new WebGLRenderer()
    renderer.autoClear = false;
    renderer.setClearColor(0xBDFFFD);
    this.renderer = renderer;


    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(this.renderer.domElement)

    let light = new DirectionalLight(0xffffff, 1.0)
    light.position.set(100, 100, 100)
    this.scene.add(light)

    let light2 = new DirectionalLight(0xffffff, 1.0)
    light2.position.set(-100, 100, -100)
    this.scene.add(light2)

    this.hud = new HUD(window, document);
    this.audio = new Audio(window);

    this.raycaster = new Raycaster();

    this.terrainSize = 1000;
    let seed = parseFloat(url.searchParams.get('seed')) || 23;
    this.terrain = new Terrain(seed, this.terrainSize, this.terrainSize, this.terrainSize/5, this.terrainSize/5)
    this.terrain.mesh.rotation.x = -Math.PI/2; // FIXME: Generate geometry in correct orientation right away..
    this.scene.add(this.terrain.mesh)
    this.render()

    let lobby = new Lobby(document, document.getElementById('menu-wrapper'), this);
    let controls = new Controls(document);
    this.player = new Player(document, this, controls);
    this.addEventListeners();
    this.player.addEventListeners();
  }

  start() {
    this.pplayer = Model();
    this.scene.add(this.pplayer);
    this.player.object.position.y = 1000;
    this.scene.add(this.player.object)

    this.player.object.position.y = this.terrain.getHeight(this.player.object.position.x, this.player.object.position.z) + 20

    this.prevTime = performance.now();
    this.started = true;
  }

  spawnEnemy(name: string): void {
    let enemy = new Enemy(this, name);
    enemy.object.position.x = Math.random() * 20;
    enemy.object.position.z = Math.random() * 20;
    enemy.object.position.y = this.terrain.getHeight(enemy.object.position.x, enemy.object.position.z) + 20;
    this.enemies.push(enemy);
  }

  // returns true if hit is registered with non-terrain.
  registerHit(object: Object3D): boolean {
    let explode = false;
    this.enemies.forEach((enemy) => {
      let d = enemy.object.position.distanceTo(object.position)
      if (d < 2) {
        this.score("Body Hit!", 100);
        enemy.die()
        explode = true
      }
    });
    return explode
  }

  score(message: string, score: number) {
    this.hud.flash(message);
    this.scoreCounter += score
  }

  registerHitRaycast(object: Object3D): boolean {
    let position = object.getWorldPosition(new Vector3())
    let direction = object.getWorldDirection(new Vector3()).negate()
    let intersections = this.raycast(position, direction, this.enemies.map((e) => e.object));

    if (intersections.length == 0) {
      return false
    }
    return intersections[0].distance < 3;
  }

  // Raycast hitting everything ridigbody etc should collide with.
  raycastAll(position: Vector3, direction: Vector3, debug?: boolean) {
    return this.raycast(position, direction, [ this.terrain.mesh], debug)
  }

  raycastTerrain(position: Vector3, direction: Vector3, debug?: boolean) {
    return this.raycast(position, direction, [ this.terrain.mesh], debug)
  }

  raycast(position: Vector3, direction: Vector3, objects: Array<Mesh>, debug?: boolean) {
    let dir = direction.clone().normalize();
    this.raycaster.set(position, dir);
    if (debug) {
      let pos = position.clone()
      pos.y -= 100
      this.scene.add(new ArrowHelper(direction, pos, 10, 0xffff00));
    }
    return this.raycaster.intersectObjects(objects);
  }

  update(): void {
    requestAnimationFrame(() => this.update());
    if (!this.started) {
      return
    }

    this.net.update(this.player.object.position)

    var time = performance.now();
    var delta = ( time - this.prevTime ) / 1000;
    this.prevTime = time;

    this.player.update(delta);
    this.enemies.forEach((enemy) => enemy.update(delta));
    this.hud.update(delta);
    this.render()
  }

  handleUpdate(data): void {
    let buf = new Buffer(data); // 3 * (64/8));

    this.pplayer.position.set(
      buf.readFloatBE(0),
      buf.readFloatBE(64/8),
      buf.readFloatBE((64/8) * 2))
  }

  render(): void {
    this.renderer.clear(true, true, true);
    this.renderer.render(this.scene, this.camera);
    this.renderer.render(this.hud.scene, this.hud.camera);
  }

  addEventListeners() {
    this.window.addEventListener('resize', () => this.onWindowResize(), false);
  }

  onWindowResize(){
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
  }
}
