import { types } from "../meta";

import {
  FC,
  ReactElement as Element,
  MouseEvent,
  DragEvent,
  ChangeEvent,
  LegacyRef,
} from "react";

type UndefinedChildrenProps = types.general.ChildrenObj<undefined>;
type ElemChildrenProps = types.general.ChildrenObj<Element>;
type StringChildrenProps = types.general.ChildrenObj<string>;
type ElemArrChildrenProps = types.general.ChildrenObj<Array<Element>>;

type RequiredChildrenProps =
  | ElemChildrenProps
  | StringChildrenProps
  | ElemArrChildrenProps;
type OptionalChildrenProps = RequiredChildrenProps | UndefinedChildrenProps;

export type {
  FC,
  Element,
  UndefinedChildrenProps,
  ElemChildrenProps,
  StringChildrenProps,
  ElemArrChildrenProps,
  OptionalChildrenProps,
  RequiredChildrenProps,
  MouseEvent,
  DragEvent,
  ChangeEvent,
  LegacyRef,
};
