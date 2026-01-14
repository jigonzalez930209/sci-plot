/**
 * Data Export Plugin - Type Definitions
 * 
 * @module plugins/data-export/types
 */

import type { SeriesData } from "../../types";

// ============================================
// Export Format Types
// ============================================

/**
 * Supported export formats
 */
export type ExportFormat = 
  | 'csv'           // Standard CSV
  | 'tsv'           // Tab-separated values
  | 'json'          // JSON structure
  | 'matlab'        // MATLAB .mat compatible format (as JSON)
  | 'python'        // Python-compatible format (NumPy arrays as JSON)
  | 'xlsx'          // Excel-compatible CSV with BOM
  | 'binary';       // Float32 binary format

/**
 * Data range for export
 */
export type ExportRange = 'all' | 'visible' | 'selected';

/**
 * Compression options
 */
export type CompressionType = 'none' | 'gzip' | 'deflate';

// ============================================
// Export Options
// ============================================

/**
 * Options for column mapping
 */
export interface ColumnMapping {
  /** Source data key */
  source: 'x' | 'y' | 'y2' | 'yError' | 'open' | 'high' | 'low' | 'close';
  /** Output column name */
  name: string;
  /** Number format (e.g., 'fixed:6', 'exponential:3') */
  format?: string;
  /** Unit to append to header */
  unit?: string;
}

/**
 * Advanced export options
 */
export interface DataExportOptions {
  /** Format to export */
  format: ExportFormat;
  
  /** Series IDs to export (all if not specified) */
  seriesIds?: string[];
  
  /** Data range to export */
  range?: ExportRange;
  
  /** Include file headers/metadata */
  includeHeaders?: boolean;
  
  /** Include export timestamp */
  includeTimestamp?: boolean;
  
  /** Numeric precision (decimal places) */
  precision?: number;
  
  /** Column delimiter for CSV/TSV */
  delimiter?: string;
  
  /** Line ending style */
  lineEnding?: '\n' | '\r\n';
  
  /** Custom column mapping */
  columns?: ColumnMapping[];
  
  /** Include metadata as comments/headers */
  includeMetadata?: boolean;
  
  /** Metadata object to include */
  metadata?: Record<string, string | number | boolean>;
  
  /** Prettify JSON output */
  prettyPrint?: boolean;
  
  /** Scientific notation threshold */
  scientificThreshold?: number;
  
  /** Filename for download */
  filename?: string;
}

// ============================================
// Export Results
// ============================================

/**
 * Result of an export operation
 */
export interface ExportResult {
  /** Success status */
  success: boolean;
  
  /** Generated content (for string formats) */
  content?: string;
  
  /** Generated blob (for binary formats) */
  blob?: Blob;
  
  /** Content type (MIME type) */
  contentType: string;
  
  /** Suggested filename */
  filename: string;
  
  /** Number of series exported */
  seriesCount: number;
  
  /** Total points exported */
  pointCount: number;
  
  /** Export timestamp */
  timestamp: string;
  
  /** Any warnings during export */
  warnings?: string[];
  
  /** Error message if failed */
  error?: string;
}

// ============================================
// Format Configurations
// ============================================

/**
 * Format-specific configuration
 */
export interface FormatConfig {
  /** MIME type */
  mimeType: string;
  
  /** File extension */
  extension: string;
  
  /** BOM (Byte Order Mark) for Excel compatibility */
  bom?: string;
  
  /** Whether format supports binary data */
  binary?: boolean;
}

/**
 * MATLAB export structure
 */
export interface MatlabExportData {
  /** Variable name */
  name: string;
  
  /** Variable type */
  type: 'double' | 'single' | 'struct';
  
  /** Data values */
  data: number[] | MatlabExportData[];
  
  /** Dimensions */
  size: [number, number];
}

/**
 * Python/NumPy export structure
 */
export interface NumpyExportData {
  /** Array dtype */
  dtype: 'float32' | 'float64';
  
  /** Array shape */
  shape: number[];
  
  /** Flattened data (row-major) */
  data: number[];
  
  /** Variable name suggestion */
  name?: string;
}

// ============================================
// Plugin Configuration
// ============================================

/**
 * Configuration for PluginDataExport
 */
export interface PluginDataExportConfig {
  /** Enabled export formats */
  formats?: ExportFormat[];
  
  /** Default export format */
  defaultFormat?: ExportFormat;
  
  /** Default precision */
  defaultPrecision?: number;
  
  /** Include metadata by default */
  includeMetadata?: boolean;
  
  /** Auto-download on export */
  autoDownload?: boolean;
  
  /** Custom filename generator */
  filenameGenerator?: (format: ExportFormat, seriesIds: string[]) => string;
  
  /** Pre-export hook */
  beforeExport?: (options: DataExportOptions) => DataExportOptions | false;
  
  /** Post-export hook */
  afterExport?: (result: ExportResult) => void;
}

// ============================================
// Utility Types
// ============================================

/**
 * Series data with metadata for export
 */
export interface SeriesExportInfo {
  id: string;
  name?: string;
  type: string;
  data: SeriesData;
  pointCount: number;
  style: Record<string, unknown>;
  yAxisId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Export progress callback
 */
export type ExportProgressCallback = (progress: {
  current: number;
  total: number;
  phase: 'collecting' | 'formatting' | 'encoding' | 'complete';
}) => void;
