import type p5 from 'p5';
import { GRID_SIZE, SHIPS, Orientation, ShipType } from '@battle-navy/shared';
import type { ShipPlacement } from '@battle-navy/shared';
import { BoardRenderer, type RenderCell } from '../BoardRenderer';
import type { Scene, SceneContext } from '../main';
import { toBase } from '../utils';
import { setMyShips } from '../shipStore';

interface Placed {
  shipType: ShipType;
  x: number;
  y: number;
  orientation: Orientation;
}

export class PlacementScene implements Scene {
  private ctx!: SceneContext;
  private renderer!: BoardRenderer;
  private placed: Placed[] = [];
  private shipIdx = 0;
  private orient: Orientation = Orientation.Horizontal;
  private readySent = false;
  private errorMsg = '';
  private boardCells: RenderCell[][] = [];
  private cellSize = 48;
  private bx = 0;
  private by = 0;

  private get ship() { return SHIPS[this.shipIdx]; }

  enter(ctx: SceneContext): void {
    this.ctx = ctx;
    this.placed = [];
    this.shipIdx = 0;
    this.orient = Orientation.Horizontal;
    this.readySent = false;
    this.errorMsg = '';

    const gridW = GRID_SIZE * this.cellSize;
    this.bx = (1100 - gridW) / 2;
    this.by = 120;

    this.boardCells = Array.from({ length: GRID_SIZE }, (_, y) =>
      Array.from({ length: GRID_SIZE }, (_, x) => ({ x, y, isHit: false, hasShip: false }))
    );

    document.addEventListener('keydown', this.onKey);

    this.ctx.net.on('game:start', ({ ships }) => {
      this.ctx.myShips = ships || [];
      this.ctx.switchScene('battle');
    });
    this.ctx.net.on('player:error', ({ message }) => {
      this.errorMsg = message;
      this.readySent = false;
    });
  }

