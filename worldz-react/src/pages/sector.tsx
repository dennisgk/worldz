import { deps, utils, components, types } from "../meta";

const SectorActual = (props: {init_info: types.sector.SectorDesc, id: string}) => {
  const mount_ref = utils.react.use_ref<HTMLDivElement>(null);
  const joystick_ref = utils.react.use_ref<HTMLDivElement>(null);
  const [command_overlay, set_command_overlay] = utils.react.use_state(false);
  const sector = utils.react.use_ref<utils.sector.Sector>(undefined!);

  const [command_value, set_command_value] = utils.react.use_state("");
  const [command_history, set_command_history] = utils.react.use_state<
    Array<[string, Array<string>]>
  >([]);
  const [running_command, set_running_command] = utils.react.use_state(false);

  const [editing_readme, set_editing_readme] = utils.react.use_state<
    undefined | string
  >(undefined);
  const [editing_readme_val, set_editing_readme_val] =
    utils.react.use_state<string>("");

  const [opening_readme, set_opening_readme] = utils.react.use_state<
    undefined | string
  >(undefined);

  const info_text_ref = utils.react.use_ref<HTMLSpanElement>(null);

  const mobile_pitch = utils.react.use_ref(0);
  const mobile_yaw = utils.react.use_ref(0);

  const ex_open_readme = (name: string) => {
    let txt = (sector.current.get_readme(name) ?? "").split(/^#!\/worldz\/sector\r?\n/g);
    if (txt.length === 1) {
      if (!command_overlay) {
        sector.current.unlock();
      }
      set_opening_readme(name);
    }

    if (txt.length === 2) {
      process_command(`let user_comm = async() => {
          ${txt[1]}
        }; user_comm();`, false);
    }
  };

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
      props.init_info,
      props.id
    );

    utils.doc.enable_leave_prompt();

    if(utils.doc.is_mobile()){
      let rot = sector.current.get_camera_rot();
      mobile_yaw.current = -rot[0];
      mobile_pitch.current = rot[1];
    }

    return () => {
      sector.current.deconstruct();
      utils.doc.disable_leave_prompt();
    }
  }, []);

  utils.react.use_effect(() => {
    sector.current.open_readme =
      (name) => {
        ex_open_readme(name);
      };
  }, [command_history, command_overlay]);

  utils.react.use_effect(() => {
    if (editing_readme !== undefined) {
      document.getElementById("edit_readme_textbox")?.focus();
    }
  }, [editing_readme]);

  utils.react.use_effect(() => {
    // Joystick on mobile
    if (utils.doc.is_mobile() && joystick_ref.current) {
      let joystick_manager = deps.nipplejs.create({
        zone: joystick_ref.current,
        mode: "static",
        position: { left: "100px", top: "100px" },
        size: 100,
        color: "blue",
      });

      let lastTapTime = 0;
      let tapTimeout: ReturnType<typeof setTimeout> | null = null;

      let wasMoved = false;
      const TAP_MOVE_THRESHOLD = 0.3; // Vector magnitude (normalized to 1)

      joystick_manager.on("start", () => {
        wasMoved = false;
      });

      joystick_manager.on("move", (_, data) => {
        if (data?.vector) {
          const magnitude = Math.sqrt(data.vector.x ** 2 + data.vector.y ** 2);
          if (magnitude > TAP_MOVE_THRESHOLD) {
            wasMoved = true;
          }

          const angle = Math.atan2(data.vector.y, data.vector.x);
          sector.current.move.forward = Math.cos(angle);
          sector.current.move.right = -Math.sin(angle);
          sector.current.speed_mult = magnitude * magnitude;
        }
      });

      joystick_manager.on("end", () => {
        sector.current.move.forward = 0;
        sector.current.move.right = 0;

        if (wasMoved) {
          return; // Don't trigger taps if there was movement
        }

        const now = Date.now();
        const TAP_DELAY = 300;

        if (now - lastTapTime < TAP_DELAY) {
          if (tapTimeout) {
            clearTimeout(tapTimeout);
            tapTimeout = null;
          }
          set_command_overlay(true);
        } else {
          tapTimeout = setTimeout(() => {
            sector.current.click();
            tapTimeout = null;
          }, TAP_DELAY);
        }

        lastTapTime = now;
      });
    }

    if (!utils.doc.is_mobile() && mount_ref.current) {
      mount_ref.current.addEventListener("click", (e) =>
        utils
          .pipe<1>()
          .s(0, () => (e.target as any).tagName.toLowerCase() === "canvas")
          .g(0, (_) => (_ ? sector.current.lock() : undefined))
          .g(0, (_) => (_ ? sector.current.click() : undefined))
          .ex()
          .nov()
      );


    }
  }, []);

  utils.react.use_effect(() => {
    if (command_overlay) {
      document.getElementById("command_textbox")?.focus();
    }

    if (mount_ref.current == null) return;

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
      const DOUBLE_TAP_DELAY = 300;
      const TAP_FLY_DEAD_ZONE = 15;

      let on_touch_start = (e: any) => {
        if (command_overlay) return;
        if (opening_readme) return;

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
              }
              tapCount = 0;
            }, DOUBLE_TAP_DELAY);
          }
        }
      };

      let on_touch_move = (e: any) => {
        if (command_overlay) return;
        if (opening_readme) return;

        e.preventDefault();

        for (let touch of e.changedTouches) {
          if (touch.identifier === sequenceTouchId) {
            if (tapCount <= 1 && isDragging) {
              const dx = touch.clientX - dragStartX;
              const dy = touch.clientY - dragStartY;
              // Your camera logic
              const sensitivity = 0.006;
              mobile_yaw.current -= dx * sensitivity;
              mobile_pitch.current -= dy * sensitivity;

              const euler = new deps.three.Euler(
                -mobile_yaw.current,
                mobile_pitch.current,
                Math.PI / 2,
                "YXZ"
              );
              sector.current.camera_quat_set(euler);
            }

            if (tapCount <= 1) {
              dragStartX = touch.clientX;
              dragStartY = touch.clientY;
            }

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
          }
        }
      };

      let on_touch_end = (e: any) => {
        if (command_overlay) return;
        if (opening_readme) return;

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
  }, [command_overlay, opening_readme]);

  const process_command = (cmd_val: string, is_run_by_user: boolean = true) => {
    if (cmd_val.trim() === "" && is_run_by_user) {
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
        "typically -> string[]",
        "help()",
        "clear()",
        "close()",
        "set_name(name)",
        "get_name() -> scripting? string",
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
        "get_obj_pos(name) -> scripting? [number, number, number]",
        "get_obj_rot(name) -> scripting? [number, number, number]",
        "get_obj_scale(name) -> scripting? [number, number, number]",
        "set_obj_pos(name, x, y, z)",
        "set_obj_rot(name, x, y, z)",
        "set_obj_scale(name, x, y, z)",
        "edit_obj(name)",
        "override_mat(name, color)",
        "reset_mat(name)",
        "exit_edit()",
        "set_speed(num)",
        "get_speed() -> scripting? number",
        "edit_readme(name)",
        "open_readme(name)",
        "ls_connects() -> scripting? [string, string][]",
        "connect(name1, name2)",
        "disconnect(name1, name2)",
        "delete_local_obj(name)",
        "get_id() -> scripting? string",
        "get_ground_size() -> scripting? [number, number]",
        "set_ground_size(width, height)",
        "ls_cust_vars()",
        "get_cust_var(name) -> scripting? any",
        "set_cust_var(name, value)",
        "delete_cust_var(name)",
        "save()",
      ];

      let _do_clear = false;

      const clear = async () => {
        _do_clear = true;
        return [];
      };

      const close = async () => {
        set_command_overlay(false);
        sector.current.lock();
        return [];
      };

      const get_name = async () => command_overlay ? [sector.current.get_name()] : sector.current.get_name();

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
        if (
          folder === undefined ||
          name === undefined ||
          local_name === undefined
        ) {
          return ["Argument error"];
        }

        return await sector.current.load(
          folder,
          name,
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
          : command_overlay ? sector.current.get_obj_pos_sa(name)
            : sector.current.get_obj_pos(name);

      const get_obj_rot = async (name: string) =>
        name === undefined
          ? ["Argument error"]
          : command_overlay ? sector.current.get_obj_rot_sa(name)
            : sector.current.get_obj_rot(name);

      const get_obj_scale = async (name: string) =>
        name === undefined
          ? ["Argument error"]
          : command_overlay ? sector.current.get_obj_scale_sa(name)
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
        if (!sector.current.ls_objs().includes(name))
          return ["Object not found"];
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

      const get_speed = async () => command_overlay ? [sector.current.glob_speed_mult.toString()] : sector.current.glob_speed_mult;

      const edit_readme = async (name: string) => {
        if (name === undefined) return ["Argument error"];
        if (!sector.current.ls_objs().includes(name))
          return ["No object found"];

        set_editing_readme(name);
        set_editing_readme_val(sector.current.get_readme(name)!);

        return ["Launched editor"];
      };

      const open_readme = async (name: string) => {
        if (name === undefined) return ["Argument error"];

        ex_open_readme(name);
        return ["Opened"];
      };

      const ls_connects = async () => command_overlay ? sector.current.ls_connects().map(v => `${v[0]} --- ${v[1]}`) : sector.current.ls_connects();

      const connect = async (name1: string, name2: string) => {
        if (name1 === undefined || name2 === undefined)
          return ["Argument error"];
        return sector.current.connect(name1, name2);
      };

      const disconnect = async (name1: string, name2: string) => {
        if (name1 === undefined || name2 === undefined)
          return ["Argument error"];
        return sector.current.disconnect(name1, name2);
      };

      const delete_local_obj = async (name: string) => {
        if (name === undefined) return ["Argument error"];

        sector.current.delete_local_obj(name);
        return ["Deleted"];
      };

      const get_ground_size = async () => command_overlay ? [sector.current.get_ground_size().map(v => `${v}`).join(" ")] : sector.current.get_ground_size();

      const set_ground_size = async (width: number, height: number) => {
        if (width === undefined || height === undefined) {
          return ["Argument error"];
        }

        sector.current.set_ground_size(width, height);
        return ["Set", "This requires save? and reload"];
      };

      const get_id = async () => [sector.current.get_id()];

      const ls_cust_vars = async () => sector.current.ls_cust_vars();

      const get_cust_var = async (name: string) => {
        if (name === undefined) {
          return ["Argument error"];
        }

        if (command_overlay) {
          return [`${sector.current.get_cust_var(name)}`]
        }
        else {
          return sector.current.get_cust_var(name);
        }
      }

      const set_cust_var = async (name: string, value: any) => {
        if (name === undefined || value === undefined) {
          return ["Argument error"];
        }

        sector.current.set_cust_var(name, value);
        return ["Set"];
      }

      const delete_cust_var = async (name: string) => {
        if (name === undefined) {
          return ["Argument error"];
        }

        sector.current.delete_cust_var(name);
        return ["Deleted"];
      }

      const save = async() => await sector.current.save();

      let _out_val: Array<string> = [];

      try {
        _out_val = await eval(cmd_val);

        if (
          !(
            Array.isArray(_out_val) &&
            _out_val.every((item) => typeof item === "string")
          )
        ) {
          _out_val = ["Wrong type"];
        }
      } catch (err) {
        console.error(err);
        _out_val = ["Error", (err as any).toString()];
      }

      (window as any).UNREF_EVAL_OBJ = [];

      (window as any).UNREF_EVAL_OBJ.push(help);
      (window as any).UNREF_EVAL_OBJ.push(clear);
      (window as any).UNREF_EVAL_OBJ.push(close);

      (window as any).UNREF_EVAL_OBJ.push(get_name);
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
      (window as any).UNREF_EVAL_OBJ.push(delete_local_obj);

      (window as any).UNREF_EVAL_OBJ.push(get_id);
      (window as any).UNREF_EVAL_OBJ.push(get_ground_size);
      (window as any).UNREF_EVAL_OBJ.push(set_ground_size);

      (window as any).UNREF_EVAL_OBJ.push(ls_cust_vars);
      (window as any).UNREF_EVAL_OBJ.push(get_cust_var);
      (window as any).UNREF_EVAL_OBJ.push(set_cust_var);
      (window as any).UNREF_EVAL_OBJ.push(delete_cust_var);
      (window as any).UNREF_EVAL_OBJ.push(save);

      set_running_command(false);
      if (_do_clear) {
        set_command_history([]);
      } else {
        set_command_history([...command_history, [cmd_val, _out_val]]);
      }
    };

    set_running_command(true);
    prom();

    if (is_run_by_user) {
      set_command_value("");
    }
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

      {opening_readme === undefined ? (
        <></>
      ) : (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "#000000FF",
            zIndex: 40,
            pointerEvents: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <components.layout.container.Container width="w-full" height="h-full">
            <components.layout.stack.Stack
              direction="VERTICAL"
              overflow="HIDDEN"
            >
              <components.layout.stack.Cell>
                {opening_readme}
              </components.layout.stack.Cell>

              <components.layout.stack.Cell grow overflow="HIDDEN">
                <components.layout.scrollable.Scrollable direction="VERTICAL">
                  <div className="prose prose-invert">
                    <deps.markdown.Markdown remarkPlugins={[deps.remarkGfm]}>
                      {sector.current.get_readme(opening_readme)}
                    </deps.markdown.Markdown>
                  </div>
                </components.layout.scrollable.Scrollable>
              </components.layout.stack.Cell>

              <components.layout.stack.Cell>
                <components.layout.level.Ascend>
                  <components.asite.text_button.TextButton
                    on_click={() => {
                      if (!command_overlay) {
                        sector.current.lock();
                      }
                      set_opening_readme(undefined);
                    }}
                  >
                    Close
                  </components.asite.text_button.TextButton>
                </components.layout.level.Ascend>
              </components.layout.stack.Cell>
            </components.layout.stack.Stack>
          </components.layout.container.Container>
        </div>
      )}

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "#000000FF",
          zIndex: 30,
          pointerEvents: "auto",
          visibility: editing_readme !== undefined ? "visible" : "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <components.layout.container.Container width="w-full" height="h-full">
          <components.layout.stack.Stack direction="VERTICAL" overflow="HIDDEN">
            <components.layout.stack.Cell>
              {editing_readme ?? ""}
            </components.layout.stack.Cell>

            <components.layout.stack.Cell grow overflow="HIDDEN">
              <components.layout.scrollable.Scrollable direction="VERTICAL">
                <textarea
                  style={{
                    background: "black",
                    padding: "2px",
                    border: "1px solid white",
                  }}
                  id="edit_readme_textbox"
                  className={[
                    "min-h-full",
                    "w-full",
                    "font-mono",
                  ].join_class_name()}
                  value={editing_readme_val}
                  onChange={(e) => set_editing_readme_val(e.target.value
                    .replace(/[\u2013\u2014\u2010]/g, "-")         // dashes/hyphen
                    .replace(/[\u2018\u2019]/g, "'")               // single quotes
                    .replace(/[\u201C\u201D]/g, '"')               // double quotes
                    .replace(/\u2026/g, "...")                     // ellipsis
                    .replace(/\u00A0/g, " ")                       // non-breaking space
                    .replace(/\u2039/g, "<")               // angle quotes
                    .replace(/\u203A/g, ">")               // angle quotes
                    .replace(/\u00AB/g, "<<")               // angle quotes
                    .replace(/\u00BB/g, ">>")               // angle quotes
                    .replace(/[\u201E\u201F]/g, '"')               // alt double quotes
                    .replace(/\u2032/g, "'") // single prime
                    .replace(/\u2033/g, "\""))} // double prime
                />
              </components.layout.scrollable.Scrollable>
            </components.layout.stack.Cell>

            <components.layout.stack.Cell>
              <components.layout.level.Ascend>
                <components.layout.grid.Grid cols={"grid-cols-2"} gap="MEDIUM">
                  <components.layout.grid.Cell>
                    <components.asite.text_button.TextButton
                      on_click={() => set_editing_readme(undefined)}
                    >
                      Cancel
                    </components.asite.text_button.TextButton>
                  </components.layout.grid.Cell>

                  <components.layout.grid.Cell>
                    <components.asite.text_button.TextButton
                      on_click={
                        editing_readme !== undefined
                          ? () => {
                            sector.current.set_readme(
                              editing_readme,
                              editing_readme_val
                            );
                            set_editing_readme(undefined);
                          }
                          : undefined
                      }
                    >
                      Save
                    </components.asite.text_button.TextButton>
                  </components.layout.grid.Cell>
                </components.layout.grid.Grid>
              </components.layout.level.Ascend>
            </components.layout.stack.Cell>
          </components.layout.stack.Stack>
        </components.layout.container.Container>
      </div>

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
                on_enter={running_command ? undefined : () => process_command(command_value)}
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

const Sector = () => {
  const [search_params, _set_search_params] = deps.router.use_search_params();
  const navigate = deps.router.use_navigate();

  const query_sector = deps.query.use_query({
    queryKey: ["query_sector", search_params.get("id")],
    queryFn: utils
      .pipe<2>()
      .s(1, () => search_params.get("id"))
      .g(1, v => v === null ? navigate("/") : undefined)
      .gsa(1, 0, async v => v === null ? undefined : await fetch(`${utils.asite.PY_BACKEND}/api/sector?id=${encodeURIComponent(v)}`))
      .gsa(0, 0, async (v) => v === undefined ? undefined : (await v.json()) as types.sector.SectorDesc)
      .ex()
      .vc(0),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: false,
    gcTime: 0,
    placeholderData: undefined,
  });

  return query_sector.data === undefined ? <></> : <SectorActual init_info={query_sector.data} id={search_params.get("id")!} />
};

export { Sector };
