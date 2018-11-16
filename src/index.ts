import Game from './game';

// TBH, I have no idea what I'm doing here. Needed for node upgrade. Probably
// node env during build doesn't provide the pointer lock API.
declare global {
    interface Document {
        pointerLockElement?: Element;
    }
    interface HTMLElement {
        requestPointerLock?: any;
    }
}

const debug = new URL(window.location.href).searchParams.get('debug') == '1';

let game = new Game(window, document, debug)
game.update()
