/**
 * Data Export Formatters
 * 
 * Handles conversion of chart data to various output formats.
 * 
 * @module plugins/data-export/formatters
 */

import type { 
  DataExportOptions, 
  ExportFormat, 
  FormatConfig,
  SeriesExportInfo,
  MatlabExportData,
  NumpyExportData
} from "./types";

// ============================================
// Format Configurations
// ============================================

export const FORMAT_CONFIGS: Record<ExportFormat, FormatConfig> = {
  csv: {
    mimeType: 'text/csv',
    extension: '.csv'
  },
  tsv: {
    mimeType: 'text/tab-separated-values',
    extension: '.tsv'
  },
  json: {
    mimeType: 'application/json',
    extension: '.json'
  },
  matlab: {
    mimeType: 'application/json',
    extension: '.mat.json'
  },
  python: {
    mimeType: 'application/json',
    extension: '.npy.json'
  },
  xlsx: {
    mimeType: 'text/csv;charset=utf-8',
    extension: '.csv',
    bom: '\uFEFF' // UTF-8 BOM for Excel
  },
  binary: {
    mimeType: 'application/octet-stream',
    extension: '.bin',
    binary: true
  }
};

// ============================================
// CSV/TSV Formatter
// ============================================

/**
 * Format data as CSV or TSV
 */
export function formatCSV(
  seriesData: SeriesExportInfo[],
  options: DataExportOptions
): string {
  const {
    delimiter = options.format === 'tsv' ? '\t' : ',',
    lineEnding = '\n',
    includeHeaders = true,
    includeTimestamp = false,
    includeMetadata = false,
    metadata = {},
    precision = 6,
    scientificThreshold = 1e6
  } = options;

  const lines: string[] = [];
  const bom = options.format === 'xlsx' ? FORMAT_CONFIGS.xlsx.bom : '';

  // Add metadata as comments (if supported)
  if (includeMetadata && Object.keys(metadata).length > 0) {
    lines.push(`# SciChart Engine Data Export`);
    if (includeTimestamp) {
      lines.push(`# Timestamp: ${new Date().toISOString()}`);
    }
    Object.entries(metadata).forEach(([key, value]) => {
      lines.push(`# ${key}: ${value}`);
    });
    lines.push('');
  }

  // Generate headers
  if (includeHeaders) {
    const headers: string[] = [];
    seriesData.forEach(s => {
      const prefix = seriesData.length > 1 ? `${s.name || s.id}_` : '';
      headers.push(`${prefix}x`, `${prefix}y`);
      
      // Add additional columns if present
      if (s.data.y2) headers.push(`${prefix}y2`);
      if (s.data.yError) headers.push(`${prefix}yError`);
      if (s.data.open) headers.push(`${prefix}open`, `${prefix}high`, `${prefix}low`, `${prefix}close`);
    });
    lines.push(headers.join(delimiter));
  }

  // Find max length
  const maxLength = Math.max(...seriesData.map(s => s.data.x.length));

  // Generate data rows
  for (let i = 0; i < maxLength; i++) {
    const row: string[] = [];
    
    seriesData.forEach(s => {
      const { x, y, y2, yError, open, high, low, close } = s.data;
      
      if (i < x.length) {
        row.push(
          formatNumber(x[i], precision, scientificThreshold),
          formatNumber(y[i], precision, scientificThreshold)
        );
        if (y2) row.push(formatNumber(y2[i], precision, scientificThreshold));
        if (yError) row.push(formatNumber(yError[i], precision, scientificThreshold));
        if (open && high && low && close) {
          row.push(
            formatNumber(open[i], precision, scientificThreshold),
            formatNumber(high[i], precision, scientificThreshold),
            formatNumber(low[i], precision, scientificThreshold),
            formatNumber(close[i], precision, scientificThreshold)
          );
        }
      } else {
        row.push('', '');
        if (s.data.y2) row.push('');
        if (s.data.yError) row.push('');
        if (s.data.open) row.push('', '', '', '');
      }
    });
    
    lines.push(row.join(delimiter));
  }

  return bom + lines.join(lineEnding);
}

// ============================================
// JSON Formatter
// ============================================

/**
 * Format data as JSON
 */
