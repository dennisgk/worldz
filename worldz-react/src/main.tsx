import "./stylesheets/index.css";

import { utils, pages, deps } from "./meta";

utils.linq.init_arr_prototype();

utils.doc.use_theme();

utils.react
  .create_root(utils.react.get_root_elem())
  .render(
      <deps.query.QueryClientProvider client={deps.query.query_client}><pages.root.Root /></deps.query.QueryClientProvider>);
