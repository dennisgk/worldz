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

  open_readme: (name: string) => void;

  #text_font: deps.three_addons.Font;

  #edit_obj: string | undefined;
  #edit_controls: deps.three_addons.OrbitControls;
  #edit_mode: "POS" | "ROT" | "SCALE";

  #is_flying: boolean;
  #flying_speed: { up: number; down: number };

  // save all here including speed mult
  #id: string;
  #name: string;
  #objects: {
    [name: string]: {
      local: deps.three.Object3D;
      local_highlight: undefined | deps.three.Object3D;
      readme: string;
      mat: number | null;
    } & (
      | { type: "TEXT"; text: string }
      | { type: "LOAD"; folder: string; name: string }
    );
  };
  #connections: Array<{
    local: deps.three.Object3D;
    name1: string;
    name2: string;
  }>;
  #tps: { [name: string]: { x: number; y: number; z: number } };
  #last_pos: { x: number; y: number; z: number };
  #last_rot: { x: number; y: number; z: number };
  #ground_width: number;
  #ground_height: number;
  #cust_vars: { [name: string]: any };
  glob_speed_mult: number;

  mobile_yaw: number;
  mobile_pitch: number;

  constructor(
    width: number,
    height: number,
    append_element: (elem: HTMLCanvasElement) => void,
    update_info: (val: string) => void,
    init_info: types.sector.SectorDesc,
    init_id: string
  ) {
    // create default things passed
    this.#id = init_id;
    this.#name = init_info.name;
    this.#objects = {};
    this.#connections = [];
    this.#tps = structuredClone(init_info.tps);
    this.#last_pos = structuredClone(init_info.last_pos);
    this.#last_rot = structuredClone(init_info.last_rot);
    this.#ground_width = init_info.ground_width;
    this.#ground_height = init_info.ground_height;
    this.#cust_vars = structuredClone(init_info.cust_vars);

    this.glob_speed_mult = init_info.glob_speed_mult;

    this.open_readme = () => {};

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

    // Light
    const light = new deps.three.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    this.#scene.add(light);

    // Set the target to (0, 0, 0)
    const target = new deps.three.Object3D();
    target.position.set(0, 0, 0);
    this.#scene.add(target);

    light.target = target; // required to make .lookAt work

    // World
    this.#world = new deps.rapier.World(new deps.rapier.Vector3(0, -9.82, 0));

    // Ground
    const ground_collider = this.#world.createCollider(
      deps.rapier.ColliderDesc.cuboid(
        this.#ground_width / 2,
        0.5,
        this.#ground_height / 2
      ).setTranslation(0, 0, 0)
    );
    ground_collider.setFriction(1);
    ground_collider.setRestitution(0);

    // ground to three
    const groundGeo = new deps.three.PlaneGeometry(
      this.#ground_width,
      this.#ground_height
    );
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
    if (utils.doc.is_mobile()) {
      this.#controls.enabled = false;
    } else {
      this.#controls.enabled = true;
    }

    this.#edit_obj = undefined;
    this.#edit_controls = new deps.three_addons.OrbitControls(
      this.#camera,
      this.#renderer.domElement
    );
    this.#edit_controls.enabled = false;
    this.#edit_controls.enableDamping = true;
    this.#edit_controls.dampingFactor = 0.05;
    this.#edit_controls.enableZoom = true;

    if (utils.doc.is_mobile()) {
      this.#edit_controls.invertControlsWorldz = true;
    }

    this.#edit_mode = "POS";

    let camera_up = new deps.three.Vector3(0, 1, 0);
    this.#camera.up.copy(camera_up);
    this.#camera.lookAt(this.#last_rot.x, this.#last_rot.y, this.#last_rot.z);
    if (utils.doc.is_mobile()) {
      this.#camera.rotateOnAxis(new deps.three.Vector3(0, 0, 1), Math.PI / 2);

      let euler = new deps.three.Euler().setFromQuaternion(
        this.#camera.quaternion,
        "YXZ"
      );

      this.mobile_yaw = euler.x;
      this.mobile_pitch = euler.y;
    } else {
      this.mobile_pitch = 0;
      this.mobile_yaw = 0;
    }

    // Movement state
    this.move = { forward: 0, backward: 0, left: 0, right: 0 };
    const direction = new deps.three.Vector3();
    const clock = new deps.three.Clock();

    // Main loop
    const speed = 0.9;
    this.speed_mult = 1;

    // Fonts
    this.#text_font = undefined as any;
    const font_loader = new deps.three_addons.FontLoader();

    new Promise<void>((resolve) => {
      font_loader.load("/assets/space.json", (font) => {
        this.#text_font = font;
        resolve();
      });
    }).then(async () => {
      for (let i = 0; i < Object.keys(init_info.objects).length; i++) {
        let cur_key = Object.keys(init_info.objects)[i];

        switch (init_info.objects[cur_key].type) {
          case "LOAD": {
            await this.load(
              init_info.objects[cur_key].folder,
              init_info.objects[cur_key].name,
              cur_key,
              init_info.objects[cur_key].readme,
              init_info.objects[cur_key].pos,
              init_info.objects[cur_key].rot,
              init_info.objects[cur_key].scale,
              init_info.objects[cur_key].mat
            );
            break;
          }
          case "TEXT": {
            this.load_text(
              init_info.objects[cur_key].text,
              cur_key,
              init_info.objects[cur_key].readme,
              init_info.objects[cur_key].pos,
              init_info.objects[cur_key].rot,
              init_info.objects[cur_key].scale,
              init_info.objects[cur_key].mat
            );
            break;
          }
        }
      }

      for (let i = 0; i < init_info.connections.length; i++) {
        this.connect(
          init_info.connections[i].name1,
          init_info.connections[i].name2
        );
      }
    });

    let last_intersect = 0;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      for (let i = 0; i < this.#connections.length; i++) {
        const closestA = new deps.three.Vector3();
        const closestB = new deps.three.Vector3();

        const box1 = new deps.three.Box3().setFromObject(
          this.#objects[this.#connections[i].name1].local
        );
        const box2 = new deps.three.Box3().setFromObject(
          this.#objects[this.#connections[i].name2].local
        );

        box1.clampPoint(box2.getCenter(new deps.three.Vector3()), closestA); // closest on box1 to center of box2
        box2.clampPoint(box1.getCenter(new deps.three.Vector3()), closestB); // closest on box2 to center of box1

        const closdir = new deps.three.Vector3().subVectors(closestA, closestB);
        const length = closdir.length();
        const midpoint = new deps.three.Vector3()
          .addVectors(closestA, closestB)
          .multiplyScalar(0.5);

        const up = new deps.three.Vector3(0, 1, 0);
        const quaternion = new deps.three.Quaternion().setFromUnitVectors(
          up,
          closdir.clone().normalize()
        );
        this.#connections[i].local.setRotationFromQuaternion(quaternion);
        this.#connections[i].local.position.copy(midpoint);
        this.#connections[i].local.scale.set(1, length, 1);
      }

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
            update_info(`p${this.get_obj_pos_sa(this.#edit_obj)[0]}`);
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

            update_info(`r${this.get_obj_rot_sa(this.#edit_obj)[0]}`);
            break;
          }
          case "SCALE": {
            this.#objects[this.#edit_obj].local.scale.copy(
              this.#objects[this.#edit_obj].local.scale
                .clone()
                .add(direction.multiplyScalar(0.04 * dt * this.glob_speed_mult))
            );
            update_info(`s${this.get_obj_scale_sa(this.#edit_obj)[0]}`);
            break;
          }
        }

        this.#edit_controls.target.copy(
          this.#objects[this.#edit_obj].local.position
        );
        if (utils.doc.is_mobile()) {
          if (this.#flying_speed.up - this.#flying_speed.down !== 0) {
            this.#edit_controls.avoidControlsWorldz = true;
          } else {
            this.#edit_controls.avoidControlsWorldz = false;
          }
        }
        this.#edit_controls.update();
        if (utils.doc.is_mobile()) {
          this.#camera.rotateOnAxis(
            new deps.three.Vector3(0, 0, 1),
            Math.PI / 2
          );
        }
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

        last_intersect = last_intersect + dt;
        if (last_intersect > 0.25) {
          last_intersect = 0;

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
                  ) &&
                  intersects[i].distance <= 6
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
                  ) ||
                  intersects[i].distance > 6
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

  get_readme(name: string) {
    if (!(name in this.#objects)) return;

    return this.#objects[name].readme;
  }

  set_readme(name: string, text: string) {
    if (!(name in this.#objects)) return;

    this.#objects[name].readme = text;
  }

  ls_connects() {
    return this.#connections.map((v) => [v.name1, v.name2]);
  }

  click() {
    if (this.#edit_obj !== undefined) return;

    let filt: undefined | string = undefined;
    for (let i = 0; i < Object.keys(this.#objects).length; i++) {
      let k = Object.keys(this.#objects)[i];
      if (this.#objects[k].local_highlight !== undefined) {
        filt = k;
        break;
      }
    }

    if (filt === undefined) return;

    this.open_readme(filt);
  }

  connect(name1: string, name2: string) {
    if (name1 === name2) return ["Can not connect to self"];
    if (!(name1 in this.#objects && name2 in this.#objects))
      return ["Not present"];
    if (
      this.#connections.some(
        (v) =>
          (v.name1 === name1 && v.name2 === name2) ||
          (v.name1 === name2 && v.name2 === name1)
      )
    )
      return ["Already exists"];

    const radius = 0.05;

    const closestA = new deps.three.Vector3();
    const closestB = new deps.three.Vector3();

    const box1 = new deps.three.Box3().setFromObject(
      this.#objects[name1].local
    );
    const box2 = new deps.three.Box3().setFromObject(
      this.#objects[name2].local
    );

    box1.clampPoint(box2.getCenter(new deps.three.Vector3()), closestA); // closest on box1 to center of box2
    box2.clampPoint(box1.getCenter(new deps.three.Vector3()), closestB); // closest on box2 to center of box1

    const direction = new deps.three.Vector3().subVectors(closestA, closestB);
    let length = direction.length();
    const midpoint = new deps.three.Vector3()
      .addVectors(closestA, closestB)
      .multiplyScalar(0.5);

    const glowMaterial = new deps.three.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.7,
      blending: deps.three.AdditiveBlending,
      depthWrite: false,
    });

    const geometry = new deps.three.CylinderGeometry(radius, radius, 1, 4, 8);
    const mesh = new deps.three.Mesh(geometry, glowMaterial);

    // Align with direction
    const up = new deps.three.Vector3(0, 1, 0); // Capsule is vertical by default
    const quaternion = new deps.three.Quaternion().setFromUnitVectors(
      up,
      direction.clone().normalize()
    );
    mesh.setRotationFromQuaternion(quaternion);

    mesh.position.copy(midpoint);
    mesh.scale.set(1, length, 1);

    this.#scene.add(mesh);
    this.#connections.push({
      name1: name1,
      name2: name2,
      local: mesh,
    });

    return ["Connected"];
  }

  disconnect(name1: string, name2: string) {
    let removed = this.#connections.filter(
      (v) =>
        (v.name1 === name1 && v.name2 === name2) ||
        (v.name1 === name2 && v.name2 === name1)
    );

    if (removed.length < 1) return ["Does not exist"];

    removed.forEach((v) => this.#scene.remove(v.local));
    this.#connections = this.#connections.filter((v) => !removed.includes(v));
    return ["Disconnected"];
  }

  load_text(
    text: string,
    local_name: string,
    init_readme: string = "",
    init_pos: undefined | { x: number; y: number; z: number } = undefined,
    init_rot: undefined | { x: number; y: number; z: number } = undefined,
    init_scale: undefined | { x: number; y: number; z: number } = undefined,
    init_mat: number | null = null
  ) {
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

    const col = init_mat === null ? 0xffffff : init_mat;

    const material = new deps.three.MeshStandardMaterial({ color: col });
    const mesh = new deps.three.Mesh(geometry, material);

    geometry.center();

    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox!; // THREE.Box3

    const size = new deps.three.Vector3();
    bounds.getSize(size);

    const center = new deps.three.Vector3();
    bounds.getCenter(center);

    // Create a BoxGeometry that matches the bounds
    const boxGeo = new deps.three.BoxGeometry(size.x, size.y, size.z);
    const invisibleMat = new deps.three.MeshBasicMaterial({ visible: false });

    const hitboxMesh = new deps.three.Mesh(boxGeo, invisibleMat);

    // Position the box to align with the text
    hitboxMesh.position.copy(center);

    const group = new deps.three.Group();
    group.add(hitboxMesh);
    mesh.position.sub(center); // Offset text inside the hitbox
    hitboxMesh.add(mesh); // textMesh now relative to hitbox

    this.#scene.add(group);

    this.#do_prs(group, init_pos, init_rot, init_scale);

    let new_name = this.#get_free_name(local_name);
    this.#objects[new_name] = {
      type: "TEXT",
      local: group,
      mat: col,
      local_highlight: undefined,
      readme: init_readme,
      text: text,
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

  #do_prs(
    cached: any,
    init_pos: { x: number; y: number; z: number } | undefined,
    init_rot: { x: number; y: number; z: number } | undefined,
    init_scale: { x: number; y: number; z: number } | undefined
  ) {
    if (init_pos !== undefined) {
      cached.position.set(init_pos.x, init_pos.y, init_pos.z);
    }
    if (init_rot !== undefined) {
      cached.rotation.set(init_rot.x, init_rot.y, init_rot.z);
    }
    if (init_scale !== undefined) {
      cached.scale.set(init_scale.x, init_scale.y, init_scale.z);
    } else {
      this.#scale_me(cached);
    }
    let remove: Array<any> = [];
    cached.traverse((e: any) => e.isLight && remove.push(e));
    remove.forEach((light) => {
      try {
        light.parent.remove(light);
      } catch {}
    });
  }

  #scale_me(obj: deps.three.Object3D) {
    try {
      obj.updateMatrixWorld(true);
    } catch {}
    let box = new deps.three.Box3().setFromObject(obj);
    let size = new deps.three.Vector3();
    box.getSize(size);

    let scale_fac = 1 / Math.max(size.x, size.y, size.z);
    obj.scale.set(scale_fac, scale_fac, scale_fac);
  }

  async load(
    folder: string,
    name: string,
    local_name: string,
    init_readme: string = "",
    init_pos: undefined | { x: number; y: number; z: number } = undefined,
    init_rot: undefined | { x: number; y: number; z: number } = undefined,
    init_scale: undefined | { x: number; y: number; z: number } = undefined,
    init_mat: number | null = null
  ) {
    let desc = await (
      await fetch(
        `${utils.asite.PY_BACKEND}/api/obj?folder=${encodeURIComponent(
          folder
        )}&name=${encodeURIComponent(name)}`
      )
    ).json();

    let files = desc.files;
    let model = desc.model;

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
        this.#do_prs(cached, init_pos, init_rot, init_scale);

        let new_name = this.#get_free_name(local_name);
        this.#objects[new_name] = {
          type: "LOAD",
          folder: folder,
          name: name,
          local: cached,
          mat: init_mat,
          local_highlight: undefined,
          readme: init_readme,
        };

        if (init_mat !== null) {
          this.override_mat(new_name, init_mat);
        }

        return ["Loaded"];
      }
      case "FBX": {
        let loader = new deps.three_addons.FBXLoader();
        let cached = await get_cached(files[0], loader, (obj) => obj);

        this.#scene.add(cached);
        this.#do_prs(cached, init_pos, init_rot, init_scale);

        let new_name = this.#get_free_name(local_name);
        this.#objects[new_name] = {
          type: "LOAD",
          folder: folder,
          name: name,
          local: cached,
          mat: init_mat,
          local_highlight: undefined,
          readme: init_readme,
        };

        if (init_mat !== null) {
          this.override_mat(new_name, init_mat);
        }

        return ["Loaded"];
      }
      case "STL": {
        let loader = new deps.three_addons.STLLoader();
        let cached = await get_cached(files[0], loader, (obj) => obj);

        cached.center();

        let act_init_mat = init_mat === null ? 0xffffff : init_mat;

        let material = new deps.three.MeshStandardMaterial({
          color: act_init_mat,
        });
        let mesh = new deps.three.Mesh(cached, material);

        this.#scene.add(mesh);
        this.#do_prs(mesh, init_pos, init_rot, init_scale);

        let new_name = this.#get_free_name(local_name);
        this.#objects[new_name] = {
          type: "LOAD",
          folder: folder,
          name: name,
          local: mesh,
          mat: act_init_mat,
          local_highlight: undefined,
          readme: init_readme,
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

  get_name() {
    return this.#name;
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

    try {
      this.#controls.lock();
    } catch {}
  }

  unlock() {
    try {
      this.#controls.unlock();
    } catch {}
  }

  camera_quat_set(euler: deps.three.Euler) {
    this.#camera.quaternion.setFromEuler(euler);
  }

  ls_objs() {
    return Object.keys(this.#objects);
  }

  get_obj_pos_sa(name: string) {
    let val = this.get_obj_pos(name);
    return [`(${val[0]},${val[1]},${val[2]})`];
  }

  get_obj_rot_sa(name: string) {
    let val = this.get_obj_rot(name);
    return [`(${val[0]},${val[1]},${val[2]})`];
  }

  get_obj_scale_sa(name: string) {
    let val = this.get_obj_scale(name);
    return [`(${val[0]},${val[1]},${val[2]})`];
  }

  get_obj_pos(name: string) {
    return [
      this.#objects[name].local.position.x,
      this.#objects[name].local.position.y,
      this.#objects[name].local.position.z,
    ];
  }

  get_obj_rot(name: string) {
    return [
      (this.#objects[name].local.rotation.x * 180) / Math.PI,
      (this.#objects[name].local.rotation.y * 180) / Math.PI,
      (this.#objects[name].local.rotation.z * 180) / Math.PI,
    ];
  }

  get_obj_scale(name: string) {
    return [
      this.#objects[name].local.scale.x,
      this.#objects[name].local.scale.y,
      this.#objects[name].local.scale.z,
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

    this.unlock();
    this.#controls.enabled = false;
    this.#is_flying = true;
    this.#edit_obj = name;
  }

  override_mat(name: string, color: number) {
    if (!(name in this.#objects)) return;

    this.#objects[name].local.traverse((child: any) => {
      if (child.isMesh) {
        let is_vis = true;

        try {
          is_vis = child.material.visible;
        } catch {}

        if (is_vis) {
          child.material = new deps.three.MeshStandardMaterial({
            color: color,
          });
        }
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
    this.#edit_controls.enabled = false;
    if (!utils.doc.is_mobile()) {
      this.#controls.enabled = true;
    }
  }

  ls_cust_vars() {
    return Object.keys(this.#cust_vars);
  }

  get_cust_var(name: string) {
    return this.#cust_vars[name];
  }

  set_cust_var(name: string, value: any) {
    this.#cust_vars[name] = value;
  }

  delete_cust_var(name: string) {
    delete this.#cust_vars[name];
  }

  get_id() {
    return this.#id;
  }

  delete_local_obj(name: string) {
    if (!(name in this.#objects)) return;

    this.#scene.remove(this.#objects[name].local);
    if (this.#objects[name].local_highlight !== undefined) {
      this.#scene.remove(this.#objects[name].local_highlight);
    }
    delete this.#objects[name];

    let rem_conn = this.#connections.filter(
      (v) => v.name1 === name || v.name2 === name
    );
    for (let i = 0; i < rem_conn.length; i++) {
      this.#scene.remove(rem_conn[i].local);
    }
    this.#connections = this.#connections.filter((v) => !rem_conn.includes(v));
  }

  get_ground_size() {
    return [this.#ground_width, this.#ground_height];
  }

  set_ground_size(width: number, height: number) {
    if (width <= 0 || height <= 0) return;

    this.#ground_width = width;
    this.#ground_height = height;
  }

  async save() {
    let forward = new deps.three.Vector3(0, 0, 1);
    this.#camera.getWorldDirection(forward);

    let save_obj: types.sector.SectorDesc = {
      name: this.#name,
      objects: {},
      connections: this.#connections.map((v) => ({
        name1: v.name1,
        name2: v.name2,
      })),
      tps: this.#tps,
      last_rot: {
        x: forward.x,
        y: forward.y,
        z: forward.z,
      },
      last_pos: {
        x: this.#player_rigid_body.translation().x,
        y: this.#player_rigid_body.translation().y,
        z: this.#player_rigid_body.translation().z,
      },
      cust_vars: this.#cust_vars,
      glob_speed_mult: this.glob_speed_mult,
      ground_height: this.#ground_height,
      ground_width: this.#ground_width,
    };

    for (let i = 0; i < Object.keys(this.#objects).length; i++) {
      let cur_key = Object.keys(this.#objects)[i];

      switch (this.#objects[cur_key].type) {
        case "LOAD": {
          save_obj.objects[cur_key] = {
            type: "LOAD",
            folder: this.#objects[cur_key].folder,
            name: this.#objects[cur_key].name,
            readme: this.#objects[cur_key].readme,
            pos: {
              x: this.#objects[cur_key].local.position.x,
              y: this.#objects[cur_key].local.position.y,
              z: this.#objects[cur_key].local.position.z,
            },
            rot: {
              x: this.#objects[cur_key].local.rotation.x,
              y: this.#objects[cur_key].local.rotation.y,
              z: this.#objects[cur_key].local.rotation.z,
            },
            scale: {
              x: this.#objects[cur_key].local.scale.x,
              y: this.#objects[cur_key].local.scale.y,
              z: this.#objects[cur_key].local.scale.z,
            },
            mat: this.#objects[cur_key].mat,
          };
          break;
        }
        case "TEXT": {
          save_obj.objects[cur_key] = {
            type: "TEXT",
            text: this.#objects[cur_key].text,
            readme: this.#objects[cur_key].readme,
            pos: {
              x: this.#objects[cur_key].local.position.x,
              y: this.#objects[cur_key].local.position.y,
              z: this.#objects[cur_key].local.position.z,
            },
            rot: {
              x: this.#objects[cur_key].local.rotation.x,
              y: this.#objects[cur_key].local.rotation.y,
              z: this.#objects[cur_key].local.rotation.z,
            },
            scale: {
              x: this.#objects[cur_key].local.scale.x,
              y: this.#objects[cur_key].local.scale.y,
              z: this.#objects[cur_key].local.scale.z,
            },
            mat: this.#objects[cur_key].mat,
          };
          break;
        }
      }
    }

    let resp = await fetch(
      `${utils.asite.PY_BACKEND}/api/write_sector?id=${encodeURIComponent(
        this.#id
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(save_obj),
      }
    );

    if (resp.ok) return ["Okay"];

    return ["Error"];
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
