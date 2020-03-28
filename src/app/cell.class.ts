import {ICoordinate, Position} from "./position.class";

export enum CellTypeEnum {
    SEA = '.',
    ISLAND = 'X'
}

export class Cell extends Position {
    private readonly _index: number;
    private readonly _surface: number;
    private readonly _type: CellTypeEnum;

    constructor(coordinates: ICoordinate, index: number, type: CellTypeEnum, surface: number) {
        super(coordinates);
        this._index = index;
        this._type = type;
        this._surface = surface;
    }

    public get index(): number {
        return this._index;
    }

    public get surface(): number {
        return this._surface;
    }

    public get type(): CellTypeEnum {
        return this._type;
    }
}