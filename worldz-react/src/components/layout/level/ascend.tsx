import { components, types, utils } from "../../../meta";

const Ascend = (props: types.react.RequiredChildrenProps) => {
  const val = utils.react.use_context(components.layout.level.Context);

  return (
    <components.layout.level.Context.Provider
      value={components.layout.level.get_ascend(val)}
    >
      {props.children}
    </components.layout.level.Context.Provider>
  );
};

export default Ascend;
