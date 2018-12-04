import {Object3D, Scene, Vector3, Quaternion} from 'three';
import Projectile from '../projectile/projectile';
import Game from '../game';
import Rigidbody from '../rigidbody';
import Controls from '../controls';
import Player from './player';

var PI_2 = Math.PI / 2;

const vector3Zero = new Vector3();

export default class LocalPlayer extends Player {
  document: Document
  rigidbody: Rigidbody
  controls: Controls
  object: Object3D

  plElement: HTMLElement
  isLocked: boolean
  scene: Scene
  projectiles: Array<Projectile>
  speed: number
  boost: number
  boostUsePerSecond: number
  boostGainPerSecond: number
  boostFactor: number = 1.5
  maxSpeedGround: number = 20

  cooldown: number
  lastFired: number
  health: number = 100;
  constructor(document: Document, game: Game, controls: Controls, object: Object3D, name: string) {
    super(game, name);
    this.document = document;
    this.game = game;
    this.controls = controls

    this.cooldown = 1000;
    this.speed = 10;
    this.boost = 100;
    this.boostUsePerSecond = 40;
    this.boostGainPerSecond = 10;
    this.lastFired = performance.now();

	  this.plElement = document.body;
    this.isLocked = false;
    this.object = object

    this.rigidbody = new Rigidbody(game, this.object);

    this.projectiles = [];
  }

  fire() {
    let now = performance.now();
    if (now - this.lastFired < this.cooldown) {
      // console.log("Weapon cooldown", this.lastFired - now)
      return
    }
    this.lastFired = now;
    var projectile = new Projectile(this.game, this.object.position, this.game.sm.camera.getWorldQuaternion(new Quaternion()))
    this.game.scene.add(projectile.object)
    this.projectiles.push(projectile)
    this.game.audio.fire()
  }

  update(delta: number) {
    // Apply controls
    let direction = this.controls.input();
    let controlVelocity = new Vector3();
    let boost = false;
    if (this.controls.boost && this.boost > 0) {
      this.boost -= this.boostUsePerSecond * delta
      boost = true
    } else {
      if (this.boost < 100) {
        this.boost += this.boostGainPerSecond * delta
      }
    }
    this.game.hud.boost = this.boost;
    this.game.hud.health = this.health;
    this.game.audio.boost(boost, this.object.position);
    if (this.rigidbody.onGround || boost) {
      controlVelocity.z -= direction.z * this.speed * delta;
      controlVelocity.x -= direction.x * this.speed * delta;
      controlVelocity.y += direction.y * this.speed;
    }
    this.game.audio.slideAudio.gain.gain.value = this.rigidbody.onGround ? 0.1 : 0;
    controlVelocity.y += Number(boost) * this.boostFactor * this.speed * delta;
    controlVelocity.applyQuaternion(this.object.quaternion);

    if (boost || this.rigidbody.velocity.length() < this.maxSpeedGround) {
      this.rigidbody.velocity.add(controlVelocity);
    }

    // Other controls
    if (this.controls.fire) {
      this.fire()
    }

    // Update projectiles
    let projectiles = []
    for (let projectile of this.projectiles) {
      if (!projectile.update(delta)) {
        projectiles.push(projectile)
      }
    }
    // console.log("Number of active projectiles: ", projectiles.length)
    this.projectiles = projectiles;

    // Apply collision based momentum
    this.rigidbody.update(delta)

    if (this.rigidbody.impactMagnitude > 20) {
      console.log("crashed");
      let damage = (this.rigidbody.impactMagnitude - 20) * 3;
      this.health -= damage
      this.game.audio.crash(damage)
    }

    if (this.health <= 0) {
      this.die()
      this.health = 100;
      this.game.hud.flash("You died");
      this.rigidbody.velocity = new Vector3();
      this.spawn()
      this.object.position.y = this.game.terrain.getHeight(this.object.position.x, this.object.position.z) + 10;
    }
  }
};
