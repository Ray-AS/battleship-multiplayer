export interface ShipSchema {
  length: number;
  hits: number;
  hit(): void;
  isSunk(): boolean;
}

export class Ship implements ShipSchema {
  private _hits = 0
  constructor(private readonly _length: number) {}

  get length(): number {
    return this._length;
  }

  get hits() {
    return this._hits;
  }

  hit() {
    this._hits++;
  }

  isSunk(): boolean {
    return this._hits >= this._length;
  }
}
