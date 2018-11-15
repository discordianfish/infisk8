import * as THREE from 'three';
import Player from './player/player';
import {lockPointer} from './lock_pointer';
import {newTerrain} from './terrain';
import Controls from './controls';

// TBH, I have no idea what I'm doing here. Needed for node upgrade. Probably
// node env during build doesn't provide the pointer lock API.
declare global {
    interface Document {
        pointerLockElement?: Element;
    }
    interface HTMLElement {
        requestPointerLock?: any;
    }
}

const DEBUG = new URL(window.location.href).searchParams.get('debug') == '1';
let scene = new THREE.Scene()
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000)

let renderer = new THREE.WebGLRenderer();

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

// const controls = new OrbitControls(camera, renderer.domElement);
const player = new Player(document, scene, camera);
const yawObject = player.object;
scene.add(yawObject);
player.addEventListeners();

lockPointer(document.getElementById('blocker'), document.getElementById('instructions'), player)

const controls = new Controls(document.getElementById('blocker'), document.getElementById('instructions'))

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
let terrain = new THREE.Mesh(newTerrain(size, size, size/5, size/5), material);
terrain.rotation.x = -Math.PI/2;

scene.add(terrain)

var rayOffset = 100;
var rayOrigin = new THREE.Vector3().copy(yawObject.position)
rayOrigin.y += rayOffset;
raycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0))

var intersections = raycaster.intersectObject(terrain);
if (intersections.length == 0) {
  console.log("Couldn't find ground, spawning at default level");
  yawObject.position.y = 100;
} else {
  yawObject.position.y = intersections[0].point.y + 10
}

var velocity = new THREE.Vector3();

function groundCheck(delta): number {
  // raycaster.ray.origin.copy(yawObject.position);
  // raycaster.ray.origin.y += 100;
  var rayOffset = 100;
  var rayOrigin = new THREE.Vector3().copy(yawObject.position)
  rayOrigin.y += rayOffset;
  raycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0))

  var groundLevel;
  var intersections = raycaster.intersectObject(terrain);
  if (intersections.length > 0) {
    groundLevel = intersections[0].point.y;

    var groundDistance = intersections[0].distance - rayOffset;
    if (groundDistance < 1) {
      var n = intersections[0].face.normal;

      // convert local normal to world position.. I think..?
      var normalMatrix = new THREE.Matrix3().getNormalMatrix( intersections[0].object.matrixWorld );
      var normal = n.clone().applyMatrix3(normalMatrix).normalize();

      var reflection = new THREE.Vector3().copy(velocity); // yawObject.position);
      // reflection.reflect(normal);
      reflection.sub(normal.multiplyScalar(2 * reflection.dot(normal)));
      if (DEBUG) {
        scene.add(new THREE.ArrowHelper(velocity, intersections[0].point, velocity.length() * 10, 0x0000ff));
        scene.add(new THREE.ArrowHelper(reflection, intersections[0].point, reflection.length() * 10, 0xff0000));
      }
      velocity = reflection;
    }
  }
  return groundLevel;
}


var prevTime = performance.now();
function animate(): void {
  requestAnimationFrame(animate);
  if (!player.isLocked) {
    return
  }
  var time = performance.now();
  var delta = ( time - prevTime ) / 1000;
  prevTime = time;

  player.update(delta)

  var groundLevel = groundCheck(delta);
  var groundDistance = yawObject.position.y - groundLevel;
  var onGround = groundDistance < 1;

  var direction = controls.input();

  var speed = 20
  var controlVelocity = new THREE.Vector3();
  if (onGround || controls.boost) {
    controlVelocity.z -= direction.z * speed * delta;
    controlVelocity.x -= direction.x * speed * delta;
    controlVelocity.y += (direction.y * speed); // * delta;
  }
  controlVelocity.y += Number(controls.boost) * speed * delta;
  controlVelocity.z -= Number(controls.boost) * speed * delta;

  // We don't translate yawObject directly so we have one motion vector and
  // we can include the momentum in the reflection on terrain collision.
  controlVelocity.applyQuaternion(yawObject.quaternion);
  velocity.add(controlVelocity);

  if (yawObject.position.y < groundLevel) {
    yawObject.position.y = groundLevel;
    velocity.z += velocity.y;
    velocity.y = 0;
  }

  // velocity.x -= velocity.x * 1.0 * delta;
  // velocity.z -= velocity.z * 1.0 * delta;
  velocity.y -= 9.8 * delta;
  yawObject.position.add(velocity.clone().multiplyScalar(delta));


  if (controls.fire) {
    player.fire()
  }
  render()
}

function render(): void {
  renderer.render(scene, camera)
}

animate()
