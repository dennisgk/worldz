import { deps, utils } from "../meta";

// TODO - for some reason the controls dont work when left/right or up/down in small - could be due to three rounding down
// TODO - add touch pan control for mobile

const create_capsule_body = (radius = 0.5, height = 1.8, mass = 1) => {
  const body = new deps.cannon.Body({ mass });
  const cylinderHeight = height - 2 * radius;

  // Cylinder
  const cylinder = new deps.cannon.Cylinder(radius, radius, cylinderHeight, 8);
  const q = new deps.cannon.Quaternion();
  q.setFromEuler(Math.PI / 2, 0, 0);
  body.addShape(cylinder, new deps.cannon.Vec3(0, 0, 0), q);

  // Spheres
  const sphere = new deps.cannon.Sphere(radius);
  body.addShape(
    sphere,
    new deps.cannon.Vec3(0, cylinderHeight / 2 + radius, 0)
  );
  body.addShape(
    sphere,
    new deps.cannon.Vec3(0, -cylinderHeight / 2 - radius, 0)
  );

  body.fixedRotation = true;
  body.updateMassProperties();
  return body;
};

const Sector = () => {
  const mount_ref = utils.react.use_ref<HTMLDivElement>(null);
  const joystick_ref = utils.react.use_ref(null);

  utils.react.use_effect(() => {
    if (mount_ref.current == null) return;

    let width = mount_ref.current.clientWidth;
    let height = mount_ref.current.clientHeight;

    // Create scene
    const scene = new deps.three.Scene();

    // Create camera
    const camera = new deps.three.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.set(0, 2, 5);

    if (utils.doc.is_mobile()) {
      // Portrait → rotate camera
      camera.rotation.z = Math.PI / 2;
      //width = mount_ref.current.clientHeight;
      //height = mount_ref.current.clientWidth;
      //camera.aspect = width / height;
      //camera.updateProjectionMatrix();
    }

    // Create renderer
    const renderer = new deps.three.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mount_ref.current.appendChild(renderer.domElement);

    scene.add(new deps.three.HemisphereLight(0xffffff, 0x444444, 1));

    // Light
    const light = new deps.three.DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, 10);
    scene.add(light);

    // Add a cube
    const geometry = new deps.three.BoxGeometry();
    const material = new deps.three.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new deps.three.Mesh(geometry, material);
    scene.add(cube);

    // World
    const world = new deps.cannon.World();
    world.gravity.set(0, -9.82, 0);

    // Ground
    const ground_body = new deps.cannon.Body({ mass: 0 });
    ground_body.addShape(new deps.cannon.Plane());
    ground_body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(ground_body);

    // Player capsule
    const player_body = create_capsule_body(0.3, 1.8, 1);
    player_body.position.set(0, 2, 5);
    world.addBody(player_body);

    // Controls
    const controls = new deps.three_addons.PointerLockControls(
      camera,
      renderer.domElement
    );
    if (!utils.doc.is_mobile()) {
      mount_ref.current.addEventListener("click", () => controls.lock());
    }

    // Movement state
    const move = { forward: 0, backward: 0, left: 0, right: 0 };
    const direction = new deps.three.Vector3();
    const clock = new deps.three.Clock();

    // Joystick on mobile
    if (utils.doc.is_mobile() && joystick_ref.current) {
      let joystick_manager = deps.nipplejs.create({
        zone: joystick_ref.current,
        mode: "static",
        position: { left: "50px", bottom: "50px" },
        color: "blue",
      });

      joystick_manager.on("move", (_, data) => {
        if (data && data.vector) {
          const x = data.vector.x; // left-right
          const y = data.vector.y; // forward-backward

          console.log(data.vector);

          move.forward = x;
          move.right = -y;
        }
      });

      joystick_manager.on("end", () => {
        move.forward = 0;
        move.right = 0;
      });
    }

    // Desktop keyboard
    const onKeyDown = (e: KeyboardEvent) =>
      e.code === "KeyW"
        ? (move.forward = 1)
        : e.code === "KeyS"
        ? (move.backward = 1)
        : e.code === "KeyA"
        ? (move.left = 1)
        : e.code === "KeyD"
        ? (move.right = 1)
        : undefined;
    const onKeyUp = (e: KeyboardEvent) =>
      e.code === "KeyW"
        ? (move.forward = 0)
        : e.code === "KeyS"
        ? (move.backward = 0)
        : e.code === "KeyA"
        ? (move.left = 0)
        : e.code === "KeyD"
        ? (move.right = 0)
        : undefined;
    if (!utils.doc.is_mobile()) {
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
    }

    // Main loop
    const step = 1 / 60;
    const speed = 8;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Apply movement
      direction
        .set(move.right - move.left, 0, -move.forward + move.backward)
        .normalize();

      if (direction.length() > 0) {
        const moveVec = new deps.three.Vector3(direction.x, 0, direction.z);

        // Rotate movement direction to match the camera's orientation
        const cameraQuat = camera.quaternion.clone();

        if (utils.doc.is_mobile()) {
          const rotate90Z = new deps.three.Quaternion();
          rotate90Z.setFromAxisAngle(
            new deps.three.Vector3(0, 0, 1),
            -Math.PI / 2
          ); // -90 degrees
          cameraQuat.multiply(rotate90Z);
        }

        moveVec.applyQuaternion(cameraQuat);

        moveVec.setY(0);
        moveVec.normalize();

        // Apply to player
        player_body.velocity.x = moveVec.x * speed;
        player_body.velocity.z = moveVec.z * speed;
      }

      world.step(step, clock.getDelta());

      // Sync camera to capsule
      camera.position.set(
        player_body.position.x,
        player_body.position.y + 0.4,
        player_body.position.z
      );

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup on unmount
    return () => {
      if (mount_ref.current == null) return;

      mount_ref.current.removeChild(renderer.domElement);
      renderer.dispose();

      if (!utils.doc.is_mobile()) {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
      }
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh" }} ref={mount_ref}>
      {utils.doc.is_mobile() ? (
        <div
          ref={joystick_ref}
          style={{
            position: "absolute",
            left: 40,
            top: -160,
            width: 300,
            height: 300,
            zIndex: 10,
          }}
        />
      ) : (
        <></>
      )}
    </div>
  );
};

export { Sector };
