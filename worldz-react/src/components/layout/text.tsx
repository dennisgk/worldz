import { types, utils } from "../../meta";

type TextProps = types.react.RequiredChildrenProps & {
  size: types.layout.Size;
  bold?: types.layout.Bold | undefined;
  overflow?: types.layout.Overflow | undefined;
  align?: types.layout.Align | undefined;
  color?: types.layout.Color | undefined;
  float?: types.layout.Align | undefined;
  underline?: types.layout.Underline | undefined;
  word_break?: boolean | undefined;
  font?: types.layout.Font | undefined;
};

const Text = (props: TextProps) => (
  <span
    className={[
      utils.layout.match_size(props.size),
      utils.layout.match_bold(props.bold),
      utils.layout.match_text_overflow(props.overflow),
      utils.layout.match_text_align(props.align),
      utils.layout.match_color(props.color),
      utils.layout.match_float(props.float),
      utils.layout.match_underline(props.underline),
      utils.layout.match_font(props.font),
    ].join_class_name()}
    style={props.word_break === true ? { wordBreak: "break-word" } : undefined}
  >
    {props.children}
  </span>
);

export { Text };
