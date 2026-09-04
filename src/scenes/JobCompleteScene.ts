import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';
import type { JobResult } from '../types/game';

export class JobCompleteScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.JOB_COMPLETE);
  }

  create(result: JobResult): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x162133);

    this.add
      .text(GAME_WIDTH / 2, 150, 'JOB FULDFØRT', {
        fontFamily: 'Arial',
        fontStyle: 'bold',
        fontSize: '58px',
        color: '#f7efe1',
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        272,
        `${result.customer}\n${result.completedWindows} vinduer pudset\nUdbetalt ${result.paymentDkk} DKK`,
        {
          fontFamily: 'Arial',
          fontSize: '30px',
          color: '#dbe8ef',
          align: 'center',
          lineSpacing: 12,
        },
      )
      .setOrigin(0.5);

    const replayButton = this.add
      .text(GAME_WIDTH / 2, 456, 'START NY TUR', {
        fontFamily: 'Arial',
        fontStyle: 'bold',
        fontSize: '26px',
        color: '#17212f',
        backgroundColor: '#f7efe1',
        padding: { left: 28, right: 28, top: 14, bottom: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' });

    replayButton.on('pointerover', () => replayButton.setStyle({ backgroundColor: '#ffffff' }));
    replayButton.on('pointerout', () => replayButton.setStyle({ backgroundColor: '#f7efe1' }));
    replayButton.on('pointerdown', () => this.scene.start(SCENE_KEYS.JOB));

    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start(SCENE_KEYS.JOB));
  }
}
