import { expect, test, describe } from "vitest";
import { Ship } from "../utils/ship.ts";

describe("Ship class", () => {
  function hitShip(ship: Ship, times: number) {
    for (let i = 0; i < times; i++) ship.hit();
  }

  test("creates a Ship instance", () => {
    const ship = new Ship({ model: "destroyer", length: 2 });
    expect(ship).toBeInstanceOf(Ship);
    expect(ship.hits).toBe(0);
    expect(ship.isSunk()).toBe(false);
  });

  test("increments hits correctly", () => {
    const ship = new Ship({ model: "destroyer", length: 2 });
    hitShip(ship, 1);
    expect(ship.hits).toBe(1);
    expect(ship.isSunk()).toBe(false);

    hitShip(ship, 1);
    expect(ship.hits).toBe(2);
    expect(ship.isSunk()).toBe(true);

    // Extra hits should not increment
    hitShip(ship, 1);
    expect(ship.hits).toBe(2);
  });
});
