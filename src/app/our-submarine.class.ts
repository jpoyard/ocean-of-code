import {Grid} from "./grid.class";
import {MOVE_STRATEGIES, OrderEnum, Submarine} from "./submarine.class";
import {Cell, CellTypeEnum} from "./cell.class";
import {OpponentSubmarine} from "./opponent-submarine.class";
import {ICoordinate} from "./position.class";

export interface ICooldown {
    torpedo: number;
    sonar: number;
    silence: number;
    mine: number;
}

export interface IPath {
    cell: Cell;
    direction: DirectionEnum
}

export interface IPathNode {
    cell: Cell;
    direction?: DirectionEnum
    paths?: IPath[];
}

export enum SonarResultEnum {
    YES = 'Y',
    NO = 'N',
    NONE = 'NA'
}

export interface ISonar {
    surface?: number,
    result: SonarResultEnum
}

export class OurSubmarine extends Submarine {
    private _path: IPathNode[];
    private _turnCounter = 0;
    private _sonar: ISonar = {
        result: SonarResultEnum.NONE
    };
    private _mines: Cell[] = [];

    constructor(id: number, grid: Grid, public opponentSubmarine: OpponentSubmarine) {
        super(id, grid);
        this._visitedCells = new Map<number, Cell>()
    }

    public set sonarResult(value: string) {
        this._sonar.result = value as SonarResultEnum;
        switch (this._sonar.result) {
            case SonarResultEnum.YES:
                this.opponentSubmarine.keepOnlyPositionsInSurface(this._sonar.surface);
                break;
            case SonarResultEnum.NO:
                this.opponentSubmarine.excludePositionsInSurface(this._sonar.surface);
                break;
            case SonarResultEnum.NONE:
                break;
        }
    }

    private _cooldown: ICooldown = {
        torpedo: -1,
        sonar: -1,
        mine: -1,
        silence: -1,
    };

    public get cooldown(): ICooldown {
        return {...this._cooldown}
    }

    private _position: Cell;

    public get position(): Cell {
        return this._position;
    }

    public get turn(): number {
        return this._turnCounter;
    }

    private _visitedCells: Map<number, Cell>;

    public get visitedCells(): Cell[] {
        return Array.from(this._visitedCells.values());
    }

    public getActions(): string[] {
        const tmp = this.getOtherActions();
        return [...this.getMoveActions(), ...tmp];
    }

