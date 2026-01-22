import Fastify from "fastify";
import cors from '@fastify/cors';
import swaggerPlugin from "./plugins/swagger.ts";
import { gameRoutes } from "./routes/gameRoutes.ts";
import { DEFAULT_BOARD_SIZE, SHIPS } from "./configs.ts";

const fastify = Fastify({ logger: true });
await fastify.register(cors, { 
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  methods: ['GET', 'POST', 'PUT', 'DELETE'] 
});

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
fastify.register(gameRoutes, { prefix: "/game" });

const start = async () => {
  try {
    await fastify.listen({ port: PORT });
  } catch (err) {
    process.exit(1);
  }
};

start();
