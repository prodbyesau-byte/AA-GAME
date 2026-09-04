import Phaser from 'phaser';

interface PlayerControls {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  leftKey: Phaser.Input.Keyboard.Key;
  rightKey: Phaser.Input.Keyboard.Key;
  upKey: Phaser.Input.Keyboard.Key;
  downKey: Phaser.Input.Keyboard.Key;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly speed = 255;
  private readonly laneSpeed = 145;
  private readonly laneTop = 558;
  private readonly laneBottom = 670;
  private movementLocked = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'employee-idle-0');

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.configureSpriteScale();
    this.setDepth(30);
    this.setCollideWorldBounds(true);
    this.configureBody();
    this.createAnimations(scene);
    this.play('employee-idle');
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
    const horizontalVelocity = movingLeft === movingRight ? 0 : movingLeft ? -this.speed : this.speed;
    const verticalVelocity = movingUp === movingDown ? 0 : movingUp ? -this.laneSpeed : this.laneSpeed;

    this.setVelocity(horizontalVelocity, verticalVelocity);
    this.y = Phaser.Math.Clamp(this.y, this.laneTop, this.laneBottom);

    if (horizontalVelocity === 0 && verticalVelocity === 0) {
      this.play('employee-idle', true);
      return;
    }

    if (horizontalVelocity !== 0) {
      this.setFlipX(horizontalVelocity < 0);
    }
    this.play('employee-walk', true);
    this.setDepth(Math.floor(this.y));
  }

  beginCleaningPose(): void {
    this.movementLocked = true;
    this.setVelocity(0, 0);
    this.setFlipX(false);
    this.play('employee-cleaning', true);
  }

  endCleaningPose(): void {
    this.movementLocked = false;
    this.play('employee-idle', true);
  }

  private configureSpriteScale(): void {
    const source = this.texture.getSourceImage() as HTMLCanvasElement | HTMLImageElement;
    if (source.height > 180) {
      this.setScale(0.95);
    }
  }

  private configureBody(): void {
    const source = this.texture.getSourceImage() as HTMLCanvasElement | HTMLImageElement;
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

    if (!scene.anims.exists('employee-cleaning')) {
      scene.anims.create({
        key: 'employee-cleaning',
        frames: [
          { key: 'employee-cleaning-0' },
          { key: 'employee-cleaning-1' },
          { key: 'employee-cleaning-2' },
          { key: 'employee-cleaning-3' },
        ],
        frameRate: 8,
        repeat: -1,
      });
    }
  }
}
