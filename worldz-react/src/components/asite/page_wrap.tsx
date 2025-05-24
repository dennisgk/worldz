import { components, types } from "../../meta";

type PageWrapProps = types.react.RequiredChildrenProps & {
  text: string;
};

const PageWrap = (props: PageWrapProps) => (
  <components.layout.wrapper.Wrapper
    x_padding="LARGE"
    y_padding="LARGE"
    overflow="HIDDEN"
  >
    <components.layout.stack.Stack
      direction="VERTICAL"
      gap="LARGE"
      overflow="HIDDEN"
    >
      <components.layout.stack.Cell>
        <components.layout.level.Ascend>
          <components.layout.wrapper.Wrapper
            background="LEVEL"
            x_padding="LARGE"
            y_padding="LARGE"
            border_radius="MEDIUM"
          >
            <components.layout.text.Text size="MEGA" bold color="PRIMARY">
              {props.text}
            </components.layout.text.Text>
          </components.layout.wrapper.Wrapper>
        </components.layout.level.Ascend>
      </components.layout.stack.Cell>

      <>{props.children}</>
    </components.layout.stack.Stack>
  </components.layout.wrapper.Wrapper>
);

export { PageWrap };
