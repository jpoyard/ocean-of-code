import {Grid} from "./grid.class";
import {OurSubmarine} from "./our-submarine.class";
import {OpponentSubmarine} from "./opponent-submarine.class";

function log(...args) {
    console.error(...args);
}

var inputs: string[] = readline().split(' ');
const width: number = parseInt(inputs[0]);
const height: number = parseInt(inputs[1]);
const myId: number = parseInt(inputs[2]);
let tmpGrid: string[] = [];
for (let i = 0; i < height; i++) {
    tmpGrid = [...tmpGrid, ...readline().split('')];
}
const grid = new Grid(width, height, tmpGrid);
const opponentSubmarine = new OpponentSubmarine(myId === 0 ? 1 : 0, grid, log);
const ourSubmarine = new OurSubmarine(myId, grid, opponentSubmarine);

let position = ourSubmarine.searchStartCell();

console.log(`${position.coordinate.x} ${position.coordinate.y}`);

// game loop
while (true) {
    let inputs: string[] = readline().split(' ');
    ourSubmarine.setPosition(parseInt(inputs[0]), parseInt(inputs[1]));
    ourSubmarine.life = parseInt(inputs[2]);
    ourSubmarine.setCooldown(
        parseInt(inputs[4]), parseInt(inputs[5]), parseInt(inputs[7]), parseInt(inputs[6])
    );
    ourSubmarine.sonarResult = readline();

    // Should update positions
    opponentSubmarine.life = parseInt(inputs[3]);
    ourSubmarine.updateOpponentPosition();

    opponentSubmarine.setOrders(readline().split('|'));

    console.log(ourSubmarine.getActions()
        .sort((a, b) => a.priority - b.priority)
        .map(a => a.order).join('|'));
}

