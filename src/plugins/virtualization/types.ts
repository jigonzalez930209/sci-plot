/**
 * @fileoverview Types for data virtualization plugin
 * @module plugins/virtualization/types
 */

export type VirtualizationMode = "lod" | "bins" | "hybrid";
export type VirtualizationStrategy = "lttb" | "minmax";

export interface PluginVirtualizationConfig {
  /** Enable virtualization (default: true) */
  enabled?: boolean;
  /** Virtualization mode (default: 'lod') */
  mode?: VirtualizationMode;
  /** Target points or 'auto' (default: 'auto') */
  targetPoints?: number | "auto";
  /** Points per pixel when targetPoints is 'auto' (default: 2) */
  pointsPerPixel?: number;
  /** LOD levels (factors) used for heuristic switching (default: [1, 4, 8, 16]) */
  lodLevels?: number[];
  /** Downsample strategy (default: 'lttb') */
  strategy?: VirtualizationStrategy;
  /** Keep original data cached in plugin (default: true) */
  reuseOriginalData?: boolean;
  /** Sync updates with lazy-load (default: true) */
  syncWithLazyLoad?: boolean;
  /** Include series IDs (default: all) */
  includeSeries?: string[];
  /** Exclude series IDs (default: none) */
  excludeSeries?: string[];
  /** Debug logging (default: false) */
  debug?: boolean;
}

export interface VirtualizationStats {
  seriesId: string;
  originalPoints: number;
  renderedPoints: number;
  targetPoints: number;
  lastUpdated: number;
  mode: VirtualizationMode;
  strategy: VirtualizationStrategy;
}

export interface VirtualizationAPI {
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
  updateConfig(config: Partial<PluginVirtualizationConfig>): void;
  invalidate(seriesId?: string): void;
  getStats(seriesId: string): VirtualizationStats | null;
  getAllStats(): VirtualizationStats[];
}
