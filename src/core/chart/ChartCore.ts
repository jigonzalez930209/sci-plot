/**
 * ChartCore - Main Chart Implementation
 *
 * The core chart class that coordinates rendering, interactions,
 * and data management using the extracted utility modules.
 */

import type {
  ChartOptions,
  AxisOptions,
  SeriesOptions,
  HeatmapOptions,
  SeriesUpdateData,
  ZoomOptions,
  CursorOptions,
  ChartEventMap,
  Bounds,
} from "../../types";
import * as analysis from "../../analysis";
import type { FitType, FitOptions } from "../../analysis";
import { EventEmitter } from "../EventEmitter";
import { Series } from "../Series";
import {
  NativeWebGLRenderer,
  parseColor,
} from "../../renderer/NativeWebGLRenderer";
import { LinearScale, LogScale, type Scale } from "../../scales";
import { getThemeByName, type ChartTheme } from "../../theme";
import { OverlayRenderer } from "../OverlayRenderer";
import { InteractionManager } from "../InteractionManager";
import { ChartControls } from "../ChartControls";
import { ChartLegend } from "../ChartLegend";
import { ChartStatistics } from "../ChartStatistics";
import { AnnotationManager, type Annotation } from "../annotations";
import { TooltipManager } from "../tooltip";
import {
  SelectionManager,
  type SelectedPoint,
  type SelectionMode,
  type HitTestResult,
  type SelectionConfig,
} from "../selection";
import {
  ResponsiveManager,
  type ResponsiveConfig,
  type ResponsiveState,
} from "../responsive";
import {
  SERIALIZATION_VERSION,
  encodeFloat32Array,
  decodeFloat32Array,
  stateToUrlHash,
  urlHashToState,
  type ChartState,
  type SerializeOptions,
  type DeserializeOptions,
} from "../../serialization";

import type { Chart, ExportOptions } from "./types";
import { exportToCSV, exportToJSON, exportToImage } from "./ChartExporter";
import { applyZoom, applyPan, type NavigationContext } from "./ChartNavigation";
import { autoScaleAll, handleBoxZoom } from "./ChartScaling";
import {
  AnimationEngine,
  mergeAnimationConfig,
  DEFAULT_ANIMATION_CONFIG,
  type ChartAnimationConfig,
} from "../animation";
import {
  applyAnimatedZoom,
  applyAnimatedAutoScale,
  animateToBounds,
  type AnimatedNavigationContext,
} from "./ChartAnimatedNavigation";
import { prepareSeriesData, renderOverlay } from "./ChartRenderer";
import {
  addSeries as addSeriesImpl,
  removeSeries as removeSeriesImpl,
  updateSeries as updateSeriesImpl,
  updateSeriesBuffer,
  appendData as appendDataImpl,
  setMaxPoints as setMaxPointsImpl,
  addFitLine as addFitLineImpl,
} from "./ChartSeries";
import {
  initializeChart as setupChart,
  getPlotArea as calculatePlotArea,
  getAxesLayout,
  resizeCanvases,
  pixelToDataX as pxToDataX,
  pixelToDataY as pxToDataY,
} from "./ChartSetup";
import { PluginManagerImpl } from "./plugins/PluginManager";
import {
  initControls as createControls,
  initLegend as createLegend,
} from "./ChartUI";

// ============================================
// Chart Implementation
// ============================================

export class ChartImpl implements Chart {
  private container: HTMLDivElement;
  private webglCanvas: HTMLCanvasElement;
  private overlayCanvas: HTMLCanvasElement;
  private overlayCtx: CanvasRenderingContext2D;
  private series: Map<string, Series> = new Map();
  private events = new EventEmitter<ChartEventMap>();
  private viewBounds: Bounds = {
    xMin: -0.5,
    xMax: 0.5,
    yMin: -1e-5,
    yMax: 1e-5,
  };
  private xAxisOptions: AxisOptions;
  private yAxisOptionsMap: Map<string, AxisOptions>;
  private primaryYAxisId: string;
  private dpr: number;
  private backgroundColor: [number, number, number, number];
  private renderer: NativeWebGLRenderer;
  private overlay: OverlayRenderer;
  private interaction: InteractionManager;
  private xScale: Scale;
  private yScales: Map<string, Scale>;
  private get yScale(): Scale {
    return (this.yScales.get(this.primaryYAxisId) ||
      this.yScales.values().next().value) as Scale;
  }
  private theme: ChartTheme;
  private cursorOptions: CursorOptions | null = null;
  private cursorPosition: { x: number; y: number } | null = null;
  private showLegend: boolean;
  private legend: ChartLegend | null = null;
  private showControls: boolean;
  private controls: ChartControls | null = null;
  private animationFrameId: number | null = null;
  private needsFullRender = false;
  private needsOverlayRender = false;
  private isDestroyed = false;
  private autoScroll = false;
  private showStatistics = false;
  private stats: ChartStatistics | null = null;
  private selectionRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;
  private annotationManager: AnnotationManager = new AnnotationManager();
  public readonly tooltip: TooltipManager;
  private pluginManager: PluginManagerImpl;
  private initialOptions: ChartOptions;
  public readonly analysis = analysis;
  private animationEngine: AnimationEngine;
  private animationConfig: ChartAnimationConfig;
  private selectionManager: SelectionManager;
  private responsiveManager: ResponsiveManager;

