import type { FastifyInstance } from "fastify";
import * as gameController from "../controllers/gameController.ts";
import { placeShipSchema, attackSchema } from "../schemas/gameSchemas.ts";

export async function gameRoutes(fastify: FastifyInstance) {
  fastify.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status, data } = await gameController.getGame(id);
    return reply.status(status).send(data);
  });

  fastify.post("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status, data } = await gameController.createGame(id);
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
    const { status, data } = await gameController.startGame(id);
    return reply.status(status).send(data);
  });

  fastify.post(
    "/:id/attack",
    { schema: attackSchema },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status, data } = await gameController.attack(
        id,
        request.body as any,
      );
      return reply.status(status).send(data);
    },
  );
}
