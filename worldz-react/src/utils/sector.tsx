import { deps, types, utils } from "../meta";

class Sector {
  #renderer: deps.three.WebGLRenderer;
  move: { forward: number; backward: number; left: number; right: number };
  #controls: deps.three_addons.PointerLockControls;
  #camera: deps.three.PerspectiveCamera;
  speed_mult: number;
  #cache: Map<string, deps.three.Group>;
  #scene: deps.three.Scene;
  #player_rigid_body: deps.rapier.RigidBody;
  #capsule_height_offset: number;
  #player_collider: deps.rapier.Collider;
  #world: deps.rapier.World;

  glob_speed_mult: number;

  #text_font: deps.three_addons.Font;

  #edit_obj: string | undefined;
  #edit_controls: deps.three_addons.OrbitControls;
  #edit_mode: "POS" | "ROT" | "SCALE";

  #is_flying: boolean;
  #flying_speed: { up: number; down: number };

  #id: string;
  #name: string;
  #objects: {
    [name: string]: {
      local: deps.three.Object3D;
      local_highlight: undefined | deps.three.Object3D;
      mat: null | number;
      readme: string;
    };
  };
  #connections: Array<{
    local: deps.three.Object3D;
    name1: string;
    name2: string;
  }>;
  #tps: { [name: string]: { x: number; y: number; z: number } };
  #last_pos: { x: number; y: number; z: number };

  constructor(
    width: number,
    height: number,
    append_element: (elem: HTMLCanvasElement) => void,
    update_info: (val: string) => void
  ) {
    // create default things passed
    this.#id = "SCENE_ID";
    this.#name = "SCENE_NAME";
    this.#objects = {};
    this.#connections = [];
    this.#tps = {};
    this.#last_pos = { x: 0, y: 2, z: 5 };

    // create cache
    this.#cache = new Map<string, deps.three.Group>();

    // Create scene
    this.#scene = new deps.three.Scene();

    // Create camera
    this.#camera = new deps.three.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );

    // Create this.#renderer
    this.#renderer = new deps.three.WebGLRenderer({ antialias: true });
    this.#renderer.setSize(width, height);
    append_element(this.#renderer.domElement);

    this.#scene.add(new deps.three.HemisphereLight(0xffffff, 0x444444, 1));

    // Fonts
    this.#text_font = undefined as any;
    const font_loader = new deps.three_addons.FontLoader();
    font_loader.load("/assets/space.json", (font) => (this.#text_font = font));

    // Light
    const light = new deps.three.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    this.#scene.add(light);

    // Set the target to (0, 0, 0)
    const target = new deps.three.Object3D();
    target.position.set(0, 0, 0);
    this.#scene.add(target);

    light.target = target; // required to make .lookAt work

    // Add a cube
    // const geometry = new deps.three.BoxGeometry();
    // const material = new deps.three.MeshStandardMaterial({ color: 0x00ff00 });
    // const cube = new deps.three.Mesh(geometry, material);
    // cube.position.set(0, 0.5, 0);
    // this.#scene.add(cube);

    // World
    this.#world = new deps.rapier.World(new deps.rapier.Vector3(0, -9.82, 0));

    // Ground
    const ground_collider = this.#world.createCollider(
      deps.rapier.ColliderDesc.cuboid(50, 0.5, 50).setTranslation(0, 0, 0)
    );
    ground_collider.setFriction(1);
    ground_collider.setRestitution(0);

    // ground to three
    const groundGeo = new deps.three.PlaneGeometry(100, 100);
    const groundMat = new deps.three.ShaderMaterial({
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
    // Smoothed random
    float hash(vec2 p) {
      p = fract(p * 0.3183099 + vec2(0.1, 0.1));
      p *= 17.0;
      return fract(p.x * p.y * (p.x + p.y));
    }
    
    float smoothNoise(vec2 uv) {
      vec2 i = floor(uv);
      vec2 f = fract(uv);
    
      // Bilinear interpolation
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
    
      vec2 u = f * f * (3.0 - 2.0 * f); // Smoothstep
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }
      varying vec3 vWorldPosition;
    
    float grid(vec2 coord, float size) {
      vec2 g = abs(fract(coord / size - 0.5) - 0.5) / fwidth(coord / size);
      return 1.0 - min(min(g.x, g.y), 1.0);
    }
    
    void main() {
      float g = grid(vWorldPosition.xz, 1.0);
    
      // Use lower frequency for big blobs
      vec2 noiseCoord = vWorldPosition.xz * 0.05;
      float noise = smoothNoise(noiseCoord);
    
      vec3 purple = vec3(0.6, 0.0, 0.8);
      vec3 blue   = vec3(0.0, 0.5, 1.0);
      vec3 gradientColor = mix(purple, blue, noise);
    
      vec3 finalColor = mix(gradientColor, vec3(1.0), g); // white grid overlay
    
      gl_FragColor = vec4(finalColor, 1.0);
    }
    `,
      side: deps.three.DoubleSide,
    });

    const groundMesh = new deps.three.Mesh(groundGeo, groundMat);
    groundMesh.position.set(0, 0, 0);
    groundMesh.rotation.set(Math.PI / 2, 0, 0);
    this.#scene.add(groundMesh);

    // Player capsule
    const tmp_player_body = this.#create_player(
      this.#world,
      this.#last_pos.x,
      this.#last_pos.y,
      this.#last_pos.z
    );
    this.#player_rigid_body = tmp_player_body.body;
    this.#player_collider = tmp_player_body.collider;
    this.#capsule_height_offset = tmp_player_body.capsule_height_offset;
    this.#is_flying = false;
    this.#flying_speed = { up: 0, down: 0 };

    // Controls
    this.#controls = new deps.three_addons.PointerLockControls(
      this.#camera,
      this.#renderer.domElement
    );
    this.#controls.enabled = true;

    this.#edit_obj = undefined;
    this.#edit_controls = new deps.three_addons.OrbitControls(
      this.#camera,
      this.#renderer.domElement
    );
    this.#edit_controls.enabled = false;
    this.#edit_controls.enableDamping = true;
    this.#edit_controls.dampingFactor = 0.05;
    this.#edit_controls.enableZoom = true;

    this.#edit_mode = "POS";

    if (utils.doc.is_mobile()) {
      this.#camera.rotation.z = Math.PI / 2;
    }

    this.glob_speed_mult = 1;

    // Movement state
    this.move = { forward: 0, backward: 0, left: 0, right: 0 };
    const direction = new deps.three.Vector3();
    const clock = new deps.three.Clock();

    // Main loop
    const speed = 0.9;
    this.speed_mult = 1;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (this.#edit_obj !== undefined) {
        if (!this.#edit_controls.enabled) {
          this.#edit_controls.enabled = true;
        }

        const dt = clock.getDelta(); // or use your actual delta time

        direction
          .set(
            this.move.right - this.move.left,
            this.#flying_speed.up - this.#flying_speed.down,
            -this.move.forward + this.move.backward
          )
          .normalize()
          .multiplyScalar(1);

        switch (this.#edit_mode) {
          case "POS": {
            this.#objects[this.#edit_obj].local.position.copy(
              this.#objects[this.#edit_obj].local.position
                .clone()
                .add(direction.multiplyScalar(5 * dt * this.glob_speed_mult))
            );
            update_info(`p${this.get_obj_pos(this.#edit_obj)[0]}`);
            break;
          }
          case "ROT": {
            this.#objects[this.#edit_obj].local.rotation.setFromVector3(
              direction
                .multiplyScalar(3 * dt * this.glob_speed_mult)
                .add(
                  new deps.three.Vector3(
                    this.#objects[this.#edit_obj].local.rotation.x,
                    this.#objects[this.#edit_obj].local.rotation.y,
                    this.#objects[this.#edit_obj].local.rotation.z
                  )
                )
            );

            update_info(`r${this.get_obj_rot(this.#edit_obj)[0]}`);
            break;
          }
          case "SCALE": {
            this.#objects[this.#edit_obj].local.scale.copy(
              this.#objects[this.#edit_obj].local.scale
                .clone()
                .add(direction.multiplyScalar(0.04 * dt * this.glob_speed_mult))
            );
            update_info(`s${this.get_obj_scale(this.#edit_obj)[0]}`);
            break;
          }
        }

        this.#edit_controls.target.copy(
          this.#objects[this.#edit_obj].local.position
        );
        this.#edit_controls.update();
      } else {
        // Apply movement
        direction
          .set(
            this.move.right - this.move.left,
            0,
            -this.move.forward + this.move.backward
          )
          .normalize();

        const moveVec = new deps.three.Vector3(direction.x, 0, direction.z);

        // Rotate movement direction to match the camera's orientation
        const cameraQuat = this.#camera.quaternion.clone();

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

        this.#player_rigid_body.applyImpulse(
          new deps.rapier.Vector3(
            moveVec.x * speed * this.speed_mult * this.glob_speed_mult,
            0,
            moveVec.z * speed * this.speed_mult * this.glob_speed_mult
          ),
          true
        );

        const dt = clock.getDelta(); // or use your actual delta time
        const damping = 4.0; // stronger = faster stop
        const damping_y = 0.2;
        const vel = this.#player_rigid_body.linvel();

        const dampedVel = new deps.rapier.Vector3(
          vel.x * (1 - damping * dt),
          this.#is_flying
            ? (-this.#world.gravity.y * dt * 5) / 7 +
              this.#flying_speed.up -
              this.#flying_speed.down
            : vel.y * (1 - damping_y * dt),
          vel.z * (1 - damping * dt)
        );

        this.#player_rigid_body.setLinvel(dampedVel, true);

        // RAYCAST

        // 1. Setup raycaster
        const raycaster = new deps.three.Raycaster();

        // 2. Cast a ray from camera forward
        const origin = this.#camera.position.clone();
        const ray_drection = new deps.three.Vector3();
        this.#camera.getWorldDirection(ray_drection);
        raycaster.set(origin, ray_drection);

        // 3. Build list of objects to raycast against (excluding player)
        const scene_obj: any = [];
        this.#scene.traverse((child: any) => {
          if (child.isMesh) {
            scene_obj.push(child);
          }
        });

        // 4. Perform raycast
        const intersects = raycaster.intersectObjects(scene_obj, true);

        // 5. Check result
        for (let on = 0; on < Object.keys(this.#objects).length; on++) {
          let obj_name = Object.keys(this.#objects)[on];
          if (this.#objects[obj_name].local_highlight !== undefined) {
            let keep_highlight = false;

            for (let i = 0; i < intersects.length; i++) {
              if (
                this.#object_contains(
                  this.#objects[obj_name].local,
                  intersects[i].object
                )
              ) {
                keep_highlight = true;
                break;
              }
            }

            if (!keep_highlight) {
              this.#scene.remove(this.#objects[obj_name].local_highlight);
              this.#objects[obj_name].local_highlight = undefined;
            }
          } else {
            for (let i = 0; i < intersects.length; i++) {
              if (
                this.#objects[obj_name].readme === "" ||
                !this.#object_contains(
                  this.#objects[obj_name].local,
                  intersects[i].object
                )
              )
                continue;

              const box = new deps.three.Box3().setFromObject(
                this.#objects[obj_name].local
              );
              const size = new deps.three.Vector3();
              const center = new deps.three.Vector3();
              box.getSize(size);
              box.getCenter(center);

              // Create a box mesh with additive glowing material
              const glowMat = new deps.three.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.2,
                blending: deps.three.AdditiveBlending,
                side: deps.three.BackSide,
              });

              const glowBox = new deps.three.Mesh(
                new deps.three.BoxGeometry(size.x, size.y, size.z),
                glowMat
              );
              glowBox.position.copy(center);
              glowBox.scale.multiplyScalar(1.1); // slightly larger than the object
              this.#scene.add(glowBox);
              this.#objects[obj_name].local_highlight = glowBox;
              break;
            }
          }
        }

        // UPDATE INFO

        update_info(
          `${this.#is_flying ? "f" : ""}(${this.#player_rigid_body
            .translation()
            .x.toFixed(1)},${this.#player_rigid_body
            .translation()
            .y.toFixed(1)},${this.#player_rigid_body
            .translation()
            .z.toFixed(1)})`
        );

        // Sync camera to capsule
        this.#camera.position.set(
          this.#player_rigid_body.translation().x,
          this.#player_rigid_body.translation().y + 0.8,
          this.#player_rigid_body.translation().z
        );
      }

      this.#world.step();

      this.#renderer.render(this.#scene, this.#camera);
    };
    animate();
  }

  #object_contains(object: any, target: any) {
    let current = target;
    while (current) {
      if (current === object) return true;
      current = current.parent;
    }
    return false;
  }

  load_text(text: string, local_name: string) {
    const geometry = new deps.three_addons.TextGeometry(text, {
      font: this.#text_font,
      size: 1,
      depth: 0.2,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.02,
      bevelSegments: 5,
    });

    const col = 0x00ff00;

    const material = new deps.three.MeshStandardMaterial({ color: col });
    const mesh = new deps.three.Mesh(geometry, material);

    geometry.center();

    this.#scene.add(mesh);

    this.#scale_me(mesh);

    let new_name = this.#get_free_name(local_name);
    this.#objects[new_name] = {
      local: mesh,
      mat: col,
      local_highlight: undefined,
      readme: "",
    };
  }

  #get_free_name(local_name: string) {
    let cur_it = 0;

    let free_name = local_name;
    while (free_name in this.#objects) {
      free_name = local_name + cur_it.toString();
      cur_it++;
    }

    return free_name;
  }

  #scale_me(obj: deps.three.Object3D) {
    obj.updateMatrixWorld(true);
    let box = new deps.three.Box3().setFromObject(obj);
    let size = new deps.three.Vector3();
    box.getSize(size);

    let scale_fac = 1 / Math.max(size.x, size.y, size.z);
    obj.scale.set(scale_fac, scale_fac, scale_fac);
  }

  async load(
    folder: string,
    name: string,
    files: Array<string>,
    model: types.sector.Model,
    local_name: string
  ) {
    let get_cached = async (
      file: string,
      loader: deps.three.Loader,
      clone: (grp: deps.three.Group) => any
    ) => {
      let url = `${
        utils.asite.PY_BACKEND
      }/api/obj_file?folder=${encodeURIComponent(
        folder
      )}&name=${encodeURIComponent(name)}&file=${encodeURIComponent(file)}`;

      if (!this.#cache.has(url)) {
        await new Promise<void>((resolve, reject) =>
          loader.load(
            url,
            (obj: any) => {
              this.#cache.set(url, obj);
              resolve();
            },
            undefined,
            reject
          )
        );
      }

      return clone(this.#cache.get(url)!);
    };

    switch (model) {
      case "GLTF_GLB": {
        let loader = new deps.three_addons.GLTFLoader();
        let cached = await get_cached(files[0], loader, (obj) =>
          (obj as any).scene.clone(true)
        );

        this.#scene.add(cached);

        this.#scale_me(cached);

        let new_name = this.#get_free_name(local_name);
        this.#objects[new_name] = {
          local: cached,
          mat: null,
          local_highlight: undefined,
          readme: "",
        };

        return ["Loaded"];
      }
      case "FBX": {
        let loader = new deps.three_addons.FBXLoader();
        let cached = await get_cached(files[0], loader, (obj) => obj);

        this.#scene.add(cached);

        this.#scale_me(cached);

        let new_name = this.#get_free_name(local_name);
        this.#objects[new_name] = {
          local: cached,
          mat: null,
          local_highlight: undefined,
          readme: "",
        };

        return ["Loaded"];
      }
      case "STL": {
        let loader = new deps.three_addons.STLLoader();
        let cached = await get_cached(files[0], loader, (obj) => obj);

        cached.center();

        let material = new deps.three.MeshStandardMaterial({ color: 0xffffff });
        let mesh = new deps.three.Mesh(cached, material);

        this.#scene.add(mesh);

        this.#scale_me(mesh);

        let new_name = this.#get_free_name(local_name);
        this.#objects[new_name] = {
          local: mesh,
          mat: null,
          local_highlight: undefined,
          readme: "",
        };

        return ["Loaded"];
      }
    }
  }

  create_tp_at_pos(name: string) {
    this.#tps[name] = {
      x: this.#player_rigid_body.translation().x,
      y: this.#player_rigid_body.translation().y,
      z: this.#player_rigid_body.translation().z,
    };
  }

  delete_tp(name: string) {
    delete this.#tps[name];
  }

  tp(name: string) {
    if (!(name in this.#tps)) return;

    this.#player_rigid_body.setTranslation(
      new deps.three.Vector3(
        this.#tps[name].x,
        this.#tps[name].y,
        this.#tps[name].z
      ),
      true
    );
  }

  ls_tps() {
    return Object.keys(this.#tps);
  }

  is_flying() {
    return this.#is_flying;
  }

  fly_reset_up() {
    this.#flying_speed.up = 0;
  }

  fly_reset_down() {
    this.#flying_speed.down = 0;
  }

  fly_down() {
    if (!this.#is_flying) return;

    this.#flying_speed.down = 5;
  }

  fly_up() {
    if (!this.#is_flying) return;

    this.#flying_speed.up = 5;
  }

  toggle_fly() {
    if (this.#edit_obj !== undefined) {
      switch (this.#edit_mode) {
        case "POS": {
          this.#edit_mode = "ROT";
          break;
        }
        case "ROT": {
          this.#edit_mode = "SCALE";
          break;
        }
        case "SCALE": {
          this.#edit_mode = "POS";
          break;
        }
      }

      return;
    }

    this.#is_flying = !this.#is_flying;

    if (this.#is_flying === false) {
      this.#flying_speed.up = 0;
      this.#flying_speed.down = 0;
    }
  }

  set_name(name: string) {
    this.#name = name;
  }

  jump() {
    if (this.#is_flying) return;

    // Get the position of the player
    const playerPos = this.#player_rigid_body.translation();

    // Define the ray starting just above the bottom of the body, going downward
    const rayOrigin = {
      x: playerPos.x,
      y: playerPos.y - this.#capsule_height_offset,
      z: playerPos.z,
    };
    const rayDir = { x: 0, y: -1, z: 0 };

    // Cast a ray downward up to a small distance (e.g. 0.1 units)
    const maxDistance = 0.075;

    const ray = new deps.rapier.Ray(rayOrigin, rayDir);
    const hit = this.#world.castRay(ray, maxDistance, true); // true = solid

    const isGrounded =
      hit !== null &&
      hit.collider !== this.#player_collider &&
      hit.timeOfImpact < maxDistance;

    if (isGrounded) {
      this.#player_rigid_body.applyImpulse(
        new deps.three.Vector3(0, 5, 0).multiplyScalar(this.glob_speed_mult),
        true
      );
    }
  }

  deconstruct() {
    // mount_ref.current!.removeChild!
    this.#renderer.dispose();
  }

  lock() {
    if (this.#edit_obj !== undefined) return;

    this.#controls.lock();
  }

  camera_quat_set(euler: deps.three.Euler) {
    this.#camera.quaternion.setFromEuler(euler);
  }

  ls_objs() {
    return Object.keys(this.#objects);
  }

  get_obj_pos(name: string) {
    return [
      `(${this.#objects[name].local.position.x},${
        this.#objects[name].local.position.y
      },${this.#objects[name].local.position.z})`,
    ];
  }

  get_obj_rot(name: string) {
    return [
      `(${(this.#objects[name].local.rotation.x * 180) / Math.PI},${
        (this.#objects[name].local.rotation.y * 180) / Math.PI
      },${(this.#objects[name].local.rotation.z * 180) / Math.PI})`,
    ];
  }

  get_obj_scale(name: string) {
    return [
      `(${this.#objects[name].local.scale.x},${
        this.#objects[name].local.scale.y
      },${this.#objects[name].local.scale.z})`,
    ];
  }

  set_obj_pos(name: string, x: number, y: number, z: number) {
    this.#objects[name].local.position.set(x, y, z);
  }

  set_obj_rot(name: string, x: number, y: number, z: number) {
    this.#objects[name].local.rotation.set(
      (x * Math.PI) / 180,
      (y * Math.PI) / 180,
      (z * Math.PI) / 180
    );
  }

  set_obj_scale(name: string, x: number, y: number, z: number) {
    this.#objects[name].local.scale.set(x, y, z);
  }

  edit_obj(name: string) {
    if (!(name in this.#objects)) return;

    this.#controls.unlock();
    this.#controls.enabled = false;
    this.#is_flying = true;
    this.#edit_obj = name;
  }

  override_mat(name: string, color: number) {
    if (!(name in this.#objects)) return;

    this.#objects[name].local.traverse((child: any) => {
      if (child.isMesh) {
        child.material = new deps.three.MeshStandardMaterial({ color: color });
      }
    });
    this.#objects[name].mat = color;
  }

  reset_mat(name: string) {
    if (!(name in this.#objects)) return;

    this.#objects[name].mat = null;
  }

  exit_edit() {
    this.#is_flying = false;
    this.#edit_obj = undefined;
    this.#controls.enabled = true;
  }

  #create_player(world: deps.rapier.World, x: number, y: number, z: number) {
    const radius = 0.3;
    const height = 1.8;

    const bodyDesc = deps.rapier.RigidBodyDesc.dynamic()
      .setTranslation(x, y, z)
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
    const capsule_height_offset = height / 2;

    return { body, collider, capsule_height_offset };
  }
}

export { Sector };
