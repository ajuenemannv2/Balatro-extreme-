import Phaser from 'phaser';
import { EventBus } from '../utils/EventBus.ts';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT, DEPTH } from '../config.ts';
import type { MiniGameId } from '../types/Joker.ts';

interface MiniGameInitData {
  gameId: MiniGameId;
  jokerId: string;
  jokerName: string;
  winDesc: string;
  loseDesc: string;
  slotCost?: number;
}

export class MiniGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MiniGameScene' });
  }

  init(data: MiniGameInitData): void {
    this._data = data;
  }

  private _data!: MiniGameInitData;

  create(): void {
    // Semi-transparent backdrop
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.78);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.setDepth(DEPTH.modal - 1);

    const { gameId, jokerName, winDesc, loseDesc } = this._data;

    switch (gameId) {
      case 'coin_flip':    this._buildCoinFlip(jokerName, winDesc, loseDesc); break;
      case 'shell_game':   this._buildShellGame(jokerName, winDesc, loseDesc); break;
      case 'higher_lower': this._buildHigherLower(jokerName, winDesc, loseDesc); break;
      case 'dice_roll':    this._buildDiceRoll(jokerName, winDesc, loseDesc); break;
      case 'wheel':        this._buildWheel(jokerName, winDesc, loseDesc); break;
      case 'slot_machine': this._buildSlotMachine(jokerName, this._data.slotCost ?? 1); break;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  private _panel(w: number, h: number): Phaser.GameObjects.Graphics {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const g = this.add.graphics();
    g.fillStyle(COLORS.panelDark, 1);
    g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 14);
    g.lineStyle(2, COLORS.gold, 0.9);
    g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 14);
    g.setDepth(DEPTH.modal);
    return g;
  }

  private _header(jokerName: string, subtitle: string): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    this.add.text(cx, cy - 170, jokerName, {
      fontFamily: FONT, fontSize: '20px', color: COLORS.goldHex,
    }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 1);
    this.add.text(cx, cy - 145, subtitle, {
      fontFamily: FONT, fontSize: '13px', color: '#aaaaaa',
    }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 1);
  }

  private _winLoseLabels(winDesc: string, loseDesc: string): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    this.add.text(cx - 120, cy + 155, `WIN: ${winDesc}`, {
      fontFamily: FONT, fontSize: '11px', color: '#44ff88',
    }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 1);
    this.add.text(cx + 120, cy + 155, `LOSE: ${loseDesc}`, {
      fontFamily: FONT, fontSize: '11px', color: '#ff6666',
    }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 1);
  }

  private _resolve(won: boolean, outcomeIndex?: number): void {
    const jokerId = this._data.jokerId;
    // Brief flash
    const flash = this.add.graphics();
    flash.fillStyle(won ? 0x44ff88 : 0xff4444, 0.3);
    flash.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    flash.setDepth(DEPTH.modal + 10);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        flash.destroy();
        EventBus.emit('mini_game_result', { jokerId, won, outcomeIndex });
        this.scene.stop();
      },
    });
  }

  // ─────────────────────────────────────────────────────────────
  // COIN FLIP
  // ─────────────────────────────────────────────────────────────
  private _buildCoinFlip(jokerName: string, winDesc: string, loseDesc: string): void {
    this._panel(420, 360);
    this._header(jokerName, 'HEADS OR TAILS?');
    this._winLoseLabels(winDesc, loseDesc);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Coin graphic
    const coin = this.add.graphics();
    const drawCoin = (side: 'heads' | 'tails') => {
      coin.clear();
      coin.fillStyle(COLORS.gold, 1);
      coin.fillCircle(cx, cy - 20, 52);
      coin.lineStyle(4, 0xc8860a, 1);
      coin.strokeCircle(cx, cy - 20, 52);
      coin.fillStyle(0xc8860a, 1);
      coin.fillCircle(cx, cy - 20, 42);
      coin.fillStyle(COLORS.gold, 1);
      // H or T symbol
      if (side === 'heads') {
        // Crown
        coin.fillTriangle(cx - 16, cy - 20, cx, cy - 42, cx + 16, cy - 20);
        coin.fillCircle(cx - 16, cy - 20, 7);
        coin.fillCircle(cx, cy - 44, 7);
        coin.fillCircle(cx + 16, cy - 20, 7);
      } else {
        // T letter
        coin.fillRect(cx - 22, cy - 40, 44, 10);
        coin.fillRect(cx - 8, cy - 30, 16, 34);
      }
    };
    drawCoin('heads');
    coin.setDepth(DEPTH.modal + 1);

    let chosen: 'heads' | 'tails' | null = null;
    let spinning = false;

    const makeBtn = (label: string, bx: number, side: 'heads' | 'tails') => {
      const bg = this.add.graphics().setDepth(DEPTH.modal + 2);
      const drawBg = (hover: boolean) => {
        bg.clear();
        bg.fillStyle(hover ? COLORS.btnHover : COLORS.btnPurple, 1);
        bg.fillRoundedRect(bx - 70, cy + 80, 140, 46, 8);
        bg.lineStyle(2, COLORS.gold, 0.6);
        bg.strokeRoundedRect(bx - 70, cy + 80, 140, 46, 8);
      };
      drawBg(false);
      const txt = this.add.text(bx, cy + 103, label, {
        fontFamily: FONT, fontSize: '16px', color: '#ffffff',
      }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 3);

      const zone = this.add.zone(bx, cy + 103, 140, 46)
        .setInteractive({ useHandCursor: true })
        .setDepth(DEPTH.modal + 4);

      zone.on('pointerover', () => { if (!spinning) drawBg(true); });
      zone.on('pointerout', () => drawBg(false));
      zone.on('pointerdown', () => {
        if (spinning) return;
        spinning = true;
        chosen = side;
        txt.destroy(); zone.destroy();

        // Spin animation: oscillate scaleX 0→1→0→1
        let flips = 0;
        const spinStep = () => {
          this.tweens.add({
            targets: coin,
            scaleX: 0,
            duration: 80,
            ease: 'Linear',
            onComplete: () => {
              flips++;
              const showSide = flips % 2 === 0 ? 'heads' : 'tails';
              drawCoin(showSide);
              this.tweens.add({
                targets: coin,
                scaleX: 1,
                duration: 80,
                ease: 'Linear',
                onComplete: () => {
                  if (flips < 8) spinStep();
                  else {
                    const result: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
                    drawCoin(result);
                    const won = result === chosen;
                    const resultTxt = this.add.text(cx, cy + 65, won ? '✓ ' + result.toUpperCase() : '✗ ' + result.toUpperCase(), {
                      fontFamily: FONT, fontSize: '22px',
                      color: won ? '#44ff88' : '#ff6666',
                    }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 5);
                    this.time.delayedCall(900, () => {
                      resultTxt.destroy();
                      this._resolve(won);
                    });
                  }
                },
              });
            },
          });
        };
        spinStep();
      });
    };

    makeBtn('HEADS', cx - 90, 'heads');
    makeBtn('TAILS', cx + 90, 'tails');
  }

  // ─────────────────────────────────────────────────────────────
  // SHELL GAME
  // ─────────────────────────────────────────────────────────────
  private _buildShellGame(jokerName: string, winDesc: string, loseDesc: string): void {
    this._panel(480, 380);
    this._header(jokerName, 'FIND THE BALL!');
    this._winLoseLabels(winDesc, loseDesc);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const shellXs = [cx - 130, cx, cx + 130];
    const shellY = cy;
    let ballShell = Math.floor(Math.random() * 3);
    let revealed = false;

    const shells: Phaser.GameObjects.Graphics[] = [];
    const lids: Phaser.GameObjects.Graphics[] = [];

    const drawShell = (g: Phaser.GameObjects.Graphics, sx: number, selected = false) => {
      g.clear();
      g.fillStyle(selected ? 0xd4a017 : 0xa0522d, 1);
      g.fillEllipse(sx, shellY, 82, 60);
      g.fillStyle(selected ? 0xffd700 : 0xcd7f32, 1);
      g.fillEllipse(sx, shellY - 18, 82, 38);
      g.lineStyle(2, 0x6b3a1f, 0.8);
      g.strokeEllipse(sx, shellY, 82, 60);
    };

    const ball = this.add.graphics().setDepth(DEPTH.modal + 3);
    const drawBall = (sx: number) => {
      ball.clear();
      ball.fillStyle(0xffffff, 1);
      ball.fillCircle(sx, shellY + 12, 12);
      ball.fillStyle(0xdddddd, 0.5);
      ball.fillCircle(sx - 3, shellY + 9, 5);
    };

    for (let i = 0; i < 3; i++) {
      const g = this.add.graphics().setDepth(DEPTH.modal + 2);
      drawShell(g, shellXs[i]);
      shells.push(g);
      const lid = this.add.graphics().setDepth(DEPTH.modal + 1);
      lid.setVisible(false);
      lids.push(lid);
    }

    drawBall(shellXs[ballShell]);
    ball.setVisible(false);

    const instructTxt = this.add.text(cx, cy + 100, 'Watch the ball...', {
      fontFamily: FONT, fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 5);

    // Reveal ball briefly, then shuffle
    this.time.delayedCall(400, () => {
      ball.setVisible(true);
      this.time.delayedCall(700, () => {
        ball.setVisible(false);
        instructTxt.setText('Shuffling...');

        let swaps = 0;
        const doSwap = () => {
          const i = Math.floor(Math.random() * 3);
          let j = (i + 1 + Math.floor(Math.random() * 2)) % 3;
          const speed = 220 - swaps * 8;
          const midX = (shellXs[i] + shellXs[j]) / 2;

          this.tweens.add({ targets: shells[i], x: midX, duration: speed / 2, ease: 'Quad.Out',
            onComplete: () => this.tweens.add({ targets: shells[i], x: shellXs[j], duration: speed / 2, ease: 'Quad.In' }) });
          this.tweens.add({ targets: shells[j], x: midX, duration: speed / 2, ease: 'Quad.Out',
            onComplete: () => this.tweens.add({ targets: shells[j], x: shellXs[i], duration: speed / 2, ease: 'Quad.In' }) });

          const tmpX = shellXs[i];
          shellXs[i] = shellXs[j];
          shellXs[j] = tmpX;
          if (ballShell === i) ballShell = j;
          else if (ballShell === j) ballShell = i;

          swaps++;
          if (swaps < 10) {
            this.time.delayedCall(speed * 1.3, doSwap);
          } else {
            instructTxt.setText('Pick a shell!');
            for (let k = 0; k < 3; k++) {
              const sx = shellXs[k];
              const zone = this.add.zone(sx, shellY, 90, 70)
                .setInteractive({ useHandCursor: true })
                .setDepth(DEPTH.modal + 4);
              zone.on('pointerover', () => { if (!revealed) drawShell(shells[k], sx, true); });
              zone.on('pointerout', () => { if (!revealed) drawShell(shells[k], sx, false); });
              zone.on('pointerdown', () => {
                if (revealed) return;
                revealed = true;
                const won = k === ballShell;
                drawBall(shellXs[ballShell]);
                ball.setVisible(true);
                instructTxt.setText(won ? '✓ Correct!' : '✗ Wrong shell!');
                instructTxt.setColor(won ? '#44ff88' : '#ff6666');
                this.time.delayedCall(1100, () => this._resolve(won));
              });
            }
          }
        };
        this.time.delayedCall(300, doSwap);
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // HIGHER / LOWER
  // ─────────────────────────────────────────────────────────────
  private _buildHigherLower(jokerName: string, winDesc: string, loseDesc: string): void {
    this._panel(440, 360);
    this._header(jokerName, 'HIGHER OR LOWER?');
    this._winLoseLabels(winDesc, loseDesc);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    const firstIdx = Math.floor(Math.random() * 13);
    const first = ranks[firstIdx];

    const card1 = this.add.graphics().setDepth(DEPTH.modal + 2);
    card1.fillStyle(0xf0e6d3, 1);
    card1.fillRoundedRect(cx - 110, cy - 65, 80, 108, 6);
    card1.lineStyle(2, 0x888888, 1);
    card1.strokeRoundedRect(cx - 110, cy - 65, 80, 108, 6);
    this.add.text(cx - 70, cy - 10, first, {
      fontFamily: FONT, fontSize: '28px', color: '#1a1a1a',
    }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 3);
    this.add.text(cx - 90, cy - 56, first, {
      fontFamily: FONT, fontSize: '13px', color: '#1a1a1a',
    }).setOrigin(0, 0).setDepth(DEPTH.modal + 3);

    // Hidden card 2
    const card2 = this.add.graphics().setDepth(DEPTH.modal + 2);
    card2.fillStyle(COLORS.cardBack, 1);
    card2.fillRoundedRect(cx + 30, cy - 65, 80, 108, 6);
    card2.lineStyle(2, 0x4a90d9, 1);
    card2.strokeRoundedRect(cx + 30, cy - 65, 80, 108, 6);
    this.add.text(cx + 70, cy - 10, '?', {
      fontFamily: FONT, fontSize: '32px', color: '#4a90d9',
    }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 3);

    let chosen: 'higher' | 'lower' | null = null;

    const makeBtn = (label: string, bx: number, dir: 'higher' | 'lower') => {
      const bg = this.add.graphics().setDepth(DEPTH.modal + 2);
      const col = dir === 'higher' ? 0x27ae60 : 0xe74c3c;
      const draw = (hover: boolean) => {
        bg.clear();
        bg.fillStyle(hover ? (dir === 'higher' ? 0x2ecc71 : 0xff6b6b) : col, 1);
        bg.fillRoundedRect(bx - 72, cy + 75, 144, 48, 8);
      };
      draw(false);
      this.add.text(bx, cy + 99, label, {
        fontFamily: FONT, fontSize: '16px', color: '#ffffff',
      }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 3);

      const zone = this.add.zone(bx, cy + 99, 144, 48)
        .setInteractive({ useHandCursor: true }).setDepth(DEPTH.modal + 4);
      zone.on('pointerover', () => { if (!chosen) draw(true); });
      zone.on('pointerout', () => draw(false));
      zone.on('pointerdown', () => {
        if (chosen) return;
        chosen = dir;
        const secondIdx = Math.floor(Math.random() * 13);
        const second = ranks[secondIdx];
        // Flip card 2
        card2.clear();
        card2.fillStyle(0xf0e6d3, 1);
        card2.fillRoundedRect(cx + 30, cy - 65, 80, 108, 6);
        card2.lineStyle(2, 0x888888, 1);
        card2.strokeRoundedRect(cx + 30, cy - 65, 80, 108, 6);
        this.add.text(cx + 70, cy - 10, second, {
          fontFamily: FONT, fontSize: '28px', color: '#1a1a1a',
        }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 5);

        let won: boolean;
        if (secondIdx === firstIdx) won = true; // tie = win
        else if (dir === 'higher') won = secondIdx > firstIdx;
        else won = secondIdx < firstIdx;

        const resultTxt = this.add.text(cx, cy + 55, won ? '✓ Correct!' : '✗ Wrong!', {
          fontFamily: FONT, fontSize: '20px', color: won ? '#44ff88' : '#ff6666',
        }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 5);
        this.time.delayedCall(1000, () => { resultTxt.destroy(); this._resolve(won); });
      });
    };

    makeBtn('▲ HIGHER', cx - 100, 'higher');
    makeBtn('▼ LOWER', cx + 100, 'lower');
  }

  // ─────────────────────────────────────────────────────────────
  // DICE ROLL
  // ─────────────────────────────────────────────────────────────
  private _buildDiceRoll(jokerName: string, winDesc: string, loseDesc: string): void {
    this._panel(420, 360);
    this._header(jokerName, 'ROLL HIGH TO WIN! (4, 5, or 6)');
    this._winLoseLabels(winDesc, loseDesc);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const die = this.add.graphics().setDepth(DEPTH.modal + 2);
    let currentFace = 1;
    let rolling = false;

    const drawDie = (face: number) => {
      die.clear();
      die.fillStyle(0xffffff, 1);
      die.fillRoundedRect(cx - 44, cy - 70, 88, 88, 12);
      die.lineStyle(3, 0x222222, 1);
      die.strokeRoundedRect(cx - 44, cy - 70, 88, 88, 12);
      die.fillStyle(0x222222, 1);
      const dot = (dx: number, dy: number) => die.fillCircle(cx + dx, cy - 26 + dy, 7);
      const layouts: Record<number, [number, number][]> = {
        1: [[0, 0]],
        2: [[-20, -20], [20, 20]],
        3: [[-20, -20], [0, 0], [20, 20]],
        4: [[-20, -20], [20, -20], [-20, 20], [20, 20]],
        5: [[-20, -20], [20, -20], [0, 0], [-20, 20], [20, 20]],
        6: [[-20, -22], [20, -22], [-20, 0], [20, 0], [-20, 22], [20, 22]],
      };
      for (const [dx, dy] of layouts[face]) dot(dx, dy);
    };

    drawDie(1);

    const rollBtn = this.add.graphics().setDepth(DEPTH.modal + 2);
    const drawBtn = (hover: boolean) => {
      rollBtn.clear();
      rollBtn.fillStyle(hover ? COLORS.btnHover : COLORS.btnPurple, 1);
      rollBtn.fillRoundedRect(cx - 72, cy + 55, 144, 50, 8);
    };
    drawBtn(false);
    const btnTxt = this.add.text(cx, cy + 80, 'ROLL', {
      fontFamily: FONT, fontSize: '20px', color: '#ffffff',
    }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 3);

    const zone = this.add.zone(cx, cy + 80, 144, 50)
      .setInteractive({ useHandCursor: true }).setDepth(DEPTH.modal + 4);
    zone.on('pointerover', () => { if (!rolling) drawBtn(true); });
    zone.on('pointerout', () => drawBtn(false));
    zone.on('pointerdown', () => {
      if (rolling) return;
      rolling = true;
      btnTxt.setText('...');
      drawBtn(false);

      let ticks = 0;
      const tick = () => {
        currentFace = (currentFace % 6) + 1;
        drawDie(currentFace);
        this.tweens.add({ targets: die, angle: die.angle + 15, duration: 60 });
        ticks++;
        if (ticks < 14) this.time.delayedCall(60 + ticks * 8, tick);
        else {
          const final = Math.floor(Math.random() * 6) + 1;
          currentFace = final;
          drawDie(final);
          this.tweens.add({ targets: die, angle: 0, duration: 200, ease: 'Quad.Out' });
          const won = final >= 4;
          const resultTxt = this.add.text(cx, cy + 40, `Rolled ${final}! ${won ? '✓ WIN' : '✗ LOSE'}`, {
            fontFamily: FONT, fontSize: '18px', color: won ? '#44ff88' : '#ff6666',
          }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 5);
          this.time.delayedCall(1000, () => { resultTxt.destroy(); this._resolve(won); });
        }
      };
      tick();
    });
  }

  // ─────────────────────────────────────────────────────────────
  // WHEEL OF FATE
  // ─────────────────────────────────────────────────────────────
  private _buildWheel(jokerName: string, winDesc: string, loseDesc: string): void {
    this._panel(460, 420);
    this._header(jokerName, 'SPIN THE WHEEL!');
    this._winLoseLabels(winDesc, loseDesc);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2 - 10;
    const R = 110;
    const segments = 8;
    const winSegments = new Set([0, 2, 4, 6]); // alternating win/lose

    const wheel = this.add.graphics().setDepth(DEPTH.modal + 2);
    let wheelAngle = 0;

    const drawWheel = (angle: number) => {
      wheel.clear();
      for (let i = 0; i < segments; i++) {
        const startA = angle + (i / segments) * Math.PI * 2 - Math.PI / 2;
        const endA = angle + ((i + 1) / segments) * Math.PI * 2 - Math.PI / 2;
        const isWin = winSegments.has(i);
        wheel.fillStyle(isWin ? 0x27ae60 : 0xe74c3c, 1);
        wheel.beginPath();
        wheel.moveTo(cx, cy - 20);
        wheel.arc(cx, cy - 20, R, startA, endA, false);
        wheel.closePath();
        wheel.fillPath();
        wheel.lineStyle(2, 0x000000, 0.5);
        wheel.strokePath();
      }
      // Center cap
      wheel.fillStyle(0x222222, 1);
      wheel.fillCircle(cx, cy - 20, 14);
      wheel.lineStyle(2, COLORS.gold, 1);
      wheel.strokeCircle(cx, cy - 20, 14);
    };

    drawWheel(0);

    // Pointer arrow
    const arrow = this.add.graphics().setDepth(DEPTH.modal + 3);
    arrow.fillStyle(COLORS.gold, 1);
    arrow.fillTriangle(cx - 12, cy - 20 - R - 6, cx + 12, cy - 20 - R - 6, cx, cy - 20 - R + 16);
    arrow.lineStyle(2, 0xc8860a, 1);
    arrow.strokeTriangle(cx - 12, cy - 20 - R - 6, cx + 12, cy - 20 - R - 6, cx, cy - 20 - R + 16);

    let spinning = false;

    // Add W/L text labels on wheel
    const labelContainer = this.add.container(0, 0).setDepth(DEPTH.modal + 4);
    for (let i = 0; i < segments; i++) {
      const midA = ((i + 0.5) / segments) * Math.PI * 2 - Math.PI / 2;
      const lx = cx + Math.cos(midA) * (R * 0.65);
      const ly = cy - 20 + Math.sin(midA) * (R * 0.65);
      const isWin = winSegments.has(i);
      const lbl = this.add.text(lx, ly, isWin ? 'WIN' : 'LOSE', {
        fontFamily: FONT, fontSize: '11px', color: '#ffffff',
      }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 4);
      labelContainer.add(lbl);
    }

    const spinBtn = this.add.graphics().setDepth(DEPTH.modal + 2);
    const drawBtn = (hover: boolean) => {
      spinBtn.clear();
      spinBtn.fillStyle(hover ? COLORS.btnHover : COLORS.btnPurple, 1);
      spinBtn.fillRoundedRect(cx - 70, cy + 115, 140, 48, 8);
    };
    drawBtn(false);
    this.add.text(cx, cy + 139, 'SPIN', {
      fontFamily: FONT, fontSize: '20px', color: '#ffffff',
    }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 3);

    const zone = this.add.zone(cx, cy + 139, 140, 48)
      .setInteractive({ useHandCursor: true }).setDepth(DEPTH.modal + 5);
    zone.on('pointerover', () => { if (!spinning) drawBtn(true); });
    zone.on('pointerout', () => drawBtn(false));
    zone.on('pointerdown', () => {
      if (spinning) return;
      spinning = true;
      drawBtn(false);

      const totalSpin = (4 + Math.random() * 6) * Math.PI * 2;
      const duration = 3000 + Math.random() * 1000;
      const startAngle = wheelAngle;
      const startTime = this.time.now;

      // Cubic ease-out spin
      const spinUpdate = () => {
        const elapsed = this.time.now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        wheelAngle = startAngle + totalSpin * eased;
        drawWheel(wheelAngle);
        labelContainer.setRotation(wheelAngle);
        labelContainer.setPosition(0, 0);
        if (t < 1) {
          this.time.delayedCall(16, spinUpdate);
        } else {
          // Determine result: which segment is at top (angle 0)?
          const normalised = ((wheelAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const segAngle = (Math.PI * 2) / segments;
          const topSeg = Math.floor(((normalised + segAngle / 2) % (Math.PI * 2)) / segAngle) % segments;
          const won = winSegments.has(topSeg);

          const resultTxt = this.add.text(cx, cy + 95, won ? '✓ WIN!' : '✗ LOSE!', {
            fontFamily: FONT, fontSize: '22px', color: won ? '#44ff88' : '#ff6666',
          }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 6);
          this.time.delayedCall(1200, () => { resultTxt.destroy(); this._resolve(won); });
        }
      };
      spinUpdate();
    });
  }

  // ─────────────────────────────────────────────────────────────
  // SLOT MACHINE
  // ─────────────────────────────────────────────────────────────
  private _buildSlotMachine(jokerName: string, slotCost: number): void {
    this._panel(560, 460);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Header
    this.add.text(cx, cy - 200, jokerName, {
      fontFamily: FONT, fontSize: '20px', color: '#ff44ff',
    }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 1);
    this.add.text(cx, cy - 174, `Costs $${slotCost} this pull`, {
      fontFamily: FONT, fontSize: '13px', color: '#aaaaaa',
    }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 1);

    // Outcome table (displayed as reward hints)
    const OUTCOMES: { label: string; color: string; weight: number }[] = [
      { label: '✕  Nothing',              color: '#888888', weight: 22 },
      { label: 'M  +500 Chips next hand', color: '#ff6666', weight: 20 },
      { label: '★  ×3 Score next hand',   color: '#ff3333', weight: 10 },
      { label: '$  +$8',             color: '#f5a623', weight: 15 },
      { label: 'T  Tarot Card',      color: '#cc88ff', weight: 10 },
      { label: 'P  Planet Card',     color: '#4488ff', weight: 8  },
      { label: '↑  Level Up Hand',   color: '#44ff88', weight: 7  },
      { label: '✦  Enhance Card',    color: '#66ccff', weight: 5  },
      { label: '7  JACKPOT: Joker!', color: '#ffaa00', weight: 3  },
    ];

    // Build weighted outcome picker
    const pick = (): number => {
      const total = OUTCOMES.reduce((s, o) => s + o.weight, 0);
      let r = Math.random() * total;
      for (let i = 0; i < OUTCOMES.length; i++) {
        r -= OUTCOMES[i].weight;
        if (r <= 0) return i;
      }
      return 0;
    };

    // Reel symbols (cycle list for animation)
    const REEL_SYMBOLS = ['✕', 'M', '★', '$', 'T', 'P', '↑', '✦', '7'];
    const REEL_COLORS  = ['#888888','#ff6666','#ff3333','#f5a623','#cc88ff','#4488ff','#44ff88','#66ccff','#ffaa00'];

    // Reel display: 3 reels, each showing 3 rows
    const reelW = 88;
    const reelH = 200;
    const reelGap = 14;
    const totalReelW = 3 * reelW + 2 * reelGap;
    const reelStartX = cx - totalReelW / 2;
    const reelY = cy - 100;

    const rowH = reelH / 3;

    // Draw reel backgrounds
    for (let r = 0; r < 3; r++) {
      const rx = reelStartX + r * (reelW + reelGap);
      const reelBg = this.add.graphics().setDepth(DEPTH.modal + 1);
      reelBg.fillStyle(0x111111, 1);
      reelBg.fillRoundedRect(rx, reelY, reelW, reelH, 6);
      reelBg.lineStyle(2, 0x444444, 1);
      reelBg.strokeRoundedRect(rx, reelY, reelW, reelH, 6);

      // Center row highlight
      reelBg.lineStyle(2, 0xff44ff, 0.6);
      reelBg.strokeRoundedRect(rx + 2, reelY + rowH + 2, reelW - 4, rowH - 4, 3);
    }

    // Reel text objects: each reel has 3 rows
    const reelTexts: Phaser.GameObjects.Text[][] = [];
    const reelIndices: number[][] = [];

    for (let r = 0; r < 3; r++) {
      const rx = reelStartX + r * (reelW + reelGap) + reelW / 2;
      const texts: Phaser.GameObjects.Text[] = [];
      const indices: number[] = [];
      for (let row = 0; row < 3; row++) {
        const symIdx = Math.floor(Math.random() * REEL_SYMBOLS.length);
        indices.push(symIdx);
        const t = this.add.text(rx, reelY + row * rowH + rowH / 2, REEL_SYMBOLS[symIdx], {
          fontFamily: FONT, fontSize: '32px', color: REEL_COLORS[symIdx],
        }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 2);
        texts.push(t);
      }
      reelTexts.push(texts);
      reelIndices.push(indices);
    }

    // Win/lose indicator line
    const indicator = this.add.graphics().setDepth(DEPTH.modal + 3);
    indicator.lineStyle(3, 0xff44ff, 0.4);
    indicator.lineBetween(reelStartX - 8, reelY + rowH + rowH / 2, reelStartX + totalReelW + 8, reelY + rowH + rowH / 2);

    // Pull button
    const pullBtn = this.add.graphics().setDepth(DEPTH.modal + 2);
    const drawPull = (hover: boolean) => {
      pullBtn.clear();
      pullBtn.fillStyle(hover ? 0xcc00cc : 0x880088, 1);
      pullBtn.fillRoundedRect(cx - 80, reelY + reelH + 20, 160, 52, 8);
      pullBtn.lineStyle(2, 0xff44ff, 0.8);
      pullBtn.strokeRoundedRect(cx - 80, reelY + reelH + 20, 160, 52, 8);
    };
    drawPull(false);
    const pullTxt = this.add.text(cx, reelY + reelH + 46, `PULL  ($${slotCost})`, {
      fontFamily: FONT, fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 3);

    let pulled = false;

    const pullZone = this.add.zone(cx, reelY + reelH + 46, 160, 52)
      .setInteractive({ useHandCursor: true }).setDepth(DEPTH.modal + 4);
    pullZone.on('pointerover', () => { if (!pulled) drawPull(true); });
    pullZone.on('pointerout', () => drawPull(false));
    pullZone.on('pointerdown', () => {
      if (pulled) return;
      pulled = true;
      drawPull(false);
      pullTxt.setText('Spinning...');
      pullZone.destroy();

      const outcome = pick();
      const finalSymIdx = outcome; // outcome maps 1:1 to symbol index for winning outcomes
      // For the center row of each reel, set final symbols:
      //   Reel center row (row 1) = outcome symbol for all 3 if win, mixed if lose
      const won = outcome > 0;

      // Reel 1 stops first, then reel 2, then reel 3
      const spinReel = (reelIdx: number, spinMs: number, delay: number, finalIdx: number) => {
        this.time.delayedCall(delay, () => {
          let ticks = 0;
          const totalTicks = Math.floor(spinMs / 60);
          const tickReel = () => {
            for (let row = 0; row < 3; row++) {
              reelIndices[reelIdx][row] = (reelIndices[reelIdx][row] + 1) % REEL_SYMBOLS.length;
              reelTexts[reelIdx][row].setText(REEL_SYMBOLS[reelIndices[reelIdx][row]]);
              reelTexts[reelIdx][row].setColor(REEL_COLORS[reelIndices[reelIdx][row]]);
            }
            ticks++;
            if (ticks < totalTicks) {
              this.time.delayedCall(60, tickReel);
            } else {
              // Land on final symbol in center row
              reelIndices[reelIdx][1] = finalIdx;
              reelTexts[reelIdx][1].setText(REEL_SYMBOLS[finalIdx]);
              reelTexts[reelIdx][1].setColor(REEL_COLORS[finalIdx]);

              // Brief flash on this reel's center cell
              this.tweens.add({
                targets: reelTexts[reelIdx][1],
                scaleX: 1.3, scaleY: 1.3,
                duration: 120,
                yoyo: true,
                ease: 'Quad.Out',
              });

              if (reelIdx === 2) {
                // All reels done — show result
                this.time.delayedCall(500, () => {
                  const outcomeData = OUTCOMES[outcome];
                  const resultColor = won ? outcomeData.color : '#888888';
                  const resultText = won ? `★  ${outcomeData.label}` : '✕  Nothing...';

                  const resultTxt = this.add.text(cx, reelY + reelH + 90, resultText, {
                    fontFamily: FONT, fontSize: '20px', color: resultColor,
                    stroke: '#000000', strokeThickness: 2,
                  }).setOrigin(0.5, 0.5).setDepth(DEPTH.modal + 5);

                  if (won) {
                    this.tweens.add({
                      targets: resultTxt,
                      scaleX: 1.15, scaleY: 1.15,
                      duration: 200, yoyo: true, repeat: 1,
                    });
                  }

                  this.time.delayedCall(1400, () => {
                    resultTxt.destroy();
                    this._resolve(won, outcome);
                  });
                });
              }
            }
          };
          tickReel();
        });
      };

      // For non-winning outcomes (0), show mismatched symbols
      const reelFinals = won
        ? [finalSymIdx, finalSymIdx, finalSymIdx]
        : [1, 3, 5]; // mismatched symbols for "nothing"

      spinReel(0, 900,    0,    reelFinals[0]);
      spinReel(1, 1200,   300,  reelFinals[1]);
      spinReel(2, 1500,   600,  reelFinals[2]);
    });
  }
}
