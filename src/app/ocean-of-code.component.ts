import {STYLE} from "./ocean-of-code.component.style";
import {Grid} from "./services/grid.class";
import {GRID_PROPERTIES} from "./GRID_PROPERTIES";
import {Cell, CellTypeEnum} from "./services/cell.class";
import {DirectionEnum, PathFinder} from "./services/path-finder.class";
import {IPathNode} from "./services/our-submarine.class";

export class OceanOfCodeComponent extends HTMLElement {
    public static readonly MARGE = 6;
    private readonly TEXT_COLOR = "#000";
    private readonly SURFACE_COLOR = "#fffff";
    private readonly LINE_COLOR = "#c8e0ff";
    private readonly SEA_COLOR = "#569dfa";
    private readonly ISLAND_COLOR = "#FFC107";
    private shadow: ShadowRoot;
    private canvas: HTMLCanvasElement;
    private canvasCtx: CanvasRenderingContext2D;
    private cellSize: number;
    private grid: Grid;
    private stats: Array<{ cell: Cell, stat: number }>;
    private pathFinder: PathFinder;
    private path: IPathNode[];
    private area: Array<{ cell: Cell, pathLength: number }>;

    constructor() {
        super();
        const tmpGrid = GRID_PROPERTIES.grid.replace(/\n|\r/gm, '').split('');
        this.grid = new Grid(GRID_PROPERTIES.width, GRID_PROPERTIES.height, tmpGrid);
        this.stats = this.grid.cells.map(cell => ({cell, stat: cell.type === CellTypeEnum.SEA ? 0 : -1}));
        this.init();
        window.addEventListener('resize', () => this.resize());
        this.resize();

        this.pathFinder = new PathFinder(this.grid);

        window.onkeydown = (event: KeyboardEvent) => {
            switch (event.key) {
                case "Delete":
                    this.stats = this.grid.cells.map(cell => ({cell, stat: cell.type === CellTypeEnum.SEA ? 0 : -1}));
                    this.draw();
                    break;
                /**
                 case "ArrowUp":
                 this.goto(DirectionEnum.NORTH);
                 break;
                 case "ArrowDown":
                 this.goto(DirectionEnum.SOUTH);
                 break;
                 case "ArrowLeft":
                 this.goto(DirectionEnum.WEST);
                 break;
                 case "ArrowRight":
                 this.goto(DirectionEnum.EST);
                 break;
                 **/
            }
        }
    }

    public searchPath() {
        let result = this.pathFinder.searchStartCell();
        this.path = result ? result.path : [];
        this.draw();
    }

    public goto(direction: DirectionEnum): void {
        const max = this.stats.reduce((max, cur) => Math.max(max, cur.stat), 0);
        const candidates = this.stats.filter(stat => stat.stat === max);

        switch (direction) {
            case DirectionEnum.NORTH:
                candidates.forEach(stat => {
                    const northCell = this.grid.getNorthCell(stat.cell);
                    if (northCell && this.grid.isAvailableCell(northCell)) {
                        this.stats[northCell.index].stat = max + 1;
                    }
                    return stat;
                });
                break;
            case DirectionEnum.EST:
                candidates.forEach(stat => {
                    const estCell = this.grid.getEstCell(stat.cell);
                    if (estCell && this.grid.isAvailableCell(estCell)) {
                        this.stats[estCell.index].stat = max + 1;
                    }
                    return stat;
                });
                break;
            case DirectionEnum.SOUTH:
                candidates.forEach(stat => {
                    const southCell = this.grid.getSouthCell(stat.cell);
                    if (southCell && this.grid.isAvailableCell(southCell)) {
                        this.stats[southCell.index].stat = max + 1;
                    }
                    return stat;
                });
                break;
            case DirectionEnum.WEST:
                candidates.forEach(stat => {
                    const westCell = this.grid.getWestCell(stat.cell);
                    if (westCell && this.grid.isAvailableCell(westCell)) {
                        this.stats[westCell.index].stat = max + 1;
                    }
                    return stat;
                });
                break;
            default:
                break
        }
        this.draw();
    }

    private init() {
        this.shadow = this.attachShadow({mode: 'open'});
        const container = document.createElement('div');
        container.classList.add('container');

        const toolbar = document.createElement('div');
        toolbar.classList.add('toolbar');

        const directionButtons = document.createElement('div');
        directionButtons.classList.add('buttons');
        directionButtons.style.marginBottom = '10px';

        const leftButton = document.createElement('button');
        leftButton.textContent = 'West';
        leftButton.onclick = () => this.goto(DirectionEnum.WEST);
        directionButtons.appendChild(leftButton);

        const middleButtons = document.createElement('div');
        middleButtons.classList.add('middle-buttons');

        const upButton = document.createElement('button');
        upButton.textContent = 'North';
        upButton.onclick = () => this.goto(DirectionEnum.NORTH);
        middleButtons.appendChild(upButton);

        const downButton = document.createElement('button');
        downButton.textContent = 'South';
        downButton.onclick = () => this.goto(DirectionEnum.SOUTH);
        middleButtons.appendChild(downButton);

        directionButtons.appendChild(middleButtons);

        const rightButton = document.createElement('button');
        rightButton.textContent = 'Est';
        rightButton.onclick = () => this.goto(DirectionEnum.EST);
        directionButtons.appendChild(rightButton);

        toolbar.appendChild(directionButtons);

        const searchPathButton = document.createElement('button');
        searchPathButton.textContent = 'Search path';
        searchPathButton.onclick = () => this.searchPath();

        toolbar.appendChild(searchPathButton);

        container.appendChild(toolbar);

        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('draw-zone');
        this.canvas.onclick = (event: MouseEvent) => this.selectCell(event);
        this.canvasCtx = this.canvas.getContext('2d');

        container.appendChild((this.canvas));

        const style = document.createElement('style');

        style.textContent = STYLE;

        this.shadow.appendChild(style);
        this.shadow.appendChild(container);
    }

