import Fastify from "fastify";
import swaggerPlugin from "./plugins/swagger.ts";

const fastify = Fastify({ logger: true });
await fastify.register(swaggerPlugin);

fastify.get("/", async () => {
  return { message: "Battleship backend running!" };
});

fastify.post("/game/:id/start", async (request, reply) => {
  const { id } = request.params as { id: string };
  // Placeholder logic for starting a game
  return { message: `Game ${id} started!` };
});

fastify.post("/game/:id/place", async (request, reply) => {
  const { id } = request.params as { id: string };
  // Placeholder logic for placing ships
  return { message: `Ships placed for game ${id}!` };
});

fastify.post("/game/:id/randomize", async (request, reply) => {
  const { id } = request.params as { id: string };
  // Placeholder logic for randomizing ship placement
  return { message: `Ships randomized for game ${id}!` };
});

fastify.post("/game/:id/attack", async (request, reply) => {
  const { id } = request.params as { id: string };
  // Placeholder logic for attacking
  return { message: `Attack registered for game ${id}!` };
});

fastify.get("/game/:id/status", async (request, reply) => {
  const { id } = request.params as { id: string };
  // Placeholder logic for getting game status
  return { message: `Status for game ${id}!` };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log("Server listening at http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();