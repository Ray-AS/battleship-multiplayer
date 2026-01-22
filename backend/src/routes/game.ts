import type { FastifyInstance } from "fastify";
import { gameService } from "../services/gameService.ts";
import { DEFAULT_BOARD_SIZE, SHIPS } from "../../configs.ts";
import { Outcome, type Orientation } from "../../models.ts";
import type { Computer } from "../utils/computer.ts";

export async function game(fastify: FastifyInstance) {
  fastify.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const session = gameService.getSession(id);

    if (!session) {
      return reply.status(404).send({ error: "Game not found" });
    }

    const human = session.participants.get("player");
    const ai = session.participants.get("computer");

    if (!human || !ai) {
      return reply.status(500).send({ error: "Participants not found" });
    }

    return {
      gameId: session.id,
      phase: session.phase,
      turn: session.turn,
      boards: {
        player: human.gameboard.getSnapshot(),
        opponent: gameService.getMaskedBoard(ai.gameboard),
      },
    };
  });
  ///////////////////////////////////////////////////////////////////////////////

  // Start Game: Initializes the session
  fastify.post("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const humanPlayerId = "player";

    try {
      const session = gameService.createGame(id, humanPlayerId);
      const humanParticipant = session.participants.get(humanPlayerId);
      const aiParticipant = session.participants.get("computer");

      return {
        gameId: id,
        phase: session.phase,
        playerBoard: humanParticipant?.gameboard.getSnapshot(),
        opponentBoard: aiParticipant
          ? gameService.getMaskedBoard(aiParticipant.gameboard)
          : undefined,
      };
    } catch {
      return reply.status(400).send({ error: "Game already exists" });
    }
  });

  ///////////////////////////////////////////////////////////////////////////////
  const placeShipSchema = {
    body: {
      type: "object",
      required: ["playerId", "shipModel", "x", "y", "orientation"],
      properties: {
        playerId: { type: "string" },
        shipModel: { type: "string" },
        x: { type: "integer", minimum: 0, maximum: DEFAULT_BOARD_SIZE - 1 },
        y: { type: "integer", minimum: 0, maximum: DEFAULT_BOARD_SIZE - 1 },
        orientation: { enum: ["horizontal", "vertical"] },
      },
    },
  };

  fastify.post(
    "/:id/place",
    { schema: placeShipSchema },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { playerId, shipModel, x, y, orientation } = request.body as {
        playerId: string;
        shipModel: string;
        x: number;
        y: number;
        orientation: Orientation;
      };

      const session = gameService.getSession(id);
      if (!session) {
        return reply.status(404).send({ error: "Game not found" });
      }

      if (session.phase !== "setup") {
        return reply
          .status(400)
          .send({ error: "Ships can only be placed during setup phase" });
      }

      const participant = session.participants.get(playerId);
      if (!participant) {
        return reply.status(404).send({ error: "Player not found" });
      }

      if (participant.type !== "human") {
        return reply
          .status(400)
          .send({ error: "AI cannot place ships manually" });
      }

      // Find ship model from config
      const shipSpec = SHIPS.find((s) => s.model === shipModel);
      if (!shipSpec) {
        return reply.status(400).send({ error: "Invalid ship model" });
      }

      // Prevent placing the same ship twice
      const alreadyPlaced = participant.gameboard.ships.some(
        (s) => s.specs.model === shipModel,
      );
      if (alreadyPlaced) {
        return reply.status(400).send({ error: "Ship already placed" });
      }

      // Attempt placement
      const success = participant.gameboard.placeShip(
        shipSpec,
        { x, y },
        orientation,
      );

      if (!success) {
        return reply.status(400).send({ error: "Invalid ship placement" });
      }

      return {
        success: true,
        board: participant.gameboard.getSnapshot(),
      };
    },
  );

  ///////////////////////////////////////////////////////////////////////////////
  fastify.post("/:id/start", {}, async (request, reply) => {
    const { id } = request.params as { id: string };

    const session = gameService.getSession(id);
    if (!session) {
      return reply.status(404).send({ error: "Game not found" });
    }

    if (session.phase !== "setup") {
      return reply.status(400).send({ error: "Game has already started" });
    }

    const human = session.participants.get("player");
    const ai = session.participants.get("computer");

    if (!human || !ai) {
      return reply.status(500).send({ error: "Participants not found" });
    }

    // Ensure all ships are placed
    if (human.gameboard.ships.length === 0) {
      human.instance.randomPopulate();
    } else if (human.gameboard.ships.length < SHIPS.length) {
      return reply
        .status(400)
        .send({ error: "Not all ships have been placed" });
    }

    // Transition game state
    session.phase = "playing";

    // Decide first turn
    const startingPlayer = Math.random() < 0.5 ? "player" : "computer";
    session.turn = startingPlayer;

    // Ensure computer makes move if it starts
    if (session.turn === "computer") {
      const aiInstance = ai.instance as Computer;
      const coords = aiInstance.chooseAttack();
      const result = human.gameboard.receiveAttack(coords);
      aiInstance.registerOutcome(coords, result);

      session.history.push({
        attacker: "computer",
        position: coords,
        result,
        timestamp: Date.now(),
      });

      session.turn = "player";
    }

    return {
      gameId: session.id,
      phase: session.phase,
      turn: session.turn,
      boards: {
        player: human.gameboard.getSnapshot(),
        opponent: gameService.getMaskedBoard(ai.gameboard),
      },
    };
  });

  ///////////////////////////////////////////////////////////////////////////////
  // Attack: Process player move and AI counter-move
  const attackBodySchema = {
    type: "object",
    required: ["x", "y"],
    properties: {
      x: { type: "integer", minimum: 0, maximum: DEFAULT_BOARD_SIZE - 1 },
      y: { type: "integer", minimum: 0, maximum: DEFAULT_BOARD_SIZE - 1 },
    },
  };

  // Add the schema to the route
  fastify.post(
    "/:id/attack",
    {
      schema: {
        body: attackBodySchema,
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              playerAttack: { type: "object", additionalProperties: true },
              aiAttack: {
                type: "object",
                nullable: true,
                additionalProperties: true,
              },
              boards: { type: "object", additionalProperties: true },
              phase: { type: "string" },
              history: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
            },
          },
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          500: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { x, y } = request.body as { x: number; y: number };

      const session = gameService.getSession(id);
      if (!session) return reply.status(404).send({ error: "Game not found" });

      if (session.phase !== "playing") {
        return reply
          .status(400)
          .send({ error: "Game is not in playing phase" });
      }

      if (session.turn !== "player") {
        return reply.status(400).send({ error: "It is not your turn" });
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

      session.history.push({
        attacker: "player",
        position: { x, y },
        result: playerAttack,
        timestamp: Date.now(),
      });

      // Check if AI has lost
      if (aiParticipant.gameboard.allShipsSunk()) {
        session.phase = "ended";
        return {
          playerAttack,
          aiAttack: null,
          phase: session.phase,
          history: session.history,
        };
      }

      // AI counterattacks if game not ended
      const aiInstance = aiParticipant.instance as Computer;
      const aiCoords = aiInstance.chooseAttack();
      const aiAttack = humanParticipant.gameboard.receiveAttack(aiCoords);
      aiInstance.registerOutcome(aiCoords, aiAttack);

      session.history.push({
        attacker: "computer",
        position: aiCoords,
        result: aiAttack,
        timestamp: Date.now(),
      });

      if (humanParticipant.gameboard.allShipsSunk()) {
        session.phase = "ended";
      } else {
        session.turn = "player";
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
    },
  );
}
