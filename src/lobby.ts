import Game from './game';
import Network from './network';

export default class Lobby {
  document: Document
  menu: HTMLElement
  game: Game
  net: Network

  open: boolean

  constructor(document: Document, menu: HTMLElement, game: Game) {
    this.document = document;
    this.menu = menu;
    this.game = game;
    if (!('pointerLockElement' in document)) {
      menu.innerHTML = 'Point Lock API not support :('
      return
    }

    document.addEventListener('pointerlockchange', (e) => this.pointerlockchange(e), false);
    document.addEventListener('pointerlockerror', (e) => this.pointerlockerror(e), false);

    let ib = this.menu.getElementsByClassName('initiate')[0];
    ib.addEventListener('click', (event: Event) => {
      this.initiate()
    }, false)

    let jb = this.menu.getElementsByClassName('join')[0];
    jb.addEventListener('click', (event: Event) => {
      let e = <HTMLTextAreaElement> this.menu.getElementsByClassName('offer')[0];
      this.join(e.value);
    }, false)

    let ab = this.menu.getElementsByClassName('accept-answer')[0];
    ab.addEventListener('click', (event: Event) => {
      let e = <HTMLTextAreaElement> this.menu.getElementsByClassName('answer-input')[0];
      this.net.accept(e.value);
    }, false)

    let sb = this.menu.getElementsByClassName('start')[0];
    sb.addEventListener('click', (event: Event) => {
      this.game.net = this.net;
    }, false)

    let lb = this.menu.getElementsByClassName('close')[0];
    lb.addEventListener('click', (event: Event) => {
      this.lockPointer();
    }, false)

  }

  // - A: Initiate generates offer: -> Manually send to B
  // - B: Accept offer, generates answer -> Manually send to A
  // - A: Accepts answer
  initiate() {
    this.net = new Network(this, true);
  }

  join(offer) {
    this.net = new Network(this, false);
    this.net.accept(offer);
  }

  showOffer(data) {
    let e = <HTMLTextAreaElement> this.menu.getElementsByClassName('offer-output')[0];
    e.value = JSON.stringify(data);
  }

  showAnswer(data) {
    let e = <HTMLTextAreaElement> this.menu.getElementsByClassName('answer-output')[0];
    e.value = JSON.stringify(data);
  }

  lockPointer() {
    this.document.body.requestPointerLock = this.document.body.requestPointerLock;
    this.document.body.requestPointerLock()
  }

  pointerlockchange(event: Event) {
    if (this.document.pointerLockElement === this.document.body) {
      console.log("pointer locked, lobby closed, start game");
      this.open = false;
      this.menu.style.display = 'none';
    } else {
      this.open = true;
      this.menu.style.display = 'block';
    }
  }

  pointerlockerror(event: Event) {
    console.log("pointerlockerror", event);
  }
}
