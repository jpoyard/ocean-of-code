import {STYLE} from "./ocean-of-code.component.style";
import {Grid} from "./services/grid.class";
import {GRID_PROPERTIES} from "./GRID_PROPERTIES";

export class OceanOfCodeComponent extends HTMLElement {
    private readonly LINE_COLOR = "#c8e0ff";
    private readonly SEA_COLOR = "#569dfa";
    private readonly ISLAND_COLOR = "#06e941";
    private shadow: ShadowRoot;
    private canvas: HTMLCanvasElement;
    private canvasCtx: CanvasRenderingContext2D;
    private cellSize: number;
    private grid: Grid;

    constructor() {
        super();
        this.grid = new Grid(GRID_PROPERTIES.width, GRID_PROPERTIES.height, GRID_PROPERTIES.grid.split(''));
        this.init();
        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    private init() {
        this.shadow = this.attachShadow({mode: 'open'});
        const container = document.createElement('div');
        container.classList.add('container');
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

    private draw(path?: number[]) {
        this.clear();
        this.drawGrid();
    }

    private clear() {
        this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private drawGrid() {
        const marge = 6;
        this.canvasCtx.beginPath();

        // DRAW LINE
        this.canvasCtx.strokeStyle = this.LINE_COLOR;
        this.canvasCtx.lineWidth = 2;
        for (let x = 0; x <= this.grid.width; x++) {
            this.canvasCtx.moveTo(x * this.cellSize + marge, 0 + marge);
            this.canvasCtx.lineTo(x * this.cellSize + marge, this.cellSize * this.grid.height + marge)
        }

        for (let y = 0; y <= this.grid.width; y++) {
            this.canvasCtx.moveTo(0 + marge, y * this.cellSize + marge);
            this.canvasCtx.lineTo(this.cellSize * this.grid.width + marge, y * this.cellSize + marge)
        }

        this.canvasCtx.closePath();
        this.canvasCtx.stroke();
    }
}
