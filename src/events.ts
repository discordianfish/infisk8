import Player from './player/player';
export class Kill {
  victim: Player
  killer: Player
  constructor(killer: Player, victim: Player) {
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
