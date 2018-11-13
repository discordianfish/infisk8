// add styles
import './style.css'
// three.js
import * as THREE from 'three';
// import {OrbitControls} from 'three/examples/js/controls/OrbitControls';
import {PointerLockControls} from 'three/examples/js/controls/PointerLockControls';
// import {FirstPersonControls} from 'three/examples/js/controls/FirstPersonControls';
import {lockPointer} from './lock_pointer';
import {newTerrain} from './terrain';
import Controls from './controls';

let scene = new THREE.Scene()
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000)

let renderer = new THREE.WebGLRenderer();

// const controls = new OrbitControls(camera, renderer.domElement);
const plc = new PointerLockControls(camera);
const yawObject = plc.getObject();
yawObject.position.y = 1200;
scene.add(yawObject);
// const fpc = new FirstPersonControls(camera);
// const yawObject = camera;

lockPointer(document.getElementById('blocker'), document.getElementById('instructions'), plc)

const controls = new Controls(document.getElementById('blocker'), document.getElementById('instructions'), plc)

renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

let axis = new THREE.AxesHelper(10)
camera.add(axis)

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

let raycaster = new THREE.Raycaster(); // new THREE.Vector3(), new THREE.Vector3( 0, -1, 0 ), 0, 10 );

const size = 1000;
let terrain = new THREE.Mesh(newTerrain(size, size, size/10, size/10), material);
terrain.rotation.x = -Math.PI/2;

scene.add(terrain)
/*
var vnh = new THREE.VertexNormalsHelper(terrain, 10, 0xff0000 );
scene.add(vnh);
*/
/*
console.log(terrain.geometry.faces);
var fnh = new THREE.FaceNormalsHelper(terrain, 10, 0x00ff00, 1 );
scene.add(fnh);
*/

var prevTime = performance.now();
var velocity = new THREE.Vector3();

var groundLevel;
var groundDistance;
var onGround = false;

function groundCheck(delta): void {
  // raycaster.ray.origin.copy(yawObject.position);
  // raycaster.ray.origin.y += 100;
  var rayOffset = 100;
  var rayOrigin = new THREE.Vector3().copy(yawObject.position)
  rayOrigin.y += rayOffset;
  raycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0))

  var intersections = raycaster.intersectObject(terrain);
  if (intersections.length > 0) {
    groundLevel = intersections[0].point.y;
    groundDistance = intersections[0].distance - rayOffset;

    if (groundDistance < 1) {
      onGround = true
      var n = intersections[0].face.normal;

      // convert local normal to world position.. I think..?
      var normalMatrix = new THREE.Matrix3().getNormalMatrix( intersections[0].object.matrixWorld );
      var normal = n.clone().applyMatrix3(normalMatrix).normalize();

      var reflection = new THREE.Vector3().copy(velocity); // yawObject.position);
      reflection.reflect(normal);
      var velocityArr = new THREE.ArrowHelper(velocity, intersections[0].point, velocity.length() * 10, 0x0000ff);
      scene.add(velocityArr);


      var reflectionArr = new THREE.ArrowHelper(reflection, intersections[0].point, reflection.length() * 10, 0xff0000);
      scene.add(reflectionArr);

      // We can't add the reflection to velocity since that's relative to the FPS controller
      velocity.add(reflection);
      // yawObject.position.add(reflection.multiplyScalar(delta));
    }
  }
}


function animate(): void {
  requestAnimationFrame(animate);
  if (plc.enabled) {
    var time = performance.now();
    var delta = ( time - prevTime ) / 1000;
    prevTime = time;
    groundCheck(delta)

	  velocity.x -= velocity.x * 1.0 * delta;
		velocity.z -= velocity.z * 1.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta;
    yawObject.position.add(velocity.multiplyScalar(delta));

    var direction = controls.input();

    var controlVelocity = new THREE.Vector3();
    if (onGround || controls.boost) {
      controlVelocity.z -= direction.z * 40.0 * delta;
      controlVelocity.x -= direction.x * 40.0 * delta;
      controlVelocity.y += (direction.y * 20.0); // * delta;
    }
    controlVelocity.y += Number(controls.boost);
    controlVelocity.z -= Number(controls.boost);

    // FIXME: I think we need to add the control velocity to the overall
    // velocity to keep momentum for slide calculation.
    yawObject.translateX(controlVelocity.x);
    yawObject.translateY(controlVelocity.y);
    yawObject.translateZ(controlVelocity.z);



    // console.log("groundLevel: ", groundLevel);
    // console.log("yawObject.position.y: ", yawObject.position.y);
    if (yawObject.position.y < groundLevel) {
      yawObject.position.y = groundLevel;
      /*if (velocity.y < 0) {
        velocity.y = 0; // 1 * delta;
      }*/
    }
    // yawObject.position.y = Math.max(yawObject.position.y, groundLevel);
    // axis.position.set(camera.x, camera.y, camera.z + 2);
    console.log(velocity);
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
