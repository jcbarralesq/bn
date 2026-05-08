import {
  GRID_SIZE,
  Orientation,
  type Coordinate,
  type ShipPlacement,
} from '@battle-navy/shared';
import { ShipType } from '@battle-navy/shared';
import { Ship } from './Ship';

export class Board {
  readonly grid: (Ship | null)[][];
  ships: Ship[];
  attackedCells: Set<string>;

  constructor() {
    this.grid = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => null)
    );
    this.ships = [];
    this.attackedCells = new Set();
  }

  private cellKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  placeShip(placement: ShipPlacement): boolean {
    const ship = new Ship(
      placement.shipType,
      placement.x,
      placement.y,
      placement.orientation
    );

    if (!this.isValidPlacement(ship)) {
      return false;
    }

    for (const cell of ship.cells) {
      this.grid[cell.y][cell.x] = ship;
    }
    this.ships.push(ship);
    return true;
  }

  isValidPlacement(ship: Ship): boolean {
    for (const cell of ship.cells) {
      if (cell.x < 0 || cell.x >= GRID_SIZE || cell.y < 0 || cell.y >= GRID_SIZE) {
        return false;
      }
      if (this.grid[cell.y][cell.x] !== null) {
        return false;
      }
    }
    return true;
  }

  receiveAttack(x: number, y: number): {
    hit: boolean;
    sunk: boolean;
    shipType?: ShipType;
    shipName?: string;
    alreadyAttacked: boolean;
  } {
    const key = this.cellKey(x, y);
    if (this.attackedCells.has(key)) {
      return { hit: false, sunk: false, alreadyAttacked: true };
    }
    this.attackedCells.add(key);

    const ship = this.grid[y][x];
    if (!ship) {
      return { hit: false, sunk: false, alreadyAttacked: false };
    }

    ship.receiveAttack(x, y);
    return {
      hit: true,
      sunk: ship.isSunk,
      shipType: ship.type,
      shipName: ship.name,
      alreadyAttacked: false,
    };
  }

  isCoordAttackable(x: number, y: number): boolean {
    return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
  }

  isCellAttacked(x: number, y: number): boolean {
    return this.attackedCells.has(this.cellKey(x, y));
  }

  get allSunk(): boolean {
    return this.ships.length > 0 && this.ships.every((s) => s.isSunk);
  }

  /** Returns coordinates of cells not yet attacked. */
  getAvailableTargets(): Coordinate[] {
    const targets: Coordinate[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!this.isCellAttacked(x, y)) {
          targets.push({ x, y });
        }
      }
    }
    return targets;
  }
}
