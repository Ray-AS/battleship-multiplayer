import Fastify from "fastify";
import { gameRoutes } from "../src/routes/gameRoutes.ts";
import { describe, expect, test, beforeEach } from "vitest";
import { gameService } from "../src/services/gameService.ts";

describe("Game routes", () => {
  let fastify: ReturnType<typeof Fastify>;
  const gameId = "integration-test";

  beforeEach(() => {
    (gameService as any).sessions.clear();
    fastify = Fastify();
    fastify.register(gameRoutes);
  });

  test("POST /:id creates a game", async () => {
    const response = await fastify.inject({
      method: "POST",
      url: `/${gameId}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.playerBoard).toBeDefined();
  });

  test("GET /:id returns game info", async () => {
    await fastify.inject({ method: "POST", url: `/${gameId}` });
    const response = await fastify.inject({ method: "GET", url: `/${gameId}` });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.boards.player).toBeDefined();
  });

  test("POST /:id/place rejects duplicate ship", async () => {
    await fastify.inject({ method: "POST", url: `/${gameId}` });
    const body = { playerId: "player", shipModel: "destroyer", x: 0, y: 0, orientation: "horizontal" };
    await fastify.inject({ method: "POST", url: `/${gameId}/place`, payload: body });
    const response = await fastify.inject({ method: "POST", url: `/${gameId}/place`, payload: body });
    expect(response.statusCode).toBe(400);
    const bodyResp = JSON.parse(response.body);
    expect(bodyResp.error).toBe("Ship already placed");
  });

  test("POST /:id/start starts game and may let AI play first", async () => {
    await fastify.inject({ method: "POST", url: `/${gameId}` });
    const response = await fastify.inject({ method: "POST", url: `/${gameId}/start` });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(["playing", "ended"]).toContain(body.phase);
    expect(["player", "computer"]).toContain(body.turn);
  });

  test("POST /:id/attack player move works and AI counterattacks", async () => {
    await fastify.inject({ method: "POST", url: `/${gameId}` });
    await fastify.inject({ method: "POST", url: `/${gameId}/start` });
    const response = await fastify.inject({ method: "POST", url: `/${gameId}/attack`, payload: { x: 0, y: 0 } });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.playerAttack).toBeDefined();
    expect(body.aiAttack).toBeDefined();
  });
});