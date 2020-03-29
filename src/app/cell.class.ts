import {ICoordinate, Position} from "./position.class";

export enum CellTypeEnum {
    SEA = '.',
    ISLAND = 'X'
}

export class Cell extends Position {
    private readonly _index: number;
    private readonly _surface: number;
    private readonly _type: CellTypeEnum;

    public static removeDuplicate(cells: Cell[]): Cell[] {
        let result: Cell[] = [];
        let tmpCells = cells;
        while (tmpCells.length > 0) {
            const currentCells = tmpCells[0];
            result.push(currentCells);
            tmpCells = tmpCells.filter(cell => cell!==currentCells)
        }
        return result;
    }

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