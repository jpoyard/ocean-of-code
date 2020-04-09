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

function createMoveStrategies(order: DirectionEnum[]): IMoveStrategy[] {
    const orderMap = order.reduce((acc, cur, index) => acc.set(cur, index), new Map<DirectionEnum, number>());
    return [...MOVE_STRATEGIES]
        .sort((a, b) => orderMap.get(a.direction) - orderMap.get(b.direction));
}

export const MOVE_STRATEGIES_NW: IMoveStrategy[] = createMoveStrategies(
    [DirectionEnum.EST, DirectionEnum.NORTH, DirectionEnum.WEST, DirectionEnum.SOUTH]
);
export const MOVE_STRATEGIES_SW: IMoveStrategy[] = createMoveStrategies(
    [DirectionEnum.NORTH, DirectionEnum.WEST, DirectionEnum.SOUTH, DirectionEnum.EST]
);
export const MOVE_STRATEGIES_SE: IMoveStrategy[] = createMoveStrategies(
    [DirectionEnum.WEST, DirectionEnum.SOUTH, DirectionEnum.EST, DirectionEnum.NORTH]
);
export const MOVE_STRATEGIES_NE: IMoveStrategy[] = createMoveStrategies(
    [DirectionEnum.SOUTH, DirectionEnum.EST, DirectionEnum.NORTH, DirectionEnum.WEST]
);

export class PathFinder {
    private _directionStrategies: IMoveStrategy[] = MOVE_STRATEGIES_NE;
    private _visitedCells = new Set<Cell>();

    constructor(private _grid: Grid) {
    }

    public get grid(): Grid {
        return this._grid;
    }

    private static nextPathNode(currentPathNode: IPathNode, availableCells: Set<Cell>, pathNodes: IPathNode[]): void {
        if (currentPathNode.paths.length > 0) {
            const newPath = currentPathNode.paths.pop();
            availableCells.delete(newPath.cell);
            currentPathNode.direction = newPath.direction;
            pathNodes.push({cell: newPath.cell});
        } else {
            const path = pathNodes.pop();
            availableCells.add(path.cell);
        }
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
        let availableStartCells = this.grid.surfaces[4].cells
            .filter((cell) => cell.type === CellTypeEnum.SEA);
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
                        currentPathNode.paths = this.getAvailablePaths(currentPathNode.cell, availableCells)
                            .filter(p => p.cell.pathLength(endCell) <= pathLength);
                    } else if (currentPathNode.cell.equals(endCell)) {
                        currentPathNode.paths = [];
                    }

                    PathFinder.nextPathNode(currentPathNode, availableCells, pathNodes);
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
                    currentPathNode.paths = this.getAvailablePaths(currentPathNode.cell, availableCells)
                        .filter(p => p.cell.pathLength(endCell) <= pathLength);
                } else if (currentPathNode.cell == endCell) {
                    currentPathNode.paths = [];
                }

                PathFinder.nextPathNode(currentPathNode, availableCells, pathNodes);
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

        if (this.grid.isAvailableCell(cell)) {
            let pathNodes: IPathNode[] = [];
            let availableCells: Set<Cell> = new Set<Cell>(
                this.grid.getAvailableCells().filter((c) => !this.isVisitedCell(c) && cell !== c));
            let store = Array.from(availableCells).reduce((store, cur) => {
                this.defineStrategiesOrder(cur);
                store.set(cur, {cell: cur, paths: this.getAvailablePaths(cur, availableCells)});
                return store;
            }, new Map<Cell, IPathNode>());
            store.set(cell, {cell, paths: this.getAvailablePaths(cell, availableCells)});

            pathNodes.push({cell});

            let minLength = Math.floor(availableCells.size * 0.90);
            let maxIteration = availableCells.size * 4;

            let iteration = 0;
            do {
                let currentPathNode = pathNodes[pathNodes.length - 1];

                if (!currentPathNode.paths) {
                    currentPathNode.paths = store
                        .get(currentPathNode.cell).paths
                        .filter(p => availableCells.has(p.cell));
                }

                if (currentPathNode.paths.length === 0 && pathNodes.length >= result.length) {
                    result = pathNodes.map(node => ({
                        cell: node.cell,
                        direction: node.direction
                    }));
                }

                PathFinder.nextPathNode(currentPathNode, availableCells, pathNodes);

                iteration++;
            }
            while (pathNodes.length > 0 && pathNodes[pathNodes.length - 1].cell !== cell && result.length < minLength && iteration < maxIteration);

            if (pathNodes.length > result.length) {
                result = pathNodes.map(node => ({
                    cell: node.cell,
                    direction: node.direction
                }));
            }
            store.clear();
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
        if (position.x < (this.grid.width / 2) && position.y < (this.grid.height / 2)) {
            this._directionStrategies = MOVE_STRATEGIES_NW;
        } else if (position.x >= (this.grid.width / 2) && position.y < (this.grid.height / 2)) {
            this._directionStrategies = MOVE_STRATEGIES_NE;
        } else if (position.x < (this.grid.width / 2) && position.y >= (this.grid.height / 2)) {
            this._directionStrategies = MOVE_STRATEGIES_SW;
        } else {
            this._directionStrategies = MOVE_STRATEGIES_SE;
        }
    }

    private getAvailablePaths(position: Cell, availableCells: Set<Cell>): IPath[] {
        return this.getMoveStrategies(position)
            .filter(strategy => availableCells.has(strategy.cell));
    }
}
