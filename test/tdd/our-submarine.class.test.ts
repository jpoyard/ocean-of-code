import {OurSubmarine} from "../../src/app/our-submarine.class";
import {GRID_SAMPLE, IGridScenario} from "./grid.mock";
import {Grid} from "../../src/app/grid.class";

describe(OurSubmarine.name, () => {

    describe('searchLongestPath()', () => {
        [
            ...GRID_SAMPLE.map(gridSample => ({given: gridSample, when: 0, then: 10})),
        ].forEach(
            (scenario: { given: IGridScenario, when: number, then: number }, index) =>
                it(`should executed less than ${(scenario.then)} ms when given index is ${JSON.stringify(scenario.when)} and grid #${index}`, () => {
                    // Given
                    const grid = new Grid(scenario.given.width, scenario.given.height, scenario.given.grid);
                    const ourSubmarine = new OurSubmarine(grid);
                    const hrstart = process.hrtime();

                    // When
                    const cell = grid.getCell(scenario.when);
                    const actual = ourSubmarine.searchLongestPath(cell);

                    // Then
                    const hrend = process.hrtime(hrstart);
                    const timeRef = hrend[1] / 1000000;
                    const length = actual.length;
                    expect(timeRef).toBeLessThan(scenario.then * 1000);
                    expect(length).toBeGreaterThanOrEqual(100);
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
                    const ourSubmarine = new OurSubmarine(grid);
                    const hrstart = process.hrtime();

                    // When
                    const actual = ourSubmarine.searchStartCell();

                    // Then
                    const hrend = process.hrtime(hrstart);
                    const timeRef = hrend[1] / 1000000;
                    expect(timeRef).toBeLessThan(scenario.then * 1000);
                    expect(actual[0].path.length).toBeGreaterThanOrEqual(150);
                    console.log(actual.map(result => ({
                        length: result.path.length,
                        cell: result.cell.coordinate
                    })), timeRef);
                })
        )
    });
});