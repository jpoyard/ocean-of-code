import {Grid} from "./grid.class";
import {Cell} from "./cell.class";
import {OpponentSubmarine} from "./opponent-submarine.class";
import {ICoordinate} from "./position.class";
import {OrderEnum, Submarine} from "./submarine.class";
import {DirectionEnum, PathFinder} from "./path-finder.class";
import {IPositionsStats} from "./path-resolver.class";

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
    private _previousAttacks: Array<{ order: OrderEnum, cell: ICoordinate }> = [];
    private _pathFinder: PathFinder;
    private _positionsStats: IPositionsStats;
    private _opponentPosition: Cell;

    constructor(id: number, grid: Grid, public opponentSubmarine: OpponentSubmarine) {
        super(id, grid);
        this._pathFinder = new PathFinder(grid);
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
        if (this._previousAttacks.length === 1 && this.lost < 2
            && (this._previousAttacks[0].order === OrderEnum.MINE
                || (this._previousAttacks[0].order === OrderEnum.TORPEDO && this.cooldown.torpedo > 0))) {
            const dangerArea = this.grid.getDangerArea(this._previousAttacks[0].cell);
            switch (this.opponentSubmarine.lost) {
                case 0:
                    log('Miss, should exclude positions', dangerArea.map(c => c.coordinate));
                    this.opponentSubmarine.pathResover.excludePositions(dangerArea);
                    break;
                case 1:
                    log(`Hit! should keep only danger area around {x:${this._previousAttacks[0].cell.x}, y:${this._previousAttacks[0].cell.y}}`, dangerArea.map(c => c.coordinate));
                    this.opponentSubmarine.pathResover.excludePosition(this._previousAttacks[0].cell);
                    this.opponentSubmarine.pathResover.keepOnlyPositions(dangerArea);
                    break;
                case 2:
                    if (this._positionsStats.cells.includes(this.grid.getCellFromCoordinate(this._previousAttacks[0].cell))) {
                        log('Hit hard! position is validated');
                        this.opponentSubmarine.pathResover.keepOnlyPosition((this._previousAttacks[0].cell));
                    }
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

        const torpedoAttack = this._previousAttacks.find(p => p.order === OrderEnum.TORPEDO);

        if (this._path.length === 0 || !this._path[0].direction) {
            this._pathFinder.clearVisitedCell();
            result.push({priority: 1, order: OrderEnum.SURFACE});
        } else if (this.cooldown.silence === 0 && (this.lost > 0 || torpedoAttack || this.turn % 20 >= 2)) {
            let checkDistanceFn = torpedoAttack ? (cell) => cell.pathLength(torpedoAttack.cell) <= 4 : () => true;
            let direction = DirectionEnum.WEST;
            let length = 0;
            if (this._path.length > 4) {
                length = 1;
                direction = this._path.shift().direction;
                while (this._path.length > 0 && direction === this._path[0].direction && length < 4 && checkDistanceFn(this._path[0].cell)) {
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
        this._previousAttacks = [];
        let result: IAction[] = [];
        this._positionsStats = this.opponentSubmarine.pathResover.getPositionsStats();
        log({
            cells: this._positionsStats.cells.length < 10 && this._positionsStats.cells.length > 0
                ? this._positionsStats.cells.map(pos => pos.coordinate) : this._positionsStats.cells.length,
            numberOfMoves: this._positionsStats.numberOfMoves,
            starts: this._positionsStats.starts.length,
            surfaceStats: Array.from(this._positionsStats.surfaceStats.entries()).map(entry => `${entry[0]}(${entry[1].length})`)
        });
        if (this._positionsStats.cells.length > 1 && this._positionsStats.cells.length <= 10) {
            const {min, max} = Cell.getMinMax(...this._positionsStats.cells);
            if (((max.x - min.x) <= 3) && ((max.y - min.y) <= 3)) {
                log(`deduce position: between {x: ${min.x} to ${max.x}, y: ${min.y} to ${max.y}}`);
                this._opponentPosition = this.grid.getCellFromCoordinate({
                    x: Math.floor((min.x + max.x) / 2),
                    y: Math.floor((min.y + max.y) / 2)
                });
            }
        } else if (this._positionsStats.cells.length === 1) {
            this._opponentPosition = this._positionsStats.cells[0];
        } else {
            this._opponentPosition = undefined;
        }

        const nextPosition = this._path.length > 1 ? this._path[1].cell : this._position;

        if (this._opponentPosition) {
            result.push({
                priority: 3,
                order: `${OrderEnum.MSG} P: (${this._opponentPosition.x},${this._opponentPosition.y})`
            });

            log({opponentPosition: this._opponentPosition.coordinate});
            let opponentCell = this.grid.getCellFromCoordinate(this._opponentPosition);
            if (this.cooldown.torpedo === 0 && this._path.length > 1 && (this.position.pathLength(opponentCell) <= 5 || nextPosition.pathLength(opponentCell) <= 5)) {
                this.sendTorpedo(opponentCell, nextPosition, result);
            }
            if (this._mines.length > 0) {
                log({mines: this._mines.map(m => m.coordinate)});
                let nearMines = this._mines.filter(m => m.distance(this._opponentPosition) <= 1);
                if (nearMines.length > 0) {
                    const mine = nearMines[0];
                    this._mines = this._mines.filter(m => m.index !== mine.index);
                    this._previousAttacks.push({order: OrderEnum.TORPEDO, cell: mine});
                    result.push({priority: 2, order: `${OrderEnum.TRIGGER} ${mine.x} ${mine.y}`});
                }
            }
        } else {
            result.push({
                priority: 3,
                order: `${OrderEnum.MSG} SEARCH: P:${this._positionsStats.cells.length} / M:${this._positionsStats.numberOfMoves} / S:${this._positionsStats.surfaceStats.size}`
            });

            if ((this.cooldown.sonar === 0) && (this._positionsStats.cells.length > 5)) {
                this._sonar.surface = undefined;
                if (this._positionsStats.cells.length > 10) {
                    const surfaces = Array.from(this._positionsStats.surfaceStats.entries())
                        .sort((a, b) => b[1].length - a[1].length);
                    if (surfaces.length > 1) {
                        this._sonar.surface = surfaces[0][0];
                    }
                } else if (this._positionsStats.cells.length === 0) {
                    this._sonar.surface = Math.floor(Math.random() * 8) + 1;
                }

                if (this._sonar.surface) {
                    result.push({priority: 2, order: `${OrderEnum.SONAR} ${this._sonar.surface}`})
                }
            } else if (this._positionsStats.surfaceStats.has(this.position.surface) && (this.cooldown.silence === 0)) {
                const cells = this._positionsStats.surfaceStats.get(this.position.surface);
                const {min, max} = Cell.getMinMax(...cells);
                const targetCell = this.grid.getCellFromCoordinate({
                    x: Math.floor((min.x + max.x) / 2),
                    y: Math.floor((min.y + max.y) / 2)
                });
                this.sendTorpedo(targetCell, nextPosition, result);
            }
        }

        if (this.cooldown.mine === 0) {
            let mineStrategies = this._pathFinder.getMoveStrategies(nextPosition)
                .map(moveStrategy => ({...moveStrategy, cell: this.grid.getCell(moveStrategy.index)}))
                .filter(moveStrategy => this.grid.isAvailableCell(moveStrategy.cell));
            if (mineStrategies.length > 0) {
                if (this._opponentPosition) {
                    mineStrategies = mineStrategies
                        .map(mineStrategy => ({
                            ...mineStrategy,
                            score: mineStrategy.cell.distance(this._opponentPosition)
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

    private sendTorpedo(targetCell: Cell, nextPosition: Cell, result: IAction[]) {
        let torpedoAreaBeforeMove = this.grid.getTorpedoAreaWithoutDangerArea(this.position);
        let torpedoAreaAfterMove = this.grid.getTorpedoAreaWithoutDangerArea(nextPosition);
        let dangerOpponentArea = this.grid.getDangerArea(targetCell);
        let torpedoInfo: { cell: Cell, priority: number };
        if (torpedoAreaBeforeMove.includes(targetCell)) {
            torpedoInfo = {cell: targetCell, priority: 0};
        } else if (torpedoAreaAfterMove.includes(targetCell)) {
            torpedoInfo = {cell: targetCell, priority: 2};
        } else if (dangerOpponentArea.some(p => torpedoAreaBeforeMove.includes(p))) {
            const target = dangerOpponentArea.filter(p => torpedoAreaBeforeMove.includes(p));
            torpedoInfo = {cell: target[0], priority: 0};
        } else if (dangerOpponentArea.some(p => torpedoAreaAfterMove.includes(p))) {
            const target = dangerOpponentArea.filter(p => torpedoAreaAfterMove.includes(p));
            torpedoInfo = {cell: target[0], priority: 2};
        }

        if (torpedoInfo) {
            this._previousAttacks.push({order: OrderEnum.TORPEDO, cell: torpedoInfo.cell});
            result.push({
                priority: torpedoInfo.priority,
                order: `${OrderEnum.TORPEDO} ${torpedoInfo.cell.x} ${torpedoInfo.cell.y}`
            });
        }
    }

    private nextPower(): OrderEnum {
        if (this.cooldown.torpedo > 0) {
            return OrderEnum.TORPEDO;
        } else if ((this.cooldown.sonar > 0) && (this.turn % 3 === 1) && !this._opponentPosition) {
            return OrderEnum.SONAR;
        } else if ((this.cooldown.silence > 0) && ((this.turn % 3 === 0)
            || !this._opponentPosition || this._opponentPosition.pathLength(this.position) < 10)) {
            return OrderEnum.SILENCE;
        } else { //  if ((this.cooldown.mine) > 0 && this.opponentPosition) {
            return OrderEnum.MINE;
        }
    }
}
