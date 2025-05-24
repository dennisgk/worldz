import { types, utils, components } from "../../meta";

type LineProps = {
  direction: types.layout.Direction;
};

const Line = (props: LineProps) => {
  const level = utils.react.use_context(components.layout.level.Context);

  return (
    <>
      {props.direction === "HORIZONTAL" ? (
        <div
          className={[
            "border-b",
            "w-full",
            utils.layout.match_border_color(level),
          ].join_class_name()}
        />
      ) : (
        <div
          className={[
            "border-l",
            "h-full",
            utils.layout.match_border_color(level),
          ].join_class_name()}
        />
      )}
    </>
  );
};

export { Line };
