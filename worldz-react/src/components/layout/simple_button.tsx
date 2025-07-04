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
  const touch_start_x = utils.react.use_ref(0);
  const touch_start_y = utils.react.use_ref(0);

  return (
    <a
      href={props.href}
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
      {...(utils.doc.is_mobile()
        ? {
            onTouchStart: (ev) => {
              touch_start_x.current = ev.changedTouches[0].clientX;
              touch_start_y.current = ev.changedTouches[0].clientY;
            },
            onTouchEnd: (ev) => {
              let touch_delta_x = Math.abs(ev.changedTouches[0].clientX - touch_start_x.current);
              let touch_delta_y = Math.abs(ev.changedTouches[0].clientY - touch_start_y.current);

              if (touch_delta_x > 10 || touch_delta_y > 10) {
                return;
              }
            
              ev.preventDefault();
              ev.stopPropagation();
              props.on_click?.(ev as any);
              if (
                props.floating !== undefined &&
                "onClick" in props.floating.props
              )
                (props.floating.props.onClick as any)(ev);
            },
          }
        : {
            onClick: (ev) => {
              ev.preventDefault();
              props.on_click?.(ev);
              if (
                props.floating !== undefined &&
                "onClick" in props.floating.props
              )
                (props.floating.props.onClick as any)(ev);
            },
          })}
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
