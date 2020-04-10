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

export enum PriorityEnum {
    TORPEDO_0 = 0,
    MOVE = 1,
    SURFACE = 1,
    TORPEDO_1 = 2,
    MINE = 2,
    SILENCE = 3,
    TRIGGER = 4,
    SONAR = 5,
    MSG = 6
}

export interface IAction {
    priority: PriorityEnum,
    order: string
}

export class OurSubmarine extends Submarine {
    private _path: IPathNode[];
    private _turnCounter = 0;
    private _sonar: ISonar = {
        result: SonarResultEnum.NONE
    };
    private _mines: Cell[] = [];
    private _previousAttacks: Array<{ priority: PriorityEnum, order: OrderEnum, cell: ICoordinate }> = [];
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

    private static sendMessage(message: string): IAction {
        return {
            priority: PriorityEnum.MSG,
            order: `${OrderEnum.MSG} ${message}`
        };
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
                    if (this._positionsStats.cells.has(this.grid.getCellFromCoordinate(this._previousAttacks[0].cell))) {
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
        return [...this.getMoveActions(), ...tmp].filter(a => !!a);
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

        const torpedoAttack = this._previousAttacks.find(p => p.order === OrderEnum.TORPEDO);

        if (this._path.length === 0 || !this._path[0].direction) {
            this._pathFinder.clearVisitedCell();
            result.push({priority: PriorityEnum.SURFACE, order: OrderEnum.SURFACE});
            this._path = this._pathFinder.searchLongestPath(this.position);
        } else {
            const power = this.nextPower(!!torpedoAttack);
            let direction = this._path.shift().direction;
            result.push({priority: PriorityEnum.MOVE, order: `${OrderEnum.MOVE} ${direction}${power ? ' ' + power : ''}`});
            if (this._path.length > 5 && this.cooldown.silence === 0 && (this.lost > 0 || torpedoAttack)) {
                result.push(this.silenceMove());
            }
        }
        return result
    }

    private silenceMove(): IAction {
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
        return ({priority: PriorityEnum.SILENCE, order: `${OrderEnum.SILENCE} ${direction} ${length}`});
    }

    private getOtherActions(): IAction[] {
        this._previousAttacks = [];
        this._opponentPosition = undefined;
        let result: IAction[] = [];
        this._positionsStats = this.opponentSubmarine.pathResover.getPositionsStats();
        log({
            cells: this._positionsStats.cells.size < 10 && this._positionsStats.cells.size > 0
                ? Array.from(this._positionsStats.cells.keys()).map(pos => pos.coordinate)
                : this._positionsStats.cells.size,
            numberOfMoves: this._positionsStats.numberOfMoves,
            starts: this._positionsStats.starts.length,
            surfaceStats: Array.from(this._positionsStats.surfaceStats.entries()).map(entry => `${entry[0]}(${entry[1].length})`)
        });
        if (this._positionsStats.cells.size > 1 && this._positionsStats.cells.size <= 10) {
            const {min, max} = Cell.getMinMax(...Array.from(this._positionsStats.cells.keys()));
            if (((max.x - min.x) <= 3) && ((max.y - min.y) <= 3)) {
                log(`deduce position: between {x: ${min.x} to ${max.x}, y: ${min.y} to ${max.y}}`);
                this._opponentPosition = this.grid.getCellFromCoordinate({
                    x: Math.floor((min.x + max.x) / 2),
                    y: Math.floor((min.y + max.y) / 2)
                });
            }
        } else if (this._positionsStats.cells.size === 1) {
            this._opponentPosition = this._positionsStats.cells[0];
        } else {
            this._opponentPosition = undefined;
        }

        const nextPosition = this._path.length > 1 ? this._path[1].cell : this._position;

        if (this._opponentPosition) {
            result.push(OurSubmarine.sendMessage(`P: (${this._opponentPosition.x},${this._opponentPosition.y})`));

            log({opponentPosition: this._opponentPosition.coordinate});
            let opponentCell = this.grid.getCellFromCoordinate(this._opponentPosition);
            if (this.cooldown.torpedo === 0 && this._path.length > 1 && (this.position.pathLength(opponentCell) <= 5 || nextPosition.pathLength(opponentCell) <= 5)) {
                result.push(this.sendTorpedo(opponentCell, nextPosition));
            }
        } else {
            result.push(OurSubmarine.sendMessage(`SEARCH: P:${this._positionsStats.cells.size} / M:${this._positionsStats.numberOfMoves} / S:${this._positionsStats.surfaceStats.size}`));

            if (this.cooldown.sonar === 0) {
                result.push(this.useSonar());
            }
            /*
            else if (this.cooldown.torpedo === 0
                && this._positionsStats.surfaceStats.has(this.position.surface)) {
                result.push(this.sendTorpedoAsSonar(nextPosition));
            } */
        }

        if (this._mines.length > 0) {
            result.push(this.triggerMine(nextPosition));
        }

        if (this.cooldown.mine === 0) {
            result.push(this.dropMine(nextPosition));
        }
        return result.filter(a => !!a);
    }

    private dropMine(nextPosition: Cell): IAction {
        let result: IAction;
        let mineStrategies = this._pathFinder.getMoveStrategies(nextPosition)
            .filter(moveStrategy => this.grid.isAvailableCell(moveStrategy.cell));
        if (mineStrategies.length > 0) {
            if (this._opponentPosition) {
                mineStrategies = mineStrategies
                    .map(mineStrategy => ({
                        ...mineStrategy,
                        score: mineStrategy.cell.distance(this._opponentPosition)
                    }))
                    .filter(ms => this._mines.every(mine => mine.distance(ms.cell) > 2))
                    .sort((a, b) => b.score - a.score)
            }
            if (mineStrategies.length > 0) {
                const mineStrategie = mineStrategies[0];
                log({
                    mine: {
                        direction: mineStrategie.direction,
                        cell: mineStrategie.cell.coordinate,
                        nextPosition: nextPosition.coordinate,
                        move: mineStrategie.move
                    }
                });
                result = ({priority: PriorityEnum.MINE, order: `${OrderEnum.MINE} ${mineStrategie.direction}`});
                this._mines.push(mineStrategie.cell);
            }
        }
        return result;
    }

    private triggerMine(nextPosition: Cell): IAction | undefined {
        let result: IAction;
        log({mines: this._mines.map(m => m.coordinate)});
        const dangerArea = new Set([...this.grid.getDangerArea(this.position), ...this.grid.getDangerArea(nextPosition)]);
        let targetedMines = this._mines
            .map(mine => {
                const mineDangerArea = this.grid.getDangerArea(mine);
                const cells = Array.from(this._positionsStats.cells.keys()).filter(c => mineDangerArea.includes(c));
                return ({cells, mine})
            })
            .filter(m => m.cells.length > 1)
            .filter(m => !dangerArea.has(m.mine))
            .map(m => m.mine);

        if (targetedMines.length > 0) {
            const mine = targetedMines[0];
            this._mines = this._mines.filter(m => m !== mine);
            this._previousAttacks.push({priority: PriorityEnum.TRIGGER, order: OrderEnum.MINE, cell: mine});
            result = ({priority: PriorityEnum.TRIGGER, order: `${OrderEnum.TRIGGER} ${mine.x} ${mine.y}`});
        }

        return result;
    }

    private useSonar(): IAction {
        let result: IAction;
        this._sonar.surface = undefined;
        if (this._positionsStats.cells.size > 10 && this._positionsStats.surfaceStats.size > 3) {
            const surfaces = Array.from(this._positionsStats.surfaceStats.entries())
                .sort((a, b) => b[1].length - a[1].length);
            if (surfaces.length > 1) {
                this._sonar.surface = surfaces[0][0];
            }
        } else if (this._positionsStats.cells.size === 0) {
            this._sonar.surface = Math.floor(Math.random() * 8) + 1;
        }

        if (this._sonar.surface) {
            result = ({priority: PriorityEnum.SONAR, order: `${OrderEnum.SONAR} ${this._sonar.surface}`})
        }
        return result;
    }

    private sendTorpedoAsSonar(nextPosition: Cell): IAction {
        const cells = this._positionsStats.surfaceStats.get(this.position.surface);
        const {min, max} = Cell.getMinMax(...cells);
        const targetCell = this.grid.getCellFromCoordinate({
            x: Math.floor((min.x + max.x) / 2),
            y: Math.floor((min.y + max.y) / 2)
        });
        return this.sendTorpedo(targetCell, nextPosition);
    }

    private sendTorpedo(targetCell: Cell, nextPosition: Cell): IAction | undefined {
        let result: IAction;
        let torpedoAreaBeforeMove = this.grid.getTorpedoAreaWithoutDangerArea(this.position);
        let torpedoAreaAfterMove = this.grid.getTorpedoAreaWithoutDangerArea(nextPosition);
        let dangerOpponentArea = this.grid.getDangerArea(targetCell);
        let torpedoInfo: { cell: Cell, priority: number };
        if (torpedoAreaBeforeMove.includes(targetCell)) {
            torpedoInfo = {cell: targetCell, priority: PriorityEnum.TORPEDO_0};
        } else if (torpedoAreaAfterMove.includes(targetCell)) {
            torpedoInfo = {cell: targetCell, priority: PriorityEnum.TORPEDO_1};
        } else if (dangerOpponentArea.some(p => torpedoAreaBeforeMove.includes(p))) {
            const target = dangerOpponentArea.filter(p => torpedoAreaBeforeMove.includes(p));
            torpedoInfo = {cell: target[0], priority: PriorityEnum.TORPEDO_0};
        } else if (dangerOpponentArea.some(p => torpedoAreaAfterMove.includes(p))) {
            const target = dangerOpponentArea.filter(p => torpedoAreaAfterMove.includes(p));
            torpedoInfo = {cell: target[0], priority: PriorityEnum.TORPEDO_1};
        }

        if (torpedoInfo) {
            this._previousAttacks.push({
                priority: torpedoInfo.priority,
                order: OrderEnum.TORPEDO,
                cell: torpedoInfo.cell
            });
            result = ({
                priority: torpedoInfo.priority,
                order: `${OrderEnum.TORPEDO} ${torpedoInfo.cell.x} ${torpedoInfo.cell.y}`
            });
        }
        return result;
    }

    private nextPower(hasTorpedoAttack: boolean): OrderEnum {
        if (this.cooldown.torpedo > 0 || hasTorpedoAttack) {
            return OrderEnum.TORPEDO;
        } else if (this.cooldown.sonar > 0 && this.turn % 10 === 0) {
            return OrderEnum.SONAR;
        } else if (this.cooldown.silence > 0 && this.turn % 2 === 0) {
            return OrderEnum.SILENCE;
        } else { //  if ((this.cooldown.mine) > 0 && this.opponentPosition) {
            return OrderEnum.MINE;
        }
    }
}
