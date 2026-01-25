import { expect, test, describe, beforeEach } from "vitest";
import * as gameController from "../src/controllers/gameController.ts";
import { gameService } from "../src/services/gameService.ts";
import { SHIPS } from "../src/configs.ts";

describe("GameController", () => {
  const gameId = "test-game";
  const playerId = "player-1";

  beforeEach(() => {
    (gameService as any).sessions.clear();
  });

  test("createGame returns 200 and proper boards", async () => {
    const response = await gameController.createGame(gameId, playerId, false);
    expect(response.status).toBe(200);
    expect(response.data.playerBoard).toBeDefined();
    expect(response.data.opponentBoard).toBeDefined();
  });

  test("placeShip works for valid ship", async () => {
    await gameController.createGame(gameId, playerId, false);
    const body = {
      playerId: playerId,
      shipModel: SHIPS[0].model,
      x: 0,
      y: 0,
      orientation: "horizontal" as const,
    };
    const response = await gameController.placeShip(gameId, body);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  test("placeShip rejects duplicate ship", async () => {
    await gameController.createGame(gameId, playerId, false);
    const body = {
      playerId: playerId,
      shipModel: SHIPS[0].model,
      x: 0,
      y: 0,
      orientation: "horizontal" as const,
    };
    await gameController.placeShip(gameId, body);
    const response = await gameController.placeShip(gameId, body);
    expect(response.status).toBe(400);
    expect(response.data.error).toBe("Ship already placed");
  });

  test("getGame returns proper game info", async () => {
    await gameController.createGame(gameId, playerId, false);
    const response = await gameController.getGame(gameId, playerId);
    expect(response.status).toBe(200);
    expect(response.data.boards).toBeDefined();
  });

  test("startGame transitions phase and may let AI play first", async () => {
    await gameController.createGame(gameId, playerId, false);
    const response = await gameController.startGame(gameId, playerId);
    expect(response.status).toBe(200);
    expect(response.data.phase).toBe("playing");
    expect(response.data.turn).toBeDefined();
    expect(response.data.gameStarted).toBe(true);
  });

  test("player attack works and AI counterattacks", async () => {
    await gameController.createGame(gameId, playerId, false);
    await gameController.startGame(gameId, playerId);
    
    const session = gameService.getSession(gameId)!;
    session.turn = playerId; // Ensure it's player's turn
    
    const attackResponse = await gameController.attack(gameId, playerId, {
      x: 0,
      y: 0,
    });
    expect(attackResponse.status).toBe(200);
    expect(attackResponse.data.playerAttack).toBeDefined();
    expect(attackResponse.data.aiAttack).toBeDefined();
    expect(attackResponse.data.boards).toBeDefined();
  });

  test("getGame returns 404 for invalid game", async () => {
    const resp = await gameController.getGame("invalid-id", playerId);
    expect(resp.status).toBe(404);
  });

  test("placeShip rejects AI trying to place ship", async () => {
    await gameController.createGame(gameId, playerId, false);
    const session = gameService.getSession(gameId)!;
    const aiId = Array.from(session.participants.keys()).find(
      (id) => id !== playerId
    )!;
    
    const body = {
      playerId: aiId,
      shipModel: SHIPS[0].model,
      x: 0,
      y: 0,
      orientation: "horizontal" as const,
    };
    const resp = await gameController.placeShip(gameId, body);
    expect(resp.status).toBe(400);
    expect(resp.data.error).toBe("AI cannot place ships manually");
  });

  test("attack rejects when game not started", async () => {
    await gameController.createGame(gameId, playerId, false);
    const resp = await gameController.attack(gameId, playerId, {
      x: 0,
      y: 0,
    });
    expect(resp.status).toBe(400);
    expect(resp.data.error).toBe("Game is not in playing phase");
  });

  test("attack rejects move when not player's turn", async () => {
    await gameController.createGame(gameId, playerId, false);
    await gameController.startGame(gameId, playerId);
    const session = gameService.getSession(gameId)!;
    const opponentId = Array.from(session.participants.keys()).find(
      (id) => id !== playerId
    )!;
    session.turn = opponentId;
    
    const resp = await gameController.attack(gameId, playerId, {
      x: 0,
      y: 0,
    });
    expect(resp.status).toBe(400);
    expect(resp.data.error).toBe("It is not your turn");
  });

  test("attack rejects move already attacked", async () => {
    await gameController.createGame(gameId, playerId, false);
    await gameController.startGame(gameId, playerId);
    
    const session = gameService.getSession(gameId)!;
    session.turn = playerId;
    
    await gameController.attack(gameId, playerId, { x: 0, y: 0 });
    
    // Set turn back to player for second attack
    session.turn = playerId;
    
    const secondAttack = await gameController.attack(gameId, playerId, {
      x: 0,
      y: 0,
    });
    expect(secondAttack.status).toBe(400);
    expect(secondAttack.data.error).toBe("Invalid move");
  });

  test("clearShips works during setup phase", async () => {
    await gameController.createGame(gameId, playerId, false);
    
    // Place a ship first
    const body = {
      playerId: playerId,
      shipModel: SHIPS[0].model,
      x: 0,
      y: 0,
      orientation: "horizontal" as const,
    };
    await gameController.placeShip(gameId, body);
    
    const response = await gameController.clearShips(gameId, playerId);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  test("joinGame allows second player in multiplayer", async () => {
    await gameController.createGame(gameId, playerId, true);
    const secondPlayerId = "player-2";
    
    const response = await gameController.joinGame(gameId, secondPlayerId);
    expect(response.status).toBe(200);
    expect(response.data.gameId).toBe(gameId);
    expect(response.data.playerBoard).toBeDefined();
  });

  test("joinGame rejects joining singleplayer game", async () => {
    await gameController.createGame(gameId, playerId, false);
    const response = await gameController.joinGame(gameId, "player-2");
    expect(response.status).toBe(400);
    expect(response.data.error).toBe("Cannot join a singleplayer game");
  });
});