/**
 * SciChart Engine - High-Performance Scientific Charting
 *
 * A WebGL-based charting engine designed for scientific data visualization
 * and high-performance rendering of large datasets.
 *
 * Features:
 * - 10⁵–10⁶ points at 60 FPS
 * - Zoom/pan via GPU uniforms (no buffer recreation)
 * - Scientific precision with Float32/Float64 arrays
 * - Data analysis utilities (peak detection, cycle detection, etc.)
 *
 * @packageDocumentation
 */

// ============================================
// Core exports
// ============================================
export { createChart } from "./core/Chart";
export { Series } from "./core/Series";
export { EventEmitter } from "./core/EventEmitter";
export type { Chart, ChartOptions, ExportOptions } from "./core/Chart";

// ============================================
// Animation
// ============================================
export {
  AnimationEngine,
  easings,
  DEFAULT_ANIMATION_CONFIG,
  mergeAnimationConfig,
  getSharedAnimationEngine,
} from "./core/animation";
export type {
  AnimationOptions,
  AnimationHandle,
  BoundsAnimation,
  ChartAnimationConfig,
  EasingFunction,
  EasingName,
} from "./core/animation";

// ============================================
// Chart Initialization Queue (for multiple charts)
// ============================================
export {
  ChartInitQueue,
  getChartInitQueue,
  queueChartInit,
  waitForAnimations,
  resetChartQueue,
} from "./core/ChartInitQueue";

// ============================================
// Annotations
// ============================================
export { AnnotationManager } from "./core/annotations";
export type {
  Annotation,
  AnnotationType,
  HorizontalLineAnnotation,
  VerticalLineAnnotation,
  RectangleAnnotation,
  BandAnnotation,
  TextAnnotation,
  ArrowAnnotation,
} from "./core/annotations";

// ============================================
// Types
// ============================================
export type {
  AxisOptions,
  SeriesOptions,
  SeriesData,
  SeriesStyle,
  SeriesUpdateData,
  ZoomOptions,
  CursorOptions,
  ChartEventMap,
  Point,
  Bounds,
  Range,
  ScaleType,
  SeriesType,
  StepMode,
  ErrorBarStyle,
  ErrorBarDirection,
  ScatterSymbol,
  DeltaMeasurement,
  PeakMeasurement,
  // Polar Charts
  PolarMode,
  PolarData,
  PolarStyle,
  PolarOptions,
} from "./types";

// ============================================
// Scales
// ============================================
export { LinearScale, LogScale, createScale, type Scale } from "./scales";

// ============================================
// Renderer
// ============================================
export {
  NativeWebGLRenderer,
  interleaveData,
  parseColor,
  createRenderer,
  createNativeRenderer,
  WebGPURenderer,
  type WebGPURendererOptions,
  type IWebGLRenderer,
  type SeriesRenderData,
  type RenderOptions,
} from "./renderer";

// ============================================
// Theme
// ============================================
export {
  DARK_THEME,
  LIGHT_THEME,
  MIDNIGHT_THEME,
  ELECTROCHEM_THEME,
  DEFAULT_THEME,
  createTheme,
  getThemeByName,
  type ChartTheme,
  type GridTheme,
  type AxisTheme,
  type LegendTheme,
  type CursorTheme,
} from "./theme";

// ============================================
// Overlay
// ============================================
export {
  OverlayRenderer,
} from "./core/OverlayRenderer";

// ============================================
// Persistence & Serialization
// ============================================
export {
  SERIALIZATION_VERSION,
  encodeFloat32Array,
  decodeFloat32Array,
  compressString,
  decompressString,
  stateToUrlHash,
  urlHashToState,
  validateChartState,
  StateHistory,
  type SerializedAxis,
  type SerializedSeries,
  type ChartState,
  type SerializeOptions,
  type DeserializeOptions,
  type StateSnapshot,
} from "./serialization";

export type {
  PlotArea,
  CursorState,
} from "./types";

// ============================================
// Tooltip System
// ============================================
  export {
  TooltipManager,
  TOOLTIP_THEMES,
  getTooltipThemeForChartTheme,
} from "./plugins/tools/tooltip";

export type {
  TooltipData,
  TooltipType,
  TooltipTheme,
  TooltipOptions,
  TooltipTemplate,
  DataPointTooltip,
  CrosshairTooltip,
  HeatmapTooltip,
} from "./plugins/tools/tooltip";

// ============================================
// Downsampling
// ============================================
export {
  lttbDownsample,
  minMaxDownsample,
  calculateTargetPoints,
} from "./workers/downsample";

