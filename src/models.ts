import type { Ship } from "./utils/ship";

export interface Position {
  x: number;
  y: number;
}

export type Orientation = "horizontal" | "vertical";

interface Cell {
  type: cellState;
  value?: Ship;
}

export type Board = Cell[][];

export type cellState = "ship" | "empty" | "miss" | "hit";

export enum Outcome {
  MISS,
  HIT,
  UNAVAILABLE,
}

export type PlayerType = "Player" | "Computer" | "None";

export type BoardFunction = (
  length: number,
  position: Position,
  orientation: Orientation
) => boolean;

export type GamePhase = "setup" | "playing" | "ended";

export interface ShipModel {
  ship: "carrier" | "battleship" | "cruiser" | "submarine" | "destroyer"
  length: 5 | 4 | 3 | 2
}