  constructor(options: ChartOptions) {
    this.initialOptions = options;
    this.container = options.container;
    const setup = setupChart(this.container, options);

    const requestedRenderer = options.renderer ?? "webgl";
    if (requestedRenderer === "webgpu") {
      const isSupported =
        typeof (globalThis as any).navigator !== "undefined" &&
        typeof (globalThis as any).navigator.gpu !== "undefined";
      console.warn(
        `[SciChart] 'renderer: "webgpu"' requested but WebGPU renderer is experimental and not yet implemented. ` +
          `Falling back to WebGL. WebGPU supported: ${isSupported}`
      );
    }

    this.theme = setup.theme;
    this.backgroundColor = setup.backgroundColor;
    this.showLegend = setup.showLegend;
    this.showControls = setup.showControls;
    this.autoScroll = setup.autoScroll;
    this.showStatistics = setup.showStatistics;
    this.dpr = setup.dpr;
    this.xAxisOptions = setup.xAxisOptions;
    this.xScale = setup.xScale;
    this.yAxisOptionsMap = setup.yAxisOptionsMap;
    this.yScales = setup.yScales;
    this.primaryYAxisId = setup.primaryYAxisId;
    this.webglCanvas = setup.webglCanvas;
    this.overlayCanvas = setup.overlayCanvas;
    this.overlayCtx = setup.overlayCtx;

    this.renderer = new NativeWebGLRenderer(this.webglCanvas);
    this.renderer.setDPR(this.dpr);
    this.overlay = new OverlayRenderer(this.overlayCtx, this.theme);
    this.pluginManager = new PluginManagerImpl(this);

    // Initialize animation system
    this.animationEngine = new AnimationEngine();
    this.animationConfig =
      typeof options.animations === "boolean"
        ? { ...DEFAULT_ANIMATION_CONFIG, enabled: options.animations }
        : mergeAnimationConfig(options.animations);

    // Initialize selection manager
    this.selectionManager = new SelectionManager({
      getSeries: () => this.series,
      getPlotArea: () => this.getPlotArea(),
      getXScale: () => this.xScale,
      getYScales: () => this.yScales,
      getPrimaryYAxisId: () => this.primaryYAxisId,
      events: this.events as any, // SelectionEventMap is a subset of ChartEventMap
      requestRender: () => this.requestRender(),
    });

    // Initialize responsive manager
    const responsiveConfig =
      typeof options.responsive === "boolean"
        ? { enabled: options.responsive }
        : options.responsive;
    this.responsiveManager = new ResponsiveManager(
      {
        container: this.container,
        onStateChange: (state: ResponsiveState) =>
          this.handleResponsiveChange(state),
      },
      responsiveConfig
    );

    this.interaction = new InteractionManager(
      this.container,
      {
        onZoom: (b, axisId) =>
          this.zoom({ x: [b.xMin, b.xMax], y: [b.yMin, b.yMax], axisId }),
        onPan: (dx, dy, axisId) => this.pan(dx, dy, axisId),
        onBoxZoom: (rect) => this.handleBoxZoom(rect),
        onCursorMove: (x, y) => {
          this.cursorPosition = { x, y };
          if (this.tooltip) {
            this.tooltip.handleCursorMove(x, y);
          }
          this.requestOverlayRender();
        },
        onCursorLeave: () => {
          this.cursorPosition = null;
          if (this.tooltip) {
            this.tooltip.handleCursorLeave();
          }
          this.requestOverlayRender();
        },
        onBoxSelect: (rect, additive) => {
          if (rect) {
            const xScale = this.xScale;
            const yScales = this.yScales;
            const primaryYScale = yScales.get(this.primaryYAxisId);

            if (primaryYScale) {
              const dataBounds: Bounds = {
                xMin: xScale.invert(rect.x),
                xMax: xScale.invert(rect.x + rect.width),
                yMin: primaryYScale.invert(rect.y + rect.height),
                yMax: primaryYScale.invert(rect.y),
              };

              const hits = this.selectionManager.hitTestRegion(dataBounds);
              if (hits.length > 0) {
                const bySeriesMap = new Map<string, number[]>();
                hits.forEach((hit) => {
                  let arr = bySeriesMap.get(hit.seriesId);
                  if (!arr) {
                    arr = [];
                    bySeriesMap.set(hit.seriesId, arr);
                  }
                  arr.push(hit.index);
                });

                const pointsToSelect = Array.from(bySeriesMap.entries()).map(
                  ([seriesId, indices]) => ({
                    seriesId,
                    indices,
                  })
                );

                this.selectionManager.selectPoints(
                  pointsToSelect,
                  additive ? "add" : "single"
                );
              } else if (!additive) {
                this.selectionManager.clearSelection();
              }
            }
          }
          // Complete the box selection
          this.selectionManager.completeBoxSelection(additive);
        },
        onBoxSelectUpdate: (pixelX, pixelY) => {
          this.selectionManager.updateBoxSelection(pixelX, pixelY);
        },
        onBoxSelectStart: (pixelX, pixelY) => {
          this.selectionManager.startBoxSelection(pixelX, pixelY);
        },
        onDragStart: () => {
          // Suspend tooltip during any drag operation
          if (this.tooltip) {
            this.tooltip.setSuspended(true);
          }
        },
        onDragEnd: () => {
          // Resume tooltip after drag operation ends
          if (this.tooltip) {
            this.tooltip.setSuspended(false);
          }
        },
      },
      () => this.getPlotArea(),
      (axisId) => this.getInteractedBounds(axisId),
      () => getAxesLayout(this.yAxisOptionsMap as any)
    );

    this.tooltip = new TooltipManager({
      overlayCtx: this.overlayCtx,
      chartTheme: this.theme,
      getPlotArea: () => this.getPlotArea(),
      getSeries: () => this.getAllSeries(),
      pixelToDataX: (px) => this.pixelToDataX(px),
      pixelToDataY: (py) => this.pixelToDataY(py),
      getXScale: () => this.xScale,
      getYScales: () => this.yScales,
      getViewBounds: () => this.viewBounds,
      options: options.tooltip,
    });

    new ResizeObserver(() => !this.isDestroyed && this.resize()).observe(
      this.container
    );
    this.initControls();
    this.initLegend(options);
    if (this.showStatistics) {
      this.stats = new ChartStatistics(this.container, this.theme, this.series);
    }

    this.resize();
    this.startRenderLoop();
    setTimeout(() => !this.isDestroyed && this.resize(), 100);
    console.log("[SciChart] Initialized", {
      dpr: this.dpr,
      theme: this.theme.name,
    });
  }

