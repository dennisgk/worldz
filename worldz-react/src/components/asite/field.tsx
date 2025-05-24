import { components, types } from "../../meta";

type FieldProps = {
  prompt?: string | undefined;
  on_change: types.general.Handler<string>;
  password?: boolean | undefined;
  value?: string | undefined;
  default_value?: string | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
};

const Field = (props: FieldProps) => (
  <components.layout.stack.Cell>
    <components.layout.stack.Stack direction="VERTICAL">
      {props.prompt !== undefined ? (
        <components.layout.stack.Cell>
          <components.layout.text.Text size="LARGE" bold>
            {props.prompt}
          </components.layout.text.Text>
        </components.layout.stack.Cell>
      ) : (
        <></>
      )}

      <components.layout.stack.Cell>
        <components.layout.level.Ascend>
          <components.layout.textbox.Textbox
            size="LARGE"
            value={props.value}
            default_value={props.default_value}
            on_change={(ev) => props.on_change(ev.target.value)}
            password={props.password}
            placeholder={props.placeholder}
            disabled={props.disabled}
          />
        </components.layout.level.Ascend>
      </components.layout.stack.Cell>
    </components.layout.stack.Stack>
  </components.layout.stack.Cell>
);

export { Field };
