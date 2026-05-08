import p5 from 'p5';
import { NetworkClient } from './NetworkClient';
import { LobbyScene } from './scenes/LobbyScene';
import { PlacementScene } from './scenes/PlacementScene';
import { BattleScene } from './scenes/BattleScene';
import { GameOverScene } from './scenes/GameOverScene';
import { BASE_W, BASE_H, setTransform, toBase } from './utils';

export type SceneName = 'lobby' | 'placement' | 'battle' | 'gameover';

export interface Scene {
  enter(ctx: SceneContext): void;
  exit(): void;
  draw(p: p5): void;
  mousePressed(p: p5, mx: number, my: number): void;
}

export interface SceneContext {
  net: NetworkClient;
  nickname: string;
  playerId: string;
  opponentNickname: string;
  myShips: { shipType: string; cells: { x: number; y: number }[] }[];
  switchScene: (name: SceneName) => void;
}

const net = new NetworkClient();
let currentScene: Scene | null = null;
let context: SceneContext;

const scenes: Record<SceneName, Scene> = {
  lobby: new LobbyScene(),
  placement: new PlacementScene(),
  battle: new BattleScene(),
  gameover: new GameOverScene(),
};

function switchScene(name: SceneName): void {
  if (currentScene) currentScene.exit();
  currentScene = scenes[name];
  currentScene.enter(context);
}

new p5((p: p5) => {
  p.setup = () => {
    const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.style('display', 'block');
    canvas.style('position', 'fixed');
    canvas.style('top', '0');
    canvas.style('left', '0');
    canvas.style('z-index', '0');

    context = {
      net,
      nickname: '',
      playerId: '',
      opponentNickname: '',
      myShips: [],
      switchScene,
    };

    net.connect();
    switchScene('lobby');
  };

  p.draw = () => {
    const scaleX = p.width / BASE_W;
    const scaleY = p.height / BASE_H;
    const s = Math.min(scaleX, scaleY);
    const ox = (p.width - BASE_W * s) / 2;
    const oy = (p.height - BASE_H * s) / 2;
    setTransform(s, ox, oy);

    p.background(10, 25, 60);

    p.push();
    p.translate(ox, oy);
    p.scale(s);
    if (currentScene) currentScene.draw(p);
    p.pop();
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  p.mousePressed = () => {
    if (currentScene) {
      const base = toBase(p.mouseX, p.mouseY);
      currentScene.mousePressed(p, base.x, base.y);
    }
  };
});
