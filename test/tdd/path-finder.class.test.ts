import {GRID_SAMPLE, IGridScenario} from "./grid.mock";
import {Grid} from "../../src/app/services/grid.class";
import {PathFinder} from "../../src/app/services/path-finder.class";

describe(PathFinder.name, () => {

    describe('searchLongestPath()', () => {
        [
            ...GRID_SAMPLE.map(gridSample => ({given: gridSample, when: 0, then: 10})),
        ].forEach(
            (scenario: { given: IGridScenario, when: number, then: number }, index) =>
                it(`should executed less than ${(scenario.then)} ms when given index is ${JSON.stringify(scenario.when)} and grid #${index}`, () => {
                    // Given
                    const grid = new Grid(scenario.given.width, scenario.given.height, scenario.given.grid);
                    const pathFinder = new PathFinder(grid);
                    const hrstart = process.hrtime();

                    // When
                    const cell = grid.getCell(scenario.when);
                    const actual = pathFinder.searchLongestPath(cell);

                    // Then
                    const hrend = process.hrtime(hrstart);
                    const timeRef = hrend[1] / 1000000;
                    const length = actual.length;
                    expect(timeRef).toBeLessThan(scenario.then * 1000);
                    expect(length).toBeGreaterThanOrEqual(50);
                    console.log(`searchLongestPath for #${index}: ${actual.length}`);
                })
        )
    });

    describe('searchShortestPath()', () => {
        [
            ...GRID_SAMPLE.map(gridSample => ({
                given: gridSample,
                when: {start: 0, end: 96},
                then: {minDuration: 10, maxLength: 80}
            })),
        ].forEach(
            (scenario: { given: IGridScenario, when: { start: number, end: number }, then: { minDuration: number, maxLength: number } }, index) =>
                it(`should executed less than ${(scenario.then)} ms when given index is ${JSON.stringify(scenario.when)} and grid #${index}`, () => {
                    // Given
                    const grid = new Grid(scenario.given.width, scenario.given.height, scenario.given.grid);
                    const pathFinder = new PathFinder(grid);
                    const hrstart = process.hrtime();

                    // When
                    const actual = pathFinder.searchShortestPath(grid.getCell(scenario.when.start), grid.getCell(scenario.when.end));

                    // Then
                    const timeRef = process.hrtime(hrstart)[1] / 1000000;
                    const length = actual.length;
                    expect(timeRef).toBeLessThan(scenario.then.minDuration * 1000);
                    expect(length).toBeLessThanOrEqual(scenario.then.maxLength);
                    console.log(`searchShortestPath for #${index}: ${actual.length}`);
                })
        )
    });

    describe('searchStartCell()', () => {
        [
            ...GRID_SAMPLE.map(gridSample => ({given: gridSample, then: 10})),
        ].forEach(
            (scenario: { given: IGridScenario, when: number, then: number }, index) =>
                it(`should executed less than ${(scenario.then)} ms for grid #${index}`, () => {
                    // Given
                    const grid = new Grid(scenario.given.width, scenario.given.height, scenario.given.grid);
                    const pathFinder = new PathFinder(grid);
                    const hrstart = process.hrtime();

                    // When
                    const actual = pathFinder.searchStartCell();

                    // Then
                    const hrend = process.hrtime(hrstart);
                    const timeRef = hrend[1] / 1000000;
                    expect(timeRef).toBeLessThan(scenario.then * 1000);
                    expect(actual.path.length).toBeGreaterThanOrEqual(100);
                    console.log({
                        length: actual.path.length,
                        cell: actual.position.coordinate,
                        timeRef
                    });
                }))
    });

    describe('cells visited', () => {
        it('addVisitedCell()', () => {
            // Given
            const sample = GRID_SAMPLE[0];
            const grid = new Grid(sample.width, sample.height, sample.grid);
            const pathFinder = new PathFinder(grid);
            const cell = grid.getCell(0);

            // When
            pathFinder.addVisitedCell(cell);

            // Then
            expect(pathFinder.isVisitedCell(cell)).toBe(true);
        });


        it('clearVisitedCell()', () => {
            // Given
            const sample = GRID_SAMPLE[0];
            const grid = new Grid(sample.width, sample.height, sample.grid);
            const pathFinder = new PathFinder(grid);
            const cell = grid.getCell(0);
            pathFinder.addVisitedCell(cell);

            // When
            pathFinder.clearVisitedCell();

            // Then
            expect(pathFinder.isVisitedCell(cell)).toBe(false);
        });
    });
});
