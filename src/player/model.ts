import {
  DoubleSide,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  Vector2,
} from 'three';

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

export default function Model(): Mesh {
  var geometry = new LatheGeometry(lathePoints);
  var material = new MeshPhysicalMaterial({ color: 0xff0000 });
  material.side = DoubleSide;
  return new Mesh(geometry, material);
}
