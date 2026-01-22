import { DEFAULT_BOARD_SIZE } from "../configs.ts";

export const placeShipSchema = {
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

export const attackSchema = {
  body: {
    type: "object",
    required: ["x", "y"],
    properties: {
      x: { type: "integer", minimum: 0, maximum: DEFAULT_BOARD_SIZE - 1 },
      y: { type: "integer", minimum: 0, maximum: DEFAULT_BOARD_SIZE - 1 },
    },
  },
};