  exit(): void {
    document.removeEventListener('keydown', this.onKey);
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.key === 'r' || e.key === 'R') {
      this.orient = this.orient === Orientation.Horizontal ? Orientation.Vertical : Orientation.Horizontal;
    }
  };

  draw(p: p5): void {
    // ── Title / instruction ──
    p.textAlign(p.CENTER, p.TOP);
    if (this.readySent) {
      p.fill(180, 200, 240);
      p.textSize(18);
      p.text('Esperando a que el oponente coloque sus barcos...', 1100 / 2, 15);
    } else {
      const s = this.ship;
      const orientText = this.orient === Orientation.Horizontal ? 'Horizontal' : 'Vertical';
      p.fill(200, 220, 255);
      p.textSize(18);
      p.text(`Coloca: ${s.name} (${s.size})  —  [${orientText}]  —  Click para colocar, R para rotar`, 1100 / 2, 15);

      // Subtitle with remaining ships
      p.textSize(13);
      p.fill(140, 170, 210);
      const remaining = SHIPS.slice(this.shipIdx).map(s => `${s.name}(${s.size})`).join(', ');
      p.text(`Faltan: ${remaining}`, 1100 / 2, 42);
    }

    // ── Ghost preview ──
    if (!this.readySent) {
      const mouse = toBase(p.mouseX, p.mouseY);
      const mx = mouse.x - this.bx - 20;
      const my = mouse.y - this.by - 25;
      const gx = Math.floor(mx / this.cellSize);
      const gy = Math.floor(my / this.cellSize);
      if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
        const ghost = this.cellsAt(gx, gy, this.orient, this.ship?.size || 0);
        const ok = this.valid(ghost);
        for (const c of ghost) {
          if (c.x >= 0 && c.x < GRID_SIZE && c.y >= 0 && c.y < GRID_SIZE) {
            p.fill(ok ? 'rgba(60, 200, 60, 0.35)' : 'rgba(200, 60, 60, 0.35)');
            p.noStroke();
            p.rect(this.bx + 20 + c.x * this.cellSize + 1, this.by + 25 + c.y * this.cellSize + 1, this.cellSize - 2, this.cellSize - 2, 2);
          }
        }
      }
    }

    // ── Board ──
    const renderCells = this.boardCells.map(r => r.map(c => ({ ...c })));
    for (const ship of this.placed) {
      const size = SHIPS.find(s => s.type === ship.shipType)?.size || 0;
      for (let i = 0; i < size; i++) {
        const cx = ship.orientation === Orientation.Horizontal ? ship.x + i : ship.x;
        const cy = ship.orientation === Orientation.Vertical ? ship.y + i : ship.y;
        if (cy >= 0 && cy < GRID_SIZE && cx >= 0 && cx < GRID_SIZE) renderCells[cy][cx].hasShip = true;
      }
    }

    this.renderer = new BoardRenderer(p, this.bx + 20, this.by + 25, this.cellSize);
    this.renderer.drawGrid('Tu flota', renderCells, true);

    // ── Error ──
    if (this.errorMsg) {
      p.fill(255, 80, 80);
      p.textSize(15);
      p.textAlign(p.CENTER, p.TOP);
      p.text(this.errorMsg, 1100 / 2, this.by + GRID_SIZE * this.cellSize + 40);
    }

    // ── Ship miniatura (esquina inferior derecha) ──
    if (!this.readySent && this.ship) {
      const px = 1100 - 200;
      const py = 700 - 120;
      const ps = 22;

      p.fill(30, 50, 100, 200);
      p.noStroke();
      p.rect(px - 10, py - 10, 170, 90, 8);

      p.fill(200, 220, 255);
      p.textSize(13);
      p.textAlign(p.LEFT, p.TOP);
      p.text(`${this.ship.name} (${this.ship.size})`, px, py);

      const ot = this.orient === Orientation.Horizontal ? '→ Horizontal' : '↓ Vertical';
      p.fill(180, 200, 240);
      p.text(ot, px, py + 20);

      for (let i = 0; i < this.ship.size; i++) {
        const cx = this.orient === Orientation.Horizontal ? px + i * (ps + 2) : px;
        const cy = this.orient === Orientation.Vertical ? py + 40 + i * (ps + 2) : py + 40;
        p.fill(100, 180, 100);
        p.stroke(130, 200, 130);
        p.strokeWeight(1);
        p.rect(cx, cy, ps, ps, 3);
      }
    }

    // ── Ready button (p5-drawn) ──
    if (!this.readySent) {
      const allPlaced = this.placed.length === SHIPS.length;
      const btnX = 1100 / 2 - 70;
      const btnY = this.by + GRID_SIZE * this.cellSize + 50;
      const btnW = 140;
      const btnH = 36;

      if (allPlaced) {
        p.fill(37, 99, 235);
        p.noStroke();
        p.rect(btnX, btnY, btnW, btnH, 6);
        p.fill(255);
        p.textSize(14);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('¡LISTO!', 1100 / 2, btnY + btnH / 2);

        if (p.mouseX >= btnX && p.mouseX <= btnX + btnW && p.mouseY >= btnY && p.mouseY <= btnY + btnH) {
          // Click handled in mousePressed
        }
      }
    }
  }

  mousePressed(p: p5, mx: number, my: number): void {
    if (this.readySent) return;

    // Check Ready button click
    const allPlaced = this.placed.length === SHIPS.length;
    const btnY = this.by + GRID_SIZE * this.cellSize + 50;
    if (allPlaced && mx >= 1100 / 2 - 70 && mx <= 1100 / 2 + 70 && my >= btnY && my <= btnY + 36) {
      this.doReady();
      return;
    }

    // Check board click for placement
    const cell = this.renderer?.handleClick(mx, my);
    if (!cell) return;

    const cells = this.cellsAt(cell.x, cell.y, this.orient, this.ship?.size || 0);
    if (!this.valid(cells)) { this.errorMsg = 'Posición inválida'; return; }

    this.placed.push({ shipType: this.ship!.type, x: cell.x, y: cell.y, orientation: this.orient });
    for (const c of cells) this.boardCells[c.y][c.x].hasShip = true;
    this.shipIdx++;
    this.errorMsg = '';
    if (this.shipIdx >= SHIPS.length) this.doReady();
  }

  private doReady(): void {
    if (this.placed.length !== SHIPS.length) return;
    this.readySent = true;

    // Store ships locally so BattleScene can read them
    const shipData = this.placed.map((s) => {
      const size = SHIPS.find(c => c.type === s.shipType)?.size || 0;
      const cells: { x: number; y: number }[] = [];
      for (let i = 0; i < size; i++) cells.push({
        x: s.orientation === Orientation.Horizontal ? s.x + i : s.x,
        y: s.orientation === Orientation.Vertical ? s.y + i : s.y,
      });
      return { shipType: s.shipType, cells };
    });
    this.ctx.myShips = shipData;
    setMyShips(shipData);

    const placements: ShipPlacement[] = this.placed.map(s => ({
      shipType: s.shipType, x: s.x, y: s.y, orientation: s.orientation,
    }));
    this.ctx.net.emit('game:place_ships', { ships: placements });
  }

  private cellsAt(x: number, y: number, orient: Orientation, size: number): { x: number; y: number }[] {
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < size; i++) out.push({ x: orient === Orientation.Horizontal ? x + i : x, y: orient === Orientation.Vertical ? y + i : y });
    return out;
  }

  private valid(cells: { x: number; y: number }[]): boolean {
    for (const c of cells) {
      if (c.x < 0 || c.x >= GRID_SIZE || c.y < 0 || c.y >= GRID_SIZE) return false;
      if (this.boardCells[c.y][c.x].hasShip) return false;
    }
    return true;
  }
}
