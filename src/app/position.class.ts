export interface ICoordinates {
    x: number;
    y: number;
}

export class Position implements ICoordinates {
    private readonly _coordinates: ICoordinates;

    constructor(coordinates: ICoordinates) {
        this._coordinates = {...coordinates};
    }

    public get x(): number {
        return this._coordinates.x;
    }

    public get y(): number {
        return this._coordinates.y;
    }

    public get coordinate(): ICoordinates {
        return {...this._coordinates};
    }

    public static sum(...coordinatesList: ICoordinates[]): ICoordinates {
        return coordinatesList.reduce(
            (acc, cur) => ({x: acc.x + cur.x, y: acc.y + cur.y}),
            {x: 0, y: 0}
        )
    }

    public static equals(...coordinatesList: ICoordinates[]): boolean {
        return coordinatesList
            .every(
                coordinates => coordinatesList[0].x === coordinates.x && coordinatesList[0].y === coordinates.y)
    }

    public static multiply(coordinates: ICoordinates, factor: number) {
        return {
            x: coordinates.x * factor,
            y: coordinates.y * factor
        };
    }

    public static removeDuplicate(coordinatesList: ICoordinates[]): ICoordinates[] {
        let result: ICoordinates[] = [];
        let tmpPositions = [...coordinatesList];
        while (tmpPositions.length > 0) {
            const currentPosition = tmpPositions[0];
            result.push(currentPosition);
            tmpPositions = tmpPositions.filter(position => !((position.x === currentPosition.x) && (position.y === currentPosition.y)))
        }
        return result;
    }

    public static distance(a: ICoordinates, b: ICoordinates): number {
        return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    }

    public static pathLength(a: ICoordinates, b: ICoordinates): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    public sum(coordinates: ICoordinates): ICoordinates {
        return Position.sum(this.coordinate, coordinates);
    }

    public multiply(factor: number): ICoordinates {
        return Position.multiply(this.coordinate, factor);
    }

    public equals(coordinates: ICoordinates): boolean {
        return Position.equals(this.coordinate, coordinates);
    }


    public distance(coordinates: ICoordinates): number {
        return Position.distance(this.coordinate, coordinates);
    }

    public pathLength(coordinates: ICoordinates): number {
        return Position.pathLength(this.coordinate, coordinates);
    }
}