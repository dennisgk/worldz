import { deps, utils, components, types } from "../meta";

const Sector = () => {
  const mount_ref = utils.react.use_ref<HTMLDivElement>(null);
  const joystick_ref = utils.react.use_ref<HTMLDivElement>(null);
  const [command_overlay, set_command_overlay] = utils.react.use_state(false);
  const sector = utils.react.use_ref<utils.sector.Sector>(undefined!);

  const [command_value, set_command_value] = utils.react.use_state("");
  const [command_history, set_command_history] = utils.react.use_state<
    Array<[string, Array<string>]>
  >([]);
  const [running_command, set_running_command] = utils.react.use_state(false);

  const [editing_readme, set_editing_readme] = utils.react.use_state<undefined | string>(undefined);
  const [editing_readme_val, set_editing_readme_val] = utils.react.use_state<string>("");

  const [opening_readme, set_opening_readme] = utils.react.use_state<undefined | string>(undefined);

  const info_text_ref = utils.react.use_ref<HTMLSpanElement>(null);

  utils.react.use_effect(() => {
    if (mount_ref.current == null) return;

    let width = mount_ref.current.clientWidth;
    let height = mount_ref.current.clientHeight;

    sector.current = new utils.sector.Sector(
      width,
      height,
      (elem) => mount_ref!.current!.appendChild(elem),
      (text) => {
        if (info_text_ref.current === null) return;
        info_text_ref.current.innerText = text;
      },
      name => {
        console.log(name);
        set_opening_readme(name);
      }
    );

    return () => sector.current.deconstruct();
  }, []);

  utils.react.use_effect(() => {
    if (command_overlay) {
      document.getElementById("command_textbox")?.focus();
    }

    if (mount_ref.current == null) return;

    if (!utils.doc.is_mobile()) {
      mount_ref.current.addEventListener("click", (e) =>
        utils
          .pipe<1>()
          .s(0, () => (e.target as any).tagName.toLowerCase() === "canvas")
          .g(0, (_) => (_ ? sector.current.lock() : undefined))
          .g(0, _ => _ ? sector.current.click() : undefined)
          .ex()
          .nov()
      );
    }

    // Joystick on mobile
    if (utils.doc.is_mobile() && joystick_ref.current) {
      let joystick_manager = deps.nipplejs.create({
        zone: joystick_ref.current,
        mode: "static",
        position: { left: "100px", top: "100px" },
        size: 100,
        color: "blue",
      });

      joystick_manager.on("move", (_, data) => {
        if (data && data.vector) {
          const angle = Math.atan2(data.vector.y, data.vector.x);
          sector.current.move.forward = Math.cos(angle);
          sector.current.move.right = -Math.sin(angle);

          sector.current.speed_mult = Math.sqrt(
            data.vector.x ** 2 + data.vector.y ** 2
          );
        }
      });

      joystick_manager.on("end", () => {
        sector.current.move.forward = 0;
        sector.current.move.right = 0;
      });
    }

    // Desktop keyboard
    const onKeyDown = (e: KeyboardEvent) =>
      command_overlay
        ? e.code === "Escape"
          ? set_command_overlay(false)
          : undefined
        : e.code === "KeyE"
          ? sector.current.toggle_fly()
          : e.code === "Space"
            ? sector.current.is_flying()
              ? sector.current.fly_up()
              : sector.current.jump()
            : e.code === "ShiftLeft"
              ? sector.current.is_flying()
                ? sector.current.fly_down()
                : undefined
              : e.code === "KeyW"
                ? (sector.current.move.forward = 1)
                : e.code === "KeyS"
                  ? (sector.current.move.backward = 1)
                  : e.code === "KeyA"
                    ? (sector.current.move.left = 1)
                    : e.code === "KeyD"
                      ? (sector.current.move.right = 1)
                      : e.code === "KeyC"
                        ? utils
                          .pipe<1>()
                          .s(0, () => document.pointerLockElement !== null)
                          .g(0, (_) => (_ ? document.exitPointerLock() : undefined))
                          .no(() => e.preventDefault())
                          .no(
                            () =>
                            (sector.current.move = {
                              forward: 0,
                              backward: 0,
                              left: 0,
                              right: 0,
                            })
                          )
                          .no(() => set_command_overlay(true))
                          .ex()
                          .nov()
                        : undefined;
    const onKeyUp = (e: KeyboardEvent) =>
      command_overlay
        ? undefined
        : e.code === "Space"
          ? sector.current.is_flying()
            ? sector.current.fly_reset_up()
            : undefined
          : e.code === "ShiftLeft"
            ? sector.current.is_flying()
              ? sector.current.fly_reset_down()
              : undefined
            : e.code === "KeyW"
              ? (sector.current.move.forward = 0)
              : e.code === "KeyS"
                ? (sector.current.move.backward = 0)
                : e.code === "KeyA"
                  ? (sector.current.move.left = 0)
                  : e.code === "KeyD"
                    ? (sector.current.move.right = 0)
                    : undefined;
    if (!utils.doc.is_mobile()) {
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);

      return () => {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
      };
    }

    if (utils.doc.is_mobile()) {
      let pitch = 0; // vertical (X-axis rotation)
      let yaw = 0; // horizontal (Y-axis rotation)

      let tapCount = 0;
      let tapTimer: number | null = null;
      let sequenceTouchId: number | null = null;
      let tapStartTime = 0;
      let isDragging = false;
      let dragStartX = 0;
      let dragStartY = 0;
      let dragRealStartX = 0;
      let dragRealStartY = 0;
      const TAP_THRESHOLD = 0;
      const DOUBLE_TAP_DELAY = 250;
      const TAP_FLY_DEAD_ZONE = 15;

      let on_touch_start = (e: any) => {
        if (command_overlay) return;

        e.preventDefault();

        for (let touch of e.changedTouches) {
          if (
            !joystick_ref.current?.contains(touch.target as any) &&
            sequenceTouchId === null
          ) {
            sequenceTouchId = touch.identifier;
            dragStartX = touch.clientX;
            dragStartY = touch.clientY;
            dragRealStartX = touch.clientX;
            dragRealStartY = touch.clientY;
            isDragging = false;

            const now = Date.now();
            if (now - tapStartTime < DOUBLE_TAP_DELAY) {
              tapCount += 1;
            } else {
              tapCount = 1;
            }
            tapStartTime = now;

            if (tapTimer) clearTimeout(tapTimer);

            let curSequenceTouchId = sequenceTouchId;

            tapTimer = window.setTimeout(() => {
              if (!isDragging && curSequenceTouchId != sequenceTouchId) {
                if (tapCount === 2) {
                  sector.current.toggle_fly();
                }
                if (tapCount === 3) {
                  set_command_overlay(true);
                }
              }
              tapCount = 0;
            }, DOUBLE_TAP_DELAY);
          }
        }
      };

      let on_touch_move = (e: any) => {
        if (command_overlay) return;

        e.preventDefault();

        for (let touch of e.changedTouches) {
          if (touch.identifier === sequenceTouchId) {
            if (
              !isDragging &&
              Math.hypot(
                touch.clientX - dragRealStartX,
                touch.clientY - dragRealStartY
              ) > TAP_THRESHOLD
            ) {
              isDragging = true;

              if (tapCount === 2) {
                if (tapTimer) clearTimeout(tapTimer);
              }
            }

            if (isDragging && tapCount == 2) {
              sector.current.fly_reset_down();
              sector.current.fly_reset_up();

              if (
                Math.abs(touch.clientX - dragRealStartX) > TAP_FLY_DEAD_ZONE
              ) {
                if (touch.clientX - dragRealStartX > 0) {
                  sector.current.fly_up();
                } else {
                  sector.current.fly_down();
                }
              }
            }

            if (tapCount <= 1) {
              const dx = touch.clientX - dragStartX;
              const dy = touch.clientY - dragStartY;
              // Your camera logic
              const sensitivity = 0.006;
              yaw -= dx * sensitivity;
              pitch -= dy * sensitivity;

              const euler = new deps.three.Euler(
                -yaw,
                pitch,
                Math.PI / 2,
                "YXZ"
              );
              sector.current.camera_quat_set(euler);

              dragStartX = touch.clientX;
              dragStartY = touch.clientY;
            }
          }
        }
      };

      let on_touch_end = (e: any) => {
        if (command_overlay) return;

        e.preventDefault();

        for (let touch of e.changedTouches) {
          if (touch.identifier === sequenceTouchId) {
            if (!isDragging) {
              if (tapCount === 1) {
                sector.current.jump();
              }
            }

            sequenceTouchId = null;
            isDragging = false;

            sector.current.fly_reset_up();
            sector.current.fly_reset_down();

            if (
              Math.hypot(
                touch.clientX - dragRealStartX,
                touch.clientY - dragRealStartY
              ) > TAP_THRESHOLD
            ) {
              if (tapTimer) clearTimeout(tapTimer);
            }
          }
        }
      };

      mount_ref.current.addEventListener("touchstart", on_touch_start, {
        passive: false,
      });

      mount_ref.current.addEventListener("touchmove", on_touch_move, {
        passive: false,
      });

      mount_ref.current.addEventListener("touchend", on_touch_end, {
        passive: false,
      });

      return () => {
        mount_ref.current?.removeEventListener("touchstart", on_touch_start);
        mount_ref.current?.removeEventListener("touchmove", on_touch_move);
        mount_ref.current?.removeEventListener("touchend", on_touch_end);
      };
    }
  }, [command_overlay]);

  const process_command = () => {
    if (command_value.trim() == "") {
      set_command_value("");
      return;
    }

    const open_file_dialog = (accept: string, multiple: boolean = false) =>
      new Promise<Array<File>>((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = accept;
        input.multiple = multiple;
        input.style.display = "none";

        input.addEventListener("change", () => {
          if (input.files && input.files.length > 0) {
            resolve([...input.files]);
          } else {
            resolve([]);
          }
          document.body.removeChild(input);
        });

        input.addEventListener("cancel", () => resolve([]));

        document.body.appendChild(input);
        input.click();
      });

    let prom = async () => {
      const help = async () => [
        "help()",
        "clear()",
        "close()",
        "set_name(name)",
        "ls(folder?)",
        "delete_obj(folder, name)",
        "upload_gltf_glb(folder, name)",
        "upload_fbx(folder, name)",
        "upload_stl(folder, name)",
        "load(folder, name, local_name)",
        "load_text(text, local_name)",
        "create_tp_here(name)",
        "delete_tp(name)",
        "ls_tps()",
        "tp(name)",
        "ls_objs()",
        "get_obj_pos(name)",
        "get_obj_rot(name)",
        "get_obj_scale(name)",
        "set_obj_pos(name, x, y, z)",
        "set_obj_rot(name, x, y, z)",
        "set_obj_scale(name, x, y, z)",
        "edit_obj(name)",
        "override_mat(name, color)",
        "reset_mat(name)",
        "exit_edit()",
        "set_speed(num)",
        "get_speed()",
        "edit_readme(name)",
        "open_readme(name)",
        "ls_connects()",
        "connect(name1, name2)",
        "disconnect(name1, name2)",
      ];

      let _do_clear = false;

      const clear = async () => {
        _do_clear = true;
        return [];
      };

      const close = async () => {
        set_command_overlay(false);
        return [];
      };

      const set_name = async (name: string) => {
        if (name === undefined) {
          return ["Argument error"];
        }

        sector.current.set_name(name);
        return ["Name set"];
      };

      const _upload_obj = async (
        files: Array<File>,
        folder: string,
        name: string,
        model: types.sector.Model
      ) => {
        let form_data = new FormData();
        for (let i = 0; i < files.length; i++) {
          form_data.append("files", files[i]);
        }

        let f_resp = await fetch(
          `${utils.asite.PY_BACKEND}/api/upload_obj?folder=${encodeURIComponent(
            folder
          )}&name=${encodeURIComponent(name)}&model=${encodeURIComponent(
            model
          )}`,
          {
            method: "POST",
            body: form_data,
          }
        );

        if (f_resp.ok) return ["Okay"];

        return ["Error"];
      };

      const delete_obj = async (folder: string, name: string) => {
        if (
          (
            await fetch(
              `${utils.asite.PY_BACKEND
              }/api/delete_obj?folder=${encodeURIComponent(
                folder
              )}&name=${encodeURIComponent(name)}`,
              { method: "POST" }
            )
          ).ok
        )
          return ["Okay"];

        return ["Error"];
      };

      const ls = async (...args: Array<string>) => {
        if (args.length === 0)
          return await (
            await fetch(`${utils.asite.PY_BACKEND}/api/folders`)
          ).json();

        if (args.length === 1)
          return await (
            await fetch(
              `${utils.asite.PY_BACKEND
              }/api/folder_objs?folder=${encodeURIComponent(args[0])}`
            )
          ).json();

        return ["Argument error"];
      };

      const upload_gltf_glb = async (folder: string, name: string) => {
        if (folder === undefined || name === undefined) {
          return ["Argument error"];
        }

        let files = await open_file_dialog(".gltf,.glb");
        if (files.length !== 1) {
          return ["File needed"];
        }

        return _upload_obj(files, folder, name, "GLTF_GLB");
      };
      const upload_fbx = async (folder: string, name: string) => {
        if (folder === undefined || name === undefined) {
          return ["Argument error"];
        }

        let files = await open_file_dialog(".fbx");
        if (files.length !== 1) {
          return ["File needed"];
        }

        return _upload_obj(files, folder, name, "FBX");
      };
      const upload_stl = async (folder: string, name: string) => {
        if (folder === undefined || name === undefined) {
          return ["Argument error"];
        }

        let files = await open_file_dialog(".stl");
        if (files.length !== 1) {
          return ["File needed"];
        }

        return _upload_obj(files, folder, name, "STL");
      };

      const load = async (folder: string, name: string, local_name: string) => {
        if (folder === undefined || name === undefined || local_name === undefined) {
          return ["Argument error"];
        }

        let desc = await (
          await fetch(
            `${utils.asite.PY_BACKEND}/api/obj?folder=${encodeURIComponent(
              folder
            )}&name=${encodeURIComponent(name)}`
          )
        ).json();

        return await sector.current.load(
          folder,
          name,
          desc.files,
          desc.model,
          local_name
        );
      };

      const load_text = (text: string, name: string) => {
        if (text === undefined || name === undefined) {
          return ["Argument error"];
        }

        sector.current.load_text(text, name);
        return ["Loaded"];
      };

      const create_tp_here = async (name: string) => {
        if (name === undefined) {
          return ["Argument error"];
        }

        sector.current.create_tp_at_pos(name);
        return ["Created"];
      };

      const delete_tp = async (name: string) => {
        if (name === undefined) {
          return ["Argument error"];
        }

        sector.current.delete_tp(name);
        return ["Deleted"];
      };

      const ls_tps = async () => sector.current.ls_tps();

      const tp = async (name: string) => {
        if (name === undefined) {
          return ["Argument error"];
        }

        sector.current.tp(name);
        return ["Teleported"];
      };

      const ls_objs = async () => sector.current.ls_objs();

      const get_obj_pos = async (name: string) =>
        name === undefined
          ? ["Argument error"]
          : sector.current.get_obj_pos(name);

      const get_obj_rot = async (name: string) =>
        name === undefined
          ? ["Argument error"]
          : sector.current.get_obj_rot(name);

      const get_obj_scale = async (name: string) =>
        name === undefined
          ? ["Argument error"]
          : sector.current.get_obj_scale(name);

      const set_obj_pos = async (
        name: string,
        x: number,
        y: number,
        z: number
      ) => {
        if (
          name === undefined ||
          x === undefined ||
          y === undefined ||
          z === undefined
        )
          return ["Argument error"];

        sector.current.set_obj_pos(name, x, y, z);
        return ["Set"];
      };

      const set_obj_rot = async (
        name: string,
        x: number,
        y: number,
        z: number
      ) => {
        if (
          name === undefined ||
          x === undefined ||
          y === undefined ||
          z === undefined
        )
          return ["Argument error"];
        sector.current.set_obj_rot(name, x, y, z);
        return ["Set"];
      };

      const set_obj_scale = async (
        name: string,
        x: number,
        y: number,
        z: number
      ) => {
        if (
          name === undefined ||
          x === undefined ||
          y === undefined ||
          z === undefined
        )
          return ["Argument error"];
        sector.current.set_obj_scale(name, x, y, z);
        return ["Set"];
      };

      const edit_obj = async (name: string) => {
        if (name === undefined) return ["Argument error"];
        if (!sector.current.ls_objs().includes(name)) return ["Object not found"]
        sector.current.edit_obj(name);
        return ["Entered edit"];
      };

      const override_mat = async (name: string, color: number) => {
        if (name === undefined || color === undefined)
          return ["Argument error"];

        sector.current.override_mat(name, color);
        return ["Set"];
      };

      const reset_mat = async (name: string) => {
        if (name === undefined) {
          return ["Argument error"];
        }

        sector.current.reset_mat(name);
        return ["Reset", "This requires save? and reload"];
      };

      const exit_edit = async () => {
        sector.current.exit_edit();
        return ["Exited edit"];
      };

      const set_speed = async (num: number) => {
        sector.current.glob_speed_mult = num;
        return ["Set"];
      };

      const get_speed = async () => {
        return [sector.current.glob_speed_mult.toString()];
      };

      const edit_readme = async (name: string) => {
        if (name === undefined) return ["Argument error"];
        if(!sector.current.ls_objs().includes(name)) return ["No object found"]

        set_editing_readme(name);
        set_editing_readme_val(sector.current.get_readme(name)!);

        return ["Launched editor"];
      };

      const open_readme = async(name: string) => {
        if(name === undefined) return ["Argument error"];

        set_opening_readme(name);
        return ["Opened"];
      };

      const ls_connects = async () => sector.current.ls_connects();

      const connect = async (name1: string, name2: string) => { 
        if(name1 === undefined || name2 === undefined) return ["Argument error"];
        return sector.current.connect(name1, name2);
      };

      const disconnect = async (name1: string, name2: string) => {
        if(name1 === undefined || name2 === undefined) return ["Argument error"];
        return sector.current.disconnect(name1, name2);
       };

      let out_val: Array<string> = [];

      try {
        out_val = await eval(command_value);

        if (
          !(
            Array.isArray(out_val) &&
            out_val.every((item) => typeof item === "string")
          )
        ) {
          out_val = ["Wrong type"];
        }
      } catch (err) {
        console.error(err);
        out_val = ["Error"];
      }

      (window as any).UNREF_EVAL_OBJ = [];

      (window as any).UNREF_EVAL_OBJ.push(help);
      (window as any).UNREF_EVAL_OBJ.push(clear);
      (window as any).UNREF_EVAL_OBJ.push(close);

      (window as any).UNREF_EVAL_OBJ.push(set_name);
      (window as any).UNREF_EVAL_OBJ.push(ls);
      (window as any).UNREF_EVAL_OBJ.push(delete_obj);

      (window as any).UNREF_EVAL_OBJ.push(upload_gltf_glb);
      (window as any).UNREF_EVAL_OBJ.push(upload_fbx);
      (window as any).UNREF_EVAL_OBJ.push(upload_stl);
      (window as any).UNREF_EVAL_OBJ.push(load);
      (window as any).UNREF_EVAL_OBJ.push(load_text);

      (window as any).UNREF_EVAL_OBJ.push(create_tp_here);
      (window as any).UNREF_EVAL_OBJ.push(delete_tp);
      (window as any).UNREF_EVAL_OBJ.push(ls_tps);
      (window as any).UNREF_EVAL_OBJ.push(tp);

      (window as any).UNREF_EVAL_OBJ.push(ls_objs);
      (window as any).UNREF_EVAL_OBJ.push(get_obj_pos);
      (window as any).UNREF_EVAL_OBJ.push(get_obj_rot);
      (window as any).UNREF_EVAL_OBJ.push(get_obj_scale);
      (window as any).UNREF_EVAL_OBJ.push(set_obj_pos);
      (window as any).UNREF_EVAL_OBJ.push(set_obj_rot);
      (window as any).UNREF_EVAL_OBJ.push(set_obj_scale);
      (window as any).UNREF_EVAL_OBJ.push(edit_obj);
      (window as any).UNREF_EVAL_OBJ.push(override_mat);
      (window as any).UNREF_EVAL_OBJ.push(reset_mat);
      (window as any).UNREF_EVAL_OBJ.push(exit_edit);
      (window as any).UNREF_EVAL_OBJ.push(set_speed);
      (window as any).UNREF_EVAL_OBJ.push(get_speed);

      (window as any).UNREF_EVAL_OBJ.push(open_readme);
      (window as any).UNREF_EVAL_OBJ.push(edit_readme);
      (window as any).UNREF_EVAL_OBJ.push(ls_connects);
      (window as any).UNREF_EVAL_OBJ.push(connect);
      (window as any).UNREF_EVAL_OBJ.push(disconnect);

      set_running_command(false);
      if (_do_clear) {
        set_command_history([]);
      } else {
        set_command_history([...command_history, [command_value, out_val]]);
      }
    };

    set_running_command(true);
    prom();

    set_command_value("");
  };

  return (
    <div
      style={{ width: "100%", height: "100vh", touchAction: "none" }}
      ref={mount_ref}
    >
      {utils.doc.is_mobile() ? (
        <div
          ref={joystick_ref}
          style={{
            position: "absolute",
            zIndex: 10,
          }}
        />
      ) : (
        <></>
      )}

      <div
        style={{
          position: "absolute",
          zIndex: 10,
          transform: utils.doc.is_mobile() ? "rotate(90deg)" : undefined,
          transformOrigin: utils.doc.is_mobile() ? "top right" : undefined,
          right: utils.doc.is_mobile() ? 0 : 10,
          ...(utils.doc.is_mobile()
            ? {
              bottom: -10,
            }
            : {
              top: 0,
            }),
        }}
      >
        <components.layout.text.Text
          font="MONO"
          size="LARGE"
          manual={info_text_ref}
        />
      </div>

      {opening_readme === undefined ? <></> : <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000000DD",
        zIndex: 25,
        pointerEvents: "auto",
      }} onClick={e => e.stopPropagation()}>
        <components.layout.container.Container width="w-full" height="h-full">
          <components.layout.stack.Stack direction="VERTICAL" overflow="HIDDEN">
            <components.layout.stack.Cell>
              {opening_readme}
            </components.layout.stack.Cell>

            <components.layout.stack.Cell grow overflow="HIDDEN">
              <components.layout.scrollable.Scrollable direction="VERTICAL">
                <div className="prose text-white">
                  <deps.markdown.Markdown remarkPlugins={[deps.remarkGfm]}>{sector.current.get_readme(opening_readme)}</deps.markdown.Markdown>
                </div>
              </components.layout.scrollable.Scrollable>
            </components.layout.stack.Cell>

            <components.layout.stack.Cell>
              <components.layout.level.Ascend>
                                  <components.asite.text_button.TextButton on_click={() => set_opening_readme(undefined)}>Close</components.asite.text_button.TextButton>
              </components.layout.level.Ascend>
            </components.layout.stack.Cell>
          </components.layout.stack.Stack>
        </components.layout.container.Container>
      </div>}

      {editing_readme === undefined ? <></> : <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000000FF",
        zIndex: 30,
        pointerEvents: "auto",
      }} onClick={e => e.stopPropagation()}>
        <components.layout.container.Container width="w-full" height="h-full">
          <components.layout.stack.Stack direction="VERTICAL" overflow="HIDDEN">
            <components.layout.stack.Cell>
              {editing_readme}
            </components.layout.stack.Cell>

            <components.layout.stack.Cell grow overflow="HIDDEN">
              <components.layout.scrollable.Scrollable direction="VERTICAL">
                <textarea style={{ background: "black", padding: "2px", border: "1px solid white", }} className={["min-h-full", "w-full", "font-mono"].join_class_name()} value={editing_readme_val} onChange={e => set_editing_readme_val(e.target.value)} />
              </components.layout.scrollable.Scrollable>
            </components.layout.stack.Cell>

            <components.layout.stack.Cell>
              <components.layout.level.Ascend>
              <components.layout.grid.Grid cols={"grid-cols-2"} gap="MEDIUM">
                <components.layout.grid.Cell>
                  <components.asite.text_button.TextButton on_click={() => set_editing_readme(undefined)}>Cancel</components.asite.text_button.TextButton>
                </components.layout.grid.Cell>

                <components.layout.grid.Cell>
                  <components.asite.text_button.TextButton on_click={() => {
                    sector.current.set_readme(editing_readme, editing_readme_val);
                    set_editing_readme(undefined);
                  }}>Save</components.asite.text_button.TextButton>
                </components.layout.grid.Cell>
              </components.layout.grid.Grid>
              </components.layout.level.Ascend>
            </components.layout.stack.Cell>
          </components.layout.stack.Stack>
        </components.layout.container.Container>
      </div>}

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "#000000AA",
          zIndex: 20,
          pointerEvents: "auto",
          visibility: command_overlay ? "visible" : "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <components.layout.container.Container width="w-full" height="h-full">
          <components.layout.stack.Stack direction="VERTICAL" overflow="HIDDEN">
            <components.layout.stack.Cell grow overflow="HIDDEN">
              <components.layout.scrollable.Scrollable
                direction="VERTICAL"
                bottom
              >
                <components.layout.stack.Stack direction="VERTICAL">
                  {command_history.map((v, index) => (
                    <components.Fragment key={`cmd_${index}_${v[0]}`}>
                      <components.layout.stack.Cell>
                        <components.layout.text.Text
                          font="MONO"
                          size="LARGE"
                          bold
                        >
                          {v[0]}
                        </components.layout.text.Text>
                      </components.layout.stack.Cell>

                      {v[1].map((x, inner_ind) => (
                        <components.layout.stack.Cell
                          key={`out_${index}_${x}_${inner_ind}`}
                        >
                          <components.layout.text.Text font="MONO" size="LARGE">
                            {x}
                          </components.layout.text.Text>
                        </components.layout.stack.Cell>
                      ))}
                    </components.Fragment>
                  ))}
                </components.layout.stack.Stack>
              </components.layout.scrollable.Scrollable>
            </components.layout.stack.Cell>

            <components.layout.stack.Cell>
              <components.layout.textbox.Textbox
                id="command_textbox"
                size="LARGE"
                value={running_command ? "" : command_value}
                on_change={
                  running_command
                    ? undefined
                    : (e) => set_command_value(e.target.value)
                }
                on_enter={running_command ? undefined : process_command}
                font="MONO"
                bare
              />
            </components.layout.stack.Cell>
          </components.layout.stack.Stack>
        </components.layout.container.Container>
      </div>
    </div>
  );
};

export { Sector };
