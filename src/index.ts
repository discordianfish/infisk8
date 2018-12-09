import eruda from 'eruda';
const eel = document.createElement('div');
document.body.appendChild(eel);

eruda.init({container: eel});
import SceneManager from './scene_manager';
import Game from './game';
import HUD from './hud';
import Lobby from './lobby';
import Controls from './controls';
import Audio from './audio';
import Network from './network';

import Terrain from './terrain/terrain';
import TerrainConfig from './terrain/config';
import { Scene } from 'three';

// TBH, I have no idea what I'm doing here. Needed for node upgrade. Probably
// node env during build doesn't provide the pointer lock API.
declare global {
    interface Document {
        pointerLockElement?: Element;
    }
    interface HTMLElement {
        requestPointerLock?: any;
    }
    interface Window {
      game: Game;
      sm: SceneManager;
    }
}

const net   = new Network();
const lobby = new Lobby(document, document.getElementById('menu-wrapper'), net);
const hud   = new HUD(window, document);

const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const sm = new SceneManager(canvas, lobby, hud);
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
const game = new Game(sm.scene, sm, controls, hud, audio, net, lobby, DEBUG);
sm.subjects.push(game);
window.game = game;

document.addEventListener('mousemove', e => sm.onMouseMove(e) );
document.addEventListener('pointerlockerror', e => { alert(e) });

render();
