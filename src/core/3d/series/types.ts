/**
 * Types for all 3D series renderers.
 */

import type { Vec3 } from '../math/Mat4';

/** Base interface for all 3D series */
export interface Series3DBase {
  id: string;
  visible: boolean;
  opacity: number;
}

/** 3D Bubble series data */
export interface Bubble3DSeriesData extends Series3DBase {
  type: 'bubble';
  positions: Float32Array;  // xyz interleaved
  scales?: Float32Array;
  colors?: Float32Array;    // rgb interleaved
}

/** Surface mesh data (grid-based height map) */
export interface SurfaceMesh3DData extends Series3DBase {
  type: 'surface';
  xValues: Float32Array;    // X axis values (columns)
  zValues: Float32Array;    // Z axis values (rows)
  yValues: Float32Array;    // Height values (rows * cols)
  colors?: Float32Array;    // Optional per-vertex colors
  wireframe?: boolean;
  colormap?: string;
}

/** Point-line 3D data (connected points in 3D space) */
export interface PointLine3DData extends Series3DBase {
  type: 'pointline';
  positions: Float32Array;  // xyz interleaved
  colors?: Float32Array;
  lineWidth?: number;
  pointSize?: number;
  showPoints?: boolean;
  showLines?: boolean;
}

/** Column/Bar 3D data */
export interface Column3DData extends Series3DBase {
  type: 'column';
  xValues: Float32Array;
  zValues: Float32Array;
  yValues: Float32Array;    // Heights
  colors?: Float32Array;
  columnWidth?: number;
  columnDepth?: number;
}

/** Waterfall 3D data (spectral/time series cascading) */
export interface Waterfall3DData extends Series3DBase {
  type: 'waterfall';
  slices: Float32Array[];   // Array of Y value slices
  xValues: Float32Array;    // X axis (frequency/position)
  zStep: number;            // Z spacing between slices
  zStart?: number;
  colormap?: string;
  fillMode?: 'solid' | 'wireframe' | 'gradient';
  strokeColor?: [number, number, number];
}

/** Scatter 3D data (points without connections) */
export interface Scatter3DData extends Series3DBase {
  type: 'scatter';
  positions: Float32Array;
  colors?: Float32Array;
  sizes?: Float32Array;
  symbol?: 'sphere' | 'cube' | 'diamond' | 'point';
}

/** Contour 3D data (iso-lines on surface) */
export interface Contour3DData extends Series3DBase {
  type: 'contour';
  xValues: Float32Array;
  zValues: Float32Array;
  yValues: Float32Array;
  levels: number[];         // Contour level values
  colors?: Float32Array;    // Color per level
  lineWidth?: number;
}

/** Ribbon 3D data (extruded line with width) */
export interface Ribbon3DData extends Series3DBase {
  type: 'ribbon';
  positions: Float32Array;  // Center line xyz
  widths?: Float32Array;    // Width at each point
  colors?: Float32Array;
  defaultWidth?: number;
}

/** Area 3D data (filled area under line) */
export interface Area3DData extends Series3DBase {
  type: 'area';
  positions: Float32Array;
  baseY?: number;           // Y value for base (default 0)
  colors?: Float32Array;
  fillOpacity?: number;
}

/** Heatmap 3D data (colored grid on XZ plane) */
export interface Heatmap3DData extends Series3DBase {
  type: 'heatmap';
  xValues: Float32Array;
  zValues: Float32Array;
  values: Float32Array;     // Intensity values
  colormap?: string;
  minValue?: number;
  maxValue?: number;
}

/** Impulse/Stem 3D data (vertical lines from base) */
export interface Impulse3DData extends Series3DBase {
  type: 'impulse';
  positions: Float32Array;  // xyz tip positions
  baseY?: number;
  colors?: Float32Array;
  lineWidth?: number;
  showMarkers?: boolean;
}

/** Union type for all series data */
export type Series3DData =
  | Bubble3DSeriesData
  | SurfaceMesh3DData
  | PointLine3DData
  | Column3DData
  | Waterfall3DData
  | Scatter3DData
  | Contour3DData
  | Ribbon3DData
  | Area3DData
  | Heatmap3DData
  | Impulse3DData;

/** Series type string literals */
export type Series3DType = Series3DData['type'];

/** Colormap definitions */
export type ColormapName =
  | 'viridis'
  | 'plasma'
  | 'inferno'
  | 'magma'
  | 'jet'
  | 'rainbow'
  | 'grayscale'
  | 'hot'
  | 'cool'
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'ocean'
  | 'terrain';

/** Axis 3D configuration */
export interface Axis3DOptions {
  label?: string;
  min?: number;
  max?: number;
  autoRange?: boolean;
  gridLines?: boolean;
  gridColor?: [number, number, number];
  tickCount?: number;
  visible?: boolean;
}

/** Scene 3D configuration */
export interface Scene3DOptions {
  xAxis?: Axis3DOptions;
  yAxis?: Axis3DOptions;
  zAxis?: Axis3DOptions;
  showAxes?: boolean;
  showGrid?: boolean;
  gridPlane?: 'xz' | 'xy' | 'yz' | 'all';
  backgroundColor?: [number, number, number, number];
}

/** Light configuration */
export interface Light3DOptions {
  direction?: Vec3;
  color?: [number, number, number];
  intensity?: number;
  ambient?: number;
}
