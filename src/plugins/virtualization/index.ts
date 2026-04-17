/**
 * @fileoverview Data virtualization plugin (LOD/min-max)
 * @module plugins/virtualization
 */

import type {
  PluginVirtualizationConfig,
  VirtualizationAPI,
  VirtualizationStats,
  VirtualizationMode,
  VirtualizationStrategy,
} from "./types";
import type { ChartPlugin, PluginContext, PluginManifest } from "../types";
import type { Series } from "../../core/Series";
import type { SeriesUpdateData } from "../../types";
import {
  lttbDownsample,
  minMaxDownsample,
  calculateTargetPoints,
} from "../../workers/downsample";

const manifest: PluginManifest = {
  name: "velo-plot-virtualization",
  version: "1.0.0",
  description: "Viewport-aware data virtualization with LOD strategies",
  provides: ["performance", "data-virtualization"],
  tags: ["performance", "lod", "virtualization"],
};

const DEFAULT_CONFIG: Required<PluginVirtualizationConfig> = {
  enabled: true,
  mode: "lod",
  targetPoints: "auto",
  pointsPerPixel: 2,
  lodLevels: [1, 4, 8, 16],
  strategy: "lttb",
  reuseOriginalData: true,
  syncWithLazyLoad: true,
  includeSeries: [],
  excludeSeries: [],
  debug: false,
};

type SeriesCache = {
  x: Float32Array | Float64Array;
  y: Float32Array | Float64Array;
};

