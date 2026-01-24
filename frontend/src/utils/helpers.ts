import type { Board as BoardT, Cell as CellT, PlayerType } from "../models";

export const createEmptyBoard = (): BoardT =>
  Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => ({ type: "empty" }))
  );

export function calculateWinner(boardData: BoardT): PlayerType {
  const myShipsRemaining = boardData
    ?.flat()
    .some((cell: CellT) => cell.type === "ship");
  return myShipsRemaining ? "Player" : "Computer";
}