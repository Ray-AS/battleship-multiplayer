import { SHIPS } from "./configs"; // Assuming you share or duplicate the config file

export interface Position {
  x: number;
  y: number;
}

export type Orientation = "horizontal" | "vertical";

/**
 * Matches the backend Cell type. 
 * Note: When 'masked', ship cells are converted to 'empty' by the API.
 */
export type CellState = "empty" | "miss" | "ship" | "hit";

export interface Cell {
  type: CellState;
  // ship is only present on the player's own board or when a ship is hit
  ship?: {
    specs: ShipModel;
  };
}

export type Board = Cell[][];

/**
 * Using a constant object to mirror the backend Outcome enum/const
 */
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
    positions?: Position[]; // Only sent if isSunk is true
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

/**
 * Helper for the Placement state used in the UI during setup
 */
export interface PlacementState {
  index: number; 
  orientation: Orientation;
}

// --- API RESPONSE TYPES ---

export interface GameResponse {
  gameId: string;
  phase: GamePhase;
  turn?: "player" | "computer";
  boards: {
    player: Board;
    opponent: Board; // This will be the masked version
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