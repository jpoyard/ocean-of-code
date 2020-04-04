import {Cell, CellTypeEnum} from "./cell.class";
import {IPath, IPathNode} from "./our-submarine.class";
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

export const MOVE_STRATEGIES_CLOCKWISE: IMoveStrategy[] = [
    {move: {x: 0, y: -1}, direction: DirectionEnum.NORTH},
    {move: {x: 1, y: 0}, direction: DirectionEnum.EST},
    {move: {x: 0, y: 1}, direction: DirectionEnum.SOUTH},
    {move: {x: -1, y: 0}, direction: DirectionEnum.WEST}
]
    .map(moveStrategy => ({...moveStrategy, rand: Math.floor(Math.random() * 10)}))
    .sort((a, b) => a.rand - b.rand);

export const MOVE_STRATEGIES_ANTICLOCKWISE: IMoveStrategy[] = MOVE_STRATEGIES_CLOCKWISE.reverse();

export class PathFinder {
    private _isClockwise = false;

    constructor(private _grid: Grid) {
    }

    private _visitedCells = new Map<number, Cell>();

    public get visitedCells(): Cell[] {
        return Array.from(this._visitedCells.values());
    }

    public get grid(): Grid {
        return this._grid;
    }

    public addVisitedCell(cell: Cell): void {
        this._visitedCells.set(cell.index, cell);
    }

    public clearVisitedCell(): void {
        this._visitedCells.clear();
    }

    public isVisitedCell(index: number) {
        return this._visitedCells.has(index);
    }


    public searchStartCell(): { path: IPathNode[], position: Cell } {
        let availableStartCells = this._grid.cells
            .filter((cell) => this.isAvailableStartCell(cell));
        return availableStartCells
            .map(position => ({position, path: this.searchLongestPath(position)}))
            .sort((a, b) => b.path.length - a.path.length)[0];
    }

    public searchShortestPath(startCell: Cell, endCell: Cell): IPathNode[] {
        let result: IPathNode[] = [];
        let pathNodes: IPathNode[] = [];

        if (this.grid.isAvailableCell(startCell) && !this.isVisitedCell(endCell.index) && this.grid.isAvailableCell(endCell)) {
            pathNodes.push({cell: startCell});

            let availableCells: Map<number, Cell> = this.grid.getAvailableCells()
                .filter((c) => !this.isVisitedCell(c.index) && !startCell.equals(c))
                .reduce((acc, cur) => acc.set(cur.index, cur), new Map<number, Cell>());
            let maxIteration = availableCells.size * 4;
            let iteration = 0;

            do {
                let currentPathNode = pathNodes[pathNodes.length - 1];
                let pathLength = currentPathNode.cell.pathLength(endCell);

                if (currentPathNode.cell !== endCell) {
                    if (currentPathNode.paths == null) {
                        currentPathNode.paths = this.initializePath(currentPathNode, availableCells)
                            .filter(p => p.cell.pathLength(endCell) <= pathLength);
                    } else if (currentPathNode.cell.equals(endCell)) {
                        currentPathNode.paths = [];
                    }

                    if (currentPathNode.paths.length > 0) {
                        const newPath = currentPathNode.paths.pop();
                        availableCells.delete(newPath.cell.index);
                        currentPathNode.direction = newPath.direction;
                        pathNodes.push({cell: newPath.cell});
                    } else {
                        const path = pathNodes.pop();
                        availableCells.set(path.cell.index, path.cell);
                    }
                } else {
                    if (result.length === 0 || pathNodes.length <= result.length) {
                        result = pathNodes.map(node => ({
                            cell: node.cell,
                            direction: node.direction
                        }));
                    }
                    const path = pathNodes.pop();
                    availableCells.set(path.cell.index, path.cell);
                }
                iteration++;
            } while (pathNodes.length > 0 && iteration <= maxIteration);
        }
        return result;
    }

    public searchLongestPath(cell: Cell): IPathNode[] {
        let result: IPathNode[] = [];
        let pathNodes: IPathNode[] = [];

        if (this.grid.isAvailableCell(cell)) {
            pathNodes.push({cell});

            let availableCells: Map<number, Cell> = this.grid.getAvailableCells()
                .filter((c) => !this.isVisitedCell(c.index) && !cell.equals(c))
                .reduce((acc, cur) => acc.set(cur.index, cur), new Map<number, Cell>());
            let minLength = Math.floor(availableCells.size - availableCells.size / 10);
            let maxIteration = availableCells.size * 32;

            let iteration = 0;
            do {
                let currentPathNode = pathNodes[pathNodes.length - 1];

                if (currentPathNode.paths == null) {
                    currentPathNode.paths = this.initializePath(currentPathNode, availableCells)
                }

                if (currentPathNode.paths.length > 0) {
                    let newPath = currentPathNode.paths.pop();
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
                iteration++;
            }
            while (pathNodes.length > 0 && result.length <= minLength && iteration <= maxIteration);
        }
        return result;
    }

    public getMoveStrategies(nextPosition: Cell): Array<IMoveStrategy & { index: number }> {
        return this.getStrategies()
            .map(moveStrategy => ({
                ...moveStrategy,
                index: this.grid.getIndex(nextPosition.sum(moveStrategy.move))
            }))
            .filter(moveStrategy => this.grid.isIndexValid(moveStrategy.index))
    }

    protected getStrategies(): IMoveStrategy[] {
        if (this._isClockwise) {
            return MOVE_STRATEGIES_CLOCKWISE;
        } else {
            return MOVE_STRATEGIES_ANTICLOCKWISE;
        }
    }

    private isAvailableStartCell(cell: Cell) {
        return cell.type === CellTypeEnum.SEA &&
            (((cell.x === 0 || cell.x === this.grid.width - 1) &&
                (cell.y === 0 || cell.y === this.grid.height - 1)) || cell.equals(this.grid.middle));
    }

    private initializePath(currentPathNode: IPathNode, availableCells: Map<number, Cell>) {
        this._isClockwise = !this._isClockwise;
        return this.getMoveStrategies(currentPathNode.cell)
            .filter(strategy => availableCells.has(strategy.index))
            .map(strategy => ({cell: this.grid.getCell(strategy.index), direction: strategy.direction}))
            .filter(strategy => strategy.cell.type === CellTypeEnum.SEA);
    }
}
