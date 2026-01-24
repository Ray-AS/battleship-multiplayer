interface LobbyProps {
  joinMode: boolean;
  joinId: string;
  setJoinId: (id: string) => void;
  setJoinMode: (mode: boolean) => void;
  onCreateNewGame: (isMulti: boolean) => void;
  onJoinGame: () => void;
}

export default function Lobby({
  joinMode,
  joinId,
  setJoinId,
  setJoinMode,
  onCreateNewGame,
  onJoinGame,
}: LobbyProps) {
  return (
    <div className="lobby">
      <h1>Battleship</h1>
      <div className="lobby-controls">
        {!joinMode ? (
          <>
            <button onClick={() => onCreateNewGame(false)}>
              Play Vs. Computer
            </button>
            <button onClick={() => onCreateNewGame(true)}>
              Create Multiplayer Game
            </button>
            <button onClick={() => setJoinMode(true)}>
              Join Multiplayer Game
            </button>
          </>
        ) : (
          <>
            <h3>Join Game</h3>
            <input
              type="text"
              placeholder="Enter Game ID"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onJoinGame()}
            />
            <div className="button-group">
              <button onClick={onJoinGame}>Join</button>
              <button onClick={() => setJoinMode(false)}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}