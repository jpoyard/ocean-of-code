import {Grid} from "./grid.class";
import {ICoordinate} from "./position.class";

export interface IMoveStrategy {
    move: ICoordinate;
    direction: DirectionEnum
}

export enum DirectionEnum {
    NORTH = 'N',
    EST = 'E',
    SOUTH = 'S',
    WEST = 'W',
}

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

export const MOVE_STRATEGIES: IMoveStrategy[] = [
    {move: {x: 0, y: -1}, direction: DirectionEnum.NORTH},
    {move: {x: 1, y: 0}, direction: DirectionEnum.EST},
    {move: {x: 0, y: 1}, direction: DirectionEnum.SOUTH},
    {move: {x: -1, y: 0}, direction: DirectionEnum.WEST}
];


export class Submarine {
    private _life: number = 6;

    public set life(value: number) {
        this._lost = this._life - value;
        this._life = value;
    }

    private _lost: number = 0;

    public get lost(): number {
        return this._lost;
    }

    constructor(private _id: number, public grid: Grid) {
    }
}