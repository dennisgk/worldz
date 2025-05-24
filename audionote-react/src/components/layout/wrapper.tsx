import { components, types, utils } from "../../meta";

type WrapperProps = types.react.OptionalChildrenProps & {
  x_padding?: types.layout.Padding | undefined;
  y_padding?: types.layout.Padding | undefined;
  border_radius?: types.layout.BorderRadius | undefined;
  background?: types.layout.Background | undefined;
  overflow?: types.layout.Overflow | undefined;
  ring?: types.layout.Ring | undefined;
  css_var?: { [key: `--${string}`]: string | number } | undefined;
};

const Wrapper = (props: WrapperProps) => {
  const level = utils.react.use_context(components.layout.level.Context);

  return (
    <div
      className={[
        "flex",
        "grow",
        utils.layout.match_border_radius(props.border_radius),
        utils.layout.match_x_padding(props.x_padding),
        utils.layout.match_y_padding(props.y_padding),
        utils.layout.match_background(props.background, level),
        utils.layout.match_overflow(props.overflow),
        utils.layout.match_ring(
          props.ring,
          components.layout.level.get_ascend(level)
        ),
      ].join_class_name()}
      {...(props.css_var === undefined ? {} : { style: props.css_var })}
    >
      {props.children ?? <></>}
    </div>
  );
};

export { Wrapper };
