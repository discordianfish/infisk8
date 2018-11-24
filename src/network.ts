import * as SimplePeer from 'simple-peer';
import Lobby from './lobby';
import {
  Vector3,
} from 'three';

export default class Network {
  lobby: Lobby
  peer: any // FIXME: Why can't I use SimplePeer here, even though I have @types/simple-peer?
  initiator: boolean
  buffer: DataView

  constructor(lobby: Lobby, initiator: boolean) {
    this.lobby = lobby;
    this.initiator = initiator;

    this.peer = new SimplePeer({initiator: initiator, trickle: false});

    this.peer.on('error', (err) => { console.log('error', err) });

    this.peer.on('signal', (data) => {
      if (initiator) {
        this.lobby.showOffer(data)
      } else {
        this.lobby.showAnswer(data)
      }
    })
    this.peer.on('connect', () => {
      this.lobby.game.net = this;
      this.lobby.game.start();
    })
    this.peer.on('data', (data) => {
      this.lobby.game.handleUpdate(this.peer, data);
    });

    let buffer = new ArrayBuffer(16);
    this.buffer = new DataView(buffer);
  }

  accept(offer) {
    this.peer.signal(offer)
  }

  // Called in main loop to send position to peer
  update(position: Vector3) {
    let buf = new Buffer(3 * (64/8));
    buf.writeFloatBE(position.x, 0);
    buf.writeFloatBE(position.y, (64/8));
    buf.writeFloatBE(position.z, (64/8) * 2);
    this.peer.send(buf);
  }
}
