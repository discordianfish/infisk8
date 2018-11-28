import Game from './game';
import Network from './network';
import nameGenerator from './utils';

export default class Lobby {
  document: Document
  menu: HTMLElement
  nameField: HTMLInputElement
  game: Game
  net: Network

  open: boolean

  constructor(document: Document, menu: HTMLElement, game: Game) {
    this.document = document;
    this.menu = menu;
    this.game = game;
    this.net = new Network(this);
    if (!('pointerLockElement' in document)) {
      menu.innerHTML = 'Point Lock API not support :('
      return
    }

    document.addEventListener('pointerlockchange', (e) => this.pointerlockchange(e), false);
    document.addEventListener('pointerlockerror', (e) => this.pointerlockerror(e), false);

    this.nameField = <HTMLInputElement>this.menu.getElementsByClassName('name')[0];
    if (this.nameField.value == '') {
      this.nameField.value = nameGenerator()
    }

    let sle = this.menu.getElementsByClassName('session-list')[0];
    this.generateServerList(sle)

    let lb = this.menu.getElementsByClassName('close')[0];
    lb.addEventListener('click', (event: Event) => {
      this.lockPointer();
    }, false)

  }

  generateServerList(el: Element) {
    this.net.pools()
    .then((pools) => {
      console.log(pools);
      pools.forEach((p) => {
        let button = this.document.createElement('button')
        button.appendChild(this.document.createTextNode(p.name));
        button.onclick = () => this.join(p);

        let li = this.document.createElement('li')
        li.appendChild(button)
        el.appendChild(li)
      })
    })
  }

  join(pool) {
    this.game.name = this.nameField.value;
    this.game.hud.status = this.game.name + "@" + pool.name;
    this.net.join(pool)
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
