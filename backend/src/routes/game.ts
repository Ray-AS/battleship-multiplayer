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
  fastify.post("/:id/attack", async (request, reply) => {
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