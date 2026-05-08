export interface Coordinate {
  x: number; // 0-9 (column)
  y: number; // 0-9 (row)
}

export enum ShipType {
  Carrier = 'carrier',
  Battleship = 'battleship',
  Cruiser = 'cruiser',
  Submarine = 'submarine',
  Destroyer = 'destroyer',
}

export interface ShipConfig {
  type: ShipType;
  size: number;
  name: string;
}

export enum Orientation {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export interface ShipPlacement {
  shipType: ShipType;
  x: number;
  y: number;
  orientation: Orientation;
}

export interface Ship {
  type: ShipType;
  size: number;
  name: string;
  orientation: Orientation;
  cells: Coordinate[];
  hits: boolean[];
}

export interface CellState {
  x: number;
  y: number;
  isHit: boolean;
  hasShip: boolean;
  shipType?: ShipType;
}

export type Board = CellState[][];

export enum GamePhase {
  Waiting = 'waiting',
  Placement = 'placement',
  Battle = 'battle',
  GameOver = 'game_over',
}

export enum AttackResultType {
  Miss = 'miss',
  Hit = 'hit',
  Sink = 'sink',
}

export interface AttackResult {
  x: number;
  y: number;
  result: AttackResultType;
  shipId?: ShipType;
  shipName?: string;
}

export interface Player {
  id: string;
  nickname: string;
  ready: boolean;
  ships: Ship[];
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentTurn: string | null;
  winner: string | null;
}

export type TimerHandle = ReturnType<typeof setTimeout>;

export interface GameRoom {
  id: string;
  players: Player[];
  phase: GamePhase;
  attacks: Map<string, Coordinate[]>;
  currentTurn: string | null;
  winner: string | null;
  timer: TimerHandle | null;
}
