import {
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  DoubleSide,
  Vector2,
} from 'three';

import Game from './game';
import Rigidbody from './rigidbody';
import Model from './player/model';

export default class Enemy {
  name: string
  game: Game
  object: Mesh
  rigidbody: Rigidbody
  died: number

  constructor(game: Game, name: string) {
    this.name = name
    this.game = game
    this.object = Model()
    game.scene.add(this.object)
    this.rigidbody = new Rigidbody(game, this.object)
  }

  die() {
    this.died  = performance.now()
    this.game.audio.die(this.object.position)
    console.log("Died!")
  }

  update(delta: number): void {
    if (this.died != null) {
      this.object.scale.multiplyScalar(delta)
    }
    this.rigidbody.update(delta);
  }
}