  private initControls(): void {
    this.controls = createControls({
      container: this.container,
      theme: this.theme,
      showControls: this.showControls,
      showLegend: this.showLegend,
      series: this.series,
      autoScale: () => this.autoScale(),
      resetZoom: () => this.resetZoom(),
      requestRender: () => this.requestRender(),
      exportImage: () => this.exportImage(),
      setPanMode: (active) => this.interaction.setPanMode(active),
      setMode: (mode) => this.interaction.setMode(mode),
      onLegendMove: (x: number, y: number) =>
        this.events.emit("legendMove", { x, y }),
      toggleLegend: () => this.toggleLegend(),
    });
  }

  private toggleLegend(): void {
    this.showLegend = !this.showLegend;
    if (this.legend) {
      this.legend.setVisible(this.showLegend);
      this.legend.update(this.getAllSeries());
    } else if (this.showLegend) {
      // Re-initialize if it didn't exist
      this.initLegend(this.initialOptions);
    }
    this.requestRender();
  }

  private initLegend(options: ChartOptions): void {
    this.legend = createLegend(
      {
        container: this.container,
        theme: this.theme,
        showControls: this.showControls,
        showLegend: this.showLegend,
        series: this.series,
        autoScale: () => this.autoScale(),
        resetZoom: () => this.resetZoom(),
        requestRender: () => this.requestRender(),
        exportImage: () => this.exportImage(),
        setPanMode: (active) => this.interaction.setPanMode(active),
        setMode: (mode) => this.interaction.setMode(mode),
        onLegendMove: (x: number, y: number) =>
          this.events.emit("legendMove", { x, y }),
        toggleLegend: () => this.toggleLegend(),
      },
      options
    );
  }

