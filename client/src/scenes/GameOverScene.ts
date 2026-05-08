import type p5 from 'p5';
import { GRID_SIZE } from '@battle-navy/shared';
import { BoardRenderer, type RenderCell } from '../BoardRenderer';
import type { Scene, SceneContext } from '../main';

export class GameOverScene implements Scene {
  private ctx!: SceneContext;
  private isVictory = false;
  private myCells: RenderCell[][] = [];
  private renderer!: BoardRenderer;
  private acknowledged = false;
  private cellSize = 50;

  enter(ctx: SceneContext): void {
    this.ctx = ctx;
    this.isVictory = false;
    this.acknowledged = false;

    this.myCells = Array.from({ length: GRID_SIZE }, (_, y) =>
      Array.from({ length: GRID_SIZE }, (_, x) => ({ x, y, isHit: false, hasShip: false }))
    );
    for (const ship of ctx.myShips) {
      for (const cell of ship.cells) {
        if (cell.y >= 0 && cell.y < GRID_SIZE && cell.x >= 0 && cell.x < GRID_SIZE) {
          this.myCells[cell.y][cell.x].hasShip = true;
        }
      }
    }

    this.ctx.net.on('game:over', ({ winner }) => {
      this.isVictory = winner === this.ctx.playerId;
    });
  }

  exit(): void {}

  draw(p: p5): void {
    // ── Result title ──
    const resultText = this.isVictory ? '¡VICTORIA!' : 'DERROTA';
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(48);
    p.fill(this.isVictory ? p.color(80, 208, 128) : p.color(208, 80, 80));
    p.text(resultText, 1100 / 2, 20);

    // ── Board ──
    const gridW = GRID_SIZE * this.cellSize;
    const bx = (1100 - gridW) / 2;
    const by = 100;
    this.renderer = new BoardRenderer(p, bx + 20, by + 25, this.cellSize);
    this.renderer.drawGrid('Tablero final', this.myCells, true);

    // ── Play Again button ──
    const btnX = 1100 / 2 - 90;
    const btnY = by + gridW + 30;
    p.fill(37, 99, 235);
    p.noStroke();
    p.rect(btnX, btnY, 180, 44, 8);
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('JUGAR DE NUEVO', 1100 / 2, btnY + 22);
  }

  mousePressed(p: p5, mx: number, my: number): void {
    if (this.acknowledged) return;
    const btnX = 1100 / 2 - 90;
    const btnY = 100 + GRID_SIZE * this.cellSize + 30;
    if (mx >= btnX && mx <= btnX + 180 && my >= btnY && my <= btnY + 44) {
      this.acknowledged = true;
      this.ctx.net.emit('game:acknowledge_over');
      this.ctx.switchScene('lobby');
    }
  }
}
