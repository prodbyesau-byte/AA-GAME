import Phaser from 'phaser';
import { getGameplayTuning } from '../addons/testMode';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, GROUND_Y, SCENE_KEYS } from '../config/constants';
import { GAME_RULES } from '../data/gameRules';
import { prototypeJob } from '../data/jobs';
import { Player } from '../entities/Player';
import { WorkVan } from '../entities/WorkVan';
import { loadTiledJobLevel } from '../systems/TiledLevelLoader';
import { WindowManager } from '../systems/WindowManager';
import { JobHud } from '../ui/JobHud';
import type { JobResult, PrototypeJob, WindowData } from '../types/game';
import type { JobLevelConfig } from '../types/level';

type CleaningPhase = 'soap' | 'squeegee';
type LadderState = 'onVan' | 'carried' | 'placed';

export class JobScene extends Phaser.Scene {
  private player!: Player;
  private van!: WorkVan;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private leftKey!: Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;
  private upKey!: Phaser.Input.Keyboard.Key;
  private downKey!: Phaser.Input.Keyboard.Key;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private ladderKey!: Phaser.Input.Keyboard.Key;
  private job!: PrototypeJob;
  private level!: JobLevelConfig;
  private windows!: WindowManager;
  private hud!: JobHud;
  private prompt!: Phaser.GameObjects.Text;
  private ladderSprite!: Phaser.GameObjects.Image;
  private holdMeterBack!: Phaser.GameObjects.Rectangle;
  private holdMeterFill!: Phaser.GameObjects.Rectangle;
  private holdLabel!: Phaser.GameObjects.Text;
  private completedWindows = 0;
  private activeWindow?: WindowData;
  private cleaningWindow?: WindowData;
  private cleaningHoldMs = 0;
  private cleaningPhase: CleaningPhase = 'soap';
  private ladderState: LadderState = 'onVan';
  private playerOnLadder = false;
  private ladderX = 190;
  private mustReleaseInteract = false;
  private requiredPhaseHoldMs: number = GAME_RULES.cleaning.phaseHoldMs;

  constructor() {
    super(SCENE_KEYS.JOB);
  }

  create(): void {
    this.level = loadTiledJobLevel(this, 'andersen-auto-service-map', prototypeJob);
    this.job = { ...structuredClone(prototypeJob), windows: this.level.windows };
    this.requiredPhaseHoldMs = getGameplayTuning().cleanPhaseHoldMs;
    this.completedWindows = 0;

    this.drawLocation();
    this.van = new WorkVan(this, this.level.spawns.van.x, this.level.spawns.van.y);
    this.add
      .image(this.level.spawns.cleaningKit.x, this.level.spawns.cleaningKit.y, 'cleaning-kit')
      .setOrigin(0.5, 1)
      .setDepth(this.level.spawns.cleaningKit.y);
    this.addRonny();
    this.createLadder();
    this.drawSpeechBubble();

    this.windows = new WindowManager(this, this.job.windows);
    this.player = new Player(this, this.level.spawns.player.x, this.level.spawns.player.y, this.level.playerLane);
    this.physics.add.collider(this.player, this.van);
    this.hud = new JobHud(this, this.job);

    this.prompt = this.add
      .text(0, 0, 'E', {
        fontFamily: 'Arial',
        fontStyle: 'bold',
        fontSize: '17px',
        color: '#f7efe1',
        backgroundColor: '#d4362f',
        padding: { left: 14, right: 14, top: 8, bottom: 8 },
      })
      .setOrigin(0.5)
      .setDepth(900)
      .setVisible(false);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.leftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.rightKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.downKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.interactKey = this.input.keyboard!.addKey(GAME_RULES.input.interact);
    this.ladderKey = this.input.keyboard!.addKey(GAME_RULES.input.ladder);

    this.createHoldMeter();
  }

  update(_: number, delta: number): void {
    this.handleLadderInput();

    if (this.playerOnLadder) {
      this.updateLadderClimb(delta);
    } else {
      this.player.update({
        cursors: this.cursors,
        leftKey: this.leftKey,
        rightKey: this.rightKey,
        upKey: this.upKey,
        downKey: this.downKey,
      });
      this.enterLadderIfRequested();
      if (this.playerOnLadder) {
        this.updateLadderClimb(delta);
      }
    }

    this.updateLadderSprite();
    this.activeWindow = this.getNearestReachableDirtyWindow();
    this.windows.setFocusedWindow(this.activeWindow?.id);
    this.updateCleaningHold(delta);

    this.updateInteractionPrompt();
  }

