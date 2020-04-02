import {expect} from 'chai';
import {ICoordinate, Position} from "../../src/app/services/position.class";

describe(Position.name, () => {
    describe('static sum()', () => {
        [
            {given: [], then: {x: 0, y: 0}},
            {given: [{x: 2, y: 1}, {x: -2, y: -1}], then: {x: 0, y: 0}},
            {given: [{x: 2, y: 1}, {x: 4, y: 1}], then: {x: 6, y: 2}},
        ].forEach((scenario: { given: ICoordinate[], then: ICoordinate }) => {
            it(`should return ${JSON.stringify(scenario.then)} when positions are ${JSON.stringify(scenario.given)}`, () => {
                // Given
                // When
                const actual = Position.sum(...scenario.given);
                // Then
                expect(actual).to.eql(scenario.then);
            })
        });
    });
    describe('static multiply()', () => {
        [
            {given: {coordinates: {x: 2, y: 1}, factor: 2}, then: {x: 4, y: 2}},
        ].forEach((scenario: { given: { coordinates: ICoordinate, factor: number }, then: ICoordinate }) => {
            it(`should return ${JSON.stringify(scenario.then)} when given params are ${JSON.stringify(scenario.given)}`, () => {
                // Given
                // When
                const actual = Position.multiply(scenario.given.coordinates, scenario.given.factor);
                // Then
                expect(actual).to.eql(scenario.then);
            })
        });
    });
    describe('sum()', () => {
        [
            {given: {x: 0, y: 0}, when: {x: 1, y: 2}, then: {x: 1, y: 2}},
            {given: {x: -2, y: -1}, when: {x: 1, y: 2}, then: {x: -1, y: 1}},
        ].forEach((scenario: { given: ICoordinate, when: ICoordinate, then: ICoordinate }) => {
            it(`should return ${JSON.stringify(scenario.then)} when position is ${JSON.stringify(scenario.given)} and param is ${JSON.stringify(scenario.when)}`, () => {
                // Given
                const position = new Position(scenario.given);
                // When
                const actual = position.sum(scenario.when);
                // Then
                expect(actual).to.eql(scenario.then);
            })
        });
    });
    describe('multiply()', () => {
        [
            {given: {x: 2, y: 1}, when: 2, then: {x: 4, y: 2}},
            {given: {x: -2, y: 1}, when: 2, then: {x: -4, y: 2}},
            {given: {x: -2, y: -1}, when: 2, then: {x: -4, y: -2}},
            {given: {x: -2, y: -1}, when: -2, then: {x: 4, y: 2}},
        ].forEach((scenario: { given: ICoordinate, when: number, then: ICoordinate }) => {
            it(`should return ${JSON.stringify(scenario.then)} when position is ${JSON.stringify(scenario.given)} and param is ${JSON.stringify(scenario.when)}`, () => {
                // Given
                const position = new Position(scenario.given);

                // When
                const actual = position.multiply(scenario.when);
                // Then
                expect(actual).to.eql(scenario.then);
            })
        });
    });

    describe('static removeDuplicate()', () => {
        const A: ICoordinate = {x: 2, y: 1};
        const B: ICoordinate = {x: -2, y: -1};
        [
            {given: [], then: [],},
            {given: [A, B], then: [A, B]},
            {given: [A, B, A, B, A], then: [A, B]}
        ].forEach((scenario: { given: ICoordinate[], then: ICoordinate[] }) => {
            it(`should return ${JSON.stringify(scenario.then)} when positions are ${JSON.stringify(scenario.given)}`, () => {
                // Given
                // When
                const actual = Position.removeDuplicate(scenario.given);
                // Then
                expect(actual).to.eql(scenario.then);
            })
        });
    });

    describe('static equals()', () => {
        const A: ICoordinate = {x: 1, y: 2};
        const B: ICoordinate = {x: -2, y: -1};
        [
            {given: [], then: true,},
            {given: [A], then: true},
            {given: [A, A, A, A], then: true},
            {given: [A, A, B, A], then: false}
        ].forEach((scenario: { given: ICoordinate[], then: boolean }) => {
            it(`should return ${(scenario.then)} when positions are ${JSON.stringify(scenario.given)}`, () => {
                // Given
                // When
                const actual = Position.equals(...scenario.given);
                // Then
                expect(actual).to.eql(scenario.then);
            })
        });
    });

    describe('equals()', () => {
        const A: ICoordinate = {x: 1, y: 2};
        const B: ICoordinate = {x: -2, y: -1};
        [
            {given: A, when: A, then: true},
            {given: A, when: B, then: false},
            {given: B, when: A, then: false},
        ].forEach((scenario: { given: ICoordinate, when: ICoordinate, then: boolean }) => {
            it(`should return ${(scenario.then)} when position is ${scenario.given} and param is ${scenario.when}`, () => {
                // Given
                const position = new Position(scenario.given);
                // When
                const actual = position.equals(scenario.when);
                // Then
                expect(actual).to.eql(scenario.then);
            })
        });
    });

    describe('static distance()', () => {
        [
            {given: {a: {x: 0, y: 0}, b: {x: 0, y: 0}}, then: 0},
            {given: {a: {x: 0, y: 0}, b: {x: -1, y: -1}}, then: 1},
            {given: {a: {x: 0, y: 0}, b: {x: 0, y: -1}}, then: 1},
            {given: {a: {x: 0, y: 0}, b: {x: 1, y: -1}}, then: 1},
            {given: {a: {x: 0, y: 0}, b: {x: -1, y: 0}}, then: 1},
            {given: {a: {x: 0, y: 0}, b: {x: 1, y: 0}}, then: 1},
            {given: {a: {x: 0, y: 0}, b: {x: -1, y: 1}}, then: 1},
            {given: {a: {x: 0, y: 0}, b: {x: 0, y: 1}}, then: 1},
            {given: {a: {x: 0, y: 0}, b: {x: 1, y: 1}}, then: 1},
        ].forEach((scenario: { given: { a: ICoordinate, b: ICoordinate }, then: number }) => {
            it(`should return ${(scenario.then)} when coordinates are ${JSON.stringify(scenario.given)}`, () => {
                // Given
                // When
                const actual = Position.distance(scenario.given.a, scenario.given.b);
                // Then
                expect(actual).to.eql(scenario.then);
            })
        });
    });

    describe('static pathLength()', () => {
        [
            {given: {a: {x: 0, y: 0}, b: {x: 0, y: 0}}, then: 0},
            {given: {a: {x: 0, y: 0}, b: {x: -1, y: -1}}, then: 2},
            {given: {a: {x: 0, y: 0}, b: {x: 0, y: -1}}, then: 1},
            {given: {a: {x: 0, y: 0}, b: {x: 1, y: -1}}, then: 2},
            {given: {a: {x: 0, y: 0}, b: {x: -1, y: 0}}, then: 1},
            {given: {a: {x: 0, y: 0}, b: {x: 1, y: 0}}, then: 1},
            {given: {a: {x: 0, y: 0}, b: {x: -1, y: 1}}, then: 2},
            {given: {a: {x: 0, y: 0}, b: {x: 0, y: 1}}, then: 1},
            {given: {a: {x: 0, y: 0}, b: {x: 1, y: 1}}, then: 2},
        ].forEach((scenario: { given: { a: ICoordinate, b: ICoordinate }, then: number }) => {
            it(`should return ${(scenario.then)} when coordinates are ${JSON.stringify(scenario.given)}`, () => {
                // Given
                // When
                const actual = Position.pathLength(scenario.given.a, scenario.given.b);
                // Then
                expect(actual).to.eql(scenario.then);
            })
        });
    });

    describe('distance()', () => {
        [
            {given: {x: 0, y: 0}, when: {x: 0, y: 0}, then: 0},
            {given: {x: 0, y: 0}, when: {x: -1, y: -1}, then: 1},
            {given: {x: 0, y: 0}, when: {x: 0, y: -1}, then: 1},
            {given: {x: 0, y: 0}, when: {x: 1, y: -1}, then: 1},
            {given: {x: 0, y: 0}, when: {x: -1, y: 0}, then: 1},
            {given: {x: 0, y: 0}, when: {x: 1, y: 0}, then: 1},
            {given: {x: 0, y: 0}, when: {x: -1, y: 1}, then: 1},
            {given: {x: 0, y: 0}, when: {x: 0, y: 1}, then: 1},
            {given: {x: 0, y: 0}, when: {x: 1, y: 1}, then: 1},
        ].forEach((scenario: { given: ICoordinate, when: ICoordinate, then: number }) => {
            it(`should return ${(scenario.then)} when position is ${(scenario.given)} and given param is ${(scenario.when)}`, () => {
                // Given
                const position = new Position(scenario.given);
                // When
                const actual = position.distance(scenario.when);
                // Then
                expect(actual).to.eql(scenario.then);
            })
        });
    });

    describe('pathLength()', () => {
        [
            {given: {x: 0, y: 0}, when: {x: 0, y: 0}, then: 0},
            {given: {x: 0, y: 0}, when: {x: -1, y: -1}, then: 2},
            {given: {x: 0, y: 0}, when: {x: 0, y: -1}, then: 1},
            {given: {x: 0, y: 0}, when: {x: 1, y: -1}, then: 2},
            {given: {x: 0, y: 0}, when: {x: -1, y: 0}, then: 1},
            {given: {x: 0, y: 0}, when: {x: 1, y: 0}, then: 1},
            {given: {x: 0, y: 0}, when: {x: -1, y: 1}, then: 2},
            {given: {x: 0, y: 0}, when: {x: 0, y: 1}, then: 1},
            {given: {x: 0, y: 0}, when: {x: 1, y: 1}, then: 2},
        ].forEach((scenario: { given: ICoordinate, when: ICoordinate, then: number }) => {
            it(`should return ${(scenario.then)} when position is ${(scenario.given)} and given param is ${(scenario.when)}`, () => {
                // Given
                const position = new Position(scenario.given);
                // When
                const actual = position.pathLength(scenario.when);
                // Then
                expect(actual).to.eql(scenario.then);
            })
        });
    });
});
