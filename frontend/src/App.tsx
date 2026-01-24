// import "./styles/app.css";
// import Board from "./components/Board";
// import { useEffect, useRef, useState } from "react";
// import type {
//   PlayerType,
//   GamePhase,
//   PlacementState,
//   Position,
//   Board as BoardT,
//   Cell as CellT,
// } from "./models.ts";
// import { api } from "./api.ts";
// import { v4 as uuidv4 } from "uuid";
// import { SHIPS } from "./configs.ts";
// import { socket } from "./socket.ts";

// function getSessionPlayerId() {
//   const sessionKey = "bs_session_player_id";
//   let id = sessionStorage.getItem(sessionKey);
//   if (!id) {
//     id = uuidv4();
//     sessionStorage.setItem(sessionKey, id);
//   }
//   return id;
// }

// const MY_ID = getSessionPlayerId();

// const createEmptyBoard: () => BoardT = () =>
//   Array.from({ length: 10 }, () =>
//     Array.from({ length: 10 }, () => ({ type: "empty" })),
//   );

// function App() {
//   const [gameState, setGameState] = useState({
//     id: "",
//     phase: "setup" as GamePhase,
//     isMultiplayer: false,
//     participantCount: 1,
//     winner: "None" as PlayerType,
//     myTurn: false,
//     imReady: false,
//   });

//   // Keep track of data related to player's ship placement during setup
//   const [placement, setPlacement] = useState<PlacementState | null>(null);

//   // Keep track of player and opponent boards
//   const [playerBoard, setPlayerBoard] = useState<BoardT>(createEmptyBoard());
//   const [opponentBoard, setOpponentBoard] =
//     useState<BoardT>(createEmptyBoard());

//   // Keep track of pending data & delays to update interface at correct moments
//   const [delay, setDelay] = useState(1);
//   const delayRef = useRef(1);
//   const [pendingPlayerBoardUpdate, setPendingPlayerBoardUpdate] =
//     useState(null);
//   const pendingPlayerBoardRef = useRef(null);
//   const pendingOpponentBoardRef = useRef<BoardT | null>(null);
//   const [pendingWinner, setPendingWinner] = useState<PlayerType | null>(null);
//   const hasAttackedRef = useRef(false);

//   const [errorMsg, setErrorMsg] = useState<string>("");
//   const [readyStatus, setReadyStatus] = useState<string>("");

//   const [joinMode, setJoinMode] = useState(false);
//   const [joinId, setJoinId] = useState("");

//   function calculateWinner(boardData: BoardT): PlayerType {
//     const myShipsRemaining = boardData
//       ?.flat()
//       .some((cell: CellT) => cell.type === "ship");
//     return myShipsRemaining ? "Player" : "Computer";
//   }

//   // Only apply delay if:
//   // 1. Single-player mode
//   // 2. Delay is set
//   // 3. Game is in playing phase OR just ended (AI's winning move)
//   // 4. I have made at least one attack (not the initial board state)
//   // 5. No pending update already
//   function shouldDelayUpdate(data: any) {
//     return (
//       !data.isMultiplayer &&
//       delayRef.current > 0 &&
//       (data.phase === "playing" || data.phase === "ended") &&
//       hasAttackedRef.current &&
//       !pendingPlayerBoardRef.current
//     );
//   }

//   function getStatusMessage() {
//     if (isAIThinking) return "ENEMY ATTACKING...";
//     return gameState.myTurn ? "YOU'RE ATTACKING..." : "ENEMY ATTACKING...";
//   }

//   useEffect(() => {
//     socket.connect();

//     let delayTimeout: number | null = null;

//     socket.on("gameState", (data) => {
//       console.log("Received gameState:", data);

//       // Only process if this state update is for me or if it is broadcast
//       if (data.forPlayerId && data.forPlayerId !== MY_ID) {
//         console.log("Ignoring gameState for different player");
//         return;
//       }

//       setGameState((prev) => ({
//         ...prev,
//         phase: data.phase,
//         myTurn: data.turn === MY_ID,
//       }));

