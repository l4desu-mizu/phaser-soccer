import * as PHASER from 'phaser';

export class Scene extends PHASER.Scene {
    private static CONFIG: Phaser.Types.Scenes.SettingsConfig = {
        key: 'scene'
    }

    private gameOver: boolean;

    constructor() {
        super(Scene.CONFIG);
    }

    public preload() {
        // Load scene assets here.
    }

    public create() {
        // Create game objects here.
    }
 
    /**
     * Updates the scene logic.
     * @param time - Overall time in ms since game started.
     * @param delta - Time in ms since last update call.
     */
    public update(time, delta) {
        // Update the game logic here.
    }
}