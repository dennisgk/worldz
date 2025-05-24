import { components, types } from "../../../meta";

type InfoProps = {
  info: Array<{ prop: string; val: string }> | string;
  on_click_cancel: types.general.Handler<
    types.react.MouseEvent<HTMLAnchorElement>
  >;
};

const Info = (props: InfoProps) => (
  <components.asite.modal.Base text="Information">
    <components.layout.wrapper.Wrapper x_padding="LARGE">
      <components.layout.stack.Stack direction="VERTICAL" gap="LARGE" y_padding>
        <>
          {((infos) =>
            infos.map((v) => (
              <components.layout.stack.Cell key={`${v.prop}_${v.val}`}>
                <components.layout.stack.Stack
                  direction="HORIZONTAL"
                  gap="MEDIUM"
                >
                  <components.layout.stack.Cell>
                    <components.layout.text.Text size="LARGE" bold>
                      {v.prop}
                    </components.layout.text.Text>
                  </components.layout.stack.Cell>

                  <components.layout.stack.Cell>
                    <components.layout.text.Text size="LARGE" word_break>
                      {v.val}
                    </components.layout.text.Text>
                  </components.layout.stack.Cell>
                </components.layout.stack.Stack>
              </components.layout.stack.Cell>
            )))(
            Array.isArray(props.info)
              ? props.info
              : [{ prop: "Information:", val: props.info }]
          )}

          <components.layout.stack.Cell>
            <components.layout.level.Ascend>
              <components.asite.text_button.TextButton
                on_click={props.on_click_cancel}
              >
                Close
              </components.asite.text_button.TextButton>
            </components.layout.level.Ascend>
          </components.layout.stack.Cell>
        </>
      </components.layout.stack.Stack>
    </components.layout.wrapper.Wrapper>
  </components.asite.modal.Base>
);

export { Info };
