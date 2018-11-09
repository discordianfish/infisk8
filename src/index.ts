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
yawObject.position.y = 300;
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
var vnh = new THREE.VertexNormalsHelper(terrain, 10, 0xff0000 );
scene.add(vnh);

// var fnh = new THREE.FaceNormalsHelper(terrain, 10, 0x00ff00, 1 );
// scene.add(fnh);

var prevTime = performance.now();
var velocity = new THREE.Vector3();

var groundLevel;
var groundDistance;
var onGround = false;

function animate(): void {
  requestAnimationFrame(animate);
  if (plc.enabled) {
    var time = performance.now();
    var delta = ( time - prevTime ) / 1000;
    prevTime = time;

    var direction = controls.input();

    // raycaster.ray.origin.copy(yawObject.position);
    // raycaster.ray.origin.y += 100;
    var rayOffset = 100;
    var rayOrigin = new THREE.Vector3().copy(yawObject.position)
    rayOrigin.y += rayOffset;
    raycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0))

    var intersections = raycaster.intersectObjects([terrain]);
    if (intersections.length > 0) {
      // console.log("interact");
      // if steepness is high enough, add 'sliding' direction to input vector.
      // ---
      // Attempt #1:

      //var angle = intersections[0].face.normal.angleTo(velocity);
      //var reflection = velocity.

      // -> Bouncy, raycaster fails
      groundLevel = intersections[0].point.y;
      groundDistance = intersections[0].distance - rayOffset;
      if (groundDistance < 1) {
        onGround = true
        var n = intersections[0].face.normal;

        var arr = new THREE.ArrowHelper(n, intersections[0].point, 10, 0x00ff00);
        scene.add(arr);
        // FIXME FIXME FIXME
        // The reflection isn't working properly because the normals are wrong
        // for whatever reason.
        // Probably because we don't calculcate them properly in terrain.js
        // ----
        // var vns = intersections[0].face.vertexNormals;
        // console.log("normal", intersections[0].face.normal);
        // console.log("vns", vns);

        // var n = new THREE.Vector3().crossVectors(vns[0], vns[1]).cross(vns[2]);

        var reflection = new THREE.Vector3().copy(yawObject.position);
        reflection.reflect(n).multiplyScalar(0.1);
        velocity.add(reflection);
        console.log("normal", n);
        console.log("reflection", reflection);

        // var reflection = yawObject.position.reflect(n).multiplyScalar(1);
        // var reflection = .position.reflect(n).multiplyScalar(1);
        // velocity.add(reflection.clampScalar(0, 10));
        // yawObject.translateX(reflection.x * delta)
        // yawObject.translateY(reflection.y * delta)
        // yawObject.translateZ(reflection.z * delta)
      }
      // console.log("groundDistance", groundDistance);
      // TODO: if distance < x, set onGround = true
    }

	  velocity.x -= velocity.x * 10.0 * delta;
		velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 1.0 * delta; // 100.0 = mass

    /*
    if (onGround) {
      velocity.y = Math.max(0, velocity.y);
    }*/

    if (onGround || controls.boost) {
      velocity.z -= direction.z * 40.0 * delta;
      velocity.x -= direction.x * 40.0 * delta;
      velocity.y += (direction.y * 20.0); // * delta;
    }
    velocity.y += Number(controls.boost);
    velocity.z -= Number(controls.boost);

    yawObject.translateX(velocity.x * delta);
    yawObject.translateY(velocity.y * delta);
    yawObject.translateZ(velocity.z * delta);
    // console.log("groundLevel: ", groundLevel);
    // console.log("yawObject.position.y: ", yawObject.position.y);
    if (yawObject.position.y < groundLevel) {
      yawObject.position.y = groundLevel;
    }
    // yawObject.position.y = Math.max(yawObject.position.y, groundLevel);
    // axis.position.set(camera.x, camera.y, camera.z + 2);
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
