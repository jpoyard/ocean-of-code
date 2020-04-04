import {Cell} from "./cell.class";
import {Grid} from "./grid.class";
import {ICoordinate} from "./position.class";
import {OrderEnum} from "./submarine.class";
import {IMoveOrder, IOrder, ISurfaceOrder, ITorpedoOrder} from "./opponent-submarine.class";
import {IMoveStrategy, MOVE_STRATEGIES_CLOCKWISE} from "./path-finder.class";

export interface IPathScenario {
    index: number;
    visitedCells: Cell[];
    position: Cell;
}

export interface IMoveScenario {
    paths: Map<number, IPathScenario>;
}

export class PathResolver {
    private _startPositions: Cell[];
    private _moveScenarios: IMoveScenario[];

    constructor(private grid: Grid) {
        this._startPositions = this.grid.getAvailableCells();
        this._moveScenarios = [];
    }

    private static clonePathScneario(pathScenario: IPathScenario): IPathScenario {
        return {
            index: pathScenario.index,
            visitedCells: [...pathScenario.visitedCells],
            position: pathScenario.position
        }
    }

    private static cloneMoveScenario(moveScenario: IMoveScenario): IMoveScenario {
        return {
            // moves: [...moveScenario.moves],
            // paths: new Map(moveScenario.paths)
            paths: Array.from(moveScenario.paths.values())
                .reduce((acc, cur) => {
                    const clone = this.clonePathScneario(cur);
                    return acc.set(clone.index, clone)
                }, new Map<number, IPathScenario>())
        };
    }

    private static createPathScenario(startPosition: Cell): IPathScenario {
        return {
            index: startPosition.index,
            visitedCells: [startPosition],
            position: startPosition
        }
    }

    public applyMoveOrders(orders: IOrder[]) {
        log({orders: JSON.stringify(orders)});

        if (this._moveScenarios.length === 0) {
            this._moveScenarios.push(this.createMoveScenario());
        }

        orders.forEach(order => {
            switch (order.type) {
                case OrderEnum.MOVE:
                    const moveStrategy = MOVE_STRATEGIES_CLOCKWISE
                        .find(strategy => strategy.direction === ((order.order as IMoveOrder).direction));
                    this._moveScenarios.forEach(moveScenario => this.addMoveStrategy(moveScenario, moveStrategy));
                    this.updateMoveStrategies();
                    break;
                case OrderEnum.SILENCE:
                    this._moveScenarios = this._moveScenarios
                        .map(moveScenario => {
                            const moveScenarios: IMoveScenario[] = [];
                            moveScenarios.push(moveScenario); // silence 0
                            MOVE_STRATEGIES_CLOCKWISE.map(moveStrategy => {
                                let tmpScenario = (moveScenario);
                                for (let length = 1; length <= 4; length++) {
                                    tmpScenario = this.addMoveStrategy(PathResolver.cloneMoveScenario(tmpScenario), moveStrategy);
                                    moveScenarios.push(tmpScenario);
                                }
                            });
                            return moveScenarios;
                        })
                        .reduce((acc, cur) => [...acc, ...cur], []);
                    this.updateMoveStrategies();
                    break;
                case OrderEnum.TORPEDO:
                    this.keepOnlyPositionsNearTorpedo((order.order as ITorpedoOrder).coordinate);
                    break;
                case OrderEnum.SURFACE:
                    const positions = this.getPossiblePositions().filter(c => c.surface === (order.order as ISurfaceOrder).index);
                    this._startPositions = (positions.length > 0) ? positions : this.grid.getAvailableCells().filter(c => c.surface === (order.order as ISurfaceOrder).index);
                    this._moveScenarios = [this.createMoveScenario()];
                    this.updateMoveStrategies();
                    break;
            }
        });
    }

    public getPossiblePositions(): Cell[] {
        return Cell.removeDuplicate(this._moveScenarios
            .map(
                moveScenario => Array.from(moveScenario.paths.values())
                    .map(pathScenario => pathScenario.position)
            )
            .reduce((acc, cur) => [...acc, ...cur], []));
    }

