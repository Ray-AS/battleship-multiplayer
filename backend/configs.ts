export const DEFAULT_BOARD_SIZE: number = 10;

export const SHIPS = [
  { model: "carrier", length: 5 },
  { model: "battleship", length: 4 },
  { model: "cruiser", length: 3 },
  { model: "submarine", length: 3 },
  { model: "destroyer", length: 2 },
] as const;