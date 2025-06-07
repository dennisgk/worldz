import * as doc from "../utils/doc";
import * as linq from "../utils/linq";
import * as react from "../utils/react";
import * as general from "../utils/general";
import * as layout from "../utils/layout";
import * as asite from "../utils/asite";
import * as sector from "../utils/sector";

type ReplaceAt<
  T extends any[],
  I extends number,
  R,
  Count extends any[] = []
> = T extends [infer First, ...infer Rest]
  ? Count["length"] extends I
    ? [R, ...Rest] // Replace current element with R
    : [First, ...ReplaceAt<Rest, I, R, [...Count, 0]>] // Recurse
  : T;

type TupleOfUndefined<
  N extends number,
  R extends undefined[] = []
> = R["length"] extends N ? R : TupleOfUndefined<N, [...R, undefined]>;

/*
type TakeFirst<
  T extends any[],
  N extends number,
  R extends any[] = []
> = R["length"] extends N
  ? R
  : T extends [infer F, ...infer Rest]
  ? TakeFirst<Rest, N, [...R, F]>
  : R;
*/

type PipeSync = "SYNC";
type PipeAsync = "ASYNC";

class PipeOut<T extends any[], TP extends PipeSync | PipeAsync> {
  #pipe: Pipe<T, TP>;
  #type: PipeSync | PipeAsync;
  #handler: TP extends PipeSync
    ? () => void
    : TP extends PipeAsync
    ? () => Promise<void>
    : never;

  constructor(
    pipe: Pipe<T, TP>,
    type: PipeSync | PipeAsync,
    handler: TP extends PipeSync
      ? () => void
      : TP extends PipeAsync
      ? () => Promise<void>
      : never
  ) {
    this.#pipe = pipe;
    this.#type = type;
    this.#handler = handler;
  }

  vc<NT extends number>(
    num: NT
  ): TP extends PipeSync
    ? () => T[NT]
    : TP extends PipeAsync
    ? () => Promise<T[NT]>
    : never {
    switch (this.#type) {
      case "SYNC": {
        return (() => {
          this.#handler();
          return this.#pipe.values[num];
        }) as any;
      }
      case "ASYNC": {
        return (() =>
          (async () => {
            await this.#handler();
            return this.#pipe.values[num];
          })()) as any;
      }
    }
  }

  nov(): TP extends PipeSync
    ? void
    : TP extends PipeAsync
    ? Promise<void>
    : never {
    switch (this.#type) {
      case "SYNC": {
        this.#handler();
        return undefined as any;
      }
      case "ASYNC": {
        return (async () => {
          await this.#handler();
        })() as any;
      }
    }
  }
}

class Pipe<T extends any[], TP extends PipeSync | PipeAsync> {
  values: any[];
  #progression: (
    | { type: PipeSync; handler: () => void }
    | { type: PipeAsync; handler: () => Promise<void> }
  )[];

  constructor() {
    this.values = [];
    this.#progression = [];
  }

  #ensure_length(len: number): void {
    while (this.values.length < len) {
      this.values.push(undefined);
    }
  }

  s<UT, NT extends number>(
    num: NT,
    handler: () => UT
  ): Pipe<ReplaceAt<T, NT, UT>, TP> {
    this.#progression.push({
      type: "SYNC",
      handler: () => {
        this.#ensure_length(num + 1);

        this.values[num] = handler();
      },
    });
    return this as any;
  }

  sa<UT, NT extends number>(
    num: NT,
    handler: () => Promise<UT>
  ): Pipe<ReplaceAt<T, NT, UT>, PipeAsync> {
    this.#progression.push({
      type: "ASYNC",
      handler: async () => {
        this.#ensure_length(num + 1);

        this.values[num] = await handler();
      },
    });
    return this as any;
  }

  no(handler: () => void): Pipe<T, TP> {
    this.#progression.push({
      type: "SYNC",
      handler: handler,
    });

    return this as any;
  }

  noa(handler: () => Promise<void>): Pipe<T, PipeAsync> {
    this.#progression.push({
      type: "ASYNC",
      handler: handler,
    });

    return this as any;
  }

  g<NT extends number>(num: NT, handler: (val: T[NT]) => void): Pipe<T, TP> {
    this.#progression.push({
      type: "SYNC",
      handler: () => {
        this.#ensure_length(num + 1);

        handler(this.values[num]);
      },
    });

    return this as any;
  }

  ga<NT extends number>(
    num: NT,
    handler: (val: T[NT]) => Promise<void>
  ): Pipe<T, PipeAsync> {
    this.#progression.push({
      type: "ASYNC",
      handler: async () => {
        this.#ensure_length(num + 1);

        await handler(this.values[num]);
      },
    });

    return this as any;
  }

  gs<UT, NTG extends number, NTS extends number>(
    num_get: NTG,
    num_set: NTS,
    handler: (val: T[NTG]) => UT
  ): Pipe<ReplaceAt<T, NTS, UT>, TP> {
    this.#progression.push({
      type: "SYNC",
      handler: () => {
        this.#ensure_length(Math.max(num_get, num_set) + 1);

        this.values[num_set] = handler(this.values[num_get]);
      },
    });

    return this as any;
  }

  gsa<UT, NTG extends number, NTS extends number>(
    num_get: NTG,
    num_set: NTS,
    handler: (val: T[NTG]) => Promise<UT>
  ): Pipe<ReplaceAt<T, NTS, UT>, PipeAsync> {
    this.#progression.push({
      type: "ASYNC",
      handler: async () => {
        this.#ensure_length(Math.max(num_get, num_set) + 1);

        this.values[num_set] = await handler(this.values[num_get]);
      },
    });

    return this as any;
  }

  ex(): PipeOut<T, TP> {
    let out = { type: "SYNC", handler: () => {} } as
      | { type: "SYNC"; handler: () => void }
      | { type: "ASYNC"; handler: () => Promise<void> };

    for (let i = 0; i < this.#progression.length; i++) {
      let cur_handler = out.handler;

      switch (out.type) {
        case "SYNC": {
          switch (this.#progression[i].type) {
            case "SYNC": {
              out.handler = () => {
                cur_handler();
                this.#progression[i].handler();
              };
              break;
            }
            case "ASYNC": {
              out.type = "ASYNC" as any;
              out.handler = async () => {
                cur_handler();
                await this.#progression[i].handler();
              };
              break;
            }
          }
          break;
        }
        case "ASYNC": {
          switch (this.#progression[i].type) {
            case "SYNC": {
              out.handler = async () => {
                await cur_handler();
                this.#progression[i].handler();
              };
              break;
            }
            case "ASYNC": {
              out.handler = async () => {
                await cur_handler();
                await this.#progression[i].handler();
              };
              break;
            }
          }
          break;
        }
      }
    }

    return new PipeOut<T, TP>(this, out.type, out.handler as any);
  }
}

const pipe = <T extends number>() => {
  return new Pipe<TupleOfUndefined<T>, PipeSync>();
};

export { doc, linq, react, general, layout, asite, pipe, sector };
