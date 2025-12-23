import type { Ship } from "./ship";

export interface Position {
  x: number;
  y: number;
}

export type Orientation = "horizontal" | "vertical";

type Board = number[][];

export class Gameboard {
  private _board: Board;

  constructor(readonly board_size: number = 10) {
    this._board = Array.from({ length: board_size }, () =>
      Array(board_size).fill(0)
    );
  }

  get board() {
    return this._board;
  }

  private toggle_cell(position: Position) {
    this._board[position.y][position.x] += this._board[position.y][position.x]
      ? -1
      : 1;
  }

  placeShip(ship: Ship, position: Position, orientation: Orientation) {
    if (
      position.x < 0 ||
      position.x + ship.length > this.board_size ||
      position.y < 0 ||
      position.y + ship.length > this.board_size
    ) {
      return false;
    }

    for (let i = 0; i < ship.length; i++) {
      const x = orientation === "horizontal" ? position.x + i : position.x;
      const y = orientation === "vertical" ? position.y + i : position.y;
      this.toggle_cell({ x, y });
    }
    return true;
  }
}
