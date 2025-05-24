import { components, deps, utils } from "../../../meta";

const PanelAppsButton = () => {
  const navigate = deps.router.use_navigate();
  const location = deps.router.use_location();

  const dropdown = components.asite.dropdown.use_dropdown([
    <components.asite.dropdown.Option
      key="Tags"
      text="Tags"
      href="/tags"
      on_click={() => navigate("/tags")}
      underline={
        utils.asite.match_path_only(location.pathname, "TAGS")
          ? "COLOR"
          : "HOVER"
      }
    />,
    <components.asite.dropdown.Option
      key="Settings"
      text="Settings"
      href="/settings"
      on_click={() => navigate("/settings")}
      underline={
        utils.asite.match_path_only(
          location.pathname,
          "SETTINGS"
        )
          ? "COLOR"
          : "HOVER"
      }
    />,
  ]);

  return (
    <>
      <components.layout.icon_button.IconButton
        icon={components.icon.cube.Cube}
        ring={
          dropdown.is_open ||
          utils.asite.match_inner(location.pathname)
            ? "PRIMARY"
            : "HOVER"
        }
        floating={dropdown.floating}
      />

      {dropdown.elem}
    </>
  );
};

export default PanelAppsButton;
