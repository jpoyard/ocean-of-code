import {Cell, CellTypeEnum} from "./cell.class";
import {CellContainer} from "./cell-container.class";
import {Surface} from "./surface.class";
import {ICoordinate, Position} from "./position.class";
import {DirectionEnum, MOVE_STRATEGIES_CLOCKWISE} from "./path-finder.class";

export class Grid extends CellContainer {
    private static readonly POSITION_STRATEGIES = MOVE_STRATEGIES_CLOCKWISE.reduce(
        (acc, cur) => acc.set(cur.direction, cur.move),
        new Map<DirectionEnum, ICoordinate>()
    );
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

    public getNorthCell(cell: Cell): Cell {
        return this.getCellAt(cell, DirectionEnum.NORTH);
    }

    public getSouthCell(cell: Cell): Cell {
        return this.getCellAt(cell, DirectionEnum.SOUTH);
    }

    public getWestCell(cell: Cell): Cell {
        return this.getCellAt(cell, DirectionEnum.WEST);
    }

    public getEstCell(cell: Cell): Cell {
        return this.getCellAt(cell, DirectionEnum.EST);
    }

    public isAvailableCell(cell): boolean {
        return cell.type === CellTypeEnum.SEA
    }

    public getAvailableCells(): Cell[] {
        return this.cells
            .filter((cell) => this.isAvailableCell(cell))
    }

    private getCellAt(cell: Cell, direction: DirectionEnum) {
        return this.getCell(this.getIndex(cell.sum(Grid.POSITION_STRATEGIES.get(direction))));
    }

    public getCellFromCoordinate(opponentPosition: ICoordinate): Cell {
        return this.getCell(this.getIndex(opponentPosition));
    }

    public getCellNext(coordinate: ICoordinate): Cell[] {
        let result = [];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if ((Math.abs(x) === 1 || Math.abs(y) === 1)) {
                    const position = Position.sum(coordinate, {x, y});
                    const cell = this.getCellFromCoordinate(position);
                    if (cell) {
                        result.push(cell);
                    }
                }
            }
        }
        return result;
    }

}
