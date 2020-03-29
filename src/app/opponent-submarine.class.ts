import {Grid} from "./grid.class";
import {DirectionEnum, IMoveStrategy, MOVE_STRATEGIES, OrderEnum, Submarine} from "./submarine.class";
import {ICoordinate} from "./position.class";
import {Cell} from "./cell.class";

export interface IMoveOrder {
    direction: DirectionEnum;
}

export interface ISurfaceOrder {
    index: number;
}

export interface ITorpedoOrder {
    coordinate: ICoordinate;
}

export interface ISonarOrder {
    index: number;
}

export interface ISilenceOrder {
}

export interface IMineOrder {
}

export interface ITriggerOrder {
    coordinate: ICoordinate;
}

export interface IOrders {
    move?: IMoveOrder,
    surface?: ISurfaceOrder,
    torpedo?: ITorpedoOrder,
    sonar?: ISonarOrder;
    silence?: ISilenceOrder;
    mine?: IMineOrder;
    trigger?: ITriggerOrder;
}

export interface IOrderParserStrategy {
    order: OrderEnum,
    parse: (order: string) => Partial<IOrders>
}

export const ORDER_PARSER_STRATEGIES: IOrderParserStrategy[] = [
    {
        order: OrderEnum.MOVE,
        parse: (order) => ({move: {direction: order.split(' ')[1]} as IMoveOrder})
    }, {
        order: OrderEnum.SURFACE,
        parse: (order) => ({surface: {index: parseInt(order.split(' ')[1])} as ISurfaceOrder})
    }, {
        order: OrderEnum.TORPEDO,
        parse: (order) => {
            let dividedOrder = order.split(' ');
            return {
                torpedo: {
                    coordinate: {
                        x: parseInt(dividedOrder[1]),
                        y: parseInt(dividedOrder[2])
                    }
                } as ITorpedoOrder
            }
        }
    }, {
        order: OrderEnum.SONAR,
        parse: (order) => ({sonar: {index: parseInt(order.split(' ')[1])} as ISonarOrder})
    }, {
        order: OrderEnum.SILENCE,
        parse: (order) => ({silence: {} as ISilenceOrder})
    }, {
        order: OrderEnum.MINE,
        parse: (order) => ({mine: {} as IMineOrder})
    }, {
        order: OrderEnum.TRIGGER,
        parse: (order) => {
            let dividedOrder = order.split(' ');
            return {
                trigger: {
                    coordinate: {
                        x: parseInt(dividedOrder[1]),
                        y: parseInt(dividedOrder[2])
                    }
                } as ITriggerOrder
            }
        }
    }
];

export interface IMoveScenario {
    moves: IMoveStrategy[];
    paths: Map<number, Cell[]>;
}

export class OpponentSubmarine extends Submarine {
    private _startPositions: Cell[];
    private _moveScenarios: IMoveScenario[];

    constructor(id: number, grid: Grid) {
        super(id, grid);
        this._startPositions = this.grid.getAvailableCells();
        this._moveScenarios = [];
    }

    private _orders: IOrders;

    public get orders(): IOrders {
        return {...this._orders};
    }

    public static parse(orders: string[]): IOrders {
        return ORDER_PARSER_STRATEGIES
            .reduce(
                (acc, cur) => {
                    const order = orders.find(i => i.startsWith(cur.order));
                    if (order) {
                        acc = {...acc, ...cur.parse(order)};
                    }
                    return acc;
                }, {})
    }

    private static cloneMoveScenario(moveScenario: IMoveScenario): IMoveScenario {
        return {
            moves: [...moveScenario.moves],
            // paths: new Map(moveScenario.paths)
            paths: Array.from(moveScenario.paths.values())
                .reduce((acc, cur) =>
                    acc.set(cur[0].index, [...cur]), new Map<number, Cell[]>())
        };
    }

    public setOrders(orders: string[]) {
        this._orders = OpponentSubmarine.parse(orders);
        this.applyMoveOrders();
        this.applyOtherOrders();
    }

    public getPossiblePositions(): Cell[] {
        return Cell.removeDuplicate(this._moveScenarios
            .map(
                moveScenario => Array.from(moveScenario.paths.values()).map(positions => positions[positions.length - 1])
            )
            .reduce((acc, cur) => [...acc, ...cur], []));
    }

    public keepOnlyPositions(coordinates: ICoordinate[]) {
        const cellPositions = coordinates
            .filter(coordinate => !!coordinate)
            .map(coordinate => this.grid.getCell(this.grid.getIndex(coordinate)));
        this._moveScenarios.forEach(
            moveScenario => {
                Array.from(moveScenario.paths.keys()).forEach(
                    startPositionIndex => {
                        const positions = moveScenario.paths.get(startPositionIndex);
                        const lastPosition = positions[positions.length - 1];
                        if (!cellPositions.some(position => position === lastPosition)) {
                            moveScenario.paths.delete(startPositionIndex)
                        }
                    }
                );
                return moveScenario;
            }
        );
        this.updateMoveStrategies();
    }

    public excludePositions(coordinates: ICoordinate[]) {
        const cellPositions = coordinates
            .filter(coordinate => !!coordinate)
            .map(coordinate => this.grid.getCell(this.grid.getIndex(coordinate)));
        this._moveScenarios.forEach(
            moveScenario => {
                Array.from(moveScenario.paths.keys()).forEach(
                    startPositionIndex => {
                        const positions = moveScenario.paths.get(startPositionIndex);
                        const lastPosition = positions[positions.length - 1];
                        if (cellPositions.some(position => position === lastPosition)) {
                            moveScenario.paths.delete(startPositionIndex)
                        }
                    }
                );
                return moveScenario;
            }
        );
        this.updateMoveStrategies();
    }

