import {Grid} from "./grid.class";
import {OrderEnum, Submarine} from "./submarine.class";
import {ICoordinate} from "./position.class";
import {DirectionEnum} from "./path-finder.class";
import {TrackResolver} from "./track-resolver.class";

export interface IMoveOrder {
    direction: DirectionEnum;
}

export interface ISurfaceOrder {
    index: number;
}

export interface ITorpedoOrder {
    coordinate: ICoordinate;
}

export interface ISonarOrder {
    index: number;
}

export interface ISilenceOrder {
}

export interface IMineOrder {
}

export interface ITriggerOrder {
    coordinate: ICoordinate;
}

export type Order =
    IMoveOrder
    | ISurfaceOrder
    | ITorpedoOrder
    | ISonarOrder
    | ISilenceOrder
    | IMineOrder
    | ITriggerOrder;

export interface IOrder {
    type: OrderEnum;
    order: Order;
}

export interface IOrderParserStrategy {
    order: OrderEnum,
    parse: (order: string) => IOrder
}

export const ORDER_PARSER_STRATEGIES: IOrderParserStrategy[] = [
    {
        order: OrderEnum.MOVE,
        parse: (order) => ({type: OrderEnum.MOVE, order: {direction: order.split(' ')[1]} as IMoveOrder})
    }, {
        order: OrderEnum.SURFACE,
        parse: (order) => ({
            type: OrderEnum.SURFACE,
            order: {index: parseInt(order.split(' ')[1])} as ISurfaceOrder
        })
    }, {
        order: OrderEnum.TORPEDO,
        parse: (order) => {
            let dividedOrder = order.split(' ');
            return {
                type: OrderEnum.TORPEDO,
                order: {
                    coordinate: {
                        x: parseInt(dividedOrder[1]),
                        y: parseInt(dividedOrder[2])
                    }
                } as ITorpedoOrder
            }
        }
    }, {
        order: OrderEnum.SONAR,
        parse: (order) => ({
                type: OrderEnum.SONAR,
                order: {index: parseInt(order.split(' ')[1])} as ISonarOrder
            }
        )
    }, {
        order: OrderEnum.SILENCE,
        parse: (order) => ({
            type: OrderEnum.SILENCE,
            order: {} as ISilenceOrder
        })
    }, {
        order: OrderEnum.MINE,
        parse: (order) => ({
            type: OrderEnum.MINE,
            order: {} as IMineOrder
        })
    }, {
        order: OrderEnum.TRIGGER,
        parse: (order) => {
            let dividedOrder = order.split(' ');
            return {
                type: OrderEnum.TRIGGER,
                order: {
                    coordinate: {
                        x: parseInt(dividedOrder[1]),
                        y: parseInt(dividedOrder[2])
                    }
                } as ITriggerOrder
            }
        }
    }
];

export class OpponentSubmarine extends Submarine {
    public trackResover: TrackResolver;

    constructor(id: number, grid: Grid, log) {
        super(id, grid);
        this.trackResover = new TrackResolver(grid, log);
    }

    public static parse(orders: string[]): IOrder[] {
        return orders.reduce((acc, order) => {
            const orderStrategy = ORDER_PARSER_STRATEGIES.find(s => order.startsWith(s.order));
            if (orderStrategy) {
                acc.push(orderStrategy.parse(order))
            }
            return acc;
        }, [])
    }

    public setOrders(orders: string[]) {
        this.trackResover.applyOrders(OpponentSubmarine.parse(orders), this.lost);
    }
}
