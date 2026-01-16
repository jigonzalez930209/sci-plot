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
  name: "scichart-offscreen",
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

export function PluginOffscreen(
  userConfig: Partial<PluginOffscreenConfig> = {}
): ChartPlugin<PluginOffscreenConfig> {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  let ctx: PluginContext | null = null;
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
    stats.enabled = true;
    config.enabled = true;
  }

  function disable(): void {
    stats.enabled = false;
    config.enabled = false;
  }

  function updateConfig(newConfig: Partial<PluginOffscreenConfig>): void {
    Object.assign(config, newConfig);
    stats.enabled = !!config.enabled;
  }

  function getStats(): OffscreenStats {
    return { ...stats };
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
      log(`Initialized (supported=${isSupported()})`);
    },
    onDestroy(pluginCtx: PluginContext) {
      delete (pluginCtx.chart as any).offscreen;
      ctx = null;
    },
    onAfterRender(_ctx, event) {
      stats.frames += 1;
      stats.lastFrameTime = event.renderTime;
      stats.lastFrameTimestamp = event.timestamp;
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
