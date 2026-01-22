import "./styles/app.css";
import Board from "./components/Board";
import { useEffect, useState } from "react";
import type {
  PlayerType,
  GamePhase,
  PlacementState,
  Position,
  Board as BoardT
} from "./models.ts";
import { PlayerContext } from "./components/PlayerContext";
import { api } from "./api.ts";
import { v4 as uuidv4 } from 'uuid';
import { SHIPS } from "./configs.ts";

function App() {
  const [gameId, setGameId] = useState(uuidv4());
  const [playerBoard, setPlayerBoard] = useState<BoardT>([]);
  const [opponentBoard, setOpponentBoard] = useState<BoardT>([]);

  const [phase, setPhase] = useState<GamePhase>("setup");
  const [currentPlayer, setCurrentPlayer] = useState<PlayerType>("None");
  const [winner, setWinner] = useState<PlayerType>("None");
  const [placement, setPlacement] = useState<PlacementState | null>(null);

  const [delay, setDelay] = useState<number>(1);

  useEffect(() => {
    let isMounted = true;

    async function setup() {
      const res = await api.createGame(gameId);
      
      // Only update state if the component is still mounted
      if (isMounted) {
        setPlayerBoard(res.playerBoard);
        setOpponentBoard(res.opponentBoard);
        setPhase("setup");
        setWinner("None");
        setCurrentPlayer("None");
      }
    }

    setup();

    // Cleanup function to prevent memory leaks/race conditions
    return () => { isMounted = false; };
  }, [gameId]);

  function startManualSetup() {
    // Generate a new ID (this resets the backend via the useEffect)
    const newId = uuidv4();
    setGameId(newId); 
    
    // Set the placement state to start the manual process
    setPlacement({ index: 0, orientation: "horizontal" });
    
    // Reset local phase/winner state just in case
    setPhase("setup");
    setWinner("None");
    setCurrentPlayer("None");
  }

  function cancelSetup() {
    const newId = uuidv4();
    setGameId(newId);
    setPhase("setup");
    setPlayerBoard(Array.from({ length: 10 }, () =>
      Array.from({ length: 10 }, () => ({ type: "empty" }))
    ));
    setOpponentBoard(Array.from({ length: 10 }, () =>
      Array.from({ length: 10 }, () => ({ type: "empty" }))
    ));
    setPlacement(null);
    setCurrentPlayer("None");
    setWinner("None");
  }
 

  async function handleCellClick(position: Position) {
    if (phase === "setup" && placement) {
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
    } else if (phase === "playing" && currentPlayer === "Player") {
      const res = await api.attack(gameId, position.x, position.y);
      if (res.error || !res.boards) return;

      // Only show opponent board; hold off on showing player board until the timeout is over for a more natural feel
      setOpponentBoard(res.boards.opponent);
      
      if (res.phase === "ended") {
        // If AI attack is null, it means player won on their turn
        setPlayerBoard(res.boards.player);
        setPhase(res.phase);
        setWinner(res.aiAttack === null ? "Player" : "Computer");
        return;
      }

      // Temporarily set current player to "Computer" to show AI is thinking
      setCurrentPlayer("Computer");

      // Delay attack based on user preference
      setTimeout(() => {
        if(res.error || !res.boards) return;
        setPlayerBoard(res.boards.player);
        setOpponentBoard(res.boards.opponent);
        setCurrentPlayer("Player");
        setPhase(res.phase);
      }, delay * 1000);
    }
  }

  async function startGame() {
    const res = await api.startGame(gameId);
    if (res.error || !res.boards) {
      alert(res.error);
      return;
    }
    setPlayerBoard(res.boards.player);
    setOpponentBoard(res.boards.opponent);
    setPhase(res.phase);
    setCurrentPlayer(res.turn === "player" ? "Player" : "Computer");
  }

  return (
    <>
      <header>
        <h1>Battleship</h1>
        {phase === "setup" && (
          <div className="setup">
            {!placement ? (
              <>
                <button onClick={startManualSetup}>Manual</button>
                <button onClick={startGame}>Start</button>
              </>
            ) : (
              <div className="placement-info">
                <p>Placing: <strong>{SHIPS[placement.index].model.toUpperCase()}</strong></p>
                <button onClick={() => setPlacement({
                  ...placement, 
                  orientation: placement.orientation === "horizontal" ? "vertical" : "horizontal"
                })}>
                  {placement.orientation}
                </button>
                <button onClick={cancelSetup}>Cancel</button>
              </div>
            )}
          </div>
        )}
        {phase === "playing" && (
          <>
            <div className={"settings"}>
              <label>
                AI Delay (s):{" "}
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={1}
                  value={delay}
                  onChange={(e) => {
                    let val = Math.floor(Number(e.target.value)); // remove decimals
                    if (val < 0) val = 0;
                    if (val > 5) val = 5;
                    setDelay(val);
                  }}
                />
              </label>
            </div>
            <div className={`status-bar ${currentPlayer.toLowerCase()}`}>
              {currentPlayer === "Player" ? "YOUR TURN" : "ENEMY ATTACKING..."}
            </div>
          </>
        )}
        {phase === "ended" && (
          <div className="game-over">
            <h3>{winner === "Player" ? "VICTORY!" : "DEFEAT!"}</h3>
            <button onClick={() => setGameId(uuidv4())}>New Game</button>
          </div>
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
              playerRole={"Player"}
              boardData={playerBoard}
              phase={phase}
              placement={placement}
              onInteract={handleCellClick}
            />
          </div>
          <div className="board-wrapper">
            <div className={`board-label right ${currentPlayer === "Computer" ? "active" : ""}`}>
              ENEMY WATERS
            </div>
            <Board
              playerRole="Computer"
              boardData={opponentBoard}
              phase={phase}
              onInteract={handleCellClick}
            />
          </div>
        </PlayerContext.Provider>
      </section>
    </>
  );
}

export default App;
