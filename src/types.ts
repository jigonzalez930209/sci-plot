/**
 * Core type definitions for SciChart Engine
 */

// ============================================
// Primitive Types
// ============================================

/** 2D point */
export interface Point {
  x: number;
  y: number;
}

/** Rectangular bounds */
export interface Bounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/** Range tuple [min, max] */
export type Range = [number, number];

// ============================================
// Scale Types
// ============================================

export type ScaleType = "linear" | "log";

export interface AxisOptions {
  /** Unique ID for the axis (defaults to 'default') */
  id?: string;
  /** Axis position */
  position?: "left" | "right" | "top" | "bottom";
  /** Scale type */
  scale?: ScaleType;
  /** Axis label (e.g., 'E / V') */
  label?: string;
  /** Unit for formatting (e.g., 'V', 'A') */
  unit?: string;
  /** Unit prefix: 'auto' for automatic (µ, n, m, etc.) */
  prefix?: "auto" | "µ" | "n" | "m" | "" | "k" | "M";
  /** Fixed minimum value */
  min?: number;
  /** Fixed maximum value */
  max?: number;
  /** Enable autoscaling */
  auto?: boolean;
  /** Force scientific notation (e.g., 1.2 × 10⁵) */
  scientific?: boolean;

  // ============================================
  // Advanced Multi-Axis Options
  // ============================================

  /** Axis color (line, ticks, labels) - defaults to theme */
  color?: string;
  /** Axis line width in pixels (default: 1) */
  lineWidth?: number;
  /** Show axis line (default: true) */
  showLine?: boolean;
  /** Show tick marks (default: true) */
  showTicks?: boolean;
  /** Show labels (default: true) */
  showLabels?: boolean;
  /** Show grid lines for this axis (default: true for primary, false for secondary) */
  showGrid?: boolean;
  /** Grid line color (default: from theme) */
  gridColor?: string;
  /** Grid line opacity (default: from theme) */
  gridOpacity?: number;
  /** Offset from edge in pixels (for stacking multiple axes) */
  offset?: number;
  /** Whether this axis is visible (default: true) */
  visible?: boolean;
  /** Associated series IDs (auto-scale will only consider these series) */
  seriesIds?: string[];
  /** Label font size in pixels */
  labelFontSize?: number;
  /** Label rotation in degrees (useful for crowded X-axis) */
  labelRotation?: number;
}

// ============================================
// Series Types
// ============================================

export type SeriesType =
  | "line"
  | "scatter"
  | "line+scatter"
  | "step"
  | "step+scatter"
  | "band"
  | "area"
  | "bar"
  | "heatmap"
  | "candlestick"
  | "polar"
  | "radar"
  | "boxplot"
  | "waterfall"
  | "gauge"
  | "sankey"
  | "ternary";

/** Step mode defines where the step occurs */
export type StepMode = "before" | "after" | "center";

/** Error bar direction */
export type ErrorBarDirection = "both" | "positive" | "negative";

export interface SeriesData {
  /** X values (potential, time, etc.) */
  x: Float32Array | Float64Array;
  /** Y values (current, charge, etc.) */
  y: Float32Array | Float64Array;
  /** Symmetric Y error (±error) */
  yError?: Float32Array | Float64Array;
  /** Asymmetric Y error - positive direction (upward) */
  yErrorPlus?: Float32Array | Float64Array;
  /** Asymmetric Y error - negative direction (downward) */
  yErrorMinus?: Float32Array | Float64Array;
  /** Symmetric X error (±error) - for horizontal error bars */
  xError?: Float32Array | Float64Array;
  /** Asymmetric X error - positive direction (rightward) */
  xErrorPlus?: Float32Array | Float64Array;
  /** Asymmetric X error - negative direction (leftward) */
  xErrorMinus?: Float32Array | Float64Array;
  /** Second Y-values for band/area charts (lower boundary or baseline) */
  y2?: Float32Array | Float64Array;
  /** Open values for OHLC/Candlestick */
  open?: Float32Array | Float64Array;
  /** High values for OHLC/Candlestick */
  high?: Float32Array | Float64Array;
  /** Low values for OHLC/Candlestick */
  low?: Float32Array | Float64Array;
  /** Close values for OHLC/Candlestick */
  close?: Float32Array | Float64Array;
  /** Radar data - axes labels and values */
  radar?: {
    axes: string[];
    values: number[];
  };
  /** Median values for BoxPlot */
  /** Gauge data */
  value?: number;
  min?: number;
  max?: number;
  /** Sankey data */
  nodes?: string[];
  links?: { source: string | number; target: string | number; value: number }[];
  median?: Float32Array | Float64Array;
  /** Outlier values for BoxPlot [ [x, y], [x, y], ... ] or flattened [x0, y0, x1, y1, ...] per box?
   * For simplicity, let's use an array of arrays of numbers or similar.
   */
  outliers?: number[][];
}

