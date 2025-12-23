import { expect, test, describe } from "vitest";
import {
  Gameboard,
  Outcome,
  type Position,
  type Orientation,
} from "../utils/gameboard.ts";

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
      if (!(gameboard.board[y][x].type === "ship")) return false;
    }
    return true;
  }

  test("should create a Gameboard instance", () => {
    const gameboard = new Gameboard();
    expect(gameboard).toBeDefined();
  });

  test("should place ship on board", () => {
    const gameboard = new Gameboard();
    const testLength = 3;
    const testPosition: Position = { x: 1, y: 1 };
    const testOrientation: Orientation = "horizontal";
    const result = gameboard.placeShip(testLength, testPosition, testOrientation);

    expect(result).toBe(true);
    expect(
      checkBoardValues(
        gameboard,
        testPosition,
        testLength,
        testOrientation
      )
    ).toBe(true);
  });

  test("should not place ship out-of-bounds on board", () => {
    const gameboard = new Gameboard();
    const result = gameboard.placeShip(3, { x: 9, y: 9 }, "vertical");

    expect(result).toBe(false);
  });

  test("should not place ship on already occupied space", () => {
    const gameboard = new Gameboard();
    gameboard.placeShip(3, { x: 1, y: 1 }, "vertical");
    const result = gameboard.placeShip(3, { x: 1, y: 1 }, "vertical");

    expect(result).toBe(false);
  });

  test("should hit ship", () => {
    const gameboard = new Gameboard();
    const testPosition: Position = { x: 1, y: 1 };
    gameboard.placeShip(3, testPosition, "vertical");
    const result = gameboard.receiveAttack(testPosition);

    expect(result).toBe(Outcome.HIT);
  });

  test("should miss", () => {
    const gameboard = new Gameboard();
    const result = gameboard.receiveAttack({ x: 1, y: 1 });

    expect(result).toBe(Outcome.MISS);
  });

  test("should not accept same position multiple times", () => {
    const gameboard = new Gameboard();
    gameboard.receiveAttack({ x: 1, y: 1 });
    const result = gameboard.receiveAttack({ x: 1, y: 1 });

    expect(result).toBe(Outcome.UNAVAILABLE);
  });

  test("should report all ships sunk", () => {
    const gameboard = new Gameboard();
    const testPosition: Position = { x: 1, y: 1 };
    gameboard.placeShip(1, testPosition, "vertical");
    gameboard.receiveAttack(testPosition);

    expect(gameboard.allShipsSunk()).toBe(true);
  });

  test("should not report all ships sunk", () => {
    const gameboard = new Gameboard();
    const testPosition: Position = { x: 1, y: 1 };
    gameboard.placeShip(1, testPosition, "vertical");

    expect(gameboard.allShipsSunk()).toBe(false);
  });
});
