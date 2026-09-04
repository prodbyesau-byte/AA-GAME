import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, GROUND_Y, SCENE_KEYS } from '../config/constants';
import { prototypeJob } from '../data/jobs';
import { Player } from '../entities/Player';
import { WorkVan } from '../entities/WorkVan';
import { WindowManager } from '../systems/WindowManager';
import { JobHud } from '../ui/JobHud';
import type { JobResult, PrototypeJob, WindowData } from '../types/game';

export class JobScene extends Phaser.Scene {
  private player!: Player;
  private van!: WorkVan;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private leftKey!: Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;
  private upKey!: Phaser.Input.Keyboard.Key;
  private downKey!: Phaser.Input.Keyboard.Key;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private job!: PrototypeJob;
  private windows!: WindowManager;
  private hud!: JobHud;
  private prompt!: Phaser.GameObjects.Text;
  private holdMeterBack!: Phaser.GameObjects.Rectangle;
  private holdMeterFill!: Phaser.GameObjects.Rectangle;
  private holdLabel!: Phaser.GameObjects.Text;
  private completedWindows = 0;
  private activeWindow?: WindowData;
  private cleaningWindow?: WindowData;
  private cleaningHoldMs = 0;
  private cleaningStartedAtMs = 0;
  private mustReleaseInteract = false;
  private readonly requiredCleaningHoldMs = 4800;

  constructor() {
    super(SCENE_KEYS.JOB);
  }

  create(): void {
    this.job = structuredClone(prototypeJob);
    this.completedWindows = 0;

    this.drawLocation();
    this.van = new WorkVan(this, 190, GROUND_Y + 28);
    this.add.image(340, GROUND_Y + 44, 'cleaning-kit').setOrigin(0.5, 1).setDepth(GROUND_Y + 44);
    this.add.image(1034, GROUND_Y + 38, 'customer-mechanic').setOrigin(0.5, 1).setDepth(GROUND_Y + 38);
    this.drawSpeechBubble();

    this.windows = new WindowManager(this, this.job.windows);
    this.player = new Player(this, 410, GROUND_Y + 34);
    this.physics.add.collider(this.player, this.van);
    this.hud = new JobHud(this, this.job);

    this.prompt = this.add
      .text(0, 0, 'E', {
        fontFamily: 'Arial',
        fontStyle: 'bold',
        fontSize: '18px',
        color: '#f7efe1',
        backgroundColor: '#d4362f',
        padding: { left: 12, right: 12, top: 7, bottom: 7 },
      })
      .setOrigin(0.5)
      .setDepth(900)
      .setVisible(false);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.leftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.rightKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.downKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.createHoldMeter();
  }

  update(_: number, delta: number): void {
    this.activeWindow = this.windows.getNearestDirtyWindow(this.player.x);
    this.windows.setFocusedWindow(this.activeWindow?.id);
    this.updateCleaningHold(delta);

    this.player.update({
      cursors: this.cursors,
      leftKey: this.leftKey,
      rightKey: this.rightKey,
      upKey: this.upKey,
      downKey: this.downKey,
    });

    this.updateInteractionPrompt();
  }

  private updateCleaningHold(delta: number): void {
    if (!this.interactKey.isDown) {
      this.mustReleaseInteract = false;
      this.resetCleaningHold();
      return;
    }

    if (!this.activeWindow || this.mustReleaseInteract) {
      this.resetCleaningHold();
      return;
    }

    if (this.cleaningWindow?.id !== this.activeWindow.id) {
      this.cleaningWindow = this.activeWindow;
      this.cleaningHoldMs = 0;
      this.cleaningStartedAtMs = performance.now();
      this.player.beginCleaningPose();
    }

    this.cleaningHoldMs = Math.min(this.requiredCleaningHoldMs, performance.now() - this.cleaningStartedAtMs);
    this.updateHoldMeter(this.activeWindow);

    if (this.cleaningHoldMs >= this.requiredCleaningHoldMs) {
      const completedWindowId = this.activeWindow.id;
      this.cleaningWindow = undefined;
      this.cleaningHoldMs = 0;
      this.cleaningStartedAtMs = 0;
      this.mustReleaseInteract = true;
      this.hideHoldMeter();
      this.handleWindowCleaned(completedWindowId);
    }
  }

