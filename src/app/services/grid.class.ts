import {Cell, CellTypeEnum} from "./cell.class";
import {CellContainer} from "./cell-container.class";
import {Surface} from "./surface.class";
import {ICoordinate, Position} from "./position.class";
import {DirectionEnum, MOVE_STRATEGIES_ANTI_CLOCKWISE_SE} from "./path-finder.class";

export class Grid extends CellContainer {
    private static readonly POSITION_STRATEGIES = MOVE_STRATEGIES_ANTI_CLOCKWISE_SE.reduce(
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

    public getCellFromCoordinate(opponentPosition: ICoordinate): Cell {
        return this.getCell(this.getIndex(opponentPosition));
    }

    public getTorpedoArea(position: Position): Cell[] {
        const result: Cell[] = [];

        for (let x = -4; x <= 4; x++) {
            const max = 4 - Math.abs(x);
            for (let y = -max; y <= max; y++) {
                const tmpCell = this.getCellFromCoordinate(position.sum({x, y}));
                if (tmpCell && tmpCell.type === CellTypeEnum.SEA) {
                    result.push(tmpCell);
                }
            }
        }
        return result;
    }

    public getTorpedoAreaWithoutDangerArea(position: Position): Cell[] {
        const result: Cell[] = [];

        for (let x = -4; x <= 4; x++) {
            const max = 4 - Math.abs(x);
            for (let y = -max; y <= max; y++) {
                const tmpCell = this.getCellFromCoordinate(position.sum({x, y}));
                if (tmpCell && tmpCell.type === CellTypeEnum.SEA && position.distance(tmpCell) > 1) {
                    result.push(tmpCell);
                }
            }
        }
        return result;
    }

    public getDangerArea(coordinate: ICoordinate): Cell[] {
        const position = new Position({x: coordinate.x, y: coordinate.y});
        const result: Cell[] = [];

        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                const tmpCell = this.getCellFromCoordinate(position.sum({x, y}));
                if (tmpCell && tmpCell.type === CellTypeEnum.SEA) {
                    result.push(tmpCell);
                }
            }
        }

        log(`danger area : {x: ${coordinate.x}, y: ${coordinate.y}}: ${result.length}`);
        return result;
    }

    private getCellAt(cell: Cell, direction: DirectionEnum) {
        return this.getCell(this.getIndex(cell.sum(Grid.POSITION_STRATEGIES.get(direction))));
    }
}
