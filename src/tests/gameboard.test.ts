import { expect, test, describe } from "vitest";
import { Outcome, type Position, type Orientation, type ShipModel } from "../models";
import { Gameboard } from "../utils/gameboard";

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

  test.each(["horizontal", "vertical"] as Orientation[])(
    `should place ship on board %sly`,
    (orientation) => {
      const gameboard = new Gameboard();
      const testModel: ShipModel = { model: "cruiser", length: 5};
      const testPosition: Position = { x: 1, y: 1 };
      const testOrientation: Orientation = orientation;
      const result = gameboard.placeShip(
        testModel,
        testPosition,
        testOrientation
      );

      expect(result).toBe(true);
      expect(
        checkBoardValues(gameboard, testPosition, testModel.length, testOrientation)
      ).toBe(true);
    }
  );

  test("should not place ship out-of-bounds on board", () => {
    const gameboard = new Gameboard();
    const result = gameboard.placeShip({ model: "cruiser", length: 5}, { x: 9, y: 9 }, "vertical");

    expect(result).toBe(false);
  });

  test("should not place ship on already occupied space", () => {
    const gameboard = new Gameboard();
    gameboard.placeShip({ model: "cruiser", length: 5}, { x: 1, y: 1 }, "vertical");
    const result = gameboard.placeShip({ model: "cruiser", length: 5}, { x: 1, y: 1 }, "vertical");

    expect(result).toBe(false);
  });

  test("should hit ship", () => {
    const gameboard = new Gameboard();
    const testPosition: Position = { x: 1, y: 1 };
    gameboard.placeShip({ model: "cruiser", length: 5}, testPosition, "vertical");
    const result = gameboard.receiveAttack(testPosition);

    expect(result.outcome).toBe(Outcome.HIT);
    expect(gameboard.board[1][1].type).toBe("hit");
  });

  test("should miss", () => {
    const gameboard = new Gameboard();
    const result = gameboard.receiveAttack({ x: 1, y: 1 });

    expect(result.outcome).toBe(Outcome.MISS);
  });

  test("should not accept same position multiple times", () => {
    const gameboard = new Gameboard();
    gameboard.receiveAttack({ x: 1, y: 1 });
    const result = gameboard.receiveAttack({ x: 1, y: 1 });

    expect(result.outcome).toBe(Outcome.UNAVAILABLE);
  });

  test("should not accept out-of-bounds position", () => {
    const gameboard = new Gameboard();
    const result = gameboard.receiveAttack({ x: -1, y: -1 });

    expect(result.outcome).toBe(Outcome.UNAVAILABLE);
  });

  test("should not report all ships sunk", () => {
    const gameboard = new Gameboard();
    const testPosition: Position = { x: 1, y: 1 };
    gameboard.placeShip({ model: "destroyer", length: 2}, testPosition, "vertical");

    expect(gameboard.allShipsSunk()).toBe(false);
  });

  test("should report all ships sunk (one ship)", () => {
    const gameboard = new Gameboard();
    const testPosition: Position = { x: 1, y: 1 };
    gameboard.placeShip({ model: "destroyer", length: 2}, testPosition, "vertical");
    gameboard.receiveAttack(testPosition);
    gameboard.receiveAttack({ x: testPosition.x, y: testPosition.y + 1 });

    expect(gameboard.allShipsSunk()).toBe(true);
  });

  test("should report all ships sunk (multiple ships)", () => {
    const gameboard = new Gameboard();
    gameboard.placeShip({ model: "destroyer", length: 2}, { x: 1, y: 1 }, "vertical");
    gameboard.placeShip({ model: "destroyer", length: 2}, { x: 2, y: 2 }, "horizontal");

    gameboard.receiveAttack({ x: 1, y: 1 });
    gameboard.receiveAttack({ x: 1, y: 2 });
    expect(gameboard.allShipsSunk()).toBe(false);

    gameboard.receiveAttack({ x: 2, y: 2 });
    gameboard.receiveAttack({ x: 3, y: 2 });
    expect(gameboard.allShipsSunk()).toBe(true);
  });
});
