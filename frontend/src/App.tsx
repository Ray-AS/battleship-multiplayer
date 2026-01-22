import "./styles/app.css";
import Board from "./components/Board";
import { useEffect, useState } from "react";
import type {
  PlayerType,
  GamePhase,
  PlacementState,
  ShipModel,
  Position,
  BoardT
} from "./models.ts";
import { PlayerContext } from "./components/PlayerContext";
import { api } from "./api.ts";
import { v4 as uuidv4 } from 'uuid';
import { SHIPS } from "./configs.ts";

function App() {
  const [gameId] = useState(uuidv4());
  const [playerBoard, setPlayerBoard] = useState<BoardT>([]);
  const [opponentBoard, setOpponentBoard] = useState<BoardT>([]);

  const [phase, setPhase] = useState<GamePhase>("setup");
  const [currentPlayer, setCurrentPlayer] = useState<PlayerType>("None");
  const [winner, setWinner] = useState<PlayerType>("None");
  const [placement, setPlacement] = useState<PlacementState>(null);

  useEffect(() => {
    api.createGame(gameId).then(res => {
      setPlayerBoard(res.playerBoard);
      setOpponentBoard(res.opponentBoard);
    });
  }, [gameId]);

  // function startManualSetup() {
  //   player.gameboard.clear();
  //   setPlacement({ index: 0, orientation: "horizontal" });
  //   setRefreshTrigger((prev) => prev + 1);
  // }

  async function handleCellClick(position: Position) {
    if (phase !== "setup" || !placement) return;

    const res = await api.placeShip(gameId, {
      playerId: "player",
      shipModel: SHIPS[placement.index].model,
      x: position.x,
      y: position.y,
      orientation: placement.orientation
    });

    if (res.board) {
      setPlayerBoard(res.board);
      if (placement.index < SHIPS.length - 1) {
        setPlacement({ ...placement, index: placement.index + 1 });
      } else {
        setPlacement(null);
      }
    } else {
      alert(res.error || "Invalid Placement");
    }
  }

  async function handleAttack(position: Position) {
    const res = await api.attack(gameId, position.x, position.y);
    if (res.error) return;

    // The backend returns both player attack and AI's counterattack
    setPlayerBoard(res.boards.player);
    setOpponentBoard(res.boards.opponent);
    setPhase(res.phase);

    if (res.phase === "ended") {
      // If AI has no counterattack or the last move ended it
      setWinner(res.aiAttack === null ? "Player" : "Computer");
    }
  }

  function startGame() {
    console.log("Starting game");

    computer.gameboard.clear();
    computer.randomPopulate();
    computer.resetAI();

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
        const cellToAttack = computer.chooseAttack();
        console.log(
          `Computer attacking (${cellToAttack.x}, ${cellToAttack.y})`
        );
        const outcome = player.gameboard.receiveAttack(cellToAttack);
        computer.registerOutcome(cellToAttack, outcome);

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
          <div className="setup">
            {!placement ? (
              <>
                <button onClick={startManualSetup}>Manual</button>
                <button onClick={randomizePlayerBoard}>Randomize</button>
                <button onClick={startGame}>Start</button>
              </>
            ) : (
              <div className="placement-info">
                <p>
                  Placing:{" "}
                  <strong>{SHIPS[placement.index].model.toUpperCase()}</strong>{" "}
                  (Length: {SHIPS[placement.index].length})
                </p>
                <button
                  onClick={() =>
                    setPlacement({
                      ...placement,
                      orientation:
                        placement.orientation === "horizontal"
                          ? "vertical"
                          : "horizontal",
                    })
                  }
                >
                  {placement.orientation[0].toUpperCase() +
                    placement.orientation.slice(1)}
                </button>
                <button
                  onClick={() => {
                    setPlacement(null);
                    player.gameboard.clear();
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
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
              phase={phase}
              handleAllSunk={handleGameOver}
              placement={placement}
              handlePlacement={placement ? handleCellClick : undefined}
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
              phase={phase}
              handleAllSunk={handleGameOver}
            />
          </div>
        </PlayerContext.Provider>
      </section>
    </>
  );
}

export default App;
