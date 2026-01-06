import type { ShipModel } from "../models";

export class Ship {
  private _hits = 0
  constructor(readonly specs: ShipModel) {}

  get length(): number {
    return this.specs.length;
  }

  get hits() {
    return this._hits;
  }

  hit() {
    this._hits++;
  }

  isSunk(): boolean {
    return this._hits >= this.specs.length;
  }
}