    public keepOnlyPositionsInSurface(index: number): void {
        if (this._moveScenarios.length > 25 || this._moveScenarios.length === 0) {
            const surface = this.grid.surfaces[index];
            this._startPositions = surface.getAvailableCells();
            this._moveScenarios = [this.createMoveScenario()];
        } else {
            this._moveScenarios.forEach(
                moveScenario => {
                    Array.from(moveScenario.paths.keys()).forEach(
                        startPositionIndex => {
                            const positions = moveScenario.paths.get(startPositionIndex);
                            const lastPosition = positions[positions.length - 1];
                            if (lastPosition.surface !== index) {
                                moveScenario.paths.delete(startPositionIndex)
                            }
                        }
                    );
                    return moveScenario;
                }
            );
        }
        this.updateMoveStrategies();
    }

    public excludePositionsInSurface(index: number): void {
        if (this._moveScenarios.length > 0) {
            this._moveScenarios.forEach(
                moveScenario => {
                    Array.from(moveScenario.paths.keys()).forEach(
                        startPositionIndex => {
                            const positions = moveScenario.paths.get(startPositionIndex);
                            const lastPosition = positions[positions.length - 1];
                            if (lastPosition.surface === index) {
                                moveScenario.paths.delete(startPositionIndex)
                            }
                        }
                    );
                    return moveScenario;
                }
            );
        } else {
            this._startPositions = this.grid.surfaces
                .filter(surface => surface.index !== index)
                .map(surface => surface.getAvailableCells())
                .reduce((acc, cur) => [...acc, ...cur], []);
            this._moveScenarios = [this.createMoveScenario()];
        }
        this.updateMoveStrategies();
    }

    private createMoveScenario(): IMoveScenario {
        return {
            moves: [],
            paths: this._startPositions.reduce(
                (acc, startPosition) => acc.set(startPosition.index, [startPosition]), new Map<number, Cell[]>()
            )
        };
    }

    private addMoveStrategy(moveScenario: IMoveScenario, moveStrategy: IMoveStrategy): IMoveScenario {
        moveScenario.moves.push(moveStrategy);
        this._startPositions.forEach(startPosition => {
            if (moveScenario.paths.has(startPosition.index)) {
                const positions = moveScenario.paths.get(startPosition.index);
                const lastPosition = positions[positions.length - 1];
                const newPosition = lastPosition.sum(moveStrategy.move);
                const cell = this.grid.getCell(this.grid.getIndex(newPosition));
                if (cell && this.grid.isAvailableCell(cell) && !positions.find(p => p.equals(newPosition))) {
                    positions.push(cell);
                } else {
                    moveScenario.paths.delete(startPosition.index);
                }
            }
        });
        return moveScenario;
    }

    private applyMoveOrders() {
        log({ordres: this.orders});

        if (this._moveScenarios.length === 0) {
            this._moveScenarios.push(this.createMoveScenario());
        }
        if (this.orders.move) {
            const moveStrategy = MOVE_STRATEGIES.find(strategy => strategy.direction === this.orders.move.direction);
            this._moveScenarios.forEach(moveScenario => this.addMoveStrategy(moveScenario, moveStrategy));
            this.updateMoveStrategies();
        } else if (this.orders.silence) {
            const positions: Cell[] = this.getPossiblePositions();
            if (this._moveScenarios.length > 30) {
                this._startPositions = positions;
                this._moveScenarios = [this.createMoveScenario()];
            }
            this._moveScenarios = this._moveScenarios
                .map(moveScenario => {
                    const moveScenarios: IMoveScenario[] = [];
                    MOVE_STRATEGIES.map(moveStrategy => {
                        let tmpScenario = (moveScenario);
                        for (let length = 1; length <= 4; length++) {
                            tmpScenario = this.addMoveStrategy(OpponentSubmarine.cloneMoveScenario(tmpScenario), moveStrategy);
                            moveScenarios.push(tmpScenario);
                        }
                    });
                    return moveScenarios;
                })
                .reduce((acc, cur) => [...acc, ...cur], []);
            this.updateMoveStrategies();
        }

        if (this.orders.surface) {
            const surface = this.grid.surfaces[this.orders.surface.index - 1];
            this._startPositions = surface.getAvailableCells();
            this._moveScenarios = [this.createMoveScenario()];
            this.updateMoveStrategies();
        }
    }

    private applyOtherOrders(): void {
        if (this.orders.torpedo) {
            this.keepOnlyPositionsNearTorpedo(this.orders.torpedo.coordinate);
        }
    }

    private updateMoveStrategies(): void {
        this._moveScenarios = this._moveScenarios.filter(
            scenario => scenario.paths.size > 0
        );
        this._startPositions = this._startPositions.filter(
            startPosition => {
                return this._moveScenarios.some(moveScenario => moveScenario.paths.has(startPosition.index))
            }
        );
        if(this._startPositions.length===0){
            this._startPositions = this.grid.getAvailableCells();
            this._moveScenarios = [this.createMoveScenario()];
        }
        log({moveScenarios: this._moveScenarios.length});
        log({
            startPositions: this._startPositions.length > 0 && this._startPositions.length < 10
                ? this._startPositions.map(p => p.coordinate) : this._startPositions.length
        })
    }

    private keepOnlyPositionsNearTorpedo(coordinate: ICoordinate) {
        this._moveScenarios.forEach(
            moveScenario => {
                Array.from(moveScenario.paths.keys()).forEach(
                    startPositionIndex => {
                        const positions = moveScenario.paths.get(startPositionIndex);
                        const lastPosition = positions[positions.length - 1];
                        if (lastPosition.pathLength(coordinate) > 4) {
                            moveScenario.paths.delete(startPositionIndex)
                        }
                    }
                );
                return moveScenario;
            }
        );
        this.updateMoveStrategies();
    }
}