enum CommandEnum {
    TORPEDO = 'TORPEDO',
    SONAR = 'SONAR',
    SILENCE = 'SILENCE',
    SURFACE = 'SURFACE',
    MOVE = 'MOVE',
    MINE = 'MINE',
    TRIGGER = 'TRIGGER'
}

interface ICooldown {
    torpedo: number;
    sonar: number;
    silence: number;
    mine: number;
}

enum CellTypeEnum {
    SEA = '.',
    ISLAND = 'X'
}

enum DirectionEnum {
    NORTH = 'N',
    EST = 'E',
    SOUTH = 'S',
    WEST = 'W',
}

interface IPosition {
    x: number;
    y: number;
}

interface IMoveStrategy {
    move: IPosition;
    direction: DirectionEnum
}

const MOVE_STRATEGIES: IMoveStrategy[] = [
    {move: {x: 0, y: -1}, direction: DirectionEnum.NORTH},
    {move: {x: 1, y: 0}, direction: DirectionEnum.EST},
    {move: {x: 0, y: 1}, direction: DirectionEnum.SOUTH},
    {move: {x: -1, y: 0}, direction: DirectionEnum.WEST}
];

interface IPath {
    index: number;
    position: IPosition;
    direction: DirectionEnum
}

interface IPathNode {
    index: number;
    position: IPosition;
    direction?: DirectionEnum
    paths?: IPath[];
}

class Grid {
    private visitedCells: number[] = [];

    constructor(private width: number, private height: number, private grid: string[]) {
    }

    public set currentCell(position: IPosition) {
        this.visitedCells.push(this.getGridIndex(position));
    }

    public static sumCells(a: IPosition, b: IPosition): IPosition {
        return {x: a.x + b.x, y: a.y + b.y};
    }

    public static multiply(position: IPosition, factor: number) {
        return {
            x: position.x * factor,
            y: position.y * factor
        };
    }

    public static removeDuplicate(positions: IPosition[]) {
        let result: IPosition[] = [];
        let tmpPositions = [...positions];
        while (tmpPositions.length > 0) {
            const currentPosition = tmpPositions.pop();
            result.push(currentPosition);
            tmpPositions = tmpPositions.filter(position => !((position.x === currentPosition.x) && (position.y === currentPosition.y)))
        }
        return result;
    }

    public static getSurfacePositionCenter(surface: number): IPosition {
        const position: IPosition = {x: (surface - 1) % 3, y: Math.ceil(surface / 3) - 1};
        return {x: 2 + 5 * (position.x), y: 2 + 5 * (position.y)};
    }

    public static getSurface(position: IPosition): number {
        const surfacePosition: IPosition = {x: Math.floor(position.x / 5), y: Math.floor(position.y / 5)};
        const index = surfacePosition.x + surfacePosition.y * 3;
        return index + 1;
    }

    public static areCellsEquals(a: IPosition, b: IPosition): boolean {
        return a.x === b.x && a.y === b.y;
    }

    public static getDistance(a: IPosition, b: IPosition): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    public clearVisitedCells() {
        this.visitedCells = [];
    }

    public searchStartPosition(): IPosition {
        return this.getPosition(0);
    }

    public searchLongestWay(index: number): IPathNode[] {
        let result: IPathNode[] = [];

        let availablePositions = this.grid
            .map((value, index) => ({value, index}))
            .filter(({value, index}) => value === CellTypeEnum.SEA && !this.visitedCells.includes(index))
            .map(({value, index}) => index);

        let path: IPathNode[] = [];
        path.push({index, position: this.getPosition(index)});

        do {
            let currentPathNode = path[path.length - 1];

            if (currentPathNode.paths == null) {
                currentPathNode.paths = MOVE_STRATEGIES
                    .map(strategy => {
                        const position = Grid.sumCells(currentPathNode.position, strategy.move);
                        return {index: this.getGridIndex(position), position, direction: strategy.direction}
                    })
                    .filter(strategy => this.isValidCell(strategy.position) && this.grid[strategy.index] === CellTypeEnum.SEA && availablePositions.includes(strategy.index));
            }

            if (currentPathNode.paths.length > 0) {
                const newPath = currentPathNode.paths.pop();
                availablePositions = availablePositions.filter(i => i !== newPath.index);
                currentPathNode.direction = newPath.direction;
                path.push({index: newPath.index, position: newPath.position});
            } else {
                if (path.length > result.length) {
                    result = path.map(node => ({
                        index: node.index,
                        position: node.position,
                        direction: node.direction
                    }));
                }
                availablePositions.push(path.pop().index);
            }
        }
        while (path.length > 0 && result.length < 25);

        return result;
    }

