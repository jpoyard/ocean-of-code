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
                    const ourSubmarine = new OurSubmarine(0, grid);
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
                    const ourSubmarine = new OurSubmarine(0, grid);
                    const hrstart = process.hrtime();

                    // When
                    const actual = ourSubmarine.searchStartCell();

                    // Then
                    const hrend = process.hrtime(hrstart);
                    const timeRef = hrend[1] / 1000000;
                    expect(timeRef).toBeLessThan(scenario.then * 1000);
                    expect(actual.path.length).toBeGreaterThanOrEqual(140);
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
            const ourSubmarine = new OurSubmarine(0, grid);

            // When
            ourSubmarine.addVisitedCell(grid.getCell(0));

            // Then
            expect(ourSubmarine.visitedCells.length).toBe(1);
            expect(ourSubmarine.isVisitedCell(0)).toBe(true);
        });


        it('clearVisitedCell()', () => {
            // Given
            const sample = GRID_SAMPLE[0];
            const grid = new Grid(sample.width, sample.height, sample.grid);
            const ourSubmarine = new OurSubmarine(0, grid);
            ourSubmarine.addVisitedCell(grid.getCell(0));

            // When
            ourSubmarine.clearVisitedCell();

            // Then
            expect(ourSubmarine.visitedCells.length).toBe(0);
            expect(ourSubmarine.isVisitedCell(0)).toBe(false);
        });
    });

    describe('position', () => {
        describe('setPosition()', () => {
            [
                [0],
                [0, 150, 25, 54]
            ].forEach(
                scenario => {
                    it(`should update position, when given ${JSON.stringify(scenario)}`, () => {
                        // Given
                        const sample = GRID_SAMPLE[0];
                        const grid = new Grid(sample.width, sample.height, sample.grid);
                        const ourSubmarine = new OurSubmarine(0, grid);

                        // When
                        scenario.forEach(index => {
                            const position = grid.getCell(index);
                            ourSubmarine.setPosition(position.x, position.y);

                            // Then
                            expect(ourSubmarine.position).toBe(position);
                            expect(ourSubmarine.isVisitedCell(position.index)).toBe(true);
                        });

                        // Then
                        const lastPosition = grid.getCell(scenario[scenario.length - 1]);
                        expect(ourSubmarine.turn).toBe(scenario.length);
                        expect(ourSubmarine.visitedCells.length).toBe(scenario.length);
                        expect(ourSubmarine.position).toBe(lastPosition);
                        expect(ourSubmarine.isVisitedCell(lastPosition.index)).toBe(true);
                    })
                }
            )

        })
    });

    describe('cooldown', () => {
        it(`should update cooldown correctly`, () => {
            // Given
            const sample = GRID_SAMPLE[0];
            const grid = new Grid(sample.width, sample.height, sample.grid);
            const ourSubmarine = new OurSubmarine(0, grid);
            expect(ourSubmarine.cooldown).toEqual({
                torpedo: -1,
                sonar: -1,
                mine: -1,
                silence: -1
            });

            // When
            const {torpedo, sonar, mine, silence} = {
                torpedo: 1,
                sonar: 2,
                mine: 3,
                silence: 4,
            };

            ourSubmarine.setCooldown(torpedo, sonar, mine, silence);

            // Then
            expect(ourSubmarine.cooldown).toEqual({torpedo, sonar, mine, silence});
        })
    })
});