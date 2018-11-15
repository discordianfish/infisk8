import {Object3D} from 'three';

var PI_2 = Math.PI / 2;

const eventLock = new CustomEvent('lock'); // , { type: 'lock' });
const eventUnlock = new CustomEvent('unlock'); // , { type: 'unlock' });

export default class Player {
  document: Document
  plElement: HTMLElement
  isLocked: boolean
  object: Object3D
  pitchObject: Object3D
  camera: Object3D
  constructor(document: Document, camera: Object3D) {

    this.document = document;
    this.camera = camera;

	  this.plElement = document.body;
	  this.isLocked = false;

	  this.camera.rotation.set( 0, 0, 0 );

	  this.pitchObject = new Object3D();
	  this.pitchObject.add( camera );

	  this.object = new Object3D();
    this.object.add(this.pitchObject);
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
};