export function PluginVirtualization(
  userConfig: Partial<PluginVirtualizationConfig> = {}
): ChartPlugin<PluginVirtualizationConfig> {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  let ctx: PluginContext | null = null;
  let isInternalUpdate = false;

  const originalData = new Map<string, SeriesCache>();
  const stats = new Map<string, VirtualizationStats>();

  let originalUpdateSeries: ((id: string, data: SeriesUpdateData) => void) | null = null;
  let originalAppendData: ((id: string, x: number[] | Float32Array, y: number[] | Float32Array) => void) | null = null;

  function log(message: string, ...args: unknown[]) {
    if (config.debug && ctx) {
      ctx.log.info(`[Virtualization] ${message}`, ...args);
    }
  }

  function shouldVirtualize(series: Series): boolean {
    if (!config.enabled) return false;
    if (config.includeSeries.length > 0 && !config.includeSeries.includes(series.getId())) return false;
    if (config.excludeSeries.includes(series.getId())) return false;

    const type = series.getType();
    return (
      type === "line" ||
      type === "scatter" ||
      type === "line+scatter" ||
      type === "step" ||
      type === "step+scatter"
    );
  }

  function getTargetPoints(dataLength: number): number {
    if (!ctx) return dataLength;
    if (config.targetPoints !== "auto") return Math.max(2, config.targetPoints);
    const width = ctx.render.canvasSize.width / ctx.render.pixelRatio;
    return calculateTargetPoints(dataLength, width, config.pointsPerPixel);
  }

  function downsampleData(
    x: Float32Array | Float64Array,
    y: Float32Array | Float64Array,
    targetPoints: number,
    strategy: VirtualizationStrategy
  ): { x: Float32Array; y: Float32Array } {
    if (targetPoints >= x.length || x.length <= 2) {
      return { x: new Float32Array(x), y: new Float32Array(y) };
    }

    if (strategy === "minmax") {
      const bucketCount = Math.ceil(targetPoints / 2);
      const result = minMaxDownsample(x, y, bucketCount);
      return { x: result.x, y: result.y };
    }

    const result = lttbDownsample(x, y, targetPoints);
    return { x: result.x, y: result.y };
  }

  function cacheOriginal(seriesId: string, data: SeriesCache): void {
    if (!config.reuseOriginalData) return;
    originalData.set(seriesId, { x: data.x, y: data.y });
  }

  function restoreOriginal(seriesId: string): SeriesCache | null {
    return originalData.get(seriesId) ?? null;
  }

  function updateStats(
    seriesId: string,
    originalPoints: number,
    renderedPoints: number,
    targetPoints: number,
    mode: VirtualizationMode,
    strategy: VirtualizationStrategy
  ): void {
    stats.set(seriesId, {
      seriesId,
      originalPoints,
      renderedPoints,
      targetPoints,
      lastUpdated: Date.now(),
      mode,
      strategy,
    });
  }

  function applyVirtualization(series: Series): void {
    if (!ctx || !originalUpdateSeries) return;
    const seriesId = series.getId();
    const data = series.getData();
    if (!data?.x || !data?.y || data.x.length === 0) return;

    if (!shouldVirtualize(series)) {
      const original = restoreOriginal(seriesId);
      if (original && config.reuseOriginalData) {
        isInternalUpdate = true;
        originalUpdateSeries(seriesId, { x: original.x, y: original.y });
        isInternalUpdate = false;
      }
      return;
    }

    cacheOriginal(seriesId, { x: data.x, y: data.y });

    const targetPoints = getTargetPoints(data.x.length);
    const downsampled = downsampleData(data.x, data.y, targetPoints, config.strategy);

    isInternalUpdate = true;
    originalUpdateSeries(seriesId, { x: downsampled.x, y: downsampled.y });
    isInternalUpdate = false;

    updateStats(seriesId, data.x.length, downsampled.x.length, targetPoints, config.mode, config.strategy);
  }

  function refreshAll(): void {
    if (!ctx) return;
    ctx.data.getAllSeries().forEach((series) => applyVirtualization(series));
  }

  function handleUpdateSeries(id: string, data: SeriesUpdateData): void {
    if (!ctx || !originalUpdateSeries) return;
    if (!config.enabled || isInternalUpdate) {
      originalUpdateSeries(id, data);
      return;
    }

    const series = ctx.chart.getSeries?.(id) as Series | undefined;
    if (!series) {
      originalUpdateSeries(id, data);
      return;
    }

    const original = restoreOriginal(id);
    if (original && config.reuseOriginalData) {
      isInternalUpdate = true;
      originalUpdateSeries(id, { x: original.x, y: original.y });
      isInternalUpdate = false;
    }

    originalUpdateSeries(id, data);

    const updatedSeries = ctx.chart.getSeries?.(id) as Series | undefined;
    if (updatedSeries) {
      cacheOriginal(id, { x: updatedSeries.getData().x, y: updatedSeries.getData().y });
      applyVirtualization(updatedSeries);
    }
  }

  function handleAppendData(
    id: string,
    x: number[] | Float32Array,
    y: number[] | Float32Array
  ): void {
    if (!ctx || !originalAppendData || !originalUpdateSeries) return;

    if (!config.enabled || isInternalUpdate) {
      originalAppendData(id, x, y);
      return;
    }

    const series = ctx.chart.getSeries?.(id) as Series | undefined;
    if (!series) {
      originalAppendData(id, x, y);
      return;
    }

    const original = restoreOriginal(id);
    if (original && config.reuseOriginalData) {
      isInternalUpdate = true;
      originalUpdateSeries(id, { x: original.x, y: original.y });
      isInternalUpdate = false;
    }

    originalAppendData(id, x, y);

    const updatedSeries = ctx.chart.getSeries?.(id) as Series | undefined;
    if (updatedSeries) {
      cacheOriginal(id, { x: updatedSeries.getData().x, y: updatedSeries.getData().y });
      applyVirtualization(updatedSeries);
    }
  }

  const api: VirtualizationAPI & Record<string, unknown> = {
    enable() {
      config.enabled = true;
      refreshAll();
    },
    disable() {
      config.enabled = false;
      if (!ctx || !originalUpdateSeries) return;
      const updater = originalUpdateSeries;
      ctx.data.getAllSeries().forEach((series) => {
        const original = restoreOriginal(series.getId());
        if (original) {
          isInternalUpdate = true;
          updater(series.getId(), { x: original.x, y: original.y });
          isInternalUpdate = false;
        }
      });
    },
    isEnabled() {
      return config.enabled;
    },
    updateConfig(newConfig) {
      Object.assign(config, newConfig);
      refreshAll();
    },
    invalidate(seriesId) {
      if (!ctx) return;
      if (seriesId) {
        const series = ctx.chart.getSeries?.(seriesId) as Series | undefined;
        if (series) applyVirtualization(series);
        return;
      }
      refreshAll();
    },
    getStats(seriesId) {
      return stats.get(seriesId) ?? null;
    },
    getAllStats() {
      return Array.from(stats.values());
    },
  };

  return {
    manifest,
    onInit(pluginCtx: PluginContext) {
      ctx = pluginCtx;
      (ctx.chart as any).virtualization = api;

      const chart = ctx.chart as any;
      originalUpdateSeries = chart.updateSeries?.bind(chart) ?? null;
      originalAppendData = chart.appendData?.bind(chart) ?? null;

      if (originalUpdateSeries) {
        chart.updateSeries = (id: string, data: SeriesUpdateData) => handleUpdateSeries(id, data);
      }

      if (originalAppendData) {
        chart.appendData = (id: string, x: number[] | Float32Array, y: number[] | Float32Array) =>
          handleAppendData(id, x, y);
      }

      ctx.events.on("zoom", () => refreshAll());
      ctx.events.on("pan", () => refreshAll());
      ctx.events.on("resize", () => refreshAll());

      refreshAll();
      log("Initialized");
    },
    onDestroy(pluginCtx: PluginContext) {
      if (originalUpdateSeries) {
        (pluginCtx.chart as any).updateSeries = originalUpdateSeries;
      }
      if (originalAppendData) {
        (pluginCtx.chart as any).appendData = originalAppendData;
      }
      delete (pluginCtx.chart as any).virtualization;
      ctx = null;
      originalData.clear();
      stats.clear();
    },
    api,
  };
}

export default PluginVirtualization;

// Type exports
export type {
  PluginVirtualizationConfig,
  VirtualizationAPI,
  VirtualizationStats,
  VirtualizationMode,
  VirtualizationStrategy,
} from "./types";
