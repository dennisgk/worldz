import { components, types, utils } from "../meta";
import * as logo from "./icon/logo";
import * as home from "./icon/home";
import * as folder from "./icon/folder";
import * as cube from "./icon/cube";
import * as close from "./icon/close";
import * as arrow from "./icon/arrow";
import * as upload from "./icon/upload";
import * as spinner from "./icon/spinner";
import * as settings from "./icon/settings";
import * as file from "./icon/file";
import * as trash from "./icon/trash";

type Props = {
  color: types.layout.Color;
  stroke: types.layout.Stroke;
  rotate?: types.layout.Rotation | undefined;
  transition?: types.layout.Transition | undefined;
};

const get_class_name = (props: components.icon.Props) =>
  [
    "h-full",
    "w-full",
    utils.layout.match_color(props.color),
    utils.layout.match_stroke(props.stroke),
    utils.layout.match_rotation(props.rotate),
    utils.layout.match_transition(props.transition),
  ].join_class_name();

export {
  logo,
  get_class_name,
  home,
  folder,
  cube,
  arrow,
  close,
  upload,
  spinner,
  settings,
  file,
  trash,
};
export type { Props };
