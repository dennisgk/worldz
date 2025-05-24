import { utils } from "../meta";

const use_theme = () => {
  if (window.matchMedia(utils.layout.match_dark_theme()).matches) {
    document.documentElement.classList.add(utils.layout.match_dark());
  }

  window
    .matchMedia(utils.layout.match_dark_theme())
    .addEventListener("change", ({ matches }) => {
      if (
        matches &&
        !document.documentElement.classList.contains(utils.layout.match_dark())
      ) {
        document.documentElement.classList.add(utils.layout.match_dark());
      }

      if (
        !matches &&
        document.documentElement.classList.contains(utils.layout.match_dark())
      ) {
        document.documentElement.classList.remove(utils.layout.match_dark());
      }
    });
};

export { use_theme };
