import { components, types, utils } from "../../meta";

type ItemPathProps = {
  breadcrumbs: Array<{
    text: string;
    href: string | undefined;
    on_click: types.general.Handler<types.react.MouseEvent<HTMLAnchorElement>>;
  }>;
};

const BreadcrumbsContext = utils.react.create_context<{
  set_breadcrumbs: types.general.Handler<ItemPathProps["breadcrumbs"]>;
}>(undefined!);

const Breadcrumbs = (
  props: types.react.RequiredChildrenProps & {
    breadcrumbs: ItemPathProps["breadcrumbs"];
  }
) => {
  const breadcrumbs_context = utils.react.use_context(
    components.asite.item_path.BreadcrumbsContext
  );

  utils.react.use_effect(() => {
    breadcrumbs_context.set_breadcrumbs(props.breadcrumbs);

    return () => breadcrumbs_context.set_breadcrumbs([]);
  }, []);

  return <>{props.children}</>;
};

const ItemPath = (props: ItemPathProps) => (
  <components.layout.scrollable.Scrollable direction="HORIZONTAL" hidden>
    <components.layout.stack.Stack direction="HORIZONTAL" gap="MEDIUM">
      {props.breadcrumbs.map_with_between(
        (v, index) => (
          <components.layout.stack.Cell key={`${index}_${v.text}`}>
            <components.layout.link.Link
              size="LARGE"
              color="PRIMARY"
              underline="HOVER"
              href={v.href}
              on_click={v.on_click}
            >
              {v.text}
            </components.layout.link.Link>
          </components.layout.stack.Cell>
        ),
        (_value_before, index_before, _value_after, index_after) => (
          <components.layout.stack.Cell
            key={`${index_before}_${index_after}_sep`}
          >
            <components.layout.text.Text size="LARGE">
              /
            </components.layout.text.Text>
          </components.layout.stack.Cell>
        )
      )}
    </components.layout.stack.Stack>
  </components.layout.scrollable.Scrollable>
);

export { ItemPath, BreadcrumbsContext, Breadcrumbs };
