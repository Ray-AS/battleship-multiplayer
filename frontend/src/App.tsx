import "./styles/app.css";
import Board from "./components/Board";
import { useEffect, useState } from "react";
import type {
  PlayerType,
  GamePhase,
  PlacementState,
  Position,
  Board as BoardT,
  Cell as CellT,
} from "./models.ts";
import { PlayerContext } from "./components/PlayerContext";
import { api } from "./api.ts";
import { v4 as uuidv4 } from "uuid";
import { SHIPS } from "./configs.ts";
import { socket } from "./socket.ts";

function getSessionPlayerId() {
  const sessionKey = "bs_session_player_id";
  let id = sessionStorage.getItem(sessionKey);
  if (!id) {
    id = uuidv4();
    sessionStorage.setItem(sessionKey, id);
  }
  return id;
}

const MY_ID = getSessionPlayerId();

const createEmptyBoard: () => BoardT = () =>
  Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => ({ type: "empty" })),
  );

function App() {
  const [gameId, setGameId] = useState("");
  const [playerBoard, setPlayerBoard] = useState<BoardT>(createEmptyBoard());
  const [opponentBoard, setOpponentBoard] =
    useState<BoardT>(createEmptyBoard());
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);

  const [phase, setPhase] = useState<GamePhase>("setup");
  const [currentPlayer, setCurrentPlayer] = useState<PlayerType>("None");
  const [winner, setWinner] = useState<PlayerType>("None");
  const [placement, setPlacement] = useState<PlacementState | null>(null);
  const [myTurn, setMyTurn] = useState(false);

  const [delay, setDelay] = useState(1);
  const [pendingPlayerBoardUpdate, setPendingPlayerBoardUpdate] =
    useState<BoardT | null>(null);
  // const [readyStatus, setReadyStatus] = useState<string>("");
  const [imReady, setImReady] = useState(false);

  const [joinMode, setJoinMode] = useState(false);
  const [joinId, setJoinId] = useState("");

  useEffect(() => {
    socket.connect();

    let delayTimeout: number | null = null;

    socket.on("gameState", (data) => {
      console.log("Received gameState:", data);

      // Only process if this state update is for me or if it is broadcast
      if (data.forPlayerId && data.forPlayerId !== MY_ID) {
        console.log("Ignoring gameState for different player");
        return;
      }

      setPhase(data.phase);
      setMyTurn(data.turn === MY_ID);

      setCurrentPlayer(data.turn === MY_ID ? "Player" : "Computer");

      if (data.isMultiplayer !== undefined) {
        setIsMultiplayer(data.isMultiplayer);
      }
      if (data.participantCount !== undefined) {
        setParticipantCount(data.participantCount);
      }

      if (data.phase === "playing") {
        // setReadyStatus("");
        setImReady(false);
      }

      const participantIds = Object.keys(data.boards);
      const myBoardData = data.boards[MY_ID];
      const opponentId = participantIds.find((id) => id !== MY_ID);
      const opponentBoardData = opponentId ? data.boards[opponentId] : null;

      // No delay on showing my attacks
      if (opponentBoardData) {
        setOpponentBoard(opponentBoardData);
      }

      if (myBoardData) {
        // Detect if this is an AI counterattack (single-player only)
        const shouldDelay =
          !data.isMultiplayer &&
          delay > 0 &&
          data.phase === "playing" &&
          pendingPlayerBoardUpdate === null;

        if (shouldDelay) {
          // Clear any existing timeout
          if (delayTimeout) {
            clearTimeout(delayTimeout);
          }

          // Show my attack immediately (opponent board already updated)
          // Delay showing AI's attack on my board
          setPendingPlayerBoardUpdate(myBoardData);
          delayTimeout = setTimeout(() => {
            setPlayerBoard(myBoardData);
            setPendingPlayerBoardUpdate(null);
            delayTimeout = null;
          }, delay * 1000);
        } else {
          // No delay needed (game setup, game end, multiplayer, or already pending)
          setPlayerBoard(myBoardData);

          // If there was a pending update, clear it
          if (delayTimeout) {
            clearTimeout(delayTimeout);
            delayTimeout = null;
          }
          setPendingPlayerBoardUpdate(null);
        }
      }

      if (data.phase === "ended") {
        const myShipsRemaining = myBoardData
          ?.flat()
          .some((cell: CellT) => cell.type === "ship");
        setWinner(myShipsRemaining ? "Player" : "Computer");
      }
    });

    socket.on("playerJoined", (data) => {
      setParticipantCount(data.participantCount);
      console.log("Player joined:", data.playerId);
    });

    socket.on("playerReady", () => {
      // setReadyStatus(data.message);
      setImReady(true);
    });

    // socket.on("playerMarkedReady", (data) => {
    //   setReadyStatus(`${data.playerId.slice(0, 8)} is ready!`);
    //   setTimeout(() => setReadyStatus(""), 3000);
    // });

    socket.on("error", (data) => {
      console.log(data.message);
    });

    return () => {
      socket.off("gameState");
      socket.off("playerJoined");
      socket.off("error");
      socket.off("shipsCleared");
      socket.off("playerReady");
      socket.off("playerMarkedReady");
      socket.disconnect();
    };
  }, [delay, pendingPlayerBoardUpdate]);

  async function createNewGame(isMulti: boolean) {
    const id = uuidv4();
    console.log("Creating new game:", { id, isMulti, MY_ID });

    setGameId(id);
    setIsMultiplayer(isMulti);

    const res = await api.createGame(id, MY_ID, isMulti);
    console.log("createGame response:", res);

    if (res.error && res.error !== "Game already exists") {
      alert(res.error);
      return;
    }

    socket.emit("joinGame", { gameId: id, playerId: MY_ID });
  }

  async function joinExistingGame() {
    if (!joinId.trim()) {
      console.error("Please enter a Game ID");
      return;
    }

    console.log("Joining existing game:", { joinId, MY_ID });

    setGameId(joinId);
    setIsMultiplayer(true); // Joining always means multiplayer

    const res = await api.createGame(joinId, MY_ID, true);
    console.log("joinGame response:", res);

    if (res.error && res.error !== "Game already exists") {
      console.log(res.error);
      return;
    }

    socket.emit("joinGame", { gameId: joinId, playerId: MY_ID });
    setJoinMode(false);
    setJoinId("");
  }

  async function handleCellClick(position: Position) {
    // if (pendingPlayerBoardUpdate) {
    //   return;
    // }

    if (phase === "setup" && placement) {
      const res = await api.placeShip(gameId, {
        playerId: MY_ID,
        shipModel: SHIPS[placement.index].model,
        x: position.x,
        y: position.y,
        orientation: placement.orientation,
      });

      if (res.board) {
        setPlayerBoard(res.board);
        if (placement.index < SHIPS.length - 1) {
          setPlacement({ ...placement, index: placement.index + 1 });
        } else {
          setPlacement(null);
        }
      } else {
        console.log(res.error || "Invalid Placement");
      }
    } else if (phase === "playing" && myTurn) {
      socket.emit("attack", {
        gameId,
        attackerId: MY_ID,
        x: position.x,
        y: position.y,
      });
    }
  }

  function handleStartGame() {
    console.log("Starting game via socket");
    socket.emit("startGame", { gameId, playerId: MY_ID });
  }

  function handlePlaceManually() {
    // Clear existing ships before starting new placement
    if (playerBoard.flat().some((cell) => cell.type === "ship")) {
      socket.emit("clearShips", { gameId, playerId: MY_ID });

      // Listen for clear confirmation
      socket.once("shipsCleared", (data) => {
        if (data.board) {
          setPlayerBoard(data.board);
        }
        setPlacement({ index: 0, orientation: "horizontal" });
      });
    } else {
      setPlacement({ index: 0, orientation: "horizontal" });
    }
  }

  function resetGame() {
    setGameId("");
    setPhase("setup");
    setWinner("None");
    setPlayerBoard(createEmptyBoard());
    setOpponentBoard(createEmptyBoard());
    setImReady(false);
    setPendingPlayerBoardUpdate(null);
    setJoinMode(false);
    setJoinId("");
  }

  // useEffect(() => {
  //   let isMounted = true;

  //   async function setup() {
  //     const res = await api.createGame(gameId);

  //     // Only update state if the component is still mounted
  //     if (isMounted) {
  //       setPlayerBoard(res.playerBoard);
  //       setOpponentBoard(res.opponentBoard);
  //       setPhase("setup");
  //       setWinner("None");
  //       setCurrentPlayer("None");
  //     }
  //   }

  //   setup();

  //   // Cleanup function to prevent memory leaks/race conditions
  //   return () => { isMounted = false; };
  // }, [gameId]);

  // function startManualSetup() {
  //   // Generate a new ID (this resets the backend via the useEffect)
  //   const newId = uuidv4();
  //   setGameId(newId);

  //   // Set the placement state to start the manual process
  //   setPlacement({ index: 0, orientation: "horizontal" });

  //   // Reset local phase/winner state just in case
  //   setPhase("setup");
  //   setWinner("None");
  //   setCurrentPlayer("None");
  // }

  // function cancelSetup() {
  //   const newId = uuidv4();
  //   setGameId(newId);
  //   setPhase("setup");
  //   setPlayerBoard(Array.from({ length: 10 }, () =>
  //     Array.from({ length: 10 }, () => ({ type: "empty" }))
  //   ));
  //   setOpponentBoard(Array.from({ length: 10 }, () =>
  //     Array.from({ length: 10 }, () => ({ type: "empty" }))
  //   ));
  //   setPlacement(null);
  //   setCurrentPlayer("None");
  //   setWinner("None");
  // }

  // async function handleCellClick(position: Position) {
  //   if (phase === "setup" && placement) {
  //     const res = await api.placeShip(gameId, {
  //       playerId: "player",
  //       shipModel: SHIPS[placement.index].model,
  //       x: position.x,
  //       y: position.y,
  //       orientation: placement.orientation
  //     });

  //     if (res.board) {
  //       setPlayerBoard(res.board);
  //       if (placement.index < SHIPS.length - 1) {
  //         setPlacement({ ...placement, index: placement.index + 1 });
  //       } else {
  //         setPlacement(null);
  //       }
  //     } else {
  //       alert(res.error || "Invalid Placement");
  //     }
  //   } else if (phase === "playing" && currentPlayer === "Player") {
  //     const res = await api.attack(gameId, position.x, position.y);
  //     if (res.error || !res.boards) return;

  //     // Only show opponent board; hold off on showing player board until the timeout is over for a more natural feel
  //     setOpponentBoard(res.boards.opponent);

  //     if (res.phase === "ended") {
  //       // If AI attack is null, it means player won on their turn
  //       setPlayerBoard(res.boards.player);
  //       setPhase(res.phase);
  //       setWinner(res.aiAttack === null ? "Player" : "Computer");
  //       return;
  //     }

  //     // Temporarily set current player to "Computer" to show AI is thinking
  //     setCurrentPlayer("Computer");

  //     // Delay attack based on user preference
  //     setTimeout(() => {
  //       if(res.error || !res.boards) return;
  //       setPlayerBoard(res.boards.player);
  //       setOpponentBoard(res.boards.opponent);
  //       setCurrentPlayer("Player");
  //       setPhase(res.phase);
  //     }, delay * 1000);
  //   }
  // }

  // async function startGame() {
  //   const res = await api.startGame(gameId);
  //   if (res.error || !res.boards) {
  //     alert(res.error);
  //     return;
  //   }
  //   setPlayerBoard(res.boards.player);
  //   setOpponentBoard(res.boards.opponent);
  //   setPhase(res.phase);
  //   setCurrentPlayer(res.turn === "player" ? "Player" : "Computer");
  // }

  const isAIThinking = pendingPlayerBoardUpdate !== null;
  const canInteract = !isAIThinking && myTurn && phase === "playing";

  return (
    <>
      {!gameId ? (
        <div className="lobby">
          <h1>Battleship</h1>
          <div className="lobby-controls">
            {!joinMode ? (
              <>
                <button onClick={() => createNewGame(false)}>
                  Play Vs. Computer
                </button>
                <button onClick={() => createNewGame(true)}>
                  Create Multiplayer Game
                </button>
                <button onClick={() => setJoinMode(true)}>
                  Join Multiplayer Game
                </button>
              </>
            ) : (
              <>
                <h3>Join Game</h3>
                <input
                  type="text"
                  placeholder="Enter Game ID"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && joinExistingGame()}
                />
                <div className="button-group">
                  <button onClick={joinExistingGame}>Join</button>
                  <button onClick={() => setJoinMode(false)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <header>
            <h1>Battleship</h1>
            {isMultiplayer && (
              <div className="game-id-badge">
                Room: {gameId}
                {` (${participantCount}/2 players)`}
              </div>
            )}
            {phase === "setup" && (
              <div className="setup">
                {!placement ? (
                  <>
                    <button
                      className="start-btn"
                      onClick={handleStartGame}
                      disabled={
                        (isMultiplayer && participantCount < 2) || imReady
                      }
                    >
                      {imReady
                        ? "Waiting for opponent..."
                        : isMultiplayer && participantCount < 2
                          ? "Waiting for opponent to join..."
                          : "I'm Ready"}
                    </button>
                    <button
                      className="place-manually-btn"
                      onClick={handlePlaceManually}
                      disabled={imReady}
                    >
                      Place Ships Manually
                    </button>
                  </>
                ) : (
                  <div className="placement-info">
                    <p>
                      Placing:{" "}
                      <strong>
                        {SHIPS[placement.index].model.toUpperCase()}
                      </strong>
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
                      {placement.orientation}
                    </button>
                  </div>
                )}
              </div>
            )}
            {phase === "playing" && (
              <>
                {!isMultiplayer && (
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
                )}
                <div
                  className={`status-bar ${isAIThinking ? "opponent" : myTurn ? "player" : "opponent"}`}
                >
                  {isAIThinking
                    ? "ENEMY ATTACKING..."
                    : myTurn
                      ? "YOUR TURN"
                      : "OPPONENT'S TURN"}
                </div>
              </>
            )}
            {phase === "ended" && (
              <div className="game-over">
                <h3>{winner === "Player" ? "VICTORY!" : "DEFEAT!"}</h3>
                <button onClick={resetGame}>New Game</button>
              </div>
            )}
          </header>
          <section className="boards-container">
            <PlayerContext.Provider value={{ currentPlayer, setCurrentPlayer }}>
              <div className="board-wrapper">
                <div className={`board-label left ${myTurn && !isAIThinking ? "active" : ""}`}>
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
                <div
                  className={`board-label right ${canInteract ? "active" : ""}`}
                >
                  ENEMY WATERS
                </div>
                <Board
                  playerRole="Computer"
                  boardData={opponentBoard}
                  phase={phase}
                  onInteract={handleCellClick}
                  myTurn={canInteract}
                />
              </div>
            </PlayerContext.Provider>
          </section>
        </>
      )}
    </>
  );
}

export default App;
