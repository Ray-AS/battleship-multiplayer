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

export interface DisplayCell extends Cell {
  x: number;
  y: number;
}

export type Board = Cell[][];

export type cellState = "ship" | "empty" | "miss" | "hit";

export enum Outcome {
  MISS,
  HIT,
  UNAVAILABLE,
}

export type PlayerType = "Player" | "Computer";