    public setPosition(x: number, y: number) {
        this._position = this.grid.getCell(this.grid.getIndex({x, y}));
        this.addVisitedCell(this._position);
        this._turnCounter++;
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
        let availableStartCells = this.grid.cells
            .filter((cell) => this.isAvailableStartCell(cell));
        const result = availableStartCells
            .map(position => ({position, path: this.searchLongestPath(position)}))
            .sort((a, b) => b.path.length - a.path.length)[0];
        this._path = result.path;
        return result;
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

                if (currentPathNode.paths == null && !currentPathNode.cell.equals(endCell)) {
                    currentPathNode.paths = this.initializePath(currentPathNode, availableCells)
                } else if (currentPathNode.cell.equals(endCell)) {
                    currentPathNode.paths = [];
                }

                if (currentPathNode.paths.length > 0) {
                    const newPath = currentPathNode.paths.pop();
                    availableCells.delete(newPath.cell.index);
                    currentPathNode.direction = newPath.direction;
                    pathNodes.push({cell: newPath.cell});
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
            let minLength = Math.floor(availableCells.size / 2);
            let maxIteration = availableCells.size * 4;

            let iteration = 0;
            do {
                let currentPathNode = pathNodes[pathNodes.length - 1];

                if (currentPathNode.paths == null) {
                    currentPathNode.paths = this.initializePath(currentPathNode, availableCells)
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
                iteration++;
            }
            while (pathNodes.length > 0 && result.length <= minLength && iteration <= maxIteration);
        }
        return result;
    }

    public setCooldown(torpedo: number, sonar: number, mine: number, silence: number) {
        this._cooldown = {torpedo, sonar, mine, silence};
    }

    private initializePath(currentPathNode: IPathNode, availableCells: Map<number, Cell>) {
        return MOVE_STRATEGIES
            .map(strategy => ({
                index: this.grid.getIndex(currentPathNode.cell.sum(strategy.move)),
                direction: strategy.direction
            }))
            .filter(strategy => this.grid.isIndexValid(strategy.index) && availableCells.has(strategy.index))
            .map(strategy => ({cell: this.grid.getCell(strategy.index), direction: strategy.direction}))
            .filter(strategy => strategy.cell.type === CellTypeEnum.SEA);
    }

    private getMoveActions(): string[] {
        let result: string[] = [];

        if (this._path.length === 0 || !this._path[0].direction) {
            this._path = this.searchLongestPath(this.position);
        }

        if (this._path.length === 0 || !this._path[0].direction) {
            this.clearVisitedCell();
            result.push(OrderEnum.SURFACE);
        } else if (this.cooldown.silence === 0) {
            let length = 1;
            let direction = this._path.shift().direction;
            while (this._path.length > 0 && direction === this._path[0].direction && length < 4) {
                this.addVisitedCell(this._path.shift().cell);
                length++;
            }
            result.push(`${OrderEnum.SILENCE} ${direction} ${length}`);
        } else {
            const power = this.nextPower();
            let direction = this._path.shift().direction;
            result.push(`${OrderEnum.MOVE} ${direction}${power ? ' ' + power : ''}`);
        }
        return result
    }

    private getOtherActions(): string[] {
        let result: string[] = [];
        const possiblePositions = this.opponentSubmarine.getPossiblePositions();
        log({positions: possiblePositions.length < 10 && possiblePositions.length > 0 ? possiblePositions.map(pos => pos.coordinate) : possiblePositions.length});
        let opponentPosition: ICoordinate;
        if (possiblePositions.length > 1) {
            const {min, max} = possiblePositions.reduce<{ min?: ICoordinate, max?: ICoordinate }>(
                (acc, cur) => {
                    acc.min = acc.min ? {
                        x: Math.min(acc.min.x, cur.coordinate.x),
                        y: Math.min(acc.min.y, cur.coordinate.y)
                    } : cur.coordinate;
                    acc.max = acc.max ? {
                        x: Math.max(acc.min.x, cur.coordinate.x),
                        y: Math.max(acc.min.y, cur.coordinate.y)
                    } : cur.coordinate;
                    return acc;
                }, {}
            );
            if ((max.x - min.x < 4) && (max.y - min.y < 4)) {
                opponentPosition = {x: Math.floor((min.x + max.x) / 2), y: Math.floor((min.y + max.y) / 2)}
            }
        } else if (possiblePositions.length === 1) {
            opponentPosition = possiblePositions[0].coordinate;
            const path: IPathNode[] = (this.cooldown.torpedo === 0)
                ? this.searchShortestPath(this.position, this.grid.getCell(this.grid.getIndex(opponentPosition)))
                : this.searchLongestPath(this.position);
            if (path.length > 0) {
                this._path = path;
            }
        }

        const nextPosition = this._path.length > 1 ? this._path[1].cell : this._position;

        if (opponentPosition) {
            result.push(`${OrderEnum.MSG} LOOKOUT_${opponentPosition.x}_${opponentPosition.y}`);
            log({opponentPosition});
            if (this.cooldown.torpedo === 0 && nextPosition.distance(opponentPosition) > 1 && nextPosition.pathLength(opponentPosition) <= 4) {
                // TODO: Check ISLAND
                result.push(`${OrderEnum.TORPEDO} ${opponentPosition.x} ${opponentPosition.y}`);
            }
            if (this._mines.length > 0) {
                log({mines: this._mines.map(m => m.coordinate)});
                let nearMines = this._mines.filter(m => m.distance(opponentPosition) <= 1);
                if (nearMines.length > 0) {
                    const mine = nearMines[0];
                    this._mines = this._mines.filter(m => m.index !== mine.index);
                    result.push(`${OrderEnum.TRIGGER} ${mine.x} ${mine.y}`);
                }
            }
        } else {
            result.push(`${OrderEnum.MSG} HUNTING_${possiblePositions.length}`);
        }

        if ((this.cooldown.sonar === 0) && (possiblePositions.length > 5)) {
            this._sonar.surface = undefined;
            if (possiblePositions.length > 10) {
                const surfaces = Array.from((possiblePositions
                    .reduce((acc, cur) => {
                        const curSurface = cur.surface;
                        const counter = (acc.get(curSurface) || 0) + 1;
                        return acc.set(curSurface, counter);
                    }, new Map<number, number>())).entries())
                    .sort((a, b) => b[1] - a[1]);
                if (surfaces.length > 1) {
                    this._sonar.surface = surfaces[0][0];
                }
            } else if (possiblePositions.length === 0) {
                this._sonar.surface = Math.floor(Math.random() * 8) + 1;
            }

            if (this._sonar.surface) {
                result.push(`${OrderEnum.SONAR} ${this._sonar.surface}`)
            }
        }
        if (this.cooldown.mine === 0) {
            let mineStrategies = MOVE_STRATEGIES
                .map(moveStrategy => ({
                    ...moveStrategy,
                    index: this.grid.getIndex(nextPosition.sum(moveStrategy.move))
                }))
                .filter(moveStrategy => this.grid.isIndexValid(moveStrategy.index))
                .map(moveStrategy => ({...moveStrategy, cell: this.grid.getCell(moveStrategy.index)}))
                .filter(moveStrategy => this.grid.isAvailableCell(moveStrategy.cell));
            if (mineStrategies.length > 0) {
                if (opponentPosition) {
                    mineStrategies = mineStrategies
                        .map(mineStrategy => ({...mineStrategy, score: mineStrategy.cell.distance(opponentPosition)}))
                        .sort((a, b) => b.score - a.score)
                }
                const mineStrategie = mineStrategies[0];
                log({
                    mine: {
                        direction: mineStrategie.direction,
                        cell: mineStrategie.cell.coordinate,
                        nextPosition: nextPosition.coordinate,
                        move: mineStrategie.move
                    }
                });
                result.push(`${OrderEnum.MINE} ${mineStrategie.direction}`);
                this._mines.push(mineStrategie.cell);
            }
        }
        return result
    }

    private isAvailableStartCell(cell: Cell) {
        return cell.type === CellTypeEnum.SEA &&
            (((cell.x === 0 || cell.x === this.grid.width - 1) &&
                (cell.y === 0 || cell.y === this.grid.height - 1)) || cell.equals(this.grid.middle));
    }

    private nextPower(): OrderEnum {
        if (this.cooldown.torpedo > 0) {
            return OrderEnum.TORPEDO;
        } else if (this.cooldown.sonar > 0 && (this.turn % 3 > 0)) {
            return OrderEnum.SONAR;
        } else if (this.cooldown.silence > 0 && (this.turn % 3 === 0)) {
            return OrderEnum.SILENCE;
        } else {
            return OrderEnum.MINE;
        }
    }
}