  private addRonny(): void {
    const ronnyKey = this.textures.exists('ronny-boss') ? 'ronny-boss' : 'customer-mechanic';
    const ronny = this.add
      .image(this.level.spawns.ronny.x, this.level.spawns.ronny.y, ronnyKey)
      .setOrigin(0.5, 1)
      .setDepth(this.level.spawns.ronny.y);
    if (ronnyKey === 'ronny-boss') {
      ronny.setScale(0.056);
    }
  }

  private createLadder(): void {
    this.ladderSprite = this.add
      .image(this.level.ladder.roofSpawn.x, this.level.ladder.roofSpawn.y, 'work-ladder')
      .setOrigin(0.5, 1)
      .setScale(0.58)
      .setRotation(Math.PI / 2)
      .setDepth(45);
  }

  private handleLadderInput(): void {
    if (this.cleaningWindow || !Phaser.Input.Keyboard.JustDown(this.ladderKey)) {
      return;
    }

    if (this.ladderState === 'onVan' && this.isPlayerNearVanLadder()) {
      this.pickUpLadder();
      return;
    }

    if (this.ladderState === 'carried') {
      if (this.canPlaceLadder()) {
        this.placeLadder();
      }
      return;
    }

    if (this.ladderState === 'placed' && !this.playerOnLadder && this.isPlayerNearLadder()) {
      this.pickUpLadder();
    }
  }

  private pickUpLadder(): void {
    this.ladderState = 'carried';
    this.playerOnLadder = false;
    this.player.setCarryingLadder(true);
    this.updateLadderSprite();
  }

  private placeLadder(): void {
    this.ladderState = 'placed';
    this.player.setCarryingLadder(false);
    this.ladderX = this.getLadderPlacementX();
    this.player.setPosition(this.ladderX + GAME_RULES.ladder.playerOffsetX, this.level.ladder.climbBottomY);
    this.player.setDepth(Math.floor(this.player.y));
    this.updateLadderSprite();
  }

  private updateLadderSprite(): void {
    if (!this.ladderSprite) {
      return;
    }

    if (this.ladderState === 'onVan') {
      this.ladderSprite
        .setPosition(this.level.ladder.roofSpawn.x, this.level.ladder.roofSpawn.y)
        .setScale(0.58)
        .setRotation(Math.PI / 2)
        .setDepth(45)
        .setVisible(true);
      return;
    }

    if (this.ladderState === 'carried') {
      this.ladderSprite
        .setPosition(this.player.x + GAME_RULES.ladder.carryOffsetX, this.player.y + GAME_RULES.ladder.carryOffsetY)
        .setScale(GAME_RULES.ladder.carryScale)
        .setRotation(-0.34)
        .setDepth(Math.max(1, this.player.depth - 1))
        .setVisible(true);
      return;
    }

    this.ladderSprite
      .setPosition(this.ladderX + GAME_RULES.ladder.playerOffsetX, this.level.ladder.baseY)
      .setScale(GAME_RULES.ladder.placedScale)
      .setRotation(-0.14)
      .setDepth(260)
      .setVisible(true);
  }

  private updateLadderClimb(delta: number): void {
    if (this.cleaningWindow || this.ladderState !== 'placed') {
      this.player.setVelocity(0, 0);
      return;
    }

    const movingUp = this.upKey.isDown || this.cursors.up.isDown;
    const movingDown = this.downKey.isDown || this.cursors.down.isDown;
    const verticalDirection = movingUp === movingDown ? 0 : movingUp ? -1 : 1;
    const nextY = Phaser.Math.Clamp(
      this.player.y + verticalDirection * GAME_RULES.ladder.climbSpeed * (delta / 1000),
      this.level.ladder.climbTopY,
      this.level.ladder.climbBottomY,
    );

    this.player.setVelocity(0, 0);
    this.player.setPosition(this.ladderX + GAME_RULES.ladder.playerOffsetX, nextY);
    this.player.setFlipX(false);
    this.player.setDepth(310);

    this.player.beginLadderPose(verticalDirection !== 0);

    if (nextY >= this.level.ladder.climbBottomY - 1 && movingDown) {
      this.playerOnLadder = false;
      this.player.setPosition(this.ladderX + GAME_RULES.ladder.playerOffsetX, this.level.ladder.climbBottomY);
      this.player.endLadderPose();
    }
  }