  private resetCleaningHold(): void {
    if (!this.cleaningWindow) {
      this.hideHoldMeter();
      return;
    }

    this.cleaningWindow = undefined;
    this.cleaningHoldMs = 0;
    this.cleaningStartedAtMs = 0;
    this.player.endCleaningPose();
    this.hideHoldMeter();
  }

  private handleWindowCleaned(windowId: string): void {
    this.windows.markCompleted(windowId);
    this.completedWindows += 1;
    this.player.endCleaningPose();
    this.hud.render(this.completedWindows, this.job.windows.length, this.job.paymentDkk);

    if (this.completedWindows >= this.job.windows.length) {
      this.showJobComplete();
    }
  }

  private updateInteractionPrompt(): void {
    if (!this.activeWindow || this.cleaningWindow) {
      this.prompt.setVisible(false);
      return;
    }

    this.prompt
      .setPosition(this.activeWindow.x, this.activeWindow.y - this.activeWindow.height / 2 - 28)
      .setText('HOLD E NEDE')
      .setVisible(true);
  }

  private createHoldMeter(): void {
    this.holdMeterBack = this.add
      .rectangle(0, 0, 118, 12, 0x101923, 0.94)
      .setOrigin(0, 0.5)
      .setDepth(901)
      .setVisible(false);
    this.holdMeterFill = this.add
      .rectangle(0, 0, 0, 12, COLORS.companyRed, 1)
      .setOrigin(0, 0.5)
      .setDepth(902)
      .setVisible(false);
    this.holdLabel = this.add
      .text(0, 0, 'RENSER', {
        fontFamily: 'Arial',
        fontStyle: 'bold',
        fontSize: '14px',
        color: '#f7efe1',
        stroke: '#17212f',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(903)
      .setVisible(false);
  }

  private updateHoldMeter(window: WindowData): void {
    const x = window.x - 59;
    const y = window.y - window.height / 2 - 12;
    const progress = this.cleaningHoldMs / this.requiredCleaningHoldMs;

    this.holdMeterBack.setPosition(x, y).setVisible(true);
    this.holdMeterFill.setPosition(x, y).setSize(118 * progress, 12).setVisible(true);
    this.holdLabel.setPosition(window.x, y - 19).setText(`RENSER ${Math.round(progress * 100)}%`).setVisible(true);
  }

  private hideHoldMeter(): void {
    this.holdMeterBack?.setVisible(false);
    this.holdMeterFill?.setVisible(false);
    this.holdLabel?.setVisible(false);
  }

  private showJobComplete(): void {
    const banner = this.add
      .text(GAME_WIDTH / 2, 210, 'JOB FULDFØRT', {
        fontFamily: 'Arial',
        fontStyle: 'bold',
        fontSize: '54px',
        color: '#f7efe1',
        stroke: '#17212f',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(150);

    this.tweens.add({
      targets: banner,
      y: 190,
      duration: 600,
      ease: 'Back.Out',
    });

    this.time.delayedCall(1200, () => {
      const result: JobResult = {
        customer: this.job.customer,
        paymentDkk: this.job.paymentDkk,
        completedWindows: this.completedWindows,
      };
      this.scene.start(SCENE_KEYS.JOB_COMPLETE, result);
    });
  }

  private drawLocation(): void {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x8fc6d9, 0xb8d8e4, 0xd8b36e, 0x788b98, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    graphics.fillStyle(0x334756, 0.38);
    graphics.fillRect(0, 118, 220, 360);
    graphics.fillRect(1050, 92, 230, 390);
    graphics.fillStyle(0x425565, 0.32);
    graphics.fillRect(92, 178, 140, 300);
    graphics.fillRect(975, 162, 128, 318);

    graphics.fillStyle(0x57636d, 1);
    graphics.fillRect(0, 552, GAME_WIDTH, 168);
    graphics.fillStyle(0x6f7881, 1);
    graphics.fillRect(0, 552, GAME_WIDTH, 34);
    graphics.fillStyle(0x4a535c, 1);
    graphics.fillRect(0, 640, GAME_WIDTH, 80);
    graphics.lineStyle(2, 0x9da6ac, 0.28);
    for (let x = -30; x < GAME_WIDTH; x += 86) {
      graphics.lineBetween(x, 593, x + 54, 593);
      graphics.lineBetween(x + 20, 672, x + 74, 672);
    }

    graphics.fillStyle(0x2b3540, 0.35);
    graphics.fillEllipse(704, 615, 642, 42);

    graphics.fillStyle(0x4f352b, 1);
    graphics.fillRect(338, 154, 660, 402);
    graphics.fillStyle(0xc5945d, 1);
    graphics.fillRect(362, 174, 612, 382);
    graphics.fillStyle(0xe0b174, 1);
    for (let y = 194; y < 548; y += 52) {
      graphics.fillRect(362, y, 612, 4);
    }
    for (let x = 390; x < 960; x += 96) {
      graphics.fillRect(x, 174, 4, 382);
    }

    graphics.fillStyle(0x263545, 1);
    graphics.fillRect(330, 128, 680, 48);
    graphics.fillStyle(0xd4362f, 1);
    graphics.fillRect(330, 168, 680, 10);
    graphics.lineStyle(2, 0xf7efe1, 0.18);
    graphics.strokeRect(330, 128, 680, 50);

    this.add
      .text(670, 153, 'ANDERSEN AUTO SERVICE', {
        fontFamily: 'Arial',
        fontStyle: 'bold',
        fontSize: '31px',
        color: '#f7efe1',
      })
      .setOrigin(0.5)
      .setDepth(12);

    graphics.fillStyle(0xb84934, 1);
    graphics.fillRect(402, 456, 118, 100);
    graphics.fillStyle(0x263545, 1);
    graphics.fillRect(420, 474, 82, 82);
    graphics.fillStyle(0x98d5e9, 0.78);
    graphics.fillRect(430, 484, 62, 62);
    graphics.fillStyle(0xf7efe1, 1);
    graphics.fillCircle(493, 518, 7);

    graphics.fillStyle(0x8b2d2d, 1);
    graphics.fillRoundedRect(568, 487, 174, 68, 6);
    graphics.fillStyle(0xf5f0e8, 1);
    graphics.fillRect(582, 501, 146, 9);
    graphics.fillRect(582, 521, 116, 9);

    graphics.fillStyle(0x253545, 1);
    graphics.fillRect(804, 484, 104, 72);
    graphics.fillStyle(0x5d6871, 1);
    graphics.fillRect(814, 494, 84, 52);
    graphics.fillStyle(0xe0d05f, 1);
    graphics.fillCircle(866, 520, 14);

    this.add
      .text(1000, 660, 'WASD / PILETASTER: BEVÆG DIG     HOLD E NEDE: PUDS VINDUE', {
        fontFamily: 'Arial',
        fontStyle: 'bold',
        fontSize: '16px',
        color: '#f7efe1',
        backgroundColor: 'rgba(18, 26, 36, 0.76)',
        padding: { left: 18, right: 18, top: 10, bottom: 10 },
      })
      .setOrigin(0.5)
      .setDepth(100);
  }

  private drawSpeechBubble(): void {
    const bubble = this.add.graphics().setDepth(98);
    bubble.fillStyle(0xf7efe1, 0.94);
    bubble.fillRoundedRect(914, 430, 210, 76, 8);
    bubble.fillTriangle(1006, 506, 1032, 506, 1018, 530);
    bubble.lineStyle(2, 0x17212f, 0.2);
    bubble.strokeRoundedRect(914, 430, 210, 76, 8);

    this.add
      .text(934, 448, 'Seks facadevinduer.\nFå dem til at skinne.', {
        fontFamily: 'Arial',
        fontStyle: 'bold',
        fontSize: '18px',
        color: '#17212f',
        lineSpacing: 5,
      })
      .setDepth(99);
  }
}
