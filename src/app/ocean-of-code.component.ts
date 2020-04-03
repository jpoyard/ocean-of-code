import {STYLE} from "./ocean-of-code.component.style";
import {Grid} from "./services/grid.class";
import {GRID_PROPERTIES} from "./GRID_PROPERTIES";
import {Cell, CellTypeEnum} from "./services/cell.class";
import {DirectionEnum} from "./services/submarine.class";

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

    constructor() {
        super();
        const tmpGrid = GRID_PROPERTIES.grid.replace(/\n|\r/gm, '').split('');
        this.grid = new Grid(GRID_PROPERTIES.width, GRID_PROPERTIES.height, tmpGrid);
        this.stats = this.grid.cells.map(cell => ({cell, stat: cell.type === CellTypeEnum.SEA ? 0 : -1}));
        this.init();
        window.addEventListener('resize', () => this.resize());
        this.resize();

        window.onkeydown = (event: KeyboardEvent) => {
         console.info(event.key)
            switch (event.key) {
                case "Delete":
                    this.stats = this.grid.cells.map(cell => ({cell, stat: cell.type === CellTypeEnum.SEA ? 0 : -1}));
                    this.draw();
                    break;
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
            }
        }
    }

    public goto(direction: DirectionEnum): void {
        const max = this.stats.reduce((max, cur) => Math.max(max, cur.stat), 0);
        const candidates = this.stats.filter(stat => stat.stat === max);
        switch (direction) {
            case DirectionEnum.NORTH:
                candidates.forEach(stat => {
                    const index = this.grid.getIndex({x: stat.cell.coordinate.x, y: stat.cell.coordinate.y+1});
                    if (candidates.find(c => c.cell.index === index) && this.grid.isIndexValid(index) && this.grid.isAvailableCell(this.grid.getCell(index))) {
                        stat.stat++;
                    }
                    return stat;
                });
                break;
            case DirectionEnum.EST:
                candidates.forEach(stat => {
                    const index = this.grid.getIndex({x: stat.cell.coordinate.x + 1, y: stat.cell.coordinate.y});
                    if (candidates.find(c => c.cell.index === index) && this.grid.isIndexValid(index) && this.grid.isAvailableCell(this.grid.getCell(index))) {
                        stat.stat++;
                    }
                    return stat;
                });
                break;
            case DirectionEnum.SOUTH:
                candidates.forEach(stat => {
                    const index = this.grid.getIndex({x: stat.cell.coordinate.x, y: stat.cell.coordinate.y + 1});
                    if (candidates.find(c => c.cell.index === index) && this.grid.isIndexValid(index) && this.grid.isAvailableCell(this.grid.getCell(index))) {
                        stat.stat++;
                    }
                    return stat;
                });
                break;
            case DirectionEnum.WEST:
                candidates.forEach(stat => {
                    const index = this.grid.getIndex({x: stat.cell.coordinate.x - 1, y: stat.cell.coordinate.y});
                    if (candidates.find(c => c.cell.index === index) && this.grid.isIndexValid(index) && this.grid.isAvailableCell(this.grid.getCell(index))) {
                        stat.stat++;
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

        const buttons = document.createElement('div');
        buttons.classList.add('buttons');

        const leftButton = document.createElement('button');
        leftButton.textContent = 'West';
        leftButton.onclick = () => this.goto(DirectionEnum.WEST);
        buttons.appendChild(leftButton);

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

        buttons.appendChild(middleButtons);

        const rightButton = document.createElement('button');
        rightButton.textContent = 'Est';
        rightButton.onclick = () => this.goto(DirectionEnum.EST);
        buttons.appendChild(rightButton);

        toolbar.appendChild(buttons);
        container.appendChild(toolbar);

        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('draw-zone');
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

        this.stats.forEach(stat => this.drawText(stat));
    }

    private drawText({stat, cell}: { stat: number, cell: Cell }) {
        if (cell) {
            this.canvasCtx.font = "1em Arial";
            this.canvasCtx.fillStyle = this.TEXT_COLOR;
            this.canvasCtx.textAlign = "center";
            this.canvasCtx.textBaseline = 'middle';
            this.canvasCtx.fillText(stat.toString(),
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
}
