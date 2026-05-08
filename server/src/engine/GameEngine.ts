import {
  ShipType,
  Orientation,
  AttackResultType,
  type Coordinate,
  type ShipPlacement,
  type AttackResult,
} from '@battle-navy/shared';
import { Board } from './Board';
import { Ship } from './Ship';

export class GameEngine {
  readonly board1: Board;
  readonly board2: Board;

  constructor() {
    this.board1 = new Board();
    this.board2 = new Board();
  }

  placeShips(playerIndex: number, placements: ShipPlacement[]): boolean {
    if (placements.length !== 5) return false;

    const board = playerIndex === 0 ? this.board1 : this.board2;
    const placedTypes = new Set<ShipType>();

    for (const p of placements) {
      if (placedTypes.has(p.shipType)) return false;
      const valid = board.placeShip(p);
      if (!valid) return false;
      placedTypes.add(p.shipType);
    }

    const allTypes: ShipType[] = [
      ShipType.Carrier,
      ShipType.Battleship,
      ShipType.Cruiser,
      ShipType.Submarine,
      ShipType.Destroyer,
    ];
    return allTypes.every((t) => placedTypes.has(t));
  }

  processAttack(attackerIndex: number, coord: Coordinate): AttackResult | null {
    const { x, y } = coord;
    if (x < 0 || x >= 10 || y < 0 || y >= 10) return null;

    const defenderBoard = attackerIndex === 0 ? this.board2 : this.board1;

    const result = defenderBoard.receiveAttack(x, y);

    if (result.alreadyAttacked) {
      return null;
    }

    if (!result.hit) {
      return { x, y, result: AttackResultType.Miss };
    }

    if (result.sunk) {
      return {
        x,
        y,
        result: AttackResultType.Sink,
        shipId: result.shipType,
        shipName: result.shipName,
      };
    }

    return {
      x,
      y,
      result: AttackResultType.Hit,
      shipId: result.shipType,
      shipName: result.shipName,
    };
  }

  isPlayerDefeated(playerIndex: number): boolean {
    const board = playerIndex === 0 ? this.board1 : this.board2;
    return board.allSunk;
  }

  getRandomTarget(playerIndex: number): Coordinate {
    const defenderBoard = playerIndex === 0 ? this.board2 : this.board1;
    const targets = defenderBoard.getAvailableTargets();
    const idx = Math.floor(Math.random() * targets.length);
    return targets[idx];
  }

  getPlayerShips(playerIndex: number): { shipType: ShipType; cells: Coordinate[] }[] {
    const board = playerIndex === 0 ? this.board1 : this.board2;
    return board.ships.map((ship) => ({
      shipType: ship.type,
      cells: [...ship.cells],
    }));
  }
}

export function generateRandomPlacements(): ShipPlacement[] {
  const types: ShipType[] = [
    ShipType.Carrier,
    ShipType.Battleship,
    ShipType.Cruiser,
    ShipType.Submarine,
    ShipType.Destroyer,
  ];

  const board = new Board();
  const placements: ShipPlacement[] = [];

  for (const shipType of types) {
    let placed = false;

    for (let attempt = 0; attempt < 200 && !placed; attempt++) {
      const x = Math.floor(Math.random() * 10);
      const y = Math.floor(Math.random() * 10);
      const orientation = Math.random() < 0.5
        ? Orientation.Horizontal
        : Orientation.Vertical;

      const ship = new Ship(shipType, x, y, orientation);
      if (board.isValidPlacement(ship)) {
        board.placeShip({ shipType, x, y, orientation });
        placements.push({ shipType, x, y, orientation });
        placed = true;
      }
    }

    if (!placed) {
      // Should not happen on empty board, but fallback: clear and retry
      throw new Error(`Failed to place ship: ${shipType}`);
    }
  }

  return placements;
}
