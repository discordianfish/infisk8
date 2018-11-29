import Lobby from './lobby';
import {
  Vector3,
} from 'three';

export default class Network {
  lobby: Lobby
  pc: RTCPeerConnection
  stateDC: RTCDataChannel
  stateOpen: boolean
  eventDC: RTCDataChannel
  eventOpen: boolean
  apiURL: string

  constructor(lobby: Lobby) {
    this.lobby = lobby;
    this.lobby.game.net = this; // FIXME: We should probably inverse the dependency.
    this.pc = new RTCPeerConnection({
      iceServers: [{
        urls: "stun:stun.l.google.com:19302"
      }]
    })
    this.apiURL = "https://infisk8.5pi.de";

    // Unreliable datachannel to broadcast state
    let stateDC = this.pc.createDataChannel('state', {
      ordered: false,
      maxRetransmits: 0,
    });
    stateDC.onclose = () => console.log('stateDC has closed')
    stateDC.onopen = () => this.onopenState();
    stateDC.onmessage = e => this.lobby.game.onServerStateMessage(e.data);
    this.stateDC = stateDC;

    // Reliable datachannel to broadcast events
    let eventDC = this.pc.createDataChannel('events');

    eventDC.onclose = () => console.log('eventDC has closed')
    eventDC.onopen = () => this.onopenEvent();
    eventDC.onmessage = e => this.lobby.game.onServerEventMessage(e.data);
    this.eventDC = eventDC;


    this.pc.oniceconnectionstatechange = () => console.log('state change', this.pc.iceConnectionState)
    this.pc.onicecandidate = event => {
      if (event.candidate === null) {
        console.log("Got localDescription", this.pc.localDescription)
      }
    }
    this.pc.onnegotiationneeded = e =>
      this.pc.createOffer().then(d => this.pc.setLocalDescription(d));
  }

  onopenState(): void {
    this.stateOpen = true;
    console.log('stateDC has opened');
    if (this.eventOpen) {
      this.lobby.game.start();
    }
  }

  onopenEvent(): void {
    this.eventOpen = true;
    console.log('eventDC has opened');
    if (this.eventOpen) {
      this.lobby.game.start();
    }
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
  updateServerState(data) {
    // console.log("sending:", data)
    this.stateDC.send(data);
  }

  sendEvent(data) {
    this.eventDC.send(data)
  }

  newSession(sdp, pool) {
    return this.fetch('pool/' + pool.name + '/join/' + this.lobby.game.player.name, {
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