    public getGridIndex({x, y}: IPosition): number {
        return y * this.width + x;
    }

    public isSeaCell(position: IPosition): boolean {
        let result = false;
        if (this.isValidCell(position)) {
            const index = this.getGridIndex(position);
            result = this.grid[index] === CellTypeEnum.SEA;
        }
        return result;
    }

    public isAvailableCell(position: IPosition): boolean {
        let result = false;
        if (this.isValidCell(position)) {
            const index = this.getGridIndex(position);
            result = this.grid[index] === CellTypeEnum.SEA && !this.visitedCells.includes(index)
        }
        return result;
    }

    public getSeaCells(): IPosition[] {
        return this.grid
            .map((_v, i) => this.getPosition(i))
            .filter(p => this.isSeaCell(p));
    }

    public isValidCell({x, y}: IPosition): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    public isValidCellFromIndex(index: number): boolean {
        return index >= 0 && index < this.grid.length;
    }

    public runAway({x, y}: IPosition): IPosition {
        return {x: Math.abs(x - this.width), y: Math.abs(y - this.height)}
    }

    public getPosition(index: number): IPosition {
        return {x: (index) % this.width, y: Math.floor(index / this.width)}
    }
}

function getPower(turn: number, cooldown: ICooldown): string {
    if (cooldown.torpedo > 0) {
        return CommandEnum.TORPEDO;
    } else if (cooldown.sonar > 0 && (turn % 3 > 0)) {
        return CommandEnum.SONAR;
    } else if (cooldown.silence > 0 && (turn % 3 === 0)) {
        return CommandEnum.SILENCE;
    } else {
        return CommandEnum.MINE;
    }
}

/**
 * Auto-generated code below aims at helping you parse
 * the standard input according to the problem statement.
 **/

var inputs: string[] = readline().split(' ');
const width: number = parseInt(inputs[0]);
const height: number = parseInt(inputs[1]);
const myId: number = parseInt(inputs[2]);
let tmpGrid: string[] = [];
for (let i = 0; i < height; i++) {
    tmpGrid = [...tmpGrid, ...readline().split('')];
}
const grid = new Grid(width, height, tmpGrid);
// console.error({width, height, tmpGrid});

let turn = 0;
let mines: IPosition[] = [];
let opponentPosition: IPosition;
let opponentMoves: IPosition[] = [{x: 0, y: 0}];
let opponentStartPositions: IPosition[] = [];
let opponentCurrentPositions: { position: IPosition, surface?: number }[] = [];

let target: IPosition;

opponentStartPositions = grid.getSeaCells();

let myPosition: IPosition;
do {
    myPosition = {
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height)
    };
} while (!grid.isSeaCell(myPosition));
console.log(`${myPosition.x} ${myPosition.y}`);

// console.error('opponentStartPositions length:', opponentStartPositions.length);

let checkSurface: number = undefined;
let opponentInSurface: number = undefined;
let opponentNotInSurface: number = undefined;

