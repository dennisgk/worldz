import { types, components, deps, utils } from "../../../meta";

const Sidebar = (props: types.react.ElemChildrenProps) => {
  const fetching = deps.query.use_is_fetching();
  const mutating = deps.query.use_is_mutating();
  const location = deps.router.use_location();

  const floating = deps.floating.use_floating({
    open: fetching + mutating > 0,
    onOpenChange: () => {},
    middleware: [],
  });

  const transition = deps.floating.use_transition_status(floating.context, {
    duration: 300,
  });

  return (
    <>
      <components.layout.stack.Stack direction="HORIZONTAL" overflow="HIDDEN">
        <components.layout.size_breakpoint.SizeBreakpoint
          def={<></>}
          md={
            utils.asite.match_path_only(location.pathname, "SECTOR") ? (
              <></>
            ) : (
              <components.layout.stack.Cell>
                <components.asite.sidebar.Panel />
              </components.layout.stack.Cell>
            )
          }
        />

        <components.layout.stack.Cell grow overflow="HIDDEN">
          <components.layout.stack.Stack direction="VERTICAL" overflow="HIDDEN">
            <components.layout.stack.Cell grow overflow="HIDDEN">
              <components.layout.scrollable.Scrollable direction="VERTICAL">
                {props.children}
              </components.layout.scrollable.Scrollable>
            </components.layout.stack.Cell>

            <components.layout.size_breakpoint.SizeBreakpoint
              def={
                utils.asite.match_path_only(location.pathname, "SECTOR") ? (
                  <></>
                ) : (
                  <components.layout.stack.Cell>
                    <components.asite.sidebar.Panel />
                  </components.layout.stack.Cell>
                )
              }
              md={<></>}
            />
          </components.layout.stack.Stack>
        </components.layout.stack.Cell>
      </components.layout.stack.Stack>

      {transition.isMounted ? (
        <div
          className={[
            "fixed",
            "z-50",
            "top-0",
            "left-0",
            "w-full",
            fetching + mutating > 0 ? "h-full" : undefined,
          ].join_class_name()}
          ref={floating.refs.setFloating}
        >
          <div
            className={[
              "h-1",
              "transition-all",
              "duration-200",
              utils.layout.match_pri_background(),
            ].join_class_name()}
            style={{
              width: `${
                transition.status === "initial"
                  ? 0
                  : fetching + mutating === 0
                  ? 100
                  : (1 - (fetching + mutating) / (fetching + mutating + 3)) *
                    100
              }%`,
            }}
          />
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default Sidebar;
