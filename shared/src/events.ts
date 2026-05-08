import type { Coordinate, ShipPlacement, AttackResultType, ShipType } from './types';

// ── Client → Server Events ──

export interface ClientToServerEvents {
  'player:join': (data: { nickname: string }) => void;
  'player:leave_queue': () => void;
  'game:place_ships': (data: { ships: ShipPlacement[] }) => void;
  'game:attack': (data: Coordinate) => void;
  'game:acknowledge_over': () => void;
}

// ── Server → Client Events ──

export interface ServerToClientEvents {
  'player:joined': (data: { id: string; nickname: string }) => void;
  'player:error': (data: { message: string }) => void;
  'match:found': (data: {
    roomId: string;
    opponent: { id: string; nickname: string };
    youStartPlacing: boolean;
  }) => void;
  'match:queue_status': (data: { position: number }) => void;
  'game:start_placement': () => void;
  'game:opponent_ready': () => void;
  'game:start': (data: {
    yourTurn: boolean;
    ships: { shipType: ShipType; cells: Coordinate[] }[];
  }) => void;
  'game:your_turn': (data: { timeLimit: number }) => void;
  'game:opponent_turn': () => void;
  'game:attack_result': (data: {
    x: number;
    y: number;
    result: AttackResultType;
    shipId?: ShipType;
    shipName?: string;
  }) => void;
  'game:opponent_attack': (data: {
    x: number;
    y: number;
    result: AttackResultType;
    shipId?: ShipType;
    shipName?: string;
  }) => void;
  'game:timer_tick': (data: { remaining: number }) => void;
  'game:timer_expired': (data: {
    x: number;
    y: number;
    result: AttackResultType;
  }) => void;
  'game:over': (data: {
    winner: string;
    loser: string;
    reason: 'all_sunk' | 'disconnect' | 'forfeit';
  }) => void;
  'game:opponent_disconnected': (data: { waitTime: number }) => void;
  'game:opponent_reconnected': () => void;
  'game:opponent_forfeit': () => void;
}

// ── Socket.io Server Socket Type ──

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  playerId: string;
  nickname: string;
  roomId?: string;
}