export function formatJSON(
  seriesData: SeriesExportInfo[],
  options: DataExportOptions,
  viewBounds?: { xMin: number; xMax: number; yMin: number; yMax: number }
): string {
  const {
    precision = 6,
    prettyPrint = true,
    includeMetadata = true,
    metadata = {}
  } = options;

  const exportData: Record<string, unknown> = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    format: 'scichart-engine-json'
  };

  if (includeMetadata) {
    exportData.metadata = {
      ...metadata,
      seriesCount: seriesData.length,
      totalPoints: seriesData.reduce((sum, s) => sum + s.pointCount, 0)
    };
  }

  if (viewBounds) {
    exportData.viewBounds = viewBounds;
  }

  exportData.series = seriesData.map(s => ({
    id: s.id,
    name: s.name || s.id,
    type: s.type,
    pointCount: s.pointCount,
    yAxisId: s.yAxisId,
    style: s.style,
    data: {
      x: roundArray(Array.from(s.data.x), precision),
      y: roundArray(Array.from(s.data.y), precision),
      ...(s.data.y2 && { y2: roundArray(Array.from(s.data.y2), precision) }),
      ...(s.data.yError && { yError: roundArray(Array.from(s.data.yError), precision) }),
      ...(s.data.open && { 
        open: roundArray(Array.from(s.data.open), precision),
        high: roundArray(Array.from(s.data.high!), precision),
        low: roundArray(Array.from(s.data.low!), precision),
        close: roundArray(Array.from(s.data.close!), precision)
      })
    }
  }));

  return JSON.stringify(exportData, null, prettyPrint ? 2 : undefined);
}

// ============================================
// MATLAB Format
// ============================================

/**
 * Format data for MATLAB compatibility
 * Outputs JSON that can be easily loaded in MATLAB using jsondecode()
 */
export function formatMATLAB(
  seriesData: SeriesExportInfo[],
  options: DataExportOptions
): string {
  const { precision = 6, prettyPrint = true } = options;

  const matlabData: {
    format: string;
    version: string;
    created: string;
    variables: MatlabExportData[];
  } = {
    format: 'matlab-compatible-json',
    version: '1.0',
    created: new Date().toISOString(),
    variables: []
  };

  seriesData.forEach(s => {
    const xData = roundArray(Array.from(s.data.x), precision);
    const yData = roundArray(Array.from(s.data.y), precision);
    const safeName = sanitizeVariableName(s.name || s.id);

    // Create x variable
    matlabData.variables.push({
      name: `${safeName}_x`,
      type: 'double',
      size: [xData.length, 1],
      data: xData
    });

    // Create y variable
    matlabData.variables.push({
      name: `${safeName}_y`,
      type: 'double',
      size: [yData.length, 1],
      data: yData
    });

    // Create combined matrix variable
    matlabData.variables.push({
      name: safeName,
      type: 'double',
      size: [xData.length, 2],
      data: interleaveArrays(xData, yData)
    });
  });

  return JSON.stringify(matlabData, null, prettyPrint ? 2 : undefined);
}

// ============================================
// Python/NumPy Format
// ============================================

/**
 * Format data for Python/NumPy compatibility
 * Outputs JSON that can be easily loaded in Python
 */
export function formatPython(
  seriesData: SeriesExportInfo[],
  options: DataExportOptions
): string {
  const { precision = 6, prettyPrint = true } = options;

  const pythonData: {
    format: string;
    version: string;
    created: string;
    import_code: string;
    arrays: Record<string, NumpyExportData>;
  } = {
    format: 'numpy-compatible-json',
    version: '1.0',
    created: new Date().toISOString(),
    import_code: `
# Load data in Python:
import json
import numpy as np

with open('data.npy.json', 'r') as f:
    data = json.load(f)

# Access arrays:
# x = np.array(data['arrays']['series_name']['x']['data'], dtype=np.float32)
# y = np.array(data['arrays']['series_name']['y']['data'], dtype=np.float32)
`.trim(),
    arrays: {}
  };

  seriesData.forEach(s => {
    const safeName = sanitizeVariableName(s.name || s.id);
    const xData = roundArray(Array.from(s.data.x), precision);
    const yData = roundArray(Array.from(s.data.y), precision);

    pythonData.arrays[safeName] = {
      dtype: 'float32',
      shape: [xData.length, 2],
      data: interleaveArrays(xData, yData),
      name: safeName
    };

    // Also provide separate x and y arrays
    pythonData.arrays[`${safeName}_x`] = {
      dtype: 'float32',
      shape: [xData.length],
      data: xData,
      name: `${safeName}_x`
    };

    pythonData.arrays[`${safeName}_y`] = {
      dtype: 'float32',
      shape: [yData.length],
      data: yData,
      name: `${safeName}_y`
    };
  });

  return JSON.stringify(pythonData, null, prettyPrint ? 2 : undefined);
}

