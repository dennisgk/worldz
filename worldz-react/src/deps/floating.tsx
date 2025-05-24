import { types } from "../meta";

import {
  useFloating as use_floating,
  autoUpdate as auto_update,
  offset,
  flip,
  shift,
  useDismiss as use_dismiss,
  useClick as use_click,
  useInteractions as use_interactions,
  FloatingFocusManager,
  useTransitionStyles as use_transition_styles,
  useTransitionStatus as use_transition_status,
} from "@floating-ui/react";

type FloatingClickProps = {
  ref: types.react.LegacyRef<HTMLAnchorElement>;
  props: Record<string, unknown>;
};

export {
  use_floating,
  auto_update,
  offset,
  flip,
  shift,
  use_dismiss,
  use_click,
  use_interactions,
  FloatingFocusManager,
  use_transition_styles,
  use_transition_status,
};

export type { FloatingClickProps };
