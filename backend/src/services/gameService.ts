import { Player } from "../utils/player.ts";
import { Computer } from "../utils/computer.ts";
import { Gameboard } from "../utils/gameboard.ts";
import type { GamePhase, Move } from "../../models.ts";

export type ParticipantType = "human" | "ai";

export interface Participant {
  id: string;
  type: ParticipantType;
  gameboard: Gameboard;
  instance: Player | Computer; // <--- store the original class instance
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

  createGame(gameId: string, humanPlayerId: string) {
    if (this.sessions.has(gameId)) {
      throw new Error("Game already exists");
    }

    const humanPlayer = new Player();
    const computerInstance = new Computer();

    // Setup initial AI state
    computerInstance.randomPopulate();
    computerInstance.resetAI();

    const session: GameSession = {
      id: gameId,
      phase: "setup",
      turn: humanPlayerId,
      history: [],
      participants: new Map([
        [
          humanPlayerId,
          {
            id: humanPlayerId,
            type: "human",
            gameboard: humanPlayer.gameboard,
            instance: humanPlayer, // store the class instance
          },
        ],
        [
          "computer",
          {
            id: "computer",
            type: "ai",
            gameboard: computerInstance.gameboard,
            instance: computerInstance, // store the AI instance
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
