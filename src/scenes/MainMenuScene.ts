import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MAIN_MENU);
  }

  create(): void {
    this.drawBackdrop();

    this.add
      .text(112, 76, 'ANDERS ANDERSEN', {
        fontFamily: 'Arial',
        fontStyle: 'bold',
        fontSize: '62px',
        color: '#f7efe1',
        stroke: '#111826',
        strokeThickness: 8,
      })
      .setOrigin(0, 0);

    this.add
      .text(118, 150, 'VINDUESPUDSER', {
        fontFamily: 'Arial',
        fontStyle: 'bold',
        fontSize: '46px',
        color: '#d4362f',
        stroke: '#111826',
        strokeThickness: 7,
      })
      .setOrigin(0, 0);

    this.add.image(858, 586, 'anders-van').setOrigin(0.5, 1).setScale(1.08);
    this.add.image(704, 620, 'employee-portrait').setOrigin(0.5, 1).setScale(0.72);

    const startButton = this.add
      .text(122, 326, 'START JOB', {
        fontFamily: 'Arial',
        fontStyle: 'bold',
        fontSize: '28px',
        color: '#f7efe1',
        backgroundColor: '#d4362f',
        padding: { left: 34, right: 34, top: 17, bottom: 17 },
      })
      .setOrigin(0, 0)
      .setInteractive({ cursor: 'pointer' });

    startButton.on('pointerover', () => startButton.setStyle({ backgroundColor: '#f15a4f' }));
    startButton.on('pointerout', () => startButton.setStyle({ backgroundColor: '#d4362f' }));
    startButton.on('pointerdown', () => this.scene.start(SCENE_KEYS.JOB));

    this.add
      .text(124, 412, 'Et job-RPG på gadeplan\ni klassisk Flash-stil', {
        fontFamily: 'Arial',
        fontStyle: 'bold',
        fontSize: '22px',
        color: '#dbe8ef',
        lineSpacing: 8,
      })
      .setOrigin(0, 0);

    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start(SCENE_KEYS.JOB));
  }

  private drawBackdrop(): void {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x8fc6d9, 0xbadbe7, 0xd49f5e, 0x3b4b58, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    graphics.fillStyle(0x283746, 0.42);
    graphics.fillRect(0, 160, 180, 390);
    graphics.fillRect(1028, 108, 252, 442);
    graphics.fillStyle(0x394d5c, 0.36);
    graphics.fillRect(148, 214, 160, 336);
    graphics.fillRect(926, 196, 120, 354);

    graphics.fillStyle(0x4f352b, 1);
    graphics.fillRect(520, 206, 468, 344);
    graphics.fillStyle(0xc5945d, 1);
    graphics.fillRect(544, 230, 420, 320);
    graphics.fillStyle(0x263545, 1);
    graphics.fillRect(512, 182, 488, 58);
    graphics.fillStyle(0xd4362f, 1);
    graphics.fillRect(512, 232, 488, 12);

    for (let x = 584; x <= 872; x += 144) {
      graphics.fillStyle(0x182431, 1);
      graphics.fillRect(x, 284, 96, 86);
      graphics.fillStyle(0x8fd2ea, 0.9);
      graphics.fillRect(x + 8, 292, 80, 70);
      graphics.lineStyle(3, 0x182431, 0.62);
      graphics.lineBetween(x + 48, 292, x + 48, 362);
      graphics.lineBetween(x + 8, 327, x + 88, 327);
    }

    graphics.fillStyle(0x56616b, 1);
    graphics.fillRect(0, 550, GAME_WIDTH, 170);
    graphics.fillStyle(0x46505a, 1);
    graphics.fillRect(0, 636, GAME_WIDTH, 84);
    graphics.lineStyle(2, 0xa9b0b5, 0.22);
    for (let x = -20; x < GAME_WIDTH; x += 92) {
      graphics.lineBetween(x, 592, x + 56, 592);
      graphics.lineBetween(x + 18, 674, x + 74, 674);
    }
  }
}
