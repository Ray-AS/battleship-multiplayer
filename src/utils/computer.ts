import { DEFAULT_BOARD_SIZE } from "../configs";
import {
  Outcome,
  type AttackOutcome,
  type Orientation,
  type Position,
  type ShipModel,
  type SimulationBoard,
} from "../models";
import { Player, SHIPS } from "./player";

export class Computer extends Player {
  // Keep track of previously hit positions to ensure no repetition
  private knowledgeBoard: ("unknown" | "miss" | "hit")[][];
  private remainingShips: ShipModel[];
  private availableHits: Position[];

  constructor() {
    super();
    this.knowledgeBoard = [];
    this.availableHits = [];
    this.remainingShips = [];
    this.resetAI();
  }

  private createHeatmap() {
    return Array.from({ length: DEFAULT_BOARD_SIZE }, () =>
      Array.from({ length: DEFAULT_BOARD_SIZE }, () => 0)
    );
  }

  private createSimulationBoard(): SimulationBoard {
    return Array.from({ length: DEFAULT_BOARD_SIZE }, () =>
      Array.from({ length: DEFAULT_BOARD_SIZE }, () => false)
    );
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

  registerOutcome(position: Position, { outcome, shipInfo }: AttackOutcome) {
    if (outcome === Outcome.HIT) {
      this.knowledgeBoard[position.y][position.x] = "hit";

      if (shipInfo && shipInfo.isSunk) {
        this.remainingShips = this.remainingShips.filter(
          (s) => s.model !== shipInfo.model
        );
      }
    } else if (outcome === Outcome.MISS) {
      this.knowledgeBoard[position.y][position.x] = "miss";
    }
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

  chooseAttack(): Position {
    const heatmap = this.generateHeatmap();

    let best: Position | null = null;
    let bestScore = -1;

    // Iterate across heatmap to find which position showed most likelihood of ship being located there
    for (let y = 0; y < DEFAULT_BOARD_SIZE; y++) {
      for (let x = 0; x < DEFAULT_BOARD_SIZE; x++) {
        if (
          this.knowledgeBoard[y][x] === "unknown" &&
          heatmap[y][x] > bestScore
        ) {
          bestScore = heatmap[y][x];
          best = { x, y };
        }
      }
    }

    if (bestScore === 0) {
      best = this.chooseAttackRandom();
    }

    if (!best) {
      throw new Error("No valid attack found");
    }

    const bestIndex = this.availableHits.findIndex(
      (p) => p.x === best.x && p.y === best.y
    );
    if (bestIndex !== -1) {
      this.availableHits.splice(bestIndex, 1);
    }

    return best;
  }

  resetAI() {
    this.knowledgeBoard = this.knowledgeBoard = Array.from(
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
