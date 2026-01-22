import { SHIPS } from "./configs.ts";
import type { Ship } from "./src/utils/ship.ts";

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

export const Outcome = {
  MISS: "miss",
  HIT: "hit",
  UNAVAILABLE: "unavailable",
} as const;

export type Outcome = (typeof Outcome)[keyof typeof Outcome];

export type AttackOutcome =
  | { outcome: typeof Outcome.MISS }
  | {
      outcome: typeof Outcome.HIT;
      shipInfo: {
        model: ShipName;
        isSunk: boolean;
        positions?: Position[];
      };
    }
  | { outcome: typeof Outcome.UNAVAILABLE };

export type PlayerType = "Player" | "Computer" | "None";

export type GamePhase = "setup" | "playing" | "ended";

export type ShipName = (typeof SHIPS)[number]["model"];
export type ShipLength = (typeof SHIPS)[number]["length"];

export interface ShipModel {
  model: ShipName;
  length: ShipLength;
}

export type SimulationBoard = boolean[][];

export interface Move {
  attacker: "player" | "computer";
  position: Position;
  result: AttackOutcome;
  timestamp: number;
}