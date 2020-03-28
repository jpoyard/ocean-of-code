import {Grid} from "./grid.class";
import {IMoveStrategy, MOVE_STRATEGIES, OrderEnum, Submarine} from "./submarine.class";
import {ICoordinate} from "./position.class";
import {Cell, CellTypeEnum} from "./cell.class";
import {start} from "repl";

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
                    const order = orders.find(i => i.includes(cur.order));
                    if (order) {
                        acc = {...acc, ...cur.parse(order)};
                    }
                    return acc;
                }, {})
    }

    private static cloneMoveScenario(moveScenario: IMoveScenario): IMoveScenario {
        return {
            moves: [...moveScenario.moves],
            paths: new Map(Array.from(moveScenario.paths.entries()).map(entry => [entry[0], [...entry[1]]]))
        };
    }

    public setOrders(orders: string[]) {
        this._orders = OpponentSubmarine.parse(orders);
        this.applyMoveOrders();
        this.applyOtherOrders();
    }

    public getPossiblePositions(): Cell[] {
        return this._moveScenarios
            .map(
                moveScenario => Array.from(moveScenario.paths.values()).map(positions => positions[positions.length - 1])
            )
            .reduce((acc, cur) => [...acc, ...cur], []);
    }

    public keepOnlyPositionsInSurface(index: number): void {
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
                )
                return moveScenario;
            }
        );
        this.updateMoveStrategies();
    }

    public excludePositionsInSurface(index: number): void {
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
                )
                return moveScenario;
            }
        );
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

    private addMoveStrategy(moveScenario: IMoveScenario, moveStrategy: IMoveStrategy): void {
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
    }

    private applyMoveOrders() {
        if (this._moveScenarios.length === 0) {
            this._moveScenarios.push(this.createMoveScenario());
        }
        if (this.orders.move) {
            const moveStrategy = MOVE_STRATEGIES.find(strategy => strategy.direction === this.orders.move.direction);
            this._moveScenarios.forEach(moveScenario => this.addMoveStrategy(moveScenario, moveStrategy));
            this.updateMoveStrategies();
        } else if (this.orders.silence) {
            this._moveScenarios = this._moveScenarios
                .map(moveScenario => {
                    const moveScenarios: IMoveScenario[] = [];
                    MOVE_STRATEGIES.map(moveStrategy => {
                        for (let length = 1; length <= 4; length++) {
                            const newMoveScenario = OpponentSubmarine.cloneMoveScenario(moveScenario);
                            this.addMoveStrategy(newMoveScenario, moveStrategy);
                            moveScenarios.push(newMoveScenario);
                        }
                    });
                    return moveScenarios;
                })
                .reduce((acc, cur) => [...acc, ...cur], []);
            this.updateMoveStrategies();
        } else if (this.orders.surface) {
            this.keepOnlyPositionsInSurface(this.orders.surface.index);
            const positions = this.getPossiblePositions();
            if (positions.length > 0) {
                this._startPositions = [...positions];
            } else {
                this._startPositions = this.grid.surfaces[this.orders.surface.index - 1].cells.filter(cell => cell.type === CellTypeEnum.SEA);
            }
            this._moveScenarios.forEach(moveScenario => {
                moveScenario.moves = [];
                moveScenario.paths.clear();
            });
            this._moveScenarios = [];
        }
    }

    private applyOtherOrders(): void {
        // TODO: Torpedo: to filter path
    }

    private updateMoveStrategies(): void {
        console.error({scenario: this._moveScenarios.length, startPositions: this._startPositions.length});
        this._moveScenarios = this._moveScenarios.filter(
            scenario => scenario.paths.size > 0
        );
        console.error({scenario: this._moveScenarios.length});
        this._startPositions = this._startPositions.filter(
            startPosition => {
                return this._moveScenarios.some(moveScenario => moveScenario.paths.has(startPosition.index))
            }
        );
        this._moveScenarios.forEach(scenario => {
            if (scenario.paths.size > this._startPositions.length) {
                const unexpectedIndexes = Array.from(scenario.paths.keys())
                    .filter(key => this._startPositions.find(sp => sp.index === key));
                unexpectedIndexes.forEach((index)=>scenario.paths.delete(index))
            }
        });
        console.error({startPositions: this._startPositions.length});
    }
}