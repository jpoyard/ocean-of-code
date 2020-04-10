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

    public static removeDuplicate(cells: Cell[]): Cell[] {
        let result: Cell[] = [];

        let tmpCellMap = cells.reduce((acc, cur) => {
            let counter = 0;
            if (acc.has(cur)) {
                counter = acc.get(cur);
            }
            return acc.set(cur, counter + 1);
        }, new Map<Cell, number>());

        result = Array.from(tmpCellMap.keys());
        // let tmpCells = cells;
        // while (tmpCells.length > 0) {
        //     const currentCells = tmpCells[0];
        //     result.push(currentCells);
        //     tmpCells = tmpCells.filter(cell => cell!==currentCells)
        // }
        return result;
    }

    public static getMinMax(...cells: Cell[]): { min: ICoordinate, max: ICoordinate } {
        return Position.getMinMax(...cells.map(c => c.coordinate));
    }
}
