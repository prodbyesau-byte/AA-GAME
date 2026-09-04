import Phaser from 'phaser';

export class WorkVan extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'anders-van');
    scene.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setScale(0.86);
    this.setDepth(20);
    scene.physics.add.existing(this, true);
    this.configureBody();
    this.setInteractive({ cursor: 'pointer' });
    this.setData('futureSystems', ['equipment', 'water', 'job-selection', 'transport']);
  }

  private configureBody(): void {
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(332, 96);
    body.setOffset(48, 84);
    body.updateFromGameObject();
  }
}
