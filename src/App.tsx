import "./styles/app.css";
import Board from "./components/Board";
import { Player } from "./utils/player";
import { Computer } from "./utils/computer";
import { useEffect, useState } from "react";
import type { PlayerType, GamePhase } from "./models";
import { PlayerContext } from "./components/PlayerContext";

function App() {
  // Create single instance of player/computer classes (i.e. don't remake on re-renders)
  const [player] = useState(() => new Player());
  const [computer] = useState(() => new Computer());

  const [currentPlayer, setCurrentPlayer] = useState<PlayerType>("None");
  const [winner, setWinner] = useState<PlayerType>("None");

  const [phase, setPhase] = useState<GamePhase>("setup");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  function startGame() {
    console.log("Starting game");

    computer.gameboard.clear();
    computer.randomPopulate();

    // Ensure board is populated if player did not populate
    if (player.gameboard.allShipsSunk()) {
      player.randomPopulate();
    }

    const playerTypes: PlayerType[] = ["Player", "Computer"];
    const startingPlayer =
      playerTypes[Math.floor(Math.random() * playerTypes.length)];

    setWinner("None");
    setRefreshTrigger(0);
    setCurrentPlayer(startingPlayer);
    setPhase("playing");
  }

  function randomizePlayerBoard() {
    if (phase !== "setup") return;

    player.gameboard.clear();
    player.randomPopulate();

    setRefreshTrigger((prev) => prev + 1);
  }

  function handleGameOver(loser: PlayerType) {
    if (loser === "Player") {
      console.log("Player loses!");
      setWinner("Computer");
    } else if (loser === "Computer") {
      console.log("Computer loses!");
      setWinner("Player");
    }

    setCurrentPlayer("None");
    setPhase("ended");
  }

  // Handle computer attacks and updates in computer class
  // useEffect to ensure no infinite loops or unexpected behavior
  // TODO: refactor and remove useEffect (i.e. have React hold the board state itself)
  useEffect(() => {
    if (phase === "playing" && currentPlayer === "Computer") {
      // Short delay for computer attacks to make ui updates and gameplay feel smoother
      const timer = setTimeout(() => {
        const cellToAttack = computer.chooseAttackRandom();
        console.log(
          `Computer attacking (${cellToAttack.x}, ${cellToAttack.y})`
        );
        player.gameboard.receiveAttack(cellToAttack);

        setRefreshTrigger((prev) => prev + 1);

        if (player.gameboard.allShipsSunk()) {
          handleGameOver("Player");
        } else {
          setCurrentPlayer("Player");
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentPlayer, phase, player, computer]); // Depends really on currentPlayer; others just to ensure no misbehavior

  console.log(refreshTrigger); // Prevent TypeScript variable not used error

  return (
    <>
      <header>
        <h1>Battleship</h1>
        {phase === "setup" && (
          <div>
            <button onClick={randomizePlayerBoard}>Randomize</button>
            <button onClick={startGame}>Start</button>
          </div>
        )}
        {phase === "playing" && (
          <span>
            {currentPlayer === "Player"
              ? "You are attacking"
              : "Enemy is attacking"}
          </span>
        )}
        {phase === "ended" && (
          <>
            <h3>
              {winner === "Player"
                ? "You defeated the enemy!"
                : "The enemy defeated you!"}
            </h3>
            <button
              onClick={() => {
                player.gameboard.clear();
                computer.gameboard.clear();

                setPhase("setup");
                setWinner("None");
                setCurrentPlayer("None");
                setRefreshTrigger((prev) => prev + 1);
              }}
            >
              Restart
            </button>
          </>
        )}
      </header>
      <section className="boards-container">
        <PlayerContext.Provider value={{ currentPlayer, setCurrentPlayer }}>
          <div className="board-wrapper">
            <div
              className={`board-label left ${
                currentPlayer === "Player" ? "active" : ""
              }`}
            >
              YOUR FLEET
            </div>
            <Board
              player={phase === "playing" ? "Player" : "None"}
              boardInstance={player.gameboard}
              handleAllSunk={handleGameOver}
            />
          </div>
          <div className="board-wrapper">
            <div
              className={`board-label right ${
                currentPlayer === "Computer" ? "active" : ""
              }`}
            >
              ENEMY WATERS
            </div>
            <Board
              player={phase === "playing" ? "Computer" : "None"}
              boardInstance={computer.gameboard}
              handleAllSunk={handleGameOver}
            />
          </div>
        </PlayerContext.Provider>
      </section>
    </>
  );
}

export default App;
