import type { FastifyInstance } from "fastify";
import * as gameController from "../controllers/gameController.ts";
import { placeShipSchema, attackSchema } from "../schemas/gameSchemas.ts";

export async function gameRoutes(fastify: FastifyInstance) {
  fastify.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { playerId } = request.query as { playerId?: string };
    
    if (!playerId) {
      return reply.status(400).send({ error: "playerId query parameter required" });

    }

    const { status, data } = await gameController.getGame(id, playerId);
    return reply.status(status).send(data);
  });

  fastify.post("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { playerId, isMultiplayer } = request.body as { playerId: string; isMultiplayer: boolean };
    const { status, data } = await gameController.createGame(id, playerId, isMultiplayer);
    return reply.status(status).send(data);
  });

  fastify.post(
    "/:id/place",
    { schema: placeShipSchema },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status, data } = await gameController.placeShip(
        id,
        request.body as any,
      );
      return reply.status(status).send(data);
    },
  );

  fastify.post("/:id/start", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { playerId } = request.body as { playerId?: string };
    
    if (!playerId) {
      return reply.status(400).send({ error: "playerId is required" });
    }
    
    const { status, data } = await gameController.startGame(id, playerId);
    return reply.status(status).send(data);
  });

  fastify.post(
    "/:id/attack",
    { schema: attackSchema },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { attackerId: string; x: number; y: number };
      const { status, data } = await gameController.attack(
        id,
        body.attackerId,
        { x: body.x, y: body.y },
      );
      return reply.status(status).send(data);
    },
  );
}
