import {expect} from 'chai';
import {getSurface, getSurfacePositionCenter, IPosition} from "../../src/app/bench";

const values: IPosition[] = [
    {x: -6, y: 4}, {x: -6, y: 3}, {x: -6, y: 2},
    {x: -6, y: 1}, {x: -5, y: 5}, {x: -4, y: 5},
    {x: -7, y: 5}, {x: -8, y: 5}, {x: -9, y: 5},
    {x: -10, y: 5}, {x: -6, y: 3}, {x: -6, y: 2},
    {x: -6, y: 1}, {x: -6, y: 0}, {x: -5, y: 4},
    {x: -4, y: 4}, {x: -6, y: 5}, {x: -7, y: 4},
    {x: -8, y: 4}, {x: -9, y: 4}, {x: -6, y: 2},
    {x: -6, y: 1}, {x: -6, y: 0}, {x: -6, y: -1},
    {x: -5, y: 3}, {x: -4, y: 3}, {x: -3, y: 3},
    {x: -2, y: 3}, {x: -6, y: 4}, {x: -6, y: 5},
    {x: -7, y: 3}, {x: -8, y: 3}, {x: -9, y: 3},
    {x: -6, y: 1}, {x: -6, y: 0}, {x: -6, y: -1},
    {x: -6, y: -2}, {x: -5, y: 2}, {x: -4, y: 2},
    {x: -3, y: 2}, {x: -2, y: 2}, {x: -6, y: 3},
    {x: -6, y: 4}, {x: -6, y: 5}, {x: -7, y: 2},
    {x: -8, y: 2}, {x: -9, y: 2}, {x: -10, y: 2},
    {x: -5, y: 5}, {x: -5, y: 4}, {x: -5, y: 3},
    {x: -5, y: 2}, {x: -4, y: 5}, {x: -4, y: 4},
    {x: -4, y: 3}, {x: -4, y: 2}, {x: -3, y: 3},
    {x: -3, y: 2}, {x: -2, y: 3}, {x: -2, y: 2},
    {x: -7, y: 5}, {x: -7, y: 4}, {x: -7, y: 3},
    {x: -7, y: 2}, {x: -8, y: 5}, {x: -8, y: 4},
    {x: -8, y: 3}, {x: -8, y: 2}
];

const opponentPositions = [
    {"position": {"x": 5, "y": 7}, "surface": 5},
    {"position": {"x": 6, "y": 9}, "surface": 5},
    {"position": {"x": 6, "y": 8}, "surface": 5},
    {"position": {"x": 7, "y": 7}, "surface": 5},
    {"position": {"x": 6, "y": 5}, "surface": 5},
    {"position": {"x": 6, "y": 6}, "surface": 5},
    {"position": {"x": 6, "y": 7}, "surface": 5},
    {"position": {"x": 7, "y": 9}, "surface": 5},
    {"position": {"x": 7, "y": 8}, "surface": 5},
    {"position": {"x": 7, "y": 5}, "surface": 5},
    {"position": {"x": 7, "y": 6}, "surface": 5},
    {"position": {"x": 4, "y": 8}, "surface": 4},
    {"position": {"x": 5, "y": 8}, "surface": 5},
    {"position": {"x": 4, "y": 9}, "surface": 4},
    {"position": {"x": 5, "y": 9}, "surface": 5},
    {"position": {"x": 8, "y": 7}, "surface": 5},
    {"position": {"x": 8, "y": 9}, "surface": 5},
    {"position": {"x": 8, "y": 8}, "surface": 5},
    {"position": {"x": 8, "y": 5}, "surface": 5},
    {"position": {"x": 8, "y": 6}, "surface": 5}
];

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
            const actual = getSurfacePositionCenter(scenario.given);

            // Then
            expect(actual).to.eql(scenario.then);
        });
    });
});

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
            const actual = getSurface(scenario.given);

            // Then
            expect(actual).to.eql(scenario.then);
        });
    });
});