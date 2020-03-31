import {Grid} from "./grid.class";
import {DirectionEnum, OrderEnum, Submarine} from "./submarine.class";
import {ICoordinate} from "./position.class";
import {PathResolver} from "./path-resolver.class";

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

export interface IOrders {
    move?: IMoveOrder,
    surface?: ISurfaceOrder,
    torpedo?: ITorpedoOrder,
    sonar?: ISonarOrder;
    silence?: ISilenceOrder;
    mine?: IMineOrder;
    trigger?: ITriggerOrder;
}

export interface IOrderParserStrategy {
    order: OrderEnum,
    parse: (order: string) => Partial<IOrders>
}

export const ORDER_PARSER_STRATEGIES: IOrderParserStrategy[] = [
    {
        order: OrderEnum.MOVE,
        parse: (order) => ({move: {direction: order.split(' ')[1]} as IMoveOrder})
    }, {
        order: OrderEnum.SURFACE,
        parse: (order) => ({surface: {index: parseInt(order.split(' ')[1])} as ISurfaceOrder})
    }, {
        order: OrderEnum.TORPEDO,
        parse: (order) => {
            let dividedOrder = order.split(' ');
            return {
                torpedo: {
                    coordinate: {
                        x: parseInt(dividedOrder[1]),
                        y: parseInt(dividedOrder[2])
                    }
                } as ITorpedoOrder
            }
        }
    }, {
        order: OrderEnum.SONAR,
        parse: (order) => ({sonar: {index: parseInt(order.split(' ')[1])} as ISonarOrder})
    }, {
        order: OrderEnum.SILENCE,
        parse: (order) => ({silence: {} as ISilenceOrder})
    }, {
        order: OrderEnum.MINE,
        parse: (order) => ({mine: {} as IMineOrder})
    }, {
        order: OrderEnum.TRIGGER,
        parse: (order) => {
            let dividedOrder = order.split(' ');
            return {
                trigger: {
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
    public pathResover: PathResolver;

    constructor(id: number, grid: Grid) {
        super(id, grid);
        this.pathResover = new PathResolver(grid);
    }

    private _orders: IOrders;

    public get orders(): IOrders {
        return {...this._orders};
    }

    public static parse(orders: string[]): IOrders {
        return ORDER_PARSER_STRATEGIES
            .reduce(
                (acc, cur) => {
                    const order = orders.find(i => i.startsWith(cur.order));
                    if (order) {
                        acc = {...acc, ...cur.parse(order)};
                    }
                    return acc;
                }, {})
    }

    public setOrders(orders: string[]) {
        this.pathResover.applyMoveOrders(OpponentSubmarine.parse(orders));
        this.applyOtherOrders();
    }

    private applyOtherOrders(): void {
        if (this.orders.torpedo) {
            this.pathResover.keepOnlyPositionsNearTorpedo(this.orders.torpedo.coordinate);
        }
    }

}