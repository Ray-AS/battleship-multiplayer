import { createContext } from "react";
import type { PlayerType } from "../models";

export const PlayerContext = createContext<{
  currentPlayer: PlayerType;
  setCurrentPlayer: React.Dispatch<React.SetStateAction<PlayerType>>;
} | null>(null);
