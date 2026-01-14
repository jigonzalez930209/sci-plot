/**
 * SciChart Engine - Data Export Plugin
 * 
 * Advanced data export capabilities for scientific chart data.
 * Supports multiple formats including CSV, JSON, MATLAB, and Python.
 * 
 * @module plugins/data-export
 * 
 * @example
 * ```typescript
 * import { createChart } from 'scichart-engine';
 * import { PluginDataExport } from 'scichart-engine/plugins/data-export';
 * 
 * const chart = createChart({ container });
 * chart.use(PluginDataExport({
 *   defaultFormat: 'csv',
 *   autoDownload: true
 * }));
 * 
 * // Export visible data
 * const result = await chart.export('csv', { range: 'visible' });
 * 
 * // Export all data to MATLAB format
 * await chart.export('matlab', { 
 *   seriesIds: ['voltage', 'current'],
 *   includeMetadata: true 
 * });
 * ```
 */

import type { PluginManifest, ChartPlugin, PluginContext } from "../types";
import type { 
  PluginDataExportConfig, 
  DataExportOptions, 
  ExportResult,
  ExportFormat,
  SeriesExportInfo,
  ExportRange
} from "./types";
import { 
  FORMAT_CONFIGS,
  formatCSV, 
  formatJSON, 
  formatMATLAB, 
  formatPython,
  formatBinary
} from "./formatters";

// Re-export types
export * from "./types";

// ============================================
// Plugin Definition
// ============================================

const manifestDataExport: PluginManifest = {
  name: "scichart-data-export",
  version: "1.0.0",
  description: "Advanced data export capabilities for scichart-engine",
  author: "SciChart Engine Team",
  provides: ["export"],
  tags: ["export", "csv", "json", "matlab", "python", "data"],
};

/**
 * SciChart Engine Data Export Plugin
 * 
 * Provides comprehensive data export functionality with support for
 * multiple scientific and standard data formats.
 * 
 * @param config - Plugin configuration options
 * @returns ChartPlugin instance
 */
