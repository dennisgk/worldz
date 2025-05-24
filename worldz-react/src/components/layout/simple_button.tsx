import { components, deps, types, utils } from "../../meta";

type SimpleButtonProps = types.react.OptionalChildrenProps & {
  ring?: types.layout.Ring | undefined;
  on_click?:
    | types.general.Handler<types.react.MouseEvent<HTMLAnchorElement>>
    | undefined;
  group?: types.layout.Group | undefined;
  background?: types.layout.Background | undefined;
  href?: string | undefined;
  floating?: deps.floating.FloatingClickProps | undefined;
};

const SimpleButton = (props: SimpleButtonProps) => {
  const level = utils.react.use_context(components.layout.level.Context);

  return (
    <a
      href={props.href ?? "about:blank"}
      className={[
        "grow",
        "flex",
        utils.layout.match_align_center(),
        utils.layout.match_background(props.background, level),
        utils.layout.match_border_radius("MEDIUM"),
        utils.layout.match_overflow("HIDDEN"),
        utils.layout.match_group(props.group),
        utils.layout.match_ring(
          props.ring,
          components.layout.level.get_ascend(level)
        ),
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
      {props.children ?? <></>}
    </a>
  );
};

export { SimpleButton };
