import { Gameboard } from "./gameboard";

const SHIP_LENGTHS = [5, 4, 3, 3, 2];

export class Player {
  public gameboard: Gameboard;
  constructor() {
    this.gameboard = new Gameboard();
    // this.populate();
  }

  // Just pre-populate ships for now; will add placement functionality later
  populate() {
    for(let i = 0; i < SHIP_LENGTHS.length; i++) {
      const result = this.gameboard.placeShip(SHIP_LENGTHS[i], {x: i, y: 0}, "vertical")
      if (!result) throw new Error("Failed to place all ships.");
    }
  }
}
