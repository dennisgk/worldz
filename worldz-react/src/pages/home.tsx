import { components, deps, utils } from "../meta";

const Home = () => {
  const query_worldz = deps.query.use_query({
    queryKey: ["query_worldz"],
    queryFn: utils
      .pipe<1>()
      .sa(0, async () => await fetch(`${utils.asite.PY_BACKEND}/api/worldz`))
      .gsa(0, 0, async (v) => await v.json())
      .ex()
      .vc(0),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: false,
    gcTime: 0,
    placeholderData: {},
  });

  const navigate = deps.router.use_navigate();

  return (
    <components.asite.page_wrap.PageWrap text="Home">
      <components.layout.scrollable.Scrollable direction="VERTICAL">
        <components.layout.stack.Stack direction="VERTICAL">
          <components.layout.stack.Cell>
            <components.layout.level.Ascend>
              <components.layout.grid.Grid
                cols={["grid-cols-2", "md:grid-cols-3", "xl:grid-cols-4"]}
                gap="MEDIUM"
              >
                {Object.keys(query_worldz.data).map((v) => (
                  <components.layout.grid.Cell key={v}>
                    <components.asite.image_button.ImageButton
                      text={query_worldz.data[v].name}
                      src="/assets/sector.webp"
                      on_click={() =>
                        navigate(
                          `/sector?${deps.router.create_search_params({
                            id: v,
                          })}`
                        )
                      }
                    />
                  </components.layout.grid.Cell>
                ))}
              </components.layout.grid.Grid>
            </components.layout.level.Ascend>
          </components.layout.stack.Cell>
        </components.layout.stack.Stack>
      </components.layout.scrollable.Scrollable>
    </components.asite.page_wrap.PageWrap>
  );
};

export { Home };
