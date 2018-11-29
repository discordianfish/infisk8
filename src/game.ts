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
import LocalPlayer from './player/localplayer';
import RemotePlayer from './player/remoteplayer';
import Lobby from './lobby';
import Terrain from './terrain/terrain';
import TerrainConfig from './terrain/config';
import Controls from './controls';
import HUD from './hud';
import Audio from './audio';
import Network from './network';
import Model from './player/model';

import * as Events from './events';

const vectorDown = new Vector3(0, -1, 0);

export default class Game {
  window: Window
  player: LocalPlayer
  controls: Controls
  terrain: Terrain
  scene: Scene
  renderer: WebGLRenderer
  camera: PerspectiveCamera
  hud: HUD
  audio: Audio
  terrainSize: number
  net: Network
  players: Object
  started: true

  raycaster: Raycaster

  prevTime: number
  debug: boolean
  killCounter: number
  constructor(window: Window, document: Document) {
    this.window = window
    let url = new URL(window.location.href);
    this.debug = url.searchParams.get('debug') == '1';
    this.players = {};

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

    let terrainConfig = new TerrainConfig();
    terrainConfig.detailFactor = 0;
    this.terrain = new Terrain(seed, this.terrainSize, this.terrainSize, terrainConfig)
    this.terrain.mesh.rotation.x = -Math.PI/2; // FIXME: Generate geometry in correct orientation right away..
    this.scene.add(this.terrain.mesh)
    this.render()

    let lobby = new Lobby(document, document.getElementById('menu-wrapper'), this);
    let controls = new Controls(document);
    this.player = new LocalPlayer(document, this, controls, "unknown");
    this.addEventListeners();
    this.player.addEventListeners();
  }

  start() {
    this.player.spawn();
    this.scene.add(this.player.object)

    this.player.object.position.y = this.terrain.getHeight(this.player.object.position.x, this.player.object.position.z) + 10

    this.prevTime = performance.now();
    this.started = true;
  }

  // returns true if hit is registered with non-terrain.
  registerHit(object: Object3D): boolean {
    let explode = false;
    Object.keys(this.players).forEach((n) => {
      let player = this.players[n];
      let d = player.object.position.distanceTo(object.position)
      if (d < 2) {
        this.score(player)
        player.die()
        explode = true
      }
    });
    return explode
  }

  score(victim: Player) {
    this.hud.flash(victim.name + " killed");
    this.hud.kills.add(victim.name + " killed by " + this.player.name);
    this.net.sendEvent(new Events.Kill(this.player, victim).serialize());
    this.killCounter += 1
  }

  die(killer: string) {
    this.hud.flash("Killed by " + killer);
    this.player.die()
    this.player.spawn()
    this.player.object.position.y = this.terrain.getHeight(this.player.object.position.x, this.player.object.position.z) + 10
    this.killCounter -= 1
  }

  registerHitRaycast(object: Object3D): boolean {
    let position = object.getWorldPosition(new Vector3())
    let direction = object.getWorldDirection(new Vector3()).negate()
    let intersections = this.raycast(position, direction, Object.keys(this.players).map((n) => this.players[n]));

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

    this.net.updateServerState(this.serialize())

    var time = performance.now();
    var delta = ( time - this.prevTime ) / 1000;
    this.prevTime = time;

    this.player.update(delta);
    // this.enemies.forEach((enemy) => enemy.update(delta));
    this.hud.update(delta);
    this.render()
  }

  onServerStateMessage(data): void {
    // console.log("received:", data);
    this.deserialize(data)
  }

  onServerEventMessage(data): void {
    let event = JSON.parse(data);
    console.log("Event type:", event["type"]);

    // FIXME: Use a typeswitch and the toString() method in the event.
    switch (event["type"]) {
      case 'Kill':
        this.hud.kills.add(event.victim + " killed by " + event.target);
        if (event.victim == this.player.name) {
          this.die(event.killer)
        }
        break;
    }
  }

  serialize() {
    let p = this.player.object.position;
    return JSON.stringify({
      name: this.player.name,
      position: [ p.x, p.y, p.z ],
    })
  }

  deserialize(data: any) {
    let s = JSON.parse(data);
    if (!this.players.hasOwnProperty(s.name)) {
      this.players[s.name] = new RemotePlayer(this, s.name);
      console.log("Spawning model for " + s.name);
    }
    this.hud.debug.buffer = [];
    Object.keys(this.players).sort().forEach((p) => {
      let s = this.players[p].object;
      this.hud.debug.buffer.push(p + '(' + [s.position.x.toFixed(1), s.position.y.toFixed(1), s.position.z.toFixed(1) ].join(',') + ')');
    });

    this.players[s.name].object.position.set(s.position[0], s.position[1], s.position[2])
    // console.log(s.name + '=(' + s.position.join(',') + ')');
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
    this.hud.onWindowResize();
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
  }
}
