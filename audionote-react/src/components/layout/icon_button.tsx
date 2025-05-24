import { components, deps, types, utils } from "../../meta";

type IconButtonProps = {
  icon: types.react.FC<components.icon.Props>;
  background?: types.layout.Background | undefined;
  ring?: types.layout.Ring | undefined;
  on_click?:
    | types.general.Handler<types.react.MouseEvent<HTMLAnchorElement>>
    | undefined;
  href?: string | undefined;
  floating?: deps.floating.FloatingClickProps | undefined;
  rotate?: types.layout.Rotation | undefined;
};

const IconButton = (props: IconButtonProps) => {
  const level = utils.react.use_context(components.layout.level.Context);

  return (
    <a
      href={props.href ?? "about:blank"}
      className={[
        "grow",
        "flex",
        utils.layout.match_align_center(),
        utils.layout.match_border_radius("MEDIUM"),
        utils.layout.match_x_padding("MEDIUM"),
        utils.layout.match_y_padding("MEDIUM"),
        utils.layout.match_ring(
          props.ring,
          components.layout.level.get_ascend(level)
        ),
        utils.layout.match_background(props.background, level),
      ].join_class_name()}
      onClick={(ev) => {
        ev.preventDefault();
        props.on_click?.(ev);
        if (props.floating !== undefined && "onClick" in props.floating.props)
          (props.floating.props.onClick as any)(ev);
      }}
      {...(props.floating === undefined
        ? {}
        : utils.general.omit(props.floating.props, "onClick"))}
      ref={props.floating === undefined ? undefined : props.floating.ref}
      role="button"
    >
      <props.icon color="PRIMARY" stroke={2} rotate={props.rotate} />
    </a>
  );
};

export { IconButton };
