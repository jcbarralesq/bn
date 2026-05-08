import { TURN_TIME_LIMIT } from '@battle-navy/shared';

type TickCallback = (remaining: number) => void;

/**
 * Manages per-turn countdowns with second-by-second tick events.
 * Delegates final timeout handling to the caller.
 */
export class TimerManager {
  private timer: NodeJS.Timeout | null = null;
  private tickInterval: NodeJS.Timeout | null = null;
  private remaining = 0;
  private onTick: TickCallback;
  private onExpire: () => void;

  constructor(onTick: TickCallback, onExpire: () => void) {
    this.onTick = onTick;
    this.onExpire = onExpire;
  }

  start(limit: number = TURN_TIME_LIMIT): void {
    this.stop();
    this.remaining = limit;

    this.tickInterval = setInterval(() => {
      this.remaining--;
      this.onTick(this.remaining);

      if (this.remaining <= 0) {
        this.stop();
        this.onExpire();
      }
    }, 1000);
  }

  stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  getRemaining(): number {
    return this.remaining;
  }
}
