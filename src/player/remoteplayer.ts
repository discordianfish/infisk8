import {
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  DoubleSide,
  Vector2,
} from 'three';

import Game from '../game';
import Player from './player';
import Model from './model';

export default class RemotePlayer extends Player {
  name: string

  constructor(game: Game, name: string) {
    super(game, name);
    this.object = Model()
    game.scene.add(this.object)
  }
}
