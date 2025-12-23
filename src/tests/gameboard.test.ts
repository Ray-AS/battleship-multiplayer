import { expect, test, describe } from "vitest";
import { Ship } from "../utils/ship.ts";
import { Gameboard } from "../utils/gameboard.ts";
import type { Position, Orientation } from "../utils/gameboard.ts"

describe("Gameboard class", () => {
  function checkBoardValues(
    gameboard: Gameboard,
    start: Position,
    length: number,
    orientation: Orientation
  ) {
    for (let i = 0; i < length; i++) {
      const x = orientation === "horizontal" ? start.x + i : start.x;
      const y = orientation === "vertical" ? start.y + i : start.y;
      if (gameboard.board[y][x] !== 1) return false;
    }
    return true;
  }

  test("should create a Gameboard instance", () => {
    const gameboard = new Gameboard();
    expect(gameboard).toBeDefined();
  });

  test("should place ship on board", () => {
    const gameboard = new Gameboard();

    const testShip = new Ship(3);
    const testPosition: Position = { x: 1, y: 1 };
    const testOrientation: Orientation = "horizontal";

    const result = gameboard.placeShip(testShip, testPosition, testOrientation);

    expect(result).toBe(true);
    expect(
      checkBoardValues(
        gameboard,
        testPosition,
        testShip.length,
        testOrientation
      )
    ).toBe(true);
  });

  test("should not place ship out-of-bounds on board", () => {
    const gameboard = new Gameboard();

    const result = gameboard.placeShip(new Ship(3), { x: 9, y: 9 }, "vertical");

    expect(result).toBe(false);
  });
});
