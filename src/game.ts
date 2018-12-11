import {
  DirectionalLight,
  Mesh,
  Scene,
  WebGLRenderer,
  AxesHelper,
  Vector3,
  Raycaster,
  ArrowHelper,
  Object3D,
  Renderer,
  Quaternion,
} from 'three';

import Audio from './audio';
import Controls from './controls';
import HUD from './hud';
import LocalPlayer from './player/localplayer';
import Model from './player/model';
import Network from './network';
import Player from './player/player';
import RemotePlayer from './player/remoteplayer';
import SceneManager from './scene_manager';
import Terrain from './terrain/terrain';
import TerrainConfig from './terrain/config';

import * as Events from './events';

const vectorDown = new Vector3(0, -1, 0);

export default class Game {
  player: LocalPlayer
  controls: Controls
  terrain: Terrain
  scene: Scene
  sm: SceneManager // FIXME: We shouldn't know about this. This should be removed once we don't need to access camera from localplayer
  hud: HUD
  audio: Audio
  terrainSize: number
  net: Network
  players: Object
  started: true

  raycaster: Raycaster

  debug: boolean
  killCounter: number
  name: string
  constructor(scene: Scene, sm: SceneManager, controls: Controls, hud: HUD, audio: Audio, net: Network, debug: boolean) {
    this.scene = scene;
    this.sm = sm;
    this.controls = controls;
    this.hud = hud;
    this.audio = audio;
    this.net = net;
    this.debug = debug
    this.players = {};

    this.net.stateDC.onmessage = e => this.onServerStateMessage(e.data);
    this.net.eventDC.onmessage = e => this.onServerEventMessage(e.data);
    this.net.onstart = () => this.start();

    let light = new DirectionalLight(0xffffff, 1.0)
    light.position.set(100, 100, 100)
    this.scene.add(light)

    let light2 = new DirectionalLight(0xffffff, 1.0)
    light2.position.set(-100, 100, -100)
    this.scene.add(light2)

    this.raycaster = new Raycaster();

    this.terrainSize = 1000;
    let seed = 23;

    let terrainConfig = new TerrainConfig();
    this.terrain = new Terrain(seed, this.terrainSize, this.terrainSize, terrainConfig)
    this.terrain.mesh.rotation.x = -Math.PI/2; // FIXME: Generate geometry in correct orientation right away..
    this.scene.add(this.terrain.mesh)

    this.player = new LocalPlayer(document, this, controls, sm.object, this.name);
  }

  start() {
    console.log("@start");
    this.player.spawn();
    this.scene.add(this.player.object)

    this.player.object.position.y = this.terrain.getHeight(this.player.object.position.x, this.player.object.position.z) + 10

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

  score(victim: RemotePlayer) {
    this.hud.flash(victim.name + " killed");
    this.hud.kills.add(victim.name + " killed by " + this.name);
    const rp = <RemotePlayer>this.player
    this.net.sendEvent(new Events.Kill(rp, victim).serialize());
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

  update(delta: number): void {
    if (!this.started) {
      return
    }
    this.player.update(delta);
    this.hud.status = this.name + '(' + [this.player.object.position.x.toFixed(1), this.player.object.position.y.toFixed(1), this.player.object.position.z.toFixed(1) ].join(',') + ')';
    this.net.updateServerState(this.serialize());
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
        if (event.victim == this.name) {
          this.die(event.killer)
        }
        break;
    }
  }

  serialize() {
    let p = this.player.object.position;
    return JSON.stringify({
      name: this.name,
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
}
