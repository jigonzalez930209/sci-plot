/**
 * 3D Rendering Module for scichart-engine
 * 
 * Lightweight WebGL2-based 3D bubble chart renderer with:
 * - Instanced rendering for 100k+ bubbles in single draw call
 * - Orbit camera with mouse/touch controls
 * - No external dependencies (custom math library)
 * 
 * @example
 * ```typescript
 * import { Bubble3DRenderer } from 'scichart-engine/core/3d';
 * 
 * const renderer = new Bubble3DRenderer({
 *   canvas: document.getElementById('canvas') as HTMLCanvasElement,
 * });
 * 
 * // Set data (10k bubbles)
 * const count = 10000;
 * const positions = new Float32Array(count * 3);
 * const colors = new Float32Array(count * 3);
 * const scales = new Float32Array(count);
 * 
 * for (let i = 0; i < count; i++) {
 *   positions[i * 3] = Math.random() * 10 - 5;
 *   positions[i * 3 + 1] = Math.random() * 10 - 5;
 *   positions[i * 3 + 2] = Math.random() * 10 - 5;
 *   colors[i * 3] = Math.random();
 *   colors[i * 3 + 1] = Math.random();
 *   colors[i * 3 + 2] = Math.random();
 *   scales[i] = 0.05 + Math.random() * 0.1;
 * }
 * 
 * renderer.setData({ positions, colors, scales });
 * renderer.fitToData();
 * ```
 */

// Main renderer
export { Bubble3DRenderer, type Bubble3DRendererOptions } from './Bubble3DRenderer';

// Math utilities
export { Mat4, Vec3 } from './math';
export type { Mat4 as Mat4Type, Vec3 as Vec3Type } from './math';

// Camera
export { OrbitCamera, type OrbitCameraOptions } from './camera';

// Controls
export { OrbitController, type OrbitControllerOptions } from './controls';

// Mesh and geometry
export {
  InstancedMesh,
  createIcosphere,
  createUVSphere,
  createCube,
  createBillboardQuad,
  type GeometryData,
  type InstanceData,
  type InstancedMeshOptions,
} from './mesh';

// Shader programs
export {
  createProgramBundle3D,
  deleteProgramBundle,
  type ShaderProgram3D,
  type ProgramBundle3D,
} from './shader';

// Types
export type {
  Bubble3DData,
  Bubble3DStyle,
  Renderer3DOptions,
  Axis3DConfig,
  Bounds3D,
  RenderStats3D,
  CameraState,
  Renderer3DEvent,
  Renderer3DEventType,
  Renderer3DEventCallback,
} from './types';

// Series renderers
export {
  SurfaceMesh3D,
  PointLine3D,
  Column3D,
  Waterfall3D,
  Scatter3D,
  Ribbon3D,
  Area3D,
  Heatmap3D,
  Impulse3D,
} from './series';

// Series types
export type {
  Series3DData,
  Series3DType,
  Series3DBase,
  Bubble3DSeriesData,
  SurfaceMesh3DData,
  PointLine3DData,
  Column3DData,
  Waterfall3DData,
  Scatter3DData,
  Ribbon3DData,
  Area3DData,
  Heatmap3DData,
  Impulse3DData,
  ColormapName,
  Axis3DOptions,
  Scene3DOptions,
  Light3DOptions,
} from './series/types';
