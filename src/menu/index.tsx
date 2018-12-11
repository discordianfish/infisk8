import preact from 'preact';
import Network from '../network';
import Game from '../game';
import Pool from '../network/pool';

const styles = {
  'menu-wrapper': {
     position: 'fixed',
     'z-index': '100',
     'background-color': 'rgba(0, 0, 0, 0.8)',
     width: '100%',
     height: '100%',
  },
  'menu': {
    color: '#F0F',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '30em',
    height: '30em',
    margin: '-15em 0 0 -15em',
  }
}

interface Props {
  net: Network
  game: Game
}

interface State {
  pools: Pool[]
  open: boolean
}

export default class Menu extends preact.Component<Props,State> {
  pools: Pool[]
  net: Network
  game: Game

  name: string
  constructor(props: Props) {
    super(props)
    this.net = props.net;
    this.game = props.game;
    this.state = { pools: [], open: true };
    props.net.pools().then((pools) => {
      this.setState({pools: pools});
    })

    document.addEventListener('pointerlockchange', (e) => this.pointerlockchange(e), false);
    document.addEventListener('pointerlockerror', (e) => this.pointerlockerror(e), false);
  }

  join(pool) {
    this.net.join(this.name, pool)
    this.close();
  }

  close() {
    document.body.requestPointerLock();
    this.setState({open: false });
  }

  pointerlockerror(event: Event) {
    console.log("pointerlockerror", event);
  }

  pointerlockchange(event: Event) {
    console.log(event);
  }

  onNameInput(event: Event) {
    console.log(event.target);
  }

  render(props, state) {
    if (!state.open) { return }
    let serverList = state.pools.map(p => {
      return <tr>
        <td>{p.name}</td>
        <td><button onClick={() => this.join(p)}>Join</button></td>
      </tr>;
    });
    console.log(serverList);

    return <div style={styles['menu-wrapper']}>
      <div style={styles.menu}>
        <h2>Join Game</h2>
        <p>
        <label for="name" style="display: block">Name:</label>
        <input type="text" name="name" class="name" onInput={e => this.onNameInput(e)} placeholder="Enter your name" required />
        </p>
        <table>
          <tr><th>Name</th><th>Join</th></tr>
          {serverList}
        </table>
      </div>
    </div>;
  }
}
