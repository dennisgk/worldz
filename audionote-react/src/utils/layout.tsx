import { types, utils } from "../meta";

const match_primary = (prefix: "ring" | "text" | "--color" | "bg") => {
  switch (prefix) {
    case "ring":
      return "ring-pri-500";
    case "text":
      return "text-pri-500";
    case "--color":
      return "--color-pri-500";
    case "bg":
      return "bg-pri-500";
  }
};

const match_pri_css_var = () => match_primary("--color");
const match_sec_css_var = (level: number) => `--color-sec-${level * 100}`;
const match_dark = () => "dark";
const match_pri_background = () => match_primary("bg");

const match_size_breakpoint = (breakpoint: types.layout.TailwindBreakpoint) =>
  utils.general.match_str_val(breakpoint, {
    sm: "(min-width: 640px)",
    md: "(min-width: 768px)",
    lg: "(min-width: 1024px)",
    xl: "(min-width: 1280px)",
    "2xl": "(min-width: 1536px)",
  });

const match_dark_theme = () => "(prefers-color-scheme: dark)";

const match_border_radius = (radius: types.layout.BorderRadius | undefined) =>
  radius === undefined
    ? "rounded-none"
    : utils.general.match_str_val(radius, {
        SMALL: "rounded",
        MEDIUM: "rounded-md",
        LARGE: "rounded-lg",
      });

const match_x_padding = (x_padding: types.layout.Padding | undefined) =>
  x_padding === undefined
    ? "px-0"
    : utils.general.match_str_val(x_padding, {
        SMALL: "px-1",
        MEDIUM: "px-2",
        LARGE: "px-3",
      });

const match_y_padding = (y_padding: types.layout.Padding | undefined) =>
  y_padding === undefined
    ? "py-0"
    : utils.general.match_str_val(y_padding, {
        SMALL: "py-1",
        MEDIUM: "py-2",
        LARGE: "py-3",
      });

const match_width = (width: types.layout.Width | undefined) =>
  width === undefined
    ? "w-auto"
    : typeof width === "string"
    ? width
    : width.join_class_name();

const match_height = (height: types.layout.Height | undefined) =>
  height === undefined
    ? "h-auto"
    : typeof height === "string"
    ? height
    : height.join_class_name();

const match_overflow_direction = (direction: types.layout.AnyDirection) =>
  utils.general.match_str_val(direction, {
    HORIZONTAL: ["overflow-x-auto", "overflow-y-hidden"].join_class_name(),
    VERTICAL: ["overflow-y-auto", "overflow-x-hidden"].join_class_name(),
    ANY: ["overflow-x-auto", "overflow-y-auto"].join_class_name(),
  });

const match_level_background = (level: number) =>
  utils.general.match_num_val(level, [
    "bg-white dark:bg-black",
    //"bg-sec-50 dark:bg-sec-950",
    "bg-sec-100 dark:bg-sec-900",
    "bg-sec-200 dark:bg-sec-800",
    "bg-sec-300 dark:bg-sec-700",
    "bg-sec-400 dark:bg-sec-600",
    "bg-sec-500 dark:bg-sec-500",
    "bg-sec-600 dark:bg-sec-400",
    "bg-sec-700 dark:bg-sec-300",
    "bg-sec-800 dark:bg-sec-200",
    "bg-sec-900 dark:bg-sec-100",
    //"bg-sec-950 dark:bg-sec-50",
  ]);

const match_border_color = (level: number) =>
  utils.general.match_num_val(level, [
    "border-white dark:border-black",
    //"border-sec-50 dark:border-sec-950",
    "border-sec-100 dark:border-sec-900",
    "border-sec-200 dark:border-sec-800",
    "border-sec-300 dark:border-sec-700",
    "border-sec-400 dark:border-sec-600",
    "border-sec-500 dark:border-sec-500",
    "border-sec-600 dark:border-sec-400",
    "border-sec-700 dark:border-sec-300",
    "border-sec-800 dark:border-sec-200",
    "border-sec-900 dark:border-sec-100",
    //"border-sec-950 dark:border-sec-50",
  ]);

const match_hover_level_background = (level: number) =>
  utils.general.match_num_val(level, [
    "hover:bg-white dark:hover:bg-black",
    //"hover:bg-sec-50 dark:hover:bg-sec-950",
    "hover:bg-sec-100 dark:hover:bg-sec-900",
    "hover:bg-sec-200 dark:hover:bg-sec-800",
    "hover:bg-sec-300 dark:hover:bg-sec-700",
    "hover:bg-sec-400 dark:hover:bg-sec-600",
    "hover:bg-sec-500 dark:hover:bg-sec-500",
    "hover:bg-sec-600 dark:hover:bg-sec-400",
    "hover:bg-sec-700 dark:hover:bg-sec-300",
    "hover:bg-sec-800 dark:hover:bg-sec-200",
    "hover:bg-sec-900 dark:hover:bg-sec-100",
    //"hover:bg-sec-950 dark:hover:bg-sec-50",
  ]);