//       if (data.isMultiplayer !== undefined) {
//         setGameState((prev) => ({
//           ...prev,
//           isMultiplayer: data.isMultiplayer,
//         }));
//       }
//       if (data.participantCount !== undefined) {
//         setGameState((prev) => ({
//           ...prev,
//           participantCount: data.participationCount,
//         }));
//       }

//       if (data.phase === "playing") {
//         setReadyStatus("");
//         setGameState((prev) => ({
//           ...prev,
//           imReady: false,
//         }));
//       }

//       const participantIds = Object.keys(data.boards);
//       const myBoardData = data.boards[MY_ID];
//       const opponentId = participantIds.find((id) => id !== MY_ID);
//       const opponentBoardData = opponentId ? data.boards[opponentId] : null;

//       const shouldDelay = shouldDelayUpdate(data);

//       if (opponentBoardData) {
//         // If game ended and delaying updates, also delay opponent board reveal
//         if (data.phase === "ended" && shouldDelay) {
//           pendingOpponentBoardRef.current = opponentBoardData;
//         } else {
//           // Update opponent board immediately for normal attacks
//           setOpponentBoard(opponentBoardData);
//           pendingOpponentBoardRef.current = null;
//         }
//       }

//       if (myBoardData) {
//         if (shouldDelay) {
//           // Clear any existing timeout
//           if (delayTimeout) {
//             clearTimeout(delayTimeout);
//           }

//           // Show my attack immediately (opponent board already updated)
//           // Delay showing AI's attack on my board
//           setPendingPlayerBoardUpdate(myBoardData);
//           pendingPlayerBoardRef.current = myBoardData;

//           // Also delay winner reveal if game ended
//           if (data.phase === "ended") {
//             setPendingWinner(calculateWinner(myBoardData));
//           }

//           delayTimeout = window.setTimeout(() => {
//             setPlayerBoard(myBoardData);
//             setPendingPlayerBoardUpdate(null);
//             pendingPlayerBoardRef.current = null;

//             if (pendingOpponentBoardRef.current) {
//               setOpponentBoard(pendingOpponentBoardRef.current);
//               pendingOpponentBoardRef.current = null;
//             }

//             // Set winner after delay if game ended
//             if (data.phase === "ended") {
//               setGameState((prev) => ({
//                 ...prev,
//                 winner: calculateWinner(myBoardData),
//               }));
//               setPendingWinner(null);
//             }

//             delayTimeout = null;
//           }, delayRef.current * 1000);
//         } else {
//           // No delay needed (game setup, game end, multiplayer, or already pending)
//           setPlayerBoard(myBoardData);

//           // If there was a pending update, clear it
//           if (delayTimeout) {
//             clearTimeout(delayTimeout);
//             delayTimeout = null;
//           }
//           setPendingPlayerBoardUpdate(null);
//           pendingPlayerBoardRef.current = null;

//           if (data.phase === "ended") {
//             setGameState((prev) => ({
//               ...prev,
//               winner: calculateWinner(myBoardData),
//             }));
//             setPendingWinner(null);
//           }
//         }
//       }
//     });

//     socket.on("playerJoined", (data) => {
//       setGameState((prev) => ({
//         ...prev,
//         participantCount: data.participationCount,
//       }));
//       console.log("Player joined:", data.playerId);
//     });

//     socket.on("playerReady", () => {
//       setReadyStatus("Waiting for others...");
//       setGameState((prev) => ({
//         ...prev,
//         imReady: true,
//       }));
//     });

//     socket.on("playerMarkedReady", (data) => {
//       setReadyStatus(`${data.playerId.slice(0, 4)} is ready!`);
//       setTimeout(() => setReadyStatus(""), 3000);
//     });

//     socket.on("error", (data) => {
//       console.log(data.message);
//       setErrorMsg(data.message);
//       setTimeout(() => setErrorMsg(""), 3000);
//     });

