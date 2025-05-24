import { types, utils } from "../../meta";

type AlignProps = (
  | {
      direction: types.layout.Direction;
      align: types.layout.Align;
      overflow?: types.layout.Overflow | undefined;
    }
  | {
      direction?: undefined;
      align: "CENTER";
      overflow?: types.layout.Overflow | undefined;
    }
) &
  types.react.RequiredChildrenProps;

const Align = (props: AlignProps) =>
  props.direction === undefined ? (
    <div
      className={[
        "grow",
        "flex",
        utils.layout.match_align_center(),
        utils.layout.match_overflow(props.overflow),
      ].join_class_name()}
    >
      {props.children}
    </div>
  ) : (
    <div
      className={[
        "grow",
        "flex",
        utils.layout.match_align(props.align),
        utils.layout.match_direction(props.direction),
        utils.layout.match_overflow(props.overflow),
      ].join_class_name()}
    >
      {props.children}
    </div>
  );

export { Align };
