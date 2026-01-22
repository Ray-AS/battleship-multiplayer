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
}

interface GameSession {
  id: string;
  participants: Map<string, Participant>;
  phase: GamePhase;
  turn: string;
  history: Move[];
}

class GameService {
  private sessions = new Map<string, GameSession>();

  createGame(gameId: string, playerId = "player") {
    if (this.sessions.has(gameId)) {
      throw new Error("Game already exists");
    }

    const human = new Player();
    const computer = new Computer();

    // Setup initial AI state
    computer.randomPopulate();
    computer.resetAI();

    const session: GameSession = {
      id: gameId,
      phase: "setup",
      turn: playerId,
      history: [],
      participants: new Map([
        [
          playerId,
          {
            id: playerId,
            type: "human",
            gameboard: human.gameboard,
            instance: human,
          },
        ],
        [
          "computer",
          {
            id: "computer",
            type: "ai",
            gameboard: computer.gameboard,
            instance: computer,
          },
        ],
      ]),
    };

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
