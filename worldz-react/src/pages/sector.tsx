import { deps, utils, components } from "../meta";

const Sector = () => {
  const mount_ref = utils.react.use_ref<HTMLDivElement>(null);
  const joystick_ref = utils.react.use_ref<HTMLDivElement>(null);
  const [command_overlay, set_command_overlay] = utils.react.use_state(false);
  const sector = utils.react.use_ref<utils.sector.Sector>(undefined!);
  const [command_value, set_command_value] = utils.react.use_state("");

  const [command_history, set_command_history] = utils.react.use_state<
    Array<[string, string]>
  >([]);

  utils.react.use_effect(() => {
    if (mount_ref.current == null) return;

    let width = mount_ref.current.clientWidth;
    let height = mount_ref.current.clientHeight;

    sector.current = new utils.sector.Sector(width, height, (elem) =>
      mount_ref!.current!.appendChild(elem)
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
    }

    if (utils.doc.is_mobile()) {
      let isDraggingCamera = false;
      let lastTouchX = 0;
      let lastTouchY = 0;
      let cameraTouchId: number | null = null;
      let pitch = 0; // vertical (X-axis rotation)
      let yaw = 0; // horizontal (Y-axis rotation)

      mount_ref.current.addEventListener(
        "touchstart",
        (e) => {
          for (let touch of e.touches) {
            const target = touch.target;
            const isJoystick = joystick_ref.current?.contains(target as any);
            if (!isJoystick && cameraTouchId === null) {
              cameraTouchId = touch.identifier;
              lastTouchX = touch.clientX;
              lastTouchY = touch.clientY;
              isDraggingCamera = true;
            }
          }
        },
        { passive: false }
      );

      mount_ref.current.addEventListener(
        "touchmove",
        (e) => {
          for (let touch of e.touches) {
            if (touch.identifier === cameraTouchId && isDraggingCamera) {
              const dx = touch.clientX - lastTouchX;
              const dy = touch.clientY - lastTouchY;

              lastTouchX = touch.clientX;
              lastTouchY = touch.clientY;

              const sensitivity = 0.004;
              yaw -= dx * sensitivity;
              pitch -= dy * sensitivity;

              const euler = new deps.three.Euler(
                -yaw,
                pitch,
                Math.PI / 2,
                "YXZ"
              );
              sector.current.camera_quat_set(euler);
            }
          }
        },
        { passive: false }
      );

      mount_ref.current.addEventListener(
        "touchend",
        (e) => {
          for (let touch of e.changedTouches) {
            if (touch.identifier === cameraTouchId) {
              cameraTouchId = null;
              isDraggingCamera = false;
            }
          }
        },
        { passive: false }
      );
    }

    return () => {
      if (!utils.doc.is_mobile()) {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
      }
    };
  }, [command_overlay]);

  const process_command = () => {
    if (command_value.trim() == "") {
      set_command_value("");
      return;
    }

    set_command_history([
      ...command_history,
      [command_value, `Proc ${command_value}`],
    ]);

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
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "#000000AA",
          zIndex: 9999,
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
                    <>
                      <components.layout.stack.Cell
                        key={`cmd_${index}_${v[0]}`}
                      >
                        <components.layout.text.Text size="LARGE" bold>
                          {v[0]}
                        </components.layout.text.Text>
                      </components.layout.stack.Cell>

                      <components.layout.stack.Cell
                        key={`out_${index}_${v[1]}`}
                      >
                        <components.layout.text.Text size="LARGE">
                          {v[1]}
                        </components.layout.text.Text>
                      </components.layout.stack.Cell>
                    </>
                  ))}
                </components.layout.stack.Stack>
              </components.layout.scrollable.Scrollable>
            </components.layout.stack.Cell>

            <components.layout.stack.Cell>
              <components.layout.textbox.Textbox
                id="command_textbox"
                size="LARGE"
                value={command_value}
                on_change={(e) => set_command_value(e.target.value)}
                on_enter={process_command}
              />
            </components.layout.stack.Cell>
          </components.layout.stack.Stack>
        </components.layout.container.Container>
      </div>
    </div>
  );
};

export { Sector };
