/**
 * ChartRenderLoop - Manages the rendering cycle and frame scheduling
 * 
 * Handles render requests, frame scheduling, and coordinates WebGL + overlay rendering.
 */

import type { NativeWebGLRenderer } from "../../renderer/NativeWebGLRenderer";
import type { OverlayRenderer } from "../OverlayRenderer";
import type { Series } from "../Series";
import type { Scale } from "../../scales";
import type { Bounds, AxisOptions, CursorOptions, PlotArea, ChartEventMap } from "../../types";
import type { EventEmitter } from "../EventEmitter";
import type { SelectionManager } from "../selection";
import type { PluginManagerImpl } from "../../plugins";
import { prepareSeriesData, renderOverlay } from "./ChartRenderer";

export interface RenderLoopContext {
  webglCanvas: HTMLCanvasElement;
  overlayCanvas: HTMLCanvasElement;
  overlayCtx: CanvasRenderingContext2D;
  container: HTMLDivElement;
  series: Map<string, Series>;
  viewBounds: Bounds;
  xScale: Scale;
  yScales: Map<string, Scale>;
  yAxisOptionsMap: Map<string, AxisOptions>;
  xAxisOptions: AxisOptions;
  primaryYAxisId: string;
  renderer: NativeWebGLRenderer;
  overlay: OverlayRenderer;
  backgroundColor: [number, number, number, number];
  plotAreaBackground: [number, number, number, number];
  getCursorOptions: () => CursorOptions | null;
  getCursorPosition: () => { x: number; y: number } | null;
  selectionRect: { x: number; y: number; width: number; height: number } | null;
  events: EventEmitter<ChartEventMap>;
  selectionManager: SelectionManager;
  getHoveredSeriesId: () => string | null;
  pluginManager: PluginManagerImpl;
  getLayout: () => import("../layout").LayoutOptions;
  getLatex: () => any;

  // Methods
  updateSeriesBuffer: (s: Series) => void;
  getPlotArea: () => PlotArea;
  pixelToDataX: (px: number) => number;
  pixelToDataY: (py: number, yAxisId?: string) => number;
  get yScale(): Scale;
}

export class ChartRenderLoop {
  private animationFrameId: number | null = null;
  private needsFullRender = false;
  private needsOverlayRender = false;
  private frameCount = 0;
  private lastRenderTime = performance.now();
  private initStarted = false;

  constructor(private ctx: RenderLoopContext) { }

  /**
   * Mark that initialization has started
   */
  startInit(): void {
    this.initStarted = true;
  }

  /**
   * Check if init has started
   */
  isInitStarted(): boolean {
    return this.initStarted;
  }

  /**
   * Request a full render (WebGL + overlay)
   */
  requestRender(): void {
    this.needsFullRender = true;
    this.scheduleRenderFrame();
  }

  /**
   * Request overlay-only render
   */
  requestOverlayRender(): void {
    this.needsOverlayRender = true;
    this.scheduleRenderFrame();
  }

  /**
   * Schedule render on next animation frame
   */
  private scheduleRenderFrame(): void {
    if (this.animationFrameId !== null) return;

    this.animationFrameId = requestAnimationFrame(() => {
      this.animationFrameId = null;
      this.performRender();
    });
  }

  /**
   * Cancel any pending render
   */
  cancelPendingRender(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Perform the actual rendering
   */
  private performRender(): void {
    const full = this.needsFullRender;
    this.needsFullRender = false;
    this.needsOverlayRender = false;

    const start = performance.now();
    const plotArea = this.ctx.getPlotArea();
    if (this.ctx.webglCanvas.width === 0 || this.ctx.webglCanvas.height === 0) return;

    const renderCtx = {
      webglCanvas: this.ctx.webglCanvas,
      overlayCanvas: this.ctx.overlayCanvas,
      overlayCtx: this.ctx.overlayCtx,
      container: this.ctx.container,
      series: this.ctx.series,
      viewBounds: this.ctx.viewBounds,
      xScale: this.ctx.xScale,
      yScales: this.ctx.yScales,
      yAxisOptionsMap: this.ctx.yAxisOptionsMap,
      xAxisOptions: this.ctx.xAxisOptions,
      primaryYAxisId: this.ctx.primaryYAxisId,
      renderer: this.ctx.renderer,
      overlay: this.ctx.overlay,
      backgroundColor: this.ctx.backgroundColor,
      cursorOptions: this.ctx.getCursorOptions(),
      cursorPosition: this.ctx.getCursorPosition(),
      selectionRect: this.ctx.selectionRect,
      events: this.ctx.events,
      updateSeriesBuffer: this.ctx.updateSeriesBuffer,
      getPlotArea: () => plotArea,
      pixelToDataX: this.ctx.pixelToDataX,
      pixelToDataY: this.ctx.pixelToDataY,
      selectionManager: this.ctx.selectionManager,
      hoveredSeriesId: this.ctx.getHoveredSeriesId(),
      layout: this.ctx.getLayout(),
      latexAPI: this.ctx.getLatex(),
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

    if (!this.ctx.pluginManager.notifyBeforeRender(beforeEvent)) {
      return; // Plugin requested to skip render
    }

    if (full) {
      const seriesData = prepareSeriesData(renderCtx, plotArea);
      this.ctx.renderer.render(seriesData, {
        bounds: this.ctx.viewBounds,
        backgroundColor: this.ctx.backgroundColor,
        plotAreaBackground: this.ctx.plotAreaBackground,
        plotArea,
      });
      const webglEvent = {
        ...beforeEvent,
        renderTime: performance.now() - start,
      };
      this.ctx.pluginManager.notifyRenderWebGL(webglEvent);
      renderOverlay(renderCtx, plotArea, this.ctx.yScale);
    } else {
      // Overlay only render
      renderOverlay(renderCtx, plotArea, this.ctx.yScale);
    }

    const renderTime = performance.now() - start;
    const afterEvent = { ...beforeEvent, renderTime };

    this.ctx.pluginManager.notifyRenderOverlay(afterEvent);
    this.ctx.pluginManager.notifyAfterRender(afterEvent);

    this.ctx.events.emit("render", {
      fps: 1000 / renderTime,
      frameTime: renderTime,
    });
  }

  /**
   * Get render statistics
   */
  getStats() {
    return {
      frameCount: this.frameCount,
      lastRenderTime: this.lastRenderTime,
      hasPendingRender: this.animationFrameId !== null,
      needsFullRender: this.needsFullRender,
      needsOverlayRender: this.needsOverlayRender,
    };
  }

  /**
   * Reset frame counter
   */
  resetFrameCount(): void {
    this.frameCount = 0;
  }
}