export function PluginDataExport(
  config: PluginDataExportConfig = {}
): ChartPlugin<PluginDataExportConfig> {
  
  const {
    formats = ['csv', 'tsv', 'json', 'matlab', 'python', 'xlsx', 'binary'],
    defaultFormat = 'csv',
    defaultPrecision = 6,
    includeMetadata = true,
    autoDownload = false,
    filenameGenerator,
    beforeExport,
    afterExport
  } = config;

  let _ctx: PluginContext | null = null;

  // ============================================
  // Internal Helpers
  // ============================================

  /**
   * Collect series data for export
   */
  function collectSeriesData(
    seriesIds?: string[],
    range?: ExportRange
  ): SeriesExportInfo[] {
    if (!_ctx) return [];

    const allSeries = _ctx.data.getAllSeries();
    const seriesToExport = seriesIds 
      ? allSeries.filter(s => seriesIds.includes(s.getId()))
      : allSeries;

    return seriesToExport.map(s => {
      let data = s.getData();
      
      // Filter by range if specified
      if (range === 'visible' && data) {
        const bounds = _ctx!.data.getViewBounds();
        const filteredIndices: number[] = [];
        
        for (let i = 0; i < data.x.length; i++) {
          if (data.x[i] >= bounds.xMin && data.x[i] <= bounds.xMax) {
            filteredIndices.push(i);
          }
        }
        
        if (filteredIndices.length > 0 && filteredIndices.length < data.x.length) {
          const newX = new Float32Array(filteredIndices.length);
          const newY = new Float32Array(filteredIndices.length);
          
          filteredIndices.forEach((idx, i) => {
            newX[i] = data!.x[idx];
            newY[i] = data!.y[idx];
          });
          
          data = { ...data, x: newX, y: newY };
        }
      }

      return {
        id: s.getId(),
        name: s.getName?.() ?? s.getId(),
        type: s.getType(),
        data: data || { x: new Float32Array(0), y: new Float32Array(0) },
        pointCount: data?.x.length ?? 0,
        style: s.getStyle() as Record<string, unknown>,
        yAxisId: s.getYAxisId?.()
      };
    });
  }

  /**
   * Generate filename based on format and content
   */
  function generateFilename(format: ExportFormat, seriesIds: string[]): string {
    if (filenameGenerator) {
      return filenameGenerator(format, seriesIds);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const seriesPart = seriesIds.length <= 3 
      ? seriesIds.join('_') 
      : `${seriesIds.length}_series`;
    
    const config = FORMAT_CONFIGS[format];
    return `scichart_${seriesPart}_${timestamp}${config.extension}`;
  }

  /**
   * Execute export operation
   */
  function doExport(options: DataExportOptions): ExportResult {
    const format = options.format ?? defaultFormat;
    const warnings: string[] = [];

    // Validate format
    if (!formats.includes(format)) {
      return {
        success: false,
        error: `Format '${format}' is not enabled. Available: ${formats.join(', ')}`,
        contentType: 'text/plain',
        filename: 'error.txt',
        seriesCount: 0,
        pointCount: 0,
        timestamp: new Date().toISOString()
      };
    }

    // Apply beforeExport hook
    let finalOptions: DataExportOptions = { ...options, precision: options.precision ?? defaultPrecision };
    if (beforeExport) {
      const hookResult = beforeExport(finalOptions);
      if (hookResult === false) {
        return {
          success: false,
          error: 'Export cancelled by beforeExport hook',
          contentType: 'text/plain',
          filename: 'cancelled.txt',
          seriesCount: 0,
          pointCount: 0,
          timestamp: new Date().toISOString()
        };
      }
      finalOptions = hookResult;
    }

    // Collect data
    const seriesData = collectSeriesData(finalOptions.seriesIds, finalOptions.range);
    
    if (seriesData.length === 0) {
      warnings.push('No series data found to export');
    }

    const totalPoints = seriesData.reduce((sum, s) => sum + s.pointCount, 0);
    const formatConfig = FORMAT_CONFIGS[format];
    const filename = finalOptions.filename ?? generateFilename(format, seriesData.map(s => s.id));

    let content: string | undefined;
    let blob: Blob | undefined;

    try {
      // Format data
      switch (format) {
        case 'csv':
        case 'tsv':
        case 'xlsx':
          content = formatCSV(seriesData, { ...finalOptions, format });
          break;
          
        case 'json':
          content = formatJSON(
            seriesData, 
            finalOptions,
            _ctx?.data.getViewBounds()
          );
          break;
          
        case 'matlab':
          content = formatMATLAB(seriesData, finalOptions);
          break;
          
        case 'python':
          content = formatPython(seriesData, finalOptions);
          break;
          
        case 'binary':
          const buffer = formatBinary(seriesData);
          blob = new Blob([buffer], { type: formatConfig.mimeType });
          break;
      }

      // Create blob for string content
      if (content && !blob) {
        blob = new Blob([content], { type: formatConfig.mimeType });
      }

    } catch (error) {
      return {
        success: false,
        error: `Export failed: ${(error as Error).message}`,
        contentType: 'text/plain',
        filename: 'error.txt',
        seriesCount: seriesData.length,
        pointCount: totalPoints,
        timestamp: new Date().toISOString()
      };
    }

    const result: ExportResult = {
      success: true,
      content,
      blob,
      contentType: formatConfig.mimeType,
      filename,
      seriesCount: seriesData.length,
      pointCount: totalPoints,
      timestamp: new Date().toISOString(),
      warnings: warnings.length > 0 ? warnings : undefined
    };

    // Apply afterExport hook
    if (afterExport) {
      afterExport(result);
    }

    return result;
  }

  /**
   * Download a blob as a file
   */
  function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ============================================
  // Plugin Implementation
  // ============================================

  return {
    manifest: manifestDataExport,

    onInit(ctx: PluginContext) {
      _ctx = ctx;
      ctx.log.info(`DataExport plugin initialized with formats: ${formats.join(', ')}`);
    },

    onDestroy() {
      _ctx = null;
    },

    api: {
      /**
       * Export chart data to specified format
       * 
       * @param format - Export format
       * @param options - Export options
       * @returns Export result with content/blob
       */
      export(format: ExportFormat, options: Partial<DataExportOptions> = {}): ExportResult {
        const fullOptions: DataExportOptions = {
          format,
          includeHeaders: true,
          includeTimestamp: true,
          includeMetadata,
          prettyPrint: true,
          ...options
        };

        const result = doExport(fullOptions);

        // Auto download if enabled and successful
        if (autoDownload && result.success && result.blob) {
          downloadBlob(result.blob, result.filename);
        }

        return result;
      },

      /**
       * Export and immediately download
       * 
       * @param format - Export format
       * @param options - Export options
       */
      download(format: ExportFormat, options: Partial<DataExportOptions> = {}): ExportResult {
        const fullOptions: DataExportOptions = {
          format,
          includeHeaders: true,
          includeTimestamp: true,
          includeMetadata,
          prettyPrint: true,
          ...options
        };
        const result = doExport(fullOptions);
        
        if (result.success && result.blob) {
          downloadBlob(result.blob, result.filename);
        }
        
        return result;
      },

      /**
       * Export to CSV format
       */
      toCSV(options: Partial<DataExportOptions> = {}): ExportResult {
        return doExport({ format: 'csv', includeHeaders: true, includeTimestamp: true, includeMetadata, prettyPrint: true, ...options });
      },

      /**
       * Export to JSON format
       */
      toJSON(options: Partial<DataExportOptions> = {}): ExportResult {
        return doExport({ format: 'json', includeHeaders: true, includeTimestamp: true, includeMetadata, prettyPrint: true, ...options });
      },

      /**
       * Export to MATLAB format
       */
      toMATLAB(options: Partial<DataExportOptions> = {}): ExportResult {
        return doExport({ format: 'matlab', includeHeaders: true, includeTimestamp: true, includeMetadata, prettyPrint: true, ...options });
      },

      /**
       * Export to Python/NumPy format
       */
      toPython(options: Partial<DataExportOptions> = {}): ExportResult {
        return doExport({ format: 'python', includeHeaders: true, includeTimestamp: true, includeMetadata, prettyPrint: true, ...options });
      },

      /**
       * Export to Excel-compatible CSV
       */
      toExcel(options: Partial<DataExportOptions> = {}): ExportResult {
        return doExport({ format: 'xlsx', includeHeaders: true, includeTimestamp: true, includeMetadata, prettyPrint: true, ...options });
      },

      /**
       * Export to binary format
       */
      toBinary(options: Partial<DataExportOptions> = {}): ExportResult {
        return doExport({ format: 'binary', includeHeaders: true, includeTimestamp: true, includeMetadata, prettyPrint: true, ...options });
      },

      /**
       * Get available export formats
       */
      getFormats(): ExportFormat[] {
        return [...formats];
      },

      /**
       * Check if a format is supported
       */
      supportsFormat(format: ExportFormat): boolean {
        return formats.includes(format);
      },

      /**
       * Get format configuration
       */
      getFormatConfig(format: ExportFormat) {
        return FORMAT_CONFIGS[format];
      }
    }
  };
}

export default PluginDataExport;
