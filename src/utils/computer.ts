import { DEFAULT_BOARD_SIZE } from "../configs";
import type { Position } from "../models";
import { Player } from "./player";

export class Computer extends Player {
  // Keep track of previously hit positions to ensure no repetition
  constructor(private prevHit: Position[] = []) {
    super();
  }

  // Random attack choosing for now (TODO: implement smarter algorithm)
  chooseAttackRandom(): Position {
    if (this.prevHit.length >= DEFAULT_BOARD_SIZE**2) {
      throw new Error("All positions exhausted");
    }

    let cellPosition: Position;

    do {
      cellPosition = {
        x: Math.floor(Math.random() * DEFAULT_BOARD_SIZE),
        y: Math.floor(Math.random() * DEFAULT_BOARD_SIZE),
      };
    } while (
      this.prevHit.some(
        (position) => position.x === cellPosition.x && position.y === cellPosition.y
      )
    );

    this.prevHit.push(cellPosition);
    return cellPosition;
  }
}
