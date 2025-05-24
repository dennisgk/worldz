import { deps, types, utils, components } from "../../meta";

import * as confirmation from "./modal/confirmation";
import * as info from "./modal/info";
import * as error from "./modal/error";

const Context = utils.react.create_context<
  types.general.Handler<types.react.FC<types.general.Handler>>
>(undefined!);

const Modal = (props: types.react.RequiredChildrenProps) => {
  const [modal, set_modal] = utils.react.use_state<
    types.react.Element | undefined
  >(undefined);

  const [is_open, set_is_open] = utils.react.use_state(false);

  const remove_modal = utils.react.use_ref(false);

  const floating = deps.floating.use_floating({
    open: is_open,
    onOpenChange: set_is_open,
    middleware: [],
  });

  const transition = deps.floating.use_transition_status(floating.context, {
    duration: 300,
  });

  utils.react.use_effect(() => {
    if (transition.status === "close") {
      remove_modal.current = true;
    }

    if (transition.status === "unmounted" && remove_modal.current) {
      set_modal(undefined);
      remove_modal.current = false;
    }
  }, [transition.status]);

  return (
    <>
      <Context.Provider
        value={(el) => {
          set_modal(el(() => set_is_open(false)) as any);
          set_is_open(true);
        }}
      >
        {props.children}
      </Context.Provider>

      {transition.isMounted ? (
        <div
          className={[
            "fixed",
            "z-30",
            "top-0",
            "left-0",
            "w-full",
            "h-full",
            "transition-all",
            "bg-[#00000088]",
            "overflow-hidden",
          ].join_class_name()}
          style={
            transition.status === "initial"
              ? {
                  opacity: 0,
                }
              : transition.status === "open"
              ? {
                  opacity: 1,
                }
              : transition.status === "close"
              ? {
                  opacity: 0,
                }
              : {}
          }
        >
          <div
            className={[
              "flex",
              "w-full",
              "h-full",
              "transition-all",
              "overflow-hidden",
            ].join_class_name()}
            ref={floating.refs.setFloating}
            style={
              transition.status === "initial"
                ? {
                    opacity: 0,
                    transform: "scale(0.5)",
                  }
                : transition.status === "open"
                ? {
                    opacity: 1,
                    transform: "scale(1)",
                  }
                : transition.status === "close"
                ? {
                    opacity: 0,
                    transform: "scale(0.5)",
                  }
                : {}
            }
          >
            {modal}
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

type BaseProps = types.react.RequiredChildrenProps & {
  text: string;
};

const Base = (props: BaseProps) => (
  <components.layout.level.Ascend>
    <components.layout.align.Align align="CENTER" overflow="HIDDEN">
      <components.layout.container.Container
        width="w-96"
        height={"max-h-[96vh]" as types.layout.Height}
        background="LEVEL"
        border_radius="MEDIUM"
      >
        <components.layout.stack.Stack direction="VERTICAL" overflow="HIDDEN">
          <components.layout.stack.Cell>
            <components.layout.level.Ascend>
              <components.layout.wrapper.Wrapper
                background="LEVEL"
                border_radius="MEDIUM"
                x_padding="LARGE"
                y_padding="LARGE"
              >
                <components.layout.text.Text size="MEGA" color="PRIMARY" bold>
                  {props.text}
                </components.layout.text.Text>
              </components.layout.wrapper.Wrapper>
            </components.layout.level.Ascend>
          </components.layout.stack.Cell>

          <components.layout.stack.Cell grow overflow="HIDDEN">
            <components.layout.scrollable.Scrollable direction="VERTICAL">
              {props.children as any}
            </components.layout.scrollable.Scrollable>
          </components.layout.stack.Cell>
        </components.layout.stack.Stack>
      </components.layout.container.Container>
    </components.layout.align.Align>
  </components.layout.level.Ascend>
);

export { confirmation, Modal, Base, Context, info, error };
