import Lobby from './lobby';
import {
  Vector3,
} from 'three';

export default class Network {
  lobby: Lobby
  pc: RTCPeerConnection
  dc: RTCDataChannel
  apiURL: string

  constructor(lobby: Lobby) {
    this.lobby = lobby;
    this.pc = new RTCPeerConnection({
      iceServers: [{
        urls: "stun:stun.l.google.com:19302"
      }]
    })
    this.apiURL = "https://infisk8.5pi.de";
    let dc = this.pc.createDataChannel('default', {
      ordered: false,
      maxRetransmits: 0,
    });
    dc.onclose = () => console.log('dc has closed')
    dc.onopen = () => this.onopen();
    dc.onmessage = e => this.lobby.game.onServerMessage(e.data);
    this.dc = dc;

    this.pc.oniceconnectionstatechange = () => console.log('state change', this.pc.iceConnectionState)
    this.pc.onicecandidate = event => {
      if (event.candidate === null) {
        console.log("Got localDescription", this.pc.localDescription)
      }
    }
    this.pc.onnegotiationneeded = e =>
      this.pc.createOffer().then(d => this.pc.setLocalDescription(d));
  }

  onopen(): void {
    console.log('dc has opened');
    this.lobby.game.net = this;
    this.lobby.game.start();
  }

  join(pool) {
    this.newSession(this.pc.localDescription, pool)
    .then((sdp) => {
      this.pc.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: sdp,
      }))
    });
  }

  // Called in main loop to send position to peer
  updateServer(data) {
    // console.log("sending:", data)
    this.dc.send(data);
  }

  newSession(sdp, pool) {
    return this.fetch('pool/' + pool.name + '/join', {
      method: "POST",
      body: btoa(sdp.sdp),
    })
    .then((json) => {
      return json.sdp
    });
  }

  pools() {
    return this.fetch('pools').
      then((json) => { return(json["pools"] ) });
  }

  fetch(path: string, opts?: Object) {
    let url = this.apiURL + '/' + path;
    return fetch(url, opts)
    .then((resp) => {
      if (!resp.ok) {
        throw new Error("Couldn't request " + url)
      }
      return resp.json();
    });
  }
}
