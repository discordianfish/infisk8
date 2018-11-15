import {
  Object3D,
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  Material,
  MeshLambertMaterial,
} from 'three';

import OpenSimplexNoise from 'open-simplex-noise';

export default class Terrain {
  detailFactor: number
  heightFactor: number
  noiseGen: OpenSimplexNoise
  mesh: Mesh

  constructor(width: number, height: number, widthSegments: number, heightSegments: number) {
    this.noiseGen = new OpenSimplexNoise(Date.now());
    this.detailFactor = 0.02;
    this.heightFactor = 50;

    var geometry = this.newGeometry(width, height, widthSegments, heightSegments)
    var material = this.newMaterial()
    this.mesh = new Mesh(geometry, material);
  }

  getHeight(x: number, y: number): number {
    return (this.noiseGen.noise2D(x * this.detailFactor, y * this.detailFactor) + 1) * 50;
  }

  newMaterial(): Material {
    return new MeshLambertMaterial({
      color: 0x00ff00,
      wireframe: true,
    })
  }

  newGeometry(width: number, height: number, widthSegments: number, heightSegments: number): BufferGeometry {
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

        const z = this.getHeight(x, y);
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

    let geo = new BufferGeometry()
	  geo.setIndex( indices );
	  geo.addAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
    geo.addAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
    geo.addAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );
    // geo.normalizeNormals();
    geo.computeVertexNormals();
    return geo;
  }
}
