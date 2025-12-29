import "../styles/board.css";
import Cell from "./Cell";
import { type Board, type Position } from "../models";
import type { Gameboard } from "../utils/gameboard";
import { useState } from "react";

interface boardProps {
  boardInstance: Gameboard;
}

export default function Board({ boardInstance }: boardProps) {
  const [board, setBoard] = useState(boardInstance.board);

  // Update board instance and board state based on attacked cell position
  function attack(position: Position) {
    console.log(`attacking (${position.x}, ${position.y})`);
    boardInstance.receiveAttack(position);

    // Create deep copy of updated board instance
    const newBoard = boardInstance.board.map((row) =>
      row.map((cell) => ({ ...cell }))
    );

    setBoard(newBoard);
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
        row.push(
          <Cell
            key={y + x}
            state={board[y][x].type}
            position={position}
            attack={attack}
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
