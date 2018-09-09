// add styles
import './style.css'
// three.js
import * as THREE from 'three';
// import {OrbitControls} from 'three/examples/js/controls/OrbitControls';
import {PointerLockControls} from 'three/examples/js/controls/PointerLockControls';
import {lockPointer} from './lock_pointer';
import {newTerrain} from './terrain';
import Controls from './controls';

let scene = new THREE.Scene()
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000)

let renderer = new THREE.WebGLRenderer();

// const controls = new OrbitControls(camera, renderer.domElement);
const plc = new PointerLockControls(camera);
const yawObject = plc.getObject();
yawObject.position.y = 1000;
scene.add(yawObject);
lockPointer(document.getElementById('blocker'), document.getElementById('instructions'), plc)

const controls = new Controls(document.getElementById('blocker'), document.getElementById('instructions'), plc)

renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

let axis = new THREE.AxesHelper(10)
scene.add(axis)

let light = new THREE.DirectionalLight(0xffffff, 1.0)
light.position.set(100, 100, 100)
scene.add(light)

let light2 = new THREE.DirectionalLight(0xffffff, 1.0)
light2.position.set(-100, 100, -100)
scene.add(light2)

let material = new THREE.MeshBasicMaterial({
	color: 0xaaaaaa,
	wireframe: true
})

let raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

const size = 1000;
let terrain = new THREE.Mesh(newTerrain(size, size, size/10, size/10), material);
terrain.rotation.x = -Math.PI/2;

scene.add(terrain)

// box.position.x = 0.5
// box.rotation.y = 0.5

/*
camera.position.x = 0
camera.position.y = 0
camera.position.z = 0

camera.lookAt(scene.position)
*/

// const clock = new THREE.Clock(true)
var prevTime = performance.now();
var velocity = new THREE.Vector3();
function animate(): void {
  requestAnimationFrame(animate);
  if (plc.enabled) {
    var time = performance.now();
    var delta = ( time - prevTime ) / 1000;
    prevTime = time;

    var direction = controls.input();

    raycaster.ray.origin.copy(yawObject.position);
    raycaster.ray.origin.y += 10;
    var intersections = raycaster.intersectObjects([terrain]);
    var onGround = intersections.length > 0;
    if (onGround) {
      // if steepness is high enough, add 'sliding' direction to input vector.
      // ---
      // Attempt #1:
      var nV = intersections[0].face.normal;
      direction.add(nV);
      // -> Bouncy, raycaster fails
    }

	  velocity.x -= velocity.x * 10.0 * delta;
		velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 1.0 * delta; // 100.0 = mass

    if (onGround) {
      velocity.y = Math.max(0, velocity.y);
    }

    velocity.z -= direction.z * 400.0 * delta;
    velocity.x -= direction.x * 400.0 * delta;
    velocity.y += (direction.y * 200.0); // * delta;

    yawObject.translateX(velocity.x * delta);
    yawObject.translateY(velocity.y * delta);
    yawObject.translateZ(velocity.z * delta);
    // console.log("velocity", velocity); //, "direction", direction);
  }
  render()
}

function render(): void {
  let timer = 0.002 * Date.now()
  // box.position.y = 0.5 + 0.5 * Math.sin(timer)
  // box.rotation.x += 0.1
  renderer.render(scene, camera)
}

animate()
