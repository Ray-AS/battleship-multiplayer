import { useEffect } from "react";
import { socket } from "../socket";
import { calculateWinner } from "../utils/helpers";
import type { Board, GameState, GetGameResponse, PlayerType } from "../models";

interface useSocketParams {
  MY_ID: string;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  setReadyStatus: React.Dispatch<React.SetStateAction<string>>;
  setErrorMsg: React.Dispatch<React.SetStateAction<string>>;
  setPlayerBoard: React.Dispatch<React.SetStateAction<Board>>;
  setOpponentBoard: React.Dispatch<React.SetStateAction<Board>>;
  setPendingPlayerBoardUpdate: React.Dispatch<React.SetStateAction<null>>
  pendingPlayerBoardRef: React.RefObject<null>;
  pendingOpponentBoardRef: React.RefObject<Board | null>;
  setPendingWinner: React.Dispatch<React.SetStateAction<PlayerType | null>>;
  delayRef: React.RefObject<number>;
  shouldDelayUpdate: (data: GetGameResponse) => boolean;
}

export function useSocket({
  MY_ID,
  setGameState,
  setReadyStatus,
  setErrorMsg,
  setPlayerBoard,
  setOpponentBoard,
  setPendingPlayerBoardUpdate,
  pendingPlayerBoardRef,
  pendingOpponentBoardRef,
  setPendingWinner,
  delayRef,
  shouldDelayUpdate,
}: useSocketParams) {
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

      setGameState((prev) => ({
        ...prev,
        phase: data.phase,
        myTurn: data.turn === MY_ID,
      }));

      if (data.isMultiplayer !== undefined) {
        setGameState((prev) => ({
          ...prev,
          isMultiplayer: data.isMultiplayer,
        }));
      }
      if (data.participantCount !== undefined) {
        setGameState((prev) => ({
          ...prev,
          participantCount: data.participantCount,
        }));
      }

      if (data.phase === "playing") {
        setReadyStatus("");
        setGameState((prev) => ({
          ...prev,
          imReady: false,
        }));
      }

      const participantIds = Object.keys(data.boards);
      const myBoardData = data.boards[MY_ID];
      const opponentId = participantIds.find((id) => id !== MY_ID);
      const opponentBoardData = opponentId ? data.boards[opponentId] : null;

      const shouldDelay = shouldDelayUpdate(data);

      if (opponentBoardData) {
        // If game ended and delaying updates, also delay opponent board reveal
        if (data.phase === "ended" && shouldDelay) {
          pendingOpponentBoardRef.current = opponentBoardData;
        } else {
          // Update opponent board immediately for normal attacks
          setOpponentBoard(opponentBoardData);
          pendingOpponentBoardRef.current = null;
        }
      }

      if (myBoardData) {
        if (shouldDelay) {
          // Clear any existing timeout
          if (delayTimeout) {
            clearTimeout(delayTimeout);
          }

          // Show my attack immediately (opponent board already updated)
          // Delay showing AI's attack on my board
          setPendingPlayerBoardUpdate(myBoardData);
          pendingPlayerBoardRef.current = myBoardData;

          // Also delay winner reveal if game ended
          if (data.phase === "ended") {
            setPendingWinner(calculateWinner(myBoardData));
          }

          delayTimeout = window.setTimeout(() => {
            setPlayerBoard(myBoardData);
            setPendingPlayerBoardUpdate(null);
            pendingPlayerBoardRef.current = null;

            if (pendingOpponentBoardRef.current) {
              setOpponentBoard(pendingOpponentBoardRef.current);
              pendingOpponentBoardRef.current = null;
            }

            // Set winner after delay if game ended
            if (data.phase === "ended") {
              setGameState((prev) => ({
                ...prev,
                winner: calculateWinner(myBoardData),
              }));
              setPendingWinner(null);
            }

            delayTimeout = null;
          }, delayRef.current * 1000);
        } else {
          // No delay needed (game setup, game end, multiplayer, or already pending)
          setPlayerBoard(myBoardData);

          // If there was a pending update, clear it
          if (delayTimeout) {
            clearTimeout(delayTimeout);
            delayTimeout = null;
          }
          setPendingPlayerBoardUpdate(null);
          pendingPlayerBoardRef.current = null;

          if (data.phase === "ended") {
            setGameState((prev) => ({
              ...prev,
              winner: calculateWinner(myBoardData),
            }));
            setPendingWinner(null);
          }
        }
      }
    });

    socket.on("playerJoined", (data) => {
      setGameState((prev) => ({
        ...prev,
        participantCount: data.participantCount,
      }));
    });

    socket.on("playerReady", () => {
      setReadyStatus("Waiting for others...");
      setGameState((prev) => ({ ...prev, imReady: true }));
    });

    socket.on("playerMarkedReady", (data) => {
      setReadyStatus(`${data.playerId.slice(0, 4)} is ready!`);
      setTimeout(() => setReadyStatus(""), 3000);
    });

    socket.on("error", (data) => {
      setErrorMsg(data.message);
      setTimeout(() => setErrorMsg(""), 3000);
    });

    return () => {
      if (delayTimeout) clearTimeout(delayTimeout);
      socket.off("gameState");
      socket.off("playerJoined");
      socket.off("error");
      socket.off("shipsCleared");
      socket.off("playerReady");
      socket.off("playerMarkedReady");
      socket.disconnect();
    };
  }, []);
}