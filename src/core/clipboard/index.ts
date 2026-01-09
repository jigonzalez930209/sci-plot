/**
 * SciChart Engine - Clipboard Module
 * 
 * Provides clipboard operations for copying chart data to various formats.
 * Supports copying selected points, visible data, or all data.
 * 
 * @module clipboard
 */

// ============================================
// Types
// ============================================

export type ClipboardFormat = 'tsv' | 'csv' | 'json' | 'markdown';

export interface ClipboardOptions {
  /** Output format (default: 'tsv' - Excel compatible) */
  format?: ClipboardFormat;
  /** Include column headers (default: true) */
  includeHeaders?: boolean;
  /** Decimal precision (default: 6) */
  precision?: number;
  /** Use scientific notation for very large/small numbers (default: true) */
  scientific?: boolean;
  /** Scientific notation threshold (default: 1e6) */
  scientificThreshold?: number;
  /** Custom column separator (overrides format default) */
  separator?: string;
  /** Custom line separator (default: '\n') */
  lineSeparator?: string;
  /** Include series name in output (default: true for multi-series) */
  includeSeriesName?: boolean;
  /** Custom header names */
  headers?: {
    x?: string;
    y?: string;
    series?: string;
  };
}

export interface ClipboardDataPoint {
  x: number;
  y: number;
  seriesId?: string;
  seriesName?: string;
  index?: number;
}

export interface ClipboardResult {
  /** Whether the copy was successful */
  success: boolean;
  /** Number of points copied */
  pointCount: number;
  /** Number of series included */
  seriesCount: number;
  /** The formatted text that was copied */
  text?: string;
  /** Error message if failed */
  error?: string;
}

// ============================================
// Format Helpers
// ============================================

const FORMAT_CONFIGS: Record<ClipboardFormat, { separator: string; quote: boolean; extension: string }> = {
  tsv: { separator: '\t', quote: false, extension: 'tsv' },
  csv: { separator: ',', quote: true, extension: 'csv' },
  json: { separator: '', quote: false, extension: 'json' },
  markdown: { separator: ' | ', quote: false, extension: 'md' },
};

// ============================================
// Clipboard Manager
// ============================================

export class ClipboardManager {
  private defaultOptions: ClipboardOptions = {
    format: 'tsv',
    includeHeaders: true,
    precision: 6,
    scientific: true,
    scientificThreshold: 1e6,
    lineSeparator: '\n',
    includeSeriesName: false,
  };

  constructor(options?: Partial<ClipboardOptions>) {
    if (options) {
      this.defaultOptions = { ...this.defaultOptions, ...options };
    }
  }

  /**
   * Copy data points to clipboard
   */
  async copyPoints(
    points: ClipboardDataPoint[],
    options?: Partial<ClipboardOptions>
  ): Promise<ClipboardResult> {
    const opts = { ...this.defaultOptions, ...options };
    
    if (!points || points.length === 0) {
      return {
        success: false,
        pointCount: 0,
        seriesCount: 0,
        error: 'No data points to copy',
      };
    }

    try {
      const text = this.formatPoints(points, opts);
      await this.writeToClipboard(text);

      const seriesIds = new Set(points.map(p => p.seriesId).filter(Boolean));
      
      return {
        success: true,
        pointCount: points.length,
        seriesCount: seriesIds.size || 1,
        text,
      };
    } catch (error) {
      return {
        success: false,
        pointCount: 0,
        seriesCount: 0,
        error: error instanceof Error ? error.message : 'Failed to copy to clipboard',
      };
    }
  }