// ============================================
// Data Analysis utilities
// ============================================
export {
  formatWithPrefix,
  formatValue,
  formatScientific,
  getBestPrefix,
  detectCycles,
  generateCycleColors,
  detectPeaks,
  validateData,
  calculateStats,
  movingAverage,
  downsampleLTTB,
  subtractBaseline,
  // Math
  integrate,
  derivative,
  cumulativeIntegral,
  calculateR2,
  solveLinearSystem,
  // Spectral / FFT
  fft,
  ifft,
  analyzeSpectrum,
  powerSpectrum,
  dominantFrequency,
  analyzeComplexSpectrum,
  fftFromComplexInput,
  hanningWindow,
  hammingWindow,
  blackmanWindow,
  nextPowerOf2,
  complexToArrays,
  arraysToComplex,
  ifftFromArrays,
  ifftComplex,
  getPositiveFrequencies,
  // Filters
  lowPassFilter,
  highPassFilter,
  bandPassFilter,
  bandStopFilter,
  butterworth,
  exponentialMovingAverage,
  gaussianSmooth,
  savitzkyGolay,
  medianFilter,
  singleFrequencyFilter,
  // Statistics
  crossCorrelation,
  autoCorrelation,
  detectAnomalies,
  trapezoidalIntegration,
  simpsonsIntegration,
  tTest,
  type CycleInfo,
  type Peak,
  type PrefixInfo,
  type ValidationResult,
  type DataStats,
  type FFTResult,
  type ComplexFFTResult,
  type PowerSpectrumResult,
  type FilterOptions,
  type ButterworthOptions,
  type SingleFrequencyFilterOptions,
} from "./plugins/analysis";

// ============================================
// Streaming utilities
// ============================================
export {
  createWebSocketStream,
  connectStreamToChart,
  createMessageParser,
  createMockStream,
  type WebSocketStream,
  type WebSocketStreamConfig,
  type DataPoint,
  type StreamStats,
  type WebSocketState,
} from "./streaming";

// ============================================
// React bindings
// ============================================
export {
  SciChart,
  useSciChart,
  type SciChartProps,
  type SciChartRef,
  type SciChartSeries,
  type UseSciChartOptions,
  type UseSciChartReturn,
} from "./react";

// ============================================
// GPU Abstraction Layer (Experimental)
// ============================================
export {
  // Backends
  WebGPUBackend,
  WebGLBackend,

  // Renderer facade
  GpuRenderer,
  createGpuRenderer,

  // Adapter utilities
  SeriesAdapter,
  parseColorToRGBA,

  // Resource management
  PipelineCache,
  BaseBufferStore,
  BaseTextureStore,

  // Benchmark
  GpuBenchmark,

  // GPU Compute
  GpuCompute,
} from "./gpu";

export type {
  // Core types
  GpuBackendType,
  RGBA,
  GpuViewport,
  GpuBackend,
  BufferId,
  TextureId,

  // Frame types
  FrameUniforms,

  // Draw types
  DrawKind,
  DrawCall,
  DrawList,
  PointSymbol,

  // Adapter types
  SeriesData as GpuSeriesData,
  Bounds as GpuBounds,
  GpuRenderOptions,
  GpuRendererOptions,
  BackendPreference,
  WebGPUBackendOptions,

  // Benchmark types
  BenchmarkResult,
  BenchmarkOptions,

  // Compute types
  DataStats as GpuDataStats,
  DataBounds as GpuDataBounds,
  Peak as GpuPeak,
  GpuComputeOptions,
} from "./gpu";

// ============================================
// Internationalization (i18n)
// ============================================
export {
  setGlobalLocale,
  getGlobalLocale,
  getLocale,
  registerLocale,
  createLocaleFormatter,
  LOCALE_EN_US,
  LOCALE_ES_ES,
  LOCALE_DE_DE,
  LOCALE_FR_FR,
  LOCALE_PT_BR,
  LOCALE_ZH_CN,
  LOCALE_JA_JP,
  type LocaleConfig,
  type LocaleFormatter,
} from "./core/locale";

// ============================================
// Keyboard Shortcuts
// ============================================
export {
  KeyBindingManager,
  DEFAULT_KEY_BINDINGS,
  createKeyBinding,
  parseShortcut,
  type KeyAction,
  type KeyBinding,
  type KeyBindingCallbacks,
  type KeyBindingManagerOptions,
} from "./core/keybindings";

// ============================================
// Clipboard
// ============================================
export {
  ClipboardManager,
  getClipboardManager,
  copyToClipboard,
  formatData,
  type ClipboardFormat,
  type ClipboardOptions,
  type ClipboardDataPoint,
  type ClipboardResult,
} from "./core/clipboard";

// ============================================
// Debug Overlay
// ============================================
export {
  DebugOverlay,
  createDebugOverlay,
  enableDebugMode,
  type DebugStats,
  type DebugOverlayOptions,
} from "./core/debug";

// ============================================
// Loading Indicators
// ============================================
export {
  LoadingIndicator,
  createLoadingIndicator,
  showLoading,
  showProgress,
  type LoadingIndicatorType,
  type LoadingIndicatorOptions,
  type LoadingState,
} from "./core/loading";