const match_color = (color?: types.layout.Color) =>
  color === undefined
    ? undefined
    : utils.general.match_str_val(color, {
        PRIMARY: match_primary("text"),
      });

const match_background = (
  background: types.layout.Background | undefined,
  level: number
) =>
  background === undefined
    ? undefined
    : utils.general.match_str_val(background, {
        LEVEL: utils.layout.match_level_background(level),
      });

const match_overflow = (overflow: types.layout.Overflow | undefined) =>
  overflow === undefined
    ? undefined
    : utils.general.match_str_val(overflow, {
        HIDDEN: "overflow-hidden",
      });

const match_text_overflow = (overflow: types.layout.Overflow | undefined) =>
  overflow === undefined
    ? undefined
    : utils.general.match_str_val(overflow, {
        HIDDEN: "text-ellipsis overflow-hidden whitespace-nowrap",
      });

const match_aspect_ratio = (
  aspect_ratio: types.layout.AspectRatio | undefined
) =>
  aspect_ratio === undefined
    ? undefined
    : utils.general.match_str_val(aspect_ratio, {
        SQUARE: "aspect-square",
      });

const match_group = (group: types.layout.Group | undefined) =>
  group === true ? "group" : undefined;

const match_grow = (grow: types.layout.Grow | undefined) =>
  grow === true ? "grow" : grow === 2 ? "grow-[2]" : undefined;

const match_stroke = (stroke: types.layout.Stroke) =>
  utils.general.match_num_val(stroke, [
    "stroke-0",
    "stroke-1",
    "stroke-2",
    "stroke-3",
  ]);

const match_rotation = (rotate: types.layout.Rotation | undefined) =>
  utils.general.match_num_val((rotate ?? 0) / 90, [
    "rotate-0",
    "rotate-90",
    "rotate-180",
    "-rotate-90",
  ]);

const match_transition = (transition: types.layout.Transition | undefined) =>
  transition === undefined
    ? undefined
    : utils.general.match_str_val(transition, {
        ALL: "transition-all",
      });

const match_underline = (underline: types.layout.Underline | undefined) =>
  underline === undefined
    ? undefined
    : utils.general.match_str_val(underline, {
        COLOR: "underline",
        HOVER: "hover:underline",
        GROUP_HOVER: "group-hover:underline",
      });

const match_ring = (ring: types.layout.Ring | undefined, level: number) =>
  ring === undefined
    ? undefined
    : utils.general.match_str_val(ring, {
        PRIMARY: [
          "ring-inset",
          "ring-2",
          "outline-none",
          match_primary("ring"),
        ].join_class_name(),
        HOVER: [
          "hover:ring-inset",
          "hover:ring-2",
          "hover:outline-none",
          utils.general.match_num_val(level, [
            "hover:ring-white dark:hover:ring-black",
            //"hover:ring-sec-50 dark:hover:ring-sec-950",
            "hover:ring-sec-100 dark:hover:ring-sec-900",
            "hover:ring-sec-200 dark:hover:ring-sec-800",
            "hover:ring-sec-300 dark:hover:ring-sec-700",
            "hover:ring-sec-400 dark:hover:ring-sec-600",
            "hover:ring-sec-500 dark:hover:ring-sec-500",
            "hover:ring-sec-600 dark:hover:ring-sec-400",
            "hover:ring-sec-700 dark:hover:ring-sec-300",
            "hover:ring-sec-800 dark:hover:ring-sec-200",
            "hover:ring-sec-900 dark:hover:ring-sec-100",
            //"hover:ring-sec-950 dark:hover:ring-sec-50",
          ]),
        ].join_class_name(),
        GROUP_HOVER: [
          "group-hover:ring-inset",
          "group-hover:ring-2",
          "group-hover:outline-none",
          utils.general.match_num_val(level, [
            "group-hover:ring-white dark:group-hover:ring-black",
            //"group-hover:ring-sec-50 dark:group-hover:ring-sec-950",
            "group-hover:ring-sec-100 dark:group-hover:ring-sec-900",
            "group-hover:ring-sec-200 dark:group-hover:ring-sec-800",
            "group-hover:ring-sec-300 dark:group-hover:ring-sec-700",
            "group-hover:ring-sec-400 dark:group-hover:ring-sec-600",
            "group-hover:ring-sec-500 dark:group-hover:ring-sec-500",
            "group-hover:ring-sec-600 dark:group-hover:ring-sec-400",
            "group-hover:ring-sec-700 dark:group-hover:ring-sec-300",
            "group-hover:ring-sec-800 dark:group-hover:ring-sec-200",
            "group-hover:ring-sec-900 dark:group-hover:ring-sec-100",
            //"group-hover:ring-sec-950 dark:group-hover:ring-sec-50",
          ]),
        ].join_class_name(),
        FOCUS: [
          "focus:ring-inset",
          "focus:ring-2",
          "focus:outline-none",
          utils.general.match_num_val(level, [
            "focus:ring-white dark:focus:ring-black",
            //"focus:ring-sec-50 dark:focus:ring-sec-950",
            "focus:ring-sec-100 dark:focus:ring-sec-900",
            "focus:ring-sec-200 dark:focus:ring-sec-800",
            "focus:ring-sec-300 dark:focus:ring-sec-700",
            "focus:ring-sec-400 dark:focus:ring-sec-600",
            "focus:ring-sec-500 dark:focus:ring-sec-500",
            "focus:ring-sec-600 dark:focus:ring-sec-400",
            "focus:ring-sec-700 dark:focus:ring-sec-300",
            "focus:ring-sec-800 dark:focus:ring-sec-200",
            "focus:ring-sec-900 dark:focus:ring-sec-100",
            //"focus:ring-sec-950 dark:focus:ring-sec-50",
          ]),
        ].join_class_name(),
      });

