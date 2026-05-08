import { describe, it, expect } from 'vitest';
import { ShipType, Orientation, AttackResultType } from '@battle-navy/shared';
import { GameEngine, generateRandomPlacements } from '../GameEngine';
import { Board } from '../Board';
import { Ship } from '../Ship';

describe('Ship', () => {
  it('creates horizontal ship with correct cells', () => {
    const ship = new Ship(ShipType.Carrier, 2, 3, Orientation.Horizontal);
    expect(ship.cells).toEqual([
      { x: 2, y: 3 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 5, y: 3 },
      { x: 6, y: 3 },
    ]);
  });

  it('creates vertical ship with correct cells', () => {
    const ship = new Ship(ShipType.Destroyer, 4, 1, Orientation.Vertical);
    expect(ship.cells).toEqual([
      { x: 4, y: 1 },
      { x: 4, y: 2 },
    ]);
  });

  it('tracks hits correctly', () => {
    const ship = new Ship(ShipType.Destroyer, 0, 0, Orientation.Horizontal);
    expect(ship.isSunk).toBe(false);

    ship.receiveAttack(0, 0);
    expect(ship.isSunk).toBe(false);

    ship.receiveAttack(1, 0);
    expect(ship.isSunk).toBe(true);
  });

  it('returns false for duplicate hit', () => {
    const ship = new Ship(ShipType.Destroyer, 0, 0, Orientation.Horizontal);
    expect(ship.receiveAttack(0, 0)).toBe(true);
    expect(ship.receiveAttack(0, 0)).toBe(false);
  });
});

describe('Board', () => {
  it('places ship within bounds', () => {
    const board = new Board();
    const result = board.placeShip({
      shipType: ShipType.Carrier,
      x: 0,
      y: 0,
      orientation: Orientation.Horizontal,
    });
    expect(result).toBe(true);
  });

  it('rejects ship out of bounds', () => {
    const board = new Board();
    const result = board.placeShip({
      shipType: ShipType.Carrier,
      x: 7,
      y: 0,
      orientation: Orientation.Horizontal,
    });
    expect(result).toBe(false);
  });

  it('rejects overlapping ships', () => {
    const board = new Board();
    board.placeShip({
      shipType: ShipType.Carrier,
      x: 0,
      y: 0,
      orientation: Orientation.Horizontal,
    });
    const result = board.placeShip({
      shipType: ShipType.Destroyer,
      x: 0,
      y: 0,
      orientation: Orientation.Horizontal,
    });
    expect(result).toBe(false);
  });

  it('resolves miss correctly', () => {
    const board = new Board();
    board.placeShip({
      shipType: ShipType.Destroyer,
      x: 0,
      y: 0,
      orientation: Orientation.Horizontal,
    });

    const result = board.receiveAttack(9, 9);
    expect(result.hit).toBe(false);
    expect(result.sunk).toBe(false);
  });

  it('resolves hit correctly', () => {
    const board = new Board();
    board.placeShip({
      shipType: ShipType.Carrier,
      x: 0,
      y: 0,
      orientation: Orientation.Horizontal,
    });

    const result = board.receiveAttack(0, 0);
    expect(result.hit).toBe(true);
    expect(result.sunk).toBe(false);
  });

  it('detects sunk ship', () => {
    const board = new Board();
    board.placeShip({
      shipType: ShipType.Destroyer,
      x: 0,
      y: 0,
      orientation: Orientation.Horizontal,
    });

    board.receiveAttack(0, 0);
    const result = board.receiveAttack(1, 0);
    expect(result.hit).toBe(true);
    expect(result.sunk).toBe(true);
  });

  it('tracks all sunk', () => {
    const board = new Board();
    board.placeShip({
      shipType: ShipType.Destroyer,
      x: 0,
      y: 0,
      orientation: Orientation.Horizontal,
    });

    expect(board.allSunk).toBe(false);
    board.receiveAttack(0, 0);
    board.receiveAttack(1, 0);
    expect(board.allSunk).toBe(true);
  });

  it('prevents attacking same cell twice', () => {
    const board = new Board();
    board.receiveAttack(5, 5);
    const result = board.receiveAttack(5, 5);
    expect(result.alreadyAttacked).toBe(true);
  });
});

describe('GameEngine', () => {
  it('accepts valid ship placement', () => {
    const engine = new GameEngine();
    const result = engine.placeShips(0, generateRandomPlacements());
    expect(result).toBe(true);
  });

  it('rejects duplicate ship types', () => {
    const engine = new GameEngine();
    const result = engine.placeShips(0, [
      { shipType: ShipType.Carrier, x: 0, y: 0, orientation: Orientation.Horizontal },
      { shipType: ShipType.Carrier, x: 0, y: 1, orientation: Orientation.Horizontal },
      { shipType: ShipType.Battleship, x: 0, y: 2, orientation: Orientation.Horizontal },
      { shipType: ShipType.Cruiser, x: 0, y: 3, orientation: Orientation.Horizontal },
      { shipType: ShipType.Submarine, x: 0, y: 4, orientation: Orientation.Horizontal },
      { shipType: ShipType.Destroyer, x: 0, y: 5, orientation: Orientation.Horizontal },
    ]);
    expect(result).toBe(false);
  });

  it('processes attack and returns result', () => {
    const engine = new GameEngine();
    engine.placeShips(0, generateRandomPlacements());
    engine.placeShips(1, generateRandomPlacements());

    const result = engine.processAttack(0, { x: 0, y: 0 });
    // Could be hit or miss, but should be a valid result
    expect(result).not.toBeNull();
    expect([AttackResultType.Hit, AttackResultType.Miss, AttackResultType.Sink]).toContain(result!.result);
  });

  it('returns null for out of bounds attack', () => {
    const engine = new GameEngine();
    const result = engine.processAttack(0, { x: 15, y: 15 });
    expect(result).toBeNull();
  });

  it('detects defeated player', () => {
    const engine = new GameEngine();
    expect(engine.isPlayerDefeated(0)).toBe(false);
    expect(engine.isPlayerDefeated(1)).toBe(false);
  });

  it('generates random targets', () => {
    const engine = new GameEngine();
    const target = engine.getRandomTarget(0);
    expect(target.x).toBeGreaterThanOrEqual(0);
    expect(target.x).toBeLessThan(10);
    expect(target.y).toBeGreaterThanOrEqual(0);
    expect(target.y).toBeLessThan(10);
  });
});

describe('generateRandomPlacements', () => {
  it('generates valid placements for all 5 ships', () => {
    const placements = generateRandomPlacements();
    expect(placements).toHaveLength(5);

    const types = placements.map((p) => p.shipType);
    expect(types).toContain(ShipType.Carrier);
    expect(types).toContain(ShipType.Battleship);
    expect(types).toContain(ShipType.Cruiser);
    expect(types).toContain(ShipType.Submarine);
    expect(types).toContain(ShipType.Destroyer);
  });

  it('all placements are valid on a fresh board', () => {
    const placements = generateRandomPlacements();
    const board = new Board();
    for (const p of placements) {
      expect(board.placeShip(p)).toBe(true);
    }
  });
});
