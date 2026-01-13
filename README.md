# Battleship

A fully interactive Battleship game built with React and TypeScript. Play against a smart computer AI uses simulations to attack the player. Features include manual or random board population, turn-based gameplay, and game state management.

## Features

- **Interactive Grid:** Place ships manually or automatically populate your board
- **Hovering Preview:** Hover over cells to preview ship placement and its validity
- **AI Opponent:** Smart computer player with probabilistic attack strategy using heatmaps and simulation
- **Game Phases:** Setup, playing, and end game states handled dynamically
- **Real-time Feedback:** Visual cues for hits, misses, and sunk ships

## Tech Stack

- TypeScript for type safety
- React for UI components
- Vitest for unit testing
- CSS for styling

## Running Locally

### Prerequisites

- Node.js >= 18.x
- npm

### Installation & Launching

```bash
git clone git@github.com:Ray-AS/battleship-multiplayer.git
cd battleship
npm install
npm run dev
```

View at <http://localhost:5173>

### Running Tests

```bash
npm run test
```

## Gameplay

1. **Setup**

   - Click Manual to place ships one by one
   - Hover over the grid to preview placement
   - Use the orientation button to rotate the ship
   - Click Randomize to automatically place all ships
   - Click Start to begin the game

2. **Playing**

   - Click on the enemy grid to attack
   - Wait for the AI to take its turn after yours

3. **End**
   - A winner is announced
   - Click Restart to play again

## AI Strategy

- **Tracks Board State:** Keeps track of hits, misses, and sunk ships to avoid attacking the same positions twice
- **Heatmap Simulations:** Runs multiple simulations of all possible placements for remaining ships, generating a probability map to identify the most likely positions for ships.
- **Adaptive Targeting:** Focuses attacks around known hits to efficiently sink ships and updates its strategy dynamically as ships are sunk
- **Randomized Fallback:** If no high-probability targets are available, it selects from remaining unknown cells, adding unpredictability and making gameplay feel natural

## Test-Driven Development

- Game logic was built using test-driven development principles
- Uses Vitest library for unit tests
- Tests:
  - Ship placement and boundary checks
  - Attack outcomes (hit, miss, unavailable)
  - Sinking ships and detecting game over

## Future Updates

- Drag-and-drop placement
- Multiplayer mode for online battles
- Sound effects and animations
- AI difficulty levels
