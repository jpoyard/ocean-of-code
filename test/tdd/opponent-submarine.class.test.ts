import {OpponentSubmarine, Order} from "../../src/app/services/opponent-submarine.class";
import {DirectionEnum} from "../../src/app/services/path-finder.class";

describe('ORDER_PARSER_STRATEGIES', () => {
    [
        ...Object.values(DirectionEnum).map(
            direction => ({given: [`MOVE ${direction}`], then: {move: {direction}}})
        ),
        {given: [`SURFACE 2`], then: {surface: {index: 2}}},
        {
            given: [`TORPEDO 3 5`], then: {torpedo: {coordinate: {x: 3, y: 5}}}
        },
        {
            given: [`SONAR 4`], then: {sonar: {index: 4}}
        },
        {
            given: [`SILENCE`], then: {silence: {}}
        },
        {
            given: [`MINE E`], then: {mine: {}}
        },
        {
            given: [`TRIGGER 4 2`], then: {trigger: {coordinate: {x: 4, y: 2}}}
        }
    ].forEach((scenario: { given: string[], then: Partial<Order> }) => {
        it(`should return ${JSON.stringify(scenario.then)} when given orders=${scenario.given}`, () => {
            // Given

            // When
            const actual = OpponentSubmarine.parse(scenario.given);

            // Then
            expect(actual).toEqual(scenario.then)
        })
    })
});
