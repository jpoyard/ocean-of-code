import {Cell} from "./cell.class";

export interface ICoordinate {
    x: number;
    y: number;
}

export class Position implements ICoordinate {
    private readonly _coordinates: ICoordinate;

    constructor(coordinates: ICoordinate) {
        this._coordinates = {...coordinates};
    }

    public get x(): number {
        return this._coordinates.x;
    }

    public get y(): number {
        return this._coordinates.y;
    }

    public get coordinate(): ICoordinate {
        return {...this._coordinates};
    }

    public static sum(...coordinatesList: ICoordinate[]): ICoordinate {
        return coordinatesList.reduce(
            (acc, cur) => ({x: acc.x + cur.x, y: acc.y + cur.y}),
            {x: 0, y: 0}
        )
    }

    public static equals(...coordinatesList: ICoordinate[]): boolean {
        return coordinatesList
            .every(
                coordinates => coordinatesList[0].x === coordinates.x && coordinatesList[0].y === coordinates.y)
    }

    public static multiply(coordinates: ICoordinate, factor: number) {
        return {
            x: coordinates.x * factor,
            y: coordinates.y * factor
        };
    }

    public static getMinMax(...coordinates: ICoordinate[]): {min:ICoordinate, max: ICoordinate} {
        return coordinates.reduce<{ min: ICoordinate, max: ICoordinate }>(
            (acc, cur) => {
                acc.min = acc.min ? {
                    x: Math.min(acc.min.x, cur.x),
                    y: Math.min(acc.min.y, cur.y)
                } : cur;
                acc.max = acc.max ? {
                    x: Math.max(acc.max.x, cur.x),
                    y: Math.max(acc.max.y, cur.y)
                } : cur;
                return acc;
            }, { min: coordinates[0], max: coordinates[0]}
        );
    }

    public static removeDuplicate(coordinatesList: ICoordinate[]): ICoordinate[] {
        let result: ICoordinate[] = [];
        let tmpPositions = [...coordinatesList];
        while (tmpPositions.length > 0) {
            const currentPosition = tmpPositions[0];
            result.push(currentPosition);
            tmpPositions = tmpPositions.filter(position => !((position.x === currentPosition.x) && (position.y === currentPosition.y)))
        }
        return result;
    }

    public static distance(a: ICoordinate, b: ICoordinate): number {
        return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    }

    public static pathLength(a: ICoordinate, b: ICoordinate): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    public sum(coordinates: ICoordinate): ICoordinate {
        return Position.sum(this.coordinate, coordinates);
    }

    public multiply(factor: number): ICoordinate {
        return Position.multiply(this.coordinate, factor);
    }

    public equals(coordinates: ICoordinate): boolean {
        return Position.equals(this.coordinate, coordinates);
    }


    public distance(coordinates: ICoordinate): number {
        return Position.distance(this.coordinate, coordinates);
    }

    public pathLength(coordinates: ICoordinate): number {
        return Position.pathLength(this.coordinate, coordinates);
    }
}