//     return () => {
//       socket.off("gameState");
//       socket.off("playerJoined");
//       socket.off("error");
//       socket.off("shipsCleared");
//       socket.off("playerReady");
//       socket.off("playerMarkedReady");
//       socket.disconnect();
//     };
//   }, []);

//   async function createNewGame(isMulti: boolean) {
//     const id = uuidv4();
//     console.log("Creating new game:", { id, isMulti, MY_ID });

//     setGameState((prev) => ({
//       ...prev,
//       id,
//       isMultiplayer: isMulti,
//     }));

//     const res = await api.createGame(id, MY_ID, isMulti);
//     console.log("createGame response:", res);

//     if (res.error && res.error !== "Game already exists") {
//       setErrorMsg(res.error);
//       return;
//     }

//     if (res.participantCount !== undefined) {
//       setGameState((prev) => ({
//         ...prev,
//         participantCount: res.participationCount,
//       }));
//     }

//     socket.emit("joinGame", { gameId: id, playerId: MY_ID });
//   }

//   async function joinExistingGame() {
//     if (!joinId.trim()) {
//       setErrorMsg("Please enter a Game ID");
//       return;
//     }

//     console.log("Joining existing game:", { joinId, MY_ID });

//     setGameState((prev) => ({
//       ...prev,
//       id: joinId,
//       isMultiplayer: true, // Joining always means multiplayer
//     }));

//     const res = await api.createGame(joinId, MY_ID, true);
//     console.log("joinGame response:", res);

//     if (res.error && res.error !== "Game already exists") {
//       setErrorMsg(res.error);
//       return;
//     }

//     if (res.participantCount !== undefined) {
//       setGameState((prev) => ({
//         ...prev,
//         participantCount: res.participationCount,
//       }));
//     }

//     socket.emit("joinGame", { gameId: joinId, playerId: MY_ID });
//     setJoinMode(false);
//     setJoinId("");
//   }

//   async function handleCellClick(position: Position) {
//     if (pendingPlayerBoardUpdate) {
//       return;
//     }

//     if (gameState.phase === "setup" && placement) {
//       const res = await api.placeShip(gameState.id, {
//         playerId: MY_ID,
//         shipModel: SHIPS[placement.index].model,
//         x: position.x,
//         y: position.y,
//         orientation: placement.orientation,
//       });

//       if (res.board) {
//         setPlayerBoard(res.board);
//         if (placement.index < SHIPS.length - 1) {
//           setPlacement({ ...placement, index: placement.index + 1 });
//         } else {
//           setPlacement(null);
//         }
//       } else {
//         setErrorMsg(res.error || "Invalid Placement");
//       }
//     } else if (gameState.phase === "playing" && gameState.myTurn) {
//       hasAttackedRef.current = true;
//       socket.emit("attack", {
//         gameId: gameState.id,
//         attackerId: MY_ID,
//         x: position.x,
//         y: position.y,
//       });
//     }
//   }

//   function handleStartGame() {
//     console.log("Starting game via socket");
//     socket.emit("startGame", { gameId: gameState.id, playerId: MY_ID });
//   }

//   function handlePlaceManually() {
//     // Clear existing ships before starting new placement
//     if (playerBoard.flat().some((cell) => cell.type === "ship")) {
//       socket.emit("clearShips", { gameId: gameState.id, playerId: MY_ID });

//       // Listen for clear confirmation
//       socket.once("shipsCleared", (data) => {
//         if (data.board) {
//           setPlayerBoard(data.board);
//         }
//         setPlacement({ index: 0, orientation: "horizontal" });
//       });
//     } else {
//       setPlacement({ index: 0, orientation: "horizontal" });
//     }
//   }

//   function resetGame() {
//     setGameState((prev) => ({
//       ...prev,
//       id: "",
//       phase: "setup" as GamePhase,
//       winner: "None",
//       imReady: false,
//     }));
//     setPlayerBoard(createEmptyBoard());
//     setOpponentBoard(createEmptyBoard());
//     setPendingPlayerBoardUpdate(null);
//     setPendingWinner(null);
//     setJoinMode(false);
//     setJoinId("");
//     pendingPlayerBoardRef.current = null;
//     hasAttackedRef.current = false;
//   }

