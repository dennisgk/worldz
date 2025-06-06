import { deps, utils } from "../meta";

// TODO - for some reason the controls dont work when left/right or up/down in small - could be due to three rounding down
// TODO - add touch pan control for mobile

const create_player = (world: deps.rapier.World) => {
  const radius = 0.3;
  const height = 1.8;

  const bodyDesc = deps.rapier.RigidBodyDesc.dynamic()
    .setTranslation(0, 5, 5)
    .lockRotations(); // locks pitch/roll/yaw

  const body = world.createRigidBody(bodyDesc);

  const colliderDesc = deps.rapier.ColliderDesc.capsule(
    height / 2 - radius,
    radius
  )
    .setMass(1)
    .setFriction(1)
    .setRestitution(0);

  const collider = world.createCollider(colliderDesc, body);

  return { body, collider };
};

const Sector = () => {
  const mount_ref = utils.react.use_ref<HTMLDivElement>(null);
  const joystick_ref = utils.react.use_ref<HTMLDivElement>(null);

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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = deps.three.PCFSoftShadowMap; // optional, but looks better
    mount_ref.current.appendChild(renderer.domElement);

    scene.add(new deps.three.HemisphereLight(0xffffff, 0x444444, 1));

    // Light
    const light = new deps.three.DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, 10);
    light.castShadow = true;
    scene.add(light);

    // Add a cube
    const geometry = new deps.three.BoxGeometry();
    const material = new deps.three.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new deps.three.Mesh(geometry, material);
    cube.castShadow = true;
    cube.position.set(0, 0.5, 0);
    scene.add(cube);

    // World
    const world = new deps.rapier.World(new deps.rapier.Vector3(0, -9.82, 0));

    // Ground
    const ground_collider = world.createCollider(
      deps.rapier.ColliderDesc.cuboid(50, 0.1, 50).setTranslation(0, 0, 0)
    );
    ground_collider.setFriction(1);
    ground_collider.setRestitution(0);

    // ground to three
    const groundGeo = new deps.three.PlaneGeometry(100, 100);
    /*const groundMat = new deps.three.ShaderMaterial({
      uniforms: {},
      vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
      fragmentShader: `
  varying vec3 vWorldPosition;

  float grid(vec2 coord, float size) {
    vec2 g = abs(fract(coord / size - 0.5) - 0.5) / fwidth(coord / size);
    return 1.0 - min(min(g.x, g.y), 1.0);
  }

  void main() {
    float g = grid(vWorldPosition.xz, 1.0); // grid cell size = 1.0

    // Cool gradient based on radial distance
    float dist = length(vWorldPosition.xz) * 0.05;
    vec3 gradient = mix(vec3(0.2, 0.0, 0.5), vec3(0.0, 0.3, 0.6), smoothstep(0.0, 1.0, dist));

    vec3 baseColor = gradient;          // gradient background
    vec3 lineColor = vec3(0.9);         // grid lines
    vec3 color = mix(baseColor, lineColor, g); // blend grid on top

    gl_FragColor = vec4(color, 1.0);
  }
`,
      side: deps.three.DoubleSide,
    });*/
    const groundMat = new deps.three.MeshStandardMaterial({color: 0x00FF00});

    const groundMesh = new deps.three.Mesh(groundGeo, groundMat);
    groundMesh.position.set(0, 0, 0);
    groundMesh.rotation.set(Math.PI / 2, 0, 0);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Player capsule
    const player_body = create_player(world);

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
        position: { left: "100px", top: "100px" },
        size: 100,
        color: "blue",
      });

      joystick_manager.on("move", (_, data) => {
        if (data && data.vector) {
          const angle = Math.atan2(data.vector.y, data.vector.x);
          move.forward = Math.cos(angle);
          move.right = -Math.sin(angle);

          speed_mult = Math.sqrt(data.vector.x ** 2 + data.vector.y ** 2);
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
    const speed = 0.9;
    let speed_mult = 1;

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
              camera.quaternion.setFromEuler(euler);
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

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Apply movement
      direction
        .set(move.right - move.left, 0, -move.forward + move.backward)
        .normalize();

      const moveVec = new deps.three.Vector3(direction.x, 0, direction.z);

      // Rotate movement direction to match the camera's orientation
      const cameraQuat = camera.quaternion.clone();

      if (utils.doc.is_mobile()) {
        const rotate90Z = new deps.three.Quaternion();
        rotate90Z.setFromAxisAngle(
          new deps.three.Vector3(0, 0, 1),
          -Math.PI / 2
        ); // -90 degrees
        moveVec.applyQuaternion(rotate90Z);
      }

      moveVec.applyQuaternion(cameraQuat);

      moveVec.setY(0);
      moveVec.normalize();

      // Convert to Rapier vector
      //const rapierVec = new deps.rapier.Vector3(
      //  moveVec.x * speed,
      //  player_body.body.linvel().y,
      //  moveVec.z * speed
      //);

      //player_body.body.setLinvel(rapierVec, true);

      player_body.body.applyImpulse(
        new deps.rapier.Vector3(
          moveVec.x * speed * speed_mult,
          0,
          moveVec.z * speed * speed_mult
        ),
        true
      );

      const dt = clock.getDelta(); // or use your actual delta time
      const damping = 4.0; // stronger = faster stop
      const damping_y = 0.2;
      const vel = player_body.body.linvel();

      const dampedVel = new deps.rapier.Vector3(
        vel.x * (1 - damping * dt),
        vel.y * (1 - damping_y * dt),
        vel.z * (1 - damping * dt)
      );

      player_body.body.setLinvel(dampedVel, true);

      world.step();

      // Sync camera to capsule
      camera.position.set(
        player_body.body.translation().x,
        player_body.body.translation().y + 0.8,
        player_body.body.translation().z
      );

      renderer.render(scene, camera);
    };
    animate();

    setTimeout(
      () =>
        player_body.body.applyImpulse(new deps.rapier.Vector3(100, 0, 0), true),
      2000
    );

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
    </div>
  );
};

export { Sector };
