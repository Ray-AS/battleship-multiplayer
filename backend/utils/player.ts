import { SHIPS } from "../configs.ts";
import type { Orientation, ShipModel } from "../models.ts";
import { Gameboard } from "./gameboard.ts";

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
        "vertical",
      );
      if (!result) throw new Error("Failed to place all ships.");
    }
  }

  randomPopulate() {
    for (let i = 0; i < SHIPS.length; i++) {
      let isValid: boolean;
      let x, y, orientation: Orientation;

      let attempts = 0;
      do {
        attempts++;
        if (attempts > 100) throw new Error("Failed to place ship randomly.");
        isValid = true;

        x = Math.floor(Math.random() * this.gameboard.boardSize);
        y = Math.floor(Math.random() * this.gameboard.boardSize);

        orientation = Math.random() < 0.5 ? "horizontal" : "vertical";

        if (
          this.gameboard.isOutOfBounds(SHIPS[i].length, { x, y }, orientation)
        ) {
          isValid = false;
          continue;
        }

        if (this.gameboard.isOccupied(SHIPS[i].length, { x, y }, orientation)) {
          isValid = false;
        }
      } while (!isValid);

      const result = this.gameboard.placeShip(
        SHIPS[i] as ShipModel,
        { x, y },
        orientation,
      );
      if (!result) throw new Error("Failed to place all ships.");
    }
  }
}
