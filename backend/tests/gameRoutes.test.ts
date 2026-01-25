import Fastify from "fastify";
import { gameRoutes } from "../src/routes/gameRoutes.ts";
import { describe, expect, test, beforeEach } from "vitest";
import { gameService } from "../src/services/gameService.ts";
import { SHIPS } from "../src/configs.ts";

describe("Game routes", () => {
  let fastify: ReturnType<typeof Fastify>;
  const gameId = "integration-test";
  const playerId = "player-1";

  beforeEach(() => {
    (gameService as any).sessions.clear();
    fastify = Fastify();
    fastify.register(gameRoutes);
  });

  test("POST /:id creates a game", async () => {
    const response = await fastify.inject({
      method: "POST",
      url: `/${gameId}`,
      payload: {
        playerId,
        isMultiplayer: false,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.playerBoard).toBeDefined();
  });

  test("GET /:id returns game info", async () => {
    await fastify.inject({
      method: "POST",
      url: `/${gameId}`,
      payload: { playerId, isMultiplayer: false },
    });
    const response = await fastify.inject({
      method: "GET",
      url: `/${gameId}?playerId=${playerId}`,
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.boards).toBeDefined();
  });

  test("POST /:id/place rejects duplicate ship", async () => {
    await fastify.inject({
      method: "POST",
      url: `/${gameId}`,
      payload: { playerId, isMultiplayer: false },
    });
    const shipPayload = {
      playerId: playerId,
      shipModel: SHIPS[0].model,
      x: 0,
      y: 0,
      orientation: "horizontal",
    };
    await fastify.inject({
      method: "POST",
      url: `/${gameId}/place`,
      payload: shipPayload,
    });
    const response = await fastify.inject({
      method: "POST",
      url: `/${gameId}/place`,
      payload: shipPayload,
    });
    expect(response.statusCode).toBe(400);
    const bodyResp = JSON.parse(response.body);
    expect(bodyResp.error).toBe("Ship already placed");
  });

  test("POST /:id/start starts game and may let AI play first", async () => {
    await fastify.inject({
      method: "POST",
      url: `/${gameId}`,
      payload: { playerId, isMultiplayer: false },
    });
    const response = await fastify.inject({
      method: "POST",
      url: `/${gameId}/start`,
      payload: { playerId },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.phase).toBe("playing");
    expect(body.gameStarted).toBe(true);
  });

  test("POST /:id/attack player move works and AI counterattacks", async () => {
    await fastify.inject({
      method: "POST",
      url: `/${gameId}`,
      payload: { playerId, isMultiplayer: false },
    });
    await fastify.inject({
      method: "POST",
      url: `/${gameId}/start`,
      payload: { playerId },
    });
    const response = await fastify.inject({
      method: "POST",
      url: `/${gameId}/attack`,
      payload: { attackerId: playerId, x: 0, y: 0 },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.playerAttack).toBeDefined();
    expect(body.aiAttack).toBeDefined();
  });
});