//   const isAIThinking = pendingPlayerBoardUpdate !== null;
//   const canInteract =
//     !isAIThinking && gameState.myTurn && gameState.phase === "playing";

//   return (
//     <>
//       {errorMsg && (
//         <div className="error-banner">{errorMsg}</div>
//       )}
      
//       {readyStatus && (
//         <div className="ready-banner">{readyStatus}</div>
//       )}
//       {!gameState.id ? (
//         <div className="lobby">
//           <h1>Battleship</h1>
//           <div className="lobby-controls">
//             {!joinMode ? (
//               <>
//                 <button onClick={() => createNewGame(false)}>
//                   Play Vs. Computer
//                 </button>
//                 <button onClick={() => createNewGame(true)}>
//                   Create Multiplayer Game
//                 </button>
//                 <button onClick={() => setJoinMode(true)}>
//                   Join Multiplayer Game
//                 </button>
//               </>
//             ) : (
//               <>
//                 <h3>Join Game</h3>
//                 <input
//                   type="text"
//                   placeholder="Enter Game ID"
//                   value={joinId}
//                   onChange={(e) => setJoinId(e.target.value)}
//                   onKeyDown={(e) => e.key === "Enter" && joinExistingGame()}
//                 />
//                 <div className="button-group">
//                   <button onClick={joinExistingGame}>Join</button>
//                   <button onClick={() => setJoinMode(false)}>Cancel</button>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       ) : (
//         <>
//           <header>
//             <h1>Battleship</h1>
//             {gameState.isMultiplayer && (
//               <div className="game-id-badge">
//                 Room: {gameState.id}
//                 {` (${gameState.participantCount === undefined ? 2 : gameState.participantCount}/2 players)`}
//               </div>
//             )}
//             {gameState.phase === "setup" && (
//               <div className="setup">
//                 {!placement ? (
//                   <>
//                     <button
//                       className="start-btn"
//                       onClick={handleStartGame}
//                       disabled={
//                         (gameState.isMultiplayer &&
//                           gameState.participantCount < 2) ||
//                         gameState.imReady
//                       }
//                     >
//                       {gameState.imReady
//                         ? "Waiting for opponent..."
//                         : gameState.isMultiplayer &&
//                             gameState.participantCount < 2
//                           ? "Waiting for opponent to join..."
//                           : "I'm Ready"}
//                     </button>
//                     <button
//                       className="place-manually-btn"
//                       onClick={handlePlaceManually}
//                       disabled={gameState.imReady}
//                     >
//                       Place Ships Manually
//                     </button>
//                   </>
//                 ) : (
//                   <div className="placement-info">
//                     <p>
//                       Placing:{" "}
//                       <strong>
//                         {SHIPS[placement.index].model.toUpperCase()}
//                       </strong>
//                     </p>
//                     <button
//                       onClick={() =>
//                         setPlacement({
//                           ...placement,
//                           orientation:
//                             placement.orientation === "horizontal"
//                               ? "vertical"
//                               : "horizontal",
//                         })
//                       }
//                     >
//                       {placement.orientation}
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}
//             {(gameState.phase === "playing" ||
//               (gameState.phase === "ended" && pendingWinner)) && (
//               <>
//                 {!gameState.isMultiplayer && (
//                   <div className={"settings"}>
//                     <label>
//                       AI Delay (s):{" "}
//                       <input
//                         type="number"
//                         min={0}
//                         max={5}
//                         step={1}
//                         value={delay}
//                         onChange={(e) => {
//                           let val = Math.floor(Number(e.target.value)); // remove decimals
//                           if (val < 0) val = 0;
//                           if (val > 5) val = 5;
//                           setDelay(val);
//                           delayRef.current = val;
//                         }}
//                       />
//                     </label>
//                   </div>
//                 )}
//                 <div
//                   className={`status-bar ${isAIThinking ? "opponent" : gameState.myTurn ? "player" : "opponent"}`}
//                 >
//                   {getStatusMessage()}
//                 </div>
//               </>
//             )}
//             {gameState.phase === "ended" && !pendingWinner && (
//               <div className="game-over">
//                 <h3>
//                   {gameState.winner === "Player" ? "VICTORY!" : "DEFEAT!"}
//                 </h3>
//                 <button onClick={resetGame}>New Game</button>
//               </div>
//             )}
//           </header>
//           <section className="boards-container">
//             <div className="board-wrapper">
//               <div
//                 className={`board-label left ${gameState.myTurn && gameState.phase === "playing" && !isAIThinking ? "active" : ""}`}
//               >
//                 YOUR FLEET
//               </div>
//               <Board
//                 playerRole={"Player"}
//                 boardData={playerBoard}
//                 phase={gameState.phase}
//                 placement={placement}
//                 onInteract={handleCellClick}
//               />
//             </div>
//             <div className="board-wrapper">
//               <div
//                 className={`board-label right ${!gameState.myTurn && gameState.phase === "playing" && !isAIThinking ? "active" : ""}`}
//               >
//                 ENEMY WATERS
//               </div>
//               <Board
//                 playerRole="Computer"
//                 boardData={opponentBoard}
//                 phase={gameState.phase}
//                 onInteract={handleCellClick}
//                 myTurn={canInteract}
//               />
//             </div>
//           </section>
//         </>
//       )}
//     </>
//   );
// }

