import Fastify from "fastify";
import swaggerPlugin from "./plugins/swagger.ts";
import { game } from "./routes/game.ts";
import { DEFAULT_BOARD_SIZE, SHIPS } from "../configs.ts";

const fastify = Fastify({ logger: true });
await fastify.register(swaggerPlugin);

fastify.get("/", async () => {
  return {
    name: "Battleship API",
    status: "online",
    config: {
      boardSize: DEFAULT_BOARD_SIZE,
      ships: SHIPS,
    },
  };
});

fastify.register(game, { prefix: "/game" });

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    process.exit(1);
  }
};

start();
