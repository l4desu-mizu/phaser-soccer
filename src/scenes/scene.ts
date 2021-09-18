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
	private keyShoot!: PHASER.Input.Keyboard.Key;
	private player1!: PHASER.Types.Physics.Arcade.SpriteWithDynamicBody;
	private player2!: PHASER.Types.Physics.Arcade.SpriteWithDynamicBody;
	private playerHasBall1 = false;
	private playerHasBall2 = false;
	private ball!: PHASER.Types.Physics.Arcade.SpriteWithDynamicBody;
	private debugText: PHASER.GameObjects.Text | null = null;
	private dat = new DAT.GUI({ name: "Soccer debug GUI" });
	private playerBallOverlap1?: PHASER.Physics.Arcade.Collider;
	private playerBallOverlap2?: PHASER.Physics.Arcade.Collider;

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

		/*
		 *  Create player objects and configure layer collision behaviour.
		 */
		this.player1 = this.physics.add.sprite(16 * 64, 7 * 64, "character", 0);
		this.player1.setScale(1.5);
		this.player1.setSize(this.player1.width - 20, this.player1.height - 10);
		this.player1.setCollideWorldBounds(true);

		this.player2 = this.physics.add.sprite(18 * 64, 7 * 64, "character", 10);
		this.player2.setScale(1.5);
		this.player2.setSize(this.player2.width - 20, this.player2.height - 10);
		this.player2.setCollideWorldBounds(true);

		this.createPlayerAnims();

		this.initializeBall();

		this.debugText = this.add.text(25, 25, `Player position: ${this.player1.x}, ${this.player1.y}`);
		this.debugText.setScrollFactor(0).setDisplaySize(200, 60);
		this.debugText.setColor("#9d03fc");

		this.physics.add.collider(this.player1, layerGoals);
		this.physics.add.collider(this.player2, layerGoals);
		this.playerBallOverlap1 = this.physics.add.overlap(this.player1, this.ball, () => {
			this.playerHasBall1 = true;
			this.playerHasBall2 = false;
			this.playerBallOverlap1!.active = false;
			this.playerBallOverlap2!.active = false;
		});
		this.playerBallOverlap2 = this.physics.add.overlap(this.player2, this.ball, () => {
			this.playerHasBall1 = false;
			this.playerHasBall2 = true;
			this.playerBallOverlap1!.active = false;
			this.playerBallOverlap2!.active = false;
		});
		this.physics.add.collider(layerGoals, this.ball);

		this.camera = this.cameras.main;
		this.camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
		this.camera.startFollow(this.player1);
		this.camera.setRoundPixels(true);

		this.keyboard = this.input.keyboard.createCursorKeys();
		this.keyShoot = this.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.SPACE,
		);

		this.keyboard.left.on("down", () => {
			this.player1.play("walk_left1");
		});
		this.keyboard.right.on("down", () => {
			this.player1.play("walk_right1");
		});
		this.keyboard.up.on("down", () => {
			this.player1.play("walk_up1");
		});
		this.keyboard.down.on("down", () => {
			this.player1.play("walk_down1");
		});

		this.createDatGUI();
	}

	/**
	 * Updates the scene logic.
	 * @param time - Overall time in ms since game started.
	 * @param delta - Time in ms since last update call.
	 */
	public update(_time: number, _delta: number) {
		this.player1.setVelocity(0);
		const velocity = 300;

		if (
			this.keyboard.left.isUp &&
			this.keyboard.right.isUp &&
			this.keyboard.down.isUp &&
			this.keyboard.up.isUp
		) {
			this.player1.stop();
		}
		if (this.keyboard.left.isDown) {
			this.player1.setVelocityX(-velocity);
		}
		if (this.keyboard.right.isDown) {
			this.player1.setVelocityX(velocity);
		}
		if (this.keyboard.down.isDown) {
			this.player1.setVelocityY(velocity);
		}
		if (this.keyboard.up.isDown) {
			this.player1.setVelocityY(-velocity);
		}

		if (this.playerHasBall1) {
			this.updateBallPosition(this.player1);
		}
		if (this.playerHasBall2) {
			this.updateBallPosition(this.player2);
		}

		if (this.playerHasBall1 && this.keyShoot.isDown) {
			this.ball.setAcceleration(600, 0);
		}

		/*if (this.playerHasBall1 && !this.physics.overlap(this.player1, this.ball)) {
			this.playerHasBall1 = false;
			this.playerBallOverlap1!.active = true;
		}*/

		this.debugText?.setText(
			`Player overlaps ball: ${this.physics.overlap(this.player1, this.ball)}`
		);
	}
	createDatGUI() {
		console.log("Creating DAT Gui");
		const folderPlayer = this.dat.addFolder("Player");
		const folderBall = this.dat.addFolder("Ball");
		folderPlayer.add(this.player1, "x", 0, 2000, 1);
		folderPlayer.add(this.player1, "y", 0, 2000, 1);

		folderBall.add(this.ball, "x", 0, 3000, 1);
		folderBall.add(this.ball, "y", 0, 3000, 1);
		folderBall.add(this.ball, "scale", 0.0, 3.0, 0.01);
		this.createVectorGui(
			folderBall, "Acceleration", this.ball.body.acceleration,
			-600, 600, 10,
		);
		this.createVectorGui(
			folderBall, "Bounce", this.ball.body.bounce,
			0, 1, 0.1
		);
		this.createVectorGui(
			folderBall, "deltaMax", this.ball.body.deltaMax,
			0, 60, 1,
		);
		this.createVectorGui(
			folderBall, "drag", this.ball.body.drag,
			0, 60, 0.1,
		);
		this.createVectorGui(
			folderBall,
			"friction",
			this.ball.body.friction,
			0,
			1,
			0.05,
		);
		this.createVectorGui(folderBall, "gravity", this.ball.body.gravity,
			-600, 600, 10
		);
		this.createVectorGui(folderBall, "maxVelocity", this.ball.body.maxVelocity,
			0, 10000, 100
		);
		this.createVectorGui(folderBall, "velocity", this.ball.body.velocity,
			-600, 600, 10
		);
	}

	createVectorGui(folder: dat.GUI, name: string, vector: PHASER.Math.Vector2,
					min: number, max: number, step: number) {
		const subFolder = folder.addFolder(name);
		subFolder.add(vector, "x", min, max, step);
		subFolder.add(vector, "y", min, max, step);
	}

	createPlayerAnims(){
		this.anims.create({
			key: "walk_down1",
			frames: this.anims.generateFrameNumbers("character", {
				frames: [0, 1, 2],
			}),
			frameRate: 8,
			repeat: -1,
		});

		this.anims.create({
			key: "walk_down2",
			frames: this.anims.generateFrameNumbers("character", {
				frames: [3, 4, 5],
			}),
			frameRate: 8,
			repeat: -1,
		});

		this.anims.create({
			key: "walk_up1",
			frames: this.anims.generateFrameNumbers("character", {
				frames: [18, 19, 20],
			}),
			frameRate: 8,
			repeat: -1,
		});

		this.anims.create({
			key: "walk_up2",
			frames: this.anims.generateFrameNumbers("character", {
				frames: [21, 22, 23],
			}),
			frameRate: 8,
			repeat: -1,
		});

		this.anims.create({
			key: "walk_left1",
			frames: this.anims.generateFrameNumbers("character", {
				frames: [6, 7, 8],
			}),
			frameRate: 8,
			repeat: -1,
		});

		this.anims.create({
			key: "walk_left2",
			frames: this.anims.generateFrameNumbers("character", {
				frames: [9, 10, 11],
			}),
			frameRate: 8,
			repeat: -1,
		});

		this.anims.create({
			key: "walk_right1",
			frames: this.anims.generateFrameNumbers("character", {
				frames: [12, 13, 14],
			}),
			frameRate: 8,
			repeat: -1,
		});

		this.anims.create({
			key: "walk_right2",
			frames: this.anims.generateFrameNumbers("character", {
				frames: [15, 16, 17],
			}),
			frameRate: 8,
			repeat: -1,
		});
	}

	/* Initializes a physics body and its properties. */
	initializeBall() {
		this.ball = this.physics.add.sprite(16 * 64 - 10, 7 * 64, "ball", 0)
			.setScale(0.13);
		this.ball.body.setFriction(1, 1);
		this.ball.body.setBounce(0.5, 0.5);
		this.ball.body.setCollideWorldBounds(true);
		this.ball.body.setCircle(117);
		this.ball.body.debugShowVelocity = true;
	}

	updateBallPosition(player: PHASER.Types.Physics.Arcade.SpriteWithDynamicBody) {
		const moveVector = player.body.velocity.normalize();
		this.ball.x = player.x + (32 * moveVector.x);
		this.ball.y = player.y + (64 * moveVector.y);
	}

	shoot(player: PHASER.Types.Physics.Arcade.SpriteWithDynamicBody) {
		// TODO : Implement logic.
	}
}
