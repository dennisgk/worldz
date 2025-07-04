import { types } from "../meta";

type TailwindSize =
  | 0
  | 0.5
  | 1
  | 1.5
  | 2
  | 2.5
  | 3
  | 3.5
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 14
  | 16
  | 20
  | 24
  | 28
  | 32
  | 36
  | 40
  | 44
  | 48
  | 52
  | 56
  | 60
  | 64
  | 72
  | 80
  | 96
  | "1/2";

type TailwindBreakpoint = "sm" | "md" | "lg" | "xl" | "2xl";
type TailwindColumns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

type Padding = types.general.range.DeterminateCategory;
type Gap = types.general.range.DeterminateExCategory;
type BorderRadius = types.general.range.DeterminateCategory;
type Size = types.general.range.DeterminateExCategory;

type WidthBase =
  | "w-full"
  | "w-fit"
  | `w-[${number}%]`
  | `w-[${number}px]`
  | `w-${TailwindSize}`
  | `${TailwindBreakpoint}:w-full`
  | `${TailwindBreakpoint}:w-fit`
  | `${TailwindBreakpoint}:w-[${number}%]`
  | `${TailwindBreakpoint}:w-[${number}px]`
  | `${TailwindBreakpoint}:w-${TailwindSize}`;
type HeightBase =
  | "h-full"
  | "h-fit"
  | `h-[${number}%]`
  | `h-[${number}px]`
  | `h-${TailwindSize}`
  | `${TailwindBreakpoint}:h-full`
  | `${TailwindBreakpoint}:h-fit`
  | `${TailwindBreakpoint}:h-[${number}%]`
  | `${TailwindBreakpoint}:h-[${number}px]`
  | `${TailwindBreakpoint}:h-${TailwindSize}` | "h-[100dvh]";

type Width = WidthBase | Array<WidthBase>;
type Height = HeightBase | Array<HeightBase>;

type Stroke = 0 | 1 | 2 | 3;
type Rotation = 0 | 90 | 180 | 270;
type Transition = "ALL";

type Background = "LEVEL";
type Color = "PRIMARY";
type Overflow = "HIDDEN";
type Bold = boolean;
type Group = boolean;
type Grow = boolean | 2;
type AspectRatio = "SQUARE";

type Ring = "PRIMARY" | "HOVER" | "GROUP_HOVER" | "FOCUS";
type Underline = "COLOR" | "HOVER" | "GROUP_HOVER";
type Corner = "TOP_LEFT" | "TOP_RIGHT" | "BOTTOM_LEFT" | "BOTTOM_RIGHT";

type Align = "START" | "END" | "CENTER";

type Direction = "HORIZONTAL" | "VERTICAL";
type AnyDirection = Direction | "ANY";

type ColumnsBase =
  | `grid-cols-${TailwindColumns}`
  | `grid-cols-[${string}]`
  | `${TailwindBreakpoint}:grid-cols-${TailwindColumns}`
  | `${TailwindBreakpoint}:grid-cols-[${string}]`;
type Columns = ColumnsBase | Array<ColumnsBase>;

type RowsBase =
  | `grid-rows-${TailwindColumns}`
  | `grid-rows-[${string}]`
  | `${TailwindBreakpoint}:grid-rows-${TailwindColumns}`
  | `${TailwindBreakpoint}:grid-rows-[${string}]`;
type Rows = RowsBase | Array<RowsBase>;

type ColumnSpanBase =
  | `col-span-${TailwindColumns}`
  | `${TailwindBreakpoint}:col-span-${TailwindColumns}`;
type ColumnSpan = ColumnSpanBase | Array<ColumnSpanBase>;

type Font = "MONO";

export type {
  AspectRatio,
  Padding,
  Gap,
  Direction,
  AnyDirection,
  BorderRadius,
  Width,
  Height,
  Align,
  Size,
  Background,
  Color,
  Stroke,
  Overflow,
  Bold,
  Grow,
  Ring,
  Rotation,
  Transition,
  Group,
  TailwindBreakpoint,
  Columns,
  ColumnSpan,
  Corner,
  Rows,
  Underline,
  Font,
};
