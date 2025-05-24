import { components, types, utils } from "../../meta";

type SimpleAccordionButton = {
  type: "BUTTON";
  text: string;
  on_click: types.general.Handler;
  confirm: string | undefined;
};
type SimpleAccordionText = {
  type: "TEXT";
  text: string;
};

type SimpleAccordionContext = {
  header: string;
  children: Array<SimpleAccordionButton | SimpleAccordionText>;
};

type SimpleAccordionProps = SimpleAccordionContext & {
  open: boolean;
  on_click: types.general.Handler<types.react.MouseEvent<HTMLAnchorElement>>;
};

type SimpleAccordionListProps = {
  data: Array<SimpleAccordionContext>;
  override_always_open: boolean;
  gap?: types.general.range.DeterminateExCategory | undefined;
};

const SimpleAccordion = (props: SimpleAccordionProps) => {
  const header = utils.react.use_memo(
    () => (
      <components.layout.simple_button.SimpleButton
        ring={props.open ? undefined : "HOVER"}
        on_click={props.on_click}
      >
        <components.layout.wrapper.Wrapper
          y_padding="MEDIUM"
          x_padding="MEDIUM"
          border_radius="MEDIUM"
        >
          <components.layout.stack.Stack direction="HORIZONTAL" gap="MEDIUM">
            <components.layout.stack.Cell>
              <components.layout.align.Align
                direction="VERTICAL"
                align="CENTER"
              >
                <components.layout.container.Container width="w-4" height="h-4">
                  <components.icon.arrow.Arrow
                    color="PRIMARY"
                    stroke={2}
                    rotate={props.open ? 90 : 0}
                  />
                </components.layout.container.Container>
              </components.layout.align.Align>
            </components.layout.stack.Cell>

            <components.layout.stack.Cell>
              <components.layout.text.Text size="MEDIUM">
                {props.header}
              </components.layout.text.Text>
            </components.layout.stack.Cell>
          </components.layout.stack.Stack>
        </components.layout.wrapper.Wrapper>
      </components.layout.simple_button.SimpleButton>
    ),
    [props.open, props.on_click, props.header]
  );

  return props.open ? (
    <components.layout.wrapper.Wrapper ring="PRIMARY" border_radius="MEDIUM">
      <components.layout.stack.Stack direction="VERTICAL">
        <components.layout.stack.Cell>{header}</components.layout.stack.Cell>

        <components.layout.stack.Cell>
          <components.layout.wrapper.Wrapper x_padding="MEDIUM">
            <components.layout.level.Ascend>
              <components.layout.line.Line direction="HORIZONTAL" />
            </components.layout.level.Ascend>
          </components.layout.wrapper.Wrapper>
        </components.layout.stack.Cell>

        <components.layout.stack.Cell>
          <components.layout.wrapper.Wrapper
            x_padding="MEDIUM"
            y_padding="MEDIUM"
            border_radius="MEDIUM"
          >
            <components.layout.stack.Stack direction="VERTICAL" gap="MEDIUM">
              {props.children.map((v, v_index) => (
                <components.layout.stack.Cell key={`${v.type}${v.text}${v_index}`}>
                  {utils.general.match_str_val(v.type, {
                    TEXT: () => (
                      <components.layout.text.Text size="MEDIUM">
                        {v.text}
                      </components.layout.text.Text>
                    ),
                    BUTTON: () => (
                      <components.layout.level.Ascend>
                        <components.layout.simple_button.SimpleButton
                          ring="HOVER"
                          on_click={() => {
                            if (
                              (v as SimpleAccordionButton).confirm === undefined
                            ) {
                              (v as SimpleAccordionButton).on_click();
                              return;
                            }

                            if (!confirm((v as SimpleAccordionButton).confirm))
                              return;

                            (v as SimpleAccordionButton).on_click();
                          }}
                          background="LEVEL"
                        >
                          <components.layout.wrapper.Wrapper
                            x_padding="MEDIUM"
                            y_padding="MEDIUM"
                          >
                            <components.layout.align.Align
                              direction="HORIZONTAL"
                              align="CENTER"
                            >
                              <components.layout.text.Text size="MEDIUM">
                                {v.text}
                              </components.layout.text.Text>
                            </components.layout.align.Align>
                          </components.layout.wrapper.Wrapper>
                        </components.layout.simple_button.SimpleButton>
                      </components.layout.level.Ascend>
                    ),
                  })()}
                </components.layout.stack.Cell>
              ))}
            </components.layout.stack.Stack>
          </components.layout.wrapper.Wrapper>
        </components.layout.stack.Cell>
      </components.layout.stack.Stack>
    </components.layout.wrapper.Wrapper>
  ) : (
    header
  );
};

const SimpleAccordionList = (props: SimpleAccordionListProps) => {
  const [selected, set_selected] = utils.react.use_state<
    SimpleAccordionContext | undefined
  >(undefined);

  utils.react.use_effect(() => {
    set_selected(undefined);
  }, [props.data]);

  const inner_data = utils.react.use_memo(
    () =>
      props.data.map((v) => (
        <components.layout.stack.Cell key={v.header}>
          <SimpleAccordion
            header={v.header}
            children={v.children}
            open={props.override_always_open ? true : v === selected}
            on_click={() =>
              v === selected ? set_selected(undefined) : set_selected(v)
            }
          />
        </components.layout.stack.Cell>
      )),
    [props.data, selected]
  );

  return (
    <components.layout.stack.Stack direction="VERTICAL" gap={props.gap}>
      {inner_data}
    </components.layout.stack.Stack>
  );
};

export { SimpleAccordionList };