/** Error bar styling options */
export interface ErrorBarStyle {
  /** Show error bars (default: true if error data present) */
  visible?: boolean;
  /** Error bar color (default: same as series) */
  color?: string;
  /** Error bar line width (default: 1) */
  width?: number;
  /** Cap width in pixels (default: 6) */
  capWidth?: number;
  /** Show caps at the end of error bars (default: true) */
  showCaps?: boolean;
  /** Opacity (default: 0.7) */
  opacity?: number;
  /** Direction: show both, positive only, or negative only */
  direction?: ErrorBarDirection;
}

export interface SeriesStyle {
  /** Line/point color (hex or rgb) */
  color?: string;
  /** Line width in pixels */
  width?: number;
  /** Opacity (0-1) */
  opacity?: number;
  /** For scatter: point size */
  pointSize?: number;
  /** Smoothing factor (0 = none, 1 = full) */
  smoothing?: number;
  /** Step mode: where the step transition occurs (default: 'after') */
  stepMode?: StepMode;
  /** Error bar styling */
  errorBars?: ErrorBarStyle;
  /** Scatter symbol shape (default: 'circle') */
  symbol?: ScatterSymbol;
  /** Dash pattern [dash, gap] - empty for solid */
  lineDash?: number[];
  /** Radar-specific styling */
  radar?: {
    /** Fill area under radar line */
    fill?: boolean;
    /** Fill color (overrides color for fill) */
    fillColor?: string;
    /** Fill opacity */
    fillOpacity?: number;
    /** Show axis labels */
    showLabels?: boolean;
    /** Label font size */
    labelSize?: number;
    /** Number of levels for background grid */
    levels?: number;
    /** Start angle in degrees */
    startAngle?: number;
  };
}

/** Available scatter symbol shapes */
export type ScatterSymbol =
  | "circle" // Default filled circle
  | "square" // Filled square (diamond rotated 45°)
  | "diamond" // Diamond shape
  | "triangle" // Triangle pointing up
  | "triangleDown" // Triangle pointing down
  | "cross" // + shape
  | "x" // X shape
  | "star"; // 5-pointed star

export interface SeriesOptions {
  /** Unique identifier */
  id: string;
  /** Series type */
  type: SeriesType;
  /** ID of the Y Axis this series belongs to */
  yAxisId?: string;
  /** Data arrays */
  data: SeriesData;
  /** Visual style */
  style?: SeriesStyle;
  /** Visibility */
  visible?: boolean;
  /** Display name in legend */
  name?: string;
  /** Cycle number (for CV) */
  cycle?: number;
  /** Maximum number of points to keep (rolling window) */
  maxPoints?: number;
  /** Identifier for stacking series (same ID will be stacked together) */
  stackId?: string;
}

export interface SeriesUpdateData {
  /** New X values */
  x?: Float32Array | Float64Array;
  /** New Y values */
  y?: Float32Array | Float64Array;
  /** New Y2 values (for bands) */
  y2?: Float32Array | Float64Array;
  /** New Open values (for candlesticks) */
  open?: Float32Array | Float64Array;
  /** New High values (for candlesticks) */
  high?: Float32Array | Float64Array;
  /** New Low values (for candlesticks) */
  low?: Float32Array | Float64Array;
  /** New Close values (for candlesticks) */
  close?: Float32Array | Float64Array;
  /** New value for Gauge charts */
  value?: number;
  /** New nodes for Sankey diagrams */
  nodes?: any[];
  /** New links for Sankey diagrams */
  links?: any[];
  /** If true, append to existing data; if false, replace */
  append?: boolean;
}

// ============================================
// Bar Chart Types
// ============================================

