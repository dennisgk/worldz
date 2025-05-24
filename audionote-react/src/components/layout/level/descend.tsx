import { components, types, utils } from "../../../meta";

const Descend = (props: types.react.RequiredChildrenProps) => {
  const val = utils.react.use_context(components.layout.level.Context);

  return (
    <components.layout.level.Context.Provider
      value={components.layout.level.get_descend(val)}
    >
      {props.children}
    </components.layout.level.Context.Provider>
  );
};

export default Descend;
