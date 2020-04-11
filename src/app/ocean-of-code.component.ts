import {STYLE} from "./ocean-of-code.component.style";
import {Grid} from "./services/grid.class";
import {GRID_PROPERTIES} from "./GRID_PROPERTIES";
import {Cell, CellTypeEnum} from "./services/cell.class";
import {PathFinder} from "./services/path-finder.class";
import {IPathNode} from "./services/our-submarine.class";
import {PathResolver} from "./services/path-resolver.class";
import {OrderEnum} from "./services/submarine.class";

export class OceanOfCodeComponent extends HTMLElement {
    public static readonly MARGE = 6;
    private readonly TEXT_COLOR = "#000";
    private readonly SURFACE_COLOR = "#fffff";
    private readonly POSITIONS_LINE_COLOR = this.TEXT_COLOR;
    private readonly STARTS_LINE_COLOR = 'red';
    private readonly VISITED_CELLS_LINE_COLOR = "green";
    private readonly LINE_COLOR = "#c8e0ff";
    private readonly SEA_COLOR = "#569dfa";
    private readonly ISLAND_COLOR = "#FFC107";
    private shadow: ShadowRoot;
    private canvas: HTMLCanvasElement;
    private canvasCtx: CanvasRenderingContext2D;
    private cellSize: number;
    private grid: Grid;
    private pathFinder: PathFinder;
    private path: IPathNode[];
    private pathResolver: PathResolver;
    private timeoutId: number | undefined;
    private speed = 10;
    private pathIndex = 0;

    constructor() {
        super();
        const tmpGrid = GRID_PROPERTIES.grid.replace(/\n|\r/gm, '').split('');
        this.grid = new Grid(GRID_PROPERTIES.width, GRID_PROPERTIES.height, tmpGrid);
        this.init();
        window.addEventListener('resize', () => this.resize());
        this.resize();

        this.pathFinder = new PathFinder(this.grid);
        this.initResolver();

        window.onkeydown = (event: KeyboardEvent) => {
            switch (event.code) {
                case "Delete":
                    this.initResolver();
                    this.draw();
                    break;
                case "Space":
                    if (this.timeoutId) {
                        clearTimeout(this.timeoutId);
                        this.timeoutId = undefined;
                    } else {
                        // @ts-ignore
                        this.timeoutId = setTimeout(() => this.draw(), this.speed);
                    }
                    break;
                case "ArrowUp":
                    if (this.timeoutId) {
                        clearTimeout(this.timeoutId);
                        this.timeoutId = undefined;
                    }
                    this.pathIndex++;
                    this.draw();
                    break;
            }
        }
    }

    public searchPath() {
        let result = this.pathFinder.searchStartCell();
        this.path = result ? result.path : [];
        this.draw();
    }

    private init() {
        this.shadow = this.attachShadow({mode: 'open'});
        const container = document.createElement('div');
        container.classList.add('container');

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
        this.canvasCtx.clearRect(0, 0,
            this.canvas.width + OceanOfCodeComponent.MARGE,
            this.canvas.height + OceanOfCodeComponent.MARGE);
    }

    private drawGrid() {
        this.drawOcean();
        this.drawSurfaceLines();
        this.drawIslands();

        if (this.pathFinder.history && this.pathIndex < this.pathFinder.history.length) {
            if (this.path && this.path.length > 0) {
                if (this.path.length % 8 === 0) {
                    this.pathResolver.applyOrders([{
                        type: OrderEnum.SILENCE,
                        order: {}
                    }], 0)
                }
                const direction = this.path[this.path.length - 1].direction;
                if (direction) {
                    const start = performance.now();

                    this.pathResolver.applyOrders([{
                        type: OrderEnum.MOVE,
                        order: {direction}
                    }], 0);
                    const end = performance.now();
                    const duration = end - start;
                    console.log(this.path.length, duration, this.pathResolver.getPositionsStats());
                }
            }
            this.path = this.pathFinder.history[this.pathIndex]; // this.pathFinder.history.shift();
            this.drawNodes();

            const {cells, starts, visitedCells} = this.pathResolver.getPositionsStats();

            this.strokeCells(starts, this.STARTS_LINE_COLOR, 0);
            this.drawPositionCells(cells);
            this.drawVisitedCells(visitedCells);

            if (this.timeoutId && this.pathIndex < this.pathFinder.history.length) {
                this.pathIndex++;
                // @ts-ignore
                this.timeoutId = setTimeout(() => this.draw(), this.speed);
            }
        } else {
            this.drawNodes();
        }
    }

    private drawNodes() {
        if (this.path) {
            this.path.forEach((node, index) => this.drawPathNode(index, node.cell));
        }
    }