// export default App;

import "./styles/app.css";
import Lobby from "./components/Lobby";
import Header from "./components/Header";
import GameBoards from "./components/GameBoards";
import NotificationBanners from "./components/Notification";
import { useGameState } from "./hooks/useGameState";
import { useBoardUpdates } from "./hooks/useBoardUpdates";
import { useSocket } from "./hooks/useSocket";
import { useGameActions } from "./hooks/useGameActions";
import { MY_ID } from "./utils/session";

function App() {
  const gameStateHook = useGameState();
  const boardHook = useBoardUpdates();
  
  useSocket({ MY_ID, ...gameStateHook, ...boardHook });
  
  const { createNewGame, joinExistingGame, handleCellClick, handleStartGame, handlePlaceManually, resetGame } = 
    useGameActions({ MY_ID, ...gameStateHook, ...boardHook });

  const canInteract = !boardHook.isAIThinking && 
    gameStateHook.gameState.myTurn && 
    gameStateHook.gameState.phase === "playing";

  return (
    <>
      <NotificationBanners 
        errorMsg={gameStateHook.errorMsg}
        readyStatus={gameStateHook.readyStatus}
      />
      
      {!gameStateHook.gameState.id ? (
        <Lobby
          joinMode={gameStateHook.joinMode}
          joinId={gameStateHook.joinId}
          setJoinId={gameStateHook.setJoinId}
          setJoinMode={gameStateHook.setJoinMode}
          onCreateNewGame={createNewGame}
          onJoinGame={joinExistingGame}
        />
      ) : (
        <>
          <Header 
            gameState={gameStateHook.gameState}
            placement={gameStateHook.placement}
            setPlacement={gameStateHook.setPlacement}
            delay={boardHook.delay}
            setDelay={boardHook.setDelay}
            delayRef={boardHook.delayRef}
            pendingWinner={boardHook.pendingWinner}
            isAIThinking={boardHook.isAIThinking}
            onStartGame={handleStartGame}
            onPlaceManually={handlePlaceManually}
            onResetGame={resetGame}
          />
          <GameBoards
            playerBoard={boardHook.playerBoard}
            opponentBoard={boardHook.opponentBoard}
            gameState={gameStateHook.gameState}
            placement={gameStateHook.placement}
            isAIThinking={boardHook.isAIThinking}
            canInteract={canInteract}
            onCellClick={handleCellClick}
          />
        </>
      )}
    </>
  );
}

export default App;
