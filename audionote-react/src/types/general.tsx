import * as range from "./general/range";

type ChildrenObj<T> = T extends undefined
  ? {
      children?: undefined;
    }
  : {
      children: T;
    };

type Handler<T = undefined> = (
  ...args: T extends undefined ? [event?: T] : [event: T]
) => void;

export { range };
export type { ChildrenObj, Handler };
