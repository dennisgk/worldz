import { components, deps, types, utils } from "../../meta";

const DismissContext = utils.react.create_context<types.general.Handler>(
  undefined!
);

const use_dropdown = (children: Array<types.react.Element>) => {
  const [is_open, set_is_open] = utils.react.use_state(false);

  const floating = deps.floating.use_floating({
    open: is_open,
    onOpenChange: set_is_open,
    middleware: [
      deps.floating.offset(10),
      deps.floating.flip({ fallbackAxisSideDirection: "end" }),
      deps.floating.shift(),
    ],
    whileElementsMounted: deps.floating.auto_update,
  });

  const click = deps.floating.use_click(floating.context);
  const dismiss = deps.floating.use_dismiss(floating.context);

  const transition = deps.floating.use_transition_styles(floating.context, {
    duration: 300,
    initial: {
      opacity: 0,
      transform: "scale(0.5)",
    },
    open: {
      opacity: 1,
      transform: "scale(1)",
    },
    close: {
      opacity: 0,
      transform: "scale(0.5)",
    },
  });

  const interactions = deps.floating.use_interactions([click, dismiss]);

  return {
    is_open: is_open,
    floating: {
      ref: floating.refs.setReference,
      props: interactions.getReferenceProps(),
    } as deps.floating.FloatingClickProps,
    elem: transition.isMounted ? (
      <DismissContext.Provider value={() => set_is_open(false)}>
        <div
          ref={floating.refs.setFloating}
          style={{
            ...floating.floatingStyles,
            ...transition.styles,
            transform: [
              floating.floatingStyles.transform,
              transition.styles.transform,
            ].join_class_name(),
          }}
          {...interactions.getFloatingProps()}
          className={["z-40"].join_class_name()}
        >
          <components.layout.wrapper.Wrapper
            background="LEVEL"
            x_padding="LARGE"
            y_padding="LARGE"
            border_radius="MEDIUM"
            ring="PRIMARY"
          >
            <components.layout.stack.Stack direction="VERTICAL" gap="MEDIUM">
              {children}
            </components.layout.stack.Stack>
          </components.layout.wrapper.Wrapper>
        </div>
      </DismissContext.Provider>
    ) : (
      <></>
    ),
  };
};

type OptionProps = {
  text: string;
  underline?: types.layout.Underline | undefined;
  href?: string | undefined;
  on_click?:
    | types.general.Handler<types.react.MouseEvent<HTMLAnchorElement>>
    | undefined;
};

const Option = (props: OptionProps) => {
  const dismiss = utils.react.use_context(DismissContext);

  return (
    <components.layout.stack.Cell>
      <components.layout.link.Link
        href={props.href}
        on_click={(ev) => {
          props.on_click?.(ev);
          dismiss();
        }}
        size="MEDIUM"
        color="PRIMARY"
        bold
        underline={props.underline}
      >
        {props.text}
      </components.layout.link.Link>
    </components.layout.stack.Cell>
  );
};

type DropdownProps = {
  prompt: string;
  options: Array<string>;
} & (
  | {
      allow_null: true;
      null_text: string;
      selected: string | null;
      on_change: types.general.Handler<string | null>;
    }
  | {
      allow_null: false;
      selected: string;
      on_change: types.general.Handler<string>;
    }
);

const Dropdown = (props: DropdownProps) => {
  const dropdown = components.asite.dropdown.use_dropdown([
    ...(props.allow_null === true
      ? [
          <components.asite.dropdown.Option
            text={props.null_text}
            key={`${-1}_${props.null_text}`}
            on_click={() => props.on_change(null)}
            underline={props.selected === null ? "COLOR" : "HOVER"}
          />,
        ]
      : []),
    ...props.options.map((v, index) => (
      <components.asite.dropdown.Option
        text={v}
        key={`${index}_${v}`}
        on_click={() => props.on_change(v)}
        underline={props.selected === v ? "COLOR" : "HOVER"}
      />
    )),
  ]);

  return (
    <>
      <components.layout.stack.Cell>
        <components.layout.stack.Stack direction="VERTICAL">
          <components.layout.stack.Cell>
            <components.layout.text.Text size="LARGE" bold>
              {props.prompt}
            </components.layout.text.Text>
          </components.layout.stack.Cell>

          <components.layout.stack.Cell>
            <components.layout.level.Ascend>
              <components.asite.text_button.TextButton
                floating={dropdown.floating}
              >
                {props.selected === null
                  ? props.allow_null === true
                    ? props.null_text
                    : ""
                  : props.selected}
              </components.asite.text_button.TextButton>
            </components.layout.level.Ascend>
          </components.layout.stack.Cell>
        </components.layout.stack.Stack>
      </components.layout.stack.Cell>

      {dropdown.elem}
    </>
  );
};

export { Dropdown, use_dropdown, Option };
