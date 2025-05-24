import { components, types, utils } from "../../meta";

type ItemViewerProps = {
  items: Array<{
    name: string;
    icon: types.react.FC<components.icon.Props>;
    href?: string | undefined;
    on_click: types.general.Handler<types.react.MouseEvent<HTMLAnchorElement>>;
    meta?:
      | Array<{
          prop: string;
          val: string;
        }>
      | undefined;
    on_remove?:
      | types.general.Handler<types.react.MouseEvent<HTMLAnchorElement>>
      | undefined;
  }>;
};

const ItemViewer = (props: ItemViewerProps) => {
  const modal = utils.react.use_context(components.asite.modal.Context);

  return (
    <components.layout.scrollable.Scrollable direction="VERTICAL">
      <components.layout.stack.Stack direction="VERTICAL">
        {props.items.map_with_between(
          (v, index) => (
            <components.layout.stack.Cell key={`${v.name}_${index}`}>
              <components.layout.stack.Stack direction="HORIZONTAL">
                <components.layout.stack.Cell grow>
                  <components.layout.simple_button.SimpleButton
                    group
                    href={v.href}
                    on_click={v.on_click}
                  >
                    <components.layout.wrapper.Wrapper x_padding="LARGE">
                      <components.layout.stack.Stack
                        direction="HORIZONTAL"
                        gap="LARGE"
                      >
                        <components.layout.stack.Cell>
                          <components.layout.container.Container
                            height="h-12"
                            width="w-6"
                            y_padding="LARGE"
                          >
                            {v.icon({ color: "PRIMARY", stroke: 2 }) as any}
                          </components.layout.container.Container>
                        </components.layout.stack.Cell>

                        <components.layout.stack.Cell grow>
                          <components.layout.wrapper.Wrapper y_padding="LARGE">
                            <components.layout.text.Text
                              size="LARGE"
                              color="PRIMARY"
                              underline="GROUP_HOVER"
                            >
                              {v.name}
                            </components.layout.text.Text>
                          </components.layout.wrapper.Wrapper>
                        </components.layout.stack.Cell>
                      </components.layout.stack.Stack>
                    </components.layout.wrapper.Wrapper>
                  </components.layout.simple_button.SimpleButton>
                </components.layout.stack.Cell>

                <components.layout.stack.Cell>
                  <components.layout.wrapper.Wrapper x_padding="SMALL">
                    <components.layout.stack.Stack
                      direction="HORIZONTAL"
                      gap="SMALL"
                    >
                      {v.meta === undefined ? (
                        <></>
                      ) : (
                        <components.layout.stack.Cell>
                          <components.layout.container.Container
                            width="w-10"
                            height="h-12"
                            y_padding="SMALL"
                          >
                            <components.layout.icon_button.IconButton
                              icon={components.icon.settings.Settings}
                              ring="HOVER"
                              on_click={() =>
                                modal((dismiss) => (
                                  <components.asite.modal.info.Info
                                    on_click_cancel={() => dismiss()}
                                    info={[
                                      { prop: "Name:", val: v.name },
                                      ...v.meta!,
                                    ]}
                                  />
                                ))
                              }
                            />
                          </components.layout.container.Container>
                        </components.layout.stack.Cell>
                      )}

                      {v.on_remove === undefined ? (
                        <></>
                      ) : (
                        <components.layout.stack.Cell>
                          <components.layout.container.Container
                            width="w-10"
                            height="h-12"
                            y_padding="SMALL"
                          >
                            <components.layout.icon_button.IconButton
                              icon={components.icon.close.Close}
                              ring="HOVER"
                              on_click={v.on_remove}
                            />
                          </components.layout.container.Container>
                        </components.layout.stack.Cell>
                      )}
                    </components.layout.stack.Stack>
                  </components.layout.wrapper.Wrapper>
                </components.layout.stack.Cell>
              </components.layout.stack.Stack>
            </components.layout.stack.Cell>
          ),
          (_value_before, index_before, _value_after, index_after) => (
            <components.layout.stack.Cell
              key={`${index_before}_${index_after}_sep`}
            >
              <components.layout.level.Ascend>
                <components.layout.line.Line direction="HORIZONTAL" />
              </components.layout.level.Ascend>
            </components.layout.stack.Cell>
          )
        )}
      </components.layout.stack.Stack>
    </components.layout.scrollable.Scrollable>
  );
};

export { ItemViewer };
