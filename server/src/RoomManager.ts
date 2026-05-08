import { v4 as uuidv4 } from 'uuid';
import type { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@battle-navy/shared';
import {
  GamePhase,
  AttackResultType,
  type Player,
  type Coordinate,
  type ShipPlacement,
  type AttackResult,
  TURN_TIME_LIMIT,
  RECONNECT_GRACE_PERIOD,
} from '@battle-navy/shared';
import { GameEngine, generateRandomPlacements } from './engine/GameEngine';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export class RoomManager {
  private rooms = new Map<string, InternalRoom>();
  private io: TypedServer;

  constructor(io: TypedServer) {
    this.io = io;
  }

  createRoom(player1: Player, player2: Player): string {
    const roomId = uuidv4().slice(0, 8);
    const room: InternalRoom = {
      id: roomId,
      phase: GamePhase.Placement,
      players: [player1, player2],
      engine: new GameEngine(),
      currentTurn: null,
      winner: null,
      timer: null,
      playersReady: [false, false],
      disconnectedAt: null,
      disconnectedPlayer: null,
    };
    this.rooms.set(roomId, room);
    return roomId;
  }

  getRoom(roomId: string): InternalRoom | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByPlayer(playerId: string): InternalRoom | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.some((p) => p.id === playerId)) {
        return room;
      }
    }
    return undefined;
  }

  getPlayerIndex(room: InternalRoom, playerId: string): number {
    return room.players[0].id === playerId ? 0 : 1;
  }

  placeShips(room: InternalRoom, playerId: string, placements: ShipPlacement[]): boolean {
    const idx = this.getPlayerIndex(room, playerId);
    const success = room.engine.placeShips(idx, placements);
    if (success) {
      room.playersReady[idx] = true;
      this.io.to(room.id).emit('game:opponent_ready');
      this.io.to(playerId).emit('game:opponent_ready');

      if (room.playersReady[0] && room.playersReady[1]) {
        room.phase = GamePhase.Battle;
        room.currentTurn = room.players[1].id;

        const ships0 = room.engine.getPlayerShips(0);
        const ships1 = room.engine.getPlayerShips(1);
        this.io.to(room.players[0].id).emit('game:start', { yourTurn: false, ships: ships0 });
        this.io.to(room.players[1].id).emit('game:start', { yourTurn: true, ships: ships1 });
        this.io.to(room.players[1].id).emit('game:your_turn', {
          timeLimit: TURN_TIME_LIMIT,
        });
        this.io.to(room.players[0].id).emit('game:opponent_turn');
        this.startTurnTimer(room);
      }
    }
    return success;
  }

  processAttack(room: InternalRoom, playerId: string, coord: Coordinate): AttackResult | null {
    if (room.currentTurn !== playerId) return null;
    if (room.phase !== GamePhase.Battle) return null;

    const idx = this.getPlayerIndex(room, playerId);
    const result = room.engine.processAttack(idx, coord);
    if (!result) return null;

    // Send result to attacker
    this.io.to(playerId).emit('game:attack_result', result);

    // Send to defender (hide ship info on miss)
    const defenderId = room.players[1 - idx].id;
    if (result.result === 'miss') {
      this.io.to(defenderId).emit('game:opponent_attack', {
        x: result.x,
        y: result.y,
        result: result.result,
      });
    } else {
      this.io.to(defenderId).emit('game:opponent_attack', result);
    }

    // Check win condition
    if (room.engine.isPlayerDefeated(1 - idx)) {
      room.phase = GamePhase.GameOver;
      room.winner = playerId;
      this.clearTurnTimer(room);
      this.io.to(room.id).emit('game:over', {
        winner: playerId,
        loser: room.players[1 - idx].id,
        reason: 'all_sunk',
      });
      return result;
    }

    this.switchTurn(room);
    return result;
  }

  private switchTurn(room: InternalRoom): void {
    this.clearTurnTimer(room);
    const nextPlayer = room.players.find((p) => p.id !== room.currentTurn)!;
    room.currentTurn = nextPlayer.id;

    this.io.to(nextPlayer.id).emit('game:your_turn', { timeLimit: TURN_TIME_LIMIT });
    this.io.to(room.players.find((p) => p.id !== nextPlayer.id)!.id).emit('game:opponent_turn');
    this.startTurnTimer(room);
  }

  private startTurnTimer(room: InternalRoom): void {
    this.clearTurnTimer(room);
    room.timer = setTimeout(() => {
      if (room.phase !== GamePhase.Battle || !room.currentTurn) return;

      const coord = room.engine.getRandomTarget(this.getPlayerIndex(room, room.currentTurn));
      this.processAttack(room, room.currentTurn, coord);

      this.io.to(room.id).emit('game:timer_expired', {
        x: coord.x,
        y: coord.y,
        result: AttackResultType.Miss,
      });
    }, TURN_TIME_LIMIT * 1000);
  }

  private clearTurnTimer(room: InternalRoom): void {
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }
  }

  handleDisconnect(playerId: string): void {
    const room = this.getRoomByPlayer(playerId);
    if (!room || room.phase === GamePhase.GameOver) return;

    room.disconnectedAt = Date.now();
    room.disconnectedPlayer = playerId;

    this.io.to(room.id).emit('game:opponent_disconnected', {
      waitTime: RECONNECT_GRACE_PERIOD,
    });

    setTimeout(() => {
      if (room.disconnectedPlayer === playerId && room.phase !== GamePhase.GameOver) {
        room.phase = GamePhase.GameOver;
        const winner = room.players.find((p) => p.id !== playerId)!;
        room.winner = winner.id;
        this.clearTurnTimer(room);
        this.io.to(room.id).emit('game:over', {
          winner: winner.id,
          loser: playerId,
          reason: 'disconnect',
        });
      }
    }, RECONNECT_GRACE_PERIOD * 1000);
  }

  handleReconnect(playerId: string): void {
    const room = this.getRoomByPlayer(playerId);
    if (!room) return;

    room.disconnectedAt = null;
    room.disconnectedPlayer = null;
    this.io.to(room.id).emit('game:opponent_reconnected');
  }

  destroyRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      this.clearTurnTimer(room);
      this.rooms.delete(roomId);
    }
  }

  getRoomCount(): number {
    return this.rooms.size;
  }
}

interface InternalRoom {
  id: string;
  phase: GamePhase;
  players: Player[];
  engine: GameEngine;
  currentTurn: string | null;
  winner: string | null;
  timer: NodeJS.Timeout | null;
  playersReady: [boolean, boolean];
  disconnectedAt: number | null;
  disconnectedPlayer: string | null;
}
