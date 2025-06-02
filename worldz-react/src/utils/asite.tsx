import { types, utils } from "../meta";

const match_path_only = (
  location: string,
  ...full: Array<types.asite.Page>
): boolean => {
  return match_path(
    location,
    new Proxy(
      {},
      {
        get(_target, p, _receiver) {
          return full.includes(p as any);
        },
      }
    ) as any
  );
};

const match_inner = (location: string) =>
  match_path_only(location, "TAGS", "SETTINGS");

const match_path = <TRet = any,>(
  location: string,
  full: { [V in types.asite.Page]: TRet }
): TRet =>
  full[
    utils.general.match_regex_val<string, types.asite.Page>(
      location,
      [
        [/^\/$/gm, "HOME"],
        [/^\/tags$/gm, "TAGS"],
        [/^\/settings$/gm, "SETTINGS"],
        [/^\/sector$/gm, "SECTOR"],
      ],
      "HOME"
    )
  ];

const PY_BACKEND = "http://localhost:19423";
//const PY_BACKEND = "";

export { match_path, match_path_only, PY_BACKEND, match_inner };
