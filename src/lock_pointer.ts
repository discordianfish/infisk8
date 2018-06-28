export function lockPointer(blocker: HTMLElement, instructions: HTMLElement, controls) {
  var blocker = document.getElementById( 'blocker' );
  var instructions = document.getElementById( 'instructions' );

  var havePointerLock = 'pointerLockElement' in document;

  if ( havePointerLock ) {
  	var element = document.body;
  	var pointerlockchange = function ( event ) {
  		if ( document.pointerLockElement === element ) {
  			controls.enabled = true;
  			blocker.style.display = 'none';
  		} else {
  			controls.enabled = false;
  			blocker.style.display = 'block';
  			instructions.style.display = '';
  		}
  	};
  	var pointerlockerror = function ( event ) {
  		instructions.style.display = '';
  	};
  	// Hook pointer lock state change events
  	document.addEventListener( 'pointerlockchange', pointerlockchange, false );
  	document.addEventListener( 'pointerlockerror', pointerlockerror, false );
  	instructions.addEventListener( 'click', function ( event ) {
  		instructions.style.display = 'none';
  		// Ask the browser to lock the pointer
      element.requestPointerLock = element.requestPointerLock
  		element.requestPointerLock();
  	}, false );
  } else {
  	instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
  }
}
