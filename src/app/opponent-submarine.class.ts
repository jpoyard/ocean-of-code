import {Grid} from "./grid.class";
import {Submarine} from "./submarine.class";

export class OpponentSubmarine extends Submarine {
    constructor(grid: Grid) {
        super(grid);
    }
}