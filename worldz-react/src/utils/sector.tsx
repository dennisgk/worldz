import { deps, utils } from "../meta";

class Sector {
  #renderer: deps.three.WebGLRenderer;
  move: { forward: number; backward: number; left: number; right: number };
  #controls: deps.three_addons.PointerLockControls;
  #camera: deps.three.PerspectiveCamera;
  speed_mult: number;

  constructor(
    width: number,
    height: number,
    append_element: (elem: HTMLCanvasElement) => void
  ) {
    // Create scene
    const scene = new deps.three.Scene();

    // Create camera
    this.#camera = new deps.three.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    this.#camera.position.set(0, 2, 5);

    if (utils.doc.is_mobile()) {
      // Portrait → rotate camera
      this.#camera.rotation.z = Math.PI / 2;
      //width = mount_ref.current.clientHeight;
      //height = mount_ref.current.clientWidth;
      //camera.aspect = width / height;
      //camera.updateProjectionMatrix();
    }

    // Create this.#renderer
    this.#renderer = new deps.three.WebGLRenderer({ antialias: true });
    this.#renderer.setSize(width, height);
    append_element(this.#renderer.domElement);

    scene.add(new deps.three.HemisphereLight(0xffffff, 0x444444, 1));

    // Light
    const light = new deps.three.DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, 10);
    scene.add(light);

    // Add a cube
    const geometry = new deps.three.BoxGeometry();
    const material = new deps.three.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new deps.three.Mesh(geometry, material);
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
    scene.add(groundMesh);

    // Player capsule
    const player_body = this.#create_player(world);

    // Controls
    this.#controls = new deps.three_addons.PointerLockControls(
      this.#camera,
      this.#renderer.domElement
    );

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

      // Convert to Rapier vector
      //const rapierVec = new deps.rapier.Vector3(
      //  moveVec.x * speed,
      //  player_body.body.linvel().y,
      //  moveVec.z * speed
      //);

      //player_body.body.setLinvel(rapierVec, true);

      player_body.body.applyImpulse(
        new deps.rapier.Vector3(
          moveVec.x * speed * this.speed_mult,
          0,
          moveVec.z * speed * this.speed_mult
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
      this.#camera.position.set(
        player_body.body.translation().x,
        player_body.body.translation().y + 0.8,
        player_body.body.translation().z
      );

      this.#renderer.render(scene, this.#camera);
    };
    animate();
  }

  deconstruct() {
    // mount_ref.current!.removeChild!
    this.#renderer.dispose();
  }

  lock() {
    this.#controls.lock();
  }

  camera_quat_set(euler: deps.three.Euler) {
    this.#camera.quaternion.setFromEuler(euler);
  }

  #create_player(world: deps.rapier.World) {
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
  }
}

export { Sector };