// ============================================
// Binary Format
// ============================================

/**
 * Format data as binary Float32Array
 * 
 * Binary format structure:
 * - Header (32 bytes): magic number, version, series count, reserved
 * - Per series: name length (4 bytes), name (UTF-8), point count (4 bytes), x data, y data
 */
export function formatBinary(
  seriesData: SeriesExportInfo[]
): ArrayBuffer {
  // Calculate total size
  let totalSize = 32; // Header
  
  seriesData.forEach(s => {
    const nameBytes = new TextEncoder().encode(s.name || s.id);
    totalSize += 4 + nameBytes.length; // name length + name
    totalSize += 4; // point count
    totalSize += s.data.x.length * 4 * 2; // x and y as Float32
  });
  
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const encoder = new TextEncoder();
  
  let offset = 0;
  
  // Header
  // Magic number: "SCE1" (SciChart Engine v1)
  view.setUint8(offset++, 0x53); // S
  view.setUint8(offset++, 0x43); // C
  view.setUint8(offset++, 0x45); // E
  view.setUint8(offset++, 0x31); // 1
  
  // Version
  view.setUint32(offset, 1, true); offset += 4;
  
  // Series count
  view.setUint32(offset, seriesData.length, true); offset += 4;
  
  // Timestamp (milliseconds since epoch)
  const timestamp = Math.floor(Date.now() / 1000);
  view.setUint32(offset, timestamp, true); offset += 4;
  
  // Reserved (16 bytes)
  offset += 16;
  
  // Series data
  seriesData.forEach(s => {
    const nameBytes = encoder.encode(s.name || s.id);
    
    // Name length
    view.setUint32(offset, nameBytes.length, true); offset += 4;
    
    // Name
    new Uint8Array(buffer, offset, nameBytes.length).set(nameBytes);
    offset += nameBytes.length;
    
    // Point count
    const pointCount = s.data.x.length;
    view.setUint32(offset, pointCount, true); offset += 4;
    
    // X data
    const xFloat32 = new Float32Array(buffer, offset, pointCount);
    for (let i = 0; i < pointCount; i++) {
      xFloat32[i] = s.data.x[i];
    }
    offset += pointCount * 4;
    
    // Y data
    const yFloat32 = new Float32Array(buffer, offset, pointCount);
    for (let i = 0; i < pointCount; i++) {
      yFloat32[i] = s.data.y[i];
    }
    offset += pointCount * 4;
  });
  
  return buffer;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Format a number with appropriate precision
 */
function formatNumber(value: number, precision: number, scientificThreshold: number): string {
  if (!isFinite(value)) {
    return isNaN(value) ? 'NaN' : (value > 0 ? 'Inf' : '-Inf');
  }
  
  const absValue = Math.abs(value);
  if (absValue !== 0 && (absValue >= scientificThreshold || absValue < 1e-4)) {
    return value.toExponential(precision);
  }
  
  return value.toFixed(precision);
}

/**
 * Round array values to specified precision
 */
function roundArray(arr: number[], precision: number): number[] {
  const factor = Math.pow(10, precision);
  return arr.map(v => Math.round(v * factor) / factor);
}

/**
 * Sanitize string for use as variable name
 */
function sanitizeVariableName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^[0-9]/, '_$&')
    .substring(0, 63);
}

/**
 * Interleave two arrays [a0, b0, a1, b1, ...]
 */
function interleaveArrays(a: number[], b: number[]): number[] {
  const result: number[] = [];
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (i < a.length) result.push(a[i]);
    if (i < b.length) result.push(b[i]);
  }
  return result;
}
