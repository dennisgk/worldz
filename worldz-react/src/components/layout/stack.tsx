import { components, types, utils } from "../../meta";

type CellProps<TGrow extends types.layout.Grow | undefined> = {
  overflow?: types.layout.Overflow | undefined;
} & (
  | { grow: TGrow }
  | { width: types.layout.Width }
  | { height: types.layout.Height }
  | {}
) &
  (TGrow extends true
    ? types.react.OptionalChildrenProps
    : types.react.RequiredChildrenProps);

const Cell = <TGrow extends types.layout.Grow | undefined = undefined>(
  props: CellProps<TGrow>
) => (
  <div
    className={[
      "flex",
      utils.layout.match_grow("grow" in props ? props.grow : undefined),
      utils.layout.match_height("height" in props ? props.height : undefined),
      utils.layout.match_width("width" in props ? props.width : undefined),
      utils.layout.match_overflow(props.overflow),
    ].join_class_name()}
  >
    {props.children ?? <></>}
  </div>
);

type StackProps = {
  direction: types.layout.Direction;
  gap?: types.layout.Gap | undefined;
  overflow?: types.layout.Overflow | undefined;
  y_padding?: boolean | undefined;
} & types.react.RequiredChildrenProps;

const Stack = (props: StackProps) => (
  <div
    className={[
      "flex",
      "grow",
      utils.layout.match_direction(props.direction),
      utils.general.match_str_val(props.direction, {
        HORIZONTAL: utils.layout.match_x_gap(props.gap),
        VERTICAL: utils.layout.match_y_gap(props.gap),
      }),
      utils.layout.match_overflow(props.overflow),
    ].join_class_name()}
  >
    {props.y_padding === true ? (
      <components.layout.stack.Cell>
        <components.layout.container.Container height="h-[1px]" />
      </components.layout.stack.Cell>
    ) : (
      <></>
    )}
    {props.children}
    {props.y_padding === true ? (
      <components.layout.stack.Cell>
        <components.layout.container.Container height="h-[1px]" />
      </components.layout.stack.Cell>
    ) : (
      <></>
    )}
  </div>
);

export { Cell, Stack };
