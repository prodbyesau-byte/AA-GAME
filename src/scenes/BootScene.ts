import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BOOT);
  }

  create(): void {
    this.registry.set('prototypeSystems', {
      jobs: true,
      vanInteraction: true,
      equipmentHooks: true,
      playerProgressionHooks: true,
    });

    this.scene.start(SCENE_KEYS.PRELOAD);
  }
}