    private initResolver() {
        const {path} = this.pathFinder.searchStartCell();
        this.path = path; // this.pathFinder.searchLongestPath(position);
        this.pathFinder.history = this.path.map((pathNode, index, array) => {
            return array.slice(0, index).map(p => ({cell: p.cell, direction: p.direction}));
        });
        this.pathResolver = new PathResolver(this.grid, () => {
        });
        this.pathIndex = 0;
        this.path = this.pathFinder.history[this.pathIndex];
    }

    private drawVisitedCells(visitedCells: Map<Cell, number>) {
        Array.from(visitedCells.entries()).forEach(([cell, counter]) => {
            const color = this.VISITED_CELLS_LINE_COLOR;
            this.canvasCtx.font = "0.70em Arial";
            this.canvasCtx.fillStyle = color;
            this.canvasCtx.textAlign = "center";
            this.canvasCtx.textBaseline = 'middle';
            this.canvasCtx.fillText(counter !== undefined ? counter.toString() : '-',
                OceanOfCodeComponent.MARGE + cell.x * this.cellSize + this.cellSize / 4,
                OceanOfCodeComponent.MARGE + cell.y * this.cellSize + this.cellSize / 2 + this.cellSize / 4,
                this.cellSize / 2);

            this.strokeCell(cell, color, 4)
        })
    }

    private drawPositionCells(positions: Map<Cell, number>) {
        Array.from(positions.entries()).forEach(([cell, counter]) => {
            const color = this.POSITIONS_LINE_COLOR;
            this.canvasCtx.font = "0.70em Arial";
            this.canvasCtx.fillStyle = color;
            this.canvasCtx.textAlign = "center";
            this.canvasCtx.textBaseline = 'middle';
            this.canvasCtx.fillText(counter !== undefined ? counter.toString() : '-',
                OceanOfCodeComponent.MARGE + cell.x * this.cellSize + this.cellSize / 2 + this.cellSize / 4,
                OceanOfCodeComponent.MARGE + cell.y * this.cellSize + this.cellSize / 2 + this.cellSize / 4,
                this.cellSize / 2);

            this.strokeCell(cell, color, 2)
        })
    }

    private drawOcean() {
        // DRAW OCEAN
        this.canvasCtx.fillStyle = this.SEA_COLOR;
        this.canvasCtx.fillRect(
            OceanOfCodeComponent.MARGE,
            OceanOfCodeComponent.MARGE,
            this.cellSize * this.grid.width,
            this.cellSize * this.grid.height);

        this.drawOceanLines();
    }

    private drawOceanLines() {
        // DRAW LINE
        this.canvasCtx.beginPath();
        this.canvasCtx.lineWidth = 1;
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
    }

    private strokeCells(cells: Cell[], color: string, resize: number = 0) {
        cells.forEach(cell => this.strokeCell(cell, color, resize))
    }

    private drawSurfaceLines() {
        // DRAW SURFACE LINE
        this.canvasCtx.beginPath();
        this.canvasCtx.lineWidth = 2;
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
    }

    private drawIslands() {
        // DRAW ISLAND
        this.grid.cells
            .filter(cell => cell.type === CellTypeEnum.ISLAND)
            .forEach(cell => this.fillCell(cell, this.ISLAND_COLOR));
    }

    private drawPathNode(value: any, cell: Cell) {
        if (cell) {
            const color = `rgb(${255 - Number.parseInt(value)},${255 - Number.parseInt(value)},255)`;
            this.fillCell(cell, color);
            this.canvasCtx.font = "1em Arial";
            this.canvasCtx.fillStyle = this.TEXT_COLOR;
            this.canvasCtx.textAlign = "center";
            this.canvasCtx.textBaseline = 'middle';
            this.canvasCtx.fillText(value !== undefined ? value.toString() : '-',
                OceanOfCodeComponent.MARGE + cell.x * this.cellSize + this.cellSize / 2,
                OceanOfCodeComponent.MARGE + cell.y * this.cellSize + this.cellSize / 3,
                this.cellSize);
        }
    }

    private strokeCell(cell: Cell, color: string, resize: number = 0) {
        this.canvasCtx.strokeStyle = color;
        this.canvasCtx.strokeRect(
            OceanOfCodeComponent.MARGE + cell.x * this.cellSize + resize,
            OceanOfCodeComponent.MARGE + cell.y * this.cellSize + resize,
            this.cellSize - resize * 2,
            this.cellSize - resize * 2);
    }

    private fillCell(cell: Cell, color: string) {
        this.canvasCtx.fillStyle = color;
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

        if (position) {
            this.pathFinder.history = undefined;
            //this.pathFinder.defineStrategiesOrder(position);
            //this.path = this.pathFinder.getMoveStrategies(position);
            this.path = this.pathFinder.searchLongestPath(position);
            //this.area = this.grid.getDangerArea(position.coordinate).map(cell=>({cell, pathLength: position.pathLength(cell)}));

            this.draw();
        }
    }
}
