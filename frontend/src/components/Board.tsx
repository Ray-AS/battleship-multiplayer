import "../styles/board.css";
import Cell from "./Cell";
import {
  type Board as BoardT,
  type GamePhase,
  type PlacementState,
  type Position,
} from "../models.ts";
import { useState } from "react";
import { SHIPS } from "../configs.ts";
import { useSelector } from "react-redux";
import type { RootState } from "../state/store.ts";

interface boardProps {
  playerRole: "Player" | "Computer";
  boardData: BoardT;
  phase: GamePhase;
  onInteract: (position: Position) => void;
  placement?: PlacementState | null;
  myTurn?: boolean;
}

export default function Board({
  playerRole,
  boardData,
  phase,
  onInteract,
  placement,
  myTurn = false,
}: boardProps) {
  const showCoordinates = useSelector((state: RootState) => state.preferences.showCoordinates);
  const [hoveredCells, setHoveredCells] = useState<Position[]>([]);
  const [isValidPlacement, setIsValidPlacement] = useState(true);

  if (!boardData || !boardData.map) {
    return <div className="board-loading">Initializing Board...</div>;
  }

  function checkValidity(cells: Position[]): boolean {
    return cells.every((pos) => {
      // Check Bounds (0-9)
      if (pos.x < 0 || pos.x >= 10 || pos.y < 0 || pos.y >= 10) {
        return false;
      }
      // Check Overlap
      // Safely access boardData using optional chaining just in case
      const cell = boardData[pos.y]?.[pos.x];
      return cell && cell.type !== "ship";
    });
  }

  function handleMouseEnter(position: Position) {
    // Only calculate preview if we are in setup mode on the player board
    if (phase === "setup" && placement && playerRole === "Player") {
      const ship = SHIPS[placement.index];
      const cells: Position[] = [];

      // Generate the array of cells the ship would occupy
      for (let i = 0; i < ship.length; i++) {
        cells.push({
          x:
            placement.orientation === "horizontal"
              ? position.x + i
              : position.x,
          y: placement.orientation === "vertical" ? position.y + i : position.y,
        });
      }

      const valid = checkValidity(cells);
      setHoveredCells(cells);
      setIsValidPlacement(valid);
    }
  }

  function handleMouseLeave() {
    setHoveredCells([]);
    setIsValidPlacement(true);
  }

  function handleCellClick(position: Position) {
    // Block the click if we are placing a ship and it's invalid
    if (phase === "setup" && placement && !isValidPlacement) {
      return;
    }

    // Otherwise, pass the click up to the parent
    onInteract(position);
  }

  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="board-box">
      {showCoordinates && (
        <>
          <div className="coordinate-labels bottom">
            <div className="corner"></div>
            {letters.map((letter) => (
              <div key={letter} className="label">
                {letter}
              </div>
            ))}
          </div>

          <div className="coordinate-labels left">
            {numbers.map((num) => (
              <div key={num} className="label">
                {num}
              </div>
            ))}
          </div>
        </>
      )}

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
            if (phase === "ended") {
              disabled = true;
            } else if (phase === "setup") {
              disabled = playerRole === "Computer" || !placement;
            } else if (phase === "playing") {
              if (playerRole === "Player") {
                disabled = true;
              } else {
                disabled = !myTurn;
              }
            }

            return (
              <Cell
                key={`${x}-${y}`}
                state={cell.type}
                position={position}
                disabled={disabled}
                hide={playerRole === "Computer" && phase !== "ended"}
                preview={isPreview}
                previewInvalid={isPreview && !isValidPlacement}
                interact={() => handleCellClick(position)}
                mouseEnter={() => handleMouseEnter(position)}
                mouseLeave={() => handleMouseLeave()}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}
