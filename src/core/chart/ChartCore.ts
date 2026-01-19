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
import type { Scale } from "../../scales";
import { 
  getThemeByName, 
  type ChartTheme,
  type ColorScheme,
  getColorScheme,
  getDefaultSchemeForTheme,
} from "../../theme";
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
import { ChartPluginBridge } from "./ChartPluginBridge";
import { ChartAxisManager } from "./ChartAxisManager";
import { ChartStateManager } from "./ChartStateManager";
import { ChartRenderLoop } from "./ChartRenderLoop";
// ============================================
// Chart Implementation
// ============================================

export class ChartImpl implements Chart {
  private container: HTMLDivElement;
  private webglCanvas: HTMLCanvasElement;
  private overlayCanvas: HTMLCanvasElement;
  private overlayCtx: CanvasRenderingContext2D;
  public series: Map<string, Series> = new Map();
  public events = new EventEmitter<ChartEventMap>();
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
  private colorScheme: ColorScheme;
  private cursorOptions: CursorOptions | null = null;
  private cursorPosition: { x: number; y: number } | null = null;
  private showLegend: boolean;
  private legend: ChartLegend | null = null;
  private originalSeriesStyles = new Map<string, any>();
  private hoveredSeriesId: string | null = null;
  private showControls: boolean;
  private toolbarOptions?: import("../../types").ToolbarOptions;
  private controls: ChartControls | null = null;
  private _isDestroyed = false;
  private autoScroll = false;
  private showStatistics = false;
  private initQueueId: string | null = null;
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
  
  // Composed modules
  private pluginBridge: ChartPluginBridge;
  private axisManager: ChartAxisManager;
  private stateManager: ChartStateManager;
  private renderLoop: ChartRenderLoop;

  setXScale(scale: Scale): void {
      this.xScale = scale;
      this.requestRender();
  }

  setYScale(yAxisId: string, scale: Scale): void {
      this.yScales.set(yAxisId, scale);
      this.requestRender();
  }

  // Delegate plugin access to bridge
  get analysis(): any { return this.pluginBridge.analysis; }
  get tooltip(): any { return this.pluginBridge.tooltip; }
  get loading(): any { return this.pluginBridge.loading; }
  get deltaTool(): any { return this.pluginBridge.deltaTool; }
  get peakTool(): any { return this.pluginBridge.peakTool; }
  get regression(): any { return this.pluginBridge.regression; }
  get radar(): any { return this.pluginBridge.radar; }
  get ml(): any { return this.pluginBridge.ml; }
  get snapshot(): any { return this.pluginBridge.snapshot; }
  get dataExport(): any { return this.pluginBridge.dataExport; }
  get roi(): any { return this.pluginBridge.roi; }
  get videoRecorder(): any { return this.pluginBridge.videoRecorder; }
  get offscreen(): any { return this.pluginBridge.offscreen; }
  get virtualization(): any { return this.pluginBridge.virtualization; }
  get themeEditor(): any { return this.pluginBridge.themeEditor; }
  get sync(): any { return this.pluginBridge.sync; }
  get brokenAxis(): any { return this.pluginBridge.brokenAxis; }
  get forecasting(): any { return this.pluginBridge.forecasting; }

  private animationEngine: AnimationEngine;
  private animationConfig: ChartAnimationConfig;
  get animations(): ChartAnimationConfig {
    return this.animationConfig;
  }
  private selectionManager: SelectionManager;
  private responsiveManager: ResponsiveManager;

