import type { cellState, Position } from "../models";

interface cellProps {
  state: cellState;
  position: Position;
  disabled: boolean;
  hide: boolean;
  preview: boolean;
  previewInvalid: boolean;
  interact: (position: Position) => void;
  mouseEnter: () => void;
  mouseLeave: () => void;
}

export default function Cell({
  state,
  position,
  disabled,
  hide,
  preview,
  previewInvalid,
  interact,
  mouseEnter,
  mouseLeave,
}: cellProps) {
  let value: string;
  let style: string = state;

  // Determine display value and class name based on cell state
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
      if (hide) {
        value = "·";
        style = "empty";
      }
      break;
    default:
      value = "~";
      break;
  }

  const previewClass = previewInvalid
    ? "preview-invalid"
    : preview
    ? "preview-valid"
    : "";

  return (
    <button
      className={`cell ${style} ${previewClass}`}
      onClick={() => interact(position)}
      onMouseEnter={mouseEnter}
      onMouseLeave={mouseLeave}
      disabled={disabled}
    >
      {value}
    </button>
  );
}
