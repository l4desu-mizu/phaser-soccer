import * as PHASER from "phaser";
import * as DAT from "dat.gui";

export class Scene extends PHASER.Scene {
  private static CONFIG: Phaser.Types.Scenes.SettingsConfig = {
    key: "scene",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: true,
      },
    },
  };

  private camera!: PHASER.Cameras.Scene2D.Camera;
  private keyboard!: PHASER.Types.Input.Keyboard.CursorKeys;
  private shoot: any;
  private player!: PHASER.Types.Physics.Arcade.SpriteWithDynamicBody;
  private playerHasBall = false;
  private ball!: PHASER.Types.Physics.Arcade.SpriteWithDynamicBody;
  private debugText: any;
  private dat = new DAT.GUI({ name: "Soccer debug GUI" });
  private playerBallOverlap?: PHASER.Physics.Arcade.Collider;

  constructor() {
    super(Scene.CONFIG);
  }

  public preload() {
    this.physics.world.setBounds(0, 0, 2048, 1024);
    // Load tilemap image
    this.load.image("tiles1", "assets/gfx/tiles/Grassland.png");
    this.load.image("ball", "assets/gfx/ball.png");
    // Load map file
    this.load.tilemapTiledJSON("level", "assets/maps/soccer.json");
    this.load.spritesheet("character", "assets/gfx/character/character.png", {
      frameWidth: 48,
      frameHeight: 64,
    });
  }

  public create() {
    const map = this.make.tilemap({
      key: "level",
      tileWidth: 64,
      tileHeight: 64,
    });
    const tileSet = map.addTilesetImage("Grassland", "tiles1");
    const layerGras = map.createLayer("Gras", tileSet, 0, 0);
    const layerDecor = map.createLayer("Decor", tileSet, 0, 0);
    const layerGoals = map.createLayer("Goals", tileSet, 0, 0);
    layerGoals.setCollisionByExclusion([-1], true);
    layerGras.skipCull = false;
    layerDecor.skipCull = false;
    layerGoals.skipCull = false;

    this.anims.create({
      key: "walk_down",
      frames: this.anims.generateFrameNumbers("character", {
        frames: [0, 1, 2],
      }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "walk_up",
      frames: this.anims.generateFrameNumbers("character", {
        frames: [18, 19, 20],
      }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "walk_left",
      frames: this.anims.generateFrameNumbers("character", {
        frames: [6, 7, 8],
      }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "walk_right",
      frames: this.anims.generateFrameNumbers("character", {
        frames: [12, 13, 14],
      }),
      frameRate: 8,
      repeat: -1,
    });

    /*
     *  Create player object and configure layer collision behaviour.
     */
    this.player = this.physics.add
      .sprite(16 * 64, 7 * 64, "character", 0)
      .setScale(1.5);
    this.player.setCollideWorldBounds(true);
    this.initializeBall();

    // this.player.setCollideWorldBounds(); TODO: Fix wrong world bounds
    this.debugText = this.add.text(
      25,
      25,
      `Player position: ${this.player.x}, ${this.player.y}`
    );
    this.debugText.setScrollFactor(0).setDisplaySize(200, 60); // HUD Text
    this.debugText.setColor("#9d03fc");
    //this.player.setSize(32, 32, false);
    //this.player.setPosition(this.player.x, this.player.y - this.player.body.heightInPixels);
    this.physics.add.collider(this.player, layerGoals);
    this.playerBallOverlap = this.physics.add.overlap(
      this.player,
      this.ball,
      () => {
        this.playerHasBall = true;
        this.playerBallOverlap!.active = false;
      }
    );
    this.physics.add.collider(layerGoals, this.ball);

    this.camera = this.cameras.main;
    this.camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.camera.startFollow(this.player);
    //this.camera.setZoom(1.5, 1.5);

    this.keyboard = this.input.keyboard.createCursorKeys();
    this.shoot = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    this.keyboard.left.on("down", () => {
      this.player.play("walk_left");
    });
    this.keyboard.right.on("down", () => {
      this.player.play("walk_right");
    });
    this.keyboard.up.on("down", () => {
      this.player.play("walk_up");
    });
    this.keyboard.down.on("down", () => {
      this.player.play("walk_down");
    });

    this.createDatGUI();
  }

  /**
   * Updates the scene logic.
   * @param time - Overall time in ms since game started.
   * @param delta - Time in ms since last update call.
   */
  public update(_time: number, _delta: number) {
    this.player.setVelocity(0);
    const velocity = 300;

    if (
      this.keyboard.left.isUp &&
      this.keyboard.right.isUp &&
      this.keyboard.down.isUp &&
      this.keyboard.up.isUp
    ) {
      this.player.stop();
    }
    if (this.keyboard.left.isDown) {
      this.player.setVelocityX(-velocity);
    }
    if (this.keyboard.right.isDown) {
      this.player.setVelocityX(velocity);
    }
    if (this.keyboard.down.isDown) {
      this.player.setVelocityY(velocity);
    }
    if (this.keyboard.up.isDown) {
      this.player.setVelocityY(-velocity);
    }

    if (this.playerHasBall) {
      this.ball.setPosition(this.player.x, this.player.y + 32);
    }

    if (this.playerHasBall && this.shoot.isDown) {
      this.ball.setAcceleration(600, 0);
    }

    if (this.playerHasBall && !this.physics.overlap(this.player, this.ball)) {
      this.playerHasBall = false;
      this.playerBallOverlap!.active = true;
    }

    this.debugText.setText(
      `Player position: ${Math.ceil(this.player.x / 64)}, ${Math.ceil(
        this.player.y / 64
      )}`
    );
  }
  createDatGUI() {
    console.log("Creating DAT Gui");
    const folderPlayer = this.dat.addFolder("Player");
    const folderBall = this.dat.addFolder("Ball");
    folderPlayer.add(this.player, "x", 0, 2000, 1);
    folderPlayer.add(this.player, "y", 0, 2000, 1);

    folderBall.add(this.ball, "x", 0, 3000, 1);
    folderBall.add(this.ball, "y", 0, 3000, 1);
    folderBall.add(this.ball, "scale", 0.0, 3.0, 0.01);
    this.createVectorGui(
      folderBall,
      "Acceleration",
      this.ball.body.acceleration,
      -600,
      600,
      10
    );
    this.createVectorGui(
      folderBall,
      "Bounce",
      this.ball.body.bounce,
      0,
      1,
      0.1
    );
    this.createVectorGui(
      folderBall,
      "deltaMax",
      this.ball.body.deltaMax,
      0,
      60,
      1
    );
    this.createVectorGui(folderBall, "drag", this.ball.body.drag, 0, 60, 0.1);
    this.createVectorGui(
      folderBall,
      "friction",
      this.ball.body.friction,
      0,
      1,
      0.05
    );
    this.createVectorGui(
      folderBall,
      "gravity",
      this.ball.body.gravity,
      -600,
      600,
      10
    );
    this.createVectorGui(
      folderBall,
      "maxVelocity",
      this.ball.body.maxVelocity,
      0,
      10000,
      100
    );
    this.createVectorGui(
      folderBall,
      "velocity",
      this.ball.body.velocity,
      -600,
      600,
      10
    );
  }

  createVectorGui(
    folder: dat.GUI,
    name: string,
    vector: PHASER.Math.Vector2,
    min: number,
    max: number,
    step: number
  ) {
    const subFolder = folder.addFolder(name);
    subFolder.add(vector, "x", min, max, step);
    subFolder.add(vector, "y", min, max, step);
  }

  /* Initializes a physics body and its properties. */
  initializeBall() {
    this.ball = this.physics.add
      .sprite(16 * 64 - 10, 7 * 64, "ball", 0)
      .setScale(0.2);
    this.ball.body.setFriction(1, 1);
    this.ball.body.setBounce(0.5, 0.5);
    this.ball.body.setCollideWorldBounds(true);
    this.ball.body.setCircle(117);
    this.ball.body.debugShowVelocity = true;
  }
}
