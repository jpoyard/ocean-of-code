import {Cell} from "./cell.class";
import {Grid} from "./grid.class";
import {ICoordinate, Position} from "./position.class";
import {OrderEnum} from "./submarine.class";
import {IMoveOrder, IOrder, ISurfaceOrder, ITorpedoOrder} from "./opponent-submarine.class";
import {IMoveStrategy, MOVE_STRATEGIES_ANTI_CLOCKWISE_SE} from "./path-finder.class";

export interface IPositionsStats {
    cells: Cell[];
    numberOfMoves: number;
    surfaceStats: Map<number, Cell[]>;
    starts: Cell[];
}

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
                    const moveStrategy = MOVE_STRATEGIES_ANTI_CLOCKWISE_SE
                        .find(strategy => strategy.direction === ((order.order as IMoveOrder).direction));
                    this._moveScenarios.forEach(moveScenario => this.addMoveStrategy(moveScenario, moveStrategy));
                    this.updateMoveStrategies();
                    break;
                case OrderEnum.SILENCE:
                    this.reduceMoveStrategies();
                    this._moveScenarios = this._moveScenarios
                        .map(moveScenario => {
                            const moveScenarios: IMoveScenario[] = [];
                            moveScenarios.push(moveScenario); // silence 0
                            MOVE_STRATEGIES_ANTI_CLOCKWISE_SE.map(moveStrategy => {
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
                    this.keepOnlyPositionsNearTorpedoArea((order.order as ITorpedoOrder).coordinate);
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

    public getPositionsStats(): IPositionsStats {
        const possiblePositions = this.getPossiblePositions();
        const surfaceStats = possiblePositions.reduce((acc, cur) => {
            let cells: Cell[] = [];
            if (acc.has(cur.surface)) {
                cells = acc.get(cur.surface);
            }
            return acc.set(cur.surface, [...cells, cur])
        }, new Map<number, Cell[]>());
        return {
            cells: possiblePositions,
            numberOfMoves: this._moveScenarios.length,
            starts: this._startPositions,
            surfaceStats
        }
    }

    public getPossiblePositions(): Cell[] {
        const cells = this._moveScenarios
            .map(
                moveScenario => Array.from(moveScenario.paths.values())
                    .map(pathScenario => pathScenario.position)
            )
            .reduce((acc, cur) => [...acc, ...cur], []);
        const mergedcell = Cell.removeDuplicate(cells);
        log('duplicate: ', cells.length - mergedcell.length);
        return mergedcell;
    }

    public keepOnlyPosition(coordinate: ICoordinate) {
        const position = this.grid.getCellFromCoordinate(coordinate);
        this._moveScenarios.forEach(
            moveScenario => {
                Array.from(moveScenario.paths.keys()).forEach(
                    startPositionIndex => {
                        const pathScenario = moveScenario.paths.get(startPositionIndex);
                        if (position !== pathScenario.position) {
                            moveScenario.paths.delete(startPositionIndex)
                        }
                    }
                );
                return moveScenario;
            }
        );
        this.updateMoveStrategies();
    }

    public keepOnlyPositions(coordinates: ICoordinate[]) {
        const cellPositions = coordinates
            .map(coordinate => this.grid.getCellFromCoordinate(coordinate));
        this._moveScenarios.forEach(
            moveScenario => {
                Array.from(moveScenario.paths.keys()).forEach(
                    startPositionIndex => {
                        const pathScenario = moveScenario.paths.get(startPositionIndex);
                        if (!cellPositions.includes(pathScenario.position)) {
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
                        if (cellPositions.some(position => position === pathScenario.position)) {
                            moveScenario.paths.delete(startPositionIndex)
                        }
                    }
                );
                return moveScenario;
            }
        );
        this.updateMoveStrategies();
    }

    public excludePosition(coordinate: ICoordinate) {
        const position = this.grid.getCellFromCoordinate(coordinate);
        this._moveScenarios.forEach(
            moveScenario => {
                Array.from(moveScenario.paths.keys()).forEach(
                    startPositionIndex => {
                        const pathScenario = moveScenario.paths.get(startPositionIndex);
                        if (position === pathScenario.position) {
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
            const surface = this.grid.surfaces[index - 1];
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

    public keepOnlyPositionsNearTorpedoArea(coordinate: ICoordinate) {
        const torpedoArea = this.grid.getTorpedoArea(new Position(coordinate));
        this._moveScenarios.forEach(
            moveScenario => {
                Array.from(moveScenario.paths.keys()).forEach(
                    startPositionIndex => {
                        const pathScenario = moveScenario.paths.get(startPositionIndex);
                        if (!torpedoArea.includes(pathScenario.position)) {
                            moveScenario.paths.delete(startPositionIndex)
                        }
                    }
                );
                return moveScenario;
            }
        );
        this.reduceMoveStrategies();
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

    private reduceMoveStrategies(): void {
        const MAX = this.grid.width * this.grid.height;
        const positions = this.getPossiblePositions();
        this._startPositions.forEach(startPosition => {
            positions.forEach(position => {
                const minLength = this._moveScenarios.reduce(
                    (acc, cur) => {
                        if (cur.paths.has(startPosition.index) && cur.paths.get(startPosition.index).position === position) {
                            acc = Math.min(acc, cur.paths.get(startPosition.index).visitedCells.length);
                        }
                        return acc;
                    }, MAX
                );
                this._moveScenarios.forEach(moveScenario => {
                    if (moveScenario.paths.has(startPosition.index)
                        && moveScenario.paths.get(startPosition.index).position === position
                        && moveScenario.paths.get(startPosition.index).visitedCells.length > minLength) {
                        moveScenario.paths.delete(startPosition.index);
                    }
                })
            })
        });
        this._moveScenarios = this._moveScenarios.filter(ms => ms.paths.size > 0);
    }

    private updateMoveStrategies(): void {
        // log('Before',{moveScenarios: this._moveScenarios.length});
        this._moveScenarios = this._moveScenarios.filter(
            scenario => scenario.paths.size > 0
        );
        this._startPositions = this._startPositions.filter(
            startPosition => {
                return this._moveScenarios
                    .some(moveScenario => moveScenario.paths.has(startPosition.index))
            }
        );
        // log('After',{moveScenarios: this._moveScenarios.length});
    }


}
