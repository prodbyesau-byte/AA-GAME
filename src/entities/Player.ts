import Phaser from 'phaser';
import { GAME_RULES } from '../data/gameRules';
import { StateMachine } from '../systems/StateMachine';
import type { PlayerLaneConfig } from '../types/level';

interface PlayerControls {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  leftKey: Phaser.Input.Keyboard.Key;
  rightKey: Phaser.Input.Keyboard.Key;
  upKey: Phaser.Input.Keyboard.Key;
  downKey: Phaser.Input.Keyboard.Key;
}

type PlayerState = 'idle' | 'walking' | 'soaping' | 'squeegee' | 'ladder-idle' | 'ladder-climbing';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly speed = GAME_RULES.player.normalSpeed;
  private readonly laneSpeed = GAME_RULES.player.laneSpeed;
  private readonly laneTop: number;
  private readonly laneBottom: number;
  private readonly stateMachine: StateMachine<PlayerState>;
  private movementLocked = false;
  private speedMultiplier = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, lane: PlayerLaneConfig = { top: 558, bottom: 670 }) {
    super(scene, x, y, 'employee-idle-0');
    this.laneTop = lane.top;
    this.laneBottom = lane.bottom;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.configureSpriteScale();
    this.setDepth(30);
    this.setCollideWorldBounds(true);
    this.configureBody();
    this.createAnimations(scene);
    this.stateMachine = new StateMachine<PlayerState>('idle', {
      idle: { enter: () => this.play('employee-idle', true) },
      walking: { enter: () => this.play('employee-walk', true) },
      soaping: { enter: () => this.play('employee-soaping', true) },
      squeegee: { enter: () => this.play('employee-squeegee', true) },
      'ladder-idle': { enter: () => this.play('employee-idle', true) },
      'ladder-climbing': { enter: () => this.play('employee-walk', true) },
    });
  }

  update(controls: PlayerControls): void {
    if (this.movementLocked) {
      this.setVelocity(0, 0);
      return;
    }

    const movingLeft = controls.leftKey.isDown || controls.cursors.left.isDown;
    const movingRight = controls.rightKey.isDown || controls.cursors.right.isDown;
    const movingUp = controls.upKey.isDown || controls.cursors.up.isDown;
    const movingDown = controls.downKey.isDown || controls.cursors.down.isDown;
    const currentSpeed = this.speed * this.speedMultiplier;
    const currentLaneSpeed = this.laneSpeed * this.speedMultiplier;
    const horizontalVelocity = movingLeft === movingRight ? 0 : movingLeft ? -currentSpeed : currentSpeed;
    const verticalVelocity = movingUp === movingDown ? 0 : movingUp ? -currentLaneSpeed : currentLaneSpeed;

    this.setVelocity(horizontalVelocity, verticalVelocity);
    this.y = Phaser.Math.Clamp(this.y, this.laneTop, this.laneBottom);

    if (horizontalVelocity === 0 && verticalVelocity === 0) {
      this.stateMachine.setState('idle');
      return;
    }

    if (horizontalVelocity !== 0) {
      this.setFlipX(horizontalVelocity < 0);
    }
    this.stateMachine.setState('walking');
    this.setDepth(Math.floor(this.y));
  }

  beginCleaningPose(): void {
    this.beginSoapingPose();
  }

  setCarryingLadder(isCarrying: boolean): void {
    this.speedMultiplier = isCarrying ? GAME_RULES.player.carryingLadderSpeedMultiplier : 1;
  }

  beginSoapingPose(): void {
    this.movementLocked = true;
    this.setVelocity(0, 0);
    this.setFlipX(false);
    this.setDepth(300);
    this.stateMachine.setState('soaping');
  }

  beginSqueegeePose(): void {
    this.movementLocked = true;
    this.setVelocity(0, 0);
    this.setFlipX(false);
    this.setDepth(300);
    this.stateMachine.setState('squeegee');
  }

  beginLadderPose(isMoving: boolean): void {
    this.setVelocity(0, 0);
    this.setFlipX(false);
    this.stateMachine.setState(isMoving ? 'ladder-climbing' : 'ladder-idle');
  }

  endCleaningPose(): void {
    this.movementLocked = false;
    this.setDepth(Math.floor(this.y));
    this.stateMachine.setState('idle');
  }

  endLadderPose(): void {
    this.setDepth(Math.floor(this.y));
    this.stateMachine.setState('idle');
  }

  private configureSpriteScale(): void {
    const source = this.texture.getSourceImage() as HTMLCanvasElement | HTMLImageElement;
    if (source.height > 700) {
      this.setScale(0.2375);
      return;
    }

    if (source.height > 180) {
      this.setScale(0.95);
    }
  }

  private configureBody(): void {
    const source = this.texture.getSourceImage() as HTMLCanvasElement | HTMLImageElement;
    if (source.height > 700) {
      this.body?.setSize(184, 600).setOffset(248, 352);
      return;
    }

    if (source.height > 180) {
      this.body?.setSize(46, 150).setOffset(62, 88);
      return;
    }

    this.body?.setSize(42, 80).setOffset(25, 34);
  }

  private createAnimations(scene: Phaser.Scene): void {
    if (!scene.anims.exists('employee-idle')) {
      scene.anims.create({
        key: 'employee-idle',
        frames: [{ key: 'employee-idle-0' }, { key: 'employee-idle-1' }, { key: 'employee-idle-2' }],
        frameRate: 3,
        repeat: -1,
      });
    }

    if (!scene.anims.exists('employee-walk')) {
      scene.anims.create({
        key: 'employee-walk',
        frames: [
          { key: 'employee-walk-0' },
          { key: 'employee-walk-1' },
          { key: 'employee-walk-2' },
          { key: 'employee-walk-3' },
        ],
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!scene.anims.exists('employee-soaping')) {
      scene.anims.create({
        key: 'employee-soaping',
        frames: [
          { key: 'employee-soaping-0' },
          { key: 'employee-soaping-1' },
          { key: 'employee-soaping-2' },
          { key: 'employee-soaping-3' },
        ],
        frameRate: 2,
        repeat: -1,
      });
    }

    if (!scene.anims.exists('employee-squeegee')) {
      scene.anims.create({
        key: 'employee-squeegee',
        frames: [
          { key: 'employee-squeegee-0' },
          { key: 'employee-squeegee-1' },
          { key: 'employee-squeegee-2' },
          { key: 'employee-squeegee-3' },
        ],
        frameRate: 2,
        repeat: -1,
      });
    }

    if (!scene.anims.exists('employee-cleaning')) {
      scene.anims.create({
        key: 'employee-cleaning',
        frames: [
          { key: 'employee-cleaning-0' },
          { key: 'employee-cleaning-1' },
          { key: 'employee-cleaning-2' },
          { key: 'employee-cleaning-3' },
        ],
        frameRate: 6,
        repeat: -1,
      });
    }
  }
}
