import Phaser from 'phaser';
import { COLORS } from '../config/constants';
import type { PrototypeJob } from '../types/game';

export class JobHud {
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly title: Phaser.GameObjects.Text;
  private readonly customer: Phaser.GameObjects.Text;
  private readonly progress: Phaser.GameObjects.Text;
  private readonly earnings: Phaser.GameObjects.Text;
  private readonly progressFill: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, job: PrototypeJob) {
    this.panel = scene.add.graphics().setScrollFactor(0).setDepth(100);
    this.panel.fillStyle(0x101923, 0.9);
    this.panel.fillRoundedRect(24, 22, 318, 176, 8);
    this.panel.fillStyle(0xffffff, 0.08);
    this.panel.fillRoundedRect(32, 30, 302, 70, 6);
    this.panel.fillStyle(COLORS.companyRed, 1);
    this.panel.fillRect(42, 43, 7, 39);
    this.panel.lineStyle(2, 0xf7efe1, 0.18);
    this.panel.strokeRoundedRect(24, 22, 318, 176, 8);

    this.title = scene.add
      .text(58, 42, 'ANDERS ANDERSEN', {
        fontFamily: 'Arial',
        fontStyle: 'bold',
        fontSize: '19px',
        color: '#f7efe1',
      })
      .setScrollFactor(0)
      .setDepth(101);

    this.customer = scene.add
      .text(58, 76, `Aktuelt job\n${job.customer}`, {
        fontFamily: 'Arial',
        fontSize: '17px',
        color: '#dbe8ef',
        lineSpacing: 7,
      })
      .setScrollFactor(0)
      .setDepth(101);

    scene.add
      .rectangle(48, 132, 250, 12, 0x263545, 1)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(101);
    this.progressFill = scene.add
      .rectangle(48, 132, 0, 12, COLORS.companyRed, 1)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(102);

    this.progress = scene.add
      .text(48, 154, '', {
        fontFamily: 'Arial',
        fontSize: '17px',
        color: '#f7efe1',
      })
      .setScrollFactor(0)
      .setDepth(101);

    this.earnings = scene.add
      .text(208, 154, '', {
        fontFamily: 'Arial',
        fontStyle: 'bold',
        fontSize: '17px',
        color: Phaser.Display.Color.IntegerToColor(COLORS.companyRed).rgba,
      })
      .setScrollFactor(0)
      .setDepth(101);

    this.render(0, job.windows.length, job.paymentDkk);
  }

  render(completedWindows: number, totalWindows: number, paymentDkk: number): void {
    this.progress.setText(`Vinduer: ${completedWindows} / ${totalWindows}`);
    this.earnings.setText(`Løn: ${paymentDkk} DKK`);
    this.progressFill.width = 250 * (completedWindows / totalWindows);
  }
}
