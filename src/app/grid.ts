
export interface IMoveStrategy {
    move: IPosition;
    direction: DirectionEnum
}

const MOVE_STRATEGIES: IMoveStrategy[] = [
    {move: {x: 0, y: -1}, direction: DirectionEnum.NORTH},
    {move: {x: 1, y: 0}, direction: DirectionEnum.EST},
    {move: {x: 0, y: 1}, direction: DirectionEnum.SOUTH},
    {move: {x: -1, y: 0}, direction: DirectionEnum.WEST}
];

export interface IPath {
    index: number;
    position: IPosition;
    direction: DirectionEnum
}

export interface IPathNode {
    index: number;
    position: IPosition;
    direction?: DirectionEnum
    paths?: IPath[];
}

export class Grid {
    private visitedCells: number[] = [];

    constructor(private width: number, private height: number, private grid: string[]) {
    }

    public set currentCell(position: IPosition) {
        this.visitedCells.push(this.getGridIndex(position));
    }

    public static sumCells(a: IPosition, b: IPosition): IPosition {
        return {x: a.x + b.x, y: a.y + b.y};
    }

    public static getSurfacePositionCenter(surface: number): IPosition {
        const position: IPosition = {x: (surface - 1) % 3, y: Math.ceil(surface / 3) - 1};
        return {x: 2 + 5 * (position.x), y: 2 + 5 * (position.y)};
    }

    public static getSurface(position: IPosition): number {
        const surfacePosition: IPosition = {x: Math.floor(position.x / 5), y: Math.floor(position.y / 5)};
        const index = surfacePosition.x + surfacePosition.y * 3;
        return index + 1;
    }

    public static areCellsEquals(a: IPosition, b: IPosition): boolean {
        return a.x === b.x && a.y === b.y;
    }

    public clearVisitedCells() {
        this.visitedCells = [];
    }

    public searchStartPosition(): IPosition {
        return this.getPosition(0);
    }

    public searchLongestWay(index: number): IPathNode[] {
        let result: IPathNode[] = [];

        let availablePositions = this.grid
            .map((value, index) => ({value, index}))
            .filter(({value, index}) => value === CellTypeEnum.SEA && !this.visitedCells.includes(index))
            .map(({value, index}) => index);

        let path: IPathNode[] = [];
        path.push({index, position: this.getPosition(index)});

        do {
            let currentPathNode = path[path.length - 1];

            if (currentPathNode.paths == null) {
                currentPathNode.paths = MOVE_STRATEGIES
                    .map(strategy => {
                        const position = Grid.sumCells(currentPathNode.position, strategy.move);
                        return {index: this.getGridIndex(position), position, direction: strategy.direction}
                    })
                    .filter(strategy => this.isValidCell(strategy.position) && this.grid[strategy.index] === CellTypeEnum.SEA && availablePositions.includes(strategy.index));
            }

            if (currentPathNode.paths.length > 0) {
                const newPath = currentPathNode.paths.pop();
                availablePositions = availablePositions.filter(i => i !== newPath.index);
                currentPathNode.direction = newPath.direction;
                path.push({index: newPath.index, position: newPath.position});
            } else {
                if (path.length > result.length) {
                    result = path.map(node => ({
                        index: node.index,
                        position: node.position,
                        direction: node.direction
                    }));
                }
                availablePositions.push(path.pop().index);
            }
        }
        while (path.length > 0 && result.length < 25);

        return result;
    }

    public getGridIndex({x, y}: IPosition): number {
        return y * this.width + x;
    }

    public getDistance(a: IPosition, b: IPosition): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    public isSeaCell(position: IPosition): boolean {
        let result = false;
        if (this.isValidCell(position)) {
            const index = this.getGridIndex(position);
            result = this.grid[index] === CellTypeEnum.SEA;
        }
        return result;
    }

    public isAvailableCell(index: number): boolean {
        let result = false;
        if (this.isValidCellFromIndex(index)) {
            result = this.grid[index] === CellTypeEnum.SEA && !this.visitedCells.includes(index)
        }
        return result;
    }

    public getSeaCells(): IPosition[] {
        return this.grid
            .map((_v, i) => this.getPosition(i))
            .filter(p => this.isSeaCell(p));
    }

    public isValidCell({x, y}: IPosition): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    public isValidCellFromIndex(index: number): boolean {
        return index >= 0 && index < this.grid.length;
    }

    public runAway({x, y}: IPosition): IPosition {
        return {x: Math.abs(x - this.width), y: Math.abs(y - this.height)}
    }

    private getPosition(index: number): IPosition {
        return {x: (index) % this.width, y: Math.floor(index / this.width)}
    }
}