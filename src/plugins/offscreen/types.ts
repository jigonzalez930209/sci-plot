/**
 * @fileoverview Types for Offscreen rendering plugin
 * @module plugins/offscreen/types
 */

export type OffscreenMode = "auto" | "webgl-only" | "all-layers";
export type OffscreenTransferMode = "offscreen" | "image-bitmap";
export type OffscreenFallbackMode = "main-thread" | "disable";

export interface PluginOffscreenConfig {
  /** Enable offscreen rendering (default: false) */
  enabled?: boolean;
  /** Rendering mode (default: "auto") */
  mode?: OffscreenMode;
  /** Number of workers in pool (default: 1) */
  workerPool?: number;
  /** Transfer strategy (default: "offscreen") */
  transfer?: OffscreenTransferMode;
  /** Fallback if offscreen unavailable (default: "main-thread") */
  fallback?: OffscreenFallbackMode;
  /** Enable debug logs (default: false) */
  debug?: boolean;
}

export interface OffscreenStats {
  enabled: boolean;
  frames: number;
  lastFrameTime: number;
  lastFrameTimestamp: number;
}

export interface OffscreenAPI {
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
  updateConfig(config: Partial<PluginOffscreenConfig>): void;
  getStats(): OffscreenStats;
  flush(): void;
}
