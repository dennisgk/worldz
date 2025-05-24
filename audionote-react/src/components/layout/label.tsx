import { types, utils } from "../../meta";

type LabelProps = types.react.ElemChildrenProps & {
  top_right?: types.react.Element | undefined;
  top_left?: types.react.Element | undefined;
  bottom_right?: types.react.Element | undefined;
  bottom_left?: types.react.Element | undefined;
};

type LabelInternalProps = {
  corner: types.layout.Corner;
} & (types.react.ElemChildrenProps | types.react.UndefinedChildrenProps);

const LabelInternal = (props: LabelInternalProps) =>
  props.children === undefined ? (
    <></>
  ) : (
    <div
      className={[
        "absolute",
        utils.layout.match_corner(props.corner),
      ].join_class_name()}
    >
      {props.children}
    </div>
  );

const Label = (props: LabelProps) => (
  <div className={["relative", "w-full", "h-full"].join_class_name()}>
    {props.children}

    <LabelInternal corner="TOP_LEFT">{props.top_left}</LabelInternal>
    <LabelInternal corner="TOP_RIGHT">{props.top_right}</LabelInternal>
    <LabelInternal corner="BOTTOM_LEFT">{props.bottom_left}</LabelInternal>
    <LabelInternal corner="BOTTOM_RIGHT">{props.bottom_right}</LabelInternal>
  </div>
);

export { Label };
