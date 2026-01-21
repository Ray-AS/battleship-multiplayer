import { DEFAULT_BOARD_SIZE } from "../../configs.ts";
import {
  type Cell,
  Outcome,
  type AttackOutcome,
  type Board,
  type Orientation,
  type Position,
  type ShipModel,
} from "../../models.ts";
import { Ship } from "./ship.ts";

export class Gameboard {
  readonly boardSize: number;
  private _board: Board;
  private _ships: Ship[] = [];

  constructor(boardSize: number = DEFAULT_BOARD_SIZE) {
    this.boardSize = boardSize;
    this._board = this.createEmptyBoard();
  }

  private createEmptyBoard(): Board {
    return Array.from({ length: this.boardSize }, () =>
      Array.from({ length: this.boardSize }, (): Cell => ({ type: "empty" })),
    );
  }

  getSnapshot(): Board {
    return structuredClone(this._board);
  }

  get ships(): readonly Ship[] {
    return this._ships;
  }

  isOutOfBounds(
    length: number,
    position: Position,
    orientation: Orientation,
  ): boolean {
    if (position.x < 0 || position.y < 0) return true;

    if (orientation === "horizontal" && position.x + length > this.boardSize) {
      return true;
    }

    if (orientation === "vertical" && position.y + length > this.boardSize) {
      return true;
    }

    return false;
  }

  isOccupied(
    length: number,
    position: Position,
    orientation: Orientation,
  ): boolean {
    for (let i = 0; i < length; i++) {
      const x = orientation === "horizontal" ? position.x + i : position.x;
      const y = orientation === "vertical" ? position.y + i : position.y;

      const cell = this._board[y][x];
      if (cell.type === "ship" || cell.type === "hit") return true;
    }
    return false;
  }

  placeShip(
    shipModel: ShipModel,
    position: Position,
    orientation: Orientation,
  ): boolean {
    if (this.isOutOfBounds(shipModel.length, position, orientation)) {
      return false;
    }

    if (this.isOccupied(shipModel.length, position, orientation)) {
      return false;
    }

    const ship = new Ship(shipModel);
    this._ships.push(ship);

    for (let i = 0; i < ship.length; i++) {
      const x = orientation === "horizontal" ? position.x + i : position.x;
      const y = orientation === "vertical" ? position.y + i : position.y;

      ship.positions.push({ x, y });
      this._board[y][x] = { type: "ship", ship };
    }

    return true;
  }

  receiveAttack(position: Position): AttackOutcome {
    // Out of bounds
    if (
      position.x < 0 ||
      position.y < 0 ||
      position.x >= this.boardSize ||
      position.y >= this.boardSize
    ) {
      return { outcome: Outcome.UNAVAILABLE };
    }

    const cell = this._board[position.y][position.x];

    // Already attacked
    if (cell.type === "hit" || cell.type === "miss") {
      return { outcome: Outcome.UNAVAILABLE };
    }

    // Miss
    if (cell.type === "empty") {
      this._board[position.y][position.x] = { type: "miss" };
      return { outcome: Outcome.MISS };
    }

    // Hit
    const ship = cell.ship;
    ship.hit();
    this._board[position.y][position.x] = { type: "hit", ship };

    const isSunk = ship.isSunk();

    // Only include positions if the ship is sunk
    const shipInfo: {
      model: typeof ship.specs.model;
      isSunk: boolean;
      positions?: Position[];
    } = {
      model: ship.specs.model,
      isSunk,
      ...(isSunk && { positions: [...ship.positions] }),
    };

    return {
      outcome: Outcome.HIT,
      shipInfo,
    };
  }

  allShipsSunk(): boolean {
    return this._ships.length > 0 && this._ships.every((s) => s.isSunk());
  }

  clear(): void {
    this._board = this.createEmptyBoard();
    this._ships = [];
  }
}