  private enterLadderIfRequested(): void {
    const wantsToClimb = this.upKey.isDown || this.cursors.up.isDown;
    if (
      this.cleaningWindow ||
      this.playerOnLadder ||
      this.ladderState !== 'placed' ||
      !wantsToClimb ||
      !this.isPlayerNearLadder()
    ) {
      return;
    }

    this.playerOnLadder = true;
    this.player.setCarryingLadder(false);
    this.player.setPosition(this.ladderX + GAME_RULES.ladder.playerOffsetX, this.level.ladder.climbBottomY);
    this.player.setDepth(310);
  }

  private getNearestReachableDirtyWindow(): WindowData | undefined {
    return this.job.windows
      .filter((window) => !window.completed && this.canReachWindow(window))
      .sort((a, b) => {
        const aPhaseScore = a.phase === 'soaped' ? -1000 : 0;
        const bPhaseScore = b.phase === 'soaped' ? -1000 : 0;
        return Math.abs(a.x - this.player.x) + aPhaseScore - (Math.abs(b.x - this.player.x) + bPhaseScore);
      })[0];
  }

  private canReachWindow(window: WindowData): boolean {
    const isGroundWindow = window.y >= this.level.reach.groundReachY;
    const distanceFromPlayer = Math.abs(window.x - this.player.x);

    if (isGroundWindow) {
      return !this.playerOnLadder && distanceFromPlayer <= this.level.reach.groundCleanDistance;
    }

    return (
      this.ladderState === 'placed' &&
      this.playerOnLadder &&
      Math.abs(window.x - this.ladderX) <= this.level.ladder.cleanDistance &&
      this.player.y <= GAME_RULES.ladder.highWindowReachPlayerY
    );
  }

  private isPlayerNearVanLadder(): boolean {
    return this.isPlayerInsideZone(this.level.ladder.pickupZone);
  }

  private canPlaceLadder(): boolean {
    return this.isPlayerInsideZone(this.level.ladder.wallZone);
  }

  private isPlayerNearLadder(): boolean {
    return (
      Math.abs(this.player.x - (this.ladderX + GAME_RULES.ladder.playerOffsetX)) <= GAME_RULES.ladder.enterDistanceX &&
      this.player.y >= GAME_RULES.ladder.enterMinY
    );
  }

  private isPlayerInsideZone(zone: { x: number; y: number; width: number; height: number }): boolean {
    return (
      this.player.x >= zone.x &&
      this.player.x <= zone.x + zone.width &&
      this.player.y >= zone.y &&
      this.player.y <= zone.y + zone.height
    );
  }

  private getLadderPlacementX(): number {
    const nearestUpperWindow = this.job.windows
      .filter((window) => !window.completed && window.y < this.level.reach.groundReachY)
      .sort((a, b) => Math.abs(a.x - this.player.x) - Math.abs(b.x - this.player.x))[0];

    if (nearestUpperWindow && Math.abs(nearestUpperWindow.x - this.player.x) <= GAME_RULES.ladder.snapToUpperWindowDistance) {
      return nearestUpperWindow.x;
    }

    return Phaser.Math.Clamp(
      this.player.x,
      this.level.ladder.wallZone.x,
      this.level.ladder.wallZone.x + this.level.ladder.wallZone.width,
    );
  }