  setTheme(theme: string | ChartTheme): void {
    this.theme = typeof theme === "string" ? getThemeByName(theme) : theme;
    const bgColor = parseColor(this.theme.backgroundColor);
    this.backgroundColor = [bgColor[0], bgColor[1], bgColor[2], bgColor[3]];
    this.container.style.backgroundColor = this.theme.backgroundColor;

    this.overlay.setTheme(this.theme);
    this.tooltip.updateChartTheme(this.theme);
    if (this.controls) this.controls.updateTheme(this.theme);
    if (this.legend) this.legend.updateTheme(this.theme);
    if (this.stats) this.stats.updateTheme(this.theme);

    this.requestRender();
  }

  getPlotArea() {
    return calculatePlotArea(this.container, this.yAxisOptionsMap as any);
  }
  private getInteractedBounds(axisId?: string): Bounds {
    if (axisId) {
      const scale = this.yScales.get(axisId);
      if (scale)
        return {
          ...this.viewBounds,
          yMin: scale.domain[0],
          yMax: scale.domain[1],
        };
    }
    return this.viewBounds;
  }

  exportImage(type: "png" | "jpeg" = "png"): string {
    return exportToImage(
      this.webglCanvas,
      this.overlayCanvas,
      this.backgroundColor,
      this.legend,
      this.showLegend,
      this.dpr,
      type
    );
  }

  // Series Management (delegates to ChartSeries)
  private getSeriesContext() {
    return {
      series: this.series,
      renderer: this.renderer,
      viewBounds: this.viewBounds,
      autoScale: () => this.autoScale(),
      requestRender: () => this.requestRender(),
      addAnnotation: (a: Annotation) => this.addAnnotation(a),
      xAxisOptions: this.xAxisOptions,
      yAxisOptionsMap: this.yAxisOptionsMap,
      autoScrollEnabled: this.autoScroll,
      addSeries: (o: SeriesOptions | HeatmapOptions) => this.addSeries(o),
      updateLegend: () => {
        if (this.legend) this.legend.update(this.getAllSeries());
      },
    };
  }

  addSeries(options: SeriesOptions | HeatmapOptions): void {
    addSeriesImpl(this.getSeriesContext() as any, options as any);
    const series = this.series.get((options as any).id);
    if (series) this.pluginManager.notify("onSeriesAdded", series);
  }
  addBar(options: Omit<SeriesOptions, "type">): void {
    this.addSeries({ ...options, type: "bar" } as SeriesOptions);
  }
  addHeatmap(options: HeatmapOptions): void {
    this.addSeries({ ...options, type: "heatmap" } as HeatmapOptions);
  }
  removeSeries(id: string): void {
    removeSeriesImpl(this.getSeriesContext(), id);
  }
  updateSeries(id: string, data: SeriesUpdateData): void {
    updateSeriesImpl(this.getSeriesContext(), id, data);
  }
  appendData(
    id: string,
    x: number[] | Float32Array,
    y: number[] | Float32Array
  ): void {
    appendDataImpl(this.getSeriesContext(), id, x, y);
  }
  setAutoScroll(enabled: boolean): void {
    this.autoScroll = enabled;
  }
  setMaxPoints(id: string, maxPoints: number): void {
    setMaxPointsImpl(this.getSeriesContext(), id, maxPoints);
  }
  addFitLine(
    seriesId: string,
    type: FitType,
    options: FitOptions = {}
  ): string {
    return addFitLineImpl(this.getSeriesContext(), seriesId, type, options);
  }
  getSeries(id: string): Series | undefined {
    return this.series.get(id);
  }
  getAllSeries(): Series[] {
    return Array.from(this.series.values());
  }

  // Navigation (delegates to ChartNavigation)
  private getNavContext(): NavigationContext {
    return {
      viewBounds: this.viewBounds,
      yScales: this.yScales,
      yAxisOptionsMap: this.yAxisOptionsMap,
      xAxisOptions: this.xAxisOptions,
      primaryYAxisId: this.primaryYAxisId,
      getPlotArea: () => this.getPlotArea(),
      events: this.events,
      requestRender: () => this.requestRender(),
      series: this.series as any,
    };
  }

  private getAnimatedNavContext(): AnimatedNavigationContext {
    return {
      ...this.getNavContext(),
      animationEngine: this.animationEngine,
      animationConfig: this.animationConfig,
    };
  }

