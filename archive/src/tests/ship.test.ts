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

  test("should increment number of hits", () => {
    const ship = new Ship({ model: "destroyer", length: 2 });
    hitShip(ship, 1);
    expect(ship.hits).toBe(1);
  });

  test("shouldn't sink when not enough hits", () => {
    const ship = new Ship({ model: "destroyer", length: 2 });
    hitShip(ship, 1);
    expect(ship.isSunk()).toBe(false);
  });

  test("should sink after enough hits", () => {
    const ship = new Ship({ model: "destroyer", length: 2 });
    hitShip(ship, 2);
    expect(ship.isSunk()).toBe(true);
  });
});
