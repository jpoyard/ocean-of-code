import {expect} from 'chai';
import {Grid} from "../../src/app/services/grid.class";
import {ICoordinate} from "../../src/app/services/position.class";
import {Surface} from "../../src/app/services/surface.class";
import {GRID_SAMPLE, IGridScenario} from "./grid.mock";
import {CellTypeEnum} from "../../src/app/services/cell.class";

describe(Grid.name, () => {
    it(`should be created`, () => {
        // Given
        // When
        const grid = new Grid(GRID_SAMPLE[0].width, GRID_SAMPLE[0].height, GRID_SAMPLE[0].grid);
        // Then
        expect(grid.surfaces.length).to.eql(9);
        grid.surfaces.forEach(surface => {
            expect(surface.cells.length).to.eql(Surface.WIDTH * Surface.WIDTH);
            surface.cells.forEach(cell => expect(cell.surface).to.eql(surface.index))
        })
    });

    describe('getCoordinates()', () => {
        [
            {given: GRID_SAMPLE[0], when: 0, then: {x: 0, y: 0}},
            {given: GRID_SAMPLE[0], when: GRID_SAMPLE[0].width - 1, then: {x: GRID_SAMPLE[0].width - 1, y: 0}},
            {
                given: GRID_SAMPLE[0],
                when: GRID_SAMPLE[0].width * (GRID_SAMPLE[0].height - 1),
                then: {x: 0, y: GRID_SAMPLE[0].height - 1}
            },
            {
                given: GRID_SAMPLE[0],
                when: (GRID_SAMPLE[0].width * GRID_SAMPLE[0].height) - 1,
                then: {x: GRID_SAMPLE[0].width - 1, y: GRID_SAMPLE[0].height - 1}
            },
        ].forEach(
            (scenario: { given: IGridScenario, when: number, then: ICoordinate }) =>
                it(`should be ${JSON.stringify(scenario.then)} when given index is ${scenario.when}`, () => {
                    // Given
                    const grid = new Grid(scenario.given.width, scenario.given.height, scenario.given.grid);
                    // When
                    const actual = grid.getCoordinates(scenario.when);
                    // Then
                    expect(actual).to.eql(scenario.then)
                })
        )
    });

    describe('getIndex()', () => {
        [
            {given: GRID_SAMPLE[0], when: {x: -1, y: 0}, then: -1},
            {given: GRID_SAMPLE[0], when: {x: 0, y: -1}, then: -1},
            {given: GRID_SAMPLE[0], when: {x: GRID_SAMPLE[0].width, y: 0}, then: -1},
            {given: GRID_SAMPLE[0], when: {x: 0, y: GRID_SAMPLE[0].height}, then: -1},
            {given: GRID_SAMPLE[0], when: {x: 0, y: 0}, then: 0},
            {given: GRID_SAMPLE[0], when: {x: GRID_SAMPLE[0].width - 1, y: 0}, then: GRID_SAMPLE[0].width - 1},
            {
                given: GRID_SAMPLE[0],
                when: {x: 0, y: GRID_SAMPLE[0].height - 1},
                then: GRID_SAMPLE[0].width * (GRID_SAMPLE[0].height - 1)
            },
            {
                given: GRID_SAMPLE[0],
                when: {x: GRID_SAMPLE[0].width - 1, y: GRID_SAMPLE[0].height - 1},
                then: (GRID_SAMPLE[0].width * GRID_SAMPLE[0].height) - 1
            },
        ].forEach(
            (scenario: { given: IGridScenario, when: ICoordinate, then: number }) =>
                it(`should be ${(scenario.then)} when given index is ${JSON.stringify(scenario.when)}`, () => {
                    // Given
                    const grid = new Grid(scenario.given.width, scenario.given.height, scenario.given.grid);
                    // When
                    const actual = grid.getIndex(scenario.when);
                    // Then
                    expect(actual).to.eql(scenario.then)
                })
        )
    });

    describe('areCoordinatesValid()', () => {
        [
            {given: GRID_SAMPLE[0], when: {x: 0, y: 0}, then: true},
            {given: GRID_SAMPLE[0], when: {x: GRID_SAMPLE[0].width - 1, y: 0}, then: true},
            {
                given: GRID_SAMPLE[0],
                when: {x: 0, y: GRID_SAMPLE[0].height - 1},
                then: true
            },
            {
                given: GRID_SAMPLE[0],
                when: {x: GRID_SAMPLE[0].width - 1, y: GRID_SAMPLE[0].height - 1},
                then: true
            },
            {
                given: GRID_SAMPLE[0],
                when: {x: -1, y: 0},
                then: false
            },
            {
                given: GRID_SAMPLE[0],
                when: {x: 0, y: -1},
                then: false
            },
            {
                given: GRID_SAMPLE[0],
                when: {x: GRID_SAMPLE[0].width, y: GRID_SAMPLE[0].height},
                then: false
            },
        ].forEach(
            (scenario: { given: IGridScenario, when: ICoordinate, then: boolean }) =>
                it(`should be ${(scenario.then)} when given index is ${JSON.stringify(scenario.when)}`, () => {
                    // Given
                    const grid = new Grid(scenario.given.width, scenario.given.height, scenario.given.grid);
                    // When
                    const actual = grid.areCoordinatesValid(scenario.when);
                    // Then
                    expect(actual).to.eql(scenario.then)
                })
        )
    });

    describe('isIndexValid()', () => {
        [
            {given: GRID_SAMPLE[0], when: 0, then: true},
            {given: GRID_SAMPLE[0], when: GRID_SAMPLE[0].width - 1, then: true},
            {
                given: GRID_SAMPLE[0],
                when: GRID_SAMPLE[0].width * (GRID_SAMPLE[0].height - 1),
                then: true
            },
            {
                given: GRID_SAMPLE[0],
                when: (GRID_SAMPLE[0].width * GRID_SAMPLE[0].height) - 1,
                then: true
            },
            {given: GRID_SAMPLE[0], when: -1, then: false},
            {
                given: GRID_SAMPLE[0],
                when: (GRID_SAMPLE[0].width * GRID_SAMPLE[0].height),
                then: false
            },
        ].forEach(
            (scenario: { given: IGridScenario, when: number, then: boolean }) =>
                it(`should be ${(scenario.then)} when given index is ${JSON.stringify(scenario.when)}`, () => {
                    // Given
                    const grid = new Grid(scenario.given.width, scenario.given.height, scenario.given.grid);
                    // When
                    const actual = grid.isIndexValid(scenario.when);
                    // Then
                    expect(actual).to.eql(scenario.then)
                })
        )
    });

    describe('getCell()', () => {
        [
            {given: GRID_SAMPLE[0], when: 0, then: true},
            {given: GRID_SAMPLE[0], when: GRID_SAMPLE[0].width - 1, then: true},
            {
                given: GRID_SAMPLE[0],
                when: GRID_SAMPLE[0].width * (GRID_SAMPLE[0].height - 1),
                then: true
            },
            {
                given: GRID_SAMPLE[0],
                when: (GRID_SAMPLE[0].width * GRID_SAMPLE[0].height) - 1,
                then: true
            },
            {given: GRID_SAMPLE[0], when: -1, then: false},
            {
                given: GRID_SAMPLE[0],
                when: (GRID_SAMPLE[0].width * GRID_SAMPLE[0].height),
                then: false
            },
        ].forEach(
            (scenario: { given: IGridScenario, when: number, then: boolean }) =>
                it(`should return ${(scenario.then) ? 'cell' : 'undefined'} when given index is ${JSON.stringify(scenario.when)}`, () => {
                    // Given
                    const grid = new Grid(scenario.given.width, scenario.given.height, scenario.given.grid);

                    // When
                    const actual = grid.getCell(scenario.when);

                    // Then
                    if (scenario.then) {
                        expect(actual).to.be.not.undefined;
                        expect(actual.index).to.eql(scenario.when);
                    } else {
                        expect(actual).to.be.undefined;
                    }
                })
        )
    });

    describe('getTorpedoAreaWithoutDangerArea()', () => {
        const scenario = {given: GRID_SAMPLE[0]};
        it('should return torpedo area without dangerous area (distance > 1)', () => {
            // Given
            const grid = new Grid(scenario.given.width, scenario.given.height, scenario.given.grid);

            // When
            const position = grid.getCellFromCoordinate({x: 7, y: 7});
            const actual = grid.getTorpedoAreaWithoutDangerArea(position);

            // Then
            actual.forEach((cell)=>{
                expect(cell.type === CellTypeEnum.SEA).to.be.true;
                expect(cell.pathLength(position)).to.be.at.most(4);
                expect(cell.distance(position)).greaterThan(1);
            })
        })
    })

    describe('getTorpedoArea()', () => {
        const scenario = {given: GRID_SAMPLE[0]};
        it('should return torpedo area with dangerous area', () => {
            // Given
            const grid = new Grid(scenario.given.width, scenario.given.height, scenario.given.grid);

            // When
            const position = grid.getCellFromCoordinate({x: 7, y: 7});
            const actual = grid.getTorpedoArea(position);

            // Then
            actual.forEach((cell)=>{
                expect(cell.type === CellTypeEnum.SEA).to.be.true;
                expect(cell.pathLength(position)).to.be.at.most(4);
            })
        })
    })

    describe('getDangerArea()', () => {
        const scenario = {given: GRID_SAMPLE[0]};
        it('should return torpedo area without dangerous are (distance > 1)', () => {
            // Given
            const grid = new Grid(scenario.given.width, scenario.given.height, scenario.given.grid);

            // When
            const position = grid.getCellFromCoordinate({x: 7, y: 7});
            const actual = grid.getDangerArea(position);

            // Then
            actual.forEach((cell)=>{
                expect(cell.type === CellTypeEnum.SEA).to.be.true;
                expect(cell.distance(position)).to.be.at.most(1);
            })
        })
    })
});
