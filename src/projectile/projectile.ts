import {
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Quaternion,
  Raycaster,
  SphereGeometry,
  Vector3,
} from 'three';

export default class Projectile {
  object: Object3D
  speed: number
  raycaster: Raycaster
  constructor(position: Vector3, rotation: Quaternion) {
    this.speed = 80;

    var geometry = new SphereGeometry(0.3, 32, 32);
    geometry.applyMatrix(new Matrix4().makeScale(1, 0.1, 1));
    var material = new MeshBasicMaterial( {color: 0x00ffff} );
    this.object = new Mesh( geometry, material );
    this.object.position.copy(position);
    this.object.quaternion.copy(rotation);

    this.raycaster = new Raycaster();
  }

  // move projectile in rotation direction
  update(delta: number) {
    this.object.translateZ(-this.speed * delta);
  }
}
