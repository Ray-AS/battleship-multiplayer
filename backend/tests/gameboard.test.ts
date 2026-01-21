import { expect, test, describe } from "vitest";
import { Gameboard } from "../utils/gameboard";
import {
  Outcome,
  type Position,
  type Orientation,
  type ShipModel,
} from "../models";

describe("Gameboard class", () => {
  function checkShipOnBoard(
    gameboard: Gameboard,
    start: Position,
    length: number,
    orientation: Orientation,
  ): boolean {
    const snapshot = gameboard.getSnapshot();
    for (let i = 0; i < length; i++) {
      const x = orientation === "horizontal" ? start.x + i : start.x;
      const y = orientation === "vertical" ? start.y + i : start.y;
      if (snapshot[y][x].type !== "ship") return false;
    }
    return true;
  }

  test("creates a Gameboard instance", () => {
    const gameboard = new Gameboard();
    expect(gameboard).toBeInstanceOf(Gameboard);
    expect(gameboard.ships.length).toBe(0);
  });

  test.each(["horizontal", "vertical"] as Orientation[])(
    "places a ship %sly",
    (orientation) => {
      const gameboard = new Gameboard();
      const model: ShipModel = { model: "cruiser", length: 3 };
      const start: Position = { x: 1, y: 1 };
      expect(gameboard.placeShip(model, start, orientation)).toBe(true);
      expect(
        checkShipOnBoard(gameboard, start, model.length, orientation),
      ).toBe(true);
      expect(gameboard.ships.length).toBe(1);
    },
  );

  test("prevents out-of-bounds placement", () => {
    const gameboard = new Gameboard();
    const result = gameboard.placeShip(
      { model: "cruiser", length: 5 },
      { x: 9, y: 9 },
      "vertical",
    );
    expect(result).toBe(false);
  });

  test("prevents placement on occupied space", () => {
    const gameboard = new Gameboard();
    gameboard.placeShip(
      { model: "destroyer", length: 2 },
      { x: 0, y: 0 },
      "horizontal",
    );
    const result = gameboard.placeShip(
      { model: "destroyer", length: 2 },
      { x: 0, y: 0 },
      "horizontal",
    );
    expect(result).toBe(false);
  });

  test("hit and miss work correctly", () => {
    const gameboard = new Gameboard();
    const shipStart: Position = { x: 0, y: 0 };
    gameboard.placeShip(
      { model: "destroyer", length: 2 },
      shipStart,
      "horizontal",
    );

    const hitResult = gameboard.receiveAttack(shipStart);
    expect(hitResult.outcome).toBe(Outcome.HIT);

    const missResult = gameboard.receiveAttack({ x: 5, y: 5 });
    expect(missResult.outcome).toBe(Outcome.MISS);

    // Cannot attack same cell twice
    const unavailableResult = gameboard.receiveAttack(shipStart);
    expect(unavailableResult.outcome).toBe(Outcome.UNAVAILABLE);

    // Cannot attack out-of-bounds
    const oobResult = gameboard.receiveAttack({ x: -1, y: 0 });
    expect(oobResult.outcome).toBe(Outcome.UNAVAILABLE);
  });

  test("allShipsSunk returns correct value", () => {
    const gameboard = new Gameboard();
    const ship1Pos: Position = { x: 0, y: 0 };
    const ship2Pos: Position = { x: 2, y: 2 };

    gameboard.placeShip(
      { model: "destroyer", length: 2 },
      ship1Pos,
      "horizontal",
    );
    gameboard.placeShip(
      { model: "destroyer", length: 2 },
      ship2Pos,
      "vertical",
    );

    expect(gameboard.allShipsSunk()).toBe(false);

    // Sink first ship
    gameboard.receiveAttack({ x: 0, y: 0 });
    gameboard.receiveAttack({ x: 1, y: 0 });
    expect(gameboard.allShipsSunk()).toBe(false);

    // Sink second ship
    gameboard.receiveAttack({ x: 2, y: 2 });
    gameboard.receiveAttack({ x: 2, y: 3 });
    expect(gameboard.allShipsSunk()).toBe(true);
  });

  test("clear resets board and ships", () => {
    const gameboard = new Gameboard();
    gameboard.placeShip(
      { model: "destroyer", length: 2 },
      { x: 0, y: 0 },
      "horizontal",
    );
    gameboard.clear();
    expect(gameboard.ships.length).toBe(0);
    const snapshot = gameboard.getSnapshot();
    snapshot.forEach((row) =>
      row.forEach((cell) => expect(cell.type).toBe("empty")),
    );
  });

  test("placing maximum ships on board works", () => {
    const gameboard = new Gameboard();
    for (let i = 0; i < 5; i++) {
      expect(
        gameboard.placeShip(
          { model: `ship${i}` as any, length: 2 },
          { x: i * 2, y: 0 },
          "vertical",
        ),
      ).toBe(true);
    }
    expect(gameboard.ships.length).toBe(5);
  });
});
