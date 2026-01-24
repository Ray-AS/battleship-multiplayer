import { SHIPS } from "./configs";

export interface Position {
  x: number;
  y: number;
}

export type Orientation = "horizontal" | "vertical";

export type CellState = "empty" | "miss" | "ship" | "hit";

export interface Cell {
  type: CellState;
  ship?: {
    specs: ShipModel;
  };
}

export type Board = Cell[][];

export const Outcome = {
  MISS: "miss",
  HIT: "hit",
  UNAVAILABLE: "unavailable",
} as const;

export type Outcome = (typeof Outcome)[keyof typeof Outcome];

export interface AttackOutcome {
  outcome: Outcome;
  shipInfo?: {
    model: ShipName;
    isSunk: boolean;
    positions?: Position[];
  };
}

export type PlayerType = "Player" | "Computer" | "None";
export type GamePhase = "setup" | "playing" | "ended";

export type ShipName = (typeof SHIPS)[number]["model"];
export type ShipLength = (typeof SHIPS)[number]["length"];

export interface ShipModel {
  model: ShipName;
  length: ShipLength;
}

export interface Move {
  attacker: "player" | "computer";
  position: Position;
  result: AttackOutcome;
  timestamp: number;
}

export interface PlacementState {
  index: number; 
  orientation: Orientation;
}

export interface GameResponse {
  gameId: string;
  phase: GamePhase;
  turn?: "player" | "computer";
  boards: {
    player: Board;
    opponent: Board;
  };
}

export interface AttackResponse {
  playerAttack: AttackOutcome;
  aiAttack: AttackOutcome | null;
  boards?: {
    player: Board;
    opponent: Board;
  };
  phase: GamePhase;
  turn?: "player" | "computer";
  history: Move[];
  error?: string;
}

export interface PlaceShipRequest {
  playerId: string;
  shipModel: ShipName;
  x: number;
  y: number;
  orientation: Orientation;
}

export interface GameState {
  id: string;
  phase: GamePhase;
  isMultiplayer: boolean;
  participantCount: number;
  winner: PlayerType;
  myTurn: boolean;
  imReady: boolean;
}