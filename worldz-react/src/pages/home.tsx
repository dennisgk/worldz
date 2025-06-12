import { components, deps, utils } from "../meta";

const Home = () => {
  const query_client = deps.query.use_query_client();

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

  const create_sector_mutation = deps.query.use_mutation({
    mutationFn: async (mut_props: { name: string }) =>
      await fetch(
        `${utils.asite.PY_BACKEND}/api/create_sector?name=${encodeURIComponent(
          mut_props.name
        )}`,
        { method: "POST" }
      ),
    onSuccess: () =>
      query_client.invalidateQueries({
        queryKey: ["query_worldz"],
      }),
  });

  const delete_sector_mutation = deps.query.use_mutation({
    mutationFn: async (mut_props: { id: string }) =>
      await fetch(
        `${utils.asite.PY_BACKEND}/api/delete_sector?id=${encodeURIComponent(
          mut_props.id
        )}`,
        { method: "POST" }
      ),
    onSuccess: () =>
      query_client.invalidateQueries({
        queryKey: ["query_worldz"],
      }),
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
                <>
                  {Object.keys(query_worldz.data)
                    .sort((a, b) =>
                      query_worldz.data[a].name.localeCompare(
                        query_worldz.data[b].name
                      )
                    )
                    .map((v) => (
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
                </>

                <components.layout.grid.Cell>
                  <components.asite.image_button.ImageButton
                    text="Add Sector"
                    src="/assets/create.webp"
                    on_click={() => {
                      let name = prompt("Name?");
                      if (name === null) return;

                      create_sector_mutation.mutate({ name: name });
                    }}
                  />
                </components.layout.grid.Cell>

                <components.layout.grid.Cell>
                  <components.asite.image_button.ImageButton
                    text="Delete Sector"
                    src="/assets/delete.png"
                    on_click={() => {
                      let id = prompt("ID?");
                      if (id === null) return;

                      delete_sector_mutation.mutate({ id: id });
                    }}
                  />
                </components.layout.grid.Cell>
              </components.layout.grid.Grid>
            </components.layout.level.Ascend>
          </components.layout.stack.Cell>
        </components.layout.stack.Stack>
      </components.layout.scrollable.Scrollable>
    </components.asite.page_wrap.PageWrap>
  );
};

export { Home };
