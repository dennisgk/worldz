import { components, types } from "../../meta";

type ImageButtonProps = {
  on_click?:
    | types.general.Handler<types.react.MouseEvent<HTMLAnchorElement>>
    | undefined;
  href?: string | undefined;
  text: string;
  src: string;
};

const ImageButton = (props: ImageButtonProps) => (
  <components.layout.simple_button.SimpleButton
    href={props.href}
    on_click={props.on_click}
    background="LEVEL"
    ring="HOVER"
  >
    <components.layout.wrapper.Wrapper x_padding="MEDIUM" y_padding="MEDIUM">
      <components.layout.stack.Stack direction="VERTICAL" gap="MEDIUM">
        <components.layout.stack.Cell>
          <img src={props.src} />
        </components.layout.stack.Cell>

        <components.layout.stack.Cell>
          <components.layout.wrapper.Wrapper>
            <components.layout.align.Align
              direction="HORIZONTAL"
              align="CENTER"
            >
              <components.layout.text.Text size="LARGE" align="CENTER">
                {props.text}
              </components.layout.text.Text>
            </components.layout.align.Align>
          </components.layout.wrapper.Wrapper>
        </components.layout.stack.Cell>
      </components.layout.stack.Stack>
    </components.layout.wrapper.Wrapper>
  </components.layout.simple_button.SimpleButton>
);

export { ImageButton };