export interface BarStyle
  extends Omit<SeriesStyle, "pointSize" | "symbol" | "smoothing" | "stepMode"> {
  /** Bar width in data units (auto if not specified) */
  barWidth?: number;
  /** Gap between bars as a fraction of bar width (default: 0.2) */
  barGap?: number;
  /** Bar alignment: 'center' (default) | 'edge' */
  barAlign?: "center" | "edge";
}

// ============================================
// Heatmap Types
// ============================================

/** Color scale names for heatmaps */
export type ColorScaleName =
  | "viridis"
  | "plasma"
  | "inferno"
  | "magma"
  | "jet"
  | "grayscale";

/** Interpolation method for heatmap rendering */
export type InterpolationType = "nearest" | "bilinear";

// ============================================
// Overlay Types
// ============================================

export interface PlotArea {
  /** X position of plot area relative to canvas */
  x: number;
  /** Y position of plot area relative to canvas */
  y: number;
  /** Width of plot area */
  width: number;
  /** Height of plot area */
  height: number;
  /** Inner margins from container edges */
  left?: number;
  /** Inner margins from container edges */
  right?: number;
  /** Inner margins from container edges */
  top?: number;
  /** Inner margins from container edges */
  bottom?: number;
}

export interface CursorState {
  enabled: boolean;
  x: number;
  y: number;
  crosshair: boolean;
  tooltipText?: string;
  /**
   * Value display mode for cursor coordinates
   * - 'disabled': No coordinate values shown
   * - 'floating': Values shown next to cursor (default)
   * - 'corner': Values shown in fixed corner position
   */
  valueDisplayMode?: 'disabled' | 'floating' | 'corner';
  /** Corner position when valueDisplayMode is 'corner' */
  cornerPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface AxisLabels {
  x?: string;
  y?: string;
}

export interface ColorScale {
  /** Color scale name */
  name: ColorScaleName;
  /** Minimum value for color mapping */
  min?: number;
  /** Maximum value for color mapping */
  max?: number;
  /** Use logarithmic scale (default: false) */
  logScale?: boolean;
}

export interface HeatmapData {
  /** X-axis values (column positions) */
  xValues: Float32Array | Float64Array | number[];
  /** Y-axis values (row positions) */
  yValues: Float32Array | Float64Array | number[];
  /** Z-values (intensity) as flattened 2D matrix [row-major order] */
  zValues: Float32Array | Float64Array | number[];
}

export interface HeatmapStyle {
  /** Color scale configuration */
  colorScale?: ColorScale;
  /** Interpolation method (default: 'bilinear') */
  interpolation?: InterpolationType;
  /** Show colorbar legend (default: true) */
  showColorbar?: boolean;
  /** Opacity (default: 1.0) */
  opacity?: number;
}

export interface HeatmapOptions extends Omit<SeriesOptions, "data" | "style"> {
  type: "heatmap";
  /** Heatmap data with X, Y, Z values */
  data: HeatmapData;
  /** Heatmap-specific styling */
  style?: HeatmapStyle;
}

// ============================================
// Polar Chart Types
// ============================================

/** Polar coordinate mode */
export type PolarMode = "radians" | "degrees";

/** Polar data structure */
export interface PolarData {
  /** Radial values (distance from origin) */
  r: Float32Array | Float64Array | number[];
  /** Angular values (theta) */
  theta: Float32Array | Float64Array | number[];
}

/** Polar chart styling options */
export interface PolarStyle extends Omit<SeriesStyle, "stepMode"> {
  /** Angular unit mode (default: 'degrees') */
  angleMode?: PolarMode;
  /** Fill the area to origin (default: false) */
  fill?: boolean;
  /** Fill color (default: same as line color with opacity) */
  fillColor?: string;
  /** Fill opacity (default: 0.3) */
  fillOpacity?: number;
  /** Close the path (connect last point to first) */
  closePath?: boolean;
  /** Show radial grid lines (default: true) */
  showRadialGrid?: boolean;
  /** Show angular grid lines (default: true) */
  showAngularGrid?: boolean;
  /** Number of angular divisions (default: 12 for 30° intervals) */
  angularDivisions?: number;
}

/** Polar series options */
export interface PolarOptions extends Omit<SeriesOptions, "data" | "style"> {
  type: "polar";
  /** Polar coordinate data */
  data: PolarData;
  /** Polar-specific styling */
  style?: PolarStyle;
}

// ============================================
// Radar Chart Types
// ============================================

/** Radar data structure */
export interface RadarData {
  /** Axis labels */
  axes: string[];
  /** Values for each axis (0-1 normalized) */
  values: number[];
}

/** Radar chart styling */
export interface RadarStyle {
  /** Line/point color (hex or rgb) */
  color?: string;
  /** Line width in pixels */
  width?: number;
  /** Opacity (0-1) */
  opacity?: number;
  /** Point size */
  pointSize?: number;
  /** Fill area under radar line */
  fill?: boolean;
  /** Fill color (overrides color for fill) */
  fillColor?: string;
  /** Fill opacity */
  fillOpacity?: number;
  /** Show axis labels */
  showLabels?: boolean;
  /** Label font size */
  labelSize?: number;
  /** Number of levels for background grid */
  levels?: number;
  /** Start angle in degrees */
  startAngle?: number;
  /** Show background grid */
  showGrid?: boolean;
  /** Grid color */
  gridColor?: string;
  /** Grid opacity */
  gridOpacity?: number;
}

/** Radar chart options */
export interface RadarOptions extends Omit<SeriesOptions, "data" | "style"> {
  type: "radar";
  /** Radar data with axes and values */
  data: RadarData;
  /** Radar-specific styling */
  style?: RadarStyle;
}

// ============================================
// Gauge Chart Types
// ============================================

export interface GaugeRange {
  from: number;
  to: number;
  color: string;
  label?: string;
}

export interface GaugeStyle {
  /** Needle color (default: #333) */
  needleColor?: string;
  /** Needle width (default: 3) */
  needleWidth?: number;
  /** Ranges of colors (e.g., green for good, red for bad) */
  ranges?: GaugeRange[];
  /** Radius of the gauge (0-1, default: 0.8) */
  radius?: number;
  /** Start angle in degrees (default: 135) */
  startAngle?: number;
  /** End angle in degrees (default: 405) */
  endAngle?: number;
  /** Show value text in center (default: true) */
  showValue?: boolean;
  /** Value text color */
  valueColor?: string;
  /** Value font size */
  valueSize?: number;
  /** Label for the gauge */
  label?: string;
}

export interface GaugeData {
  value: number;
  min: number;
  max: number;
}

export interface GaugeOptions extends Omit<SeriesOptions, "data" | "style"> {
  type: "gauge";
  data: GaugeData;
  style?: GaugeStyle;
}

// ============================================
// Sankey Chart Types
// ============================================

export interface SankeyLink {
  source: string | number;
  target: string | number;
  value: number;
  color?: string;
}

export interface SankeyNode {
  id: string | number;
  name?: string;
  color?: string;
}

export interface SankeyData {
  nodes: SankeyNode[] | string[];
  links: SankeyLink[];
}

export interface SankeyStyle {
  /** Node width in pixels (default: 20) */
  nodeWidth?: number;
  /** Padding between nodes (default: 10) */
  nodePadding?: number;
  /** Color palette for nodes */
  palette?: string[];
  /** Link opacity (default: 0.2) */
  linkOpacity?: number;
  /** Show labels (default: true) */
  showLabels?: boolean;
}

export interface SankeyOptions extends Omit<SeriesOptions, "data" | "style"> {
  type: "sankey";
  data: SankeyData;
  style?: SankeyStyle;
}

// ============================================
// Ternary Chart Types
// ============================================

/** Ternary data structure (3 components that sum to 1) */
export interface TernaryData {
  /** Component A values (0-1) - top vertex */
  a: number[];
  /** Component B values (0-1) - bottom-left vertex */
  b: number[];
  /** Component C values (0-1) - bottom-right vertex */
  c: number[];
}

/** Ternary chart styling options */
export interface TernaryStyle {
  /** Point size for scatter mode */
  pointSize?: number;
  /** Point color */
  color?: string;
  /** Fill opacity for regions */
  fillOpacity?: number;
  /** Grid line color */
  gridColor?: string;
  /** Grid line width */
  gridWidth?: number;
  /** Number of grid divisions (default: 10) */
  gridDivisions?: number;
}

/** Ternary chart options */
export interface TernaryOptions extends Omit<SeriesOptions, "data" | "style"> {
  type: "ternary";
  data: TernaryData;
  style?: TernaryStyle;
  /** Label for component A (top vertex) */
  labelA?: string;
  /** Label for component B (bottom-left vertex) */
  labelB?: string;
  /** Label for component C (bottom-right vertex) */
  labelC?: string;
  /** Show grid lines (default: true) */
  showGrid?: boolean;
  /** Show component labels (default: true) */
  showLabels?: boolean;
}

// ============================================
// Chart Options
// ============================================

export interface ChartOptions {
  /** Target container element */
  container: HTMLDivElement;
  /** Renderer backend selection (default: 'webgl') */
  renderer?: "webgl" | "webgpu";
  /** X-axis configuration */
  xAxis?: AxisOptions;
  /** Y-axis configuration (single or array) */
  yAxis?: AxisOptions | AxisOptions[];
  /** Background color (overrides theme) */
  background?: string;
  /** Device pixel ratio (default: window.devicePixelRatio) */
  devicePixelRatio?: number;
  /** Theme name or custom theme object */
  theme?: string | object;
  /** Color scheme for multi-series charts (default: auto-selected based on theme) */
  colorScheme?: string;
  /** Show legend (default: from theme) */
  showLegend?: boolean;
  /** Initial legend position {x, y} in pixels relative to chart area */
  legendPosition?: { x: number; y: number };
  /** Show in-chart controls (default: false) */
  showControls?: boolean;
  /** Detailed toolbar configuration */
  toolbar?: ToolbarOptions;
  /** Automatically follow new data (default: false) */
  autoScroll?: boolean;
  /** Show statistics panel (default: false) */
  showStatistics?: boolean;
  /** Tooltip configuration */
  tooltip?: import("./plugins/tools/tooltip/types").TooltipOptions;
  /** Animation configuration */
  animations?: import("./core/animation").ChartAnimationConfig | boolean;
  /** Responsive design configuration */
  responsive?: import("./core/responsive").ResponsiveConfig | boolean;
  /** Initial plugins to load */
  plugins?: any[];
  /** Loading indicator configuration */
  loading?: boolean | import("./plugins/loading").PluginLoadingConfig;

