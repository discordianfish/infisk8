import {
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  Vector2,
} from 'three';

import Game from '../game';

export default class Player {
  name: string
  game: Game
  object: Object3D
  died: number

  constructor(game: Game, name: string) {
    this.game = game
    this.name = name
  }

  die() {
    this.died  = performance.now()
    this.game.audio.die(this.object.position)
    console.log("Died!")
  }

  // FIXME: Eventually we want to smart/random respawn close to enemies
  spawn() {
    this.object.position.x = 0
    this.object.position.y = 1000
    this.object.position.z = 0
  }

  update(delta: number): void {
    if (this.died != null) {
      this.object.scale.multiplyScalar(delta)
    }
  }
}
