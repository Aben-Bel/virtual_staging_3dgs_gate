// Minimal ambient types for the (untyped) splat viewer library — only what we use.
declare module '@mkkellogg/gaussian-splats-3d' {
  export const SceneFormat: {
    Ply: number;
    Splat: number;
    KSplat: number;
  };

  export interface ViewerOptions {
    renderer?: unknown;
    useBuiltInControls?: boolean;
    sharedMemoryForWorkers?: boolean;
    selfDrivenMode?: boolean;
    antialiased?: boolean;
    sphericalHarmonicsDegree?: number;
    cameraUp?: [number, number, number];
    initialCameraPosition?: [number, number, number];
    initialCameraLookAt?: [number, number, number];
  }

  export interface AddSceneOptions {
    format?: number;
    showLoadingUI?: boolean;
    progressiveLoad?: boolean;
  }

  export interface Vec3Like {
    x: number;
    y: number;
    z: number;
  }
  export interface MutableVec3 extends Vec3Like {
    set(x: number, y: number, z: number): MutableVec3;
    copy(v: Vec3Like): MutableVec3;
  }

  export class Viewer {
    constructor(options?: ViewerOptions);
    camera?: {
      position: MutableVec3;
      up: MutableVec3;
      aspect: number;
      fov?: number;
      updateProjectionMatrix(): void;
    };
    controls?: { target: MutableVec3; update(): void };
    splatMesh?: {
      calculatedSceneCenter?: Vec3Like;
      maxSplatDistanceFromSceneCenter?: number;
    };
    addSplatScene(url: string, options?: AddSceneOptions): Promise<void>;
    start(): void;
    dispose(): Promise<void> | void;
  }
}
