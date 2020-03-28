import {expect} from 'chai';
import {Surface} from "../../src/app/surface.class";

interface IGridScenario {
    width: number,
    height: number,
    grid: string[]
}

// C Island
const GRID_SAMPLE1: IGridScenario = {
    width: 5,
    height: 5,
    grid: `
.....
.....
..xxx
..xxx
.....`.replace(/\n/gm, '').split('')
};

describe(Surface.name, () => {

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
                const actual = Surface.getSurfaceIndex(scenario.given);

                // Then
                expect(actual).to.eql(scenario.then);
            });
        });
    });
});