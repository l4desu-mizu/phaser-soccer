import * as PHASER from "phaser";

export class Player {
    private readonly speed: number = 300;
    public constructor(public sprite: PHASER.Types.Physics.Arcade.SpriteWithDynamicBody) {
    }

    public move(direction: PHASER.Math.Vector2){
        let normalized = direction.normalize().scale(this.speed);
        this.sprite.setVelocity(normalized.x, normalized.y);
        this.updateSprite(normalized);
    }

    private updateSprite(normalized: PHASER.Math.Vector2){
        if (normalized.x>normalized.y){
            if(normalized.x > 0){
                this.sprite.play("walk_right1")
            }
            else if(normalized.x < 0){
                this.sprite.play("walk_left1")
            }
        }else if(normalized.y<normalized.x){
            if(normalized.y > 0){
                this.sprite.play("walk_up1")
            }
            else if(normalized.y < 0){
                this.sprite.play("walk_down1")
            }
        }
    }

    public position(): PHASER.Math.Vector2 {
        return new PHASER.Math.Vector2(this.sprite.x, this.sprite.y);
    }
}