import {
  Vector3
} from 'three';

class Playable {
  context: AudioContext
  sourceNode: AudioScheduledSourceNode
  gain: GainNode

  constructor(context: AudioContext, sourceNode: AudioScheduledSourceNode) {
    this.context = context;
    this.sourceNode = sourceNode;
    this.gain = context.createGain()
    this.sourceNode.connect(this.gain);
    this.gain.connect(this.context.destination);
  }
  tune(start: number, stop: number): void {}
  play(start: number, stop: number): void {
    this.tune(start, stop)
    this.sourceNode.start(start)
    this.sourceNode.stop(stop)
  }
}

class Boom extends Playable {
  freq: number
  osc: OscillatorNode
  constructor(context: AudioContext) {
    let osc = context.createOscillator();
    super(context, osc)
    this.freq = 250
    this.osc = osc
  }
  tune(start: number, stop: number) {
    this.osc.frequency.setValueAtTime(this.freq, start);
    this.gain.gain.setValueAtTime(1, start);

	  this.osc.frequency.exponentialRampToValueAtTime(0.01, stop);
    this.gain.gain.exponentialRampToValueAtTime(0.01, stop);
  }
}

class Noise {
  context: AudioContext
  source: AudioScheduledSourceNode
  gain: GainNode
  constructor(context: AudioContext) {
    this.context = context;
    let source = context.createBufferSource()
    source.buffer = this.genBuffer(2)
    source.loop = true
    let filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    source.connect(filter);

    let gain = context.createGain();
    filter.connect(gain);
    gain.connect(context.destination);

    this.gain = gain
    this.source = source
  }

  genBuffer(duration: number) {
    const bufferSize = duration * this.context.sampleRate
    let buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    let data = buffer.getChannelData(0);
    let last = 0.0;
    for (var i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}

export default class Audio {
  window: Window
  context: AudioContext
  gain: GainNode
  boostAudio: Noise

  constructor(window: Window) {
    this.window = window;
    this.context = new AudioContext;
    this.boostAudio = new Noise(this.context)
    this.boostAudio.source.start(0);
    this.boostAudio.gain.gain.value = 0;
  }

  fire() {
    let now = this.context.currentTime;
    let kl = new Boom(this.context)
    let kh = new Boom(this.context)
    kh.freq = 550
    kl.play(now, now+1);
    kh.play(now+0.1, now+1.1);
  }

  explosion(position: Vector3) {
    let start = this.context.currentTime;
    let k1 = new Boom(this.context)
    k1.freq = 150
    k1.play(start, start+2);
    start += 0.1

    let k2 = new Boom(this.context)
    k2.freq = 100
    k2.play(start, start+3);
    start += 0.1

    let k3 = new Boom(this.context)
    k3.freq = 50
    k3.play(start, start+4);
  }

  die(position: Vector3) {
    let start = this.context.currentTime;
    let k = new Boom(this.context)
    k.freq = 660
    k.play(start, start+1);
  }

  boost(boost: boolean, position: Vector3) {
    if (boost) {
      this.boostAudio.gain.gain.value = 1
    } else {
      this.boostAudio.gain.gain.value = 0
    }
  }

  ground(position: Vector3) {
    let start = this.context.currentTime;
    let b = new Boom(this.context)
    b.freq = 2000
    b.play(start, start+0.2);
  }
}
