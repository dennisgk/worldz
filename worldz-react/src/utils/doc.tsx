import { utils } from "../meta";

const use_theme = () => {
  //if (window.matchMedia(utils.layout.match_dark_theme()).matches) {
    document.documentElement.classList.add(utils.layout.match_dark());
  //}

  /*window
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
    });*/
};

const is_mobile = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/gim.test(
    navigator.userAgent
  );

const enable_leave_prompt = () => {
  window.addEventListener("beforeunload", leave_handler);
}

const disable_leave_prompt = () => {
  window.removeEventListener("beforeunload", leave_handler);
}

const leave_handler = (e: any) => {
  e.preventDefault();
  e.returnValue = "";
}

export { use_theme, is_mobile, enable_leave_prompt, disable_leave_prompt };
