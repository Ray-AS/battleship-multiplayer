import "./styles/app.css";
import Board from "./components/Board";
import { Player } from "./utils/player";
import { Computer } from "./utils/computer";
import { useState } from "react";
import type { PlayerType } from "./models";
import { PlayerContext } from "./components/PlayerContext";

function App() {
  // Create single instance of player classes (i.e. don't remake on re-renders)
  const [player] = useState(() => new Player());
  const [computer] = useState(() => new Computer());

  const [currentPlayer, setCurrentPlayer] = useState<PlayerType>("Player")

  function handleGameOver(player: PlayerType) {
    if (player === "Player") {
      console.log("Player loses!");
    } else if (player === "Computer") {
      console.log("Computer loses!");
    }
  }

  return (
    <>
      <header>
        <h1>Battleship</h1>
      </header>
      <section className="boards-container">
        <PlayerContext.Provider value={{currentPlayer, setCurrentPlayer}}>
          <Board
            player={"Player"}
            boardInstance={player.gameboard}
            handleAllSunk={handleGameOver}
          />
          <Board
            player={"Computer"}
            boardInstance={computer.gameboard}
            handleAllSunk={handleGameOver}
          />
        </PlayerContext.Provider>
      </section>
    </>
  );
}

export default App;
