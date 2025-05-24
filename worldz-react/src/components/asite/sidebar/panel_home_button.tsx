import { components, deps, utils } from "../../../meta";

const PanelHomeButton = () => {
  const navigate = deps.router.use_navigate();
  const location = deps.router.use_location();

  return (
    <components.layout.icon_button.IconButton
      icon={components.icon.home.Home}
      ring={
        utils.asite.match_path_only(location.pathname, "HOME")
          ? "PRIMARY"
          : "HOVER"
      }
      on_click={() => navigate("/dashboard/home")}
      href="/dashboard/home"
    />
  );
};

export default PanelHomeButton;
