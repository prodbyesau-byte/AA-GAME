import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { JobCompleteScene } from '../scenes/JobCompleteScene';
import { JobScene } from '../scenes/JobScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { GAME_HEIGHT, GAME_WIDTH } from './constants';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#111826',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: false,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    JobScene,
    JobCompleteScene,
  ],
};
