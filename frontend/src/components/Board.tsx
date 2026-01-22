import "../styles/board.css";
import Cell from "./Cell";
import {
  type Board as BoardT,
  type GamePhase,
  type PlacementState,
  type Position,
} from "../models.ts";
import { useContext, useState } from "react";
import { PlayerContext } from "./PlayerContext";
import { SHIPS } from "../configs.ts";

interface boardProps {
  playerRole: "Player" | "Computer";
  boardData: BoardT;
  phase: GamePhase;
  onInteract: (position: Position) => void;
  placement?: PlacementState | null;
}

export default function Board({
  playerRole,
  boardData,
  phase,
  onInteract,
  placement,
}: boardProps) {
  const { currentPlayer } = useContext(PlayerContext)!;
  const [hoveredCells, setHoveredCells] = useState<Position[]>([]);

  if (!boardData || !boardData.map) {
    return <div className="board-loading">Initializing Board...</div>;
  }

  function handleMouseEnter(position: Position) {
    if (phase === "setup" && placement && playerRole === "Player") {
      const ship = SHIPS[placement.index];
      const cells: Position[] = [];
      for (let i = 0; i < ship.length; i++) {
        cells.push({
          x: placement.orientation === "horizontal" ? position.x + i : position.x,
          y: placement.orientation === "vertical" ? position.y + i : position.y,
        });
      }
      setHoveredCells(cells);
    }
  }

  return (
    <div className="board">
      {boardData.map((row, y) =>
        row.map((cell, x) => {
          const position = { x, y };
          const isPreview = hoveredCells.some((p) => p.x === x && p.y === y);

          // Disable logic:
          // 1. Always disable if game ended
          // 2. Setup: disable enemy board, or player board if not placing
          // 3. Playing: disable player board, or enemy board if not player's turn
          let disabled = false;
          if (phase === "setup") {
            disabled = playerRole === "Computer" || !placement;
          } else if (phase === "playing") {
            disabled = playerRole === "Player" || currentPlayer !== "Player";
          } else {
            disabled = true;
          }

          return (
            <Cell
              key={`${x}-${y}`}
              state={cell.type}
              position={position}
              disabled={disabled}
              hide={playerRole === "Computer"} 
              preview={isPreview}
              previewInvalid={false}
              interact={() => onInteract(position)}
              mouseEnter={() => handleMouseEnter(position)}
              mouseLeave={() => setHoveredCells([])}
            />
          );
        })
      )}
    </div>
  );
}
