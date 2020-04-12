import {Cell, CellTypeEnum} from "./cell.class";
import {Grid} from "./grid.class";
import {ICoordinate, Position} from "./position.class";
import {OrderEnum} from "./submarine.class";
import {IMoveOrder, IOrder, ISurfaceOrder, ITorpedoOrder} from "./opponent-submarine.class";
import {DirectionEnum, IMoveStrategy, MOVE_STRATEGIES_SE} from "./path-finder.class";
import {MoveScenario} from "./move-scenario.class";

export interface IPositionsStats {
    cells: Map<Cell, number>;
    numberOfMoves: number;
    surfaceStats: Map<number, Cell[]>;
    starts: Cell[];
    visitedCells: Map<Cell, number>;
}

export class TrackResolver {
    private _startPositions: Cell[];
    private _moveScenarios: MoveScenario[];

    constructor(private grid: Grid, public log: (...arg) => void) {
        this._startPositions = this.grid.getAvailableCells();
        this._moveScenarios = [];
    }

    public applyOrders(orders: IOrder[], lost: number) {
        this.log({orders: JSON.stringify(orders)});

        if (this._moveScenarios.length === 0) {
            this._moveScenarios.push(new MoveScenario(this._startPositions));
        }

        orders.forEach(order => {
            switch (order.type) {
                case OrderEnum.MOVE:
                    this.move((order.order as IMoveOrder).direction);
                    break;
                case OrderEnum.SILENCE:
                    this.silenceMove();
                    break;
                case OrderEnum.TORPEDO:
                    this.torpedoAttack((order.order as ITorpedoOrder).coordinate, lost);
                    break;
                case OrderEnum.SURFACE:
                    this.surface((order.order as ISurfaceOrder).index);
                    break;
            }
        });
    }

    public getPositionsStats(): IPositionsStats {
        //const possiblePositions = this.getPossiblePositions();
        let {positions, visitedCells} = this.getStats();
        const possiblePositions = Array.from(positions.keys());
        const surfaceStats = possiblePositions.reduce((acc, cur) => {
            let cells: Cell[] = [];
            if (acc.has(cur.surface)) {
                cells = acc.get(cur.surface);
            }
            return acc.set(cur.surface, [...cells, cur])
        }, new Map<number, Cell[]>());
        return {
            cells: positions,
            numberOfMoves: this._moveScenarios.length,
            visitedCells,
            starts: this._startPositions,
            surfaceStats
        }
    }

    public getStats(): { positions: Map<Cell, number>, visitedCells: Map<Cell, number> } {
        const result = {positions: new Map<Cell, number>(), visitedCells: new Map<Cell, number>()};
        this._moveScenarios.forEach(moveScenario => {
            (moveScenario.values()).forEach(
                path => {
                    let usePositionCounter = 1;
                    if (result.positions.has(path.position)) {
                        usePositionCounter = result.positions.get(path.position) + 1
                    }
                    result.positions.set(path.position, usePositionCounter);
                    path.visitedCells.forEach(
                        cell => {
                            let useCellCounter = 1;
                            if (result.visitedCells.has(cell)) {
                                useCellCounter = result.visitedCells.get(cell) + 1
                            }
                            result.visitedCells.set(cell, useCellCounter)
                        }
                    )
                }
            )
        });
        return result;
    }

    public getPossiblePositions(): Cell[] {
        const cells = this._moveScenarios
            .map(
                moveScenario => (moveScenario.values())
                    .map(pathScenario => pathScenario.position)
            )
            .reduce((acc, cur) => [...acc, ...cur], []);
        // const mergedcell = Cell.removeDuplicate(cells);
        // this.log('duplicate: ', cells.length - mergedcell.length);
        /// return mergedcell;
        return cells;
    }

    public keepOnlyPosition(coordinate: ICoordinate) {
        const position = this.grid.getCellFromCoordinate(coordinate);
        this._moveScenarios.forEach(moveScenario => moveScenario.keepOnlyPosition(position));
        this.updateMoveStrategies();
    }

    public keepOnlyPositions(coordinates: ICoordinate[]) {
        const cellPositions = coordinates
            .map(coordinate => this.grid.getCellFromCoordinate(coordinate));
        this._moveScenarios.forEach(moveScenario => moveScenario.keepOnlyPositions(cellPositions));
        this.updateMoveStrategies();
    }

    public excludePositions(coordinates: ICoordinate[]) {
        const cellPositions = coordinates
            .map(coordinate => this.grid.getCellFromCoordinate(coordinate))
            .filter(cell => !!cell);
        this._moveScenarios.forEach(moveScenario => moveScenario.excludePositions(cellPositions));
        this.updateMoveStrategies();
    }

    public excludePosition(coordinate: ICoordinate) {
        const position = this.grid.getCellFromCoordinate(coordinate);
        this._moveScenarios.forEach(moveScenario => moveScenario.excludePosition(position));
        this.updateMoveStrategies();
    }

