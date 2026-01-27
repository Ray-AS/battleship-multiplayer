# Plan

- Create types/interfaces for function return types; \*gameController.createGame return right now:

```javascript
Promise<{
    status: number;
    data: {
        gameId: string;
        phase: GamePhase;
        playerBoard: {
            type: string;
        }[][];
        opponentBoard: {
            type: string;
        }[][];
        isMultiplayer: boolean;
        participantCount: number;
        error?: never;
    };
} | {
    status: number;
    data: {
        error: string;
        gameId?: never;
        phase?: never;
        playerBoard?: never;
        opponentBoard?: never;
        isMultiplayer?: never;
        participantCount?: never;
    };
}>
```

- Redux
        - Game State
