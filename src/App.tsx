import "./styles/app.css";
import Board from "./components/Board";
import { Player } from "./utils/player";
import { useState } from "react";

function App() {
  // Create single instance of player classes (i.e. don't remake on re-renders)
  const [p1] = useState(() => new Player());
  const [p2] = useState(() => new Player());

  function handleGameOver(player: "Player 1" | "Player 2") {
    if (player === "Player 1") {
      console.log("Player 1 loses!");
    } else if (player === "Player 2") {
      console.log("Player 2 loses!");
    }
  }

  return (
    <>
      <header>
        <h1>Battleship</h1>
      </header>
      <section className="boards-container">
        <Board
          player={"Player 1"}
          boardInstance={p1.gameboard}
          handleAllSunk={handleGameOver}
        />
        <Board
          player={"Player 2"}
          boardInstance={p2.gameboard}
          handleAllSunk={handleGameOver}
        />
      </section>
    </>
  );
}

export default App;
