---
title: Data Export Plugin
description: Export chart data to CSV, JSON, MATLAB, Python, and binary formats
---

# Data Export Plugin

The **PluginDataExport** provides comprehensive data export capabilities for scientific chart data, supporting multiple formats commonly used in scientific and engineering workflows.

## Features

- **Multiple Formats**: CSV, TSV, JSON, MATLAB, Python/NumPy, Excel, Binary
- **Range Selection**: Export all data, visible range, or selected points
- **Metadata Support**: Include timestamps, chart bounds, and custom metadata
- **Scientific Notation**: Automatic formatting for large/small numbers
- **Direct Download**: One-click file download with auto-generation

## Installation

```typescript
import { createChart } from 'scichart-engine';
import { PluginDataExport } from 'scichart-engine/plugins/data-export';

const chart = createChart({ container });
chart.use(PluginDataExport({
  defaultFormat: 'csv',
  autoDownload: true
}));
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `formats` | `ExportFormat[]` | All formats | Enabled export formats |
| `defaultFormat` | `ExportFormat` | `'csv'` | Default format when not specified |
| `defaultPrecision` | `number` | `6` | Decimal places for numeric values |
| `includeMetadata` | `boolean` | `true` | Include metadata in exports |
| `autoDownload` | `boolean` | `false` | Automatically download on export |
| `filenameGenerator` | `function` | Built-in | Custom filename generator |
| `beforeExport` | `function` | - | Pre-export hook |
| `afterExport` | `function` | - | Post-export hook |

## API Reference

### `export(format, options)`

Export data to the specified format.

```typescript
const result = chart.export('csv', {
  seriesIds: ['voltage', 'current'],
  range: 'visible',
  precision: 8
});

if (result.success) {
  console.log('Exported', result.pointCount, 'points');
  console.log(result.content);
}
```

### `download(format, options)`

Export and immediately trigger a file download.

```typescript
chart.download('json', {
  seriesIds: ['signal'],
  includeMetadata: true,
  prettyPrint: true
});
```

### Convenience Methods

```typescript
// Export to specific formats
chart.toCSV();
chart.toJSON();
chart.toMATLAB();
chart.toPython();
chart.toExcel();
chart.toBinary();
```

## Export Options

```typescript
interface DataExportOptions {
  format: ExportFormat;
  seriesIds?: string[];           // Series to export (all if not specified)
  range?: 'all' | 'visible';      // Data range
  includeHeaders?: boolean;       // Include column headers
  includeTimestamp?: boolean;     // Include export timestamp
  precision?: number;             // Decimal places
  delimiter?: string;             // Column delimiter (CSV/TSV)
  lineEnding?: '\n' | '\r\n';     // Line ending style
  includeMetadata?: boolean;      // Include metadata
  metadata?: Record<string, any>; // Custom metadata
  prettyPrint?: boolean;          // Prettify JSON output
  filename?: string;              // Custom filename
}
```

## Supported Formats

### CSV / TSV

Standard comma or tab-separated values, compatible with Excel and most data tools.

```csv
# SciChart Engine Data Export
# Timestamp: 2026-01-13T21:00:00.000Z
voltage_x,voltage_y,current_x,current_y
0.000000,1.234567,0.000000,0.001234
0.001000,1.345678,0.001000,0.001345
```

### JSON

Full-featured JSON with metadata and structure information.

```json
{
  "version": "1.0",
  "exportDate": "2026-01-13T21:00:00.000Z",
  "format": "scichart-engine-json",
  "metadata": {
    "seriesCount": 2,
    "totalPoints": 1000
  },
  "series": [
    {
      "id": "voltage",
      "name": "Voltage",
      "type": "line",
      "data": {
        "x": [0, 0.001, 0.002],
        "y": [1.23, 1.34, 1.45]
      }
    }
  ]
}
```

### MATLAB

JSON format optimized for MATLAB's `jsondecode()` function.

```matlab
% Load in MATLAB:
data = jsondecode(fileread('export.mat.json'));
plot(data.variables(1).data, data.variables(2).data);
```

### Python / NumPy

JSON format with NumPy-compatible structure and loading instructions.

```python
# Load in Python:
import json
import numpy as np

with open('data.npy.json', 'r') as f:
    data = json.load(f)

x = np.array(data['arrays']['signal_x']['data'], dtype=np.float32)
y = np.array(data['arrays']['signal_y']['data'], dtype=np.float32)
```

### Excel (XLSX-compatible CSV)

CSV with UTF-8 BOM for proper Excel handling of international characters.

### Binary

Compact binary format using Float32 arrays for high-performance I/O.

## Examples

### Export Visible Data

```typescript
const result = chart.export('csv', {
  range: 'visible',
  includeHeaders: true,
  includeTimestamp: true
});
```

### Export with Custom Metadata

```typescript
chart.download('json', {
  includeMetadata: true,
  metadata: {
    experiment: 'CV-001',
    operator: 'John Doe',
    temperature: 25.0,
    electrodes: 'Pt/SCE'
  }
});
```

### Pre-export Validation

```typescript
chart.use(PluginDataExport({
  beforeExport: (options) => {
    if (!options.seriesIds || options.seriesIds.length === 0) {
      console.warn('No series selected, exporting all');
    }
    return options; // Return false to cancel
  }
}));
```

### Custom Filename

```typescript
chart.use(PluginDataExport({
  filenameGenerator: (format, seriesIds) => {
    const date = new Date().toISOString().split('T')[0];
    return `experiment_${seriesIds[0]}_${date}.${format}`;
  }
}));
```

## Export Result

All export methods return an `ExportResult` object:

```typescript
interface ExportResult {
  success: boolean;
  content?: string;           // Generated content
  blob?: Blob;                // Generated blob
  contentType: string;        // MIME type
  filename: string;           // Suggested filename
  seriesCount: number;        // Series exported
  pointCount: number;         // Total points exported
  timestamp: string;          // Export timestamp
  warnings?: string[];        // Any warnings
  error?: string;             // Error message if failed
}
```

## See Also

- [Analysis Plugin](/api/plugins#pluginanalysis) - Data analysis and processing
- [Clipboard Plugin](/api/plugins#pluginclipboard) - Copy data to clipboard
- [Chart API](/api/chart) - Chart configuration and data management
