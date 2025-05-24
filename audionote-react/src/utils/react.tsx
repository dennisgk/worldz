import { createRoot as create_root } from "react-dom/client";
import {
  useState as use_state,
  useReducer as use_reducer,
  useCallback as use_callback,
  useEffect as use_effect,
  createContext as create_context,
  useContext as use_context,
  useRef as use_ref,
  useMemo as use_memo,
} from "react";

const get_root_elem = () => document.getElementById("root")!;

export {
  create_root,
  get_root_elem,
  create_context,
  use_state,
  use_reducer,
  use_callback,
  use_effect,
  use_context,
  use_ref,
  use_memo,
};
