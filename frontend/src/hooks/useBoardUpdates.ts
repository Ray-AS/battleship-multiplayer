import { useState, useRef } from "react";
import type { Board as BoardT, GetGameResponse, PlayerType } from "../models";
import { createEmptyBoard } from "../utils/helpers";

export function useBoardUpdates() {
  const [playerBoard, setPlayerBoard] = useState<BoardT>(createEmptyBoard());
  const [opponentBoard, setOpponentBoard] =
    useState<BoardT>(createEmptyBoard());

  const [delay, setDelay] = useState(1);
  const delayRef = useRef(1);

  const [pendingPlayerBoardUpdate, setPendingPlayerBoardUpdate] =
    useState(null);
  const pendingPlayerBoardRef = useRef(null);
  const pendingOpponentBoardRef = useRef<BoardT | null>(null);
  const [pendingWinner, setPendingWinner] = useState<PlayerType | null>(null);
  const hasAttackedRef = useRef(false);

  function shouldDelayUpdate(data: GetGameResponse): boolean {
    return (
      !data.isMultiplayer &&
      delayRef.current > 0 &&
      (data.phase === "playing" || data.phase === "ended") &&
      hasAttackedRef.current &&
      !pendingPlayerBoardRef.current
    );
  }

  const isAIThinking = pendingPlayerBoardUpdate !== null;

  return {
    playerBoard,
    setPlayerBoard,
    opponentBoard,
    setOpponentBoard,
    delay,
    setDelay,
    delayRef,
    pendingPlayerBoardUpdate,
    setPendingPlayerBoardUpdate,
    pendingPlayerBoardRef,
    pendingOpponentBoardRef,
    pendingWinner,
    setPendingWinner,
    hasAttackedRef,
    shouldDelayUpdate,
    isAIThinking,
  };
}
