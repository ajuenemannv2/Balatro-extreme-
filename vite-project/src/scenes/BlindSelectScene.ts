import Phaser from 'phaser';
import type { RunState } from '../types/Run.ts';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, FONT } from '../config.ts';
import { Button } from '../ui/Button.ts';
import { getChipTarget, getBlindName, getBlindDescription } from '../engine/BlindManager.ts';
import { startBlind, advanceToNextBlind, getRNG } from '../engine/RunManager.ts';
import { numStr } from '../utils/MathUtils.ts';
import { EventBus } from '../utils/EventBus.ts';

export class BlindSelectScene extends Phaser.Scene {
  private runState!: RunState;

  constructor() {
    super({ key: 'BlindSelectScene' });
  }

  init(data?: { runState?: RunState }): void {
    if (data?.runState) {
      this.runState = data.runState;
    }
  }

  create(): void {
    // If no runState from init data, try getting it from EventBus
    if (!this.runState) {
      EventBus.once<RunState>('run_state_ready', (rs) => {
        this.runState = rs;
        this._build();
      });
      return;
    }
    this._build();
  }

  private _build(): void {
    const rs = this.runState;
    this.cameras.main.setBackgroundColor(COLORS.bgHex);

    // Header
    const headerPanel = this.add.graphics();
    headerPanel.fillStyle(COLORS.panel, 0.8);
    headerPanel.fillRoundedRect(0, 0, GAME_WIDTH, 72, 0);

    this.add.text(GAME_WIDTH / 2, 36, `Ante ${rs.ante} / 8`, {
      fontFamily: FONT,
      fontSize: '24px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH - 30, 36, `$${rs.money}`, {
      fontFamily: FONT,
      fontSize: '28px',
      color: COLORS.goldHex,
    }).setOrigin(1, 0.5);

    this.add.text(30, 36, `Hands: ${rs.handsRemaining}  Discards: ${rs.discardsRemaining}`, {
      fontFamily: FONT,
      fontSize: '16px',
      color: '#aaaaaa',
    }).setOrigin(0, 0.5);

    // Blind cards
    const cardW = 310;
    const cardH = 340;
    const startX = GAME_WIDTH / 2 - cardW - 20;
    const cardY = 110;

    const blindNames = ['Small Blind', 'Big Blind', 'Boss Blind'];
    const chipTargets = [
      getChipTarget(rs.ante, 0),
      getChipTarget(rs.ante, 1),
      getChipTarget(rs.ante, 2),
    ];
    const moneyRewards = [3, 4, 5];

    for (let i = 0; i < 3; i++) {
      const x = startX + i * (cardW + 20);
      const isCurrent = i === rs.blindIndex;
      const isPast = i < rs.blindIndex;
      const isBoss = i === 2;

      // Panel
      const panel = this.add.graphics();
      const panelColorNum: number = isCurrent
        ? (COLORS.btnPurple as number)
        : isPast
          ? 0x222222
          : (COLORS.panelDark as number);
      panel.fillStyle(panelColorNum, 1);
      panel.fillRoundedRect(x, cardY, cardW, cardH, 10);

      // Border
      const borderColorNum: number = isCurrent
        ? (COLORS.gold as number)
        : isBoss
          ? 0xff4444
          : 0x444444;
      panel.lineStyle(2, borderColorNum, 0.9);
      panel.strokeRoundedRect(x, cardY, cardW, cardH, 10);

      const cx = x + cardW / 2;

      // Blind display name
      let displayName = blindNames[i];
      if (isBoss) {
        displayName = getBlindName(rs.ante, 2, rs.activeBlindId);
      }

      this.add.text(cx, cardY + 28, displayName, {
        fontFamily: FONT,
        fontSize: '20px',
        color: isBoss ? '#ff6666' : '#ffffff',
      }).setOrigin(0.5);

      // Chip icon
      const chipIcon = this.add.graphics();
      chipIcon.fillStyle(COLORS.chipBlue, 1);
      chipIcon.fillCircle(cx, cardY + 80, 28);
      chipIcon.lineStyle(2, 0x2266aa, 1);
      chipIcon.strokeCircle(cx, cardY + 80, 28);

      this.add.text(cx, cardY + 80, numStr(chipTargets[i]), {
        fontFamily: FONT,
        fontSize: '14px',
        color: '#ffffff',
      }).setOrigin(0.5);

      this.add.text(cx, cardY + 115, 'chips required', {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#aaaaaa',
      }).setOrigin(0.5);

      // Money reward
      this.add.text(cx, cardY + 145, `+$${moneyRewards[i]} reward`, {
        fontFamily: FONT,
        fontSize: '15px',
        color: COLORS.goldHex,
      }).setOrigin(0.5);

      // Boss description
      if (isBoss) {
        const desc = getBlindDescription(2, rs.activeBlindId);
        if (desc) {
          this.add.text(cx, cardY + 175, desc, {
            fontFamily: FONT,
            fontSize: '11px',
            color: '#ff8888',
            wordWrap: { width: cardW - 20 },
            align: 'center',
          }).setOrigin(0.5, 0);
        }
      }

      // Status area at bottom
      if (isPast) {
        this.add.text(cx, cardY + cardH - 40, '✓ Complete', {
          fontFamily: FONT,
          fontSize: '18px',
          color: '#44cc66',
        }).setOrigin(0.5);
      } else if (!isCurrent) {
        this.add.text(cx, cardY + cardH - 40, '[ Locked ]', {
          fontFamily: FONT,
          fontSize: '16px',
          color: '#666666',
        }).setOrigin(0.5);
      } else {
        // Play button
        new Button(this, cx, cardY + cardH - 55, 160, 44, 'Play!', () => {
          startBlind(rs);
          this.scene.start('GameScene', { runState: rs });
        }, { color: COLORS.green, fontSize: 18 });

        // Skip button (not available for boss blind)
        if (i < 2) {
          new Button(this, cx, cardY + cardH - 10, 120, 34, 'Skip →', () => {
            const rng = getRNG(rs);
            advanceToNextBlind(rs, rng);
            this.scene.restart({ runState: rs });
          }, { color: COLORS.panel, fontSize: 14 });
        }
      }
    }

    // Joker strip at bottom
    if (rs.jokers.length > 0) {
      const stripY = GAME_HEIGHT - 100;
      this.add.text(GAME_WIDTH / 2, stripY - 20, `Jokers (${rs.jokers.length}/${rs.maxJokerSlots})`, {
        fontFamily: FONT,
        fontSize: '14px',
        color: '#888888',
      }).setOrigin(0.5);

      rs.jokers.forEach((j, idx) => {
        const jx = GAME_WIDTH / 2 - ((rs.jokers.length - 1) * 42) + idx * 84;
        const bg = this.add.graphics();
        bg.fillStyle(COLORS.panelDark, 1);
        bg.fillRoundedRect(jx - 34, stripY - 14, 68, 80, 5);
        this.add.text(jx, stripY + 16, j.name, {
          fontFamily: FONT,
          fontSize: '9px',
          color: '#cccccc',
          wordWrap: { width: 64 },
          align: 'center',
        }).setOrigin(0.5);
      });
    }

    // Run info bar
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 18, `Seed: ${rs.seed}  |  Stake: ${rs.stakeLevel}`, {
      fontFamily: FONT,
      fontSize: '11px',
      color: '#444444',
    }).setOrigin(0.5);
  }
}
