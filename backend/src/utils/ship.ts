import type { Position, ShipModel } from "../models.ts";

export class Ship {
  private _hits = 0;
  readonly positions: Position[] = [];
  readonly specs: ShipModel;

  constructor(specs: ShipModel) {
    this.specs = specs;
  }

  get length(): number {
    return this.specs.length;
  }

  get hits() {
    return this._hits;
  }

  hit() {
    if (!this.isSunk()) {
      this._hits++;
    }
  }

  isSunk(): boolean {
    return this._hits >= this.specs.length;
  }
}