  // ============================================
  // Layout & Positioning Options
  // ============================================

  /** 
   * Detailed layout configuration for chart components
   * Controls positioning, spacing, and behavior of legend, crosshair, toolbar, etc.
   */
  layout?: import("./core/layout").LayoutOptions;

  // ============================================
  // Interaction Options
  // ============================================

  /** Read-only mode: disable all interactions (default: false) */
  readOnly?: boolean;
  /** Enable debug overlay showing FPS, memory, etc. (default: false) */
  debug?: boolean | import("./core/debug").DebugOverlayOptions;

  // ============================================
  // Internationalization Options
  // ============================================

  /** Locale configuration for number/date formatting (default: 'en-US') */
  locale?: string | import("./core/locale").LocaleConfig;

  // ============================================
  // Keyboard Shortcuts Options
  // ============================================

  /** Enable keyboard shortcuts (default: true if not readOnly) */
  keyBindings?: boolean | import("./core/keybindings").KeyBinding[];

  // ============================================
  // Clipboard Options
  // ============================================

  /** Enable clipboard operations (default: true) */
  clipboard?: boolean | import("./core/clipboard").ClipboardOptions;
}

export interface ToolbarButtons {
  pan?: boolean;
  boxZoom?: boolean;
  select?: boolean;
  delta?: boolean;
  peak?: boolean;
  reset?: boolean;
  autoscale?: boolean;
  type?: boolean;
  smooth?: boolean;
  export?: boolean;
  legend?: boolean;
}

export interface ToolbarOptions {
  /** Show the toolbar (default: true if showControls is true) */
  show?: boolean;
  /** Buttons to show in the toolbar */
  buttons?: ToolbarButtons;
  /** Whether the toolbar can be pinned (default: true) */
  pinnable?: boolean;
}

// ============================================
// Interaction Types
// ============================================

export interface ZoomOptions {
  /** X-axis range [min, max] */
  x?: Range;
  /** Y-axis range [min, max] */
  y?: Range;
  /** ID of the specific Y axis to zoom (if applicable) */
  axisId?: string;
  /** Animate the transition */
  animate?: boolean;
}

export interface CursorOptions {
  /** Enable cursor */
  enabled?: boolean;
  /** Snap to nearest data point */
  snap?: boolean;
  /** Show crosshair lines */
  crosshair?: boolean;
  /** Custom tooltip formatter */
  formatter?: (x: number, y: number, seriesId: string) => string;
  /**
   * Value display mode for X,Y coordinates (default: 'floating')
   * - 'disabled': No coordinate values shown (crosshair lines only)
   * - 'floating': Values shown in tooltip next to cursor
   * - 'corner': Values shown in fixed corner position
   */
  valueDisplayMode?: 'disabled' | 'floating' | 'corner';
  /**
   * Corner position when valueDisplayMode is 'corner' (default: 'top-left')
   */
  cornerPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /**
   * Crosshair line style (default: 'dashed')
   */
  lineStyle?: 'solid' | 'dashed' | 'dotted';
}

// ============================================
// Event Types
// ============================================

export interface ZoomEvent {
  x: Range;
  y: Range;
}

export interface PanEvent {
  deltaX: number;
  deltaY: number;
}

export interface HoverEvent {
  point: Point;
  seriesId: string;
  dataIndex: number;
}

export interface ClickEvent {
  point: Point;
  seriesId?: string;
  dataIndex?: number;
}

/** Data loading progress event */
export interface DataLoadingEvent {
  /** Current progress 0-100 */
  progress: number;
  /** Number of points loaded so far */
  pointsLoaded: number;
  /** Total points to load (if known) */
  totalPoints?: number;
  /** Current operation message */
  message?: string;
}

/** Delta measurement result */
export interface DeltaMeasurement {
  /** First point X data coordinate */
  x1: number;
  /** First point Y data coordinate */
  y1: number;
  /** Second point X data coordinate */
  x2: number;
  /** Second point Y data coordinate */
  y2: number;
  /** Delta X (x2 - x1) */
  deltaX: number;
  /** Delta Y (y2 - y1) */
  deltaY: number;
  /** Slope (deltaY / deltaX) */
  slope: number;
  /** Euclidean distance */
  distance: number;
  /** First point pixel X */
  pixelX1: number;
  /** First point pixel Y */
  pixelY1: number;
  /** Second point pixel X */
  pixelX2: number;
  /** Second point pixel Y */
  pixelY2: number;
}

/** Peak integration result */
export interface PeakMeasurement {
  /** Start point X data coordinate */
  x1: number;
  /** Start point Y data coordinate */
  y1: number;
  /** End point X data coordinate */
  x2: number;
  /** End point Y data coordinate */
  y2: number;
  /** Area above baseline */
  area: number;
  /** Total integral (raw area under curve) */
  integral: number;
  /** Baseline slope */
  baselineSlope: number;
  /** Baseline Y-intercept */
  baselineIntercept: number;
  /** Maximum peak height above baseline */
  peakHeight: number;
  /** Peak location X (data) */
  peakX: number;
  /** Peak location Y (data, above baseline) */
  peakY: number;
  /** Start point pixel X */
  pixelX1: number;
  /** Start point pixel Y */
  pixelY1: number;
  /** End point pixel X */
  pixelX2: number;
  /** End point pixel Y */
  pixelY2: number;
}

/** Chart event map for type-safe event handling */
export interface ChartEventMap {
  zoom: ZoomEvent;
  pan: PanEvent;
  hover: HoverEvent | null;
  click: ClickEvent;
  resize: { width: number; height: number };
  render: { fps: number; frameTime: number };
  legendMove: { x: number; y: number };
  autoScale: undefined;
  // Selection events
  pointSelect: import("./core/selection").PointSelectEvent;
  regionSelect: import("./core/selection").RegionSelectEvent;
  selectionChange: { selected: import("./core/selection").SelectedPoint[]; previous: import("./core/selection").SelectedPoint[] };
  selectionClear: undefined;
  // Loading events
  dataLoading: DataLoadingEvent;
  // Delta tool events
  deltaMeasure: DeltaMeasurement;
  peakMeasure: PeakMeasurement;
}

// ============================================
// Internal Types (not exported from index)
// ============================================

/** GPU uniform values */
export interface Uniforms {
  scale: [number, number];
  translate: [number, number];
  color: [number, number, number, number];
  resolution: [number, number];
}

/** Buffer configuration */
export interface BufferConfig {
  usage: "static" | "dynamic" | "stream";
  data: Float32Array;
}

/** Render state */
export interface RenderState {
  needsRender: boolean;
  lastFrameTime: number;
  frameCount: number;
}
