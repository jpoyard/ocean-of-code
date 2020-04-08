import {Cell, CellTypeEnum} from "./cell.class";
import {IPath, IPathNode} from "./our-submarine.class";
import {Grid} from "./grid.class";
import {ICoordinate} from "./position.class";

export interface IMoveStrategy {
    move: ICoordinate;
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

function createMoveAntiClockwiseStrategies(order: DirectionEnum[]): IMoveStrategy[] {
    const orderMap = order.reduce((acc, cur, index) => acc.set(cur, index), new Map<DirectionEnum, number>());
    return [...MOVE_STRATEGIES]
        .sort((a, b) => orderMap.get(b.direction) - orderMap.get(a.direction));
}

export const MOVE_STRATEGIES_ANTI_CLOCKWISE_NW: IMoveStrategy[] = createMoveAntiClockwiseStrategies(
    [DirectionEnum.SOUTH, DirectionEnum.EST, DirectionEnum.NORTH, DirectionEnum.WEST]
);
export const MOVE_STRATEGIES_ANTI_CLOCKWISE_NE: IMoveStrategy[] = createMoveAntiClockwiseStrategies(
    [DirectionEnum.WEST, DirectionEnum.SOUTH, DirectionEnum.EST, DirectionEnum.NORTH]
);
export const MOVE_STRATEGIES_ANTI_CLOCKWISE_SW: IMoveStrategy[] = createMoveAntiClockwiseStrategies(
    [DirectionEnum.EST, DirectionEnum.NORTH, DirectionEnum.WEST, DirectionEnum.SOUTH]
);
export const MOVE_STRATEGIES_ANTI_CLOCKWISE_SE: IMoveStrategy[] = createMoveAntiClockwiseStrategies(
    [DirectionEnum.NORTH,DirectionEnum.WEST, DirectionEnum.SOUTH,  DirectionEnum.EST]
);

export class PathFinder {
    private _directionStrategies: IMoveStrategy[] = MOVE_STRATEGIES_ANTI_CLOCKWISE_NE;
    private _visitedCells = new Set<Cell>();

    constructor(private _grid: Grid) {
    }

    public get grid(): Grid {
        return this._grid;
    }

    public addVisitedCell(cell: Cell): void {
        this._visitedCells.add(cell);
    }

    public clearVisitedCell(): void {
        this._visitedCells.clear();
    }

    public isVisitedCell(cell: Cell): boolean {
        return this._visitedCells.has(cell);
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

        if (this.grid.isAvailableCell(startCell) && !this.isVisitedCell(endCell) && this.grid.isAvailableCell(endCell)) {
            pathNodes.push({cell: startCell});

            let availableCells: Set<Cell> = new Set<Cell>(this.grid.getAvailableCells()
                .filter((c) => !this.isVisitedCell(c) && startCell !== c));
            let maxIteration = availableCells.size * 4;
            let iteration = 0;

            do {
                let currentPathNode = pathNodes[pathNodes.length - 1];
                let pathLength = currentPathNode.cell.pathLength(endCell);

                if (currentPathNode.cell !== endCell) {
                    if (currentPathNode.paths == null) {
                        currentPathNode.paths = this.getAvailablePaths(currentPathNode, availableCells)
                            .filter(p => p.cell.pathLength(endCell) <= pathLength);
                    } else if (currentPathNode.cell.equals(endCell)) {
                        currentPathNode.paths = [];
                    }

                    if (currentPathNode.paths.length > 0) {
                        const newPath = currentPathNode.paths.pop();
                        availableCells.delete(newPath.cell);
                        currentPathNode.direction = newPath.direction;
                        pathNodes.push({cell: newPath.cell});
                    } else {
                        const path = pathNodes.pop();
                        availableCells.add(path.cell);
                    }
                } else {
                    if (result.length === 0 || pathNodes.length <= result.length) {
                        result = pathNodes.map(node => ({
                            cell: node.cell,
                            direction: node.direction
                        }));
                    }
                    const path = pathNodes.pop();
                    availableCells.add(path.cell);
                }
                iteration++;
            } while (pathNodes.length > 0 && iteration <= maxIteration);
        }
        return result;
    }

