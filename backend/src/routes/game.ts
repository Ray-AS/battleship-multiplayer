import type { FastifyInstance } from "fastify";
import { gameService } from "../services/gameService.ts";
import { DEFAULT_BOARD_SIZE } from "../../configs.ts";
import { Outcome } from "../../models.ts";
import type { Computer } from "../utils/computer.ts";

export async function game(fastify: FastifyInstance) {
  // Start Game: Initializes the session
  fastify.post("/:id/start", async (request, reply) => {
    const { id } = request.params as { id: string };
    const humanPlayerId = "player"; // Or pass from frontend
    
    const session = gameService.createGame(id, humanPlayerId);

    const humanParticipant = session.participants.get(humanPlayerId);
    const aiParticipant = session.participants.get("computer");

    return {
      gameId: id,
      phase: session.phase,
      playerBoard: humanParticipant?.gameboard.getSnapshot(),
      opponentBoard: aiParticipant ? gameService.getMaskedBoard(aiParticipant.gameboard) : undefined
    };
  });

  // Attack: Process player move and AI counter-move
  const attackBodySchema = {
    type: 'object',
    required: ['x', 'y'],
    properties: {
      x: { type: 'integer', minimum: 0, maximum: DEFAULT_BOARD_SIZE - 1 },
      y: { type: 'integer', minimum: 0, maximum: DEFAULT_BOARD_SIZE - 1 }
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
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
      const { x, y } = request.body as { x: number; y: number };

      const session = gameService.getSession(id);
      if (!session) return reply.status(404).send({ error: "Game not found" });

      if (session.phase !== "playing") {
        return reply.status(400).send({ error: "Game is not in playing phase" });
      }

      const humanParticipant = session.participants.get("player");
      const aiParticipant = session.participants.get("computer");

      if (!humanParticipant || !aiParticipant) {
        return reply.status(500).send({ error: "Participants not found" });
      }

      // Player attacks AI
      const playerAttack = aiParticipant.gameboard.receiveAttack({ x, y });

      if (playerAttack.outcome === Outcome.UNAVAILABLE) {
        return reply.status(400).send({ error: "Invalid move" });
      }

      // Check if AI has lost
      let gameEnded = false;
      if (aiParticipant.gameboard.allShipsSunk()) {
        session.phase = "ended";
        gameEnded = true;
      }

      // AI counterattacks if game not ended
      let aiAttack: any = null;
      if (!gameEnded) {
        const aiInstance = aiParticipant.instance as Computer; // typecast
        const aiCoords = aiInstance.chooseAttack();
        aiAttack = humanParticipant.gameboard.receiveAttack(aiCoords);
        aiInstance.registerOutcome(aiCoords, aiAttack);
      }

      return {
        playerAttack,
        aiAttack,
        boards: {
          player: humanParticipant.gameboard.getSnapshot(),
          opponent: gameService.getMaskedBoard(aiParticipant.gameboard),
        },
        phase: session.phase,
      };
    });
}