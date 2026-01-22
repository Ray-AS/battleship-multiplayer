import Fastify from "fastify";
import swaggerPlugin from "./plugins/swagger.ts";
import { game } from "./routes/game.ts";
import { DEFAULT_BOARD_SIZE, SHIPS } from "../configs.ts";

const fastify = Fastify({ logger: true });
export const PORT = 3000;
await fastify.register(swaggerPlugin);

fastify.get("/", async () => {
  // Return basic data about api on root request
  return {
    name: "Battleship API",
    status: "online",
    config: {
      boardSize: DEFAULT_BOARD_SIZE,
      ships: SHIPS,
    },
  };
});

// Handle all game routes
fastify.register(game, { prefix: "/game" });

const start = async () => {
  try {
    await fastify.listen({ port: PORT });
  } catch (err) {
    process.exit(1);
  }
};

start();