    public keepOnlyPositionsInSurface(surfaceIndex: number): void {
        if (this._moveScenarios.length > 300 || this._moveScenarios.length === 0) {
            const surface = this.grid.surfaces[surfaceIndex - 1];
            this._startPositions = surface.getAvailableCells();
            this._moveScenarios = [new MoveScenario(this._startPositions)];
        } else {
            this._moveScenarios.forEach(moveScenario => moveScenario.keepOnlyInSurface(surfaceIndex));
        }
        this.updateMoveStrategies();
    }

    public excludePositionsInSurface(index: number): void {
        if (this._moveScenarios.length > 0) {
            this._moveScenarios.forEach(moveScenario => moveScenario.excludeInSurface(index));
        } else {
            this._startPositions = this.grid.surfaces
                .filter(surface => surface.index !== index)
                .map(surface => surface.getAvailableCells())
                .reduce((acc, cur) => [...acc, ...cur], []);
            this._moveScenarios = [new MoveScenario(this._startPositions)];
        }
        this.updateMoveStrategies();
    }

    public keepOnlyPositionsNearTorpedoArea(coordinate: ICoordinate, lost: number) {
        let torpedoArea = [];
        if (lost === 0) {
            torpedoArea = this.grid.getTorpedoAreaWithoutDangerArea(new Position(coordinate));
        } else {
            torpedoArea = this.grid.getTorpedoArea(new Position(coordinate));
        }
        this._moveScenarios.forEach(
            moveScenario => {
                Array.from(moveScenario.startPositions()).forEach(
                    startPosition => {
                        const pathScenario = moveScenario.get(startPosition);
                        if (!torpedoArea.includes(pathScenario.position)) {
                            moveScenario.delete(startPosition)
                        }
                    }
                );
                return moveScenario;
            }
        );
        this.reduceMoveStrategies();
        this.updateMoveStrategies();
    }

    private surface(surfaceIndex: number) {
        const positions = this.getPossiblePositions().filter(c => c.surface === surfaceIndex);
        this._startPositions = (positions.length > 0)
            ? positions.filter(cell => cell.surface === surfaceIndex)
            : this.grid.surfaces[surfaceIndex - 1].cells.filter(cell => cell.type === CellTypeEnum.SEA);
        this._moveScenarios = [new MoveScenario(this._startPositions)];
        this.updateMoveStrategies();
    }

    private torpedoAttack(coordinate: ICoordinate, lost: number) {
        this.keepOnlyPositionsNearTorpedoArea(coordinate, lost);
    }

    private silenceMove() {
        this.reduceMoveStrategies();
        this._moveScenarios = this._moveScenarios
            .map(moveScenario => {
                const moveScenarios: MoveScenario[] = [];
                moveScenarios.push(moveScenario); // silence 0
                MOVE_STRATEGIES_SE.map(moveStrategy => {
                    let tmpScenario = (moveScenario);
                    for (let length = 1; length <= 4; length++) {
                        tmpScenario = this.addPosition(tmpScenario.clone(), moveStrategy);
                        moveScenarios.push(tmpScenario);
                    }
                });
                return moveScenarios;
            })
            .reduce((acc, cur) => [...acc, ...cur], []);
        this.updateMoveStrategies();
    }

    private move(direction: DirectionEnum) {
        const moveStrategy = MOVE_STRATEGIES_SE
            .find(strategy => strategy.direction === direction);
        this._moveScenarios.forEach(moveScenario => this.addPosition(moveScenario, moveStrategy));
        this.updateMoveStrategies();
    }

    private addPosition(moveScenario: MoveScenario, moveStrategy: IMoveStrategy): MoveScenario {
        this._startPositions.forEach(startPosition => {
            if (moveScenario.has(startPosition)) {
                const pathScenario = moveScenario.get(startPosition);
                const cell = this.grid.getCell(this.grid.getIndex(pathScenario.position.sum(moveStrategy.move)));
                if (cell && !pathScenario.has(cell) && this.grid.isAvailableCell(cell)) {
                    pathScenario.add(cell);
                } else {
                    moveScenario.delete(startPosition);
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
                        if (cur.has(startPosition) && cur.get(startPosition).position === position) {
                            acc = Math.min(acc, cur.get(startPosition).size);
                        }
                        return acc;
                    }, MAX
                );
                this._moveScenarios.forEach(moveScenario => {
                    if (moveScenario.has(startPosition)
                        && moveScenario.get(startPosition).position === position
                        && moveScenario.get(startPosition).size > minLength) {
                        moveScenario.delete(startPosition);
                    }
                })
            })
        });
        this._moveScenarios = this._moveScenarios.filter(ms => ms.size > 0);
    }

    private updateMoveStrategies(): void {
        this.log('Before', {moveScenarios: this._moveScenarios.length});

        const {cells} = this.getPositionsStats();
        if (cells.size < 10) {
            Array.from(cells.keys()).forEach(
                cell => this.log(cell.toString())
            )
        }

        this._moveScenarios = this._moveScenarios.filter(
            scenario => scenario.size > 0
        );
        this._startPositions = this._startPositions.filter(
            startPosition => {
                return this._moveScenarios
                    .some(moveScenario => moveScenario.has(startPosition))
            }
        );
        this.log('After', {moveScenarios: this._moveScenarios.length});
    }


}