const match_size = (size: types.layout.Size) =>
  utils.general.match_str_val(size, {
    SMALL: "text-xs",
    MEDIUM: "text-sm",
    LARGE: "text-base",
    EXTRA_LARGE: "text-lg",
    MEGA: "text-2xl",
    EXTRA_MEGA: "text-6xl",
  });

const match_align = (align: types.layout.Align) =>
  utils.general.match_str_val(align, {
    START: "justify-start",
    CENTER: "justify-center",
    END: "justify-end",
  });

const match_align_center = () =>
  ["items-center", match_align("CENTER")].join_class_name();

const match_text_align = (align: types.layout.Align | undefined) =>
  align === undefined
    ? undefined
    : utils.general.match_str_val(align, {
        START: "text-left",
        CENTER: "text-center",
        END: "text-right",
      });

const match_bold = (bold: types.layout.Bold | undefined) =>
  bold === true ? "font-semibold" : "font-normal";

const match_direction = (direction: types.layout.Direction) =>
  utils.general.match_str_val(direction, {
    HORIZONTAL: "flex-row",
    VERTICAL: "flex-col",
  });

const match_x_gap = (gap: types.layout.Gap | undefined) =>
  gap === undefined
    ? "gap-x-0"
    : utils.general.match_str_val(gap, {
        SMALL: "gap-x-1",
        MEDIUM: "gap-x-2",
        LARGE: "gap-x-3",
        EXTRA_LARGE: "gap-x-4",
        MEGA: "gap-x-16",
        EXTRA_MEGA: "gap-x-20",
      });

const match_y_gap = (gap: types.layout.Gap | undefined) =>
  gap === undefined
    ? "gap-y-0"
    : utils.general.match_str_val(gap, {
        SMALL: "gap-y-1",
        MEDIUM: "gap-y-2",
        LARGE: "gap-y-3",
        EXTRA_LARGE: "gap-y-4",
        MEGA: "gap-y-16",
        EXTRA_MEGA: "gap-y-20",
      });

const match_float = (float: types.layout.Align | undefined) =>
  float === undefined
    ? undefined
    : utils.general.match_str_val(float, {
        START: "mb-auto",
        CENTER: "my-auto",
        END: "mt-auto",
      });

const match_template_columns = (cols: types.layout.Columns) =>
  typeof cols === "string" ? cols : cols.join_class_name();

const match_template_rows = (rows?: types.layout.Rows) =>
  rows === undefined
    ? undefined
    : typeof rows === "string"
    ? rows
    : rows.join_class_name();

const match_column_span = (col_span: types.layout.ColumnSpan | undefined) =>
  col_span === undefined
    ? undefined
    : typeof col_span === "string"
    ? col_span
    : col_span.join_class_name();

const match_corner = (corner: types.layout.Corner) =>
  utils.general.match_str_val(corner, {
    TOP_LEFT: ["top-0", "left-0"].join_class_name(),
    TOP_RIGHT: ["top-0", "right-0"].join_class_name(),
    BOTTOM_LEFT: ["bottom-0", "left-0"].join_class_name(),
    BOTTOM_RIGHT: ["bottom-0", "right-0"].join_class_name(),
  });

export {
  match_border_radius,
  match_x_padding,
  match_y_padding,
  match_level_background,
  match_border_color,
  match_color,
  match_background,
  match_hover_level_background,
  match_ring,
  match_stroke,
  match_overflow,
  match_overflow_direction,
  match_text_overflow,
  match_width,
  match_height,
  match_size,
  match_bold,
  match_align,
  match_align_center,
  match_text_align,
  match_direction,
  match_x_gap,
  match_y_gap,
  match_pri_css_var,
  match_sec_css_var,
  match_pri_background,
  match_rotation,
  match_group,
  match_transition,
  match_size_breakpoint,
  match_dark_theme,
  match_dark,
  match_template_columns,
  match_grow,
  match_column_span,
  match_corner,
  match_template_rows,
  match_float,
  match_aspect_ratio,
  match_underline,
};
