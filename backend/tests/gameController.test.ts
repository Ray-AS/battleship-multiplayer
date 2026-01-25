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

  test("createGame handles multiplayer mode", async () => {
    const response = await gameController.createGame(gameId, playerId, true);
    expect(response.status).toBe(200);
    expect(response.data.isMultiplayer).toBe(true);
    expect(response.data.participantCount).toBe(1);
  });

  test("getGame returns proper game info", async () => {
    await gameController.createGame(gameId, playerId, false);
    const response = await gameController.getGame(gameId, playerId);
    expect(response.status).toBe(200);
    expect(response.data.boards).toBeDefined();
  });

  test("getGame returns 404 for invalid game", async () => {
    const resp = await gameController.getGame("invalid-id", playerId);
    expect(resp.status).toBe(404);
  });

  test("getGame reveals all boards when game ended", async () => {
    await gameController.createGame(gameId, playerId, false);
    await gameController.startGame(gameId, playerId);
    const session = gameService.getSession(gameId)!;
    session.phase = "ended";

    const response = await gameController.getGame(gameId, playerId);
    expect(response.data.phase).toBe("ended");
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

  test("placeShip rejects invalid ship model", async () => {
    await gameController.createGame(gameId, playerId, false);
    const body = {
      playerId: playerId,
      shipModel: "invalid-ship",
      x: 0,
      y: 0,
      orientation: "horizontal" as const,
    };
    const response = await gameController.placeShip(gameId, body);
    expect(response.status).toBe(400);
    expect(response.data.error).toBe("Invalid ship model");
  });

  test("placeShip rejects invalid placement position", async () => {
    await gameController.createGame(gameId, playerId, false);
    const body = {
      playerId: playerId,
      shipModel: SHIPS[0].model,
      x: 100,
      y: 100,
      orientation: "horizontal" as const,
    };
    const response = await gameController.placeShip(gameId, body);
    expect(response.status).toBe(400);
    expect(response.data.error).toBe("Invalid ship placement");
  });

  test("placeShip rejects after game started", async () => {
    await gameController.createGame(gameId, playerId, false);
    await gameController.startGame(gameId, playerId);

    const body = {
      playerId: playerId,
      shipModel: SHIPS[0].model,
      x: 0,
      y: 0,
      orientation: "horizontal" as const,
    };
    const response = await gameController.placeShip(gameId, body);
    expect(response.status).toBe(400);
    expect(response.data.error).toBe(
      "Ships can only be placed during setup phase",
    );
  });

  test("placeShip rejects AI trying to place ship", async () => {
    await gameController.createGame(gameId, playerId, false);
    const session = gameService.getSession(gameId)!;
    const aiId = Array.from(session.participants.keys()).find(
      (id) => id !== playerId,
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

  test("placeShip rejects non-existent player", async () => {
    await gameController.createGame(gameId, playerId, false);
    const body = {
      playerId: "non-existent",
      shipModel: SHIPS[0].model,
      x: 0,
      y: 0,
      orientation: "horizontal" as const,
    };
    const response = await gameController.placeShip(gameId, body);
    expect(response.status).toBe(404);
    expect(response.data.error).toBe("Player not found");
  });

  test("startGame transitions phase and may let AI play first", async () => {
    await gameController.createGame(gameId, playerId, false);
    const response = await gameController.startGame(gameId, playerId);
    expect(response.status).toBe(200);
    expect(response.data.phase).toBe("playing");
    expect(response.data.turn).toBeDefined();
    expect(response.data.gameStarted).toBe(true);
  });

  test("startGame rejects if already started", async () => {
    await gameController.createGame(gameId, playerId, false);
    await gameController.startGame(gameId, playerId);
    const response = await gameController.startGame(gameId, playerId);
    expect(response.status).toBe(400);
    expect(response.data.error).toBe("Game has already started");
  });

  test("startGame rejects incomplete ship placement", async () => {
    await gameController.createGame(gameId, playerId, false);
    await gameController.placeShip(gameId, {
      playerId: playerId,
      shipModel: SHIPS[0].model,
      x: 0,
      y: 0,
      orientation: "horizontal" as const,
    });

    const response = await gameController.startGame(gameId, playerId);
    expect(response.status).toBe(400);
    expect(response.data.error).toBe("Not all ships have been placed");
  });

  test("startGame waits for second player in multiplayer", async () => {
    await gameController.createGame(gameId, playerId, true);
    const response = await gameController.startGame(gameId, playerId);
    expect(response.status).toBe(400);
    expect(response.data.error).toBe("Waiting for second player to join");
  });

  test("startGame starts when both players ready in multiplayer", async () => {
    await gameController.createGame(gameId, playerId, true);
    await gameController.joinGame(gameId, "player-2");
    await gameController.startGame(gameId, playerId);
    const response = await gameController.startGame(gameId, "player-2");
    expect(response.status).toBe(200);
    expect(response.data.phase).toBe("playing");
  });

  test("startGame rejects non-existent player", async () => {
    await gameController.createGame(gameId, playerId, false);
    const response = await gameController.startGame(gameId, "non-existent");
    expect(response.status).toBe(404);
    expect(response.data.error).toBe("Player not found in session");
  });

  test("player attack works and AI counterattacks", async () => {
    await gameController.createGame(gameId, playerId, false);
    await gameController.startGame(gameId, playerId);

    const session = gameService.getSession(gameId)!;
    session.turn = playerId;

    const attackResponse = await gameController.attack(gameId, playerId, {
      x: 0,
      y: 0,
    });
    expect(attackResponse.status).toBe(200);
    expect(attackResponse.data.playerAttack).toBeDefined();
    expect(attackResponse.data.aiAttack).toBeDefined();
    expect(attackResponse.data.boards).toBeDefined();
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
      (id) => id !== playerId,
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
    session.turn = playerId;

    const secondAttack = await gameController.attack(gameId, playerId, {
      x: 0,
      y: 0,
    });
    expect(secondAttack.status).toBe(400);
    expect(secondAttack.data.error).toBe("Invalid move");
  });

  test("attack rejects non-existent attacker", async () => {
    await gameController.createGame(gameId, playerId, false);
    await gameController.startGame(gameId, playerId);

    const response = await gameController.attack(gameId, "non-existent", {
      x: 0,
      y: 0,
    });
    expect(response.status).toBe(404);
    expect(response.data.error).toBe("Attacker not found");
  });

  test("attack ends game when all ships sunk", async () => {
    await gameController.createGame(gameId, playerId, false);
    await gameController.startGame(gameId, playerId);

    const session = gameService.getSession(gameId)!;
    session.turn = playerId;

    const opponentId = Array.from(session.participants.keys()).find(
      (id) => id !== playerId,
    )!;
    const opponent = session.participants.get(opponentId)!;

    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        if (x === 0 && y === 0) continue;
        opponent.gameboard.receiveAttack({ x, y });
      }
    }

    session.turn = playerId;
    const response = await gameController.attack(gameId, playerId, {
      x: 0,
      y: 0,
    });

    expect(response.status).toBe(200);
    expect(response.data.phase).toBe("ended");
    expect(response.data.turn).toBe("");
  });

  test("attack switches turn in multiplayer", async () => {
    await gameController.createGame(gameId, playerId, true);
    const player2Id = "player-2";
    await gameController.joinGame(gameId, player2Id);
    await gameController.startGame(gameId, playerId);
    await gameController.startGame(gameId, player2Id);

    const session = gameService.getSession(gameId)!;
    session.turn = playerId;

    const response = await gameController.attack(gameId, playerId, {
      x: 0,
      y: 0,
    });

    expect(response.status).toBe(200);
    expect(response.data.turn).toBe(player2Id);
  });

  test("joinGame allows second player in multiplayer", async () => {
    await gameController.createGame(gameId, playerId, true);
    const response = await gameController.joinGame(gameId, "player-2");
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

  test("joinGame rejects duplicate player ID", async () => {
    await gameController.createGame(gameId, playerId, true);
    const response = await gameController.joinGame(gameId, playerId);
    expect(response.status).toBe(400);
    expect(response.data.error).toBe("Player ID already taken in this game");
  });

  test("joinGame rejects full game", async () => {
    await gameController.createGame(gameId, playerId, true);
    await gameController.joinGame(gameId, "player-2");
    const response = await gameController.joinGame(gameId, "player-3");
    expect(response.status).toBe(400);
    expect(response.data.error).toBe("Game is already full");
  });

  test("clearShips works during setup phase", async () => {
    await gameController.createGame(gameId, playerId, false);
    await gameController.placeShip(gameId, {
      playerId: playerId,
      shipModel: SHIPS[0].model,
      x: 0,
      y: 0,
      orientation: "horizontal" as const,
    });

    const response = await gameController.clearShips(gameId, playerId);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  test("clearShips rejects after game started", async () => {
    await gameController.createGame(gameId, playerId, false);
    await gameController.startGame(gameId, playerId);

    const response = await gameController.clearShips(gameId, playerId);
    expect(response.status).toBe(400);
    expect(response.data.error).toBe(
      "Ships can only be cleared during setup phase",
    );
  });

  test("clearShips rejects AI player", async () => {
    await gameController.createGame(gameId, playerId, false);
    const session = gameService.getSession(gameId)!;
    const aiId = Array.from(session.participants.keys()).find(
      (id) => id !== playerId,
    )!;

    const response = await gameController.clearShips(gameId, aiId);
    expect(response.status).toBe(400);
    expect(response.data.error).toBe("AI cannot clear ships manually");
  });
});