  constructor(options: ChartOptions) {
    this.initialOptions = options;
    this.container = options.container;

    // 1. Initialize DOM and Theme so we can show UI (like loading) immediately
    const setup = setupChart(this.container, options);

    this.baseTheme = setup.theme;
    this.theme = setup.theme;
    this.colorScheme = options.colorScheme 
      ? getColorScheme(options.colorScheme)
      : getDefaultSchemeForTheme(setup.theme.isDark);
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
    
    // Initialize composed modules
    this.pluginBridge = new ChartPluginBridge(this.pluginManager);
    
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
    this.events.on("selectionChange", (event) => {
      this.pluginManager.notifySelectionChange(event.selected);
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
    
    // Initialize axis manager
    this.axisManager = new ChartAxisManager({
      xAxisOptions: this.xAxisOptions,
      xScale: this.xScale,
      yAxisOptionsMap: this.yAxisOptionsMap,
      yScales: this.yScales,
      primaryYAxisId: this.primaryYAxisId,
      series: this.series,
      requestRender: () => this.requestRender(),
    });
    
    // Initialize state manager
    this.stateManager = new ChartStateManager({
      viewBounds: this.viewBounds,
      xAxisOptions: this.xAxisOptions,
      xScale: this.xScale,
      yScales: this.yScales,
      primaryYAxisId: this.primaryYAxisId,
      series: this.series,
      pluginManager: this.pluginManager,
      showLegend: this.showLegend,
      showControls: this.showControls,
      showStatistics: this.showStatistics,
      autoScroll: this.autoScroll,
      getAnnotations: () => this.getAnnotations(),
      clearAnnotations: () => this.clearAnnotations(),
      addAnnotation: (a) => this.addAnnotation(a),
      updateYAxis: (id, opts) => this.axisManager.updateYAxis(id, opts),
      removeSeries: (id) => this.removeSeries(id),
      addSeries: (opts) => this.addSeries(opts),
      requestRender: () => this.requestRender(),
    });
    
    // Initialize render loop
    this.renderLoop = new ChartRenderLoop({
      webglCanvas: this.webglCanvas,
      overlayCanvas: this.overlayCanvas,
      overlayCtx: this.overlayCtx,
      container: this.container,
      series: this.series,
      viewBounds: this.viewBounds,
      xScale: this.xScale,
      yScales: this.yScales,
      yAxisOptionsMap: this.yAxisOptionsMap,
      xAxisOptions: this.xAxisOptions,
      primaryYAxisId: this.primaryYAxisId,
      renderer: this.renderer,
      overlay: this.overlay,
      backgroundColor: this.backgroundColor,
      plotAreaBackground: this.plotAreaBackground,
      cursorOptions: this.cursorOptions,
      cursorPosition: this.cursorPosition,
      selectionRect: this.selectionRect,
      events: this.events,
      selectionManager: this.selectionManager,
      getHoveredSeriesId: () => this.hoveredSeriesId,
      pluginManager: this.pluginManager,
      updateSeriesBuffer: (s) => updateSeriesBuffer(this.getSeriesContext(), s),
      getPlotArea: () => this.getPlotArea(),
      pixelToDataX: (px) => this.pixelToDataX(px),
      pixelToDataY: (py, yAxisId) => this.pixelToDataY(py, yAxisId),
      get yScale() { return this.yScales.get(this.primaryYAxisId) || this.yScales.values().next().value as Scale; },
    });

    this.interaction = new InteractionManager(
      this.container,
      {
        onZoom: (b, axisId) => {
          const previous = { ...this.viewBounds };
          this.zoom({ x: [b.xMin, b.xMax], y: [b.yMin, b.yMax], axisId });
          this.pluginManager.notifyViewChange({
            previous,
            current: { ...this.viewBounds },
            trigger: "zoom",
            animated: this.animationEngine.isAnimating(),
          });
          // Refresh tool overlays so points follow the zoom
          if (this.deltaTool) this.deltaTool.renderOverlay();
          if (this.peakTool) this.peakTool.renderOverlay();
        },
        onPan: (dx, dy, axisId) => {
          const previous = { ...this.viewBounds };
          this.pan(dx, dy, axisId);
          this.pluginManager.notifyViewChange({
            previous,
            current: { ...this.viewBounds },
            trigger: "pan",
            animated: false,
          });
          // Refresh tool overlays so points follow the pan
          if (this.deltaTool) this.deltaTool.renderOverlay();
          if (this.peakTool) this.peakTool.renderOverlay();
        },
        onBoxZoom: (rect) => this.handleBoxZoom(rect),
        onCursorMove: (x, y) => {
          this.cursorPosition = { x, y };
          const plotArea = this.getPlotArea();
          const isInPlotArea =
            x >= plotArea.x &&
            x <= plotArea.x + plotArea.width &&
            y >= plotArea.y &&
            y <= plotArea.y + plotArea.height;
          if (isInPlotArea) {
            const hit = this.selectionManager.hitTest(x, y);
            const nextHoveredId = hit?.seriesId ?? null;
            if (this.hoveredSeriesId !== nextHoveredId) {
              this.hoveredSeriesId = nextHoveredId;
              this.requestRender();
            }
          }
          if (this.tooltip) {
            this.tooltip.handleCursorMove(x, y);
          }
          this.requestOverlayRender();
        },
        onCursorLeave: () => {
          this.cursorPosition = null;
          if (this.hoveredSeriesId) {
            this.hoveredSeriesId = null;
            this.requestRender();
          }
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
          this.pluginManager.notifyInteraction(event);
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
    if (this.renderLoop.isInitStarted() || this._isDestroyed) return;
    this.renderLoop.startInit();

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
    if (this.renderLoop.isInitStarted()) {
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
          this.hoveredSeriesId = s.getId();
          
          // Use highlight color from color scheme, fallback to brightenColor
          const newColor = this.colorScheme?.highlightColor || brightenColor(original.color || "#ff0055", this.theme.isDark);
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
            this.hoveredSeriesId = null;
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
    
    // Parse colors
    this.backgroundColor = parseColor(this.theme.backgroundColor);
    this.plotAreaBackground = parseColor(this.theme.plotAreaBackground || this.theme.backgroundColor);

    this.container.style.backgroundColor = this.theme.backgroundColor;

    this.overlay.setTheme(this.theme);
    this.tooltip.updateChartTheme(this.theme);
    if (this.controls) this.controls.updateTheme(this.theme);
    if (this.legend) this.legend.updateTheme(this.theme);

    // Update color scheme to match new theme if not explicitly set
    if (!this.initialOptions.colorScheme) {
      this.colorScheme = getDefaultSchemeForTheme(this.theme.isDark);
    }

    this.requestRender();
  }

  /**
   * Set the color scheme for multi-series charts
   * @param scheme - Color scheme name ('vibrant', 'pastel', 'neon', 'earth', 'ocean') or ColorScheme object
   */
  setColorScheme(scheme: string | ColorScheme): void {
    this.colorScheme = typeof scheme === "string" ? getColorScheme(scheme) : scheme;
    this.requestRender();
  }

  /**
   * Get the current color scheme
   */
  getColorScheme(): ColorScheme {
    return this.colorScheme;
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
    if (series) {
      this.pluginManager.notifySeriesAdd({ series, changeType: "add" });
    }
  }
  addBar(options: Omit<SeriesOptions, "type">): void {
    this.addSeries({ ...options, type: "bar" } as SeriesOptions);
  }
  addHeatmap(options: HeatmapOptions): void {
    this.addSeries({ ...options, type: "heatmap" } as HeatmapOptions);
  }
  removeSeries(id: string): void {
    const series = this.series.get(id);
    removeSeriesImpl(this.getSeriesContext(), id);
    if (series) {
      this.pluginManager.notifySeriesRemove({ series, changeType: "remove" });
    }
  }
  updateSeries(id: string, data: SeriesUpdateData): void {
    updateSeriesImpl(this.getSeriesContext(), id, data);
    this.recalculateTools();
    const series = this.series.get(id);
    if (series) {
      this.pluginManager.notifyDataUpdate({
        seriesId: id,
        mode: data.append ? "append" : "replace",
        pointCount: data.x?.length ?? data.y?.length ?? 0,
        bounds: series.getBounds() ?? this.viewBounds,
      });
    }
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
      this.pluginManager.notifyDataUpdate({
        seriesId: id,
        mode: "append",
        pointCount: x.length,
        bounds: series.getBounds() ?? this.viewBounds,
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
    const previous = { ...this.viewBounds };
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
    this.pluginManager.notifyViewChange({
      previous,
      current: { ...this.viewBounds },
      trigger: "zoom",
      animated: this.animationConfig.enabled && options.animate !== false,
    });
    this.requestRender();
  }
  pan(deltaX: number, deltaY: number, axisId?: string): void {
    const previous = { ...this.viewBounds };
    applyPan(this.getNavContext(), deltaX, deltaY, axisId);
    this.pluginManager.notifyViewChange({
      previous,
      current: { ...this.viewBounds },
      trigger: "pan",
      animated: false,
    });
  }
  resetZoom(): void {
    this.autoScale();
  }
  getViewBounds(): Bounds {
    return { ...this.viewBounds };
  }
  autoScale(animate: boolean = true): void {
    this.executeOrQueue("autoScale", () => {
      const previous = { ...this.viewBounds };
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
      this.pluginManager.notifyViewChange({
        previous,
        current: { ...this.viewBounds },
        trigger: "autoScale",
        animated: this.animationConfig.enabled && animate,
      });
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

  public getPluginNames(): string[] {
    return this.pluginManager.getNames();
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
    return this.axisManager.addYAxis(options);
  }

  /**
   * Remove a Y axis by ID
   */
  removeYAxis(id: string): boolean {
    return this.axisManager.removeYAxis(id);
  }

  /**
   * Update Y axis configuration
   */
  updateYAxis(id: string, options: Partial<AxisOptions>): void {
    this.axisManager.updateYAxis(id, options);
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
    this.axisManager.updateXAxis(options);
  }

  /**
   * Get Y axis configuration by ID
   */
  getYAxis(id: string): AxisOptions | undefined {
    return this.axisManager.getYAxis(id);
  }

  /**
   * Get all Y axes configurations
   */
  getAllYAxes(): AxisOptions[] {
    return this.axisManager.getAllYAxes();
  }

  /**
   * Get the primary Y axis ID
   */
  getPrimaryYAxisId(): string {
    return this.axisManager.getPrimaryYAxisId();
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
    return this.stateManager.serialize(options);
  }

  /**
   * Restore chart from saved state
   */
  deserialize(state: ChartState, options: DeserializeOptions = {}): void {
    this.stateManager.deserialize(state, options);
  }

  /**
   * Convert current state to URL-safe hash
   */
  toUrlHash(compress: boolean = true): string {
    return this.stateManager.toUrlHash(compress);
  }

  /**
   * Load state from URL hash
   */
  fromUrlHash(hash: string, compressed: boolean = true): void {
    this.stateManager.fromUrlHash(hash, compressed);
  }

  async use(plugin: any): Promise<void> {
    await this.pluginManager.use(plugin);

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
    this.pluginManager.notifyResize({
      width: this.webglCanvas.width / this.dpr,
      height: this.webglCanvas.height / this.dpr,
    });
  }

  requestRender(): void {
    this.executeOrQueue("requestRender", () => {
      this.renderLoop.requestRender();
    });
  }

  requestOverlayRender(): void {
    this.executeOrQueue("requestOverlayRender", () => {
      this.renderLoop.requestOverlayRender();
    });
  }

  /**
   * Trigger an immediate full render (public API compatibility)
   */
  render(): void {
    this.requestRender();
  }

  private pixelToDataX(px: number): number {
    return pxToDataX(px, this.getPlotArea(), this.viewBounds);
  }

  private pixelToDataY(py: number, yAxisId?: string): number {
    const scale = this.yScales.get(yAxisId || this.primaryYAxisId) || this.yScale;
    return scale.invert(py);
  }

  private startRenderLoop(): void {
    // Initial render request to kick off the loop
    this.renderLoop.requestRender();
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
    this.renderLoop.cancelPendingRender();
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



