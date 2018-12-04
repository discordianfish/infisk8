import {
  BufferGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Points,
  PointsMaterial,
  Float32BufferAttribute,
  Quaternion,
  Raycaster,
  SphereGeometry,
  Vector3,
  Vertex,
} from 'three';

import * as THREE from 'three';
import { ParticleSystem, ParticleEmitter } from 'three-gpu-particle-system';
import Game from '../game';

export default class Projectile {
  object: Object3D
  origin: Vector3
  speed: number
  game: Game
  particleSystem: ParticleSystem
  exploded: number
  maxDistance: number

  constructor(game: Game, position: Vector3, rotation: Quaternion) {
    this.game = game;
    this.speed = 80;

    var geometry = new SphereGeometry(0.3, 32, 32);
    geometry.applyMatrix(new Matrix4().makeScale(1, 0.1, 1));
    var material = new MeshBasicMaterial({color: 0x00ffff});

    this.origin = position.clone();
    this.object = new Mesh( geometry, material );
    this.object.position.copy(position);
    this.object.quaternion.copy(rotation);

    let intersections = game.raycastTerrain(
      this.object.getWorldPosition(new Vector3()),
      this.object.getWorldDirection(new Vector3()).negate(),
    );

    if (intersections.length > 0) {
      this.maxDistance = intersections[0].distance
    } else {
      this.maxDistance = 1000
    }
    console.log("max distance for projectile", this.maxDistance)
    this.particleSystem = new ParticleSystem(game.scene, game.sm.camera)
  }

  finish(): void {
    this.game.scene.remove(this.particleSystem);
  }

  // move projectile in rotation direction
  update(delta: number): boolean {
    if (this.exploded != null) {
      if (performance.now() - this.exploded > 4000) {
        this.finish();
        return true;
      }
      this.particleSystem.draw();
      return false
    }
    let distanceTraveled = this.object.position.distanceTo(this.origin);
    if (distanceTraveled > this.maxDistance) {
      this.explode()
      return false
    }
    this.object.translateZ(-this.speed * delta);
    if (this.game.registerHit(this.object)) {
      this.explode()
    }
    return false
  }

  explode(): void {
    this.exploded = performance.now();
    this.game.audio.explosion(this.object.position);
    this.game.scene.remove(this.object);
    this.game.scene.add(this.smokeEmitter(this.object.position, this.object.quaternion));
    this.game.scene.add(this.blastEmitter(this.object.position, this.object.quaternion));
  }

  smokeEmitter(position: Vector3, rotation: Quaternion): ParticleEmitter {
    var emitter = this.particleSystem.createParticleEmitter();
    emitter.setColorRamp([
			1, 1, 1, 0.3,
			1, 1, 1, 0
		]);
    emitter.setParameters({
			numParticles: 30,
			lifeTime: 3,
			startTime: 0,
			startSize: 0.50,
			endSize: 10,
			spinSpeedRange: 10,
      billboard: true
    }, function(index, parameters) {
      let matrix = new Matrix4();
      let angle = Math.random() * 2 * Math.PI;
      matrix.makeRotationY(angle);
      let position = new Vector3(3, 0, 0)
      var len = position.length()
      position.transformDirection(matrix);
      parameters.velocity = [ position.x * len, position.y * len, position.z * len ];
      var acc = new Vector3( - 0.3, 0, - 0.3 ).multiply( position );
      parameters.acceleration = [ acc.x, acc.y, acc.z ];
    });
    emitter.setTranslation(this.object.position.x, this.object.position.y, this.object.position.z);
    return emitter
  }

  blastEmitter(position: Vector3, rotation: Quaternion): ParticleEmitter {
	  var emitter = this.particleSystem.createParticleEmitter();
	  emitter.setState( THREE.AdditiveBlending );
    /*emitter.setColorRamp(
	  	[
	  		1, 1, 1, 1,
	  		1, 1, 1, 0
	  	]
    );*/
	  emitter.setParameters({
	  	numParticles: 80,
	  	lifeTime: 3,
      startTime: 0,
	  	startSize: 0,
      endSize: 1,
      spinSpeedRange: 10,
	  	positionRange: [ 1, 0, 1 ],
      velocityRange: [ 10, 10, 10 ],
      accelerationRange: [ 10, 10, 10 ],
      acceleration: [ 0, 10, 0 ],
      colorMult: [ 0, 1, 1, 1 ],
	  });
    emitter.setTranslation(this.object.position.x, this.object.position.y, this.object.position.z);
    return emitter
  }
}
