import type { cellState, Position } from "../models";

interface cellProps {
  state: cellState;
  position: Position;
  disabled: boolean;
  attack: (position: Position) => void;
}

export default function Cell({ state, position, disabled, attack }: cellProps) {
  let value: string;

  // Determine display value based on cell state
  switch (state) {
    case "empty":
      value = "·";
      break;
    case "hit":
      value = "×";
      break;
    case "miss":
      value = "-";
      break;
    case "ship":
      value = "=";
      break;
    default:
      value = "~";
      break;
  }

  // console.log(position)
  return (
    <button className="cell" onClick={() => attack(position)} disabled={disabled}>
      {value}
    </button>
  );
}
