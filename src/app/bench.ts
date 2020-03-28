export interface IPosition {
    x: number;
    y: number;
}

export function getSurfacePositionCenter(surface: number): IPosition {
    const position: IPosition = {x: (surface - 1) % 3, y: Math.ceil(surface / 3) - 1};
    return {x: 2 + 5 * (position.x), y: 2 + 5 * (position.y)};
}

export function getSurface(position: IPosition): number {
    const surfacePosition: IPosition = {x: Math.floor(position.x / 5), y: Math.floor(position.y / 5)};
    const index = surfacePosition.x + surfacePosition.y * 3;
    return index + 1;
}