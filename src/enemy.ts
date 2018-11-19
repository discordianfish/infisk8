import {
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  DoubleSide,
  Vector2,
} from 'three';

import Game from './game';

const lathePoints = [
  new Vector2(0, 2.0),
  new Vector2(0.1, 2.0),
  new Vector2(0.2, 1.9),
  new Vector2(0.2, 1.7),
  new Vector2(0.1, 1.5),
  new Vector2(0.1, 1.4),
  new Vector2(0.3, 1.3),
  new Vector2(0.3, 1.2),
  new Vector2(0.1, 1.2),
  new Vector2(0.1, 1.1),
  new Vector2(0.3, 1.1),
  new Vector2(0.1, 0.2),
  new Vector2(0.2, 0.05),
  new Vector2(0, 0),
];

export default class Enemy {
  name: string
  object: Object3D

  constructor(game: Game, name: string) {
    this.name = name
    var geometry = new LatheGeometry(lathePoints);
    var material = new MeshPhysicalMaterial({ color: 0xff0000 });
    material.side = DoubleSide;
    var lathe = new Mesh(geometry, material);
    game.scene.add(lathe)
    this.object = lathe
  }
}
