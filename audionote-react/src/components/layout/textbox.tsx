import { components, types, utils } from "../../meta";

type TextboxProps = {
  value?: string | undefined;
  default_value?: string | undefined;
  on_change?:
    | types.general.Handler<types.react.ChangeEvent<HTMLInputElement>>
    | undefined;
  placeholder?: string | undefined;
  color?: types.layout.Color | undefined;
  size: types.layout.Size;
  password?: boolean | undefined;
  disabled?: boolean | undefined;
};

const Textbox = (props: TextboxProps) => {
  const level = utils.react.use_context(components.layout.level.Context);

  return (
    <input
      className={[
        utils.layout.match_background("LEVEL", level),
        utils.layout.match_color(props.color),
        utils.layout.match_size(props.size),
        utils.layout.match_width("w-full"),
        utils.layout.match_border_radius("SMALL"),
        utils.layout.match_x_padding("MEDIUM"),
        utils.layout.match_y_padding("MEDIUM"),
        utils.layout.match_ring(
          "FOCUS",
          components.layout.level.get_ascend(level)
        ),
      ].join_class_name()}
      placeholder={props.placeholder}
      value={props.value}
      defaultValue={props.default_value}
      onChange={props.on_change}
      disabled={props.disabled}
      {...(props.password === true
        ? { type: "password", autoComplete: "on" }
        : { type: "text" })}
    />
  );
};

export { Textbox };
