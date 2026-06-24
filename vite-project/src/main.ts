import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config.ts';

function generateAppIcon(): void {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d');
  if (!g) return;

  // Background — rounded square
  g.fillStyle = '#1c1930';
  g.beginPath();
  if (g.roundRect) { g.roundRect(0, 0, S, S, 80); } else { g.rect(0, 0, S, S); }
  g.fill();

  // Felt circle
  g.fillStyle = '#1a4a1a';
  g.globalAlpha = 0.45;
  g.beginPath();
  g.ellipse(S/2, S*0.58, 200, 150, 0, 0, Math.PI*2);
  g.fill();
  g.globalAlpha = 1;

  // Card shadow
  g.fillStyle = '#000';
  g.globalAlpha = 0.35;
  g.beginPath();
  if (g.roundRect) { g.roundRect(164, 88, 192, 256, 16); } else { g.rect(164, 88, 192, 256); }
  g.fill();
  g.globalAlpha = 1;

  // Card face gradient
  const grad = g.createLinearGradient(156, 80, 356, 340);
  grad.addColorStop(0, '#2a2060');
  grad.addColorStop(1, '#160e3a');
  g.fillStyle = grad;
  g.beginPath();
  if (g.roundRect) { g.roundRect(156, 80, 192, 256, 16); } else { g.rect(156, 80, 192, 256); }
  g.fill();

  // Gold card border
  g.strokeStyle = '#c8a020';
  g.lineWidth = 4;
  g.beginPath();
  if (g.roundRect) { g.roundRect(156, 80, 192, 256, 16); } else { g.rect(156, 80, 192, 256); }
  g.stroke();

  // Inner purple border
  g.strokeStyle = '#8060c0';
  g.lineWidth = 1.5;
  g.globalAlpha = 0.6;
  g.beginPath();
  if (g.roundRect) { g.roundRect(166, 90, 172, 236, 10); } else { g.rect(166, 90, 172, 236); }
  g.stroke();
  g.globalAlpha = 1;

  // Top-left rank + suit
  g.fillStyle = '#c8a020';
  g.font = 'bold 32px Georgia, serif';
  g.textAlign = 'left';
  g.textBaseline = 'top';
  g.fillText('J', 168, 90);
  g.fillStyle = '#cc2222';
  g.font = '22px serif';
  g.fillText('♥', 168, 122);

  // Center suit symbols
  g.fillStyle = '#cc2222';
  g.font = 'bold 72px serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('♥', S/2, 200);

  // "BX" label inside card
  g.fillStyle = '#c8a020';
  g.font = 'bold 52px Georgia, serif';
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.fillText('BX', S/2, 310);

  // Bottom-right rank (mirrored)
  g.save();
  g.translate(S/2 + 96, 326);
  g.rotate(Math.PI);
  g.fillStyle = '#c8a020';
  g.font = 'bold 32px Georgia, serif';
  g.textAlign = 'left';
  g.textBaseline = 'top';
  g.fillText('J', 0, 0);
  g.restore();

  // Bottom label
  g.fillStyle = '#c8a020';
  g.globalAlpha = 0.7;
  g.font = '600 22px Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.letterSpacing = '4px';
  g.fillText('EXTREME', S/2, 420);
  g.globalAlpha = 1;

  // Sparkle dots at corners
  const sparkleColor = ['#ffcc44','#ff4488','#44ccff','#88ff44'];
  [[180,104],[330,104],[180,328],[330,328]].forEach(([sx,sy],i) => {
    g.fillStyle = sparkleColor[i];
    g.beginPath();
    g.arc(sx, sy, 5, 0, Math.PI*2);
    g.fill();
  });

  const dataURL = c.toDataURL('image/png');

  // Set as apple-touch-icon (iOS "Add to Home Screen" reads this)
  let link = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'apple-touch-icon';
    document.head.appendChild(link);
  }
  link.href = dataURL;
  link.setAttribute('sizes', '512x512');
}

generateAppIcon();
import { BootScene } from './scenes/BootScene.ts';
import { MenuScene } from './scenes/MenuScene.ts';
import { RunSelectScene } from './scenes/RunSelectScene.ts';
import { BlindSelectScene } from './scenes/BlindSelectScene.ts';
import { GameScene } from './scenes/GameScene.ts';
import { ShopScene } from './scenes/ShopScene.ts';
import { GameOverScene } from './scenes/GameOverScene.ts';
import { WinScene } from './scenes/WinScene.ts';
import { MiniGameScene } from './scenes/MiniGameScene.ts';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1c1930',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: [
    BootScene,
    MenuScene,
    RunSelectScene,
    BlindSelectScene,
    GameScene,
    ShopScene,
    GameOverScene,
    WinScene,
    MiniGameScene,
  ],
  render: {
    antialias: false,
    pixelArt: false,
  },
};

new Phaser.Game(config);
