import {Grid} from "./grid.class";
import {Submarine} from "./submarine.class";
import {Cell, CellTypeEnum} from "./cell.class";
import {ICoordinates} from "./position.class";

export interface IMoveStrategy {
    move: ICoordinates;
    direction: DirectionEnum
}

export enum DirectionEnum {
    NORTH = 'N',
    EST = 'E',
    SOUTH = 'S',
    WEST = 'W',
}

export const MOVE_STRATEGIES: IMoveStrategy[] = [
    {move: {x: 0, y: -1}, direction: DirectionEnum.NORTH},
    {move: {x: 1, y: 0}, direction: DirectionEnum.EST},
    {move: {x: 0, y: 1}, direction: DirectionEnum.SOUTH},
    {move: {x: -1, y: 0}, direction: DirectionEnum.WEST}
];

export interface IPath {
    cell: Cell;
    direction: DirectionEnum
}

export interface IPathNode {
    cell: Cell;
    direction?: DirectionEnum
    paths?: IPath[];
}

export class OurSubmarine extends Submarine {
    constructor(grid: Grid) {
        super(grid);
        this._visitedCells = new Map<number, Cell>()
    }

    private _visitedCells: Map<number, Cell>;

    public get visitedCells(): Cell[] {
        return Array.from(this._visitedCells.values());
    }

    public isVisitedCell(index: number) {
        return this._visitedCells.has(index);
    }

    public searchStartCell(): Array<{path:IPathNode[], cell: Cell}> {
        let availableStartCells = this.grid.cells
            .filter((cell) => this.isAvailableStartCell(cell));
        return availableStartCells
            .map(cell => ({cell, path: this.searchLongestPath(cell)}))
            .sort((a, b) => b.path.length - a.path.length)
    }

    public searchLongestPath(cell: Cell): IPathNode[] {
        let result: IPathNode[] = [];

        let availableCells: Map<number, Cell> = this.grid.cells
            .filter((cell) => cell.type === CellTypeEnum.SEA && !this.isVisitedCell(cell.index))
            .reduce((acc, cur) => acc.set(cur.index, cur), new Map<number, Cell>());
        let minLength = Math.floor(availableCells.size / 2);

        let pathNodes: IPathNode[] = [];
        pathNodes.push({cell});

        do {
            let currentPathNode = pathNodes[pathNodes.length - 1];

            if (currentPathNode.paths == null) {
                currentPathNode.paths = MOVE_STRATEGIES
                    .map(strategy => ({
                        index: this.grid.getIndex(currentPathNode.cell.sum(strategy.move)),
                        direction: strategy.direction
                    }))
                    .filter(strategy => this.grid.isIndexValid(strategy.index) && availableCells.has(strategy.index))
                    .map(strategy => ({cell: this.grid.getCell(strategy.index), direction: strategy.direction}))
                    .filter(strategy => strategy.cell.type === CellTypeEnum.SEA)
            }

            if (currentPathNode.paths.length > 0) {
                const newPath = currentPathNode.paths.pop();
                availableCells.delete(newPath.cell.index);
                currentPathNode.direction = newPath.direction;
                pathNodes.push({cell: newPath.cell});
            } else {
                if (pathNodes.length > result.length) {
                    result = pathNodes.map(node => ({
                        cell: node.cell,
                        direction: node.direction
                    }));
                }
                const path = pathNodes.pop();
                availableCells.set(path.cell.index, path.cell);
            }
        }
        while (pathNodes.length > 0 && result.length <= minLength);

        return result;
    }

    private isAvailableStartCell(cell: Cell) {
        return cell.type === CellTypeEnum.SEA &&
            (((cell.x === 0 || cell.x === this.grid.width - 1) &&
                (cell.y === 0 || cell.y === this.grid.height - 1)) || cell.equals(this.grid.middle));
    }

}