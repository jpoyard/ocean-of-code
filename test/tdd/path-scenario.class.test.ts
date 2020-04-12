import {PathScenario} from "../../src/app/services/path-scenario.class";
import {Grid} from "../../src/app/services/grid.class";
import {GRID_SAMPLE} from "./grid.mock";

describe(PathScenario.name, () => {

    describe('constructor', () => {
        const scenario = {given: GRID_SAMPLE[0]};
        it('', () => {
            // Given
            const grid = new Grid(scenario.given.width, scenario.given.height, scenario.given.grid);

            // When
            const actual = new PathScenario(grid.cells[0], [grid.cells[0], grid.cells[1]], grid.cells[1]);

            // Then
            expect(actual.start).toStrictEqual(grid.cells[0]);
            expect(actual.visitedCells).toStrictEqual([grid.cells[0], grid.cells[1]]);
            expect(actual.position).toStrictEqual(grid.cells[1]);
        });
    });

    describe('clone', () => {
        const scenario = {given: GRID_SAMPLE[0]};
        it('', () => {
            // Given
            const grid = new Grid(scenario.given.width, scenario.given.height, scenario.given.grid);
            const pathScenario = new PathScenario(grid.cells[0]);
            pathScenario.add(grid.cells[1]);

            // When
            const actual = pathScenario.clone();
            actual.add(grid.cells[2]);

            // Then
            expect(pathScenario).not.toBe(actual);
            expect(pathScenario.start).toStrictEqual(grid.cells[0]);
            expect(pathScenario.visitedCells).toStrictEqual([grid.cells[0], grid.cells[1]]);
            expect(pathScenario.position).toStrictEqual(grid.cells[1]);
            expect(pathScenario.size).toBe(2);

            expect(actual.start).toStrictEqual(grid.cells[0]);
            expect(actual.visitedCells).toStrictEqual([grid.cells[0], grid.cells[1], grid.cells[2]]);
            expect(actual.position).toStrictEqual(grid.cells[2]);
            expect(actual.size).toBe(3);
        });
    });

    describe('visitedCells', () => {
        const scenario = {given: GRID_SAMPLE[0]};
        it('', () => {
            // Given
            const grid = new Grid(scenario.given.width, scenario.given.height, scenario.given.grid);
            const cells = [grid.cells[0], grid.cells[1], grid.cells[2], grid.cells[3]];

            // When
            const actual = new PathScenario(grid.cells[0], cells, cells[cells.length-1]);

            // Then
            expect(actual.visitedCells).toEqual(cells);
        });
    });

    describe('has, add, size', () => {
        const scenario = {given: GRID_SAMPLE[0]};
        it('', () => {
            // Given
            const grid = new Grid(scenario.given.width, scenario.given.height, scenario.given.grid);
            const cells = [grid.cells[0], grid.cells[1], grid.cells[2], grid.cells[3]];

            // When
            const actual = new PathScenario(grid.cells[0]);
            cells.forEach(cell => actual.add(cell));

            // Then
            cells.forEach(cell => expect(actual.has(cell)).toBeTruthy());
            expect(actual.has(grid.cells[4])).toBeFalsy();
            expect(actual.size).toBe(cells.length);
        });
    });
});