// ============================================
// Testing Utilities (for test environments)
// ============================================
export {
  // Data generators
  generateSineWave,
  generateSquareWave,
  generateSawtoothWave,
  generateTriangleWave,
  generateRandomData,
  generateCVData,
  generateNyquistData,

  // Benchmarking
  benchmarkRender,
  assertPerformance,

  // Snapshots
  createSnapshot,
  compareSnapshots,

  // Utilities
  waitForFrames,
  waitFor,

  // Types
  type MockChartOptions,
  type WaveformOptions,
  type RandomDataOptions,
  type BenchmarkResult as TestBenchmarkResult,
  type BenchmarkOptions as TestBenchmarkOptions,
  type SnapshotOptions,
  type ChartSnapshot,
} from "./testing";

// ============================================
// Chart Synchronization
// ============================================
export {
  ChartGroup,
  createChartGroup,
  linkCharts,
  createMasterSlave,
  type SyncAxis,
  type SyncOptions,
  type ChartLike,
  type SyncEvent,
} from "./core/sync";

// ============================================
// Theme Editor
// ============================================
export {
  ThemeEditor,
  createThemeEditor,
  getPresetTheme,
  getPresetNames,
  THEME_PRESETS,
  type EditorTheme,
  type ThemeEditorOptions,
  type ThemePreset,
  type ColorGroup,
  type ColorProperty,
} from "./core/theme-editor";

// ============================================
// Streaming Backpressure
// ============================================
export {
  BackpressureManager,
  CircularBuffer,
  createBackpressureManager,
  createRealtimeBackpressure,
  createLosslessBackpressure,
  type OverflowStrategy,
  type BackpressureConfig,
  type PressureStats,
  type BufferHealth,
} from "./streaming/backpressure";

// ============================================
// Financial/Technical Indicators
// ============================================
export {
  sma,
  ema,
  wma,
  dema,
  tema,
  rsi,
  macd,
  stochastic,
  roc,
  momentum,
  bollingerBands,
  atr,
  standardDeviation,
  vwap,
  obv,
  adx,
  aroon,
  percentChange,
  cumsum,
  normalize,
  type IndicatorResult,
  type OHLCData,
} from "./plugins/analysis";

// ============================================
// Plugin System
// ============================================
export {
  // Core functionality
  createPluginContext,
  PluginManagerImpl,

  // Registry
  getPluginRegistry,
  registerPlugin,
  definePlugin,
  defineAndRegister,
  loadPlugin,
  listPluginsByCategory,
  validateManifest,
  checkPluginCompatibility,

  // Helpers
  createPlugin,
  createConfigurablePlugin,

  // Built-in plugins
  CrosshairPlugin,
  StatsPlugin,
  WatermarkPlugin,
  GridHighlightPlugin,
  DataLoggerPlugin,
  DirectionIndicatorPlugin,
  PluginTools,
  PluginAnalysis,
  PluginAnnotations,
  PluginLoading,
  PluginRegression,
  PluginMLIntegration,
  PluginRadar,
  PluginSnapshot,
  PluginDataTransform,
  BuiltinPlugins,
} from "./plugins";

export type {
  // Manifest & Metadata
  PluginVersion,
  PluginCapability,
  PluginManifest,

  // Context Types
  PluginContext,
  RenderContext,
  CoordinateContext,
  DataContext,
  UIContext as PluginUIContext,
  EventContext as PluginEventContext,
  PluginStorage,
  PluginLogger,
  OverlayOptions,
  NotificationOptions,
  PickResult,

  // Hook Event Types
  BeforeRenderEvent,
  AfterRenderEvent,
  InteractionEvent,
  ViewChangeEvent,
  SeriesChangeEvent,
  DataUpdateEvent,

  // Plugin Types
  ChartPlugin,
  PluginFactory,
  TypedPlugin,
  PluginManager,
  PluginRegistry,
  PluginRegistryEntry,
  ContextDependencies,

  // Built-in plugin configs
  CrosshairPluginConfig,
  StatsPluginConfig,
  WatermarkPluginConfig,
  GridHighlightConfig,
  DataLoggerConfig,
  DirectionIndicatorConfig,
  PluginToolsConfig,
  PluginAnalysisConfig,
  PluginAnnotationsConfig,
  PluginLoadingConfig,
  PluginRegressionConfig,
  PluginMLIntegrationConfig,
  PluginRadarConfig,
  PluginSnapshotConfig,
  PluginDataTransformConfig,
  RegressionAPI,
  MLIntegrationAPI,
  DataTransformAPI,
  RadarAPI,
  SnapshotExportAPI as SnapshotAPI,
  SnapshotExportOptions as SnapshotExportOptions,
  SnapshotResolution,
  SnapshotFormat
} from "./plugins";

