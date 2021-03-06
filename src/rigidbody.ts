import {
  Object3D,
  Vector3,
  Matrix3,
  ArrowHelper,
} from 'three';
import Game from './game';

const vectorDown = new Vector3(0, -1, 0);

export default class Rigidbody {
  game: Game
  object: Object3D
  velocity: Vector3
  onGround: boolean
  dragX: number
  dragZ: number
  bounceFactor: number
  debug: boolean
  impactMagnitude: number

  constructor(game: Game, object: Object3D) {
    this.game = game;
    this.object = object;
    this.velocity = new Vector3();
    this.dragX = 0;
    this.dragZ = 0;
    this.bounceFactor = 1; // 2 = 100% bouncy
  }

  update(delta: number): void {
    this.impactMagnitude = 0;
    let groundLevel = this.groundCheck();
    let groundDistance = this.object.position.y - groundLevel;
    this.onGround = groundDistance < 1;
    this.object.position.y = Math.max(this.object.position.y, groundLevel);

    this.velocity.x -= this.velocity.x * this.dragX * delta;
    this.velocity.z -= this.velocity.z * this.dragZ * delta;
    if (!this.onGround) {
      this.velocity.y -= 9.8 * delta;
    }
    this.object.position.add(this.velocity.clone().multiplyScalar(delta));
    // console.log("Post in rb", this.object.position);
  }

  groundCheck(): number {
    var rayOffset = 100;
    var rayOrigin = new Vector3().copy(this.object.position)
    rayOrigin.y += rayOffset;
    var groundLevel = this.game.terrain.getHeight(this.object.position.x, this.object.position.z);
    var groundDistance = this.object.position.y - groundLevel;
    //console.log("@groundcheck groundDistance", groundDistance, "groundLevel", groundLevel, "at", this.object.position)

    if (groundDistance < 1) {
      if (this.onGround) { // not first time we hit the ground, skipping reflection
        return groundLevel;
      }
      console.log("hit ground");
      let intersections = this.game.raycastAll(rayOrigin, vectorDown)
      if (intersections.length == 0) {
        return 0
      }

      var n = intersections[0].face.normal;

      // convert local normal to world position.. I think..?
      var normalMatrix = new Matrix3().getNormalMatrix( intersections[0].object.matrixWorld );
      var normal = n.clone().applyMatrix3(normalMatrix).normalize();

      var reflection = new Vector3().copy(this.velocity);
      reflection.sub(normal.multiplyScalar(this.bounceFactor * reflection.dot(normal)));

      this.impactMagnitude = reflection.clone().sub(this.velocity).length();
      console.log("impact magnitude", this.impactMagnitude);

      if (this.debug) {
        this.game.scene.add(new ArrowHelper(this.velocity, intersections[0].point, this.velocity.length() * 10, 0x0000ff));
        this.game.scene.add(new ArrowHelper(reflection, intersections[0].point, reflection.length() * 10, 0xff0000));
      }
      this.velocity = reflection;
    }
    return groundLevel;
  }
}
