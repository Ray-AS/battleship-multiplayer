import { v4 as uuidv4 } from "uuid";
import { api } from "../api";
import { socket } from "../socket";
import { SHIPS } from "../configs";
import type { Board, GameState, PlacementState, PlayerType, Position } from "../models";
import { createEmptyBoard } from "../utils/helpers";

interface UseGameActionsParams {
  MY_ID: string;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  setErrorMsg: React.Dispatch<React.SetStateAction<string>>;
  playerBoard: Board;
  setPlayerBoard: React.Dispatch<React.SetStateAction<Board>>;
  setOpponentBoard: React.Dispatch<React.SetStateAction<Board>>;
  placement: PlacementState | null;
  setPlacement: React.Dispatch<React.SetStateAction<PlacementState | null>>;
  pendingPlayerBoardUpdate: null;
  setPendingPlayerBoardUpdate: React.Dispatch<React.SetStateAction<null>>
  pendingPlayerBoardRef: React.RefObject<null>;
  setPendingWinner: React.Dispatch<React.SetStateAction<PlayerType | null>>;
  setJoinMode: React.Dispatch<React.SetStateAction<boolean>>;
  setJoinId: React.Dispatch<React.SetStateAction<string>>;
  hasAttackedRef: React.RefObject<boolean>;
}

export function useGameActions({
  MY_ID,
  gameState,
  setGameState,
  setErrorMsg,
  playerBoard,
  setPlayerBoard,
  setOpponentBoard,
  placement,
  setPlacement,
  pendingPlayerBoardUpdate,
  setPendingPlayerBoardUpdate,
  pendingPlayerBoardRef,
  setPendingWinner,
  setJoinMode,
  setJoinId,
  hasAttackedRef,
}: UseGameActionsParams) {
  
  async function createNewGame(isMulti: boolean) {
    const id = uuidv4();
    console.log("Creating new game:", { id, isMulti, MY_ID });

    setGameState((prev) => ({
      ...prev,
      id,
      isMultiplayer: isMulti,
    }));

    const res = await api.createGame(id, MY_ID, isMulti);
    console.log("createGame response:", res);

    if (res.error && res.error !== "Game already exists") {
      setErrorMsg(res.error);
      return;
    }

    if (res.participantCount !== undefined) {
      setGameState((prev) => ({
        ...prev,
        participantCount: res.participantCount,
      }));
    }

    socket.emit("joinGame", { gameId: id, playerId: MY_ID });
  }

  async function joinExistingGame(joinId: string) {
    if (!joinId.trim()) {
      setErrorMsg("Please enter a Game ID");
      return;
    }

    console.log("Joining existing game:", { joinId, MY_ID });

    setGameState((prev) => ({
      ...prev,
      id: joinId,
      isMultiplayer: true,
    }));

    const res = await api.createGame(joinId, MY_ID, true);
    console.log("joinGame response:", res);

    if (res.error && res.error !== "Game already exists") {
      setErrorMsg(res.error);
      return;
    }

    if (res.participantCount !== undefined) {
      setGameState((prev) => ({
        ...prev,
        participantCount: res.participantCount,
      }));
    }

    socket.emit("joinGame", { gameId: joinId, playerId: MY_ID });
    setJoinMode(false);
    setJoinId("");
  }

  async function handleCellClick(position: Position) {
    if (pendingPlayerBoardUpdate) {
      return;
    }

    if (gameState.phase === "setup" && placement) {
      const res = await api.placeShip(gameState.id, {
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
        setErrorMsg(res.error || "Invalid Placement");
      }
    } else if (gameState.phase === "playing" && gameState.myTurn) {
      hasAttackedRef.current = true;
      socket.emit("attack", {
        gameId: gameState.id,
        attackerId: MY_ID,
        x: position.x,
        y: position.y,
      });
    }
  }

  function handleStartGame() {
    console.log("Starting game via socket");
    socket.emit("startGame", { gameId: gameState.id, playerId: MY_ID });
  }

  function handlePlaceManually() {
    if (playerBoard.flat().some((cell) => cell.type === "ship")) {
      socket.emit("clearShips", { gameId: gameState.id, playerId: MY_ID });

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
    setGameState((prev) => ({
      ...prev,
      id: "",
      phase: "setup",
      winner: "None",
      imReady: false,
    }));
    setPlayerBoard(createEmptyBoard());
    setOpponentBoard(createEmptyBoard());
    setPendingPlayerBoardUpdate(null);
    setPendingWinner(null);
    setJoinMode(false);
    setJoinId("");
    pendingPlayerBoardRef.current = null;
    hasAttackedRef.current = false;
  }

  return {
    createNewGame,
    joinExistingGame,
    handleCellClick,
    handleStartGame,
    handlePlaceManually,
    resetGame,
  };
}