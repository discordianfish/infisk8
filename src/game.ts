import {
  Object3D,
  BufferGeometry,
  Intersection,
  Camera,
  Float32BufferAttribute,
  DirectionalLight,
  Mesh,
  Material,
  MeshLambertMaterial,
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  AxesHelper,
  Vector3,
  Raycaster,
  Matrix3,
  ArrowHelper,
  Renderer,
  Quaternion,
} from 'three';

import Player from './player/player';
import {lockPointer} from './lock_pointer';
import Terrain from './terrain/terrain';
import Controls from './controls';
import HUD from './hud';
import Enemy from './enemy';

const vectorDown = new Vector3(0, -1, 0);

export default class Game {
  window: Window
  player: Player
  enemies: Array<Enemy>
  controls: Controls
  terrain: Terrain
  scene: Scene
  renderer: WebGLRenderer
  camera: PerspectiveCamera
  hud: HUD
  terrainSize: number

  raycaster: Raycaster
  velocity: Vector3 // player velocity

  prevTime: number
  debug: boolean
  constructor(window: Window, document: Document, debug: boolean) {
    this.window = window
    this.debug = debug
    this.enemies = []
    this.scene = new Scene()
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000)
    let renderer = new WebGLRenderer()
    renderer.autoClear = false;
    renderer.setClearColor(0xBDFFFD);
    this.renderer = renderer;

    this.controls = new Controls(document, document.getElementById('blocker'), document.getElementById('instructions'))

    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(this.renderer.domElement)

    let light = new DirectionalLight(0xffffff, 1.0)
    light.position.set(100, 100, 100)
    this.scene.add(light)

    let light2 = new DirectionalLight(0xffffff, 1.0)
    light2.position.set(-100, 100, -100)
    this.scene.add(light2)

    this.hud = new HUD(window, document);

    this.raycaster = new Raycaster(); // new Vector3(), new Vector3( 0, -1, 0 ), 0, 10 );

    this.terrainSize = 1000;
    this.terrain = new Terrain(this.terrainSize, this.terrainSize, this.terrainSize/5, this.terrainSize/5)
    this.terrain.mesh.rotation.x = -Math.PI/2; // FIXME: Generate geometry in correct orientation right away..
    this.scene.add(this.terrain.mesh)
    this.render()

    this.player = new Player(document, this);
    this.scene.add(this.player.object)
    this.player.addEventListeners();
    this.addEventListeners();

    lockPointer(document.getElementById('blocker'), document.getElementById('instructions'), this.player)

    this.player.object.position.y = this.findGround(this.player.object.position, 1000) + 10

    for (let i = 0; i <= 100; i++) {
      this.spawnEnemy("foo-"+i)
    }
    this.velocity = new Vector3();
    this.prevTime = performance.now();
  }

  spawnEnemy(name: string): void {
    let enemy = new Enemy(this, name);
    enemy.object.position.x = Math.random() * this.terrainSize;
    enemy.object.position.z = Math.random() * this.terrainSize;
    enemy.object.position.y = this.findGround(enemy.object.position, 1000);
    this.enemies.push(enemy);
  }

  // returns true if hit is registered.
  registerHit(object: Object3D): boolean {
    let position = object.getWorldPosition(new Vector3())
    let direction = object.getWorldDirection(new Vector3()).negate()
    let intersections = this.raycast(position, direction, [this.terrain.mesh]);

    if (intersections.length == 0) {
      return false
    }
    return intersections[0].distance < 3;
  }

  raycast(position: Vector3, direction: Vector3, objects: Array<Mesh>, debug?: boolean) {
    let dir = direction.clone().normalize();
    this.raycaster.set(position, dir);
    if (debug) {
      let pos = position.clone()
      pos.y -= 100
      this.scene.add(new ArrowHelper(direction, pos, 10, 0xffff00));
    }
    return this.raycaster.intersectObjects(objects);
  }

  findGround(position: Vector3, defaultGround: number): number {
    let origin = new Vector3().copy(position);
    origin.y = 10000;
    var intersections = this.raycast(origin, vectorDown, [this.terrain.mesh]);
    if (intersections.length == 0) {
      console.log("Couldn't find ground, spawning at default level");
      return defaultGround;
    } else {
      return intersections[0].point.y;
    }
  }

  groundCheck(): number {
    var rayOffset = 100;
    var rayOrigin = new Vector3().copy(this.player.object.position)
    rayOrigin.y += rayOffset;
    var groundLevel;
    let intersections = this.raycast(rayOrigin, vectorDown, [this.terrain.mesh])
    if (intersections.length > 0) {
      groundLevel = intersections[0].point.y;

      var groundDistance = intersections[0].distance - rayOffset;
      if (groundDistance < 1) {
        var n = intersections[0].face.normal;

        // convert local normal to world position.. I think..?
        var normalMatrix = new Matrix3().getNormalMatrix( intersections[0].object.matrixWorld );
        var normal = n.clone().applyMatrix3(normalMatrix).normalize();

        var reflection = new Vector3().copy(this.velocity); // this.player.object.position);
        // reflection.reflect(normal);
        reflection.sub(normal.multiplyScalar(2 * reflection.dot(normal)));
        if (this.debug) {
          this.scene.add(new ArrowHelper(this.velocity, intersections[0].point, this.velocity.length() * 10, 0x0000ff));
          this.scene.add(new ArrowHelper(reflection, intersections[0].point, reflection.length() * 10, 0xff0000));
        }
        this.velocity = reflection;
      }
    }
    return groundLevel;
  }

  update(): void {
    requestAnimationFrame(() => this.update());
    if (!this.player.isLocked) {
      return
    }

    var time = performance.now();
    var delta = ( time - this.prevTime ) / 1000;
    this.prevTime = time;

    this.player.update(delta)

    var groundLevel = this.groundCheck();
    var groundDistance = this.player.object.position.y - groundLevel;
    var onGround = groundDistance < 1;

    var direction = this.controls.input();

    var speed = 20
    var controlVelocity = new Vector3();
    if (onGround || this.controls.boost) {
      controlVelocity.z -= direction.z * speed * delta;
      controlVelocity.x -= direction.x * speed * delta;
      controlVelocity.y += (direction.y * speed); // * delta;
    }
    controlVelocity.y += Number(this.controls.boost) * speed * delta;
    controlVelocity.z -= Number(this.controls.boost) * speed * delta;

    // We don't translate this.player.object directly so we have one motion vector and
    // we can include the momentum in the reflection on terrain collision.
    controlVelocity.applyQuaternion(this.player.object.quaternion);
    this.velocity.add(controlVelocity);

    if (this.player.object.position.y < groundLevel) {
      this.player.object.position.y = groundLevel;
      this.velocity.z += this.velocity.y;
      this.velocity.y = 0;
    }

    // velocity.x -= velocity.x * 1.0 * delta;
    // velocity.z -= velocity.z * 1.0 * delta;
    this.velocity.y -= 9.8 * delta;
    this.player.object.position.add(this.velocity.clone().multiplyScalar(delta));


    if (this.controls.fire) {
      this.player.fire()
    }
    this.render()
  }

  render(): void {
    this.renderer.clear(true, true, true);
    this.renderer.render(this.scene, this.camera);
    this.renderer.render(this.hud.scene, this.hud.camera);
  }

  addEventListeners() {
    this.window.addEventListener('resize', () => this.onWindowResize(), false);
  }

  onWindowResize(){
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
  }
}
