import { expect, test, describe } from "vitest";
import { Ship } from "../utils/ship.ts";

describe("Ship class", () => {
  function hitShip(ship: Ship, times: number) {
    for (let i = 0; i < times; i++) {
      ship.hit();
    }
  }

  test("should create a Ship instance", () => {
    const ship = new Ship({ model: "destroyer", length: 2 });
    expect(ship).toBeDefined();
  });

  test("should show ship length", () => {
    const ship = new Ship({ model: "destroyer", length: 2 });
    expect(ship.length).toBe(2);
  });

  test("should start with 0 hits", () => {
    const ship = new Ship({ model: "destroyer", length: 2 });
    expect(ship.hits).toBe(0);
  });

  test.each([
    [0, false],
    [1, false],
    [2, true],
    [3, true],
  ])("isSunk after %i hits", (hits: number, expected: boolean) => {
    const ship = new Ship({ model: "destroyer", length: 2 });
    hitShip(ship, hits);
    expect(ship.isSunk()).toBe(expected);
  });
});
