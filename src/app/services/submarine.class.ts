import {Grid} from "./grid.class";
import {ICoordinate} from "./position.class";

export enum OrderEnum {
    MOVE = 'MOVE',
    SURFACE = 'SURFACE',
    TORPEDO = 'TORPEDO',
    SONAR = 'SONAR',
    SILENCE = 'SILENCE',
    MINE = 'MINE',
    TRIGGER = 'TRIGGER',
    MSG = 'MSG'
}

export class Submarine {
    constructor(private _id: number, public grid: Grid) {
    }

    private _life: number = 6;

    public set life(value: number) {
        this._lost = this._life - value;
        this._life = value;
    }

    private _lost: number = 0;

    public get lost(): number {
        return this._lost;
    }
}
