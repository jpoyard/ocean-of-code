import {Grid} from "./grid.class";
import {ICoordinate} from "./position.class";

export interface IMoveStrategy {
    move: ICoordinate;
    direction: DirectionEnum,
    rand: number;
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

export const MOVE_STRATEGIES_CLOCKWISE: IMoveStrategy[] = [
    {move: {x: 0, y: -1}, direction: DirectionEnum.NORTH},
    {move: {x: 1, y: 0}, direction: DirectionEnum.EST},
    {move: {x: 0, y: 1}, direction: DirectionEnum.SOUTH},
    {move: {x: -1, y: 0}, direction: DirectionEnum.WEST}
]
    .map(moveStrategy => ({...moveStrategy, rand: Math.floor(Math.random() * 10)}))
    .sort((a, b) => a.rand - b.rand);

export const MOVE_STRATEGIES_ANTICLOCKWISE: IMoveStrategy[] = MOVE_STRATEGIES_CLOCKWISE.reverse();

export class Submarine {
    private _isClockwise = false;

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

    protected getStrategies(): IMoveStrategy[] {
        if(this._isClockwise){
            return MOVE_STRATEGIES_CLOCKWISE;
        } else {
            return MOVE_STRATEGIES_ANTICLOCKWISE;
        }
    }
}