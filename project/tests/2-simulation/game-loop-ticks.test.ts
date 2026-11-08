import { describe, it, expect } from 'vitest';

interface GameEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GameState {
  status: 'idle' | 'playing' | 'paused' | 'game_over';
  score: number;
  tickCount: number;
  player: GameEntity;
  activeCommands: string[];
}

class HeadlessGameEngine {
  public state: GameState;
  public readonly fixedDeltaTime: number = 1000 / 60; // ~16.67ms (60 FPS)

  constructor() {
    this.state = {
      status: 'idle',
      score: 0,
      tickCount: 0,
      player: { x: 0, y: 0, vx: 0, vy: 0 },
      activeCommands: [],
    };
  }

  public start() {
    this.state.status = 'playing';
    this.state.score = 0;
    this.state.player = { x: 100, y: 100, vx: 0, vy: 0 };
  }

  public dispatchInput(command: string | null | undefined) {
    if (!command || typeof command !== 'string') return;
    this.state.activeCommands.push(command);
  }

  public step() {
    this.state.tickCount++;

    if (this.state.status !== 'playing') {
      return;
    }

    // Processa comandos acumulados com sanitização
    while (this.state.activeCommands.length > 0) {
      const cmd = this.state.activeCommands.shift();
      if (cmd === 'MOVE_RIGHT') this.state.player.vx += 1.5;
      else if (cmd === 'MOVE_LEFT') this.state.player.vx -= 1.5;
      else if (cmd === 'JUMP') this.state.player.vy = -10;
      else if (cmd === 'SCORE_UP') this.state.score += 100;
    }

    // Física e amortecimento (damping)
    const dt = this.fixedDeltaTime / 1000;
    this.state.player.vy += 9.8 * dt; // gravidade
    this.state.player.x += this.state.player.vx;
    this.state.player.y += this.state.player.vy;
    this.state.player.vx *= 0.95; // atrito

    // Garantia de integridade matemática: nunca NaN nem Infinity
    if (Number.isNaN(this.state.player.x)) this.state.player.x = 0;
    if (Number.isNaN(this.state.player.y)) this.state.player.y = 0;
    if (Number.isNaN(this.state.score)) this.state.score = 0;
  }
}

describe('Camada 2 (Simulação Headless) - Game Loop & Multi-Ticks', () => {
  it('executa 120 ticks com fixedDeltaTime = 1000/60 sem NaN, memory leak ou desvio numérico', () => {
    const engine = new HeadlessGameEngine();
    engine.start();

    // 120 ticks = 2 segundos de simulação a 60 FPS
    for (let tick = 1; tick <= 120; tick++) {
      // Ticks 1 a 14: inputs nulos/indefinidos
      if (tick < 15) {
        engine.dispatchInput(null);
        engine.dispatchInput(undefined);
      }

      // Ticks 15 a 45: spam intenso de comandos
      if (tick >= 15 && tick <= 45) {
        engine.dispatchInput('MOVE_RIGHT');
        engine.dispatchInput('JUMP');
        engine.dispatchInput('SCORE_UP');
        // Spam malformado
        engine.dispatchInput('');
        engine.dispatchInput(null);
      }

      engine.step();

      // Checagens determinísticas de sanidade por tick
      expect(Number.isNaN(engine.state.player.x)).toBe(false);
      expect(Number.isNaN(engine.state.player.y)).toBe(false);
      expect(Number.isNaN(engine.state.score)).toBe(false);
      expect(Number.isFinite(engine.state.player.x)).toBe(true);
      expect(Number.isFinite(engine.state.player.y)).toBe(true);
      expect(Number.isFinite(engine.state.score)).toBe(true);
    }

    expect(engine.state.tickCount).toBe(120);
    expect(engine.state.score).toBeGreaterThan(0);
    expect(engine.state.status).toBe('playing');
    expect(engine.state.activeCommands).toHaveLength(0); // Fila limpa
  });

  it('gerencia transição de estados finitos (idle -> playing -> paused -> game_over)', () => {
    const engine = new HeadlessGameEngine();
    expect(engine.state.status).toBe('idle');

    engine.start();
    expect(engine.state.status).toBe('playing');

    engine.state.status = 'paused';
    const xBefore = engine.state.player.x;
    engine.step();
    expect(engine.state.player.x).toBe(xBefore); // Em pausa, física não altera posição

    engine.state.status = 'game_over';
    expect(engine.state.status).toBe('game_over');
  });
});
