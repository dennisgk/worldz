import { components } from "../../meta";

const Close = (props: components.icon.Props) => (
  <svg
    viewBox="-0.5 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={components.icon.get_class_name(props)}
  >
    <path
      d="M3 21.32L21 3.32001"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 3.32001L21 21.32"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export { Close };
