import {Grid} from "./grid.class";
import {Cell} from "./cell.class";
import {OpponentSubmarine} from "./opponent-submarine.class";
import {ICoordinate} from "./position.class";
import {OrderEnum, Submarine} from "./submarine.class";
import {DirectionEnum, PathFinder} from "./path-finder.class";

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

export interface IAction {
    priority: number,
    order: string
}

export class OurSubmarine extends Submarine {
    private _path: IPathNode[];
    private _turnCounter = 0;
    private _sonar: ISonar = {
        result: SonarResultEnum.NONE
    };
    private _mines: Cell[] = [];
    private _isPreviousAttacks: Array<{ order: OrderEnum, cell: ICoordinate }> = [];
    private _pathFinder: PathFinder;
    private _possiblePositions: Cell[];

    constructor(id: number, grid: Grid, public opponentSubmarine: OpponentSubmarine) {
        super(id, grid);
        this._pathFinder = new PathFinder(grid);
    }

    private _opponentPosition: Cell;

    public get opponentPosition(): Cell {
        return this._opponentPosition
    }

    public set sonarResult(value: string) {
        this._sonar.result = value as SonarResultEnum;
        switch (this._sonar.result) {
            case SonarResultEnum.YES:
                this.opponentSubmarine.pathResover.keepOnlyPositionsInSurface(this._sonar.surface);
                break;
            case SonarResultEnum.NO:
                this.opponentSubmarine.pathResover.excludePositionsInSurface(this._sonar.surface);
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

    public updateOpponentPosition() {
        if (this._isPreviousAttacks.length === 1
            && (this._isPreviousAttacks[0].order === OrderEnum.MINE
                || (this._isPreviousAttacks[0].order === OrderEnum.TORPEDO && this.cooldown.torpedo > 0))) {
            const cellNexts = this.grid.getCellNext(this._isPreviousAttacks[0].cell).filter(c => this._possiblePositions.includes(c));
            switch (this.opponentSubmarine.lost) {
                case 0:
                    log('Miss, should exclude positions', cellNexts.map(c => c.coordinate));
                    this.opponentSubmarine.pathResover.excludePositions(cellNexts);
                    break;
                case 1:
                    log(`Hit! should exclude only target position ${this._isPreviousAttacks[0].cell}, but keep next positions`, cellNexts.map(c => c.coordinate));
                    this.opponentSubmarine.pathResover.excludePositions([this._isPreviousAttacks[0].cell]);
                    this.opponentSubmarine.pathResover.keepOnlyPositions(cellNexts);
                    break;
                case 2:
                    log('Hit hard! position is validated');
                    this.opponentSubmarine.pathResover.keepOnlyPositions([(this._isPreviousAttacks[0].cell)]);
                    break;
                default:

                    break;
            }
        }
    }

    public getActions(): IAction[] {
        const tmp = this.getOtherActions();
        return [...this.getMoveActions(), ...tmp];
    }

    public setPosition(x: number, y: number) {
        this._position = this.grid.getCell(this.grid.getIndex({x, y}));
        this._pathFinder.addVisitedCell(this._position);
        this._turnCounter++;
    }

    public setCooldown(torpedo: number, sonar: number, mine: number, silence: number) {
        this._cooldown = {torpedo, sonar, mine, silence};
    }

    public searchStartCell(): Cell {
        const result = this._pathFinder.searchStartCell();
        this._path = result.path;
        return result.position;
    }

    private getMoveActions(): IAction[] {
        let result: IAction[] = [];

        if (this._path.length === 0 || !this._path[0].direction) {
            this._path = this._pathFinder.searchLongestPath(this.position);
        }

        if (this._path.length === 0 || !this._path[0].direction) {
            this._pathFinder.clearVisitedCell();
            result.push({priority: 1, order: OrderEnum.SURFACE});
        } else if (this.cooldown.silence === 0) {
            let direction = DirectionEnum.WEST;
            let length = 0;
            if (this._path.length > 4) {
                length = 1;
                direction = this._path.shift().direction;
                while (this._path.length > 0 && direction === this._path[0].direction && length < 4) {
                    this._pathFinder.addVisitedCell(this._path.shift().cell);
                    length++;
                }
            }
            result.push({priority: 1, order: `${OrderEnum.SILENCE} ${direction} ${length}`});
        } else {
            const power = this.nextPower();
            let direction = this._path.shift().direction;
            result.push({priority: 1, order: `${OrderEnum.MOVE} ${direction}${power ? ' ' + power : ''}`});
        }
        return result
    }

    private getOtherActions(): IAction[] {
        this._isPreviousAttacks = [];
        this._opponentPosition = undefined;
        let result: IAction[] = [];
        this._possiblePositions = this.opponentSubmarine.pathResover.getPossiblePositions();
        log({
            positions: this._possiblePositions.length < 10 && this._possiblePositions.length > 0
                ? this._possiblePositions.map(pos => pos.coordinate) : this._possiblePositions.length
        });
        if (this._possiblePositions.length > 1 && this._possiblePositions.length < 5) {
            const {min, max} = this._possiblePositions.reduce<{ min?: ICoordinate, max?: ICoordinate }>(
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
            if (((max.x - min.x) <= 2) && ((max.y - min.y) <= 2)) {
                this._opponentPosition = this.grid.getCellFromCoordinate({
                    x: Math.floor((min.x + max.x) / 2),
                    y: Math.floor((min.y + max.y) / 2)
                });
            }
        } else if (this._possiblePositions.length === 1) {
            this._opponentPosition = this._possiblePositions[0];
        }

        if (this.opponentPosition) {
            // const target = (this.cooldown.torpedo === 0)
            //     ? this.grid.getCell(this.grid.getIndex(this.opponentPosition))
            //     : this.grid.getCell(this.grid.getIndex(this.grid.getOppositeCoordinate(this.opponentPosition)));
            // const path = this.searchShortestPath(this.position, target);
            // if (path.length > 0) {
            //     this._path = path;
            // }
            result.push({
                priority: 3,
                order: `${OrderEnum.MSG} LOOKOUT: (${this.opponentPosition.x},${this.opponentPosition.y})`
            });
        }

        const nextPosition = this._path.length > 1 ? this._path[1].cell : this._position;

        if (this.opponentPosition) {
            log({opponentPosition: this.opponentPosition});
            let opponentCell = this.grid.getCellFromCoordinate(this.opponentPosition);
            if (this.cooldown.torpedo === 0 && (this.position.pathLength(opponentCell) <= 5 || nextPosition.pathLength(opponentCell) <= 5)) {
                let pathBeforeMove = this._pathFinder.searchShortestPath(this.position, opponentCell);
                let pathAfterMove = this._pathFinder.searchShortestPath(nextPosition, opponentCell);
                let torpedoInfo: { cell: Cell, priority: number };
                if (pathBeforeMove.length <= 4) {
                    torpedoInfo = {cell: opponentCell, priority: 0};
                } else if (pathAfterMove.length <= 4) {
                    torpedoInfo = {cell: opponentCell, priority: 2};
                } else if (pathBeforeMove.length === 5) {
                    torpedoInfo = {cell: pathBeforeMove.pop().cell, priority: 0};
                } else if (pathAfterMove.length === 5) {
                    torpedoInfo = {cell: pathAfterMove.pop().cell, priority: 2};
                }

                if (torpedoInfo) {
                    this._isPreviousAttacks.push({order: OrderEnum.TORPEDO, cell: torpedoInfo.cell});
                    result.push({
                        priority: torpedoInfo.priority,
                        order: `${OrderEnum.TORPEDO} ${torpedoInfo.cell.x} ${torpedoInfo.cell.y}`
                    });
                }

            }
            if (this._mines.length > 0) {
                log({mines: this._mines.map(m => m.coordinate)});
                let nearMines = this._mines.filter(m => m.distance(this.opponentPosition) <= 1);
                if (nearMines.length > 0) {
                    const mine = nearMines[0];
                    this._mines = this._mines.filter(m => m.index !== mine.index);
                    this._isPreviousAttacks.push({order: OrderEnum.TORPEDO, cell: mine});
                    result.push({priority: 2, order: `${OrderEnum.TRIGGER} ${mine.x} ${mine.y}`});
                }
            }
        } else {
            result.push({priority: 3, order: `${OrderEnum.MSG} HUNTING: ${this._possiblePositions.length}`});
        }

        if ((this.cooldown.sonar === 0) && (this._possiblePositions.length > 5)) {
            this._sonar.surface = undefined;
            if (this._possiblePositions.length > 10) {
                const surfaces = Array.from((this._possiblePositions
                    .reduce((acc, cur) => {
                        const curSurface = cur.surface;
                        const counter = (acc.get(curSurface) || 0) + 1;
                        return acc.set(curSurface, counter);
                    }, new Map<number, number>())).entries())
                    .sort((a, b) => b[1] - a[1]);
                if (surfaces.length > 1) {
                    this._sonar.surface = surfaces[0][0];
                }
            } else if (this._possiblePositions.length === 0) {
                this._sonar.surface = Math.floor(Math.random() * 8) + 1;
            }

            if (this._sonar.surface) {
                result.push({priority: 2, order: `${OrderEnum.SONAR} ${this._sonar.surface}`})
            }
        }
        if (this.cooldown.mine === 0) {
            let mineStrategies = this._pathFinder.getMoveStrategies(nextPosition)
                .map(moveStrategy => ({...moveStrategy, cell: this.grid.getCell(moveStrategy.index)}))
                .filter(moveStrategy => this.grid.isAvailableCell(moveStrategy.cell));
            if (mineStrategies.length > 0) {
                if (this.opponentPosition) {
                    mineStrategies = mineStrategies
                        .map(mineStrategy => ({
                            ...mineStrategy,
                            score: mineStrategy.cell.distance(this.opponentPosition)
                        }))
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
                result.push({priority: 2, order: `${OrderEnum.MINE} ${mineStrategie.direction}`});
                this._mines.push(mineStrategie.cell);
            }
        }
        return result
    }

    private nextPower(): OrderEnum {
        if (this.cooldown.torpedo > 0) {
            return OrderEnum.TORPEDO;
        } else if ((this.cooldown.sonar > 0) && (this.turn % 3 === 1) && !this.opponentPosition) {
            return OrderEnum.SONAR;
        } else if ((this.cooldown.silence > 0) && ((this.turn % 3 === 0)
            || !this.opponentPosition || this.opponentPosition.pathLength(this.position) < 10)) {
            return OrderEnum.SILENCE;
        } else { //  if ((this.cooldown.mine) > 0 && this.opponentPosition) {
            return OrderEnum.MINE;
        }
    }
}
