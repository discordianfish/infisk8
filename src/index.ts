// add styles
import './style.css'
// three.js
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/js/controls/OrbitControls';
import {PointerLockControls} from 'three/examples/js/controls/PointerLockControls';
import {lockPointer} from './lock_pointer';
import {newTerrain} from './terrain';


let scene = new THREE.Scene()
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000)

let renderer = new THREE.WebGLRenderer();

// const controls = new OrbitControls(camera, renderer.domElement);
const controls = new PointerLockControls(camera)
scene.add( controls.getObject() );

lockPointer(document.getElementById('blocker'), document.getElementById('instructions'), controls)

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

// create a box and add it to the scene
const size = 1000;
let terrain = new THREE.Mesh(newTerrain(size, size, size/10, size/10), material);
terrain.rotation.x = -Math.PI/2;

scene.add(terrain)

// box.position.x = 0.5
// box.rotation.y = 0.5

/*
camera.position.x = 5
camera.position.y = 5
camera.position.z = 5

camera.lookAt(scene.position)
*/

const clock = new THREE.Clock(true)
function animate(): void {
  requestAnimationFrame(animate)
  // controls.update();
  // controls.update(clock.getDelta());
  render()
}

function render(): void {
  let timer = 0.002 * Date.now()
  // box.position.y = 0.5 + 0.5 * Math.sin(timer)
  // box.rotation.x += 0.1
  renderer.render(scene, camera)
}

animate()
