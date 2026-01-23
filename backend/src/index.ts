import Fastify from "fastify";
import cors from "@fastify/cors";

import { Server as HTTPServer } from "http";
import { Server as IOServer } from "socket.io";

import swaggerPlugin from "./plugins/swagger.ts";
import { gameRoutes } from "./routes/gameRoutes.ts";
import { gameService } from "./services/gameService.ts";
import * as gameController from "./controllers/gameController.ts";
import { DEFAULT_BOARD_SIZE, SHIPS } from "./configs.ts";

const fastify = Fastify({ logger: true });
export const PORT = 3000;

const server: HTTPServer = fastify.server;
const io = new IOServer(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  },
});

fastify.decorate("io", io);

await fastify.register(cors, {
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"],
});
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

io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on("joinGame", async ({ gameId, playerId }) => {
    socket.join(gameId);
    const session = gameService.getSession(gameId);

    if (!session) {
      socket.emit("error", { message: "Game not found" });
      return;
    }

    console.log("joinGame socket event:", {
      gameId,
      playerId,
      participantIds: Array.from(session.participants.keys()),
      hasPlayer: session.participants.has(playerId),
    });

    if (!session.participants.has(playerId)) {
      if (session.isMultiplayer && session.participants.size < 2) {
        const result = await gameController.joinGame(gameId, playerId);
        if (result.status !== 200) {
          socket.emit("error", { message: result.data.error });
          return;
        }
      } else if (!session.isMultiplayer) {
        socket.emit("error", { message: "Game is single-player only" });
        return;
      } else {
        socket.emit("error", { message: "Game is full" });
        return;
      }
    }

    const currentState = await gameController.getGame(gameId, playerId);
    socket.emit("gameState", currentState.data);

    socket.to(gameId).emit("playerJoined", { playerId });
  });

  socket.on("attack", async ({ gameId, attackerId, x, y }) => {
    const result = await gameController.attack(gameId, attackerId, { x, y });

    if (result.status !== 200) {
      socket.emit("error", { message: result.data.error });
      return;
    }

    // Send tailored state to each player
    const session = gameService.getSession(gameId);
    if (session) {
      for (const playerId of session.participants.keys()) {
        const gameState = await gameController.getGame(gameId, playerId);
        io.to(gameId).emit("gameState", {
          ...gameState.data,
          forPlayerId: playerId,
        });
      }
    }
  });

  socket.on("startGame", async ({ gameId, playerId }) => {
    console.log("startGame socket event received:", { gameId, playerId });

    const result = await gameController.startGame(gameId, playerId);

    if (result.status !== 200) {
      socket.emit("error", { message: result.data.error });
      return;
    }

    if (result.data.gameStarted) {
      // Notify all players that the game has started and send tailored state
      const session = gameService.getSession(gameId);
      if (session) {
        for (const playerId of session.participants.keys()) {
          const gameState = await gameController.getGame(
            gameId,
            playerId,
          );
          io.to(gameId).emit("gameState", {
            ...gameState.data,
            forPlayerId: playerId,
          });
        }
      }
    } else {
      // Player marked ready but wait for other player
      socket.emit("playerReady", { message: result.data.message });

      // Notify others that this player is ready
      socket.to(gameId).emit("playerMarkedReady", { playerId });
    }
  });

  socket.on("clearShips", async ({ gameId, playerId }) => {
    const result = await gameController.clearShips(gameId, playerId);
    
    if (result.status !== 200) {
      socket.emit("error", { message: result.data.error });
      return;
    }

    socket.emit("shipsCleared", result.data);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
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
