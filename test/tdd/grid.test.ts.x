import {expect} from 'chai';
import {CellTypeEnum, Grid} from "../../src/app/grid";
import {getSurface, getSurfacePositionCenter} from "../../src/app/bench";

// C Island
const GRID_SAMPLE1 = {
    start: {x: 0, y: 0},
    width: 5,
    height: 5,
    grid: [
        CellTypeEnum.SEA, CellTypeEnum.SEA, CellTypeEnum.SEA, CellTypeEnum.SEA, CellTypeEnum.SEA,
        CellTypeEnum.SEA, CellTypeEnum.SEA, CellTypeEnum.SEA, CellTypeEnum.SEA, CellTypeEnum.SEA,
        CellTypeEnum.SEA, CellTypeEnum.SEA, CellTypeEnum.ISLAND, CellTypeEnum.SEA, CellTypeEnum.SEA,
        CellTypeEnum.SEA, CellTypeEnum.SEA, CellTypeEnum.SEA, CellTypeEnum.SEA, CellTypeEnum.SEA,
        CellTypeEnum.SEA, CellTypeEnum.SEA, CellTypeEnum.SEA, CellTypeEnum.SEA, CellTypeEnum.SEA
    ]
};
const GRID_SAMPLE2 = {
    start: {x: 4, y: 1},
    width: 5,
    height: 5,
    grid: [
        CellTypeEnum.SEA, CellTypeEnum.SEA, CellTypeEnum.SEA, CellTypeEnum.SEA, CellTypeEnum.SEA,
        CellTypeEnum.SEA, CellTypeEnum.ISLAND, CellTypeEnum.ISLAND, CellTypeEnum.ISLAND, CellTypeEnum.SEA,
        CellTypeEnum.SEA, CellTypeEnum.ISLAND, CellTypeEnum.SEA, CellTypeEnum.SEA, CellTypeEnum.SEA,
        CellTypeEnum.SEA, CellTypeEnum.ISLAND, CellTypeEnum.ISLAND, CellTypeEnum.ISLAND, CellTypeEnum.SEA,
        CellTypeEnum.SEA, CellTypeEnum.SEA, CellTypeEnum.SEA, CellTypeEnum.SEA, CellTypeEnum.SEA
    ]
};

describe(Grid.name, () => {
    [
        {given: {start: {x: 4, y: 1}, width: 5, height: 5, grid: new Array(5 * 5).fill(CellTypeEnum.SEA)}, then: 26},
        {given: GRID_SAMPLE1, then: 25},
        {given: GRID_SAMPLE2, then: 18},
    ].forEach((scenario) => {
        it(`searchLongestPath()`, () => {
            // Given
            const grid = new Grid(scenario.given.width, scenario.given.height, scenario.given.grid);

            // When
            const actual = grid.searchLongestWay(grid.getGridIndex(scenario.given.start));

            // Then
            expect(actual).to.not.undefined;
            console.info(actual);
            expect(actual.length).to.equals(scenario.then);
        });
    })


    describe('getSurface()', () => {
        [
            {given: {x: 2, y: 2}, then: 1},
            {given: {x: 7, y: 2}, then: 2},
            {given: {x: 12, y: 2}, then: 3},
            {given: {x: 2, y: 7}, then: 4},
            {given: {x: 7, y: 7}, then: 5},
            {given: {x: 12, y: 7}, then: 6},
            {given: {x: 2, y: 12}, then: 7},
            {given: {x: 7, y: 12}, then: 8},
            {given: {x: 12, y: 12}, then: 9},
        ].forEach(scenario => {
            it(`should return ${(scenario.then)} when position=${JSON.stringify(scenario.given)}`, () => {
                // Given
                // When
                const actual = Grid.getSurface(scenario.given);

                // Then
                expect(actual).to.eql(scenario.then);
            });
        });
    });

    describe('getSurfacePositionCenter()', () => {
        [
            {given: 1, then: {x: 2, y: 2}},
            {given: 2, then: {x: 7, y: 2}},
            {given: 3, then: {x: 12, y: 2}},
            {given: 4, then: {x: 2, y: 7}},
            {given: 5, then: {x: 7, y: 7}},
            {given: 6, then: {x: 12, y: 7}},
            {given: 7, then: {x: 2, y: 12}},
            {given: 8, then: {x: 7, y: 12}},
            {given: 9, then: {x: 12, y: 12}},
        ].forEach(scenario => {
            it(`should return ${JSON.stringify(scenario.then)} when surface=${scenario.given}`, () => {
                // Given
                // When
                const actual = Grid.getSurfacePositionCenter(scenario.given);

                // Then
                expect(actual).to.eql(scenario.then);
            });
        });
    });
});