  private updateCleaningHold(_delta: number): void {
    if (!this.interactKey.isDown) {
      this.mustReleaseInteract = false;
      this.resetCleaningHold();
      return;
    }

    if (!this.activeWindow || this.mustReleaseInteract) {
      this.resetCleaningHold();
      return;
    }

    const currentPhase: CleaningPhase = this.activeWindow.phase === 'soaped' ? 'squeegee' : 'soap';

    if (this.cleaningWindow?.id !== this.activeWindow.id || this.cleaningPhase !== currentPhase) {
      this.cleaningWindow = this.activeWindow;
      this.cleaningPhase = currentPhase;
      this.cleaningHoldMs = currentPhase === 'soap'
        ? (this.activeWindow.soapProgressMs ?? 0)
        : (this.activeWindow.squeegeeProgressMs ?? 0);
      if (currentPhase === 'soap') {
        this.player.beginSoapingPose();
      } else {
        this.player.beginSqueegeePose();
      }
    }

    this.cleaningHoldMs = Math.min(this.requiredPhaseHoldMs, this.cleaningHoldMs + _delta);

    if (currentPhase === 'soap') {
      this.activeWindow.soapProgressMs = this.cleaningHoldMs;
      this.windows.setSoapProgress(this.activeWindow.id, this.cleaningHoldMs / this.requiredPhaseHoldMs);
    } else {
      this.activeWindow.squeegeeProgressMs = this.cleaningHoldMs;
      this.windows.setSqueegeeProgress(this.activeWindow.id, this.cleaningHoldMs / this.requiredPhaseHoldMs);
    }

    this.updateHoldMeter(this.activeWindow, currentPhase);

    if (this.cleaningHoldMs >= this.requiredPhaseHoldMs) {
      if (currentPhase === 'soap') {
        const windowId = this.activeWindow.id;
        this.windows.markSoaped(windowId);
        this.activeWindow.phase = 'soaped';
        this.activeWindow.soapProgressMs = this.requiredPhaseHoldMs;
        this.activeWindow.squeegeeProgressMs = 0;
        this.mustReleaseInteract = true;
        this.resetCleaningHold();
        this.showPhaseNotification('SÆBE PÅFØRT! BRUG SQUEEGEE NU');
      } else {
        const completedWindowId = this.activeWindow.id;
        this.activeWindow.squeegeeProgressMs = this.requiredPhaseHoldMs;
        this.cleaningWindow = undefined;
        this.cleaningHoldMs = 0;
        this.mustReleaseInteract = true;
        this.hideHoldMeter();
        this.handleWindowCleaned(completedWindowId);
      }
    }
  }

  private resetCleaningHold(): void {
    if (!this.cleaningWindow) {
      this.hideHoldMeter();
      return;
    }

    if (this.cleaningPhase === 'soap') {
      this.cleaningWindow.soapProgressMs = this.cleaningHoldMs;
    } else {
      this.cleaningWindow.squeegeeProgressMs = this.cleaningHoldMs;
    }

    this.cleaningWindow = undefined;
    this.cleaningHoldMs = 0;
    this.player.endCleaningPose();
    this.hideHoldMeter();
  }

  private showPhaseNotification(text: string): void {
    if (!this.activeWindow) return;
    const notification = this.add
      .text(this.activeWindow.x, this.activeWindow.y - this.activeWindow.height / 2 - 40, text, {
        fontFamily: 'Arial',
        fontStyle: 'bold',
        fontSize: '16px',
        color: '#f7efe1',
        backgroundColor: '#16476d',
        padding: { left: 14, right: 14, top: 6, bottom: 6 },
      })
      .setOrigin(0.5)
      .setDepth(999);

    this.tweens.add({
      targets: notification,
      y: notification.y - 20,
      alpha: 0,
      duration: 1400,
      onComplete: () => notification.destroy(),
    });
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
    if (this.cleaningWindow) {
      this.prompt.setVisible(false);
      return;
    }

    if (this.activeWindow) {
      const isSoaped = this.activeWindow.phase === 'soaped';
      const label = isSoaped ? 'HOLD E: BRUG SQUEEGEE' : 'HOLD E: SÆB IND';
      const bgColor = isSoaped ? '#16476d' : '#d4362f';

      this.prompt
        .setPosition(this.activeWindow.x, this.activeWindow.y - this.activeWindow.height / 2 - 28)
        .setText(label)
        .setStyle({ backgroundColor: bgColor })
        .setVisible(true);
      return;
    }

    const ladderPrompt = this.getLadderPrompt();
    if (!ladderPrompt) {
      this.prompt.setVisible(false);
      return;
    }

    this.prompt
      .setPosition(ladderPrompt.x, ladderPrompt.y)
      .setText(ladderPrompt.text)
      .setStyle({ backgroundColor: ladderPrompt.backgroundColor })
      .setVisible(true);
  }

