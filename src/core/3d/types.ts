/**
 * Common types for 3D rendering module.
 */

import type { Vec3 } from './math/Mat4';

/** Bubble series data input */
export interface Bubble3DData {
  positions: Float32Array;  // xyz interleaved (length = count * 3)
  scales?: Float32Array;    // per-instance scale (length = count)
  colors?: Float32Array;    // rgb interleaved (length = count * 3)
}

/** Bubble series style options */
export interface Bubble3DStyle {
  opacity?: number;
  defaultColor?: [number, number, number];
  defaultScale?: number;
  geometry?: 'icosphere' | 'uvsphere' | 'cube';
  subdivisions?: number;
  enableLighting?: boolean;
  lightDirection?: Vec3;
  ambient?: number;
}

/** 3D renderer options */
export interface Renderer3DOptions {
  canvas: HTMLCanvasElement;
  backgroundColor?: [number, number, number, number];
  antialias?: boolean;
  preserveDrawingBuffer?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  maxInstances?: number;
}

/** Axis configuration for 3D scene */
export interface Axis3DConfig {
  visible?: boolean;
  min?: number;
  max?: number;
  label?: string;
  color?: [number, number, number];
  gridLines?: boolean;
  gridColor?: [number, number, number];
}

/** Scene bounds */
export interface Bounds3D {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

/** Render statistics */
export interface RenderStats3D {
  instanceCount: number;
  drawCalls: number;
  frameTime: number;
  fps: number;
}

/** Camera state snapshot */
export interface CameraState {
  target: Vec3;
  radius: number;
  theta: number;
  phi: number;
  fov: number;
}

/** Event types for 3D renderer */
export type Renderer3DEventType = 
  | 'render'
  | 'resize'
  | 'cameraChange'
  | 'dataUpdate';

export interface Renderer3DEvent {
  type: Renderer3DEventType;
  timestamp: number;
  stats?: RenderStats3D;
  camera?: CameraState;
}

export type Renderer3DEventCallback = (event: Renderer3DEvent) => void;
