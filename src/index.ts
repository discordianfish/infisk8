// add styles
import './style.css'
// three.js
import * as THREE from 'three'
import OrbitControls from 'orbit-controls-es6';

import OpenSimplexNoise from 'open-simplex-noise';

const noiseGen = new OpenSimplexNoise(Date.now());

// create the scene
let scene = new THREE.Scene()

// create the camera
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

let renderer = new THREE.WebGLRenderer();

const controls = new OrbitControls(camera, renderer.domElement);

// set size
renderer.setSize(window.innerWidth, window.innerHeight)

// add canvas to dom
document.body.appendChild(renderer.domElement)

// add axis to the scene
let axis = new THREE.AxesHelper(10)

scene.add(axis)

// add lights
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

camera.position.x = 5
camera.position.y = 5
camera.position.z = 5

camera.lookAt(scene.position)

function animate(): void {
  requestAnimationFrame(animate)
  controls.update();
  render()
}

function render(): void {
  let timer = 0.002 * Date.now()
  // box.position.y = 0.5 + 0.5 * Math.sin(timer)
  // box.rotation.x += 0.1
  renderer.render(scene, camera)
}

animate()


function newTerrain(width, height, widthSegments, heightSegments) {
	var width_half = width / 2;
	var height_half = height / 2;

	var gridX = Math.floor( widthSegments ) || 1;
	var gridY = Math.floor( heightSegments ) || 1;

	var gridX1 = gridX + 1;
	var gridY1 = gridY + 1;

	var segment_width = width / gridX;
	var segment_height = height / gridY;

	var ix, iy;

	// buffers

	var indices = [];
	var vertices = [];
	var normals = [];
	var uvs = [];

	// generate vertices, normals and uvs

	for ( iy = 0; iy < gridY1; iy ++ ) {

		var y = iy * segment_height - height_half;

		for ( ix = 0; ix < gridX1; ix ++ ) {

			var x = ix * segment_width - width_half;

			const detailFactor = 0.01;
      const z = (noiseGen.noise2D(x * detailFactor, y * detailFactor) + 1) * 100;
			vertices.push( x, - y, z );

			normals.push( 0, 0, 1 );

			uvs.push( ix / gridX );
			uvs.push( 1 - ( iy / gridY ) );

		}

	}

	// indices

	for ( iy = 0; iy < gridY; iy ++ ) {

		for ( ix = 0; ix < gridX; ix ++ ) {

			var a = ix + gridX1 * iy;
			var b = ix + gridX1 * ( iy + 1 );
			var c = ( ix + 1 ) + gridX1 * ( iy + 1 );
			var d = ( ix + 1 ) + gridX1 * iy;

			// faces

			indices.push( a, b, d );
			indices.push( b, c, d );

		}

	}

	// build geometry

  let geo = new THREE.BufferGeometry()
	geo.setIndex( indices );
	geo.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
	geo.addAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
	geo.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );
	return geo;
}


function newTerrainPlane(h, w, hn, wn) {
  let geo = new THREE.PlaneGeometry(h, w, hn, wn)
  const detailFactor = 0.01;
  const heightFactor = 100;

  let i = 0;
  geo.vertices.forEach((v) => {
    const x = (i % hn);
    const y = Math.trunc(i / wn);
    const z = (noiseGen.noise2D(x * detailFactor, y * detailFactor) + 1) * heightFactor;
    console.log("(", x, ", ", y, ") = "+z);
    v.z = z;
    i++;
  })
  geo.verticesNeedUpdate = true;
  geo.normalsNeedUpdate = true;

  // geo.dynamic = true;
  return geo;
}
/*
0000   0000 0000 0000
0123   4567 89.......

|||v   |  v
||v3,0 | v3,1
|v2,0  |v2,1
v1,0   v1,1
0,0    0,1

x = n % wn
y = n

0000
0000
0000
0000


0 = 0
1 = 0
2 = 0
3 = 0

4 = 1 // floor(n / 4)
5 = 1
6 = 1
7 = 1

8 = 2
9 = 2
0 = 2..
*/
