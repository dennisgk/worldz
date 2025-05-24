import { components } from "../../meta";

const Spinner = (props: components.icon.Props) => (
  <svg
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={components.icon.get_class_name(props)}
  >
    <g className="spinner_V8m1">
      <circle cx="12" cy="12" r="9.5" fill="none"></circle>
    </g>
  </svg>
);

export { Spinner };
