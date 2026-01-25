import { Player } from "../utils/player.ts";
import { Computer } from "../utils/computer.ts";
import { Gameboard } from "../utils/gameboard.ts";
import type { GamePhase, Move } from "../models.ts";

export type ParticipantType = "human" | "ai";

export interface Participant {
  id: string;
  type: ParticipantType;
  gameboard: Gameboard;
  instance: Player | Computer;
  ready: boolean;
}

interface GameSession {
  id: string;
  participants: Map<string, Participant>;
  phase: GamePhase;
  turn: string;
  history: Move[];
  isMultiplayer: boolean;
}

class GameService {
  private sessions = new Map<string, GameSession>();

  createGame(gameId: string, playerId = "player", isMultiplayer = false) {
    if (this.sessions.has(gameId)) {
      throw new Error("Game already exists");
    }

    const human = new Player();

    const session: GameSession = {
      id: gameId,
      phase: "setup",
      turn: playerId,
      history: [],
      isMultiplayer,
      participants: new Map([
        [
          playerId,
          {
            id: playerId,
            type: "human",
            gameboard: human.gameboard,
            instance: human,
            ready: false,
          },
        ],
      ]),
    };

    if (!isMultiplayer) {
      const computer = new Computer();

      // Setup initial AI state
      computer.randomPopulate();
      computer.resetAI();

      session.participants.set("computer", {
        id: "computer",
        type: "ai",
        gameboard: computer.gameboard,
        instance: computer,
        ready: true, // AI is always ready
      });
    }

    this.sessions.set(gameId, session);
    return session;
  }

  getSession(id: string): GameSession | undefined {
    return this.sessions.get(id);
  }

  // Helper to hide computer ships from the frontend
  getMaskedBoard(gameboard: Gameboard) {
    const snapshot = gameboard.getSnapshot();
    return snapshot.map((row) =>
      row.map((cell) => (cell.type === "ship" ? { type: "empty" } : cell)),
    );
  }
}

export const gameService = new GameService();
