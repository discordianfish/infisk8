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

let game = new Game(window, document)
game.update()
