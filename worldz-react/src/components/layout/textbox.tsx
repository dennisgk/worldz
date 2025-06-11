import { components, types, utils } from "../../meta";

type TextboxProps = {
  value?: string | undefined;
  default_value?: string | undefined;
  on_change?:
    | types.general.Handler<types.react.ChangeEvent<HTMLInputElement>>
    | undefined;
  placeholder?: string | undefined;
  on_enter?: () => void | undefined;
  color?: types.layout.Color | undefined;
  size: types.layout.Size;
  password?: boolean | undefined;
  disabled?: boolean | undefined;
  id?: string | undefined;
  font?: types.layout.Font | undefined;
  bare?: boolean | undefined;
};

const Textbox = (props: TextboxProps) => {
  const level = utils.react.use_context(components.layout.level.Context);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && props.on_enter) {
      e.preventDefault();
      props.on_enter();
    }
  };

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
        utils.layout.match_font(props.font),
      ].join_class_name()}
      placeholder={props.placeholder}
      value={props.value}
      defaultValue={props.default_value}
      onChange={props.on_change}
      onKeyDown={props.disabled ? undefined : handleKeyDown}
      disabled={props.disabled}
      id={props.id}
      {...(props.password === true
        ? { type: "password", autoComplete: "on" }
        : { type: "text" })}
      autoCapitalize={props.bare === true ? "off" : undefined}
      autoComplete={props.bare === true ? "off" : undefined}
      autoCorrect={props.bare === true ? "off" : undefined}
      spellCheck={props.bare === true ? "false" : undefined}
    />
  );
};

export { Textbox };
