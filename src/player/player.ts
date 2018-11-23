import {Object3D, Scene, Vector3, Quaternion} from 'three';
import Projectile from '../projectile/projectile';
import Game from '../game';
import Rigidbody from '../rigidbody';
import Controls from '../controls';

var PI_2 = Math.PI / 2;

const vector3Zero = new Vector3();

const eventLock = new CustomEvent('lock'); // , { type: 'lock' });
const eventUnlock = new CustomEvent('unlock'); // , { type: 'unlock' });

export default class Player {
  document: Document
  game: Game
  rigidbody: Rigidbody
  controls: Controls
  plElement: HTMLElement
  isLocked: boolean
  object: Object3D
  pitchObject: Object3D
  scene: Scene
  projectiles: Array<Projectile>
  speed: number

  cooldown: number
  lastFired: number
  constructor(document: Document, game: Game, controls: Controls) {
    this.document = document;
    this.game = game;
    this.controls = controls

    this.cooldown = 1000;
    this.speed = 20;
    this.lastFired = performance.now();

	  this.plElement = document.body;
	  this.isLocked = false;

    game.camera.rotation.set( 0, 0, 0 );

	  this.pitchObject = new Object3D();
	  this.pitchObject.add(game.camera);

	  this.object = new Object3D();
    this.object.add(this.pitchObject);
    this.rigidbody = new Rigidbody(game, this.object);

    this.projectiles = [];
  }

  onMouseMove( event ) {
		if (!this.isLocked) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		this.object.rotation.y -= movementX * 0.002;
		this.pitchObject.rotation.x -= movementY * 0.002;

    this.pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, this.pitchObject.rotation.x));
	}

	onPointerlockChange() {
		if (this.document.pointerLockElement === this.plElement ) {
      this.document.dispatchEvent(eventLock);
			this.isLocked = true;
		} else {
      this.document.dispatchEvent(eventUnlock);
			this.isLocked = false;
		}
	}

	onPointerlockError() {
		console.log( 'THREE.PointerLockControls: Unable to use Pointer Lock API' );
	}

	addEventListeners() {
    this.document.addEventListener( 'mousemove', e => this.onMouseMove(e), false );
    this.document.addEventListener( 'pointerlockchange', e => this.onPointerlockChange(), false );
    this.document.addEventListener( 'pointerlockerror', e => this.onPointerlockError(), false );
	};

  removeEventListener() {
    this.document.removeEventListener( 'mousemove', e => this.onMouseMove(e), false );
    this.document.removeEventListener( 'pointerlockchange', e => this.onPointerlockChange(), false );
    this.document.removeEventListener( 'pointerlockerror', e => this.onPointerlockError(), false );
  };

  fire() {
    let now = performance.now();
    if (now - this.lastFired < this.cooldown) {
      // console.log("Weapon cooldown", this.lastFired - now)
      return
    }
    this.lastFired = now;
    var projectile = new Projectile(this.game, this.object.position, this.game.camera.getWorldQuaternion(new Quaternion()))
    this.game.scene.add(projectile.object)
    this.projectiles.push(projectile)
    this.game.audio.fire()
  }

  update(delta: number) {
    // Apply controls
    let direction = this.controls.input();
    let controlVelocity = new Vector3();
    this.game.audio.boost(this.controls.boost, this.object.position);
    if (this.rigidbody.onGround || this.controls.boost) {
      controlVelocity.z -= direction.z * this.speed * delta;
      controlVelocity.x -= direction.x * this.speed * delta;
      controlVelocity.y += direction.y * this.speed;
    }
    controlVelocity.y += Number(this.controls.boost) * this.speed * delta;
    controlVelocity.z -= Number(this.controls.boost) * this.speed * delta;
    controlVelocity.applyQuaternion(this.object.quaternion);
    this.rigidbody.velocity.add(controlVelocity);

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
  }
};
