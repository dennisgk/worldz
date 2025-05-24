import { components, types, utils } from "../../meta";

type Media =
  | { type: "LOCAL_MEDIA"; file: File }
  | { type: "SERVER_MEDIA"; id: string };

type PartialUploadProps = {
  prompt: string;
  server_default_files: Array<string>;
  mime_types: Array<string>;
  num_files?: number | undefined;
  disabled?: boolean | undefined;
};

const use_upload = (
  original_keys: { [key: string]: PartialUploadProps },
  get_local_media_name: (file: File) => string,
  get_server_media_name: (id: string) => string,
  on_server_media_click: types.general.Handler<string>
) => {
  const cur_keys = utils.react.use_ref({
    ...original_keys,
  });

  const [files, set_files] = utils.react.use_state(() => {
    let ret_obj: { [key: string]: Array<Media> } = {};

    for (const key of Object.keys(cur_keys.current)) {
      ret_obj[key] = cur_keys.current[key].server_default_files.map((v) => ({
        type: "SERVER_MEDIA",
        id: v,
      }));
    }

    return ret_obj;
  });

  const diff = utils.react.use_ref<{
    [key: string]: {
      local_files_to_upload: Array<File>;
      server_files_to_delete: Array<string>;
    };
  }>({});

  const elem = utils.react.use_memo(() => {
    let ret_obj: { [key: string]: types.react.Element } = {};

    for (const key of Object.keys(files)) {
      ret_obj[key] = (
        <components.asite.upload.Upload
          prompt={cur_keys.current[key].prompt}
          files={files[key]}
          get_local_media_name={get_local_media_name}
          get_server_media_name={get_server_media_name}
          on_server_media_click={on_server_media_click}
          mime_types={cur_keys.current[key].mime_types}
          num_files={cur_keys.current[key].num_files}
          disabled={cur_keys.current[key].disabled}
          on_change={(new_files: Array<Media>) => {
            let new_records = new_files.filter((v) => !files[key].includes(v));
            let del_records = files[key].filter((v) => !new_files.includes(v));

            if (!(key in diff.current)) {
              diff.current[key] = {
                local_files_to_upload: [],
                server_files_to_delete: [],
              };
            }

            for (const new_rec of new_records) {
              if (new_rec.type === "LOCAL_MEDIA")
                diff.current[key].local_files_to_upload.push(new_rec.file);
            }

            for (const del_rec of del_records) {
              if (
                del_rec.type === "LOCAL_MEDIA" &&
                diff.current[key].local_files_to_upload.includes(del_rec.file)
              )
                diff.current[key].local_files_to_upload.remove(del_rec.file);
              if (del_rec.type === "SERVER_MEDIA")
                diff.current[key].server_files_to_delete.push(del_rec.id);
            }

            set_files((files) => ({ ...files, [key]: new_files }));
          }}
        />
      );
    }

    return ret_obj;
  }, [
    files,
    get_local_media_name,
    get_server_media_name,
    on_server_media_click,
  ]);

  return {
    get_diff: (key: string) =>
      key in diff.current
        ? diff.current[key]
        : {
            local_files_to_upload: [],
            server_files_to_delete: [],
          },
    files: files,
    register_key: (key: string, props: PartialUploadProps) => {
      cur_keys.current = { ...cur_keys.current, [key]: props };
      set_files((files) => ({
        ...files,
        [key]: props.server_default_files.map((v) => ({
          type: "SERVER_MEDIA",
          id: v,
        })),
      }));
    },
    elem: elem,
  };
};

type UploadProps = {
  prompt: string;
  num_files?: number | undefined;

  get_local_media_name: (file: File) => string;
  get_server_media_name: (id: string) => string;

  on_server_media_click: types.general.Handler<string>;
  disabled?: boolean | undefined;

  mime_types: Array<string>;

  files: Array<Media>;
  on_change: types.general.Handler<Array<Media>>;
};

