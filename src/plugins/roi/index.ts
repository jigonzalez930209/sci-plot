import type { PluginContext, InteractionEvent, PluginManifest } from "../types";

export interface RoiPoint {
  x: number;
  y: number;
}

export interface RoiRegion {
  id: string;
  tool: "rectangle" | "circle" | "polygon" | "lasso";
  points: RoiPoint[];
  color?: string;
  fill?: string;
}

export interface RoiMaskResult {
  regionId: string;
  seriesId: string;
  masks: boolean[];
}

export interface RoiSelectedEvent {
  region: RoiRegion;
  seriesIds: string[];
  masks: RoiMaskResult[];
}

export interface RoiAPI {
  setTool(tool: RoiTool): void;
  clear(): void;
  getRegions(): RoiRegion[];
  removeRegion(id: string): void;
  calculateMasks(regionId: string): RoiMaskResult[];
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
}

export type RoiTool = "rectangle" | "circle" | "polygon" | "lasso";

export interface PluginROIConfig {
  defaultTool?: RoiTool;
  stroke?: string;
  fill?: string;
  enabled?: boolean;
  mask?: boolean;
}

export const PluginROI = (config: PluginROIConfig = {}) => {
  let ctx: PluginContext | null = null;
  let activeTool: RoiTool = config.defaultTool || "rectangle";
  let regions: RoiRegion[] = [];
  let isDrawing = false;
  let activeRegion: RoiRegion | null = null;
  let enabled = config.enabled !== false;
  let isMasking = config.mask === true;

  // Store for original data when masking is active
  const rawDataStore = new Map<string, { x: Float32Array; y: Float32Array }>();
  let originalUpdateSeries: any = null;
  let originalAddSeries: any = null;

  const manifest: PluginManifest = {
    name: "roi",
    description: "Region of Interest selection tool and masking",
    version: "1.1.0",
    author: "SciChart",
  };

  function createRegion(tool: RoiTool): RoiRegion {
    return {
      id: Math.random().toString(36).substring(2, 11),
      tool,
      points: [],
      color: config.stroke || "#00f2ff",
      fill: config.fill || "rgba(0, 242, 255, 0.15)",
    };
  }

  function pixelToData(pixel: { x: number; y: number }): RoiPoint {
    if (!ctx) return { x: 0, y: 0 };
    return {
      x: ctx.coords.pixelToDataX(pixel.x),
      y: ctx.coords.pixelToDataY(pixel.y),
    };
  }

  function dataToPixel(point: RoiPoint): { x: number; y: number } {
    if (!ctx) return { x: 0, y: 0 };
    return {
      x: ctx.coords.dataToPixelX(point.x),
      y: ctx.coords.dataToPixelY(point.y),
    };
  }

  function isPointInAnyRegion(point: RoiPoint): boolean {
    if (regions.length === 0) return true; // Show all if no regions defined
    return regions.some((r) => isPointInRegion(point, r));
  }

  function applyMasking(): void {
    if (!ctx || !isMasking) return;

    for (const [id, raw] of rawDataStore.entries()) {
      const indices: number[] = [];
      for (let i = 0; i < raw.x.length; i++) {
        if (isPointInAnyRegion({ x: raw.x[i], y: raw.y[i] })) {
          indices.push(i);
        }
      }

      const filteredX = new Float32Array(indices.length);
      const filteredY = new Float32Array(indices.length);
      for (let i = 0; i < indices.length; i++) {
        filteredX[i] = raw.x[indices[i]];
        filteredY[i] = raw.y[indices[i]];
      }

      if (originalUpdateSeries) {
        originalUpdateSeries(id, { x: filteredX, y: filteredY });
      }
    }
  }

  function isPointInRegion(point: RoiPoint, region: RoiRegion): boolean {
    const { tool, points } = region;
    if (points.length < 2) return false;

    if (tool === "rectangle") {
      const xMin = Math.min(points[0].x, points[1].x);
      const xMax = Math.max(points[0].x, points[1].x);
      const yMin = Math.min(points[0].y, points[1].y);
      const yMax = Math.max(points[0].y, points[1].y);
      return point.x >= xMin && point.x <= xMax && point.y >= yMin && point.y <= yMax;
    }

    if (tool === "circle") {
      const dx = point.x - points[0].x;
      const dy = point.y - points[0].y;
      const r = Math.sqrt(
        Math.pow(points[1].x - points[0].x, 2) + Math.pow(points[1].y - points[0].y, 2)
      );
      return Math.sqrt(dx * dx + dy * dy) <= r;
    }

    if (tool === "polygon" || tool === "lasso") {
      // Ray casting algorithm
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x, yi = points[i].y;
        const xj = points[j].x, yj = points[j].y;
        const intersect = yi > point.y !== yj > point.y &&
          point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    }

    return false;
  }

  function calculateMasks(regionId: string): RoiMaskResult[] {
    const region = regions.find((r) => r.id === regionId);
    if (!region || !ctx) return [];

    const results: RoiMaskResult[] = [];
    ctx.chart.getAllSeries().forEach((series) => {
      const data = series.getData();
      if (!data) return;

      const masks = new Array(data.x.length);
      for (let i = 0; i < data.x.length; i++) {
        masks[i] = isPointInRegion({ x: data.x[i], y: data.y[i] }, region);
      }

      results.push({
        regionId,
        seriesId: series.getId(),
        masks,
      });
    });

    return results;
  }

  function finishRegion(): void {
    if (!activeRegion || !ctx) return;
    
    // Clean up preview points for polygon
    if (activeRegion.tool === "polygon" && activeRegion.points.length > 1) {
        // Remove the preview point
        activeRegion.points.pop();
    }

    regions.push(activeRegion);

    if (isMasking) {
      applyMasking();
    }

    const event: RoiSelectedEvent = {
      region: activeRegion,
      seriesIds: ctx.chart.getAllSeries().map((s) => s.getId()),
      masks: calculateMasks(activeRegion.id),
    };

    // Emit on both plugin context and chart
    ctx.events.emit("roi:selected", event);
    if (ctx.chart.events) {
        ctx.chart.events.emit("roi:selected" as any, event);
    }
    
    ctx.events.emit("roi:created", {
      region: activeRegion,
      seriesIds: event.seriesIds,
    });

    activeRegion = null;
    isDrawing = false;
    ctx.requestRender();
  }

  function handlePointerDown(event: InteractionEvent): void {
    if (!enabled || !event.inPlotArea) return;

    if (activeTool === "polygon" && activeRegion) {
        // For polygon, we keep adding points on click
        // But first, replace the preview point with a permanent one
        const previewPoint = pixelToData({ x: event.pixelX, y: event.pixelY });
        activeRegion.points.push(previewPoint);
        event.preventDefault();
        ctx?.requestRender();
        return;
    }

    isDrawing = true;
    activeRegion = createRegion(activeTool);
    const startPoint = pixelToData({ x: event.pixelX, y: event.pixelY });
    activeRegion.points.push(startPoint);
    
    if (activeTool === "rectangle" || activeTool === "circle") {
      activeRegion.points.push({ ...startPoint });
    } else if (activeTool === "polygon") {
        // Add a second point for preview
        activeRegion.points.push({ ...startPoint });
    }
    
    event.preventDefault(); // Stop chart from panning
    ctx?.requestRender();
  }

  function handlePointerMove(event: InteractionEvent): void {
    if (!enabled || !isDrawing || !activeRegion) return;

    if (activeTool === "rectangle" || activeTool === "circle") {
      activeRegion.points[1] = pixelToData({ x: event.pixelX, y: event.pixelY });
    } else if (activeTool === "lasso") {
      // For lasso, we capture points during movement
      const lastPoint = activeRegion.points[activeRegion.points.length - 1];
      const newPoint = pixelToData({ x: event.pixelX, y: event.pixelY });
      
      // Basic distance filter to avoid too many points
      const dx = ctx!.coords.dataToPixelX(newPoint.x) - ctx!.coords.dataToPixelX(lastPoint.x);
      const dy = ctx!.coords.dataToPixelY(newPoint.y) - ctx!.coords.dataToPixelY(lastPoint.y);
      if (Math.sqrt(dx*dx + dy*dy) > 5) {
        activeRegion.points.push(newPoint);
      }
    } else if (activeTool === "polygon") {
        // Update the preview point (the last one)
        const lastIndex = activeRegion.points.length - 1;
        if (lastIndex >= 0) {
            activeRegion.points[lastIndex] = pixelToData({ x: event.pixelX, y: event.pixelY });
        }
    }
    ctx?.requestRender();
  }

  function handlePointerUp(_event: InteractionEvent): void {
    if (!isDrawing || !activeRegion) return;

    if (activeTool !== "polygon") {
      finishRegion();
    }
  }

  function drawRegion(region: RoiRegion, ctx2d: CanvasRenderingContext2D): void {
    const { tool, points, color, fill } = region;
    if (points.length < 1) return;

    const pixels = points.map((p) => dataToPixel(p));

    ctx2d.strokeStyle = color || "#00f2ff";
    ctx2d.fillStyle = fill || "rgba(0, 242, 255, 0.15)";
    ctx2d.lineWidth = 2;

    if (tool === "rectangle" && pixels.length >= 2) {
      const x = Math.min(pixels[0].x, pixels[1].x);
      const y = Math.min(pixels[0].y, pixels[1].y);
      const w = Math.abs(pixels[0].x - pixels[1].x);
      const h = Math.abs(pixels[0].y - pixels[1].y);
      ctx2d.fillRect(x, y, w, h);
      ctx2d.strokeRect(x, y, w, h);
    } else if (tool === "circle" && pixels.length >= 2) {
      const dx = pixels[1].x - pixels[0].x;
      const dy = pixels[1].y - pixels[0].y;
      const r = Math.sqrt(dx * dx + dy * dy);
      ctx2d.beginPath();
      ctx2d.arc(pixels[0].x, pixels[0].y, r, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.stroke();
    } else if ((tool === "polygon" || tool === "lasso") && pixels.length >= 2) {
      ctx2d.beginPath();
      ctx2d.moveTo(pixels[0].x, pixels[0].y);
      pixels.slice(1).forEach((p) => ctx2d.lineTo(p.x, p.y));
      if (tool === "lasso") {
          ctx2d.closePath();
      } else if (!isDrawing || region !== activeRegion) {
          ctx2d.closePath();
      }
      ctx2d.fill();
      ctx2d.stroke();
    }
  }

  return {
    manifest,
    onInit(pluginCtx: PluginContext) {
      ctx = pluginCtx;
      const chart = ctx.chart as any;
      chart.roi = this.api;

      // Hijack series methods if masking is enabled
      originalUpdateSeries = chart.updateSeries.bind(chart);
      originalAddSeries = chart.addSeries.bind(chart);

      chart.addSeries = (options: any) => {
        if (options.id && options.data?.x) {
          rawDataStore.set(options.id, {
            x: new Float32Array(options.data.x),
            y: new Float32Array(options.data.y),
          });
        }
        if (isMasking && options.data?.x) {
          // Apply initial mask
          const raw = rawDataStore.get(options.id)!;
          const indices: number[] = [];
          for (let i = 0; i < raw.x.length; i++) {
            if (isPointInAnyRegion({ x: raw.x[i], y: raw.y[i] })) indices.push(i);
          }
          const fx = new Float32Array(indices.length);
          const fy = new Float32Array(indices.length);
          for (let i = 0; i < indices.length; i++) {
            fx[i] = raw.x[indices[i]];
            fy[i] = raw.y[indices[i]];
          }
          originalAddSeries({ ...options, data: { ...options.data, x: fx, y: fy } });
        } else {
          originalAddSeries(options);
        }
      };

      chart.updateSeries = (id: string, data: any) => {
        if (data.x) {
          rawDataStore.set(id, {
            x: new Float32Array(data.x),
            y: new Float32Array(data.y),
          });
        }
        if (isMasking && data.x) {
          const raw = rawDataStore.get(id)!;
          const indices: number[] = [];
          for (let i = 0; i < raw.x.length; i++) {
            if (isPointInAnyRegion({ x: raw.x[i], y: raw.y[i] })) indices.push(i);
          }
          const fx = new Float32Array(indices.length);
          const fy = new Float32Array(indices.length);
          for (let i = 0; i < indices.length; i++) {
            fx[i] = raw.x[indices[i]];
            fy[i] = raw.y[indices[i]];
          }
          originalUpdateSeries(id, { ...data, x: fx, y: fy });
        } else {
          originalUpdateSeries(id, data);
        }
      };
    },
    onDestroy() {
      if (ctx) {
        const chart = ctx.chart as any;
        chart.roi = undefined;
        chart.addSeries = originalAddSeries;
        chart.updateSeries = originalUpdateSeries;
      }
      ctx = null;
      rawDataStore.clear();
    },
    onInteraction(_pluginCtx: PluginContext, event: InteractionEvent) {
      if (event.type === "mousedown") handlePointerDown(event);
      if (event.type === "mousemove") handlePointerMove(event);
      if (event.type === "mouseup") handlePointerUp(event);
      
      // Handle double click to finish polygon
      if (event.type === "mouseup" && activeTool === "polygon" && isDrawing) {
          // Simple double click detection
          // For now, let's just use a more complex logic or a button if needed.
          // In this implementation, let's say 3 clicks on the same area or just let it be.
      }
      
      // Special: right click or double click to finish polygon
      if (event.originalEvent instanceof MouseEvent && event.originalEvent.detail === 2 && activeTool === "polygon") {
          finishRegion();
          event.preventDefault();
      }
    },
    onRenderOverlay(pluginCtx: PluginContext) {
      const ctx2d = pluginCtx.render.ctx2d;
      if (!ctx2d) return;

      regions.forEach((region) => drawRegion(region, ctx2d));
      if (activeRegion) drawRegion(activeRegion, ctx2d);
    },
    api: {
      setTool(tool: RoiTool) {
        activeTool = tool;
        if (isDrawing) finishRegion();
      },
      clear() {
        regions = [];
        activeRegion = null;
        isDrawing = false;
        if (isMasking) applyMasking();
        if (ctx) {
          ctx.events.emit("roi:cleared", {});
          ctx.requestRender();
        }
      },
      getRegions() {
        return [...regions];
      },
      removeRegion(id: string) {
        regions = regions.filter((r) => r.id !== id);
        if (isMasking) applyMasking();
        if (ctx) ctx.requestRender();
      },
      calculateMasks,
      isEnabled: () => enabled,
      setEnabled: (e: boolean) => {
        enabled = e;
      },
      setMasking(mask: boolean) {
        isMasking = mask;
        if (mask) {
          applyMasking();
        } else {
          // Restore all original data
          if (ctx) {
            for (const [id, raw] of rawDataStore.entries()) {
              originalUpdateSeries(id, raw);
            }
            ctx.requestRender();
          }
        }
      },
    } as RoiAPI,
  };
};

export type RoiEvent = "roi:selected" | "roi:created" | "roi:cleared";
