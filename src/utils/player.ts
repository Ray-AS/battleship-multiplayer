import type { Orientation, ShipModel } from "../models";
import { Gameboard } from "./gameboard";

export const SHIPS = [
  {ship: "carrier", length: 5},
  {ship: "battleship", length: 4},
  {ship: "cruiser", length: 3},
  {ship: "submarine", length: 3},
  {ship: "destroyer", length: 2},
] as const;

export class Player {
  public gameboard: Gameboard;
  constructor() {
    this.gameboard = new Gameboard();
  }

  // Just pre-populate ships for now (TODO: add placement functionality)
  populate() {
    for (let i = 0; i < SHIPS.length; i++) {
      const result = this.gameboard.placeShip(
        SHIPS[i] as ShipModel,
        { x: i, y: 0 },
        "vertical"
      );
      if (!result) throw new Error("Failed to place all ships.");
    }
  }

  randomPopulate() {
    for (let i = 0; i < SHIPS.length; i++) {
      let isValid: boolean;
      let x, y, orientation: Orientation;

      do {
        isValid = true;

        x = Math.floor(Math.random() * this.gameboard.board_size);
        y = Math.floor(Math.random() * this.gameboard.board_size);

        orientation = ["horizontal", "vertical"][Math.floor(Math.random() * 2)] as Orientation;

        if (this.gameboard.isOutOfBounds(SHIPS[i].length, {x, y}, orientation)) {
          isValid = false;
          continue;
        }

        if(this.gameboard.isOccupied(SHIPS[i].length, {x, y}, orientation)) {
          isValid = false;
        }
      } while (!isValid);

      const result = this.gameboard.placeShip(
        SHIPS[i] as ShipModel,
        { x, y },
        orientation
      );
      if (!result) throw new Error("Failed to place all ships.");
    }
  }
}
