import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';
import { createPlaceholderTextures } from '../utils/textureFactory';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.PRELOAD);
  }

  preload(): void {
    const label = this.add.text(640, 360, 'Pakker grejet...', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#f7efe1',
    });
    label.setOrigin(0.5);

    this.load.image('player-sheet', '/assets/player-sprite.png');
    this.load.image('car-sheet', '/assets/car-sprite.png');
  }

  create(): void {
    createPlaceholderTextures(this);
    this.scene.start(SCENE_KEYS.MAIN_MENU);
  }
}