const Upload = (props: UploadProps) => {
  const [files_open, set_files_open] = utils.react.use_state(false);
  const modal = utils.react.use_context(components.asite.modal.Context);
  const uploader = utils.react.use_ref<HTMLInputElement>(undefined!);

  utils.react.use_effect(() => {
    uploader.current = document.createElement("input");
    uploader.current.type = "file";
    uploader.current.multiple = true;
    uploader.current.accept = props.mime_types.join(", ");
  }, []);

  utils.react.use_effect(() => {
    let ev_list = () =>
      utils.general.pass([...uploader.current.files!], (upl_files) => {
        let update_arr = [];
        let cur = 0;
        for (const file of upl_files) {
          if (
            props.num_files !== undefined &&
            props.files.length + cur + 1 > props.num_files
          )
            break;

          update_arr.push(file);
          cur++;
        }

        if (update_arr.length > 0) {
          let new_files = [
            ...props.files,
            ...update_arr.map((v) => ({
              type: "LOCAL_MEDIA" as "LOCAL_MEDIA",
              file: v,
            })),
          ];

          props.on_change(new_files);
          set_files_open(true);
          uploader.current.value = "";
        }
      });

    uploader.current.addEventListener("change", ev_list);
    if (props.files.length === 0) set_files_open(false);

    return () => uploader.current.removeEventListener("change", ev_list);
  }, [props.files]);

  return (
    <>
      <components.layout.stack.Cell>
        <components.layout.stack.Stack direction="VERTICAL">
          <components.layout.stack.Cell>
            <components.layout.text.Text size="LARGE" bold>
              {props.prompt}
            </components.layout.text.Text>
          </components.layout.stack.Cell>

          <components.layout.stack.Cell>
            <components.layout.stack.Stack direction="VERTICAL" gap="LARGE">
              <components.layout.stack.Cell>
                <components.layout.stack.Stack
                  direction="HORIZONTAL"
                  gap="LARGE"
                >
                  {props.disabled === true ? (
                    <></>
                  ) : (
                    <components.layout.stack.Cell width="w-1/2">
                      <components.layout.level.Ascend>
                        <components.asite.text_button.TextButton
                          on_click={() => uploader.current.click()}
                        >
                          Upload
                        </components.asite.text_button.TextButton>
                      </components.layout.level.Ascend>
                    </components.layout.stack.Cell>
                  )}

                  <components.layout.stack.Cell
                    width={props.disabled === true ? undefined : "w-1/2"}
                    grow={props.disabled === true ? true : undefined}
                  >
                    <components.layout.level.Ascend>
                      <components.asite.text_button.TextButton
                        on_click={() => {
                          if (props.files.length > 0 && !files_open)
                            set_files_open(true);
                          else set_files_open(false);
                        }}
                        ring={files_open ? "PRIMARY" : "HOVER"}
                      >
                        {`Files (${
                          props.files.length +
                          (props.num_files !== undefined
                            ? `/${props.num_files}`
                            : "")
                        })`}
                      </components.asite.text_button.TextButton>
                    </components.layout.level.Ascend>
                  </components.layout.stack.Cell>
                </components.layout.stack.Stack>
              </components.layout.stack.Cell>

              {files_open ? (
                <components.layout.stack.Cell>
                  <components.layout.level.Ascend>
                    <components.layout.wrapper.Wrapper
                      border_radius="MEDIUM"
                      background="LEVEL"
                    >
                      {props.files.length > 0 ? (
                        <components.asite.item_viewer.ItemViewer
                          items={props.files.map((x) => ({
                            icon: components.icon.file.File,
                            name: utils.general.match_str_val(x.type, {
                              LOCAL_MEDIA: () =>
                                props.get_local_media_name((x as any).file),
                              SERVER_MEDIA: () =>
                                props.get_server_media_name((x as any).id),
                            })(),
                            on_click: () =>
                              utils.general.match_str_val(x.type, {
                                LOCAL_MEDIA: () =>
                                  window
                                    .open(
                                      URL.createObjectURL((x as any).file),
                                      "_blank"
                                    )!
                                    .focus(),
                                SERVER_MEDIA: () =>
                                  props.on_server_media_click((x as any).id),
                              })(),
                            on_remove: () =>
                              modal((dismiss) => (
                                <components.asite.modal.confirmation.Confirmation
                                  prompt="Are you sure you want to delete this file?"
                                  on_click_cancel={() => dismiss()}
                                  on_click_yes={() => {
                                    props.on_change(
                                      props.files.filter((v) => v !== x)
                                    );
                                    dismiss();
                                  }}
                                />
                              )),
                          }))}
                        />
                      ) : (
                        <components.layout.wrapper.Wrapper
                          x_padding="MEDIUM"
                          y_padding="MEDIUM"
                        >
                          <components.layout.text.Text
                            size="LARGE"
                            color="PRIMARY"
                          >
                            No files
                          </components.layout.text.Text>
                        </components.layout.wrapper.Wrapper>
                      )}
                    </components.layout.wrapper.Wrapper>
                  </components.layout.level.Ascend>
                </components.layout.stack.Cell>
              ) : (
                <></>
              )}
            </components.layout.stack.Stack>
          </components.layout.stack.Cell>
        </components.layout.stack.Stack>
      </components.layout.stack.Cell>
    </>
  );
};

export { Upload, use_upload };
