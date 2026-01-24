import { useState } from "react";
import type { GamePhase, PlayerType, PlacementState, GameState } from "../models";

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    id: "",
    phase: "setup" as GamePhase,
    isMultiplayer: false,
    participantCount: 1,
    winner: "None" as PlayerType,
    myTurn: false,
    imReady: false,
  });

  const [placement, setPlacement] = useState<PlacementState | null>(null);
  const [joinMode, setJoinMode] = useState(false);
  const [joinId, setJoinId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [readyStatus, setReadyStatus] = useState("");

  return {
    gameState,
    setGameState,
    placement,
    setPlacement,
    joinMode,
    setJoinMode,
    joinId,
    setJoinId,
    errorMsg,
    setErrorMsg,
    readyStatus,
    setReadyStatus,
  };
}