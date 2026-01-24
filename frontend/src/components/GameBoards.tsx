import Board from "./Board";
import type { Board as BoardT, GamePhase, PlacementState, Position } from "../models";

interface GameBoardsProps {
  playerBoard: BoardT;
  opponentBoard: BoardT;
  gameState: {
    phase: GamePhase;
    myTurn: boolean;
  };
  placement: PlacementState | null;
  isAIThinking: boolean;
  canInteract: boolean;
  onCellClick: (position: Position) => void;
}

export default function GameBoards({
  playerBoard,
  opponentBoard,
  gameState,
  placement,
  isAIThinking,
  canInteract,
  onCellClick,
}: GameBoardsProps) {
  return (
    <section className="boards-container">
      <div className="board-wrapper">
        <div
          className={`board-label left ${
            gameState.myTurn && gameState.phase === "playing" && !isAIThinking
              ? "active"
              : ""
          }`}
        >
          YOUR FLEET
        </div>
        <Board
          playerRole="Player"
          boardData={playerBoard}
          phase={gameState.phase}
          placement={placement}
          onInteract={onCellClick}
        />
      </div>

      <div className="board-wrapper">
        <div
          className={`board-label right ${
            !gameState.myTurn && gameState.phase === "playing" && !isAIThinking
              ? "active"
              : ""
          }`}
        >
          ENEMY WATERS
        </div>
        <Board
          playerRole="Computer"
          boardData={opponentBoard}
          phase={gameState.phase}
          onInteract={onCellClick}
          myTurn={canInteract}
        />
      </div>
    </section>
  );
}