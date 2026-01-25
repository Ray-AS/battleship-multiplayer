import { expect, test, describe, beforeEach } from "vitest";
import { gameService } from "../src/services/gameService.ts";

describe("GameService", () => {
  const gameId = "test-game";

  beforeEach(() => {
    // Clear any existing sessions
    (gameService as any).sessions.clear();
  });

  test("can create a game", () => {
    const session = gameService.createGame(gameId);
    expect(session.id).toBe(gameId);
    expect(session.participants.has("player")).toBe(true);
    expect(session.participants.has("computer")).toBe(true);
    expect(session.phase).toBe("setup");
  });

  test("cannot create a duplicate game", () => {
    gameService.createGame(gameId);
    expect(() => gameService.createGame(gameId)).toThrow();
  });

  test("getSession returns correct session", () => {
    const created = gameService.createGame(gameId);
    const fetched = gameService.getSession(gameId);
    expect(fetched).toEqual(created);
  });

  test("getMaskedBoard hides AI ships", () => {
    const session = gameService.createGame(gameId);
    const masked = gameService.getMaskedBoard(
      session.participants.get("computer")!.gameboard,
    );
    masked.forEach((row) => {
      row.forEach((cell) => {
        expect(cell.type).not.toBe("ship");
      });
    });
  });
});
