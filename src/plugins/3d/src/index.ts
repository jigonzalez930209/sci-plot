

// Main renderers
export { Bubble3DRenderer, type Bubble3DRendererOptions } from './Bubble3DRenderer';
export { SurfaceMesh3DRenderer, type SurfaceMesh3DRendererOptions } from './SurfaceMesh3DRenderer';

// Color themes
export * from './colorThemes';
export type { ColorTheme, ColorPalette, CustomThemeOptions } from './colorThemes';
export { DARK_THEME, LIGHT_THEME, getThemeFromBackground, createTheme } from './colorThemes';
export { Line3DRenderer, type Line3DRendererOptions, type Line3DData } from './Line3DRenderer';
export { Area3DRenderer, type Area3DRendererOptions, type AreaSeriesData } from './Area3DRenderer';
export { Impulse3DRenderer, type Impulse3DRendererOptions, type ImpulseSeriesData } from './Impulse3DRenderer';
export { Waterfall3DRenderer, type Waterfall3DRendererOptions, type WaterfallSeriesData } from './Waterfall3DRenderer';
export { VectorField3DRenderer, type VectorField3DRendererOptions, type VectorFieldData } from './VectorField3DRenderer';
export { PointCloud3DRenderer, type PointCloud3DRendererOptions, type PointCloudData } from './PointCloud3DRenderer';
export { Voxel3DRenderer, type Voxel3DRendererOptions, type VoxelData } from './Voxel3DRenderer';
export { Ribbon3DRenderer, type Ribbon3DRendererOptions, type RibbonSeriesData } from './Ribbon3DRenderer';
export { SurfaceBar3DRenderer, type SurfaceBar3DRendererOptions, type SurfaceBarData } from './SurfaceBar3DRenderer';

// Axes renderer
export { Axes3D, type Axes3DOptions, type AxisLabel3D } from './Axes3D';

// Math utilities
export { Mat4, Vec3 } from './math';
export type { Mat4 as Mat4Type, Vec3 as Vec3Type } from './math';

// Camera
export { OrbitCamera, type OrbitCameraOptions } from './camera';

// Controls
export { OrbitController, type OrbitControllerOptions } from './controls';

// Raycasting
export {
  createRayFromScreen,
  raySphereIntersection,
  rayTriangleIntersection,
  pickBubble,
  pickBubblesInRange,
  pickSurfaceMesh,
  pointToRayDistance,
  type Ray3D,
  type HitResult,
  type SurfaceHitResult,
} from './Raycaster3D';

// Tooltip
export {
  Tooltip3D,
  createHoverHandler,
  type Tooltip3DOptions,
  type Tooltip3DData,
} from './Tooltip3D';

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
