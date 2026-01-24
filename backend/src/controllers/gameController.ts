import { gameService } from "../services/gameService.ts";
import { DEFAULT_BOARD_SIZE, SHIPS } from "../configs.ts";
import { Outcome } from "../models.ts";
import type { Orientation } from "../models.ts";
import type { Computer } from "../utils/computer.ts";
import { Player } from "../utils/player.ts";

// ------------------- GET GAME -------------------
export async function getGame(sessionId: string, playerId: string) {
  const session = gameService.getSession(sessionId);
  if (!session) return { status: 404, data: { error: "Game not found" } };

  // Prepare board snapshots
  const boards = Object.fromEntries(
    Array.from(session.participants.entries()).map(([id, p]) => [
      id,
      // Only reveal full board to the player themselves or if the game has ended
      id === playerId || session.phase === "ended"
        ? p.gameboard.getSnapshot()
        : gameService.getMaskedBoard(p.gameboard),
    ]),
  );

  return {
    status: 200,
    data: {
      gameId: session.id,
      phase: session.phase,
      turn: session.turn,
      boards,
      isMultiplayer: session.isMultiplayer,
      participantCount: session.participants.size,
    },
  };
}
// ------------------- CREATE GAME -------------------
export async function createGame(
  sessionId: string,
  playerId: string,
  isMultiplayer: boolean,
) {
  const emptyBoard = Array.from({ length: DEFAULT_BOARD_SIZE }, () =>
    Array.from({ length: DEFAULT_BOARD_SIZE }, () => ({ type: "empty" })),
  );

  // Create game only if it exists
  try {
    let session = gameService.getSession(sessionId);

    if (!session) {
      session = gameService.createGame(sessionId, playerId, isMultiplayer);
    }
    
    const human = session.participants.get(playerId);
    const participantIds = Array.from(session.participants.keys());
    const opponentId = participantIds.find((id) => id !== playerId);
    const opponent = opponentId ? session.participants.get(opponentId) : null;

    return {
      status: 200,
      data: {
        gameId: sessionId,
        phase: session.phase,
        playerBoard: human?.gameboard.getSnapshot() || emptyBoard,
        opponentBoard: opponent
          ? gameService.getMaskedBoard(opponent.gameboard)
          : emptyBoard,
        isMultiplayer: session.isMultiplayer,
        participantCount: session.participants.size,
      },
    };
  } catch {
    return { status: 400, data: { error: "Game already exists" } };
  }
}

// ------------------- PLACE SHIP -------------------
export async function placeShip(
  sessionId: string,
  body: {
    playerId: string;
    shipModel: string;
    x: number;
    y: number;
    orientation: Orientation;
  },
) {
  const { playerId, shipModel, x, y, orientation } = body;
  const session = gameService.getSession(sessionId);
  if (!session) return { status: 404, data: { error: "Game not found" } };

  if (session.phase !== "setup")
    return {
      status: 400,
      data: { error: "Ships can only be placed during setup phase" },
    };

  const participant = session.participants.get(playerId);
  if (!participant) return { status: 404, data: { error: "Player not found" } };
  if (participant.type !== "human")
    return { status: 400, data: { error: "AI cannot place ships manually" } };

  const shipSpec = SHIPS.find((s) => s.model === shipModel);
  if (!shipSpec) return { status: 400, data: { error: "Invalid ship model" } };

  const alreadyPlaced = participant.gameboard.ships.some(
    (s) => s.specs.model === shipModel,
  );
  if (alreadyPlaced)
    return { status: 400, data: { error: "Ship already placed" } };

  const success = participant.gameboard.placeShip(
    shipSpec,
    { x, y },
    orientation,
  );
  if (!success)
    return { status: 400, data: { error: "Invalid ship placement" } };

  return {
    status: 200,
    data: { success: true, board: participant.gameboard.getSnapshot() },
  };
}

// ------------------- START GAME -------------------
export async function startGame(sessionId: string, playerId: string) {
  const session = gameService.getSession(sessionId);

  if (!session) return { status: 404, data: { error: "Game not found" } };

  if (session.phase !== "setup")
    return { status: 400, data: { error: "Game has already started" } };

  if (!playerId) {
    console.error("No playerId provided to startGame!");
    return { status: 400, data: { error: "Player ID is required" } };
  }

  console.log("Session participants:", Array.from(session.participants.keys()));

  // Ensure two players are present in multiplayer mode
  if (session.isMultiplayer && session.participants.size < 2) {
    return {
      status: 400,
      data: { error: "Waiting for second player to join" },
    };
  }

  const player = session.participants.get(playerId);

  if (!player) {
    return { status: 404, data: { error: "Player not found in session" } };
  }

  if (player.type !== "human") {
    return {
      status: 400,
      data: { error: "Only human players can start the game" },
    };
  }

  if(player.type === "human") {
    if (player.gameboard.ships.length == 0) {
      player.instance.randomPopulate();
    } else if (player.gameboard.ships.length < SHIPS.length) {
      return { status: 400, data: { error: "Not all ships have been placed" } };
    }
  }

  player.ready = true;

  // In multiplayer, wait for both players to be ready
  if (session.isMultiplayer) {
    const allReady = Array.from(session.participants.values()).every(p => p.ready);
    if (!allReady) {
      return {
        status: 200,
        data: { 
          success: true, 
          message: "Waiting for other players to be ready",
          ready: true 
        },
      };
    }
  }

  // Transition game state if singleplayer or both players ready
  session.phase = "playing";

  // Decide first turn
  const players = Array.from(session.participants.keys());
  session.turn = players[Math.floor(Math.random() * players.length)];

  if (!session.isMultiplayer) {
    const first = session.participants.get(session.turn);

    if (first?.type === "ai") {
      const attacked = Array.from(session.participants.values()).find(
        (p) => p.id !== first.id,
      );

      if (attacked) {
        const aiInstance = first.instance as Computer;
        const coords = aiInstance.chooseAttack();
        const result = attacked.gameboard.receiveAttack(coords);
        aiInstance.registerOutcome(coords, result);

        session.history.push({
          attacker: first.id,
          position: coords,
          result,
          timestamp: Date.now(),
        });

        // Unlikely edge case
        if (attacked.gameboard.allShipsSunk()) session.phase = "ended";
        else session.turn = attacked.id;
      }
    }
  }

  return {
    status: 200,
    data: {
      success: true,
      gameId: session.id,
      phase: session.phase,
      turn: session.turn,
      gameStarted: true,
    },
  };
}

