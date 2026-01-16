/**
 * @fileoverview ROI selection and masking plugin
 * @module plugins/roi
 */

import type {
  PluginRoiConfig,
  RoiAPI,
  RoiTool,
  RoiRegion,
  RoiPoint,
  RoiMaskResult,
  RoiSelectedEvent,
} from "./types";
import type { ChartPlugin, PluginContext, PluginManifest, InteractionEvent } from "../types";
import type { Series } from "../../core/Series";
import type { SeriesData } from "../../types";

const manifest: PluginManifest = {
  name: "scichart-roi",
  version: "1.0.0",
  description: "ROI selection, masking and analysis helpers",
  provides: ["interaction", "roi"],
  tags: ["interaction", "selection", "analysis"],
};

const DEFAULT_CONFIG: Required<PluginRoiConfig> = {
  enabled: true,
  tools: ["rectangle", "polygon", "lasso", "circle"],
  defaultTool: "rectangle",
  mask: false,
  persistent: true,
  additive: true,
  stroke: "#00f2ff",
  fill: "rgba(0, 242, 255, 0.15)",
  lineWidth: 1.5,
  debug: false,
};

export function PluginROI(
  userConfig: Partial<PluginRoiConfig> = {}
): ChartPlugin<PluginRoiConfig> {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  let ctx: PluginContext | null = null;
  let enabled = config.enabled;
  let activeTool: RoiTool = config.defaultTool;

  let regions: RoiRegion[] = [];
  let activeRegion: RoiRegion | null = null;
  let isDrawing = false;
  let startPixel: { x: number; y: number } | null = null;

  const originalSeriesData = new Map<string, SeriesData>();

  function log(message: string, ...args: unknown[]) {
    if (config.debug && ctx) ctx.log.info(`[ROI] ${message}`, ...args);
  }

  function createRegion(tool: RoiTool): RoiRegion {
    return {
      id: `roi-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tool,
      points: [],
      createdAt: Date.now(),
    };
  }

  function pixelToData(point: RoiPoint): RoiPoint {
    if (!ctx) return point;
    return {
      x: ctx.coords.pixelToDataX(point.x),
      y: ctx.coords.pixelToDataY(point.y),
    };
  }

  function dataToPixel(point: RoiPoint): RoiPoint {
    if (!ctx) return point;
    return {
      x: ctx.coords.dataToPixelX(point.x),
      y: ctx.coords.dataToPixelY(point.y),
    };
  }

  function getSeriesPoints(series: Series): RoiPoint[] {
    const data = series.getData();
    const points: RoiPoint[] = [];
    for (let i = 0; i < data.x.length; i++) {
      points.push({ x: data.x[i], y: data.y[i] });
    }
    return points;
  }

  function pointInRect(p: RoiPoint, rect: RoiRegion): boolean {
    const p1 = rect.points[0];
    const p2 = rect.points[1] ?? p1;
    const xMin = Math.min(p1.x, p2.x);
    const xMax = Math.max(p1.x, p2.x);
    const yMin = Math.min(p1.y, p2.y);
    const yMax = Math.max(p1.y, p2.y);
    return p.x >= xMin && p.x <= xMax && p.y >= yMin && p.y <= yMax;
  }

  function pointInCircle(p: RoiPoint, circle: RoiRegion): boolean {
    const c = circle.points[0];
    const edge = circle.points[1] ?? c;
    const radius = Math.hypot(edge.x - c.x, edge.y - c.y);
    return Math.hypot(p.x - c.x, p.y - c.y) <= radius;
  }

  function pointInPolygon(p: RoiPoint, polygon: RoiRegion): boolean {
    let inside = false;
    const pts = polygon.points;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].x;
      const yi = pts[i].y;
      const xj = pts[j].x;
      const yj = pts[j].y;
      const intersect = yi > p.y !== yj > p.y &&
        p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-12) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function getMask(region: RoiRegion): RoiMaskResult[] {
    if (!ctx) return [];
    const masks: RoiMaskResult[] = [];

    ctx.data.getAllSeries().forEach((series) => {
      const points = getSeriesPoints(series);
      const indices: number[] = [];
      points.forEach((pt, idx) => {
        let inside = false;
        if (region.tool === "rectangle") inside = pointInRect(pt, region);
        else if (region.tool === "circle") inside = pointInCircle(pt, region);
        else inside = pointInPolygon(pt, region);
        if (inside) indices.push(idx);
      });
      masks.push({ seriesId: series.getId(), indices });
    });

    return masks;
  }

  function cacheSeriesData(seriesId: string, data: SeriesData) {
    if (!originalSeriesData.has(seriesId)) {
      originalSeriesData.set(seriesId, data);
    }
  }

  function applyMask(masks: RoiMaskResult[]): void {
    const context = ctx;
    if (!context) return;
    masks.forEach((mask) => {
      const series = context.chart.getSeries?.(mask.seriesId) as Series | undefined;
      if (!series) return;
      const data = series.getData();
      if (!data?.x || !data?.y) return;
      cacheSeriesData(mask.seriesId, data);

      const newX = new Float32Array(mask.indices.length);
      const newY = new Float32Array(mask.indices.length);
      mask.indices.forEach((idx, i) => {
        newX[i] = data.x[idx];
        newY[i] = data.y[idx];
      });
      (context.chart as any).updateSeries?.(mask.seriesId, { x: newX, y: newY });
    });
  }

  function restoreMask(seriesId: string): void {
    const context = ctx;
    if (!context) return;
    const original = originalSeriesData.get(seriesId);
    if (!original) return;
    (context.chart as any).updateSeries?.(seriesId, { x: original.x, y: original.y });
  }

  function drawRegion(region: RoiRegion, ctx2d: CanvasRenderingContext2D): void {
    const points = region.points.map(dataToPixel);
    if (points.length === 0) return;

    ctx2d.save();
    ctx2d.strokeStyle = config.stroke;
    ctx2d.fillStyle = config.fill;
    ctx2d.lineWidth = config.lineWidth;

    if (region.tool === "rectangle") {
      const p1 = points[0];
      const p2 = points[1] ?? p1;
      const x = Math.min(p1.x, p2.x);
      const y = Math.min(p1.y, p2.y);
      const w = Math.abs(p2.x - p1.x);
      const h = Math.abs(p2.y - p1.y);
      ctx2d.beginPath();
      ctx2d.rect(x, y, w, h);
      ctx2d.fill();
      ctx2d.stroke();
    } else if (region.tool === "circle") {
      const c = points[0];
      const edge = points[1] ?? c;
      const r = Math.hypot(edge.x - c.x, edge.y - c.y);
      ctx2d.beginPath();
      ctx2d.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.stroke();
    } else {
      ctx2d.beginPath();
      ctx2d.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx2d.lineTo(points[i].x, points[i].y);
      }
      ctx2d.closePath();
      ctx2d.fill();
      ctx2d.stroke();
    }

    ctx2d.restore();
  }

  function finishRegion(): void {
    if (!activeRegion || !ctx) return;
    if (activeRegion.points.length < 2) {
      activeRegion = null;
      return;
    }

    if (config.persistent) {
      regions.push(activeRegion);
    }

    const masks = getMask(activeRegion);
    if (config.mask) applyMask(masks);

    const event: RoiSelectedEvent = {
      region: activeRegion,
      seriesIds: masks.map((m) => m.seriesId),
      masks,
    };

    ctx.events.emit("roi:selected", event);
    ctx.events.emit("roi:created", {
      region: activeRegion,
      seriesIds: event.seriesIds,
    });

    activeRegion = null;
    ctx.requestRender();
  }

  function handlePointerDown(event: InteractionEvent): void {
    if (!enabled || !event.inPlotArea) return;
    isDrawing = true;
    startPixel = { x: event.pixelX, y: event.pixelY };
    activeRegion = createRegion(activeTool);

    if (activeTool === "rectangle" || activeTool === "circle") {
      activeRegion.points = [pixelToData(startPixel), pixelToData(startPixel)];
    } else {
      activeRegion.points = [pixelToData(startPixel)];
    }

    event.preventDefault();
  }

  function handlePointerMove(event: InteractionEvent): void {
    if (!enabled || !isDrawing || !activeRegion) return;

    if (activeTool === "rectangle" || activeTool === "circle") {
      activeRegion.points[1] = pixelToData({ x: event.pixelX, y: event.pixelY });
    } else {
      activeRegion.points.push(pixelToData({ x: event.pixelX, y: event.pixelY }));
    }
    ctx?.requestRender();
  }

  function handlePointerUp(): void {
    if (!enabled || !isDrawing) return;
    isDrawing = false;
    startPixel = null;
    finishRegion();
  }

  const api: RoiAPI & Record<string, unknown> = {
    setTool(tool: RoiTool) {
      activeTool = tool;
    },
    getTool() {
      return activeTool;
    },
    enable() {
      enabled = true;
    },
    disable() {
      enabled = false;
    },
    isEnabled() {
      return enabled;
    },
    clear() {
      regions = [];
      activeRegion = null;
      originalSeriesData.forEach((_data, seriesId) => restoreMask(seriesId));
      originalSeriesData.clear();
      ctx?.requestRender();
    },
    getRegions() {
      return [...regions];
    },
    selectRegion(id: string) {
      const region = regions.find((r) => r.id === id);
      if (!region) return [];
      const masks = getMask(region);
      if (config.mask) applyMask(masks);
      return masks;
    },
    maskSeries(seriesId: string, indices: number[]) {
      applyMask([{ seriesId, indices }]);
    },
    updateConfig(newConfig) {
      Object.assign(config, newConfig);
      enabled = config.enabled;
      activeTool = config.defaultTool;
    },
  };

  return {
    manifest,
    onInit(pluginCtx: PluginContext) {
      ctx = pluginCtx;
      (ctx.chart as any).roi = api;
      log("Initialized");
    },
    onDestroy(pluginCtx: PluginContext) {
      delete (pluginCtx.chart as any).roi;
      ctx = null;
      regions = [];
      originalSeriesData.clear();
    },
    onInteraction(_pluginCtx: PluginContext, event: InteractionEvent) {
      if (!enabled) return;
      if (event.type === "mousedown") handlePointerDown(event);
      if (event.type === "mousemove") handlePointerMove(event);
      if (event.type === "mouseup") handlePointerUp();
    },
    onRenderOverlay(pluginCtx: PluginContext) {
      const ctx2d = pluginCtx.render.ctx2d;
      if (!ctx2d) return;
      regions.forEach((region) => drawRegion(region, ctx2d));
      if (activeRegion) drawRegion(activeRegion, ctx2d);
    },
    api,
  };
}

export default PluginROI;

// Type exports
export type {
  PluginRoiConfig,
  RoiAPI,
  RoiRegion,
  RoiPoint,
  RoiMaskResult,
  RoiTool,
  RoiEvent,
  RoiSelectedEvent,
} from "./types";
