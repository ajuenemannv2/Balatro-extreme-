import Phaser from 'phaser';
import { FoilPipeline } from '../rendering/shaders/FoilPipeline.ts';
import { HoloPipeline } from '../rendering/shaders/HoloPipeline.ts';
import { PolychromePipeline } from '../rendering/shaders/PolychromePipeline.ts';
import { NegativePipeline } from '../rendering/shaders/NegativePipeline.ts';
import { EventBus } from '../utils/EventBus.ts';
import { loadRun } from '../engine/SaveSystem.ts';
import { createNewRun } from '../engine/RunManager.ts';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const renderer = this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    if (renderer.gl) {
      renderer.pipelines.addPostPipeline('FoilPipeline', FoilPipeline);
      renderer.pipelines.addPostPipeline('HoloPipeline', HoloPipeline);
      renderer.pipelines.addPostPipeline('PolychromePipeline', PolychromePipeline);
      renderer.pipelines.addPostPipeline('NegativePipeline', NegativePipeline);
    }

    this.add.text(640, 360, 'Loading...', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Listen for new_run event to create a fresh RunState
    EventBus.on<{ seed: string; stakeLevel: number; deckId: string }>('new_run', (data) => {
      const rs = createNewRun(data.seed, data.stakeLevel, data.deckId);
      EventBus.emit('run_state_ready', rs);
    });

    // Listen for load_saved_run
    EventBus.on('load_saved_run', () => {
      const rs = loadRun();
      if (rs) {
        EventBus.emit('run_state_ready', rs);
      }
    });

    this.time.delayedCall(500, () => {
      this.scene.start('MenuScene');
    });
  }
}
