import "./styles/app.css";
import Board from "./components/Board";
import { Player } from "./utils/player";
import { useState } from "react";

function App() {
  // Create single instance of player classes (i.e. don't remake on re-renders)
  const [p1] = useState(() => new Player());
  const [p2] = useState(() => new Player());

  return (
    <>
      <header>
        <h1>Battleship</h1>
      </header>
      <section className="boards-container">
        <Board boardInstance={p1.gameboard} />
        <Board boardInstance={p2.gameboard} />
      </section>
    </>
  );
}

export default App;
