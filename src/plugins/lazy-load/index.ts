/**
 * @fileoverview Lazy loading plugin for large datasets
 * @module plugins/lazy-load
 */

import type {
  PluginLazyLoadConfig,
  LazyLoadAPI,
  DataProvider,
  LazyLoadedSeries,
  LoadProgressEvent,
} from './types';
import type {
  ChartPlugin,
  PluginContext,
  PluginManifest,
} from '../types';

const manifest: PluginManifest = {
  name: 'velo-plot-lazy-load',
  version: '1.0.0',
  description: 'Lazy loading for large datasets with viewport-based chunking',
  provides: ['lazy-load', 'data-streaming'],
  tags: ['performance', 'data', 'optimization'],
};

const DEFAULT_CONFIG: Required<PluginLazyLoadConfig> = {
  enabled: true,
  chunkSize: 10000,
  viewportBuffer: 2,
  autoLoad: true,
  autoUnload: true,
  unloadThreshold: 5,
  preloadAdjacent: true,
  maxLoadedChunks: 100,
  onLoadStart: () => {},
  onLoadProgress: () => {},
  onLoadComplete: () => {},
  onLoadError: () => {},
  debug: false,
};

export function PluginLazyLoad(
  userConfig: Partial<PluginLazyLoadConfig> = {}
): ChartPlugin<PluginLazyLoadConfig> {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  let ctx: PluginContext | null = null;

  // Registered series
  const series = new Map<string, LazyLoadedSeries>();

  /**
   * Calculate chunk index from point index
   */
  function getChunkIndex(pointIndex: number): number {
    return Math.floor(pointIndex / config.chunkSize);
  }

  /**
   * Get visible range from chart
   */
  function getVisibleRange(): { xMin: number; xMax: number } | null {
    if (!ctx) return null;
    
    // Get current view bounds from data context
    const bounds = ctx.data.getViewBounds();
    if (bounds) {
      return { xMin: bounds.xMin, xMax: bounds.xMax };
    }
    
    return null;
  }

  /**
   * Load a specific chunk
   */
  async function loadChunk(
    seriesInfo: LazyLoadedSeries,
    chunkIndex: number
  ): Promise<void> {
    // Already loaded or loading
    if (seriesInfo.chunks.has(chunkIndex) || seriesInfo.loading.has(chunkIndex)) {
      return;
    }

    seriesInfo.loading.add(chunkIndex);

    try {
      const startIndex = chunkIndex * config.chunkSize;
      const endIndex = Math.min(
        startIndex + config.chunkSize,
        seriesInfo.totalPoints
      );

      if (config.debug) {
        console.log(`[LazyLoad] Loading chunk ${chunkIndex} for ${seriesInfo.id} (${startIndex}-${endIndex})`);
      }

      const chunk = await seriesInfo.provider.loadChunk(startIndex, endIndex);
      
      seriesInfo.chunks.set(chunkIndex, chunk);
      seriesInfo.loading.delete(chunkIndex);

      // Update chart data
      await updateSeriesData(seriesInfo);

      // Fire progress event
      const loadedPoints = Array.from(seriesInfo.chunks.values()).reduce(
        (sum, c) => sum + (c.endIndex - c.startIndex),
        0
      );

      const totalChunks = Math.ceil(seriesInfo.totalPoints / config.chunkSize);
      
      const event: LoadProgressEvent = {
        seriesId: seriesInfo.id,
        loadedPoints,
        totalPoints: seriesInfo.totalPoints,
        progress: loadedPoints / seriesInfo.totalPoints,
        currentChunk: chunkIndex,
        totalChunks,
      };

      if (loadedPoints === seriesInfo.totalPoints) {
        config.onLoadComplete(event);
      } else {
        config.onLoadProgress(event);
      }

    } catch (error) {
      seriesInfo.loading.delete(chunkIndex);
      config.onLoadError(error as Error, seriesInfo.id);
      
      if (config.debug) {
        console.error(`[LazyLoad] Error loading chunk ${chunkIndex}:`, error);
      }
    }
  }

  /**
   * Update series data from loaded chunks
   */
  async function updateSeriesData(seriesInfo: LazyLoadedSeries): Promise<void> {
    if (!ctx) return;

    // Merge all loaded chunks
    const sortedChunks = Array.from(seriesInfo.chunks.entries()).sort((a, b) => a[0] - b[0]);
    
    if (sortedChunks.length === 0) return;

    // Calculate total size
    let totalSize = 0;
    for (const [, chunk] of sortedChunks) {
      totalSize += chunk.x.length;
    }

    // Allocate arrays
    const x = new Float32Array(totalSize);
    const y = new Float32Array(totalSize);

    // Copy data
    let offset = 0;
    for (const [, chunk] of sortedChunks) {
      x.set(chunk.x, offset);
      y.set(chunk.y, offset);
      offset += chunk.x.length;
    }

    // Update series
    (ctx.chart as any).updateSeries?.(seriesInfo.id, { x, y });
  }

  /**
   * Load visible data
   */
  async function loadVisible(): Promise<void> {
    if (!config.enabled || !ctx) return;

    const visibleRange = getVisibleRange();
    if (!visibleRange) return;

    const buffer = config.viewportBuffer;
    const rangeWidth = visibleRange.xMax - visibleRange.xMin;
    const buffered = {
      xMin: visibleRange.xMin - rangeWidth * buffer,
      xMax: visibleRange.xMax + rangeWidth * buffer,
    };

    for (const [, seriesInfo] of series) {
      const chunksToLoad: number[] = [];
      const totalChunks = Math.ceil(seriesInfo.totalPoints / config.chunkSize);

      // Identify chunks within the buffered viewport
      const startIdx = Math.max(0, Math.floor(buffered.xMin / config.chunkSize));
      const endIdx = Math.min(totalChunks - 1, Math.floor(buffered.xMax / config.chunkSize));

      for (let i = startIdx; i <= endIdx; i++) {
        if (!seriesInfo.chunks.has(i) && !seriesInfo.loading.has(i)) {
          chunksToLoad.push(i);
        }
      }

      // Load chunks sequentially (limit to avoid flood)
      const maxToLoad = Math.min(chunksToLoad.length, 10);
      for (let i = 0; i < maxToLoad; i++) {
        await loadChunk(seriesInfo, chunksToLoad[i]);
      }

      // Preload next adjacent chunk if enabled
      if (config.preloadAdjacent && endIdx + 1 < totalChunks) {
        const nextChunk = endIdx + 1;
        if (!seriesInfo.chunks.has(nextChunk) && !seriesInfo.loading.has(nextChunk)) {
          loadChunk(seriesInfo, nextChunk); // Fire and forget
        }
      }
    }
  }

  /**
   * Unload distant chunks
   */
  function unloadDistant(): number {
    if (!config.autoUnload || !ctx) return 0;

    const visibleRange = getVisibleRange();
    if (!visibleRange) return 0;

    let unloadedCount = 0;

    for (const [, seriesInfo] of series) {
      // TODO: Implement distance-based unloading logic
      // For now, only maxLoadedChunks handles eviction

      // Enforce max chunks limit
      if (seriesInfo.chunks.size > config.maxLoadedChunks) {
        const sortedChunks = Array.from(seriesInfo.chunks.entries()).sort(
          (a, b) => a[1].loadedAt - b[1].loadedAt
        );
        
        const toRemove = seriesInfo.chunks.size - config.maxLoadedChunks;
        for (let i = 0; i < toRemove; i++) {
          seriesInfo.chunks.delete(sortedChunks[i][0]);
          unloadedCount++;
        }
      }
    }

    if (config.debug && unloadedCount > 0) {
      console.log(`[LazyLoad] Unloaded ${unloadedCount} chunks`);
    }

    return unloadedCount;
  }

  /**
   * Register a series
   */
  function registerSeries(seriesId: string, provider: DataProvider): void {
    const totalPoints = provider.getTotalCount();
    
    series.set(seriesId, {
      id: seriesId,
      provider,
      chunks: new Map(),
      loading: new Set(),
      totalPoints,
    });

    if (config.debug) {
      console.log(`[LazyLoad] Registered series ${seriesId} with ${totalPoints} points`);
    }

    // Fire load start event
    config.onLoadStart({
      seriesId,
      loadedPoints: 0,
      totalPoints,
      progress: 0,
      currentChunk: 0,
      totalChunks: Math.ceil(totalPoints / config.chunkSize),
    });

    // Auto-load if enabled
    if (config.autoLoad) {
      loadVisible();
    }
  }

  /**
   * Unregister a series
   */
  function unregisterSeries(seriesId: string): void {
    series.delete(seriesId);
    
    if (config.debug) {
      console.log(`[LazyLoad] Unregistered series ${seriesId}`);
    }
  }

  /**
   * Load specific range
   */
  async function loadRange(
    seriesId: string,
    startIndex: number,
    endIndex: number
  ): Promise<void> {
    const seriesInfo = series.get(seriesId);
    if (!seriesInfo) return;

    const startChunk = getChunkIndex(startIndex);
    const endChunk = getChunkIndex(endIndex);

    for (let i = startChunk; i <= endChunk; i++) {
      await loadChunk(seriesInfo, i);
    }
  }

  /**
   * Get loading status
   */
  function getLoadingStatus(seriesId: string) {
    const seriesInfo = series.get(seriesId);
    if (!seriesInfo) return null;

    const loadedPoints = Array.from(seriesInfo.chunks.values()).reduce(
      (sum, c) => sum + (c.endIndex - c.startIndex),
      0
    );

    return {
      loadedPoints,
      totalPoints: seriesInfo.totalPoints,
      loadedChunks: seriesInfo.chunks.size,
      totalChunks: Math.ceil(seriesInfo.totalPoints / config.chunkSize),
    };
  }

  /**
   * Clear all data
   */
  function clear(): void {
    for (const [, seriesInfo] of series) {
      seriesInfo.chunks.clear();
      seriesInfo.loading.clear();
    }
  }

  // API implementation
  const api: LazyLoadAPI & Record<string, unknown> = {
    registerSeries,
    unregisterSeries,
    loadRange,
    loadVisible,
    unloadDistant,
    getLoadingStatus,
    clear,
    updateConfig(newConfig: Partial<PluginLazyLoadConfig>) {
      Object.assign(config, newConfig);
    },
  };

  return {
    manifest,

    onInit(pluginCtx: PluginContext) {
      ctx = pluginCtx;

      // Attach to chart API
      (ctx.chart as any).lazyLoad = api;

      // Listen for zoom/pan if auto-load enabled
      if (config.autoLoad) {
        ctx.chart.on?.('zoom', () => {
          loadVisible();
          if (config.autoUnload) {
            unloadDistant();
          }
        });

        ctx.chart.on?.('pan', () => {
          loadVisible();
          if (config.autoUnload) {
            unloadDistant();
          }
        });
      }
    },

    onDestroy(pluginCtx: PluginContext) {
      // Clear all data
      clear();

      // Remove from chart API
      delete (pluginCtx.chart as any).lazyLoad;

      ctx = null;
    },

    api,
  };
}

export default PluginLazyLoad;

// Type exports
export type {
  PluginLazyLoadConfig,
  LazyLoadAPI,
  DataProvider,
  DataChunk,
  LoadProgressEvent,
} from './types';
