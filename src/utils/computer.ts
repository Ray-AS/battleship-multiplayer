import { DEFAULT_BOARD_SIZE } from "../configs";
import { Outcome, type Orientation, type Position, type ShipModel, type SimulationBoard } from "../models";
import { Player, SHIPS } from "./player";

export class Computer extends Player {
  // Keep track of previously hit positions to ensure no repetition
  private knowledgeBoard: ("unknown" | "miss" | "hit")[][];

  constructor(
    private availableHits: Position[] = [],
    private remainingShips: ShipModel[] = [...SHIPS]
  ) {
    super();
    for (let y = 0; y < DEFAULT_BOARD_SIZE; y++) {
      for (let x = 0; x < DEFAULT_BOARD_SIZE; x++) {
        this.availableHits.push({ x, y });
      }
    }
    this.knowledgeBoard = Array.from({ length: DEFAULT_BOARD_SIZE }, () =>
      Array.from({ length: DEFAULT_BOARD_SIZE }, () => "unknown")
    );
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

      if (
        x < 0 ||
        y < 0 ||
        x >= DEFAULT_BOARD_SIZE ||
        y >= DEFAULT_BOARD_SIZE
      ) return false;

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

    for (const ship of this.remainingShips) {
      let placed = false;

      for (let attempts = 0; attempts < 50; attempts++) {
        const orientation = ["horizontal", "vertical"][Math.floor(Math.random() * 2)] as Orientation;
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

    return simulationBoard;
  }

  registerOutcome(position: Position, outcome: Outcome) {
    if (outcome === Outcome.HIT) {
      this.knowledgeBoard[position.y][position.x] = "hit";
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

  chooseAttack() {}
}