    public keepOnlyPositions(coordinates: ICoordinate[]) {
        log(coordinates);
        const cellPositions = coordinates
            .map(coordinate => this.grid.getCellFromCoordinate(coordinate))
            .filter(cell => !!cell);
        this._moveScenarios.forEach(
            moveScenario => {
                Array.from(moveScenario.paths.keys()).forEach(
                    startPositionIndex => {
                        const pathScenario = moveScenario.paths.get(startPositionIndex);
                        if (!cellPositions.some(position => position === pathScenario.position)) {
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
            .map(coordinate => this.grid.getCellFromCoordinate(coordinate))
            .filter(cell => !!cell);
        this._moveScenarios.forEach(
            moveScenario => {
                Array.from(moveScenario.paths.keys()).forEach(
                    startPositionIndex => {
                        const pathScenario = moveScenario.paths.get(startPositionIndex);
                        if (cellPositions.includes(pathScenario.position)) {
                            log('exclude scenario with position', pathScenario.position.coordinate);
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
        if (this._moveScenarios.length > 300 || this._moveScenarios.length === 0) {
            const surface = this.grid.surfaces[index-1];
            this._startPositions = surface.getAvailableCells();
            this._moveScenarios = [this.createMoveScenario()];
        } else {
            this._moveScenarios.forEach(
                moveScenario => {
                    Array.from(moveScenario.paths.keys()).forEach(
                        startPositionIndex => {
                            const pathScenario = moveScenario.paths.get(startPositionIndex);
                            if (pathScenario.position.surface !== index) {
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
                            const pathScenario = moveScenario.paths.get(startPositionIndex);
                            if (pathScenario.position.surface === index) {
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

    public keepOnlyPositionsNearTorpedo(coordinate: ICoordinate) {
        this._moveScenarios.forEach(
            moveScenario => {
                Array.from(moveScenario.paths.keys()).forEach(
                    startPositionIndex => {
                        const pathScenario = moveScenario.paths.get(startPositionIndex);
                        if (pathScenario.position.pathLength(coordinate) > 4) {
                            moveScenario.paths.delete(startPositionIndex)
                        }
                    }
                );
                return moveScenario;
            }
        );
        this.updateMoveStrategies();

    }

    private createMoveScenario(): IMoveScenario {
        return {
            // moves: [],
            paths: this._startPositions.reduce(
                (acc, startPosition) =>
                    acc.set(startPosition.index, PathResolver.createPathScenario(startPosition)),
                new Map<number, IPathScenario>()
            )
        };
    }

    private addMoveStrategy(moveScenario: IMoveScenario, moveStrategy: IMoveStrategy): IMoveScenario {
        this._startPositions.forEach(startPosition => {
            if (moveScenario.paths.has(startPosition.index)) {
                const pathScenario = moveScenario.paths.get(startPosition.index);
                const cell = this.grid.getCell(this.grid.getIndex(pathScenario.position.sum(moveStrategy.move)));
                if (cell && this.grid.isAvailableCell(cell) && !pathScenario.visitedCells.includes(cell)) {
                    pathScenario.position = cell;
                    pathScenario.visitedCells.push(pathScenario.position);
                } else {
                    moveScenario.paths.delete(startPosition.index);
                }
            }
        });
        return moveScenario;
    }

    private updateMoveStrategies(): void {
        const positions = this.getPossiblePositions();
        this._moveScenarios = this._moveScenarios.filter(
            scenario => scenario.paths.size > 0
        );
        this._startPositions = this._startPositions.filter(
            startPosition => {
                return this._moveScenarios
                    .some(moveScenario => moveScenario.paths.has(startPosition.index))
            }
        );
        /**
         if (this._startPositions.length === 0) {
            this._startPositions = this.grid.getAvailableCells();
            this._moveScenarios = [this.createMoveScenario()];
        }
         **/
        log({moveScenarios: this._moveScenarios.length});
        /**
         log({
            startPositions: this._startPositions.length > 0 && this._startPositions.length < 10
                ? this._startPositions.map(p => p.coordinate) : this._startPositions.length
        })
         **/
    }


}
