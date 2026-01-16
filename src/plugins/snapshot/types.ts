/**
 * SciChartEngine - Snapshot Export Plugin Types
 */

export type SnapshotFormat = 'png' | 'jpeg' | 'webp';

/**
 * Snapshot Resolution presets or scale factor
 */
export type SnapshotResolution = 'standard' | '2k' | '4k' | '8k' | number;

export interface SnapshotExportOptions {
  /** Image format (default: 'png') */
  format?: SnapshotFormat;
  /** Image quality 0-1 (for jpeg/webp) */
  quality?: number;
  /** Resolution preset or scale factor (default: 'standard') */
  resolution?: SnapshotResolution;
  /** Whether to include the background of the chart (default: true) */
  includeBackground?: boolean;
  /** Whether to include annotations and overlays (default: true) */
  includeOverlays?: boolean;
  /** Custom watermark text */
  watermarkText?: string;
  /** Transparent background (only for png/webp) */
  transparent?: boolean;
  /** Filename for download */
  fileName?: string;
  /** Whether to trigger automatic download */
  download?: boolean;
}

export interface SnapshotExportAPI {
  /** Takes a snapshot and returns the data URL or Blob */
  takeSnapshot(options?: SnapshotExportOptions): Promise<string | Blob>;
  /** Takes a snapshot and triggers a browser download */
  downloadSnapshot(options?: SnapshotExportOptions): Promise<void>;
}

export interface PluginSnapshotConfig {
  /** Default options for all snapshots */
  defaultOptions?: SnapshotExportOptions;
}