  zoom(options: ZoomOptions & { animate?: boolean }): void {
    if (this.animationConfig.enabled && options.animate !== false) {
      const animation = applyAnimatedZoom(
        this.getAnimatedNavContext(),
        options
      );
      // Catch animation cancellation errors silently
      if (animation) {
        animation.promise.catch((err) => {
          // Ignore cancellation errors
          if (err.message !== "Animation cancelled") {
            console.error("[SciChart] Animation error:", err);
          }
        });
      }
    } else {
      applyZoom(this.getNavContext(), options);
    }
    this.requestRender();
  }
  pan(deltaX: number, deltaY: number, axisId?: string): void {
    applyPan(this.getNavContext(), deltaX, deltaY, axisId);
  }
  resetZoom(): void {
    this.autoScale();
  }
  getViewBounds(): Bounds {
    return { ...this.viewBounds };
  }
  autoScale(animate: boolean = true): void {
    if (this.animationConfig.enabled && animate) {
      const animation = applyAnimatedAutoScale(
        this.getAnimatedNavContext(),
        true
      );
      // Catch animation cancellation errors silently
      if (animation) {
        animation.promise.catch((err) => {
          // Ignore cancellation errors
          if (err.message !== "Animation cancelled") {
            console.error("[SciChart] Animation error:", err);
          }
        });
      }
    } else {
      autoScaleAll(this.getNavContext());
    }
    this.requestRender();
  }

  /**
   * Animate view bounds to specific target
   */
  animateTo(options: {
    xRange?: [number, number];
    yRange?: [number, number];
    duration?: number;
    easing?: string;
  }): void {
    const animation = animateToBounds(
      this.getAnimatedNavContext(),
      {
        xMin: options.xRange?.[0],
        xMax: options.xRange?.[1],
        yMin: options.yRange?.[0],
        yMax: options.yRange?.[1],
      },
      {
        duration: options.duration,
        easing: options.easing,
      }
    );
    // Catch animation cancellation errors silently
    if (animation) {
      animation.promise.catch((err) => {
        // Ignore cancellation errors
        if (err.message !== "Animation cancelled") {
          console.error("[SciChart] Animation error:", err);
        }
      });
    }
  }

  /**
   * Get animation configuration
   */
  getAnimationConfig(): ChartAnimationConfig {
    return { ...this.animationConfig };
  }

  /**
   * Set animation configuration
   */
  setAnimationConfig(config: Partial<ChartAnimationConfig>): void {
    this.animationConfig = mergeAnimationConfig({
      ...this.animationConfig,
      ...config,
    });
  }

  /**
   * Check if animations are currently running
   */
  isAnimating(): boolean {
    return this.animationEngine.isAnimating();
  }
  private handleBoxZoom(
    rect: { x: number; y: number; width: number; height: number } | null
  ): void {
    const isFinishing = rect === null;
    this.selectionRect = handleBoxZoom(
      this.getNavContext(),
      rect,
      this.selectionRect,
      (o: any) => this.zoom(o)
    );

    if (isFinishing) {
      this.requestRender();
    } else {
      this.requestOverlayRender();
    }
  }

  // Cursor
  enableCursor(options: CursorOptions): void {
    this.cursorOptions = { enabled: true, ...options };
  }
  disableCursor(): void {
    this.cursorOptions = null;
    this.cursorPosition = null;
    this.requestOverlayRender();
  }

  // Annotations
  addAnnotation(annotation: Annotation): string {
    const id = this.annotationManager.add(annotation);
    this.requestOverlayRender();
    return id;
  }
  removeAnnotation(id: string): boolean {
    const result = this.annotationManager.remove(id);
    this.requestOverlayRender();
    return result;
  }
  updateAnnotation(id: string, updates: Partial<Annotation>): void {
    this.annotationManager.update(id, updates);
    this.requestOverlayRender();
  }
  getAnnotation(id: string): Annotation | undefined {
    return this.annotationManager.get(id);
  }
  getAnnotations(): Annotation[] {
    return this.annotationManager.getAll();
  }
  clearAnnotations(): void {
    this.annotationManager.clear();
    this.requestOverlayRender();
  }

  // Export
  exportCSV(options?: ExportOptions): string {
    return exportToCSV(this.getAllSeries(), options);
  }
  exportJSON(options?: ExportOptions): string {
    return exportToJSON(this.getAllSeries(), this.viewBounds, options);
  }

  // ============================================
  // Axis Management
  // ============================================

