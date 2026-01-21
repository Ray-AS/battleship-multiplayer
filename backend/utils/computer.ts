import { DEFAULT_BOARD_SIZE, SHIPS } from "../configs";
import {
  Outcome,
  type AttackOutcome,
  type Orientation,
  type Position,
  type ShipModel,
  type SimulationBoard,
} from "../models";
import { Player } from "./player";

export class Computer extends Player {
  // Keep track of known board state, valid positions and ships left so AI can make an informed decision
  private knowledgeBoard: ("unknown" | "miss" | "hit" | "sunk")[][];
  private availableHits: Position[];
  private remainingShips: ShipModel[];

  constructor() {
    super();
    this.knowledgeBoard = [];
    this.availableHits = [];
    this.remainingShips = [];
    this.resetAI();
  }

  // Check validity of placements using only knowledge of the AI
  private canPlaceShip(
    simulationBoard: SimulationBoard,
    ship: ShipModel,
    position: Position,
    orientation: Orientation
  ): boolean {
    for (let i = 0; i < ship.length; i++) {
      const x = orientation === "horizontal" ? position.x + i : position.x;
      const y = orientation === "vertical" ? position.y + i : position.y;

      if (x < 0 || y < 0 || x >= DEFAULT_BOARD_SIZE || y >= DEFAULT_BOARD_SIZE)
        return false;

      if (this.knowledgeBoard[y][x] === "miss") return false;
      if (simulationBoard[y][x]) return false;
    }
    return true;
  }

  private placeShip(
    simBoard: SimulationBoard,
    ship: ShipModel,
    pos: Position,
    orientation: Orientation
  ) {
    for (let i = 0; i < ship.length; i++) {
      const x = orientation === "horizontal" ? pos.x + i : pos.x;
      const y = orientation === "vertical" ? pos.y + i : pos.y;
      simBoard[y][x] = true;
    }
  }

  // Update AI knowledge based on outcome of shot
  registerOutcome(position: Position, attack: AttackOutcome) {
    switch (attack.outcome) {
      case Outcome.MISS:
        this.knowledgeBoard[position.y][position.x] = "miss";
        return;

      case Outcome.UNAVAILABLE:
        return;

      case Outcome.HIT:
        // TS now knows attack has shipInfo
        const { shipInfo } = attack;
        this.knowledgeBoard[position.y][position.x] = "hit";

        if (shipInfo.isSunk && shipInfo.positions) {
          for (const p of shipInfo.positions) {
            this.knowledgeBoard[p.y][p.x] = "sunk";
          }

          // Remove sunk ship from remaining ships
          this.remainingShips = this.remainingShips.filter(
            (s) => s.model !== shipInfo.model
          );
        }
        return;
    }
  }

  // 2-D array to simulate valid ship positions using current AI knowledge
  private createSimulationBoard(): SimulationBoard {
    return Array.from({ length: DEFAULT_BOARD_SIZE }, () =>
      Array.from({ length: DEFAULT_BOARD_SIZE }, () => false)
    );
  }

  // Attempt to find a valid board combination with each of the remaining ships
  private runSingleSimulation(): SimulationBoard | null {
    const simulationBoard = this.createSimulationBoard();

    // Randomly place each ship on simulation board
    for (const ship of this.remainingShips) {
      let placed = false;

      for (let attempts = 0; attempts < 50; attempts++) {
        const orientation: Orientation =
          Math.random() < 0.5 ? "horizontal" : "vertical";
        const position: Position = {
          x: Math.floor(Math.random() * DEFAULT_BOARD_SIZE),
          y: Math.floor(Math.random() * DEFAULT_BOARD_SIZE),
        };

        // Ensure valid position
        if (this.canPlaceShip(simulationBoard, ship, position, orientation)) {
          this.placeShip(simulationBoard, ship, position, orientation);
          placed = true;
          break;
        }
      }

      if (!placed) return null; // In case of infinite loop, return null if attempts > 50
    }

    // Null the simulation board if known hit position does not have a ship on it
    for (let y = 0; y < DEFAULT_BOARD_SIZE; y++) {
      for (let x = 0; x < DEFAULT_BOARD_SIZE; x++) {
        if (this.knowledgeBoard[y][x] === "hit" && !simulationBoard[y][x]) {
          return null;
        }
      }
    }

    return simulationBoard;
  }

  // 2-D array to count # of times ship appears at a given position
  private createHeatmap() {
    return Array.from({ length: DEFAULT_BOARD_SIZE }, () =>
      Array.from({ length: DEFAULT_BOARD_SIZE }, () => 0)
    );
  }

  // Run a specified number of simulations and tally the likelihood each given position on board has a ship
  private generateHeatmap(simulationCount = 300): number[][] {
    const heatmap = this.createHeatmap();

    for (let i = 0; i < simulationCount; i++) {
      const simulation = this.runSingleSimulation();
      if (!simulation) continue;

      // Increment heatmap if simulation said ship can be found there and the position has not already been shot at
      for (let y = 0; y < DEFAULT_BOARD_SIZE; y++) {
        for (let x = 0; x < DEFAULT_BOARD_SIZE; x++) {
          if (simulation[y][x] && this.knowledgeBoard[y][x] === "unknown") {
            heatmap[y][x]++;
          }
        }
      }
    }

    return heatmap;
  }

  chooseAttack(): Position {
    const heatmap = this.generateHeatmap();

    // Track the position with highest tally for ship
    let best: Position | null = null;
    let bestScore = -1;

    // Iterate across heatmap to find which position showed most likelihood of ship being located there
    for (let y = 0; y < DEFAULT_BOARD_SIZE; y++) {
      for (let x = 0; x < DEFAULT_BOARD_SIZE; x++) {
        // Only include cells that state where state is unknown
        if (
          this.knowledgeBoard[y][x] === "unknown" &&
          heatmap[y][x] > bestScore
        ) {
          bestScore = heatmap[y][x];
          best = { x, y };
        }
      }
    }

    // If no best position could be determined, fallback on just random selection
    // If not done randomly, ai will just follow left -> right, top -> bottom which makes it seem unnatural
    if (bestScore === 0) {
      best = this.chooseAttackRandom();
    }

    // Edge case
    if (!best) {
      throw new Error("No valid attack found");
    }

    // Remove position from available hits
    const bestIndex = this.availableHits.findIndex(
      (p) => p.x === best.x && p.y === best.y
    );
    if (bestIndex !== -1) {
      this.availableHits.splice(bestIndex, 1);
    }

    return best;
  }

  chooseAttackRandom(): Position {
    if (this.availableHits.length <= 0) {
      throw new Error("All positions exhausted");
    }

    const index = Math.floor(Math.random() * this.availableHits.length);
    const cellPosition = this.availableHits[index];

    this.availableHits.splice(index, 1);

    return cellPosition;
  }

  resetAI() {
    this.knowledgeBoard = Array.from(
      { length: DEFAULT_BOARD_SIZE },
      () => Array.from({ length: DEFAULT_BOARD_SIZE }, () => "unknown")
    );

    this.availableHits = [];
    for (let y = 0; y < DEFAULT_BOARD_SIZE; y++) {
      for (let x = 0; x < DEFAULT_BOARD_SIZE; x++) {
        this.availableHits.push({ x, y });
      }
    }

    this.remainingShips = [...SHIPS];
  }
}
