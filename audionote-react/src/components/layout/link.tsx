import { types, utils } from "../../meta";

type LinkProps = types.react.RequiredChildrenProps & {
  size: types.layout.Size;
  bold?: types.layout.Bold | undefined;
  overflow?: types.layout.Overflow | undefined;
  align?: types.layout.Align | undefined;
  color?: types.layout.Color | undefined;
  float?: types.layout.Align | undefined;
  on_click?:
    | types.general.Handler<types.react.MouseEvent<HTMLAnchorElement>>
    | undefined;
  href?: string | undefined;
  underline?: types.layout.Underline | undefined;
};

const Link = (props: LinkProps) => (
  <a
    href={props.href ?? "about:blank"}
    onClick={(ev) => {
      ev.preventDefault();
      props.on_click?.(ev);
    }}
    className={[
      utils.layout.match_group(props.underline === "HOVER"),
    ].join_class_name()}
  >
    <span
      className={[
        utils.layout.match_underline(
          props.underline === "GROUP_HOVER" || props.underline === "HOVER"
            ? "GROUP_HOVER"
            : props.underline
        ),
        utils.layout.match_size(props.size),
        utils.layout.match_bold(props.bold),
        utils.layout.match_text_overflow(props.overflow),
        utils.layout.match_text_align(props.align),
        utils.layout.match_color(props.color),
        utils.layout.match_float(props.float),
      ].join_class_name()}
    >
      {props.children}
    </span>
  </a>
);

export { Link };
