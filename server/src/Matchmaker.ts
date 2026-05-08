import { v4 as uuidv4 } from 'uuid';

interface QueuedPlayer {
  id: string;
  nickname: string;
  joinedAt: number;
}

export class Matchmaker {
  private queue: QueuedPlayer[] = [];
  private lock = false;

  addToQueue(playerId: string, nickname: string): number {
    // Don't add if already in queue
    const existing = this.queue.find((p) => p.id === playerId);
    if (!existing) {
      this.queue.push({ id: playerId, nickname, joinedAt: Date.now() });
    }
    return this.queue.length;
  }

  removeFromQueue(playerId: string): void {
    this.queue = this.queue.filter((p) => p.id !== playerId);
  }

  isInQueue(playerId: string): boolean {
    return this.queue.some((p) => p.id === playerId);
  }

  /** Try to pair two players. Returns null if fewer than 2 in queue. */
  tryPair(): { player1: QueuedPlayer; player2: QueuedPlayer } | null {
    if (this.lock) return null;
    if (this.queue.length < 2) return null;

    this.lock = true;

    // Sort by join time (FIFO) and take first 2
    this.queue.sort((a, b) => a.joinedAt - b.joinedAt);
    const player1 = this.queue.shift()!;
    const player2 = this.queue.shift()!;

    this.lock = false;
    return { player1, player2 };
  }

  get queueSize(): number {
    return this.queue.length;
  }
}
