import "./styles/app.css";
import Lobby from "./components/Lobby";
import Header from "./components/Header";
import GameBoards from "./components/GameBoards";
import NotificationBanners from "./components/Notification";
import { useGameState } from "./hooks/useGameState";
import { useBoardUpdates } from "./hooks/useBoardUpdates";
import { useSocket } from "./hooks/useSocket";
import { useGameActions } from "./hooks/useGameActions";
import { MY_ID } from "./utils/session";

function App() {
  const gameStateHook = useGameState();
  const boardHook = useBoardUpdates();
  
  useSocket({ MY_ID, ...gameStateHook, ...boardHook });
  
  const { createNewGame, joinExistingGame, handleCellClick, handleStartGame, handlePlaceManually, resetGame } = 
    useGameActions({ MY_ID, ...gameStateHook, ...boardHook });

  const canInteract = !boardHook.isAIThinking && 
    gameStateHook.gameState.myTurn && 
    gameStateHook.gameState.phase === "playing";

  return (
    <>
      <NotificationBanners 
        errorMsg={gameStateHook.errorMsg}
        readyStatus={gameStateHook.readyStatus}
      />
      
      {!gameStateHook.gameState.id ? (
        <Lobby
          joinMode={gameStateHook.joinMode}
          joinId={gameStateHook.joinId}
          setJoinId={gameStateHook.setJoinId}
          setJoinMode={gameStateHook.setJoinMode}
          onCreateNewGame={createNewGame}
          onJoinGame={joinExistingGame}
        />
      ) : (
        <>
          <Header 
            gameState={gameStateHook.gameState}
            placement={gameStateHook.placement}
            setPlacement={gameStateHook.setPlacement}
            delay={boardHook.delay}
            setDelay={boardHook.setDelay}
            delayRef={boardHook.delayRef}
            pendingWinner={boardHook.pendingWinner}
            isAIThinking={boardHook.isAIThinking}
            onStartGame={handleStartGame}
            onPlaceManually={handlePlaceManually}
            onResetGame={resetGame}
          />
          <GameBoards
            playerBoard={boardHook.playerBoard}
            opponentBoard={boardHook.opponentBoard}
            gameState={gameStateHook.gameState}
            placement={gameStateHook.placement}
            isAIThinking={boardHook.isAIThinking}
            canInteract={canInteract}
            onCellClick={handleCellClick}
          />
        </>
      )}
    </>
  );
}

export default App;
