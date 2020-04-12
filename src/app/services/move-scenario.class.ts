import {Cell} from "./cell.class";
import {PathScenario} from "./path-scenario.class";
import {IMoveStrategy} from "./path-finder.class";

export class MoveScenario {
    private _paths: Map<Cell, PathScenario>;

    constructor(startPositions: Cell[]) {
        this._paths = startPositions.reduce(
            (acc, startPosition) =>
                acc.set(startPosition, new PathScenario(startPosition)),
            new Map<Cell, PathScenario>()
        )
    }

    public get size(): number {
        return this._paths.size;
    }

    public values(): PathScenario[] {
        return Array.from(this._paths.values());
    }

    public startPositions(): Cell[] {
        return Array.from(this._paths.keys());
    }

    public add(path: PathScenario): void {
        this._paths.set(path.start, path);
    }

    public has(startPosition: Cell): boolean {
        return this._paths.has(startPosition);
    }

    public get(startPosition: Cell): PathScenario {
        return this._paths.get(startPosition);
    }

    public delete(startPosition: Cell): void {
        this._paths.delete(startPosition);
    }

    public clone(): MoveScenario {
        const result = new MoveScenario([]);
        Array.from(this._paths.values()).forEach(
            path => result.add(path.clone())
        );
        return result;
    }

    public keepOnlyPosition(cellPosition: Cell): MoveScenario {
        this.startPositions().forEach(
            startPosition => {
                const pathScenario = this.get(startPosition);
                if (cellPosition !== pathScenario.position) {
                    this.delete(startPosition)
                }
            }
        );
        return this;
    }

    public keepOnlyPositions(cellPositions: Cell[]): MoveScenario {
        this.startPositions().forEach(
            startPosition => {
                const pathScenario = this.get(startPosition);
                if (!cellPositions.includes(pathScenario.position)) {
                    this.delete(startPosition)
                }
            }
        );
        return this;
    }

    public excludePosition(cellPosition: Cell): MoveScenario {
        this.startPositions().forEach(
            startPosition => {
                const pathScenario = this.get(startPosition);
                if (cellPosition === pathScenario.position) {
                    this.delete(startPosition)
                }
            }
        );
        return this;
    }

    public excludePositions(cellPositions: Cell[]): MoveScenario {
        this.startPositions().forEach(
            startPosition => {
                const pathScenario = this.get(startPosition);
                if (cellPositions.some(position => position === pathScenario.position)) {
                    this.delete(startPosition)
                }
            }
        );
        return this;
    }

    public keepOnlyInSurface(surfaceIndex: number) {
        (this.startPositions()).forEach(
            startPosition => {
                const pathScenario = this.get(startPosition);
                if (pathScenario.position.surface !== surfaceIndex) {
                    this.delete(startPosition)
                }
            }
        );
        return this;
    }

    public excludeInSurface(surfaceIndex: number) {
        (this.startPositions()).forEach(
            startPosition => {
                const pathScenario = this.get(startPosition);
                if (pathScenario.position.surface === surfaceIndex) {
                    this.delete(startPosition)
                }
            }
        );
        return this;
    }
}
