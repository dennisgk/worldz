const match_str_val = <T extends string, TRet = any>(
  val: T,
  full: {
    [V in T]: TRet;
  }
) => {
  return full[val];
};

const match_regex_val = <T extends string, TRet = any>(
  val: T,
  full: Array<[RegExp, TRet]>,
  other: TRet
): TRet => {
  for (const elem of full) {
    if (val.match(elem[0]) !== null) return elem[1];
  }

  return other;
};

const generate_uuid = () => crypto.randomUUID();

const pass = <T, TOut>(arg: T, handler: (arg: T) => TOut): TOut => handler(arg);

const omit = <T extends {}>(obj: T, ...exclude: Array<keyof T>): Partial<T> =>
  Object.keys(obj)
    .filter((key) => !exclude.includes(key as any))
    .reduce((out, key) => {
      (out as any)[key] = (obj as any)[key];
      return out;
    }, {});

const match_num_val = <TRet = any,>(val: number, full: Array<TRet>): TRet => {
  if (full.length === 0) return undefined as any as TRet;

  if (val <= 0) {
    return full[0];
  }

  if (Number.isInteger(val) && val < full.length) {
    return full[val];
  }

  return full[full.length - 1];
};

export {
  match_str_val,
  match_num_val,
  match_regex_val,
  omit,
  generate_uuid,
  pass,
};
