import {Cell, CellTypeEnum} from "./cell.class";
import {CellContainer} from "./cell-container.class";
import {Surface} from "./surface.class";

export class Grid extends CellContainer {
    private readonly _cells: Cell[];
    private readonly _surfaces: Surface[];

    constructor(width: number, height: number, grid: string[]) {
        super(width, height);

        const tmpSurfaces: Array<{ surface: number, cells: Cell[] }> = [];

        this._cells = grid.map((type, index) => {
            const coordinates = this.getCoordinates(index);
            const surface = Surface.getSurfaceIndex(coordinates);
            const cell = new Cell(coordinates, index, type as CellTypeEnum, surface);
            if (!tmpSurfaces[surface - 1]) {
                tmpSurfaces[surface - 1] = {surface, cells: []}
            }
            tmpSurfaces[surface - 1].cells.push(cell);
            return cell;
        });

        this._surfaces = tmpSurfaces.map((tmpSurface, index) => {
            return new Surface(tmpSurface.surface, tmpSurface.cells)
        })
    }

    public get cells(): Cell[] {
        return [...this._cells];
    }

    public get surfaces(): Surface[] {
        return [...this._surfaces];
    }

    public getCell(index: number): Cell | undefined {
        let result: Cell | undefined;
        if (this.isIndexValid(index)) {
            result = this.cells[index];
        }
        return result;
    }

    public isAvailableCell(cell): boolean {
        return cell.type === CellTypeEnum.SEA
    }

    public getAvailableCells(): Cell[] {
        return this.cells
            .filter((cell) => this.isAvailableCell(cell))
    }
}