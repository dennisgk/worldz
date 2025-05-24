import { types, utils } from "../../meta";

type CellProps = types.react.ElemChildrenProps & {
  col_span?: types.layout.ColumnSpan | undefined;
  overflow?: types.layout.Overflow | undefined;
  aspect_ratio?: types.layout.AspectRatio | undefined;
};

const Cell = (props: CellProps) => (
  <div
    className={[
      "grow",
      "flex",
      utils.layout.match_column_span(props.col_span),
      utils.layout.match_overflow(props.overflow),
      utils.layout.match_aspect_ratio(props.aspect_ratio),
    ].join_class_name()}
  >
    {props.children}
  </div>
);

type GridProps = types.react.ElemArrChildrenProps & {
  cols: types.layout.Columns;
  rows?: types.layout.Rows;
  gap?: types.layout.Gap | undefined;
  overflow?: types.layout.Overflow | undefined;
};

const Grid = (props: GridProps) => (
  <div
    className={[
      "grid",
      "grow",
      utils.layout.match_overflow(props.overflow),
      utils.layout.match_template_columns(props.cols),
      utils.layout.match_template_rows(props.rows),
      utils.layout.match_x_gap(props.gap),
      utils.layout.match_y_gap(props.gap),
    ].join_class_name()}
  >
    {props.children ?? <></>}
  </div>
);

export { Cell, Grid };
