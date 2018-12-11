import * as eruda from 'eruda';
const eel = document.createElement('div');
document.body.appendChild(eel);

eruda.init({container: eel});
import SceneManager from './scene_manager';
import Game from './game';
import HUD from './hud';
import Controls from './controls';
import Audio from './audio';
import Menu from './menu';
import Network from './network';
import Terrain from './terrain/terrain';
import TerrainConfig from './terrain/config';
import { Scene } from 'three';

import preact from 'preact';

declare global {
    interface Document {
        pointerLockElement?: Element;
    }
    interface HTMLElement {
        requestPointerLock?: any;
    }
    interface Window {
      React: any;
      game: Game;
      sm: SceneManager;
    }
}
const net   = new Network();
const hud   = new HUD(window, document);

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const sm = new SceneManager(canvas, hud);
window.sm = sm;
sm.subjects.push(hud);

function render() {
  requestAnimationFrame(render);
  sm.update();
}

function resizeCanvas() {
  canvas.style.width = '100%';
  canvas.style.height= '100%';

        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

  sm.onWindowResize()
}
window.onresize = resizeCanvas
resizeCanvas();

const url = new URL(window.location.href);
const DEBUG = url.searchParams.get('debug') == '1';
const SEED = parseFloat(url.searchParams.get('seed')) || 23;
const audio = new Audio(window);
const controls = new Controls(document);
const game = new Game(sm.scene, sm, controls, hud, audio, net,  DEBUG);
sm.subjects.push(game);
window.game = game;

document.addEventListener('mousemove', e => sm.onMouseMove(e) );

preact.render(<Menu net={net} game={game}/>, document.body);
render()
