import { DEFAULT_BOARD_SIZE } from "../configs";
import { Outcome, type Board, type BoardFunction, type Orientation, type Position, type ShipModel } from "../models";
import { Ship } from "./ship";

export class Gameboard {
  private _board: Board;
  private _ships: Ship[] = [];

  constructor(readonly board_size: number = DEFAULT_BOARD_SIZE) {
    // Initialize a board with all cell states being empty
    this._board = Array.from({ length: board_size }, () =>
      Array.from({ length: board_size }, () => ({ type: "empty" } as const))
    );
  }

  get board() {
    return this._board;
  }

  isOutOfBounds: BoardFunction = (length, position, orientation) => {
    if (
      position.x < 0 ||
      position.y < 0 ||
      (orientation === "horizontal" && position.x + length > this.board_size) ||
      (orientation === "vertical" && position.y + length > this.board_size)
    ) {
      return true;
    }
    return false;
  }
  
  isOccupied: BoardFunction = (length, position, orientation) => {
    for (let i = 0; i < length; i++) {
      const x = orientation === "horizontal" ? position.x + i : position.x;
      const y = orientation === "vertical" ? position.y + i : position.y;

      if (this._board[y][x].type === "ship") return true;
    }
    return false;
  }

  placeShip = (shipToPlace: ShipModel, position: Position, orientation: Orientation) => {
    if (this.isOutOfBounds(shipToPlace.length, position, orientation)) return false;
    if (this.isOccupied(shipToPlace.length, position, orientation)) return false;

    const ship = new Ship(shipToPlace);
    this._ships.push(ship);

    for (let i = 0; i < ship.length; i++) {
      const x = orientation === "horizontal" ? position.x + i : position.x;
      const y = orientation === "vertical" ? position.y + i : position.y;

      this._board[y][x] = { type: "ship", value: ship };
    }

    return true;
  }

  receiveAttack(position: Position) {
    // Prevent out of bounds attacks
    if (
      position.x < 0 ||
      position.y < 0 ||
      position.x >= this.board_size ||
      position.y >= this.board_size
    ) {
      return Outcome.UNAVAILABLE;
    }

    const cell = this._board[position.y][position.x];

    if (cell.type === "ship") {
      cell.type = "hit";
      cell.value!.hit();
      return Outcome.HIT;
    } else if (cell.type === "empty") {
      cell.type = "miss";
      return Outcome.MISS;
    } else return Outcome.UNAVAILABLE;
  }

  allShipsSunk() {
    return this._ships.every((ship) => ship.isSunk());
  }

  clear() {
    this._board = Array.from({ length: this.board_size }, () =>
      Array.from({ length: this.board_size }, () => ({ type: "empty" } as const))
    );
    this._ships = [];
  }
}
