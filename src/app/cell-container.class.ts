import {ICoordinates} from "./position.class";

export class CellContainer {
    private readonly _middle: ICoordinates;

    constructor(
        private readonly _width: number,
        private readonly _height: number
    ) {
        this._middle = {x: Math.floor(_width / 2), y: Math.floor(_height / 2)}
    }

    public get middle(): ICoordinates {
        return ({...this._middle});
    }

    public get width(): number {
        return this._width
    };

    public get height(): number {
        return this._height
    };

    public getCoordinates(index: number): ICoordinates {
        return {x: index % this.width, y: Math.floor(index / this.width)}
    }

    public getIndex({x, y}: ICoordinates): number {
        return y * this.width + x;
    }

    public isIndexValid(index: number): boolean {
        return index >= 0 && index < (this.width * this.height);
    }

    public areCoordinatesValid({x, y}: ICoordinates): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
}