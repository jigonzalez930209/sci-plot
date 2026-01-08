/**
 * Chart Type Definitions
 *
 * Interfaces for the Chart API and export options.
 */

import type {
  SeriesOptions,
  HeatmapOptions,
  SeriesUpdateData,
  ZoomOptions,
  CursorOptions,
  ChartEventMap,
  Bounds,
  AxisOptions,
} from "../../types";
import type { Series } from "../Series";
import type { FitType, FitOptions } from "../../analysis";
import type { Annotation } from "../annotations";
import type { ChartAnimationConfig } from "../animation";
import * as analysis from "../../analysis";

// ============================================
// Chart Interface
// ============================================

export interface Chart {
  addSeries(options: SeriesOptions | HeatmapOptions): void;
  addBar(options: Omit<SeriesOptions, "type">): void;
  addHeatmap(options: Omit<HeatmapOptions, "type">): void;
  removeSeries(id: string): void;
  updateSeries(id: string, data: SeriesUpdateData): void;
  getSeries(id: string): Series | undefined;
  getAllSeries(): Series[];
  appendData(
    id: string,
    x: number[] | Float32Array,
    y: number[] | Float32Array
  ): void;
  setAutoScroll(enabled: boolean): void;
  setMaxPoints(id: string, maxPoints: number): void;
  addFitLine(seriesId: string, type: FitType, options?: FitOptions): string;
  zoom(options: ZoomOptions & { animate?: boolean }): void;
  pan(deltaX: number, deltaY: number): void;
  resetZoom(): void;
  getViewBounds(): Bounds;
  enableCursor(options: CursorOptions): void;
  disableCursor(): void;
  resize(width?: number, height?: number): void;
  render(): void;
  on<K extends keyof ChartEventMap>(
    event: K,
    handler: (data: ChartEventMap[K]) => void
  ): void;
  off<K extends keyof ChartEventMap>(
    event: K,
    handler: (data: ChartEventMap[K]) => void
  ): void;
  destroy(): void;
  exportImage(type?: "png" | "jpeg"): string;
  autoScale(animate?: boolean): void;
  setTheme(theme: string | object): void;
  /** Access to data analysis utilities */
  readonly analysis: typeof analysis;

  // Annotation methods
  addAnnotation(annotation: Annotation): string;
  removeAnnotation(id: string): boolean;
  updateAnnotation(id: string, updates: Partial<Annotation>): void;
  getAnnotation(id: string): Annotation | undefined;
  getAnnotations(): Annotation[];
  clearAnnotations(): void;

  // Export methods
  exportCSV(options?: ExportOptions): string;
  exportJSON(options?: ExportOptions): string;

  /** Attach a plugin to extend chart functionality */
  use(plugin: ChartPlugin): void;

  /** Access to the tooltip system */
  readonly tooltip: import("../tooltip").TooltipManager;

  // ============================================
  // Animation API
  // ============================================

  /** Animate view bounds to specific target */
  animateTo(options: {
    xRange?: [number, number];
    yRange?: [number, number];
    duration?: number;
    easing?: string;
  }): void;
  /** Get current animation configuration */
  getAnimationConfig(): ChartAnimationConfig;
  /** Update animation configuration */
  setAnimationConfig(config: Partial<ChartAnimationConfig>): void;
  /** Check if any animations are currently running */
  isAnimating(): boolean;

  // ============================================
  // Axis Management API
  // ============================================

  /** Add a new Y axis dynamically */
  addYAxis(options: AxisOptions): string;
  /** Remove a Y axis by ID */
  removeYAxis(id: string): boolean;
  /** Update Y axis configuration */
  updateYAxis(id: string, options: Partial<AxisOptions>): void;
  /** Get Y axis configuration by ID */
  getYAxis(id: string): AxisOptions | undefined;
  /** Get all Y axes configurations */
  getAllYAxes(): AxisOptions[];
  /** Get the primary Y axis ID */
  getPrimaryYAxisId(): string;

  // ============================================
  // Selection API
  // ============================================

  /** Select data points programmatically */
  selectPoints(
    points: Array<{ seriesId: string; indices: number[] }>,
    mode?: import("../selection").SelectionMode
  ): void;
  /** Get all currently selected points */
  getSelectedPoints(): import("../selection").SelectedPoint[];
  /** Clear all selections */
  clearSelection(): void;
  /** Hit-test at a pixel coordinate */
  hitTest(
    pixelX: number,
    pixelY: number
  ): import("../selection").HitTestResult | null;
  /** Check if a specific point is selected */
  isPointSelected(seriesId: string, index: number): boolean;
  /** Get selection count */
  getSelectionCount(): number;
  /** Configure selection behavior */
  configureSelection(
    config: Partial<import("../selection").SelectionConfig>
  ): void;

  // ============================================
  // Interaction Mode
  // ============================================

  /** Set pan mode (true = pan, false = selection) */
  setPanMode(enabled: boolean): void;

  // ============================================
  // Responsive Design
  // ============================================

  /** Get current responsive state */
  getResponsiveState(): import("../responsive").ResponsiveState;
  /** Configure responsive behavior */
  configureResponsive(
    config: Partial<import("../responsive").ResponsiveConfig>
  ): void;
  /** Check if responsive mode is enabled */
  isResponsiveEnabled(): boolean;

  // ============================================
  // Serialization & Persistence
  // ============================================

  /** Export complete chart state */
  serialize(
    options?: import("../../serialization").SerializeOptions
  ): import("../../serialization").ChartState;
  /** Restore chart from saved state */
  deserialize(
    state: import("../../serialization").ChartState,
    options?: import("../../serialization").DeserializeOptions
  ): void;
  /** Convert current state to URL-safe hash */
  toUrlHash(compress?: boolean): string;
  /** Load state from URL hash */
  fromUrlHash(hash: string, compressed?: boolean): void;

  /** Use a plugin */
  use(plugin: ChartPlugin): void;
  /** Destroy the chart and cleanup resources */
  destroy(): void;
}

export interface ChartPlugin {
  name: string;
  init?: (chart: Chart) => void;
  onBeforeRender?: (chart: Chart) => void;
  onAfterRender?: (chart: Chart) => void;
  onSeriesAdded?: (series: Series) => void;
  destroy?: () => void;
}

/** Options for data export */
export interface ExportOptions {
  /** Series IDs to export (default: all) */
  seriesIds?: string[];
  /** Include headers in CSV (default: true) */
  includeHeaders?: boolean;
  /** Decimal precision (default: 6) */
  precision?: number;
  /** CSV delimiter (default: ',') */
  delimiter?: string;
}

// ============================================
// Layout Constants
// ============================================

export const MARGINS = { top: 20, right: 30, bottom: 55, left: 75 };
