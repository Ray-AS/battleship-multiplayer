import type { cellState, Position } from "../models";

interface cellProps {
  state: cellState;
  position: Position;
  attack: (position: Position) => void;
}

export default function Cell({ state, position, attack }: cellProps) {
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
    <div className="cell" onClick={() => attack(position)}>
      {value}
    </div>
  );
}