  private getLadderPrompt(): { text: string; x: number; y: number; backgroundColor: string } | undefined {
    if (this.ladderState === 'onVan' && this.isPlayerNearVanLadder()) {
      return { text: 'TRYK F: TAG STIGEN', x: 230, y: GROUND_Y - 152, backgroundColor: '#16476d' };
    }

    if (this.ladderState === 'carried') {
      const canPlace = this.canPlaceLadder();
      return {
        text: canPlace ? 'TRYK F: SÆT STIGEN OP' : 'GÅ HEN TIL VÆGGEN',
        x: this.player.x,
        y: this.player.y - 178,
        backgroundColor: canPlace ? '#16476d' : '#4a535c',
      };
    }

    if (this.ladderState === 'placed' && this.playerOnLadder) {
      return { text: 'W/S: KRAVL PÅ STIGEN', x: this.ladderX + 38, y: this.player.y - 165, backgroundColor: '#16476d' };
    }

    if (this.ladderState === 'placed' && this.isPlayerNearLadder()) {
      return { text: 'W: KRAVL OP    F: TAG STIGEN', x: this.ladderX + 24, y: GROUND_Y - 160, backgroundColor: '#16476d' };
    }

    const nearestDirty = this.job.windows
      .filter((window) => !window.completed)
      .sort((a, b) => Math.abs(a.x - this.player.x) - Math.abs(b.x - this.player.x))[0];

    if (nearestDirty && nearestDirty.y < this.level.reach.groundReachY && Math.abs(nearestDirty.x - this.player.x) <= 95) {
      return { text: 'DU SKAL BRUGE STIGEN', x: nearestDirty.x, y: nearestDirty.y - nearestDirty.height / 2 - 28, backgroundColor: '#4a535c' };
    }

    return undefined;
  }

  private createHoldMeter(): void {
    this.holdMeterBack = this.add
      .rectangle(0, 0, 160, 14, 0x101923, 0.94)
      .setOrigin(0, 0.5)
      .setDepth(901)
      .setVisible(false);
    this.holdMeterFill = this.add
      .rectangle(0, 0, 0, 14, COLORS.companyRed, 1)
      .setOrigin(0, 0.5)
      .setDepth(902)
      .setVisible(false);
    this.holdLabel = this.add
      .text(0, 0, '', {
        fontFamily: 'Arial',
        fontStyle: 'bold',
        fontSize: '13px',
        color: '#f7efe1',
        stroke: '#17212f',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(903)
      .setVisible(false);
  }

  private updateHoldMeter(window: WindowData, phase: CleaningPhase): void {
    const meterWidth = 160;
    const x = window.x - meterWidth / 2;
    const y = window.y - window.height / 2 - 14;
    const progress = this.cleaningHoldMs / this.requiredPhaseHoldMs;
    const seconds = (this.cleaningHoldMs / 1000).toFixed(1);
    const requiredSeconds = (this.requiredPhaseHoldMs / 1000).toFixed(this.requiredPhaseHoldMs < 1000 ? 2 : 0);

    const fillColor = phase === 'soap' ? 0x48cae4 : 0x0077b6;
    const phaseName = phase === 'soap' ? 'SÆBER IND' : 'SQUEEGEE';

    this.holdMeterBack.setPosition(x, y).setSize(meterWidth, 14).setVisible(true);
    this.holdMeterFill
      .setPosition(x, y)
      .setSize(meterWidth * progress, 14)
      .setFillStyle(fillColor, 1)
      .setVisible(true);
    this.holdLabel
      .setPosition(window.x, y - 20)
      .setText(`${phaseName} ${Math.round(progress * 100)}% (${seconds}s / ${requiredSeconds}s)`)
      .setVisible(true);
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
      .text(964, 660, 'WASD / PILETASTER: BEVÆG DIG     F: STIGE     HOLD E: PUDS VINDUE', {
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