// ------------------- ATTACK -------------------
export async function attack(
  sessionId: string,
  attackerId: string,
  body: { x: number; y: number },
) {
  const session = gameService.getSession(sessionId);
  if (!session) return { status: 404, data: { error: "Game not found" } };

  if (session.phase !== "playing")
    return { status: 400, data: { error: "Game is not in playing phase" } };

  const attacker = session.participants.get(attackerId);
  if (!attacker) return { status: 404, data: { error: "Attacker not found" } };

  if (session.turn !== attackerId)
    return { status: 400, data: { error: "It is not your turn" } };

  const attacked = Array.from(session.participants.values()).find(
    (p) => p.id !== attackerId,
  );

  if (!attacked)
    return { status: 500, data: { error: "No opponent found to attack" } };

  const playerAttack = attacked.gameboard.receiveAttack(body);

  if (playerAttack.outcome === Outcome.UNAVAILABLE)
    return { status: 400, data: { error: "Invalid move" } };

  session.history.push({
    attacker: attackerId,
    position: { x: body.x, y: body.y },
    result: playerAttack,
    timestamp: Date.now(),
  });

  let aiAttack = null;

  if (!session.isMultiplayer && attacked.type === "ai") {
    // AI counterattacks
    const aiInstance = attacked.instance as Computer;
    const coords = aiInstance.chooseAttack();
    aiAttack = attacker.gameboard.receiveAttack(coords);
    aiInstance.registerOutcome(coords, aiAttack);

    session.history.push({
      attacker: attacked.id,
      position: coords,
      result: aiAttack,
      timestamp: Date.now(),
    });

    // Check if player lost after AI counterattack
    if (attacker.gameboard.allShipsSunk()) {
      session.phase = "ended";
      session.turn = "";
    } else {
      // Player still alive, turn goes back to player
      session.turn = attackerId;
    }
  } else {
    const nextPlayer = Array.from(session.participants.values()).find(
      (p) => p.id !== attackerId,
    );

    session.turn = nextPlayer ? nextPlayer.id : "";
  }

  if (attacked.gameboard.allShipsSunk()) {
    session.phase = "ended";
    session.turn = "";
  }

  const boards = Object.fromEntries(
    Array.from(session.participants.entries()).map(([id, p]) => [
      id,
      session.phase === "ended"
        ? p.gameboard.getSnapshot()
        : gameService.getMaskedBoard(p.gameboard),
    ]),
  );

  return {
    status: 200,
    data: {
      playerAttack,
      aiAttack,
      boards,
      phase: session.phase,
      turn: session.turn,
      history: session.history,
    },
  };
}

// ------------------- JOIN GAME -------------------
export async function joinGame(sessionId: string, playerId: string) {
  const session = gameService.getSession(sessionId);
  if (!session) return { status: 404, data: { error: "Game not found" } };

  if (!session.isMultiplayer) {
    return { status: 400, data: { error: "Cannot join a singleplayer game" } };
  }

  if (session.participants.has(playerId)) {
    return {
      status: 400,
      data: { error: "Player ID already taken in this game" },
    };
  }

  if (session.participants.size >= 2) {
    return { status: 400, data: { error: "Game is already full" } };
  }

  const player = new Player();

  session.participants.set(playerId, {
    id: playerId,
    type: "human",
    gameboard: player.gameboard,
    instance: player,
    ready: false,
  });

  return {
    status: 200,
    data: {
      gameId: session.id,
      phase: session.phase,
      playerBoard: player.gameboard.getSnapshot(),
    },
  };
}

// ------------------- CLEAR SHIPS -------------------
export async function clearShips(sessionId: string, playerId: string) {
  const session = gameService.getSession(sessionId);
  if (!session) return { status: 404, data: { error: "Game not found" } };

  if (session.phase !== "setup")
    return {
      status: 400,
      data: { error: "Ships can only be cleared during setup phase" },
    };

  const participant = session.participants.get(playerId);
  if (!participant) return { status: 404, data: { error: "Player not found" } };

  if (participant.type !== "human")
    return { status: 400, data: { error: "AI cannot clear ships manually" } };

  participant.gameboard.clear();

  return {
    status: 200,
    data: { success: true, board: participant.gameboard.getSnapshot() },
  };
}