  /**
   * Add a new Y axis dynamically
   */
  addYAxis(options: AxisOptions): string {
    const existingIds = Array.from(this.yAxisOptionsMap.keys());
    const id = options.id || `y${existingIds.length}`;

    if (this.yAxisOptionsMap.has(id)) {
      console.warn(`[SciChart] Y axis with id '${id}' already exists`);
      return id;
    }

    const position = options.position || "right";
    const fullOptions: AxisOptions = {
      scale: "linear",
      auto: true,
      position,
      ...options,
      id,
    };

    this.yAxisOptionsMap.set(id, fullOptions);

    // Create scale for this axis
    const scale =
      fullOptions.scale === "log" ? new LogScale() : new LinearScale();
    this.yScales.set(id, scale);

    this.requestRender();
    return id;
  }

  /**
   * Remove a Y axis by ID
   */
  removeYAxis(id: string): boolean {
    if (id === this.primaryYAxisId) {
      console.warn(`[SciChart] Cannot remove primary Y axis '${id}'`);
      return false;
    }

    if (!this.yAxisOptionsMap.has(id)) {
      return false;
    }

    this.yAxisOptionsMap.delete(id);
    this.yScales.delete(id);

    // Update any series using this axis
    this.series.forEach((s) => {
      if (s.getYAxisId() === id) {
        // Move to primary axis
        s.setYAxisId(this.primaryYAxisId);
      }
    });

    this.requestRender();
    return true;
  }

  /**
   * Update Y axis configuration
   */
  updateYAxis(id: string, options: Partial<AxisOptions>): void {
    const existing = this.yAxisOptionsMap.get(id);
    if (!existing) {
      console.warn(`[SciChart] Y axis '${id}' not found`);
      return;
    }

    const updated: AxisOptions = { ...existing, ...options, id };
    this.yAxisOptionsMap.set(id, updated);

    // Update scale if scale type changed
    if (options.scale && options.scale !== existing.scale) {
      const newScale =
        options.scale === "log" ? new LogScale() : new LinearScale();
      const oldScale = this.yScales.get(id);
      if (oldScale) {
        newScale.setDomain(oldScale.domain[0], oldScale.domain[1]);
      }
      this.yScales.set(id, newScale);
    }

    this.requestRender();
  }

  /**
   * Get Y axis configuration by ID
   */
  getYAxis(id: string): AxisOptions | undefined {
    return this.yAxisOptionsMap.get(id);
  }

  /**
   * Get all Y axes configurations
   */
  getAllYAxes(): AxisOptions[] {
    return Array.from(this.yAxisOptionsMap.values());
  }

  /**
   * Get the primary Y axis ID
   */
  getPrimaryYAxisId(): string {
    return this.primaryYAxisId;
  }

  // ============================================
  // Selection API
  // ============================================

  /**
   * Select data points programmatically
   */
  selectPoints(
    points: Array<{ seriesId: string; indices: number[] }>,
    mode?: SelectionMode
  ): void {
    this.selectionManager.selectPoints(points, mode);
  }

  /**
   * Get all currently selected points
   */
  getSelectedPoints(): SelectedPoint[] {
    return this.selectionManager.getSelectedPoints();
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    this.selectionManager.clearSelection();
  }

  /**
   * Hit-test at a pixel coordinate
   */
  hitTest(pixelX: number, pixelY: number): HitTestResult | null {
    return this.selectionManager.hitTest(pixelX, pixelY);
  }

  /**
   * Check if a specific point is selected
   */
  isPointSelected(seriesId: string, index: number): boolean {
    return this.selectionManager.isPointSelected(seriesId, index);
  }

  /**
   * Get selection count
   */
  getSelectionCount(): number {
    return this.selectionManager.getSelectionCount();
  }

  /**
   * Configure selection behavior
   */
  configureSelection(config: Partial<SelectionConfig>): void {
    this.selectionManager.configure(config);
  }

  /**
   * Set pan mode (true = pan, false = selection)
   * @deprecated Use setMode('pan') or setMode('select') instead
   */
  setPanMode(enabled: boolean): void {
    this.interaction.setPanMode(enabled);
  }

  /**
   * Set the interaction mode
   * @param mode - 'pan' for pan/drag, 'boxZoom' for rectangle zoom, 'select' for point selection
   */
  setMode(mode: 'pan' | 'boxZoom' | 'select'): void {
    this.interaction.setMode(mode);
  }

  /**
   * Get the current interaction mode
   */
  getMode(): 'pan' | 'boxZoom' | 'select' {
    return this.interaction.getMode();
  }

  // ============================================
  // Responsive Design
  // ============================================