    private resize() {
        this.canvas.width = 0;
        this.canvas.height = 0;
        setTimeout(
            () => {
                this.cellSize = Math.floor((this.canvas.offsetWidth / this.grid.width > this.canvas.offsetHeight / this.grid.height) ?
                    this.canvas.offsetHeight / this.grid.height : this.canvas.offsetWidth / this.grid.width);
                this.canvas.width = this.canvas.offsetWidth;
                this.canvas.height = this.canvas.offsetHeight;
                this.draw();
            }, 100
        )
    }

    private draw() {
        this.clear();
        this.drawGrid();
    }

    private clear() {
        this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private drawGrid() {
        // DRAW OCEAN
        this.canvasCtx.fillStyle = this.SEA_COLOR;
        this.canvasCtx.fillRect(
            OceanOfCodeComponent.MARGE,
            OceanOfCodeComponent.MARGE,
            this.cellSize * this.grid.width,
            this.cellSize * this.grid.height);

        // DRAW LINE
        this.canvasCtx.beginPath();
        this.canvasCtx.strokeStyle = this.LINE_COLOR;

        for (let i = 0; i <= this.grid.width; i++) {
            if (i % 5 !== 0) {
                this.canvasCtx.moveTo(i * this.cellSize + OceanOfCodeComponent.MARGE, OceanOfCodeComponent.MARGE);
                this.canvasCtx.lineTo(i * this.cellSize + OceanOfCodeComponent.MARGE, this.cellSize * this.grid.height + OceanOfCodeComponent.MARGE);

                this.canvasCtx.moveTo(OceanOfCodeComponent.MARGE, i * this.cellSize + OceanOfCodeComponent.MARGE);
                this.canvasCtx.lineTo(this.cellSize * this.grid.width + OceanOfCodeComponent.MARGE, i * this.cellSize + OceanOfCodeComponent.MARGE);

            }
        }
        this.canvasCtx.stroke();
        this.canvasCtx.closePath();

        // DRAW SURFACE LINE
        this.canvasCtx.lineWidth = 2;
        this.canvasCtx.beginPath();
        this.canvasCtx.strokeStyle = this.SURFACE_COLOR;
        for (let i = 0; i <= this.grid.width; i++) {
            if (i % 5 === 0) {
                this.canvasCtx.moveTo(i * this.cellSize + OceanOfCodeComponent.MARGE, OceanOfCodeComponent.MARGE);
                this.canvasCtx.lineTo(i * this.cellSize + OceanOfCodeComponent.MARGE, this.cellSize * this.grid.height + OceanOfCodeComponent.MARGE);

                this.canvasCtx.moveTo(OceanOfCodeComponent.MARGE, i * this.cellSize + OceanOfCodeComponent.MARGE);
                this.canvasCtx.lineTo(this.cellSize * this.grid.width + OceanOfCodeComponent.MARGE, i * this.cellSize + OceanOfCodeComponent.MARGE);
            }
        }
        this.canvasCtx.stroke();
        this.canvasCtx.closePath();

        // DRAW ISLAND
        this.grid.cells
            .filter(cell => cell.type === CellTypeEnum.ISLAND)
            .forEach(cell => this.drawIsland(cell));

        if (this.path) {
            this.path.forEach((node, index) => this.drawText(index, node.cell))
        } else if (this.area) {
            this.area.forEach((area, index) => this.drawText(area.pathLength, area.cell))
        } else {
            this.stats.forEach(stat => this.drawText(stat.stat, stat.cell));
        }
    }

    private drawText(value: any, cell: Cell) {
        if (cell) {
            this.canvasCtx.font = "1em Arial";
            this.canvasCtx.fillStyle = this.TEXT_COLOR;
            this.canvasCtx.textAlign = "center";
            this.canvasCtx.textBaseline = 'middle';
            this.canvasCtx.fillText(value !== undefined ? value.toString() : '-',
                OceanOfCodeComponent.MARGE + cell.x * this.cellSize + this.cellSize / 2,
                OceanOfCodeComponent.MARGE + cell.y * this.cellSize + this.cellSize / 2,
                this.cellSize);
        }
    }

    private drawIsland(cell: Cell) {
        this.canvasCtx.fillStyle = this.ISLAND_COLOR;
        this.canvasCtx.fillRect(
            OceanOfCodeComponent.MARGE + cell.x * this.cellSize,
            OceanOfCodeComponent.MARGE + cell.y * this.cellSize,
            this.cellSize,
            this.cellSize);
    }

    private selectCell(event: MouseEvent) {
        const x = Math.floor((event.offsetX - OceanOfCodeComponent.MARGE) / this.cellSize);
        const y = Math.floor((event.offsetY - OceanOfCodeComponent.MARGE) / this.cellSize);
        const position = this.grid.getCellFromCoordinate({x, y});

        //this.pathFinder.defineStrategiesOrder(position);
        //this.path = this.pathFinder.getMoveStrategies(position);
        this.path = this.pathFinder.searchLongestPath(position);
        //this.area = this.grid.getDangerArea(position.coordinate).map(cell=>({cell, pathLength: position.pathLength(cell)}));

        this.draw();
    }
}