  /**
   * Copy series data to clipboard
   */
  async copySeries(
    seriesData: { id: string; name?: string; x: Float32Array | Float64Array; y: Float32Array | Float64Array }[],
    options?: Partial<ClipboardOptions>
  ): Promise<ClipboardResult> {
    const points: ClipboardDataPoint[] = [];
    
    for (const series of seriesData) {
      for (let i = 0; i < series.x.length; i++) {
        points.push({
          x: series.x[i],
          y: series.y[i],
          seriesId: series.id,
          seriesName: series.name || series.id,
          index: i,
        });
      }
    }

    // Enable series name if multiple series
    const opts = { ...options };
    if (seriesData.length > 1 && opts.includeSeriesName === undefined) {
      opts.includeSeriesName = true;
    }

    return this.copyPoints(points, opts);
  }

  /**
   * Format data points to string
   */
  formatPoints(points: ClipboardDataPoint[], options: ClipboardOptions): string {
    const format = options.format || 'tsv';
    
    if (format === 'json') {
      return this.formatAsJson(points, options);
    }
    
    if (format === 'markdown') {
      return this.formatAsMarkdown(points, options);
    }

    return this.formatAsDelimited(points, options);
  }

  /**
   * Format as delimited text (TSV/CSV)
   */
  private formatAsDelimited(points: ClipboardDataPoint[], options: ClipboardOptions): string {
    const format = options.format || 'tsv';
    const config = FORMAT_CONFIGS[format];
    const separator = options.separator || config.separator;
    const lineSeparator = options.lineSeparator || '\n';
    const lines: string[] = [];

    // Headers
    if (options.includeHeaders) {
      const headerParts: string[] = [];
      if (options.includeSeriesName) {
        headerParts.push(options.headers?.series || 'Series');
      }
      headerParts.push(options.headers?.x || 'X');
      headerParts.push(options.headers?.y || 'Y');
      lines.push(headerParts.join(separator));
    }

    // Data rows
    for (const point of points) {
      const rowParts: string[] = [];
      
      if (options.includeSeriesName) {
        const seriesName = point.seriesName || point.seriesId || '';
        rowParts.push(config.quote ? `"${seriesName}"` : seriesName);
      }
      
      rowParts.push(this.formatNumber(point.x, options));
      rowParts.push(this.formatNumber(point.y, options));
      
      lines.push(rowParts.join(separator));
    }

    return lines.join(lineSeparator);
  }

  /**
   * Format as JSON
   */
  private formatAsJson(points: ClipboardDataPoint[], options: ClipboardOptions): string {
    const data = points.map(p => {
      const obj: Record<string, unknown> = {
        x: this.roundNumber(p.x, options.precision || 6),
        y: this.roundNumber(p.y, options.precision || 6),
      };
      if (options.includeSeriesName && p.seriesId) {
        obj.series = p.seriesName || p.seriesId;
      }
      return obj;
    });

    return JSON.stringify(data, null, 2);
  }

  /**
   * Format as Markdown table
   */
  private formatAsMarkdown(points: ClipboardDataPoint[], options: ClipboardOptions): string {
    const lines: string[] = [];
    const separator = ' | ';

    // Header
    const headerParts: string[] = [];
    if (options.includeSeriesName) {
      headerParts.push(options.headers?.series || 'Series');
    }
    headerParts.push(options.headers?.x || 'X');
    headerParts.push(options.headers?.y || 'Y');
    
    lines.push('| ' + headerParts.join(separator) + ' |');
    
    // Separator row
    const sepRow = headerParts.map(() => '---');
    lines.push('| ' + sepRow.join(separator) + ' |');

    // Data rows
    for (const point of points) {
      const rowParts: string[] = [];
      
      if (options.includeSeriesName) {
        rowParts.push(point.seriesName || point.seriesId || '');
      }
      
      rowParts.push(this.formatNumber(point.x, options));
      rowParts.push(this.formatNumber(point.y, options));
      
      lines.push('| ' + rowParts.join(separator) + ' |');
    }

    return lines.join('\n');
  }

