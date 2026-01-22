import { expect, test, describe } from "vitest";
import { Computer } from "../src/utils/computer.ts";
import { Outcome } from "../src/models.ts";

describe("Computer class", () => {
  test("resetAI initializes knowledge and available hits", () => {
    const ai = new Computer();

    ai.resetAI();

    expect(ai["availableHits"].length).toBeGreaterThan(0);
    expect(ai["remainingShips"].length).toBeGreaterThan(0);
  });

  test("chooseAttack returns a valid board position", () => {
    const ai = new Computer();

    const pos = ai.chooseAttack();

    expect(pos.x).toBeGreaterThanOrEqual(0);
    expect(pos.x).toBeLessThan(ai.gameboard.boardSize);
    expect(pos.y).toBeGreaterThanOrEqual(0);
    expect(pos.y).toBeLessThan(ai.gameboard.boardSize);
  });

  test("chooseAttack never repeats positions", () => {
    const ai = new Computer();
    const seen = new Set<string>();

    for (let i = 0; i < 10; i++) {
      const pos = ai.chooseAttack();
      const key = `${pos.x},${pos.y}`;

      expect(seen.has(key)).toBe(false);
      seen.add(key);

      ai.registerOutcome(pos, { outcome: Outcome.MISS });
    }
  });

  test("registerOutcome marks miss correctly", () => {
    const ai = new Computer();
    const pos = ai.chooseAttack();

    ai.registerOutcome(pos, { outcome: Outcome.MISS });

    expect(ai["knowledgeBoard"][pos.y][pos.x]).toBe("miss");
  });

  test("registerOutcome marks sunk ship and removes it", () => {
    const ai = new Computer();
    const pos = { x: 0, y: 0 };

    ai.registerOutcome(pos, {
      outcome: Outcome.HIT,
      shipInfo: {
        model: "destroyer",
        isSunk: true,
        positions: [
          { x: 0, y: 0 },
          { x: 0, y: 1 },
        ],
      },
    });

    expect(ai["knowledgeBoard"][0][0]).toBe("sunk");
    expect(ai["knowledgeBoard"][1][0]).toBe("sunk");

    expect(ai["remainingShips"].some((s) => s.model === "destroyer")).toBe(
      false,
    );
  });

  test("AI eventually exhausts all positions", () => {
    const ai = new Computer();
    const size = ai["availableHits"].length;

    for (let i = 0; i < size; i++) {
      ai.registerOutcome(ai.chooseAttack(), { outcome: Outcome.MISS });
    }

    expect(() => ai.chooseAttack()).toThrow();
  });
});