  /**
   * Handle responsive state changes
   */
  private handleResponsiveChange(state: ResponsiveState): void {
    // Update theme with scaled values
    this.theme = this.responsiveManager.scaleTheme(this.theme);
    this.overlay.setTheme(this.theme);

    // Update selection hit radius
    this.selectionManager.configure({
      hitRadius: this.responsiveManager.getScaledHitRadius(20),
    });

    // Update legend visibility based on breakpoint
    if (this.legend) {
      const shouldShow = this.responsiveManager.shouldShowLegend();
      // Legend visibility is handled internally by checking showLegend
      this.showLegend = shouldShow;
    }

    // Request render with new responsive settings
    this.requestRender();

    // Emit resize event
    this.events.emit("resize", {
      width: state.width,
      height: state.height,
    });
  }

  /**
   * Get current responsive state
   */
  getResponsiveState(): ResponsiveState {
    return this.responsiveManager.getState();
  }

  /**
   * Configure responsive behavior
   */
  configureResponsive(config: Partial<ResponsiveConfig>): void {
    this.responsiveManager.configure(config);
  }

  /**
   * Check if responsive mode is enabled
   */
  isResponsiveEnabled(): boolean {
    return this.responsiveManager.isEnabled();
  }

  // ============================================
  // Serialization & Persistence
  // ============================================

  /**
   * Export complete chart state
   */
  serialize(options: SerializeOptions = {}): ChartState {
    const { includeData = true, includeAnnotations = true } = options;

    const state: ChartState = {
      version: SERIALIZATION_VERSION,
      timestamp: Date.now(),
      viewBounds: { ...this.viewBounds },
      xAxis: {
        id: "primary-x",
        position: this.xAxisOptions.position,
        label: this.xAxisOptions.label,
        scale: this.xScale.type,
        min: this.xScale.domain[0],
        max: this.xScale.domain[1],
        auto:
          (this.xScale as any).auto !== undefined
            ? (this.xScale as any).auto
            : true,
      },
      yAxes: Array.from(this.yScales.values()).map((s: any) => ({
        id: s.id || "y",
        position: s.position || "left",
        label: s.label || "",
        scale: s.type,
        min: s.domain[0],
        max: s.domain[1],
        auto: s.auto !== undefined ? s.auto : true,
      })),
      primaryYAxisId: this.primaryYAxisId,
      series: Array.from(this.series.values()).map((s) => ({
        id: s.getId(),
        name: s.getName(),
        type: s.getType(),
        yAxisId: s.getYAxisId(),
        style: s.getStyle(),
        visible: s.isVisible(),
        data: includeData
          ? {
              x: encodeFloat32Array(s.getData().x),
              y: encodeFloat32Array(s.getData().y),
            }
          : { x: "", y: "" },
      })),
      annotations: includeAnnotations ? this.annotationManager.getAll() : [],
      options: {
        showLegend: this.showLegend,
        showControls: this.showControls,
        showStatistics: this.showStatistics,
        autoScroll: this.autoScroll,
      },
    };

    return state;
  }

  /**
   * Restore chart from saved state
   */
  deserialize(state: ChartState, options: DeserializeOptions = {}): void {
    const { skipData = false, skipAnnotations = false } = options;

    // Restore view/axis settings
    this.viewBounds = { ...state.viewBounds };
    this.primaryYAxisId = state.primaryYAxisId;

    // Restore Y axes
    state.yAxes.forEach((ax) => {
      this.updateYAxis(ax.id, {
        label: ax.label,
        scale: ax.scale,
        min: ax.min,
        max: ax.max,
        auto: ax.auto,
      });
    });

    // Restore series
    if (!skipData) {
      // Clear existing first
      const seriesIds = Array.from(this.series.keys());
      seriesIds.forEach((id) => this.removeSeries(id));

      state.series.forEach((s) => {
        this.addSeries({
          id: s.id,
          name: s.name,
          type: s.type,
          yAxisId: s.yAxisId,
          data: {
            x: decodeFloat32Array(s.data.x),
            y: decodeFloat32Array(s.data.y),
          },
          style: s.style as any,
        });
      });
    }

    // Restore annotations
    if (!skipAnnotations && state.annotations) {
      this.annotationManager.clear();
      state.annotations.forEach((a) => this.annotationManager.add(a));
    }

    // Restore UI options
    if (state.options) {
      this.showLegend = state.options.showLegend ?? this.showLegend;
      this.showControls = state.options.showControls ?? this.showControls;
      this.showStatistics = state.options.showStatistics ?? this.showStatistics;
      this.autoScroll = state.options.autoScroll ?? this.autoScroll;
    }

    this.requestRender();
  }

  /**
   * Convert current state to URL-safe hash
   */
  toUrlHash(compress: boolean = true): string {
    return stateToUrlHash(this.serialize({ includeData: true }), compress);
  }

