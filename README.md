# Battleship

A fully interactive Battleship game built with React and TypeScript. Play against a simple computer AI that randomly places ships and attacks your board. Features include random board population, turn-based gameplay, and game state management.

## Demo

![Demo](/assets/example-complete.gif)

[Live Preview](https://battleship-eight-gray.vercel.app/)

## Features

- Place and randomize your fleet before starting the game.
- Turn-based gameplay with computer AI.
- Visual feedback for hits, misses, and ship positions.
- Detects when all ships are sunk and announces the winner.
- Supports restarting the game without refreshing the page.

## Languages & Libraries

- TypeScript for type safety
- React for UI components
- Vitest for unit testing
- CSS for styling

## Running Locally

### Prerequisites

- Node.js >= 18.x
- npm

### Installation & Launching

``` bash
git clone git@github.com:Ray-AS/battleship.git
cd battleship
npm install
npm run dev
```

View at <http://localhost:5173>

### Running Tests

``` bash
npm run test
```

## Gameplay

1. Click Randomize to place your ships randomly (Optional)
2. Click Start to begin the game.
3. Take turns attacking the enemy’s board.
4. Hits are marked with ×, misses with -.
5. The game ends when all ships of one player are sunk.
6. Click Restart to start a new game.

## Test-Driven Development

- Game logic was built using test-driven development principles
- Uses Vitest library for unit tests
- Tests:
  - Ship placement and boundary checks
  - Attack outcomes (hit, miss, unavailable)
  - Sinking ships and detecting game over

## Future Updates

- Improved computer AI for ship targeting
- Drag-and-drop ship placement
- Responsive, mobile-friendly layout
- Animations and sound effects
- Persistent storage using database
- User accounts and authentication
- Multiplayer support using Websockets
