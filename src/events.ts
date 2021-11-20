import RemotePlayer from './player/remoteplayer.js';
export class Kill {
  victim: RemotePlayer
  killer: RemotePlayer
  constructor(killer: RemotePlayer, victim: RemotePlayer) {
    this.victim = victim;
    this.killer = killer;
  }

  toString(): string {
    return(this.victim.name + " killed by " + this.killer.name);
  }

  serialize(): string {
    return(JSON.stringify({
      "type": "Kill",
      "victim": this.victim.name,
      "killer": this.killer.name,
    }))
  }
}