  /**
   * Load state from URL hash
   */
  fromUrlHash(hash: string, compressed: boolean = true): void {
    const state = urlHashToState(hash, compressed);
    if (state) {
      this.deserialize(state);
    }
  }

  use(plugin: any): void {
    this.pluginManager.use(plugin);
  }

  // Rendering
  resize(): void {
    if (
      !resizeCanvases(
        this.container,
        this.webglCanvas,
        this.overlayCanvas,
        this.overlayCtx,
        this.dpr
      )
    )
      return;
    this.renderer.resize();
    this.requestRender();
  }

  requestRender(): void {
    this.needsFullRender = true;
  }

  requestOverlayRender(): void {
    this.needsOverlayRender = true;
  }

  render(full: boolean = true): void {
    if (this.isDestroyed) return;
    const start = performance.now();
    const plotArea = this.getPlotArea();
    if (this.webglCanvas.width === 0 || this.webglCanvas.height === 0) return;

    const ctx = {
      webglCanvas: this.webglCanvas,
      overlayCanvas: this.overlayCanvas,
      overlayCtx: this.overlayCtx,
      container: this.container,
      series: this.series,
      viewBounds: this.viewBounds,
      xScale: this.xScale,
      yScales: this.yScales,
      yAxisOptionsMap: this.yAxisOptionsMap as any,
      xAxisOptions: this.xAxisOptions as any,
      primaryYAxisId: this.primaryYAxisId,
      renderer: this.renderer,
      overlay: this.overlay,
      annotationManager: this.annotationManager,
      backgroundColor: this.backgroundColor,
      cursorOptions: this.cursorOptions,
      cursorPosition: this.cursorPosition,
      selectionRect: this.selectionRect,
      stats: this.stats,
      showStatistics: this.showStatistics,
      events: this.events,
      updateSeriesBuffer: (s: Series) =>
        updateSeriesBuffer(this.getSeriesContext(), s),
      getPlotArea: () => plotArea,
      pixelToDataX: (px: number) => this.pixelToDataX(px),
      pixelToDataY: (py: number) => this.pixelToDataY(py),
      tooltip: this.tooltip,
      selectionManager: this.selectionManager,
    };

    if (full) {
      const seriesData = prepareSeriesData(ctx, plotArea);
      this.pluginManager.notify("onBeforeRender", this);
      this.renderer.render(seriesData, {
        bounds: this.viewBounds,
        backgroundColor: this.backgroundColor,
        plotArea,
      });
      renderOverlay(ctx, plotArea, this.yScale);
      this.pluginManager.notify("onAfterRender", this);
    } else {
      // Overlay only render
      renderOverlay(ctx, plotArea, this.yScale);
    }

    this.events.emit("render", {
      fps: 1000 / (performance.now() - start),
      frameTime: performance.now() - start,
    });
  }

  private pixelToDataX(px: number): number {
    return pxToDataX(px, this.getPlotArea(), this.viewBounds);
  }

  private pixelToDataY(py: number): number {
    return pxToDataY(py, this.getPlotArea(), this.viewBounds);
  }

  private startRenderLoop(): void {
    const loop = () => {
      if (this.isDestroyed) return;
      if (this.needsFullRender) {
        this.render(true);
        this.needsFullRender = false;
        this.needsOverlayRender = false;
      } else if (this.needsOverlayRender) {
        this.render(false);
        this.needsOverlayRender = false;
      }
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  on<K extends keyof ChartEventMap>(
    e: K,
    h: (d: ChartEventMap[K]) => void
  ): void {
    this.events.on(e, h);
  }
  off<K extends keyof ChartEventMap>(
    e: K,
    h: (d: ChartEventMap[K]) => void
  ): void {
    this.events.off(e, h);
  }

  destroy(): void {
    this.isDestroyed = true;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.animationEngine.destroy();
    this.selectionManager.destroy();
    this.responsiveManager.destroy();
    this.interaction.destroy();
    this.series.forEach((s) => {
      this.renderer.deleteBuffer(s.getId());
      s.destroy();
    });
    this.series.clear();
    this.renderer.destroy();
    if (this.controls) this.controls.destroy();
    if (this.legend) this.legend.destroy();
    if (this.tooltip) this.tooltip.destroy();
    while (this.container.firstChild)
      this.container.removeChild(this.container.firstChild);
    console.log("[SciChart] Destroyed");
  }
}

export function createChart(options: ChartOptions): Chart {
  return new ChartImpl(options);
}
