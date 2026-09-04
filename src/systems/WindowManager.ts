import Phaser from 'phaser';
import { COLORS } from '../config/constants';
import type { WindowData } from '../types/game';

interface WindowView {
  frame: Phaser.GameObjects.Rectangle;
  glass: Phaser.GameObjects.Rectangle;
  shine: Phaser.GameObjects.Graphics;
  dirt: Phaser.GameObjects.GameObject[];
  glow: Phaser.GameObjects.Rectangle;
  mullions: Phaser.GameObjects.Graphics;
}

export class WindowManager {
  private readonly views = new Map<string, WindowView>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly windows: WindowData[],
  ) {
    this.createViews();
  }

  getNearestDirtyWindow(playerX: number): WindowData | undefined {
    const interactionDistance = 88;
    return this.windows
      .filter((window) => !window.completed)
      .map((window) => ({ window, distance: Math.abs(window.x - playerX) }))
      .filter((entry) => entry.distance <= interactionDistance)
      .sort((a, b) => a.distance - b.distance)[0]?.window;
  }

  setFocusedWindow(windowId?: string): void {
    for (const [id, view] of this.views.entries()) {
      const isFocused = id === windowId;
      view.glow.setVisible(isFocused);
      if (isFocused) {
        view.glow.setAlpha(0.18 + Math.sin(this.scene.time.now / 130) * 0.06);
      }
    }
  }

  markCompleted(windowId: string): void {
    const window = this.windows.find((candidate) => candidate.id === windowId);
    if (!window || window.completed) {
      return;
    }

    window.completed = true;
    const view = this.views.get(windowId);
    if (!view) {
      return;
    }

    view.glass.setFillStyle(0xa7def0, 1);
    view.frame.setStrokeStyle(4, 0xf7efe1, 0.72);
    view.glow.setVisible(false);
    view.dirt.forEach((piece) => piece.destroy());

    this.scene.tweens.add({
      targets: view.glass,
      alpha: 0.72,
      yoyo: true,
      duration: 180,
      repeat: 1,
    });

    for (let i = 0; i < 6; i += 1) {
      const sparkle = this.scene.add
        .image(
          window.x - window.width / 2 + Math.random() * window.width,
          window.y - window.height / 2 + Math.random() * window.height,
          'sparkle',
        )
        .setDepth(22)
        .setAlpha(0.95)
        .setScale(0.22 + Math.random() * 0.18);

      this.scene.tweens.add({
        targets: sparkle,
        alpha: 0,
        scale: sparkle.scale + 0.45,
        y: sparkle.y - 16,
        duration: 520,
        delay: i * 65,
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  private createViews(): void {
    for (const window of this.windows) {
      const glow = this.scene.add
        .rectangle(window.x, window.y, window.width + 34, window.height + 34, 0xf7efe1, 0.18)
        .setStrokeStyle(3, 0xf7efe1, 0.62)
        .setDepth(7)
        .setVisible(false);
      const frame = this.scene.add
        .rectangle(window.x, window.y, window.width + 18, window.height + 18, 0x182431)
        .setStrokeStyle(4, 0x3d4d5b, 0.9)
        .setDepth(8);
      const glass = this.scene.add
        .rectangle(window.x, window.y, window.width, window.height, COLORS.glass, 0.9)
        .setStrokeStyle(2, 0xf7efe1, 0.22)
        .setDepth(9);
      const mullions = this.scene.add.graphics().setDepth(10);
      mullions.lineStyle(4, 0x182431, 0.62);
      mullions.lineBetween(window.x, window.y - window.height / 2, window.x, window.y + window.height / 2);
      mullions.lineBetween(window.x - window.width / 2, window.y, window.x + window.width / 2, window.y);
      const shine = this.scene.add.graphics().setDepth(10);
      shine.lineStyle(3, 0xf7efe1, 0.28);
      shine.beginPath();
      shine.moveTo(window.x - window.width * 0.33, window.y - window.height * 0.34);
      shine.lineTo(window.x - window.width * 0.05, window.y - window.height * 0.48);
      shine.moveTo(window.x + window.width * 0.14, window.y - window.height * 0.35);
      shine.lineTo(window.x + window.width * 0.37, window.y - window.height * 0.45);
      shine.strokePath();

      const dirt = this.createDirt(window);
      this.views.set(window.id, { frame, glass, shine, dirt, glow, mullions });
    }
  }

  private createDirt(window: WindowData): Phaser.GameObjects.GameObject[] {
    const pieces: Phaser.GameObjects.GameObject[] = [];
    const left = window.x - window.width / 2;
    const top = window.y - window.height / 2;

    for (let i = 0; i < 10; i += 1) {
      const x = left + 14 + Math.random() * (window.width - 28);
      const y = top + 14 + Math.random() * (window.height - 28);
      const radius = 4 + Math.random() * 8;
      pieces.push(
        this.scene.add
          .circle(x, y, radius, COLORS.grime, 0.34 + Math.random() * 0.24)
          .setDepth(11),
      );
    }

    for (let i = 0; i < 5; i += 1) {
      const x = left + 12 + Math.random() * (window.width - 24);
      const y = top + 12 + Math.random() * (window.height - 24);
      const streak = this.scene.add.graphics().setDepth(11);
      streak.lineStyle(2, COLORS.grime, 0.36);
      streak.beginPath();
      streak.moveTo(x, y);
      streak.lineTo(x + 4 - Math.random() * 8, y + 20 + Math.random() * 26);
      streak.strokePath();
      pieces.push(streak);
    }

    return pieces;
  }
}
