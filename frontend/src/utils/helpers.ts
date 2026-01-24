import type { Board, Cell, PlayerType } from "../models";

export const createEmptyBoard = (): Board =>
  Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => ({ type: "empty" }))
  );

export function calculateWinner(boardData: Board): PlayerType {
  const myShipsRemaining = boardData
    ?.flat()
    .some((cell: Cell) => cell.type === "ship");
  return myShipsRemaining ? "Player" : "Computer";
}