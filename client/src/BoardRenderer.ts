import type p5 from 'p5';
import { GRID_SIZE } from '@battle-navy/shared';
import type { Coordinate } from '@battle-navy/shared';

export interface RenderCell {
  x: number;
  y: number;
  isHit: boolean;
  hasShip: boolean;
  isSunk?: boolean;
}

export class BoardRenderer {
  private p: p5;
  offsetX: number;
  offsetY: number;
  cellSize: number;

  constructor(p: p5, offsetX: number, offsetY: number, cellSize: number) {
    this.p = p;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.cellSize = cellSize;
  }

  drawGrid(
    label: string,
    cells: RenderCell[][],
    showShips: boolean = false,
    interactive: boolean = false,
    onCellClick?: (x: number, y: number) => void
  ): void {
    const p = this.p;
    const cs = this.cellSize;
    const gridW = GRID_SIZE * cs;

    // Background
    p.fill(30, 60, 120);
    p.noStroke();
    p.rect(this.offsetX - 8, this.offsetY - 30, gridW + 16, gridW + 45, 5);

    // Label
    p.fill(200, 220, 255);
    p.textSize(Math.max(11, cs * 0.35));
    p.textAlign(p.CENTER, p.TOP);
    p.text(label, this.offsetX + gridW / 2, this.offsetY - 26);

    // Column labels (A-J)
    p.textSize(Math.max(9, cs * 0.28));
    p.textAlign(p.CENTER, p.CENTER);
    for (let x = 0; x < GRID_SIZE; x++) {
      p.fill(180, 200, 240);
      p.text(String.fromCharCode(65 + x), this.offsetX + x * cs + cs / 2, this.offsetY - 11);
    }

    // Row labels (1-10)
    p.textAlign(p.CENTER, p.CENTER);
    for (let y = 0; y < GRID_SIZE; y++) {
      p.fill(180, 200, 240);
      p.text(`${y + 1}`, this.offsetX - 12, this.offsetY + y * cs + cs / 2);
    }

    // Draw ships on player's board — cells with hasShip=true
    if (showShips) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const cell = cells[y]?.[x];
          if (cell?.hasShip && !cell.isHit) {
            // Draw a visible ship cell
            p.fill(70, 180, 70);
            p.stroke(120, 230, 120);
            p.strokeWeight(2);
            p.rect(
              this.offsetX + x * cs + 1,
              this.offsetY + y * cs + 1,
              cs - 2,
              cs - 2,
              4
            );
            // Inner highlight
            p.fill(100, 210, 100, 80);
            p.noStroke();
            p.rect(
              this.offsetX + x * cs + 4,
              this.offsetY + y * cs + 4,
              cs - 8,
              cs - 8,
              2
            );
          }
        }
      }
    }

    // Draw cells (grid + hit/miss markers)
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cx = this.offsetX + x * cs;
        const cy = this.offsetY + y * cs;
        const cell = cells[y]?.[x];

        // Cell outline
        p.stroke(60, 100, 190);
        p.strokeWeight(1);
        p.noFill();
        p.rect(cx, cy, cs, cs);

        if (cell) {
          if (cell.isHit) {
            if (cell.hasShip) {
              // Hit — red circle
              p.fill(220, 50, 50, 200);
              p.noStroke();
              p.circle(cx + cs / 2, cy + cs / 2, cs * 0.4);

              if (cell.isSunk) {
                p.stroke(220, 50, 50);
                p.strokeWeight(Math.max(2, cs * 0.08));
                p.line(cx + cs * 0.2, cy + cs * 0.2, cx + cs * 0.8, cy + cs * 0.8);
                p.line(cx + cs * 0.8, cy + cs * 0.2, cx + cs * 0.2, cy + cs * 0.8);
              }
            } else {
              // Miss — white dot
              p.fill(255, 255, 255, 180);
              p.noStroke();
              p.circle(cx + cs / 2, cy + cs / 2, cs * 0.2);
            }
          } else if (showShips && cell.hasShip) {
            // Ship cell not hit — subtle border
            p.stroke(130, 200, 130);
            p.strokeWeight(1);
            p.noFill();
            p.rect(cx + 2, cy + 2, cs - 4, cs - 4);
          }
        }
      }
    }

    // Interactive hover for opponent's board
    if (interactive && onCellClick) {
      const mx = p.mouseX - this.offsetX;
      const my = p.mouseY - this.offsetY;
      const gridX = Math.floor(mx / cs);
      const gridY = Math.floor(my / cs);

      if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
        const cell = cells[gridY]?.[gridX];
        if (!cell?.isHit) {
          p.fill(255, 255, 255, 30);
          p.noStroke();
          p.rect(
            this.offsetX + gridX * cs,
            this.offsetY + gridY * cs,
            cs,
            cs
          );
        }
      }
    }
  }

  handleClick(mx: number, my: number): Coordinate | null {
    const gx = Math.floor((mx - this.offsetX) / this.cellSize);
    const gy = Math.floor((my - this.offsetY) / this.cellSize);

    if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
      return { x: gx, y: gy };
    }
    return null;
  }
}
