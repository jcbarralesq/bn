import type p5 from 'p5';
import {
  GRID_SIZE,
  AttackResultType,
  TURN_TIME_LIMIT,
} from '@battle-navy/shared';
import { BoardRenderer, type RenderCell } from '../BoardRenderer';
import type { Scene, SceneContext } from '../main';
import { getMyShips } from '../shipStore';

export class BattleScene implements Scene {
  private ctx!: SceneContext;
  private myRenderer!: BoardRenderer;
  private oppRenderer!: BoardRenderer;
  private myCells: RenderCell[][] = [];
  private oppCells: RenderCell[][] = [];
  private myTurn = false;
  private timer = TURN_TIME_LIMIT;
  private statusMsg = '';
  private notificationText = '';
  private notificationType = '';
  private notificationTimer: number | null = null;
  private gameOver = false;

  private cellSize = 44;
  private boardGap = 50;
  private topY = 120;

  private get boardArea() {
    const totalW = GRID_SIZE * this.cellSize;
    const twoBoardsW = totalW * 2 + this.boardGap;
    const startX = (1100 - twoBoardsW) / 2;
    return { totalW, twoBoardsW, startX };
  }

  enter(ctx: SceneContext): void {
    this.ctx = ctx;
    this.myTurn = false;
    this.timer = TURN_TIME_LIMIT;
    this.statusMsg = 'Esperando...';
    this.notificationText = '';
    this.gameOver = false;

    // Init cells
    this.myCells = Array.from({ length: GRID_SIZE }, (_, y) =>
      Array.from({ length: GRID_SIZE }, (_, x) => ({ x, y, isHit: false, hasShip: false }))
    );
    this.oppCells = Array.from({ length: GRID_SIZE }, (_, y) =>
      Array.from({ length: GRID_SIZE }, (_, x) => ({ x, y, isHit: false, hasShip: false }))
    );

    // 1) Ships from context + store (set by PlacementScene.doReady)
    this.applyShips(ctx.myShips);
    this.applyShips(getMyShips());

    // 2) Also listen for game:start in case it arrives after enter()
    this.ctx.net.on('game:start', ({ ships }) => {
      if (ships && ships.length > 0) this.applyShips(ships);
    });

    // Network events
    this.ctx.net.on('game:your_turn', ({ timeLimit }) => {
      this.myTurn = true;
      this.timer = timeLimit;
      this.statusMsg = '¡Tu turno!';
    });
    this.ctx.net.on('game:opponent_turn', () => {
      this.myTurn = false;
      this.statusMsg = 'Turno del oponente...';
    });
    this.ctx.net.on('game:attack_result', (data) => {
      this.oppCells[data.y][data.x] = {
        ...this.oppCells[data.y][data.x], isHit: true,
        hasShip: data.result !== AttackResultType.Miss,
      };
      this.showNotification(
        data.result === AttackResultType.Sink ? `¡Hundido! ${data.shipName || ''}`
          : data.result === AttackResultType.Hit ? '¡Impacto!' : 'Agua'
      );
    });
    this.ctx.net.on('game:opponent_attack', (data) => {
      this.myCells[data.y][data.x] = {
        ...this.myCells[data.y][data.x], isHit: true,
        hasShip: data.result !== AttackResultType.Miss,
      };
      if (data.result === AttackResultType.Sink) {
        this.showNotification(`¡Tu ${data.shipName || 'barco'} fue hundido!`);
      }
    });
    this.ctx.net.on('game:timer_expired', (data) => {
      this.oppCells[data.y][data.x] = {
        ...this.oppCells[data.y][data.x], isHit: true,
        hasShip: data.result !== AttackResultType.Miss,
      };
      this.showNotification('¡Se acabó el tiempo!');
    });
    this.ctx.net.on('game:over', () => { this.gameOver = true; this.ctx.switchScene('gameover'); });
    this.ctx.net.on('game:opponent_disconnected', () => this.showNotification('Oponente desconectado. Esperando reconexión...'));
    this.ctx.net.on('game:opponent_reconnected', () => this.showNotification('Oponente reconectado'));
    this.ctx.net.on('game:opponent_forfeit', () => this.ctx.switchScene('gameover'));

    this.startLocalTimer();
  }

  private applyShips(ships: { shipType: string; cells: { x: number; y: number }[] }[]): void {
    for (const ship of ships) {
      for (const cell of ship.cells) {
        if (cell.y >= 0 && cell.y < GRID_SIZE && cell.x >= 0 && cell.x < GRID_SIZE) {
          this.myCells[cell.y][cell.x].hasShip = true;
        }
      }
    }
  }

  exit(): void {
    this.stopLocalTimer();
  }

  private localTimer: ReturnType<typeof setInterval> | null = null;
  private startLocalTimer(): void {
    this.stopLocalTimer();
    this.localTimer = setInterval(() => { if (this.myTurn && this.timer > 0) this.timer--; }, 1000);
  }
  private stopLocalTimer(): void { if (this.localTimer) { clearInterval(this.localTimer); this.localTimer = null; } }

  draw(p: p5): void {
    const { startX } = this.boardArea;
    const bSize = GRID_SIZE * this.cellSize;

    // ── Timer + Status (p5 drawn) ──
    const timerColor = this.myTurn
      ? this.timer <= 3 ? p.color(255, 60, 60)
        : this.timer <= 5 ? p.color(240, 200, 60)
          : p.color(200, 220, 255)
      : p.color(140, 160, 200);

    p.fill(timerColor);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    p.textFont('Arial');
    p.text(this.myTurn ? `${this.timer}` : '--', 1100 / 2, 30);

    p.textSize(18);
    p.fill(180, 200, 240);
    p.text(this.statusMsg, 1100 / 2, 65);

    // ── My board ──
    this.myRenderer = new BoardRenderer(p, startX, this.topY, this.cellSize);
    this.myRenderer.drawGrid(this.ctx.nickname, this.myCells, true);

    // ── Opponent board ──
    this.oppRenderer = new BoardRenderer(p, startX + bSize + this.boardGap, this.topY, this.cellSize);
    this.oppRenderer.drawGrid(this.ctx.opponentNickname, this.oppCells, false, this.myTurn);

    // ── Notification ──
    if (this.notificationText) {
      // Use HTML notification (already styled) for reliability
    }
  }

  mousePressed(p: p5, mx: number, my: number): void {
    if (!this.myTurn || this.gameOver) return;
    const cell = this.oppRenderer?.handleClick(mx, my);
    if (!cell) return;
    if (this.oppCells[cell.y][cell.x].isHit) return;
    this.myTurn = false;
    this.timer = 0;
    this.ctx.net.emit('game:attack', { x: cell.x, y: cell.y });
  }

  private showNotification(text: string): void {
    this.notificationText = text;
    const el = document.getElementById('notification');
    if (el) { el.textContent = text; el.className = 'notification show'; }
    if (this.notificationTimer) clearTimeout(this.notificationTimer);
    this.notificationTimer = window.setTimeout(() => {
      const n = document.getElementById('notification');
      if (n) n.className = 'notification';
    }, 2000);
  }
}
