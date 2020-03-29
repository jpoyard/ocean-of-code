import {expect} from 'chai';
import {ICoordinate} from "../../src/app/position.class";
import {Cell, CellTypeEnum} from "../../src/app/cell.class";

describe(Cell.name, () => {
    describe('constructor()', () => {
        [
            {coordinates: {x: 9, y: 0}, index: 9, type: CellTypeEnum.SEA, surface: 1},
            {coordinates: {x: 0, y: 9}, index: 12, type: CellTypeEnum.ISLAND, surface: 1}
        ].forEach((scenario: { coordinates: ICoordinate, index: number, type: CellTypeEnum, surface: number }) => {
            it(`should have properties ${JSON.stringify(scenario)} when constructors params are ${JSON.stringify(scenario)}`, () => {
                // Given
                // When
                const actual = new Cell(scenario.coordinates, scenario.index, scenario.type, scenario.surface);
                // Then
                expect(actual.coordinate).to.eql(scenario.coordinates);
                expect(actual.index).to.eql(scenario.index);
                expect(actual.type).to.eql(scenario.type);
            })
        });
    });

});