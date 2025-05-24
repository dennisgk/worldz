import { components, deps, pages, utils } from "../meta";

const Root = () => {
  const router = utils.react.use_ref(
    deps.router.create_browser_router(
      deps.router.create_routes_from_elements(
        <>
          <deps.router.Route
            path="*"
            element={
              <components.asite.modal.Modal>
                <components.asite.sidebar.Sidebar>
                  <deps.router.Routes>
                    <deps.router.Route index element={<pages.home.Home />} />
                    <deps.router.Route
                      path="/tags"
                      element={<pages.tags.Tags />}
                    />
                    <deps.router.Route
                      path="/settings"
                      element={<pages.settings.Settings />}
                    />
                    <deps.router.Route
                      path="*"
                      element={<deps.router.Navigate to="/" />}
                    />
                  </deps.router.Routes>
                </components.asite.sidebar.Sidebar>
              </components.asite.modal.Modal>
            }
          />
        </>
      )
    )
  );

  return <deps.router.RouterProvider router={router.current} />;
};

export { Root };
