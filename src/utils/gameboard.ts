import { Ship } from "./ship";

export interface Position {
  x: number;
  y: number;
}

export type Orientation = "horizontal" | "vertical";

export enum Outcome {
  MISS,
  HIT,
  UNAVAILABLE,
}

interface Cell {
  type: "ship" | "empty" | "miss" | "hit";
  value?: Ship;
}

type Board = Cell[][];

export class Gameboard {
  private _board: Board;
  private _ship_cell_count = 0;
  private _hit_cell_count = 0;

  constructor(readonly board_size: number = 10) {
    this._board = Array.from({ length: board_size }, () =>
      Array(board_size).fill({ type: "empty" })
    );
  }

  get board() {
    return this._board;
  }

  placeShip(length: number, position: Position, orientation: Orientation) {
    if (
      position.x < 0 ||
      position.x + length > this.board_size ||
      position.y < 0 ||
      position.y + length > this.board_size
    ) {
      return false;
    }

    const ship = new Ship(length);

    for (let i = 0; i < ship.length; i++) {
      const x = orientation === "horizontal" ? position.x + i : position.x;
      const y = orientation === "vertical" ? position.y + i : position.y;

      if (this._board[y][x].type === "ship") return false;
    }

    for (let i = 0; i < ship.length; i++) {
      const x = orientation === "horizontal" ? position.x + i : position.x;
      const y = orientation === "vertical" ? position.y + i : position.y;

      this._ship_cell_count += ship.length;
      this._board[y][x] = { type: "ship", value: ship };
    }
    return true;
  }

  receiveAttack(position: Position) {
    const cell = this._board[position.y][position.x];

    if (cell.type === "ship") {
      cell.value!.hit();
      this._board[position.y][position.x] = { type: "hit" };
      this._hit_cell_count++;
      return Outcome.HIT;
    }
    else if (cell.type === "empty") {
      this._board[position.y][position.x] = {type: "miss"}
      return Outcome.MISS
    }
    else return Outcome.UNAVAILABLE
  }

  allShipsSunk() {
    return this._ship_cell_count <= this._hit_cell_count;
  }
}
