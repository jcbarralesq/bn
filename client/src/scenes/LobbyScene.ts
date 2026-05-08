import type p5 from 'p5';
import type { Scene, SceneContext } from '../main';

export class LobbyScene implements Scene {
  private ctx!: SceneContext;
  private nickname = '';
  private statusText = '';
  private errorText = '';
  private inQueue = false;

  enter(ctx: SceneContext): void {
    this.ctx = ctx;
    this.inQueue = false;
    this.statusText = '';
    this.errorText = '';

    const lobby = document.getElementById('lobby-scene');
    if (lobby) lobby.style.display = 'flex';

    document.getElementById('join-btn')?.addEventListener('click', () => this.joinQueue());
    document.getElementById('leave-btn')?.addEventListener('click', () => this.leaveQueue());
    document.getElementById('nickname-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.joinQueue();
    });

    this.ctx.net.on('player:joined', ({ id, nickname }) => {
      this.ctx.playerId = id;
      this.ctx.nickname = nickname;
      this.errorText = '';
    });
    this.ctx.net.on('player:error', ({ message }) => {
      this.errorText = message;
      this.inQueue = false;
      this.statusText = '';
      this.updateUI();
    });
    this.ctx.net.on('match:found', ({ opponent }) => {
      this.ctx.opponentNickname = opponent.nickname;
      this.ctx.switchScene('placement');
    });
  }

  exit(): void {
    const lobby = document.getElementById('lobby-scene');
    if (lobby) lobby.style.display = 'none';
  }

  draw(p: p5): void {
    this.updateUI();

    // Decorative floating particles
    p.push();
    for (let i = 0; i < 8; i++) {
      const x = p.sin(p.frameCount * 0.001 + i * 1.8) * 200 + 1100 / 2;
      const y = p.cos(p.frameCount * 0.002 + i * 1.4) * 150 + 700 / 2;
      p.fill(40, 80, 180, 80 - i * 5);
      p.noStroke();
      p.circle(x, y, 40 + i * 12);
    }
    p.pop();
  }

  mousePressed(_p: p5, _mx: number, _my: number): void {}

  private joinQueue(): void {
    const input = document.getElementById('nickname-input') as HTMLInputElement;
    this.nickname = input?.value?.trim() || '';
    if (!this.nickname) {
      this.errorText = 'Ingresa un nombre';
      this.updateUI();
      return;
    }
    this.inQueue = true;
    this.errorText = '';
    this.statusText = 'Buscando oponente...';
    this.ctx.net.emit('player:join', { nickname: this.nickname });
    this.updateUI();
  }

  private leaveQueue(): void {
    this.ctx.net.emit('player:leave_queue');
    this.inQueue = false;
    this.statusText = '';
    this.updateUI();
  }

  private updateUI(): void {
    const status = document.getElementById('queue-status');
    if (status) status.textContent = this.statusText;
    const error = document.getElementById('error-message');
    if (error) error.textContent = this.errorText;
    const joinBtn = document.getElementById('join-btn');
    const leaveBtn = document.getElementById('leave-btn');
    const input = document.getElementById('nickname-input') as HTMLInputElement;

    if (joinBtn) joinBtn.style.display = this.inQueue ? 'none' : 'inline-block';
    if (leaveBtn) leaveBtn.style.display = this.inQueue ? 'inline-block' : 'none';
    if (input) input.disabled = this.inQueue;
  }
}
