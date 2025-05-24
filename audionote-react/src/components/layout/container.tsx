import { components, types, utils } from "../../meta";

type ContainerProps = types.react.OptionalChildrenProps & {
  x_padding?: types.layout.Padding | undefined;
  y_padding?: types.layout.Padding | undefined;
  border_radius?: types.layout.BorderRadius | undefined;
  width?: types.layout.Width | undefined;
  height?: types.layout.Height | undefined;
  background?: types.layout.Background | undefined;
  ring?: types.layout.Ring | undefined;
  overflow?: types.layout.Overflow | undefined;
};

const Container = (props: ContainerProps) => {
  const level = utils.react.use_context(components.layout.level.Context);

  return (
    <div
      className={[
        "flex",
        utils.layout.match_width(props.width),
        utils.layout.match_height(props.height),
        utils.layout.match_border_radius(props.border_radius),
        utils.layout.match_x_padding(props.x_padding),
        utils.layout.match_y_padding(props.y_padding),
        utils.layout.match_background(props.background, level),
        utils.layout.match_ring(props.ring, level),
        utils.layout.match_overflow(props.overflow),
      ].join_class_name()}
    >
      {props.children ?? <></>}
    </div>
  );
};

export { Container };
