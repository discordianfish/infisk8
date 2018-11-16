import * as THREE from 'three';

export default class Controls {
  moveForward: boolean
  moveLeft: boolean
  moveRight: boolean
  moveBackward: boolean
  boost: boolean
  canJump: boolean
  jump: boolean
  fire: boolean

  constructor(document: Document, blocker: HTMLElement, instructions: HTMLElement) {
    this.moveForward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveBackward = false;
    this.boost = false;
    this.jump = false;
    this.fire = false;
    this.canJump = false;
    document.addEventListener( 'keydown', (event) => { this.onKeyDown(event) }, false );
    document.addEventListener( 'keyup', (event) => { this.onKeyUp(event) }, false );
    document.addEventListener( 'mousedown', (event) => { this.onMouseDown(event) }, false );
    document.addEventListener( 'mouseup', (event) => { this.onMouseUp(event) }, false );
  }

  onKeyDown ( event ) {
		switch ( event.keyCode ) {

			case 38: // up
			case 87: // w
				this.moveForward = true;
				break;

			case 37: // left
			case 65: // a
				this.moveLeft = true; break;

			case 40: // down
			case 83: // s
				this.moveBackward = true;
				break;

			case 39: // right
			case 68: // d
				this.moveRight = true;
				break;

      case 32: // space
        if (this.canJump === true) this.jump = true;
        this.canJump = false;
				break;
    }
  };

  onMouseDown(event) {
    switch(event.button) {
      case 0:
        this.fire = true;
        ;;
      case 2:
        this.boost = true;
        ;;
    }
  };

  onMouseUp(event) {
    switch(event.button) {
      case 0:
        this.fire = false;
        ;;
      case 2:
        this.boost = false;
        ;;
    }
  };

  onKeyUp(event) {

		switch( event.keyCode ) {

			case 38: // up
			case 87: // w
				this.moveForward = false;
				break;

			case 37: // left
			case 65: // a
				this.moveLeft = false;
				break;

			case 40: // down
			case 83: // s
				this.moveBackward = false;
				break;

			case 39: // right
			case 68: // d
				this.moveRight = false;
        break;

			case 32: // space
        this.canJump = false;
				break;
		}

	};

  input() {
    var input = new THREE.Vector3();
 		input.z = Number( this.moveForward ) - Number( this.moveBackward );
    input.x = Number( this.moveLeft ) - Number( this.moveRight );
    // input.y = Number( this.jump )
    // input.y += Number(this.boost) * 0.0007;
    // input.z += Number(this.boost) * 0.1;
    input.normalize(); // this ensures consistent movements in all inputs
    return input;
  }
}