  /**
   * Format a number for output
   */
  private formatNumber(value: number, options: ClipboardOptions): string {
    const precision = options.precision ?? 6;
    const threshold = options.scientificThreshold ?? 1e6;

    if (!isFinite(value)) {
      return value.toString();
    }

    // Use scientific notation for very large or very small numbers
    if (options.scientific && (Math.abs(value) >= threshold || (Math.abs(value) < 1e-4 && value !== 0))) {
      return value.toExponential(precision);
    }

    return this.roundNumber(value, precision).toString();
  }

  /**
   * Round a number to specified precision
   */
  private roundNumber(value: number, precision: number): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  /**
   * Write text to system clipboard
   */
  private async writeToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      this.fallbackCopyToClipboard(text);
    }
  }

  /**
   * Fallback clipboard copy using hidden textarea
   */
  private fallbackCopyToClipboard(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
  }

  /**
   * Read from clipboard (for paste functionality)
   */
  async readFromClipboard(): Promise<string | null> {
    if (navigator.clipboard && navigator.clipboard.readText) {
      try {
        return await navigator.clipboard.readText();
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Parse clipboard text to data points
   */
  parseClipboardData(text: string, format?: ClipboardFormat): ClipboardDataPoint[] {
    const points: ClipboardDataPoint[] = [];
    
    // Try to detect format
    const detectedFormat = format || this.detectFormat(text);
    
    if (detectedFormat === 'json') {
      return this.parseJson(text);
    }

    // Parse as delimited
    const lines = text.trim().split(/\r?\n/);
    const separator = detectedFormat === 'csv' ? ',' : detectedFormat === 'tsv' ? '\t' : ',';
    
    // Skip header if present
    const hasHeader = lines.length > 0 && /^[a-zA-Z]/.test(lines[0].trim());
    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(separator).map(p => p.trim().replace(/^"|"$/g, ''));
      
      if (parts.length >= 2) {
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        
        if (!isNaN(x) && !isNaN(y)) {
          points.push({ x, y, index: i - startIndex });
        }
      }
    }

    return points;
  }

  /**
   * Detect format from text content
   */
  private detectFormat(text: string): ClipboardFormat {
    const trimmed = text.trim();
    
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      return 'json';
    }
    
    if (trimmed.includes('\t')) {
      return 'tsv';
    }
    
    if (trimmed.includes(' | ')) {
      return 'markdown';
    }
    
    return 'csv';
  }

  /**
   * Parse JSON data
   */
  private parseJson(text: string): ClipboardDataPoint[] {
    try {
      const data = JSON.parse(text);
      const points: ClipboardDataPoint[] = [];
      const items = Array.isArray(data) ? data : [data];
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (typeof item.x === 'number' && typeof item.y === 'number') {
          points.push({
            x: item.x,
            y: item.y,
            seriesId: item.series || item.seriesId,
            seriesName: item.seriesName || item.series,
            index: i,
          });
        }
      }
      
      return points;
    } catch {
      return [];
    }
  }

  /**
   * Set default options
   */
  setDefaults(options: Partial<ClipboardOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  /**
   * Get current default options
   */
  getDefaults(): ClipboardOptions {
    return { ...this.defaultOptions };
  }
}

// ============================================
// Convenience Functions
// ============================================

/** Singleton instance for global use */
let globalClipboardManager: ClipboardManager | null = null;

/**
 * Get the global clipboard manager instance
 */
export function getClipboardManager(): ClipboardManager {
  if (!globalClipboardManager) {
    globalClipboardManager = new ClipboardManager();
  }
  return globalClipboardManager;
}

/**
 * Copy data points to clipboard (convenience function)
 */
export async function copyToClipboard(
  points: ClipboardDataPoint[],
  options?: Partial<ClipboardOptions>
): Promise<ClipboardResult> {
  return getClipboardManager().copyPoints(points, options);
}

/**
 * Format data as delimited string (without copying)
 */
export function formatData(
  points: ClipboardDataPoint[],
  options?: Partial<ClipboardOptions>
): string {
  const manager = getClipboardManager();
  return manager.formatPoints(points, { ...manager.getDefaults(), ...options });
}
