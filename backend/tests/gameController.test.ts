import { expect, test, describe, beforeEach } from "vitest";
import * as gameController from "../src/controllers/gameController.ts";
import { gameService } from "../src/services/gameService.ts";
import { SHIPS } from "../src/configs.ts";

describe("GameController", () => {
  const gameId = "test-game";

  beforeEach(() => {
    (gameService as any).sessions.clear();
  });

  test("createGame returns 200 and proper boards", async () => {
    const response = await gameController.createGame(gameId);
    expect(response.status).toBe(200);
    expect(response.data.playerBoard).toBeDefined();
    expect(response.data.opponentBoard).toBeDefined();
  });

  test("placeShip works for valid ship", async () => {
    await gameController.createGame(gameId);
    const body = { playerId: "player", shipModel: SHIPS[0].model, x: 0, y: 0, orientation: "horizontal" } as const;
    const response = await gameController.placeShip(gameId, body);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  test("placeShip rejects duplicate ship", async () => {
    await gameController.createGame(gameId);
    const body = { playerId: "player", shipModel: SHIPS[0].model, x: 0, y: 0, orientation: "horizontal" } as const;
    await gameController.placeShip(gameId, body);
    const response = await gameController.placeShip(gameId, body);
    expect(response.status).toBe(400);
    expect(response.data.error).toBe("Ship already placed");
  });

  test("getGame returns proper game info", async () => {
    await gameController.createGame(gameId);
    const response = await gameController.getGame(gameId);
    expect(response.status).toBe(200);
    expect(response.data.boards).toBeDefined();
    if(response.data.boards) {
      expect(response.data.boards.player).toBeDefined();
      expect(response.data.boards.opponent).toBeDefined();
    }
  });

  test("startGame transitions phase and may let AI play first", async () => {
    await gameController.createGame(gameId);
    // Optionally place all ships or let randomPopulate handle
    const response = await gameController.startGame(gameId);
    expect(response.status).toBe(200);
    expect(["playing", "ended"]).toContain(response.data.phase);
    expect(["player", "computer"]).toContain(response.data.turn);
    expect(response.data.boards).toBeDefined();
    if(response.data.boards)
      expect(response.data.boards.player).toBeDefined();
  });

  test("player attack works and AI counterattacks", async () => {
    await gameController.createGame(gameId);
    await gameController.startGame(gameId);
    const attackResponse = await gameController.attack(gameId, { x: 0, y: 0 });
    expect(attackResponse.status).toBe(200);
    expect(attackResponse.data.playerAttack).toBeDefined();
    expect(attackResponse.data.aiAttack).toBeDefined();
    expect(attackResponse.data.boards).toBeDefined();
    if(attackResponse.data.boards)
      expect(attackResponse.data.boards.player).toBeDefined();
  });

  test("getGame returns 404 for invalid game", async () => {
    const resp = await gameController.getGame("invalid-id");
    expect(resp.status).toBe(404);
  });

  test("placeShip rejects AI trying to place ship", async () => {
    await gameController.createGame(gameId);
    const body = { playerId: "computer", shipModel: SHIPS[0].model, x: 0, y: 0, orientation: "horizontal" } as const;
    const resp = await gameController.placeShip(gameId, body);
    expect(resp.status).toBe(400);
    expect(resp.data.error).toBe("AI cannot place ships manually");
  });

  test("attack rejects when game not started", async () => {
    await gameController.createGame(gameId);
    const session = gameService.getSession(gameId)!;
    session.turn = "player";
    const resp = await gameController.attack(gameId, { x: 0, y: 0 });
    expect(resp.status).toBe(400);
    expect(resp.data.error).toBe("Game is not in playing phase");
  });

  test("attack rejects move when not player's turn", async () => {
    await gameController.createGame(gameId);
    await gameController.startGame(gameId);
    const session = gameService.getSession(gameId)!;
    session.turn = "computer";
    const resp = await gameController.attack(gameId, { x: 0, y: 0 });
    expect(resp.status).toBe(400);
    expect(resp.data.error).toBe("It is not your turn");
  });

  test("attack rejects move outside board / already attacked", async () => {
    await gameController.createGame(gameId);
    await gameController.startGame(gameId);
    await gameController.attack(gameId, { x: 0, y: 0 });
    // Repeat same attack
    const secondAttack = await gameController.attack(gameId, { x: 0, y: 0 });
    expect(secondAttack.status).toBe(400);
    expect(secondAttack.data.error).toBe("Invalid move");
  });
});