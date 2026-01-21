import { SHIPS } from "./configs";
import type { Ship } from "./utils/ship";

export interface Position {
  x: number;
  y: number;
}

export type Orientation = "horizontal" | "vertical";

export type Cell =
  | { type: "empty" }
  | { type: "miss" }
  | { type: "ship"; ship: Ship }
  | { type: "hit"; ship: Ship };

export type Board = Cell[][];

// export type cellState = "ship" | "empty" | "miss" | "hit";

export enum Outcome {
  MISS,
  HIT,
  UNAVAILABLE,
}

export type AttackOutcome =
  | { outcome: Outcome.MISS }
  | {
      outcome: Outcome.HIT;
      shipInfo: {
        model: ShipName;
        isSunk: boolean;
        positions?: Position[];
      };
    }
  | { outcome: Outcome.UNAVAILABLE };

export type PlayerType = "Player" | "Computer" | "None";

export type GamePhase = "setup" | "playing" | "ended";

export type ShipName = (typeof SHIPS)[number]["model"];
export type ShipLength = (typeof SHIPS)[number]["length"];

export interface ShipModel {
  model: ShipName;
  length: ShipLength;
}

export type SimulationBoard = boolean[][];
