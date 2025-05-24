import Context from "./level/context";
import Ascend from "./level/ascend";
import Descend from "./level/descend";

const get_ascend = (level: number) => level + 1;
const get_descend = (level: number) => (level - 1 < 0 ? 0 : level - 1);

export { Context, Ascend, Descend, get_ascend, get_descend };
