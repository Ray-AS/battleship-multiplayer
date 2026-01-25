import { expect, test, describe } from "vitest";
import { Player } from "../src/utils/player.ts";
import { SHIPS } from "../src/configs.ts";
import { Outcome } from "../src/models.ts";

describe("Player class", () => {
  test("creates a Player with an empty gameboard", () => {
    const player = new Player();
    expect(player.gameboard).toBeDefined();
    expect(player.gameboard.ships.length).toBe(0);
  });

  test("populate places all ships", () => {
    const player = new Player();
    player.populate();

    expect(player.gameboard.ships.length).toBe(SHIPS.length);

    // No ship should be sunk initially
    expect(player.gameboard.allShipsSunk()).toBe(false);
  });

  test("randomPopulate places all ships", () => {
    const player = new Player();
    player.randomPopulate();

    expect(player.gameboard.ships.length).toBe(SHIPS.length);
  });

  test("randomPopulate does not overlap ships", () => {
    const player = new Player();
    player.randomPopulate();

    const snapshot = player.gameboard.getSnapshot();
    const shipCells = snapshot.flat().filter((cell) => cell.type === "ship");

    const totalShipLength = SHIPS.reduce((sum, ship) => sum + ship.length, 0);

    expect(shipCells.length).toBe(totalShipLength);
  });

  test("randomPopulate places ships within bounds", () => {
    const player = new Player();
    player.randomPopulate();

    const snapshot = player.gameboard.getSnapshot();
    snapshot.forEach((row) =>
      row.forEach((cell) => expect(["empty", "ship"]).toContain(cell.type)),
    );
  });

  test("player ships can all be sunk after attacks", () => {
    const player = new Player();
    player.populate();

    const snapshot = player.gameboard.getSnapshot();

    snapshot.forEach((row, y) =>
      row.forEach((cell, x) => {
        if (cell.type === "ship") {
          const result = player.gameboard.receiveAttack({ x, y });
          expect(result.outcome).toBe(Outcome.HIT);
        }
      }),
    );

    expect(player.gameboard.allShipsSunk()).toBe(true);
  });
});
