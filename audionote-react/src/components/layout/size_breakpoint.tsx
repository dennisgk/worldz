import { types, utils } from "../../meta";

const size_breakpoint_order: Array<keyof SizeBreakpointProps> = [
  "2xl",
  "xl",
  "lg",
  "md",
  "sm",
  "def",
];

type SizeBreakpointProps = {
  def: types.react.Element;
} & {
  [K in types.layout.TailwindBreakpoint]?: types.react.Element | undefined;
};

const get_selected_breakpoint = () => {
  if (window.matchMedia(utils.layout.match_size_breakpoint("2xl")).matches)
    return "2xl";
  if (window.matchMedia(utils.layout.match_size_breakpoint("xl")).matches)
    return "xl";
  if (window.matchMedia(utils.layout.match_size_breakpoint("lg")).matches)
    return "lg";
  if (window.matchMedia(utils.layout.match_size_breakpoint("md")).matches)
    return "md";
  if (window.matchMedia(utils.layout.match_size_breakpoint("sm")).matches)
    return "sm";
  return "def";
};

const get_selected_child = (
  props: SizeBreakpointProps,
  selected_breakpoint: keyof SizeBreakpointProps
) => {
  let filter_sort_types = (types: Array<keyof SizeBreakpointProps>) =>
    Object.keys(props)
      .map((v) => ({
        key: v as keyof SizeBreakpointProps,
        val: props[v as keyof SizeBreakpointProps] as types.react.Element,
      }))
      .filter((v) => types.some((x) => v.key === x))
      .sort(
        (a, b) =>
          size_breakpoint_order.indexOf(a.key) -
          size_breakpoint_order.indexOf(b.key)
      )
      .map((v) => v.val);

  if (selected_breakpoint === "2xl") {
    let suitable = filter_sort_types(["2xl", "xl", "lg", "md", "sm", "def"]);

    if (suitable.length > 0) {
      return suitable[0];
    }
  }

  if (selected_breakpoint === "xl") {
    let suitable = filter_sort_types(["xl", "lg", "md", "sm", "def"]);

    if (suitable.length > 0) {
      return suitable[0];
    }
  }

  if (selected_breakpoint === "lg") {
    let suitable = filter_sort_types(["lg", "md", "sm", "def"]);

    if (suitable.length > 0) {
      return suitable[0];
    }
  }

  if (selected_breakpoint === "md") {
    let suitable = filter_sort_types(["md", "sm", "def"]);

    if (suitable.length > 0) {
      return suitable[0];
    }
  }

  if (selected_breakpoint === "sm") {
    let suitable = filter_sort_types(["sm", "def"]);

    if (suitable.length > 0) {
      return suitable[0];
    }
  }

  let suitable = filter_sort_types(["def"]);

  if (suitable.length > 0) {
    return suitable[0];
  }

  return <></>;
};

const SizeBreakpoint = (props: SizeBreakpointProps) => {
  const [selected_breakpoint, set_selected_breakpoint] = utils.react.use_state<
    keyof SizeBreakpointProps
  >(() => get_selected_breakpoint());

  const selected_child = utils.react.use_memo(
    () => get_selected_child(props, selected_breakpoint),
    [props, selected_breakpoint]
  );

  utils.react.use_effect(() => {
    let on_change = () => set_selected_breakpoint(get_selected_breakpoint());

    window
      .matchMedia(utils.layout.match_size_breakpoint("2xl"))
      .addEventListener("change", on_change);
    window
      .matchMedia(utils.layout.match_size_breakpoint("xl"))
      .addEventListener("change", on_change);
    window
      .matchMedia(utils.layout.match_size_breakpoint("lg"))
      .addEventListener("change", on_change);
    window
      .matchMedia(utils.layout.match_size_breakpoint("md"))
      .addEventListener("change", on_change);
    window
      .matchMedia(utils.layout.match_size_breakpoint("sm"))
      .addEventListener("change", on_change);

    return () => {
      window
        .matchMedia(utils.layout.match_size_breakpoint("2xl"))
        .addEventListener("change", on_change);
      window
        .matchMedia(utils.layout.match_size_breakpoint("xl"))
        .addEventListener("change", on_change);
      window
        .matchMedia(utils.layout.match_size_breakpoint("lg"))
        .addEventListener("change", on_change);
      window
        .matchMedia(utils.layout.match_size_breakpoint("md"))
        .addEventListener("change", on_change);
      window
        .matchMedia(utils.layout.match_size_breakpoint("sm"))
        .removeEventListener("change", on_change);
    };
  }, []);

  return selected_child;
};

export { SizeBreakpoint };
