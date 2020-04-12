import {MoveScenario} from "../../src/app/services/move-scenario.class";
import {GRID_SAMPLE} from "./grid.mock";
import {Grid} from "../../src/app/services/grid.class";
import {start} from "repl";

describe(MoveScenario.name, () => {
    describe('constructor', () => {
        it('', () => {
            const scenario = {given: GRID_SAMPLE[0]};
            // Given
            const grid = new Grid(scenario.given.width, scenario.given.height, scenario.given.grid);
            const startPositions = [grid.cells[0], grid.cells[1]];

            // When
            const actual = new MoveScenario(startPositions);

            // Then
            expect(actual.startPositions()).toEqual(startPositions);
            expect(actual.has(startPositions[0])).toBeTruthy();
        });
    })
    describe('clone', () => {
        it('', () => {
            const scenario = {given: GRID_SAMPLE[0]};
            // Given
            const grid = new Grid(scenario.given.width, scenario.given.height, scenario.given.grid);
            const startPositions = [grid.cells[0], grid.cells[1]];
            const source = new MoveScenario(startPositions);

            // When
            const actual = source.clone();
            actual.keepOnlyPosition(grid.cells[0]);

            // Then
            expect(source.startPositions()).toEqual(startPositions);
            expect(source.has(startPositions[1])).toBeTruthy();

            expect(actual.startPositions()).not.toEqual(startPositions);
            expect(actual.has(startPositions[1])).toBeFalsy();
        });
    })
});
