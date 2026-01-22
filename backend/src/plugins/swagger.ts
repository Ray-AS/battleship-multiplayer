import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import type { FastifyPluginAsync } from "fastify";
import { PORT } from "../index.ts";

// Define basic function to initialize swagger documentation fastify plugin
const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "Battleship API",
        description: "Backend API for Battleship game",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:" + PORT,
          description: "Local dev",
        },
      ],
    },
  });

  await fastify.register(swaggerUI, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });
};

export default fp(swaggerPlugin);