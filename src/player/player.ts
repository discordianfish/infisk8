import {Object3D, Scene, Vector3, Quaternion} from 'three';
import Projectile from '../projectile/projectile';

var PI_2 = Math.PI / 2;

const vector3Zero = new Vector3();

const eventLock = new CustomEvent('lock'); // , { type: 'lock' });
const eventUnlock = new CustomEvent('unlock'); // , { type: 'unlock' });

export default class Player {
  document: Document
  plElement: HTMLElement
  isLocked: boolean
  object: Object3D
  pitchObject: Object3D
  camera: Object3D
  scene: Scene
  projectiles: Array<Projectile>
  constructor(document: Document, scene: Scene, camera: Object3D) {

    this.document = document;
    this.scene = scene;
    this.camera = camera;

	  this.plElement = document.body;
	  this.isLocked = false;

	  this.camera.rotation.set( 0, 0, 0 );

	  this.pitchObject = new Object3D();
	  this.pitchObject.add( camera );

	  this.object = new Object3D();
    this.object.add(this.pitchObject);

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
		console.error( 'THREE.PointerLockControls: Unable to use Pointer Lock API' );
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
    var projectile = new Projectile(this.object.position, this.camera.getWorldQuaternion(new Quaternion()))
    this.scene.add(projectile.object)
    this.projectiles.push(projectile)
  }

  update(delta: number) {
    for (let projectile of this.projectiles) {
      projectile.update(delta)
    }
  }
};
