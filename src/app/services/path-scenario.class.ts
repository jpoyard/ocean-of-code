import {Cell} from "./cell.class";

export class PathScenario {
    private readonly _visitedCells: Set<Cell>;
    private _position: Cell;

    constructor(
        public start: Cell,
        visitedCells?: Cell[],
        position?: Cell,
    ) {
        this._visitedCells = new Set(visitedCells ? visitedCells : [start]);
        this._position = position ? position : start;
    }

    public get position(): Cell{
        return this._position;
    }

    public get visitedCells(): Cell[]{
        return Array.from(this._visitedCells);
    }

    public has(cell: Cell): boolean{
        return this._visitedCells.has(cell);
    }

    public add(cell: Cell): void{
        this._position = cell;
        this._visitedCells.add(cell);
    }

    public get size(): number {
        return this._visitedCells.size;
    }

    public clone(): PathScenario {
        return new PathScenario(this.start, [...Array.from(this._visitedCells)], this._position)
    }


}
