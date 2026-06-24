import Phaser from 'phaser';
import type { RunState } from '../types/Run.ts';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, FONT } from '../config.ts';
import { Button } from '../ui/Button.ts';
import { getChipTarget, getBlindName, getBlindDescription } from '../engine/BlindManager.ts';
import { startBlind, advanceToNextBlind, getRNG } from '../engine/RunManager.ts';
import { numStr } from '../utils/MathUtils.ts';
import { EventBus } from '../utils/EventBus.ts';
import { AudioManager } from '../audio/AudioManager.ts';

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
    AudioManager.switchTrack('menu').catch(() => {});

    // ── Felt green table background ───────────────────────────────────────────
    const bgGfx = this.add.graphics();
    bgGfx.fillStyle(0x0d1a0d, 1);
    bgGfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Felt texture – large green band in the center
    bgGfx.fillStyle(0x1b4a1b, 1);
    bgGfx.fillRect(0, 78, GAME_WIDTH, GAME_HEIGHT - 78);

    // Subtle radial felt highlight
    for (let s = 5; s >= 1; s--) {
      bgGfx.fillStyle(0x226622, 0.07 * (6 - s));
      bgGfx.fillEllipse(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, GAME_WIDTH * 0.9 * (s / 5), GAME_HEIGHT * 0.8 * (s / 5));
    }

    // ── Header bar ────────────────────────────────────────────────────────────
    const headerGfx = this.add.graphics();
    headerGfx.fillStyle(0x0a0a18, 0.96);
    headerGfx.fillRect(0, 0, GAME_WIDTH, 78);
    headerGfx.lineStyle(2, 0x2a1a40, 1);
    headerGfx.lineBetween(0, 78, GAME_WIDTH, 78);
    headerGfx.setDepth(10);

    // Ante display
    this.add.text(GAME_WIDTH / 2, 39, `ANTE  ${rs.ante} / 8`, {
      fontFamily: FONT,
      fontSize: '22px',
      color: '#aaaacc',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(11);

    // Money (top-right)
    const moneyBg = this.add.graphics();
    moneyBg.fillStyle(0x1a1200, 0.85);
    moneyBg.fillRoundedRect(GAME_WIDTH - 130, 14, 118, 48, 8);
    moneyBg.lineStyle(1, COLORS.gold, 0.5);
    moneyBg.strokeRoundedRect(GAME_WIDTH - 130, 14, 118, 48, 8);
    moneyBg.setDepth(11);

    this.add.text(GAME_WIDTH - 72, 38, `$${rs.money}`, {
      fontFamily: FONT,
      fontSize: '26px',
      color: COLORS.goldHex,
    }).setOrigin(0.5).setDepth(12);

    // Hands / Discards (top-left)
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0a0a18, 0.6);
    statsBg.fillRoundedRect(14, 14, 220, 48, 8);
    statsBg.setDepth(11);

    this.add.text(24, 24, `Hands`, { fontFamily: FONT, fontSize: '11px', color: '#888888' }).setDepth(12);
    this.add.text(24, 38, String(rs.handsRemaining), { fontFamily: FONT, fontSize: '20px', color: '#ffffff' }).setDepth(12);
    this.add.text(100, 24, `Discards`, { fontFamily: FONT, fontSize: '11px', color: '#888888' }).setDepth(12);
    this.add.text(100, 38, String(rs.discardsRemaining), { fontFamily: FONT, fontSize: '20px', color: '#ff8844' }).setDepth(12);

    // ── Choose your blind label ────────────────────────────────────────────────
    this.add.text(GAME_WIDTH / 2, 96, 'CHOOSE YOUR BLIND', {
      fontFamily: FONT,
      fontSize: '16px',
      color: '#88aa88',
    }).setOrigin(0.5).setDepth(11);

    // ── Blind cards ───────────────────────────────────────────────────────────
    const cardW = 310;
    const cardH = 360;
    const startX = GAME_WIDTH / 2 - cardW - 22;
    const cardY = 116;

    const chipTargets = [
      getChipTarget(rs.ante, 0),
      getChipTarget(rs.ante, 1),
      getChipTarget(rs.ante, 2),
    ];
    const moneyRewards = [3, 4, 5];

    // Panel colors per blind type
    const panelFills   = [0x0d1a30, 0x180d30, 0x300d0d];
    const accentColors = [COLORS.chipBlue as number, COLORS.btnPurple as number, 0xcc2222];
    const chipColors   = [COLORS.chipBlue as number, 0x9b59b6, 0xff4444];
    const blindLabels  = ['Small Blind', 'Big Blind', 'Boss Blind'];

    for (let i = 0; i < 3; i++) {
      const x = startX + i * (cardW + 22);
      const isCurrent = i === rs.blindIndex;
      const isPast = i < rs.blindIndex;
      const isBoss = i === 2;

      const cx = x + cardW / 2;

      // ── Card background ──
      const cardGfx = this.add.graphics();
      cardGfx.setDepth(20);

      // Shadow
      cardGfx.fillStyle(0x000000, 0.4);
      cardGfx.fillRoundedRect(x + 4, cardY + 4, cardW, cardH, 12);

      // Main fill
      const fillColor = isPast ? 0x111111 : panelFills[i];
      const fillAlpha = isPast ? 0.6 : 0.9;
      cardGfx.fillStyle(fillColor, fillAlpha);
      cardGfx.fillRoundedRect(x, cardY, cardW, cardH, 12);

      // Border
      const borderColor = isCurrent ? accentColors[i] : (isPast ? 0x333333 : 0x2a2a44);
      const borderAlpha = isCurrent ? 1.0 : 0.6;
      const borderThick = isCurrent ? 3 : 1;
      cardGfx.lineStyle(borderThick, borderColor, borderAlpha);
      cardGfx.strokeRoundedRect(x, cardY, cardW, cardH, 12);

      // Animated glow border for current blind
      if (isCurrent) {
        const glowGfx = this.add.graphics();
        glowGfx.setDepth(19);
        glowGfx.lineStyle(12, accentColors[i], 0.18);
        glowGfx.strokeRoundedRect(x - 4, cardY - 4, cardW + 8, cardH + 8, 14);

        this.tweens.add({
          targets: glowGfx,
          alpha: 0.3,
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });
      }

      // Coloured top strip
      if (!isPast) {
        cardGfx.fillStyle(accentColors[i], 0.25);
        cardGfx.fillRoundedRect(x, cardY, cardW, 48, { tl: 12, tr: 12, bl: 0, br: 0 });
      }

      // ── Blind name ──
      let displayName = blindLabels[i];
      if (isBoss) displayName = getBlindName(rs.ante, 2, rs.activeBlindId);

      this.add.text(cx, cardY + 24, displayName, {
        fontFamily: FONT,
        fontSize: '20px',
        color: isPast ? '#555555' : (isBoss ? '#ff7777' : '#ffffff'),
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(21);

      if (isPast) {
        // Greyed-out complete badge
        const doneBadge = this.add.graphics();
        doneBadge.setDepth(21);
        doneBadge.fillStyle(0x224422, 0.8);
        doneBadge.fillRoundedRect(cx - 55, cardY + cardH / 2 - 22, 110, 44, 8);
        doneBadge.lineStyle(1, 0x44aa44, 0.6);
        doneBadge.strokeRoundedRect(cx - 55, cardY + cardH / 2 - 22, 110, 44, 8);

        this.add.text(cx, cardY + cardH / 2, '✓  Complete', {
          fontFamily: FONT,
          fontSize: '18px',
          color: '#44cc66',
        }).setOrigin(0.5).setDepth(22);
        continue;
      }

      // ── Chip icon ──
      const iconY = cardY + 110;
      const chipGfx = this.add.graphics();
      chipGfx.setDepth(21);
      // Outer ring
      chipGfx.lineStyle(4, chipColors[i], 0.5);
      chipGfx.strokeCircle(cx, iconY, 38);
      // Inner fill
      chipGfx.fillStyle(chipColors[i], 0.18);
      chipGfx.fillCircle(cx, iconY, 34);
      // Inner border
      chipGfx.lineStyle(2, chipColors[i], 0.8);
      chipGfx.strokeCircle(cx, iconY, 28);

      // Chip target number (big)
      this.add.text(cx, iconY, numStr(chipTargets[i]), {
        fontFamily: FONT,
        fontSize: isBoss ? '22px' : '26px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(22);

      this.add.text(cx, iconY + 46, 'CHIPS REQUIRED', {
        fontFamily: FONT,
        fontSize: '10px',
        color: '#778877',
      }).setOrigin(0.5).setDepth(22);

      // ── Money reward ──
      const rewardY = cardY + 175;
      const rewardGfx = this.add.graphics();
      rewardGfx.setDepth(21);
      rewardGfx.fillStyle(0x1a1400, 0.7);
      rewardGfx.fillRoundedRect(cx - 70, rewardY - 14, 140, 30, 6);
      rewardGfx.lineStyle(1, COLORS.gold, 0.4);
      rewardGfx.strokeRoundedRect(cx - 70, rewardY - 14, 140, 30, 6);

      this.add.text(cx, rewardY, `$  +${moneyRewards[i]}  reward`, {
        fontFamily: FONT,
        fontSize: '15px',
        color: COLORS.goldHex,
      }).setOrigin(0.5).setDepth(22);

      // ── Boss description ──
      if (isBoss) {
        const desc = getBlindDescription(2, rs.activeBlindId);
        if (desc) {
          this.add.text(cx, cardY + 215, desc, {
            fontFamily: FONT,
            fontSize: '13px',
            color: '#ffcccc',
            wordWrap: { width: cardW - 28 },
            align: 'center',
          }).setOrigin(0.5, 0).setDepth(22);
        }
      }

      // ── Locked label (future blinds after current) ──
      if (!isCurrent) {
        const lockBadge = this.add.graphics();
        lockBadge.setDepth(21);
        lockBadge.fillStyle(0x111111, 0.7);
        lockBadge.fillRoundedRect(cx - 50, cardY + cardH - 56, 100, 36, 8);

        this.add.text(cx, cardY + cardH - 38, '[ Locked ]', {
          fontFamily: FONT,
          fontSize: '15px',
          color: '#555555',
        }).setOrigin(0.5).setDepth(22);
        continue;
      }

      // ── Play button (current blind) ──
      const playBtn = new Button(
        this,
        cx,
        cardY + cardH - 52,
        180,
        48,
        '▶  Play!',
        () => {
          startBlind(rs);
          this.scene.start('GameScene', { runState: rs });
        },
        { color: COLORS.green, fontSize: 20 }
      );
      playBtn.setDepth(22);

      // Pulse the play button
      this.tweens.add({
        targets: playBtn,
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });

      // Skip button (not for boss)
      if (i < 2) {
        const skipBtn = new Button(
          this,
          cx,
          cardY + cardH - 4,
          130,
          32,
          'Skip →',
          () => {
            const rng = getRNG(rs);
            advanceToNextBlind(rs, rng);
            this.scene.restart({ runState: rs });
          },
          { color: 0x1a1a2a, fontSize: 13 }
        );
        skipBtn.setDepth(22);
      }
    }

    // ── Joker strip ───────────────────────────────────────────────────────────
    if (rs.jokers.length > 0) {
      const stripY = GAME_HEIGHT - 100;

      const stripBg = this.add.graphics();
      stripBg.setDepth(18);
      stripBg.fillStyle(0x0a0a14, 0.7);
      stripBg.fillRoundedRect(40, stripY - 36, GAME_WIDTH - 80, 88, 8);
      stripBg.lineStyle(1, 0x2a2a44, 0.6);
      stripBg.strokeRoundedRect(40, stripY - 36, GAME_WIDTH - 80, 88, 8);

      this.add.text(GAME_WIDTH / 2, stripY - 22, `Jokers  (${rs.jokers.length} / ${rs.maxJokerSlots})`, {
        fontFamily: FONT,
        fontSize: '13px',
        color: '#666688',
      }).setOrigin(0.5).setDepth(19);

      rs.jokers.forEach((j, idx) => {
        const jx = GAME_WIDTH / 2 - ((rs.jokers.length - 1) * 44) + idx * 88;
        const jCardGfx = this.add.graphics();
        jCardGfx.setDepth(19);
        jCardGfx.fillStyle(COLORS.panelDark, 1);
        jCardGfx.fillRoundedRect(jx - 36, stripY - 10, 72, 60, 6);
        jCardGfx.lineStyle(1, 0x4a3060, 0.7);
        jCardGfx.strokeRoundedRect(jx - 36, stripY - 10, 72, 60, 6);

        this.add.text(jx, stripY + 22, j.name, {
          fontFamily: FONT,
          fontSize: '11px',
          color: '#cccccc',
          wordWrap: { width: 68 },
          align: 'center',
        }).setOrigin(0.5).setDepth(20);
      });
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 10, `Seed: ${rs.seed}  |  Stake: ${rs.stakeLevel}`, {
      fontFamily: FONT,
      fontSize: '11px',
      color: '#333344',
    }).setOrigin(0.5).setDepth(11);
  }
}
