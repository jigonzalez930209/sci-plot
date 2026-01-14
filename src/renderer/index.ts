/**
 * Renderer module exports
 */

// Native WebGL Renderer (zero dependencies)
export {
  NativeWebGLRenderer,
  interleaveData,
  interleaveStepData,
  interleaveBandData,
  parseColor,
  type NativeSeriesRenderData,
  type NativeRenderOptions,
} from "./NativeWebGLRenderer";

// Renderer Interface & Factory
export {
  type IWebGLRenderer,
  type SeriesRenderData,
  type RenderOptions,
  createRenderer,
  createNativeRenderer,
} from "./RendererInterface";

export { WebGPURenderer, type WebGPURendererOptions } from "./WebGPURenderer";

export * from "./shaders";

// Bar Chart Utilities
export { interleaveBarData, calculateBarWidth } from "./BarRenderer";

// Heatmap Utilities
export { interleaveHeatmapData, getColormap } from "./HeatmapRenderer";

// Candlestick Utilities
export { interleaveCandlestickData } from "./CandlestickRenderer";

// Polar Chart Utilities
export {
  polarToCartesian,
  interleavePolarLineData,
  interleavePolarFillData,
  generatePolarGrid,
  calculatePolarBounds,
  normalizeAngles,
} from "./PolarRenderer";
