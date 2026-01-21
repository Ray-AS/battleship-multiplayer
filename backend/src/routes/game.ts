import type { FastifyInstance } from "fastify";
import { gameService } from "../services/gameService.ts";

export async function game(fastify: FastifyInstance) {
  // Start Game: Initializes the session
  fastify.post("/:id/start", async (request, reply) => {
    const { id } = request.params as { id: string };
    const session = gameService.createGame(id);

    return {
      gameId: id,
      phase: session.phase,
      playerBoard: session.player.gameboard.getSnapshot(),
      opponentBoard: gameService.getMaskedBoard(session.computer.gameboard)
    };
  });

  // Attack: Process player move and AI counter-move
  const attackBodySchema = {
    type: 'object',
    required: ['x', 'y'],
    properties: {
      x: { type: 'integer', minimum: 0 },
      y: { type: 'integer', minimum: 0 }
    }
  };

  // Add the schema to the route
  fastify.post("/:id/attack", {
    schema: {
      body: attackBodySchema,
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            playerAttack: { type: 'object', additionalProperties: true },
            aiAttack: { type: 'object', additionalProperties: true },
            boards: { type: 'object', additionalProperties: true }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { x, y } = request.body as { x: number, y: number };
    const session = gameService.getSession(id);

    if (!session) return reply.status(404).send({ error: "Game not found" });

    // 1. Player attacks Computer
    const playerAttack = session.computer.gameboard.receiveAttack({ x, y });
    
    // 2. Computer (AI Socket) counter-attacks
    const aiCoords = session.computer.chooseAttack();
    const aiAttack = session.player.gameboard.receiveAttack(aiCoords);
    session.computer.registerOutcome(aiCoords, aiAttack);

    return {
      playerAttack,
      aiAttack: { coords: aiCoords, ...aiAttack },
      boards: {
        player: session.player.gameboard.getSnapshot(),
        opponent: gameService.getMaskedBoard(session.computer.gameboard)
      }
    };
  });
}