    public searchTorpedoPath(startCell: Cell, endCell: Cell): IPathNode[] {
        let result: IPathNode[] = [];
        let pathNodes: IPathNode[] = [];

        pathNodes.push({cell: startCell});

        let availableCells: Set<Cell> = new Set<Cell>(this.grid.getAvailableCells());

        do {
            let currentPathNode = pathNodes[pathNodes.length - 1];
            let pathLength = currentPathNode.cell.pathLength(endCell);

            if (currentPathNode.cell !== endCell) {
                if (!currentPathNode.paths) {
                    currentPathNode.paths = this.getAvailablePaths(currentPathNode, availableCells)
                        .filter(p => p.cell.pathLength(endCell) <= pathLength);
                } else if (currentPathNode.cell.equals(endCell)) {
                    currentPathNode.paths = [];
                }

                if (currentPathNode.paths.length > 0) {
                    const newPath = currentPathNode.paths.pop();
                    availableCells.delete(newPath.cell);
                    currentPathNode.direction = newPath.direction;
                    pathNodes.push({cell: newPath.cell});
                } else {
                    const path = pathNodes.pop();
                    availableCells.add(path.cell);
                }
            } else {
                if (result.length === 0 || pathNodes.length <= result.length) {
                    result = pathNodes.map(node => ({
                        cell: node.cell,
                        direction: node.direction
                    }));
                }
                const path = pathNodes.pop();
                availableCells.add(path.cell);
            }
        } while (pathNodes.length > 0);
        return result;
    }

    public searchLongestPath(cell: Cell): IPathNode[] {
        let result: IPathNode[] = [];
        let pathNodes: IPathNode[] = [];

        if (this.grid.isAvailableCell(cell)) {
            pathNodes.push({cell});
            let availableCells: Set<Cell> = new Set<Cell>(
                this.grid.getAvailableCells().filter((c) => !this.isVisitedCell(c) && cell !== c));
            let minLength = Math.floor(availableCells.size - availableCells.size / 10);
            let maxIteration = availableCells.size * 32;

            let iteration = 0;
            do {
                let currentPathNode = pathNodes[pathNodes.length - 1];

                if (currentPathNode.paths == null) {
                    this.defineStrategiesOrder(currentPathNode.cell);
                    currentPathNode.paths = this.getAvailablePaths(currentPathNode, availableCells)
                }

                if (currentPathNode.paths.length > 0) {
                    let newPath = currentPathNode.paths.pop();
                    availableCells.delete(newPath.cell);
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
                    availableCells.add(path.cell);
                }
                iteration++;
            }
            while (pathNodes.length > 0 && result.length <= minLength && iteration <= maxIteration);
        }
        return result;
    }

    public getMoveStrategies(nextPosition: Cell): Array<IMoveStrategy & { cell: Cell }> {
        return this._directionStrategies
            .map(moveStrategy => ({
                ...moveStrategy,
                cell: this.grid.getCellFromCoordinate(nextPosition.sum(moveStrategy.move))
            }))
            .filter(moveStrategy => !!moveStrategy.cell)
    }

    public defineStrategiesOrder(position: Cell): void {
        if (position.x < this.grid.width / 2 && position.y < this.grid.height / 2) {
            this._directionStrategies = MOVE_STRATEGIES_ANTI_CLOCKWISE_NW;
        } else if (position.x >= this.grid.width / 2 && position.y < this.grid.height / 2) {
            this._directionStrategies = MOVE_STRATEGIES_ANTI_CLOCKWISE_NE;
        } else if (position.x < this.grid.width / 2 && position.y >= this.grid.height / 2) {
            this._directionStrategies = MOVE_STRATEGIES_ANTI_CLOCKWISE_SW;
        } else {
            this._directionStrategies = MOVE_STRATEGIES_ANTI_CLOCKWISE_SE;
        }
    }

    private isAvailableStartCell(cell: Cell): boolean {
        return cell.type === CellTypeEnum.SEA &&
            (((cell.x === 0 || cell.x === this.grid.width - 1) &&
                (cell.y === 0 || cell.y === this.grid.height - 1)) || cell.equals(this.grid.middle));
    }

    private getAvailablePaths(currentPathNode: IPathNode, availableCells: Set<Cell>): IPath[] {
        return this.getMoveStrategies(currentPathNode.cell)
            .filter(strategy => availableCells.has(strategy.cell));
    }
}
