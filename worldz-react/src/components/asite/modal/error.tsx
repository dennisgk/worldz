import { components, types } from "../../../meta";

type ErrorProps = {
  error: string;
  on_click_cancel: types.general.Handler<
    types.react.MouseEvent<HTMLAnchorElement>
  >;
};

const Error = (props: ErrorProps) => (
  <components.asite.modal.Base text="Error">
    <components.layout.wrapper.Wrapper x_padding="LARGE">
      <components.layout.stack.Stack direction="VERTICAL" gap="LARGE" y_padding>
        <components.layout.stack.Cell>
          <components.layout.text.Text size="LARGE" word_break>
            {props.error}
          </components.layout.text.Text>
        </components.layout.stack.Cell>

        <components.layout.stack.Cell>
          <components.layout.level.Ascend>
            <components.asite.text_button.TextButton
              on_click={props.on_click_cancel}
            >
              Close
            </components.asite.text_button.TextButton>
          </components.layout.level.Ascend>
        </components.layout.stack.Cell>
      </components.layout.stack.Stack>
    </components.layout.wrapper.Wrapper>
  </components.asite.modal.Base>
);

export { Error };
