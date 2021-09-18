export class Player{
    private x = 0;
    private y = 0;

    public get Position() {
        return {x: this.x, y: this.y};
    }

    public set Position(position: {x: number, y: number}) {
        this.x = position.x;
        this.y = position.y;
    }

    public constructor() {
    }
}