import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config.ts';
import { BootScene } from './scenes/BootScene.ts';
import { MenuScene } from './scenes/MenuScene.ts';
import { RunSelectScene } from './scenes/RunSelectScene.ts';
import { BlindSelectScene } from './scenes/BlindSelectScene.ts';
import { GameScene } from './scenes/GameScene.ts';
import { ShopScene } from './scenes/ShopScene.ts';
import { GameOverScene } from './scenes/GameOverScene.ts';
import { WinScene } from './scenes/WinScene.ts';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1c1930',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
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
  ],
  render: {
    antialias: false,
    pixelArt: false,
  },
};

new Phaser.Game(config);
