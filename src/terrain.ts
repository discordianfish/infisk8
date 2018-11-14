import * as THREE from 'three'

import OpenSimplexNoise from 'open-simplex-noise';
const noiseGen = new OpenSimplexNoise(Date.now());

export function newTerrain(width, height, widthSegments, heightSegments) {
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

			const detailFactor = 0.02;
      const z = (noiseGen.noise2D(x * detailFactor, y * detailFactor) + 1) * 50;
			vertices.push( x, -y, z );

      normals.push( 0, -1,  0 );

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
  // geo.normalizeNormals();
  geo.computeVertexNormals();
	return geo;
}