// game loop
while (true) {
    var inputs: string[] = readline().split(' ');
    myPosition = {x: parseInt(inputs[0]), y: parseInt(inputs[1])};
    const myLife: number = parseInt(inputs[2]);
    const oppLife: number = parseInt(inputs[3]);
    const cooldown: ICooldown = {
        torpedo: parseInt(inputs[4]),
        sonar: parseInt(inputs[5]),
        mine: parseInt(inputs[7]),
        silence: parseInt(inputs[6]),
    };
    const sonarResult: string = readline();
    const opponentOrders: string[] = readline().split('|');

    if (checkSurface && sonarResult !== 'NA') {
        switch (sonarResult) {
            case 'Y':
                opponentInSurface = checkSurface;
                opponentNotInSurface = undefined;
                break;
            case 'N':
                opponentNotInSurface = checkSurface;
                opponentInSurface = undefined;
                break;
            default:
                opponentInSurface = undefined;
                opponentNotInSurface = undefined;
                break;
        }
        checkSurface = undefined;
    } else {
        opponentInSurface = undefined;
        opponentNotInSurface = undefined;
    }

    if (opponentInSurface) {
        opponentStartPositions = opponentStartPositions.filter(
            startPosition => opponentMoves.some(opponentMove =>
                opponentInSurface === Grid.getSurface(Grid.sumCells(opponentMove, startPosition))
            ));
        opponentMoves = opponentMoves.filter(
            opponentMove => opponentStartPositions.every(startPosition =>
                opponentInSurface === Grid.getSurface(Grid.sumCells(opponentMove, startPosition))
            ));
    } else if (opponentNotInSurface) {
        opponentStartPositions = opponentStartPositions.filter(
            startPosition => opponentMoves.some(opponentMove =>
                opponentNotInSurface !== Grid.getSurface(Grid.sumCells(opponentMove, startPosition))
            ));
        opponentMoves = opponentMoves.filter(
            opponentMove => opponentStartPositions.every(startPosition =>
                opponentNotInSurface !== Grid.getSurface(Grid.sumCells(opponentMove, startPosition))
            ));
    }

    console.error({myLife, oppLife, cooldown, sonarResult, opponentOrders});

    grid.currentCell = myPosition;
    // console.error({myPositions});

    let oppMoveOrder = opponentOrders.find(order => order.includes(CommandEnum.MOVE));
    let oppSurfaceOrder = opponentOrders.find(order => order.includes(CommandEnum.SURFACE));
    let oppSonarOrder = opponentOrders.find(order => order.includes(CommandEnum.SONAR));
    let oppSilenceOrder = opponentOrders.find(order => order.includes(CommandEnum.SILENCE));
    if (oppMoveOrder) {
        const opponentMoveDirection = oppMoveOrder.split(' ')[1];
        let moveStrategy = MOVE_STRATEGIES.find(strategy => strategy.direction === opponentMoveDirection);
        opponentMoves = opponentMoves
            .map(opponentMove => Grid.sumCells(moveStrategy.move, opponentMove))
            .filter(opponentMove => grid.isValidCell({x: Math.abs(opponentMove.x), y: Math.abs(opponentMove.y)}));
    } else if (oppSurfaceOrder) {
        opponentInSurface = parseInt(oppSurfaceOrder.split(' ')[1]);
        opponentStartPositions = opponentStartPositions.filter(
            startPosition => opponentMoves.some(opponentMove =>
                opponentInSurface === Grid.getSurface(Grid.sumCells(opponentMove, startPosition))
            ));
        opponentMoves = opponentMoves.filter(
            opponentMove => opponentStartPositions.every(startPosition =>
                opponentInSurface === Grid.getSurface(Grid.sumCells(opponentMove, startPosition))
            ));
    } else if (oppSilenceOrder) {
        opponentMoves = opponentMoves
            .map(opponentMove =>
                MOVE_STRATEGIES.map(strategy => {
                    let newMoves: IPosition[] = [];
                    for (let length = 1; length <= 4; length++) {
                        newMoves.push((Grid.sumCells(opponentMove, Grid.multiply(strategy.move, length))))
                    }
                    return newMoves;
                }).reduce((acc, cur) => [...acc, ...cur], [])
            )
            .reduce((acc, cur) => [...acc, ...cur], [])
            .filter(opponentMove =>
                opponentStartPositions.some(
                    startPosition => grid.isSeaCell(Grid.sumCells(opponentMove, startPosition))));

        opponentMoves = Grid.removeDuplicate(opponentMoves);

        console.error(opponentMoves.length);
    } else if (oppSonarOrder) {
        const surface = parseInt(oppSonarOrder.split(' ')[1]);
        const mySurface = Grid.getSurface(myPosition);
        // TODO: escape???
        if (surface === mySurface) {
            target = grid.runAway(myPosition);
        }
    }

    if (opponentStartPositions.length > 1) {
        opponentStartPositions = opponentStartPositions
            .filter((initPos) => opponentMoves.some(pos => grid.isSeaCell(Grid.sumCells(initPos, pos))));
    }

    opponentCurrentPositions = Grid.removeDuplicate(opponentStartPositions
        .map(startPosition => opponentMoves
            .map(opponentMove => Grid.sumCells(opponentMove, startPosition)))
        .reduce((acc, cur) => [...acc, ...cur], []))
        .filter(position => grid.isSeaCell(position))
        .map(position => {
            const surface = Grid.getSurface(position);
            return ({position, surface})
        });

    let oppTorpedoOrder = opponentOrders.find(order => order.includes(CommandEnum.TORPEDO));
    if (oppTorpedoOrder) {
        const tmp = oppTorpedoOrder.split(' ');
        const torpedoPosition = {x: parseInt(oppTorpedoOrder[1]), y: parseInt(oppTorpedoOrder[2])};
        opponentCurrentPositions = opponentCurrentPositions.filter(
            oppPosition => Grid.getDistance(oppPosition.position, torpedoPosition) <= 4
        )
    }

    console.error({opponentStartPositions, length: opponentStartPositions.length});
    console.error({opponentMoves});
    console.error({opponentCurrentPositions: JSON.stringify(opponentCurrentPositions)});

    if (opponentCurrentPositions.length > 1) {
        const {min, max} = opponentCurrentPositions.reduce<{ min?: IPosition, max?: IPosition }>(
            (acc, cur) => {
                acc.min = acc.min ? {
                    x: Math.min(acc.min.x, cur.position.x),
                    y: Math.min(acc.min.y, cur.position.y)
                } : cur.position;
                acc.max = acc.max ? {
                    x: Math.max(acc.min.x, cur.position.x),
                    y: Math.max(acc.min.y, cur.position.y)
                } : cur.position;
                return acc;
            }, {}
        );

        if ((max.x - min.x < 4) && (max.y - min.y < 4)) {
            opponentPosition = {x: Math.floor((min.x + max.x) / 2), y: Math.floor((min.y + max.y) / 2)}
        } else if (cooldown.sonar === 0) {
            opponentPosition = undefined;
            const surfaces = Array.from((opponentCurrentPositions.reduce((acc, cur) => {
                const curSurface = cur.surface;
                const counter = (acc.get(curSurface) || 0) + 1;
                return acc.set(curSurface, counter);
            }, new Map<number, number>())).entries())
                .sort((a, b) => b[1] - a[1]);
            checkSurface = (surfaces.length > 1) ? surfaces[0][0] : undefined;
        }
    } else if (opponentCurrentPositions.length === 1) {
        opponentPosition = opponentCurrentPositions[0].position;
    }

    const path = grid.searchLongestWay(grid.getGridIndex(myPosition));
    let actions = [];

    if (opponentPosition) {
        mines = mines.filter(m => {
            const result = Grid.getDistance(m, opponentPosition) <= 2 && Grid.getDistance(m, myPosition) > 2;
            if (result) {
                actions.push(`${CommandEnum.TRIGGER} ${m.x} ${m.y}`);
            }
            return result;
        });
    }

// console.error({strategies, myPositions});

    if (path.length === 0 || !path[0].direction) {
        actions.push(CommandEnum.SURFACE);
        grid.clearVisitedCells();
    } else {
        if (opponentPosition) {
            if (Grid.getDistance(myPosition, opponentPosition) >= 4) {
                target = opponentPosition;
            } else {
                target = grid.runAway(opponentPosition);
            }

            const distanceWithOpponentPosition = Grid.getDistance(myPosition, opponentPosition);
            if (distanceWithOpponentPosition > 2 && distanceWithOpponentPosition <= 4 && cooldown.torpedo === 0) {
                // TODO: Check ISLAND
                actions.push(`${CommandEnum.TORPEDO} ${opponentPosition.x} ${opponentPosition.y}`);
            }
        }

        if (cooldown.mine === 0) {
            actions.push(`${CommandEnum.MINE} ${path[0].direction}`);
            mines.push(myPosition);
        }

        if (cooldown.silence === 0) {
            let strategy = MOVE_STRATEGIES.find(s => s.direction === path[0].direction);

            let length = 0;
            let tmpCell = Grid.sumCells(myPosition, strategy.move);
            while (grid.isAvailableCell(tmpCell) && length < 4) {
                grid.currentCell = tmpCell;
                length++;
                tmpCell = Grid.sumCells(tmpCell, strategy.move);
            }
            actions.push(`${CommandEnum.SILENCE} ${path[0].direction} ${length}`);
        } else {
            const power = getPower(turn, cooldown);
            actions.push(`${CommandEnum.MOVE} ${path[0].direction}${power ? ' ' + power : ''}`);
        }

        if (checkSurface) {
            actions.push(`${CommandEnum.SONAR} ${checkSurface}`)
        }
    }


// console.error({inputs, sonarResult, opponentOrders});


// Write an action using console.log()
// To debug: console.error('Debug messages...');
    turn++;
//    console.error({actions});
    console.log(actions.join('|'));
}