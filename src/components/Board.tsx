import "../styles/board.css";
import Cell from "./Cell";
import { type Board, type PlayerType, type Position } from "../models";
import type { Gameboard } from "../utils/gameboard";
import { useContext } from "react";
import { PlayerContext } from "./PlayerContext";

interface boardProps {
  player: PlayerType;
  boardInstance: Gameboard;
  handleAllSunk: (player: PlayerType) => void;
}

export default function Board({
  player,
  boardInstance,
  handleAllSunk,
}: boardProps) {
  const board = boardInstance.board;
  const { currentPlayer, setCurrentPlayer } = useContext(PlayerContext)!;

  // Update board instance and board state based on attacked cell position
  function attack(position: Position) {
    console.log(`Player attacking (${position.x}, ${position.y})`);
    boardInstance.receiveAttack(position);

    if (boardInstance.allShipsSunk()) {
      handleAllSunk(player);
      return;
    }
    setCurrentPlayer("Computer");
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
            key={`${x}-${y}`}
            state={board[y][x].type}
            position={position}
            disabled={player === currentPlayer}
            hide={player === "Computer"}
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
