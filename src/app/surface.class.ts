import {Cell} from "./cell.class";
import {ICoordinates} from "./position.class";
import {CellContainer} from "./cell-container.class";

export class Surface extends CellContainer {
    public static readonly WIDTH = 5;
    private static readonly GRID_WIDTH = 3;
    private readonly _index: number;
    private readonly _cells: Map<number, Cell>;

    constructor(index: number, cells: Cell[]) {
        super(Surface.WIDTH, Surface.WIDTH);
        this._index = index;
        this._cells = cells.reduce(
            (acc, cur) => acc.set(cur.index, cur),
            new Map<number, Cell>()
        );
    }

    public get cells(): Cell[] {
        return Array.from(this._cells.values());
    }

    public get index(): number {
        return this._index;
    }

    public static getSurfaceIndex({x, y}: ICoordinates): number {
        return (Math.floor(x / Surface.WIDTH) + Math.floor(y / Surface.WIDTH) * Surface.GRID_WIDTH) + 1;
    }
}