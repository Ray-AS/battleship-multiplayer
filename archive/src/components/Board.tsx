import "../styles/board.css";
import Cell from "./Cell";
import {
  Outcome,
  type Board,
  type GamePhase,
  type PlacementState,
  type PlayerType,
  type Position,
} from "../models";
import type { Gameboard } from "../utils/gameboard";
import { useContext, useState } from "react";
import { PlayerContext } from "./PlayerContext";
import { SHIPS } from "../utils/player";

interface boardProps {
  player: PlayerType;
  boardInstance: Gameboard;
  phase: GamePhase;
  handleAllSunk: (player: PlayerType) => void;
  placement?: PlacementState;
  handlePlacement?: (position: Position) => void;
}

export default function Board({
  player,
  boardInstance,
  phase,
  handleAllSunk,
  placement,
  handlePlacement,
}: boardProps) {
  const board = boardInstance.board;
  const { currentPlayer, setCurrentPlayer } = useContext(PlayerContext)!;

  const [hoveredCells, setHoveredCells] = useState<Position[]>([]);
  const [isValid, setIsValid] = useState<boolean>(true);

  function handleMouseEnter(position: Position) {
    // Only calculate hover if in setup phase and player is actively placing
    if (phase === "setup" && placement && handlePlacement) {
      const ship = SHIPS[placement.index];
      const cells: Position[] = [];

      for (let i = 0; i < ship.length; i++) {
        const x =
          placement.orientation === "horizontal" ? position.x + i : position.x;
        const y =
          placement.orientation === "vertical" ? position.y + i : position.y;

        // No need to bounds check; cells will do their own styling
        cells.push({ x, y });
      }

      const outOfBounds = boardInstance.isOutOfBounds(
        ship.length,
        position,
        placement.orientation
      );
      const occupied =
        !outOfBounds &&
        boardInstance.isOccupied(ship.length, position, placement.orientation);

      setIsValid(!outOfBounds && !occupied);
      setHoveredCells(cells);
    }
  }

  function handleMouseLeave() {
    setHoveredCells([]);
  }

  // Update board instance and board state based on clicked cell position (i.e. attack or place ships)
  function handleInteraction(position: Position) {
    // If in setup, use placement logic instead of attack logic
    if (phase === "setup" && handlePlacement) {
      handlePlacement(position);
      return;
    }

    console.log(`Player attacking (${position.x}, ${position.y})`);
    const result = boardInstance.receiveAttack(position);

    // Don't switch turns if attack is invalid
    if (result.outcome === Outcome.UNAVAILABLE) return;

    if (boardInstance.allShipsSunk()) {
      handleAllSunk(player);
    } else {
      setCurrentPlayer("Computer");
    }
  }

  // Iterate over board to create a 2-D array of cells to display
  function createDisplayBoard(board: Board) {
    const displayBoard = [];
    // Generate rows
    for (let y = 0; y < board.length; y++) {
      const row = [];
      // Generate cells
      for (let x = 0; x < board[y].length; x++) {
        const position: Position = { x, y };
        const isPreview = hoveredCells.some((p) => p.x === x && p.y === y);

        let disabled = false;
        if (phase === "setup") {
          disabled = player === "Computer" || !handlePlacement;
        } else if (phase === "playing") {
          disabled = player === "Player" || player === currentPlayer;
        } else disabled = true;

        row.push(
          <Cell
            key={`${x}-${y}`}
            state={board[y][x].type}
            position={position}
            // Only allow attacking on computer board and placing on player board
            disabled={disabled}
            // Hide ships if board is computer
            hide={player === "Computer"}
            preview={isPreview}
            previewInvalid={isPreview && !isValid}
            interact={handleInteraction}
            mouseEnter={() => handleMouseEnter(position)}
            mouseLeave={handleMouseLeave}
          />
        );
      }
      displayBoard.push(row);
    }
    return displayBoard;
  }

  const displayBoard = createDisplayBoard(board);

  return <div className="board">{displayBoard}</div>;
}
