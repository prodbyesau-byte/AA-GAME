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

    this.load.image('player-sheet', '/assets/player-sprite-4k.png');
    this.load.image('car-sheet', '/assets/car-sprite-4k.png');
    this.load.image('ronny-sheet', '/assets/ronny-sprite-4k.png');
    this.load.image('job-scene-background', '/assets/job-scene-background-4k-v1.png');
    this.load.image('sky-background', '/assets/sky-background-4k-v1.png');
    this.load.image('building-facade', '/assets/building-facade-4k-v1.png');
    this.load.image('road-sidewalk-loop', '/assets/road-sidewalk-loop-4k-v1.png');
    this.load.tilemapTiledJSON('andersen-auto-service-map', '/assets/maps/andersen-auto-service.json');
  }

  create(): void {
    createPlaceholderTextures(this);
    this.scene.start(SCENE_KEYS.MAIN_MENU);
  }
}
