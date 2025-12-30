import "./styles/app.css";
import Board from "./components/Board";
import { Player } from "./utils/player";
import { Computer } from "./utils/computer";
import { useEffect, useState } from "react";
import type { PlayerType } from "./models";
import { PlayerContext } from "./components/PlayerContext";

function App() {
  // Create single instance of player classes (i.e. don't remake on re-renders)
  const [player] = useState(() => new Player());
  const [computer] = useState(() => new Computer());

  const [currentPlayer, setCurrentPlayer] = useState<PlayerType>("None");
  const [gameOver, setGameOver] = useState(true);
  const [winner, setWinner] = useState<PlayerType>("None");

  const [turnCount, setTurnCount] = useState(0);

  function handleGameOver(loser: PlayerType) {
    if (loser === "Player") {
      console.log("Player loses!");
      setWinner("Computer");
    } else if (loser === "Computer") {
      console.log("Computer loses!");
      setWinner("Player");
    }

    setCurrentPlayer("None");
    setGameOver(true);
  }

  function init() {
    console.log("Starting game");

    player.gameboard.clear();
    computer.gameboard.clear();
    player.populate();
    computer.populate();

    const playerTypes: PlayerType[] = ["Player", "Computer"];
    const startingPlayer =
      playerTypes[Math.floor(Math.random() * playerTypes.length)];

    setGameOver(false);
    setWinner("None");
    setTurnCount(0);
    setCurrentPlayer(startingPlayer);
  }

  useEffect(() => {
    if (currentPlayer === "Computer" && !gameOver) {
      const timer = setTimeout(() => {
        const cellToAttack = computer.chooseAttack();
        console.log(
          `Computer attacking (${cellToAttack.x}, ${cellToAttack.y})`
        );
        player.gameboard.receiveAttack(cellToAttack);

        setTurnCount((prev) => prev + 1);

        if (player.gameboard.allShipsSunk()) {
          handleGameOver("Player");
        } else {
          setCurrentPlayer("Player");
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameOver, player, computer]);

  return (
    <>
      <header>
        <h1>Battleship</h1>
        <button className="start" disabled={!gameOver} onClick={() => init()}>
          {gameOver ? "Start Game" : `Turn : ${turnCount}`}
        </button>
        {(gameOver && winner !== "None" ? (<h3>The {winner} wins!</h3>) : null)}
      </header>
      <section className="boards-container">
        <PlayerContext.Provider value={{ currentPlayer, setCurrentPlayer }}>
          <Board
            player={gameOver ? "None" : "Player"}
            boardInstance={player.gameboard}
            handleAllSunk={handleGameOver}
          />
          <Board
            player={gameOver ? "None" : "Computer"}
            boardInstance={computer.gameboard}
            handleAllSunk={handleGameOver}
          />
        </PlayerContext.Provider>
      </section>
    </>
  );
}

export default App;
