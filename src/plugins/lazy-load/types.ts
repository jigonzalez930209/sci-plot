/**
 * @fileoverview Types for lazy loading plugin
 * @module plugins/lazy-load/types
 */

/**
 * Data chunk for lazy loading
 */
export interface DataChunk {
  /** Start index in full dataset */
  startIndex: number;
  /** End index in full dataset */
  endIndex: number;
  /** X data */
  x: Float32Array | Float64Array;
  /** Y data */
  y: Float32Array | Float64Array;
  /** Chunk loaded timestamp */
  loadedAt: number;
}

/**
 * Data provider interface
 */
export interface DataProvider {
  /** Total number of points */
  getTotalCount(): number;
  
  /** Load data chunk */
  loadChunk(startIndex: number, endIndex: number): Promise<DataChunk>;
  
  /** Optional: Get data range for optimization */
  getRange?(): { xMin: number; xMax: number; yMin: number; yMax: number };
}

/**
 * Loading progress event
 */
export interface LoadProgressEvent {
  /** Series ID */
  seriesId: string;
  /** Loaded points so far */
  loadedPoints: number;
  /** Total points */
  totalPoints: number;
  /** Progress 0-1 */
  progress: number;
  /** Current chunk being loaded */
  currentChunk: number;
  /** Total chunks */
  totalChunks: number;
}

/**
 * Plugin configuration
 */
export interface PluginLazyLoadConfig {
  /** Enable lazy loading (default: true) */
  enabled?: boolean;
  
  /** Chunk size in points (default: 10000) */
  chunkSize?: number;
  
  /** Viewport buffer multiplier (default: 2) - load 2x viewport */
  viewportBuffer?: number;
  
  /** Auto-load on zoom/pan (default: true) */
  autoLoad?: boolean;
  
  /** Unload distant chunks to save memory (default: true) */
  autoUnload?: boolean;
  
  /** Distance threshold for unloading (in viewports, default: 5) */
  unloadThreshold?: number;
  
  /** Preload adjacent chunks (default: true) */
  preloadAdjacent?: boolean;
  
  /** Maximum loaded chunks (default: 100) */
  maxLoadedChunks?: number;
  
  /** Callbacks */
  onLoadStart?: (event: LoadProgressEvent) => void;
  onLoadProgress?: (event: LoadProgressEvent) => void;
  onLoadComplete?: (event: LoadProgressEvent) => void;
  onLoadError?: (error: Error, seriesId: string) => void;
  
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * Registered series info
 */
export interface LazyLoadedSeries {
  /** Series ID */
  id: string;
  /** Data provider */
  provider: DataProvider;
  /** Loaded chunks */
  chunks: Map<number, DataChunk>;
  /** Currently loading chunks */
  loading: Set<number>;
  /** Total points */
  totalPoints: number;
}

/**
 * Plugin API
 */
export interface LazyLoadAPI {
  /** Register a series for lazy loading */
  registerSeries(seriesId: string, provider: DataProvider): void;
  
  /** Unregister a series */
  unregisterSeries(seriesId: string): void;
  
  /** Force load specific range */
  loadRange(seriesId: string, startIndex: number, endIndex: number): Promise<void>;
  
  /** Load visible data for all series */
  loadVisible(): Promise<void>;
  
  /** Unload distant chunks */
  unloadDistant(): number;
  
  /** Get loading status */
  getLoadingStatus(seriesId: string): {
    loadedPoints: number;
    totalPoints: number;
    loadedChunks: number;
    totalChunks: number;
  } | null;
  
  /** Clear all loaded data */
  clear(): void;
  
  /** Update configuration */
  updateConfig(config: Partial<PluginLazyLoadConfig>): void;
}
