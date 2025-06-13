type Model = "GLTF_GLB" | "FBX" | "STL" | "IMAGE";

type SectorDesc = {
  name: string;
  objects: {
    [name: string]: (
      | {
          type: "TEXT";
          text: string;
        }
      | {
          type: "LOAD";
          folder: string;
          name: string;
        }
    ) & {
      readme: string;
      pos: { x: number; y: number; z: number };
      rot: { x: number; y: number; z: number };
      scale: { x: number; y: number; z: number };
      mat: number | null;
    };
  };
  connections: Array<{ name1: string; name2: string }>;
  tps: { [name: string]: { x: number; y: number; z: number } };
  last_pos: { x: number; y: number; z: number };
  last_rot: { x: number; y: number; z: number };
  ground_width: number;
  ground_height: number;
  cust_vars: { [name: string]: any };
  glob_speed_mult: number;
};

export type { Model, SectorDesc };
