import { SHIPS } from "../configs";
import type { GamePhase, PlacementState, PlayerType } from "../models";

interface HeaderProps {
  gameState: {
    id: string;
    phase: GamePhase;
    isMultiplayer: boolean;
    participantCount: number;
    winner: PlayerType;
    myTurn: boolean;
    imReady: boolean;
  };
  placement: PlacementState | null;
  setPlacement: (placement: PlacementState) => void;
  delay: number;
  setDelay: (delay: number) => void;
  delayRef: React.RefObject<number>;
  pendingWinner: PlayerType | null;
  isAIThinking: boolean;
  onStartGame: () => void;
  onPlaceManually: () => void;
  onResetGame: () => void;
}

export default function Header({
  gameState,
  placement,
  setPlacement,
  delay,
  setDelay,
  delayRef,
  pendingWinner,
  isAIThinking,
  onStartGame,
  onPlaceManually,
  onResetGame,
}: HeaderProps) {
  
  function getStatusMessage() {
    if (isAIThinking) return "ENEMY ATTACKING...";
    return gameState.myTurn ? "YOU'RE ATTACKING..." : "ENEMY ATTACKING...";
  }

  return (
    <header>
      <h1>Battleship</h1>
      
      {gameState.isMultiplayer && (
        <div className="game-id-badge">
          Room: {gameState.id}
          {` (${gameState.participantCount === undefined ? 1 : gameState.participantCount}/2 players)`}
        </div>
      )}

      {gameState.phase === "setup" && (
        <div className="setup">
          {!placement ? (
            <>
              <button
                className="start-btn"
                onClick={onStartGame}
                disabled={
                  (gameState.isMultiplayer && gameState.participantCount < 2) ||
                  gameState.imReady
                }
              >
                {gameState.imReady
                  ? "Waiting for opponent..."
                  : gameState.isMultiplayer && gameState.participantCount < 2
                    ? "Waiting for opponent to join..."
                    : "I'm Ready"}
              </button>
              <button
                className="place-manually-btn"
                onClick={onPlaceManually}
                disabled={gameState.imReady}
              >
                Place Ships Manually
              </button>
            </>
          ) : (
            <div className="placement-info">
              <p>
                Placing:{" "}
                <strong>{SHIPS[placement.index].model.toUpperCase()}</strong>
              </p>
              <button
                onClick={() =>
                  setPlacement({
                    ...placement,
                    orientation:
                      placement.orientation === "horizontal"
                        ? "vertical"
                        : "horizontal",
                  })
                }
              >
                {placement.orientation}
              </button>
            </div>
          )}
        </div>
      )}

      {(gameState.phase === "playing" ||
        (gameState.phase === "ended" && pendingWinner)) && (
        <>
          {!gameState.isMultiplayer && (
            <div className="settings">
              <label>
                AI Delay (s):{" "}
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={1}
                  value={delay}
                  onChange={(e) => {
                    let val = Math.floor(Number(e.target.value));
                    if (val < 0) val = 0;
                    if (val > 5) val = 5;
                    setDelay(val);
                    delayRef.current = val;
                  }}
                />
              </label>
            </div>
          )}
          <div
            className={`status-bar ${
              isAIThinking ? "opponent" : gameState.myTurn ? "player" : "opponent"
            }`}
          >
            {getStatusMessage()}
          </div>
        </>
      )}

      {gameState.phase === "ended" && !pendingWinner && (
        <div className="game-over">
          <h3>{gameState.winner === "Player" ? "VICTORY!" : "DEFEAT!"}</h3>
          <button onClick={onResetGame}>New Game</button>
        </div>
      )}
    </header>
  );
}