import {OurSubmarine} from "../../src/app/services/our-submarine.class";
import {GRID_SAMPLE} from "./grid.mock";
import {Grid} from "../../src/app/services/grid.class";
import {OpponentSubmarine} from "../../src/app/services/opponent-submarine.class";

describe(OurSubmarine.name, () => {

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
                        const opponentSubmarine = new OpponentSubmarine(1, grid, console.log);
                        const ourSubmarine = new OurSubmarine(0, grid, opponentSubmarine);

                        // When
                        scenario.forEach(index => {
                            const position = grid.getCell(index);
                            ourSubmarine.setPosition(position.x, position.y);

                            // Then
                            expect(ourSubmarine.position).toBe(position);
                        });

                        // Then
                        const lastPosition = grid.getCell(scenario[scenario.length - 1]);
                        expect(ourSubmarine.turn).toBe(scenario.length);
                        expect(ourSubmarine.position).toBe(lastPosition);
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
            const opponentSubmarine = new OpponentSubmarine(1, grid, console.log);
            const ourSubmarine = new OurSubmarine(0, grid, opponentSubmarine);
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
