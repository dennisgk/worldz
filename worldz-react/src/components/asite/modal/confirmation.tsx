import { components, types } from "../../../meta";

type ConfirmationProps = {
  prompt: string;
  on_click_yes: types.general.Handler;
  on_click_cancel: types.general.Handler;
};

const Confirmation = (props: ConfirmationProps) => (
  <components.asite.modal.Base text="Confirmation">
    <components.layout.wrapper.Wrapper x_padding="LARGE">
      <components.layout.stack.Stack direction="VERTICAL" gap="LARGE" y_padding>
        <components.layout.stack.Cell>
          <components.layout.text.Text size="LARGE" word_break>
            {props.prompt}
          </components.layout.text.Text>
        </components.layout.stack.Cell>

        <components.layout.stack.Cell>
          <components.layout.stack.Stack direction="HORIZONTAL" gap="LARGE">
            <components.layout.stack.Cell width="w-1/2">
              <components.layout.level.Ascend>
                <components.asite.text_button.TextButton
                  on_click={props.on_click_cancel}
                >
                  Cancel
                </components.asite.text_button.TextButton>
              </components.layout.level.Ascend>
            </components.layout.stack.Cell>

            <components.layout.stack.Cell width="w-1/2">
              <components.layout.level.Ascend>
                <components.asite.text_button.TextButton
                  on_click={props.on_click_yes}
                >
                  Yes
                </components.asite.text_button.TextButton>
              </components.layout.level.Ascend>
            </components.layout.stack.Cell>
          </components.layout.stack.Stack>
        </components.layout.stack.Cell>
      </components.layout.stack.Stack>
    </components.layout.wrapper.Wrapper>
  </components.asite.modal.Base>
);

export { Confirmation };
