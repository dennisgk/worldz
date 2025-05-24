import { components, types } from "../../meta";

type SubsectionWrapProps = types.react.RequiredChildrenProps & {
  text: string;
  on_back_click?:
    | types.general.Handler<types.react.MouseEvent<HTMLAnchorElement>>
    | undefined;
  back_href?: string | undefined;
};

const SubsectionWrap = (props: SubsectionWrapProps) => (
  <components.layout.scrollable.Scrollable direction="VERTICAL">
    <components.layout.wrapper.Wrapper x_padding="LARGE">
      <components.layout.align.Align direction="HORIZONTAL" align="CENTER">
        <components.layout.container.Container
          width={"w-full max-w-[34rem]" as types.layout.Width}
        >
          <components.layout.stack.Stack
            direction="VERTICAL"
            gap="LARGE"
            y_padding
          >
            <components.layout.stack.Cell>
              <components.layout.stack.Stack direction="HORIZONTAL" gap="LARGE">
                {props.on_back_click === undefined &&
                props.back_href === undefined ? (
                  <></>
                ) : (
                  <components.layout.stack.Cell>
                    <components.layout.container.Container
                      width="w-9"
                      height="h-9"
                    >
                      <components.layout.level.Ascend>
                        <components.layout.icon_button.IconButton
                          background="LEVEL"
                          icon={components.icon.arrow.Arrow}
                          ring="HOVER"
                          on_click={props.on_back_click}
                          href={props.back_href}
                          rotate={180}
                        />
                      </components.layout.level.Ascend>
                    </components.layout.container.Container>
                  </components.layout.stack.Cell>
                )}

                <components.layout.stack.Cell>
                  <components.layout.text.Text size="MEGA" bold>
                    {props.text}
                  </components.layout.text.Text>
                </components.layout.stack.Cell>
              </components.layout.stack.Stack>
            </components.layout.stack.Cell>

            {props.children as any}
          </components.layout.stack.Stack>
        </components.layout.container.Container>
      </components.layout.align.Align>
    </components.layout.wrapper.Wrapper>
  </components.layout.scrollable.Scrollable>
);

export { SubsectionWrap };
