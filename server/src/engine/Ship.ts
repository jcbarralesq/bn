import {
  ShipType,
  Orientation,
  type Coordinate,
  type Ship as ShipData,
} from '@battle-navy/shared';

export class Ship implements ShipData {
  type: ShipType;
  size: number;
  name: string;
  orientation: Orientation;
  cells: Coordinate[];
  hits: boolean[];

  constructor(type: ShipType, x: number, y: number, orientation: Orientation) {
    const config = SHIP_CONFIG[type];
    this.type = type;
    this.size = config.size;
    this.name = config.name;
    this.orientation = orientation;
    this.hits = new Array(this.size).fill(false);

    this.cells = [];
    for (let i = 0; i < this.size; i++) {
      this.cells.push({
        x: orientation === Orientation.Horizontal ? x + i : x,
        y: orientation === Orientation.Vertical ? y + i : y,
      });
    }
  }

  get isSunk(): boolean {
    return this.hits.every((h) => h);
  }

  receiveAttack(x: number, y: number): boolean {
    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i].x === x && this.cells[i].y === y) {
        if (this.hits[i]) return false; // already hit here
        this.hits[i] = true;
        return true;
      }
    }
    return false;
  }
}

const SHIP_CONFIG: Record<ShipType, { size: number; name: string }> = {
  [ShipType.Carrier]: { size: 5, name: 'Portaaviones' },
  [ShipType.Battleship]: { size: 4, name: 'Acorazado' },
  [ShipType.Cruiser]: { size: 3, name: 'Crucero' },
  [ShipType.Submarine]: { size: 3, name: 'Submarino' },
  [ShipType.Destroyer]: { size: 2, name: 'Destructor' },
};
