import { Player } from "../utils/player.ts";
import { Computer } from "../utils/computer.ts";
import { Gameboard } from "../utils/gameboard.ts";
import type { GamePhase } from "../../models.ts";

interface GameSession {
  player: Player;
  computer: Computer;
  phase: GamePhase;
}

class GameService {
  private sessions = new Map<string, GameSession>();

  createGame(id: string) {
    const session: GameSession = {
      player: new Player(),
      computer: new Computer(), // Computer is treated as an independent instance
      phase: "setup",
    };
    // Initialize AI state
    session.computer.randomPopulate();
    session.computer.resetAI();
    this.sessions.set(id, session);
    return session;
  }

  getSession(id: string) {
    return this.sessions.get(id);
  }

  // Helper to hide computer ships from the frontend
  getMaskedBoard(gameboard: Gameboard) {
    const snapshot = gameboard.getSnapshot();
    return snapshot.map(row => 
      row.map(cell => (cell.type === "ship" ? { type: "empty" } : cell))
    );
  }
}

export const gameService = new GameService();