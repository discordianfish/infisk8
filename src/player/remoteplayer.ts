import {
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  DoubleSide,
  Vector2,
} from 'three';

import Game from '../game.js';
import Player from './player.js';
import Model from './model.js';

export default class RemotePlayer extends Player {
  name: string

  constructor(game: Game, name: string) {
    super(game, name);
    this.object = Model()
    game.scene.add(this.object)
  }
}
