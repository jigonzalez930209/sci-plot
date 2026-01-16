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
import { EventEmitter } from "../EventEmitter";
import { Series } from "../Series";
import {
  NativeWebGLRenderer,
  parseColor,
  brightenColor,
} from "../../renderer/NativeWebGLRenderer";
import { LinearScale, LogScale, type Scale } from "../../scales";
import { getThemeByName, type ChartTheme } from "../../theme";
import { OverlayRenderer } from "../OverlayRenderer";
import { InteractionManager } from "../InteractionManager";
import { ChartControls } from "../ChartControls";
import { ChartLegend } from "../ChartLegend";
import type { Annotation } from "../annotations";
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
import { autoScaleAll, autoScaleYOnly, handleBoxZoom } from "./ChartScaling";
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
} from "./ChartSeries";
import {
  initializeChart as setupChart,
  getPlotArea as calculatePlotArea,
  getAxesLayout,
  resizeCanvases,
  pixelToDataX as pxToDataX,
} from "./ChartSetup";
import { PluginManagerImpl } from "../../plugins";
import {
  initControls as createControls,
  initLegend as createLegend,
} from "./ChartUI";
import {
  markInitComplete,
} from "../ChartInitQueue";
import { PluginLoading } from "../../plugins/loading";
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
  private plotAreaBackground: [number, number, number, number];
  private renderer: NativeWebGLRenderer;
  private overlay: OverlayRenderer;
  private interaction: InteractionManager;
  private xScale: Scale;
  private yScales: Map<string, Scale>;
  private get yScale(): Scale {
    return (this.yScales.get(this.primaryYAxisId) ||
      this.yScales.values().next().value) as Scale;
  }
  public theme: ChartTheme;
  public baseTheme: ChartTheme;
  private cursorOptions: CursorOptions | null = null;
  private cursorPosition: { x: number; y: number } | null = null;
  private showLegend: boolean;
  private legend: ChartLegend | null = null;
  private originalSeriesStyles = new Map<string, any>();
  private showControls: boolean;
  private toolbarOptions?: import("../../types").ToolbarOptions;
  private controls: ChartControls | null = null;
  private animationFrameId: number | null = null;
  private needsFullRender = false;
  private needsOverlayRender = false;
  private _isDestroyed = false;
  private autoScroll = false;
  private showStatistics = false;
  private initQueueId: string | null = null;
  private initStarted = false;
  private frameCount = 0;
  private lastRenderTime = performance.now();
  private commandQueue: Array<{ fn: () => void; name: string }> = [];
  private annotationQueue: any[] = [];
  private annotationIdCounter = 0;
  private tooltipConfigQueue: any[] = [];
  private fitLineQueue: any[] = [];

  /** Whether the chart has been destroyed */
  get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  private selectionRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;
  private pluginManager: PluginManagerImpl;
  private initialOptions: ChartOptions;

  setXScale(scale: Scale): void {
      this.xScale = scale;
      this.needsFullRender = true;
  }

  setYScale(yAxisId: string, scale: Scale): void {
      this.yScales.set(yAxisId, scale);
      this.needsFullRender = true;
  }

  get analysis(): any {
    const api = this.getPluginAPI<any>("scichart-analysis");
    if (api) return api;
    
    // Fallback object to prevent crashes while plugin is loading
    return {
      integrate: () => 0,
      detectPeaks: () => [],
      detectCycles: () => [],
      movingAverage: (data: any) => data,
      sma: () => [],
      ema: () => [],
    };
  }

  private animationEngine: AnimationEngine;
  private animationConfig: ChartAnimationConfig;
  get animations(): ChartAnimationConfig {
    return this.animationConfig;
  }
  private selectionManager: SelectionManager;
  private responsiveManager: ResponsiveManager;

  get tooltip(): any {
    const manager = this.getPluginAPI<any>("scichart-tools")?.getTooltipManager();
    if (manager) return manager;
    
    return {
      configure: (config: any) => {
        this.tooltipConfigQueue.push(config);
      },
      handleCursorMove: () => {},
      handleCursorLeave: () => {},
      setSuspended: () => {},
      updateChartTheme: () => {},
    };
  }

  get loading(): any {
    const api = this.getPluginAPI<any>("scichart-loading");
    if (api) return api;
    
    return {
      show: () => {},
      hide: () => {},
      setProgress: () => {},
      setMessage: () => {}
    };
  }

  get deltaTool(): any {
    return this.getPluginAPI<any>("scichart-tools")?.getDeltaTool() ?? null;
  }

  get peakTool(): any {
    return this.getPluginAPI<any>("scichart-tools")?.getPeakTool() ?? null;
  }

  get regression(): any {
    return this.getPluginAPI<any>("regression");
  }

  get radar(): any {
    return this.getPluginAPI<any>("scichart-radar");
  }

  get ml(): any {
    return this.getPluginAPI<any>("scichart-ml-integration");
  }

  get snapshot(): any {
    return this.getPluginAPI<any>("scichart-snapshot");
  }

  constructor(options: ChartOptions) {
    this.initialOptions = options;
    this.container = options.container;

    // 1. Initialize DOM and Theme so we can show UI (like loading) immediately
    const setup = setupChart(this.container, options);

    this.baseTheme = setup.theme;
    this.theme = setup.theme;
    this.backgroundColor = setup.backgroundColor;
    this.plotAreaBackground = setup.plotAreaColor;
    this.showLegend = setup.showLegend;
    this.showControls = setup.showControls;
    this.toolbarOptions = options.toolbar;
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

    // 2. Initialize Plugin Manager with full bridge (getters handle uninit state)
    this.pluginManager = new PluginManagerImpl({
      chart: this,
      container: this.container,
      theme: this.theme,
      getGL: () => this.renderer?.getGL(),
      get2DContext: () => this.overlayCtx,
      getPixelRatio: () => this.dpr,
      getCanvasSize: () => ({ 
        width: this.webglCanvas?.width || 0, 
        height: this.webglCanvas?.height || 0 
      }),
      getPlotArea: () => this.getPlotArea(),
      getViewBounds: () => this.viewBounds,
      getYAxisBounds: (yAxisId) => {
        const s = this.yScales?.get(yAxisId || this.primaryYAxisId);
        return { yMin: s?.domain[0] ?? 0, yMax: s?.domain[1] ?? 1 };
      },
      dataToPixelX: (x) => this.xScale?.transform(x) ?? 0,
      dataToPixelY: (y, yAxisId) => (this.yScales?.get(yAxisId || this.primaryYAxisId) || this.yScale)?.transform(y) ?? 0,
      pixelToDataX: (px) => this.pixelToDataX(px),
      pixelToDataY: (py, yAxisId) => this.pixelToDataY(py, yAxisId),
      findNearestPoint: (px, py, radius) => this.selectionManager?.hitTest(px, py, radius) ?? null,
      getPlugin: (name) => this.pluginManager?.get(name) as any
    });
    
    // 3. Show loading indicator INSTANTLY if enabled
    if (options.loading !== false) {
      const loadingConfig = typeof options.loading === 'object' ? options.loading : {
        message: 'Loading SciChart...',
        overlayOpacity: 0.1,
      };
      this.use(PluginLoading({
        ...loadingConfig,
        autoShow: true // Ensure it shows immediately
      }));
    }

    // 4. Load initial plugins
    if (options.plugins) {
      options.plugins.forEach(p => this.use(p));
    }

    const requestedRenderer = options.renderer ?? "webgl";
    if (requestedRenderer === "webgpu") {
      const isSupported =
        typeof (globalThis as any).navigator !== "undefined" &&
        typeof (globalThis as any).navigator.gpu !== "undefined";
      console.warn(
        `[SciChartEngine] 'renderer: "webgpu"' requested but WebGPU renderer is experimental and not yet implemented. ` +
        `Falling back to WebGL. WebGPU supported: ${isSupported}`
      );
    }

    this.renderer = new NativeWebGLRenderer(this.webglCanvas);
    this.renderer.setDPR(this.dpr);
    this.overlay = new OverlayRenderer(this.overlayCtx, this.theme);

    // Initialize selection manager EARLY so plugins can use it for hit-testing
    this.selectionManager = new SelectionManager({
      getSeries: () => this.series,
      getPlotArea: () => this.getPlotArea(),
      getXScale: () => this.xScale,
      getYScales: () => this.yScales,
      getPrimaryYAxisId: () => this.primaryYAxisId,
      events: this.events as any, // SelectionEventMap is a subset of ChartEventMap
      requestRender: () => this.requestRender(),
    });

    // Initialize animation system
    this.animationEngine = new AnimationEngine();
    this.animationConfig =
      typeof options.animations === "boolean"
        ? { ...DEFAULT_ANIMATION_CONFIG, enabled: options.animations }
        : mergeAnimationConfig(options.animations);

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
        onZoom: (b, axisId) => {
          this.zoom({ x: [b.xMin, b.xMax], y: [b.yMin, b.yMax], axisId });
          // Refresh tool overlays so points follow the zoom
          if (this.deltaTool) this.deltaTool.renderOverlay();
          if (this.peakTool) this.peakTool.renderOverlay();
        },
        onPan: (dx, dy, axisId) => {
          this.pan(dx, dy, axisId);
          // Refresh tool overlays so points follow the pan
          if (this.deltaTool) this.deltaTool.renderOverlay();
          if (this.peakTool) this.peakTool.renderOverlay();
        },
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
        onInteraction: (event) => {
          this.pluginManager.notify("onInteraction", event);
        },
      },
      () => this.getPlotArea(),
      (axisId) => this.getInteractedBounds(axisId),
      () => getAxesLayout(this.yAxisOptionsMap as any)
    );

    new ResizeObserver(() => !this.isDestroyed && this.resize()).observe(
      this.container
    );
    this.initControls();
    this.initLegend(options);

    // Plugins are now manual - user must call chart.use() or specify them in options
    // This allows for smaller bundles and more explicit control in each example.


    // NOTE: resize() and startRenderLoop() are now called by startInit()
    // This allows the queue system to control when rendering actually begins
  }

  /**
   * Start the chart initialization (called by queue system)
   * This performs the actual render startup that was deferred from constructor
   */
  startInit(): void {
    if (this.initStarted || this._isDestroyed) return;
    this.initStarted = true;

    this.resize();
    this.startRenderLoop();

    // Process any commands that were queued before initialization
    if (this.commandQueue.length > 0) {
      this.commandQueue.forEach((cmd) => {
        try {
          cmd.fn();
        } catch (err) {
          console.error(
            `[SciChartEngine] Error executing queued command '${cmd.name}':`,
            err
          );
        }
      });
      this.commandQueue = [];
    }

    setTimeout(() => !this.isDestroyed && this.resize(), 100);
  }

  /**
   * Mark this chart's initialization as complete in the queue
   */
  async completeInit(): Promise<void> {
    if (!this.initQueueId) return;

    // Wait for all startup animations (like autoScale) to finish
    // before allowing the next chart to start its heavy initialization.
    await this.animationEngine.waitForIdle();

    // Extra safety wait to allow browser to breathe
    await new Promise((r) => setTimeout(r, 60));

    if (this.initQueueId) {
      markInitComplete(this.initQueueId);
      this.initQueueId = null;
    }
  }

  private executeOrQueue(name: string, fn: () => void): void {
    if (this.initStarted) {
      fn();
    } else {
      this.commandQueue.push({ fn, name });
    }
  }

  /**
   * Set the initialization queue ID (internal use)
   */
  setInitQueueId(id: string): void {
    this.initQueueId = id;
  }

  private initControls(): void {
    this.controls = createControls({
      container: this.container,
      theme: this.theme,
      showControls: this.showControls,
      toolbar: this.toolbarOptions,
      showLegend: this.showLegend,
      series: this.series,
      autoScale: () => this.autoScale(),
      resetZoom: () => this.resetZoom(),
      requestRender: () => this.requestRender(),
      exportImage: () => this.exportImage(),
      setPanMode: (active: boolean) => this.interaction.setPanMode(active),
      setMode: (mode: 'pan' | 'boxZoom' | 'select' | 'delta' | 'peak') => this.setMode(mode),
      onLegendMove: (x: number, y: number) =>
        this.events.emit("legendMove", { x, y }),
      onToggleSmoothing: () => this.toggleSmoothing(),
      toggleLegend: () => this.toggleLegend(),
      onInteractionStart: () => {
        if (this.tooltip) this.tooltip.setSuspended(true);
      },
      onInteractionEnd: () => {
        if (this.tooltip) this.tooltip.setSuspended(false);
      },
      onHoverStart: () => {
        if (this.tooltip) this.tooltip.setSuspended(true);
      },
      onHoverEnd: () => {
        if (this.tooltip) this.tooltip.setSuspended(false);
      },
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
        setMode: (mode) => this.setMode(mode),
        onLegendMove: (x: number, y: number) =>
          this.events.emit("legendMove", { x, y }),
        onToggleSmoothing: () => this.toggleSmoothing(),
        toggleLegend: () => this.toggleLegend(),
        onInteractionStart: () => {
          if (this.tooltip) this.tooltip.setSuspended(true);
        },
        onInteractionEnd: () => {
          if (this.tooltip) this.tooltip.setSuspended(false);
        },
        onHoverStart: () => {
          if (this.tooltip) this.tooltip.setSuspended(true);
        },
        onHoverEnd: () => {
          if (this.tooltip) this.tooltip.setSuspended(false);
        },
        onSeriesHoverStart: (s) => {
          const original = s.getStyle();
          this.originalSeriesStyles.set(s.getId(), { ...original });
          
          const newColor = brightenColor(original.color || "#ff0055", this.theme.isDark);
          s.setStyle({ 
            color: newColor 
          });
          this.legend?.updateSeriesStyle(s);
          this.requestRender();
        },
        onSeriesHoverEnd: (s) => {
          const original = this.originalSeriesStyles.get(s.getId());
          if (original) {
            s.setStyle(original);
            this.originalSeriesStyles.delete(s.getId());
            this.legend?.updateSeriesStyle(s);
            this.requestRender();
          }
        },
        onToggleVisibility: (s) => {
          s.setVisible(!s.isVisible());
          this.legend?.updateSeriesStyle(s);
          this.requestRender();
        },
      },
      options
    );
  }

  setTheme(theme: string | ChartTheme): void {
    this.baseTheme = typeof theme === "string" ? getThemeByName(theme) : theme;
    this.theme = this.responsiveManager.scaleTheme(this.baseTheme);
    
    const bgColor = parseColor(this.theme.backgroundColor);
    this.backgroundColor = [bgColor[0], bgColor[1], bgColor[2], bgColor[3]];
    
    const paColor = parseColor(this.theme.plotAreaBackground);
    this.plotAreaBackground = [paColor[0], paColor[1], paColor[2], paColor[3]];

    this.container.style.backgroundColor = this.theme.backgroundColor;

    this.overlay.setTheme(this.theme);
    this.tooltip.updateChartTheme(this.theme);
    if (this.controls) this.controls.updateTheme(this.theme);
    if (this.legend) this.legend.updateTheme(this.theme);

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
      autoScaleYOnly: () => this.autoScaleYOnly(),
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
    if (series) this.pluginManager.notify("onSeriesAdd", series);
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
    this.recalculateTools();
  }
  appendData(
    id: string,
    x: number[] | Float32Array,
    y: number[] | Float32Array
  ): void {
    appendDataImpl(this.getSeriesContext(), id, x, y);
    this.recalculateTools();
    const series = this.series.get(id);
    if (series) {
      this.pluginManager.notify("onDataUpdate", {
        seriesId: id,
        data: series.getData(),
      });
    }
  }
  setAutoScroll(enabled: boolean): void {
    this.autoScroll = enabled;
  }
  setMaxPoints(id: string, maxPoints: number): void {
    setMaxPointsImpl(this.getSeriesContext(), id, maxPoints);
  }
  /**
   * Add a line of best fit to a series
   */
  addFitLine(seriesId: string, type: any, options?: any): string {
    const api = this.getPluginAPI<any>("scichart-analysis");
    if (api && api.addFitLine) {
      return api.addFitLine(seriesId, type, options);
    }
    
    // Queue the fit line request if plugin not yet loaded
    const id = `fit-${Math.random().toString(36).substr(2, 9)}`;
    this.fitLineQueue.push({ id, seriesId, type, options });
    return id;
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
            console.error("[SciChartEngine] Animation error:", err);
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
    this.executeOrQueue("autoScale", () => {
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
              console.error("[SciChartEngine] Animation error:", err);
            }
          });
        }
      } else {
        autoScaleAll(this.getNavContext());
      }
      this.requestRender();
    });
  }

  /**
   * Auto-scale only Y-axes (keeps X-axis stable)
   * Used during streaming to prevent X-axis shifting
   */
  autoScaleYOnly(): void {
    autoScaleYOnly(this.getNavContext());
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
          console.error("[SciChartEngine] Animation error:", err);
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
  addAnnotation(annotation: any): string {
    const id = annotation.id || `annotation-${++this.annotationIdCounter}`;
    const annWithId = { ...annotation, id };

    const api = this.getPluginAPI<any>("scichart-annotations");
    if (api) {
      api.add(annWithId);
      this.requestOverlayRender();
    } else {
      this.annotationQueue.push(annWithId);
    }
    return id;
  }

  removeAnnotation(id: string): boolean {
    const api = this.getPluginAPI<any>("scichart-annotations");
    if (api) {
      const result = api.remove(id);
      this.requestOverlayRender();
      return result;
    }
    return false;
  }

  updateAnnotation(id: string, updates: Partial<Annotation>): void {
    const api = this.getPluginAPI<any>("scichart-annotations");
    api?.update?.(id, updates);
    this.requestOverlayRender();
  }

  getAnnotation(id: string): Annotation | undefined {
    return this.getPluginAPI<any>("scichart-annotations")?.get(id);
  }

  getAnnotations(): Annotation[] {
    return this.getPluginAPI<any>("scichart-annotations")?.getAll() ?? [];
  }

  clearAnnotations(): void {
    this.getPluginAPI<any>("scichart-annotations")?.clear();
    this.requestOverlayRender();
  }

  /**
   * Get a plugin API by name
   */
  public getPlugin<T = any>(name: string): T | null {
    return this.getPluginAPI<T>(name);
  }

  private getPluginAPI<T>(name: string): T | null {
    const plugin = this.pluginManager.get(name) as any;
    return plugin ? plugin.api : null;
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
      console.warn(`[SciChartEngine] Y axis with id '${id}' already exists`);
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
      console.warn(`[SciChartEngine] Cannot remove primary Y axis '${id}'`);
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
      console.warn(`[SciChartEngine] Y axis '${id}' not found`);
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
   * Get current device pixel ratio
   */
  getDPR(): number {
    return this.dpr;
  }

  /**
   * Set device pixel ratio and re-render
   */
  setDPR(dpr: number): void {
    this.dpr = dpr;
    this.renderer.setDPR(dpr);
    this.overlay.setTheme(this.theme); // Force refresh dpr in overlay if needed
    // In our OverlayRenderer, dpr is often used in draw calls
    this.resize();
    this.requestRender();
  }

  /**
   * Update X axis configuration
   */
  updateXAxis(options: Partial<AxisOptions>): void {
    this.xAxisOptions = { ...this.xAxisOptions, ...options };

    // Update scale if scale type changed
    if (options.scale && options.scale !== this.xAxisOptions.scale) {
      const newScale =
        options.scale === "log" ? new LogScale() : new LinearScale();
      newScale.setDomain(this.xScale.domain[0], this.xScale.domain[1]);
      this.xScale = newScale;
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
   * @param mode - 'pan' for pan/drag, 'boxZoom' for rectangle zoom, 'select' for point selection, 'delta' for measurements
   */
  setMode(mode: 'pan' | 'boxZoom' | 'select' | 'delta' | 'peak'): void {
    const currentMode = this.getMode();
    if (currentMode === mode) return;

    // Always clear point selection when changing tool
    this.selectionManager.clearSelection();

    // Delegate to tools plugin if available
    const toolsApi = this.getPluginAPI<any>("scichart-tools");
    if (mode === 'delta' || mode === 'peak') {
      if (toolsApi) {
        toolsApi.setMode(mode);
      } else {
        // Plugin not yet loaded - retry after a short delay
        console.info(`[SciChartEngine] Tools plugin not ready, retrying setMode('${mode}')...`);
        setTimeout(() => {
          const api = this.getPluginAPI<any>("scichart-tools");
          if (api) {
            api.setMode(mode);
          } else {
            console.warn(`[SciChartEngine] Tools plugin still not available for mode '${mode}'`);
          }
        }, 100);
      }
    } else if (toolsApi) {
      // Disable tools when switching to non-tool modes
      toolsApi.setMode('none');
    }

    this.interaction.setMode(mode);
  }

  /**
   * Get the current interaction mode
   */
  getMode(): 'pan' | 'boxZoom' | 'select' | 'delta' | 'peak' {
    return this.interaction.getMode();
  }

  /**
   * Get the Delta Tool instance for advanced measurements
   */
  getDeltaTool(): any | null {
    return this.getPluginAPI<any>("scichart-tools")?.getDeltaTool() ?? null;
  }

  /**
   * Get the Peak Tool instance for peak integration
   */
  getPeakTool(): any | null {
    return this.getPluginAPI<any>("scichart-tools")?.getPeakTool() ?? null;
  }

  // ============================================
  // Responsive Design
  // ============================================

  /**
   * Handle responsive state changes
   */
  private handleResponsiveChange(state: ResponsiveState): void {
    // Update theme with scaled values from base theme to avoid cumulative scaling
    this.theme = this.responsiveManager.scaleTheme(this.baseTheme);
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
      annotations: includeAnnotations ? this.getAnnotations() : [],
      options: {
        showLegend: this.showLegend,
        showControls: this.showControls,
        showStatistics: this.showStatistics,
        autoScroll: this.autoScroll,
      },
      plugins: this.pluginManager.collectSerializationData(),
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
      this.clearAnnotations();
      state.annotations.forEach((a) => this.addAnnotation(a));
    }

    // Restore UI options
    if (state.options) {
      this.showLegend = state.options.showLegend ?? this.showLegend;
      this.showControls = state.options.showControls ?? this.showControls;
      this.showStatistics = state.options.showStatistics ?? this.showStatistics;
      this.autoScroll = state.options.autoScroll ?? this.autoScroll;
    }

    // Restore plugin data
    if (state.plugins) {
      this.pluginManager.restoreSerializationData(state.plugins);
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

  use(plugin: import("../../plugins").ChartPlugin): void {
    this.pluginManager.use(plugin);

    // If annotations plugin was just added, process queued annotations
    const annotationsApi = this.getPluginAPI<any>("scichart-annotations");
    if (annotationsApi && this.annotationQueue.length > 0) {
      this.annotationQueue.forEach((a) => annotationsApi.add(a));
      this.annotationQueue = [];
      this.requestOverlayRender();
    }

    // Process queued tooltip configurations
    const toolsApi = this.getPluginAPI<any>("scichart-tools");
    if (toolsApi && this.tooltipConfigQueue.length > 0) {
      const manager = toolsApi.getTooltipManager();
      if (manager) {
        this.tooltipConfigQueue.forEach((cfg) => manager.configure(cfg));
        this.tooltipConfigQueue = [];
      }
    }

    // Process queued fit lines
    const analysisApi = this.getPluginAPI<any>("scichart-analysis");
    if (analysisApi && this.fitLineQueue.length > 0) {
      this.fitLineQueue.forEach((q) => {
        analysisApi.addFitLine(q.seriesId, q.type, { ...q.options, id: q.id });
      });
      this.fitLineQueue = [];
    }
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
    this.executeOrQueue("requestRender", () => {
      this.needsFullRender = true;
      this.scheduleRenderFrame();
    });
  }

  requestOverlayRender(): void {
    this.executeOrQueue("requestOverlayRender", () => {
      this.needsOverlayRender = true;
      this.scheduleRenderFrame();
    });
  }

  render(full: boolean = true): void {
    if (!this.initStarted) {
      this.commandQueue.push({ fn: () => this.render(full), name: "render" });
      return;
    }
    if (this.isDestroyed) return;
    const start = performance.now();
    const plotArea = this.getPlotArea();
    if (this.webglCanvas.width === 0 || this.webglCanvas.height === 0) return;

    const renderCtx = {
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
      backgroundColor: this.backgroundColor,
      cursorOptions: this.cursorOptions,
      cursorPosition: this.cursorPosition,
      selectionRect: this.selectionRect,
      events: this.events,
      updateSeriesBuffer: (s: Series) =>
        updateSeriesBuffer(this.getSeriesContext(), s),
      getPlotArea: () => plotArea,
      pixelToDataX: (px: number) => this.pixelToDataX(px),
      pixelToDataY: (py: number) => this.pixelToDataY(py),
      selectionManager: this.selectionManager,
    };

    const now = performance.now();
    const beforeEvent = {
      timestamp: now,
      deltaTime: now - this.lastRenderTime,
      frameNumber: ++this.frameCount,
      first: !this.initStarted,
      forced: full
    };
    this.lastRenderTime = now;

    if (!this.pluginManager.notifyBeforeRender(beforeEvent)) {
      return; // Plugin requested to skip render
    }

    if (full) {
      const seriesData = prepareSeriesData(renderCtx, plotArea);
      this.renderer.render(seriesData, {
        bounds: this.viewBounds,
        backgroundColor: this.backgroundColor,
        plotAreaBackground: this.plotAreaBackground,
        plotArea,
      });
      renderOverlay(renderCtx, plotArea, this.yScale);
    } else {
      // Overlay only render
      renderOverlay(renderCtx, plotArea, this.yScale);
    }

    const renderTime = performance.now() - start;
    const afterEvent = { ...beforeEvent, renderTime };

    this.pluginManager.notifyAfterRender(afterEvent);
    this.pluginManager.notifyRenderOverlay(afterEvent);

    this.events.emit("render", {
      fps: 1000 / renderTime,
      frameTime: renderTime,
    });
  }

  private pixelToDataX(px: number): number {
    return pxToDataX(px, this.getPlotArea(), this.viewBounds);
  }

  private pixelToDataY(py: number, yAxisId?: string): number {
    const scale = this.yScales.get(yAxisId || this.primaryYAxisId) || this.yScale;
    return scale.invert(py);
  }

  private startRenderLoop(): void {
    // On-demand render loop - only runs when there's work to do
    // This dramatically improves performance with multiple charts
    this.scheduleRenderFrame();
  }

  private scheduleRenderFrame(): void {
    if (this.animationFrameId !== null || this.isDestroyed) return;

    this.animationFrameId = requestAnimationFrame(() => {
      this.animationFrameId = null;
      if (this.isDestroyed) return;

      if (this.needsFullRender) {
        this.render(true);
        this.needsFullRender = false;
        this.needsOverlayRender = false;
      } else if (this.needsOverlayRender) {
        this.render(false);
        this.needsOverlayRender = false;
      }

      // If there are animations running, keep the loop going
      if (this.animationEngine.isAnimating()) {
        this.scheduleRenderFrame();
      }
    });
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
    this._isDestroyed = true;
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
    this.pluginManager.destroy(); // Destroy all plugins!
    while (this.container.firstChild)
      this.container.removeChild(this.container.firstChild);
  }

  private toggleSmoothing(): void {
    this.series.forEach((s) => {
      const style = s.getStyle();
      s.setStyle({ smoothing: (style.smoothing || 0) === 0 ? 0.5 : 0 });
    });
    this.recalculateTools();
    this.requestRender();
  }

  private async recalculateTools(): Promise<void> {
    // Clear point selection as indices might be desynced or invalid after data change
    this.selectionManager.clearSelection();

    // Wait for ongoing animations (like auto-scale) to finish 
    // We wait two frames to give triggered animations a chance to start and register in the engine.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    if (this.animationEngine.isAnimating()) {
      await this.animationEngine.waitForIdle();
    }

    // Refresh measurement tools (Delta and Peak Integration)
    if (this.deltaTool) {
      this.deltaTool.recalculate();
    }
    if (this.peakTool) {
      this.peakTool.recalculate();
    }

    this.requestOverlayRender();
  }
}

import { waitForInitTurn } from "../ChartInitQueue";

/**
 * Create a new chart. Charts are automatically queued for sequential
 * initialization when multiple charts are created on the same page.
 */
export function createChart(options: ChartOptions): Chart {
  const chart = new ChartImpl(options);

  // Queue for sequential initialization
  waitForInitTurn().then((queueId) => {
    chart.setInitQueueId(queueId);

    // If chart was destroyed before queue turn, mark complete immediately
    if (chart.isDestroyed) {
      markInitComplete(queueId);
      return;
    }

    // Start the actual rendering
    chart.startInit();

    // Wait for initial render and autoScale to complete before allowing next chart
    // completeInit() is async and waits for animationEngine to be idle.
    chart.completeInit();
  });

  return chart;
}



