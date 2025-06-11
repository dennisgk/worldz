import { components, deps, types } from "../../meta";

type TextButtonProps = types.react.StringChildrenProps & {
  href?: string | undefined;
  on_click?: types.general.Handler | undefined;
  ring?: types.layout.Ring | undefined;
  floating?: deps.floating.FloatingClickProps | undefined;
};

const TextButton = (props: TextButtonProps) => (
  <components.layout.simple_button.SimpleButton
    ring={props.ring ?? "HOVER"}
    on_click={props.on_click as any}
    href={props.href}
    background="LEVEL"
    floating={props.floating}
  >
    <components.layout.wrapper.Wrapper x_padding="MEDIUM" y_padding="MEDIUM">
      <components.layout.align.Align direction="HORIZONTAL" align="CENTER">
        <components.layout.text.Text size="LARGE" color="PRIMARY" bold>
          {props.children}
        </components.layout.text.Text>
      </components.layout.align.Align>
    </components.layout.wrapper.Wrapper>
  </components.layout.simple_button.SimpleButton>
);

export { TextButton };
