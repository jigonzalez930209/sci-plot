/**
 * @fileoverview Offscreen rendering plugin (skeleton with stats + feature detection)
 * @module plugins/offscreen
 */

import type {
  PluginOffscreenConfig,
  OffscreenAPI,
  OffscreenStats,
} from "./types";
import type { ChartPlugin, PluginContext, PluginManifest } from "../types";

const manifest: PluginManifest = {
  name: "velo-plot-offscreen",
  version: "1.0.0",
  description: "Offscreen rendering support with worker-ready scaffolding",
  provides: ["performance", "offscreen"],
  tags: ["performance", "offscreen", "worker"],
};

const DEFAULT_CONFIG: Required<PluginOffscreenConfig> = {
  enabled: false,
  mode: "auto",
  workerPool: 1,
  transfer: "offscreen",
  fallback: "main-thread",
  debug: false,
};

import { WorkerPool } from "./pool";

export function PluginOffscreen(
  userConfig: Partial<PluginOffscreenConfig> = {}
): ChartPlugin<PluginOffscreenConfig> {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  let ctx: PluginContext | null = null;
  let pool: WorkerPool | null = null;
  let stats: OffscreenStats = {
    enabled: config.enabled,
    frames: 0,
    lastFrameTime: 0,
    lastFrameTimestamp: 0,
  };

  function log(message: string, ...args: unknown[]) {
    if (config.debug && ctx) {
      ctx.log.info(`[Offscreen] ${message}`, ...args);
    }
  }

  function isSupported(): boolean {
    return typeof (globalThis as any).OffscreenCanvas !== "undefined";
  }

  function enable(): void {
    if (!isSupported()) {
      log("OffscreenCanvas not supported. Falling back to main thread.");
      if (config.fallback === "disable") {
        stats.enabled = false;
        return;
      }
    }
    
    if (!pool) {
        pool = new WorkerPool(config.workerPool || 1);
    }
    
    stats.enabled = true;
    config.enabled = true;
  }

  function disable(): void {
    if (pool) {
        pool.destroy();
        pool = null;
    }
    stats.enabled = false;
    config.enabled = false;
  }

  function updateConfig(newConfig: Partial<PluginOffscreenConfig>): void {
    Object.assign(config, newConfig);
    if (config.enabled) enable();
    else disable();
    stats.enabled = !!config.enabled;
  }

  function getStats(): OffscreenStats {
      const poolStats = pool?.getStats();
      return { 
          ...stats,
          activeWorkers: poolStats?.active || 0,
          queuedTasks: poolStats?.queued || 0
      } as any;
  }

  function flush(): void {
    ctx?.requestRender();
  }

  const api: OffscreenAPI & Record<string, unknown> = {
    enable,
    disable,
    isEnabled: () => stats.enabled,
    updateConfig,
    getStats,
    flush,
  };

  return {
    manifest,
    onInit(pluginCtx: PluginContext) {
      ctx = pluginCtx;
      (ctx.chart as any).offscreen = api;
      if (config.enabled) enable();
      log(`Initialized (pool=${config.workerPool})`);
    },
    onDestroy(pluginCtx: PluginContext) {
      disable();
      delete (pluginCtx.chart as any).offscreen;
      ctx = null;
    },
    onAfterRender(_ctx, event) {
      stats.frames += 1;
      stats.lastFrameTime = event.renderTime;
      stats.lastFrameTimestamp = event.timestamp;
      
      if (config.enabled && pool) {
          // In a real implementation, we would offload the next render piece here
          // For now, we just track that we could have used the pool
      }
    },
    api,
  };
}

export default PluginOffscreen;

// Type exports
export type {
  PluginOffscreenConfig,
  OffscreenAPI,
  OffscreenStats,
  OffscreenMode,
  OffscreenTransferMode,
  OffscreenFallbackMode,
} from "./types";
