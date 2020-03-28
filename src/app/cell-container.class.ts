import {ICoordinate} from "./position.class";

export class CellContainer {
    private readonly _middle: ICoordinate;

    constructor(
        private readonly _width: number,
        private readonly _height: number
    ) {
        this._middle = {x: Math.floor(_width / 2), y: Math.floor(_height / 2)}
    }

    public get middle(): ICoordinate {
        return ({...this._middle});
    }

    public get width(): number {
        return this._width
    };

    public get height(): number {
        return this._height
    };

    public getCoordinates(index: number): ICoordinate {
        return {x: index % this.width, y: Math.floor(index / this.width)}
    }

    public getIndex({x, y}: ICoordinate): number {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return -1;
        }
        return (y * this.width) + x;
    }

    public isIndexValid(index: number): boolean {
        return index >= 0 && index < (this.width * this.height);
    }

    public areCoordinatesValid({x, y}: ICoordinate): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
}