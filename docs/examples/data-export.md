---
title: Data Export Demo
description: Export chart data to CSV, JSON, MATLAB, Python and more formats
---

<script setup>
import DataExportDemo from '../.vitepress/theme/demos/DataExportDemo.vue'
</script>

# Data Export Demo

Export chart data to multiple scientific and standard formats. The **PluginDataExport** provides comprehensive export capabilities for scientific workflows.

<DataExportDemo />

## Features Demonstrated

### Supported Formats
- **CSV** - Standard comma-separated values
- **TSV** - Tab-separated values
- **JSON** - Structured JSON with metadata
- **Excel** - CSV with UTF-8 BOM for Excel compatibility
- **MATLAB** - JSON format compatible with `jsondecode()`
- **Python** - NumPy-compatible JSON structure
- **Binary** - Float32 binary for high-performance I/O

### Export Options
- Export all data or only visible range
- Include/exclude metadata and timestamps
- Configurable numeric precision
- Custom filenames

## Basic Usage

```typescript
import { createChart } from 'scichart-engine';
import { PluginDataExport } from 'scichart-engine/plugins/data-export';

const chart = createChart({
  container: document.getElementById('chart'),
  title: 'Export Demo'
});

// Add the plugin
chart.use(PluginDataExport({
  defaultFormat: 'csv',
  autoDownload: false
}));

// Add some data
chart.addSeries({
  id: 'signal',
  type: 'line',
  data: { x: [0, 1, 2, 3], y: [1.2, 3.4, 2.1, 4.5] }
});

// Export to different formats
const csvResult = chart.export('csv');
const jsonResult = chart.export('json', { prettyPrint: true });

// Export visible range only
chart.download('matlab', { range: 'visible' });
```

## Format Examples

### CSV Output
```csv
signal_x,signal_y
0.000000,1.200000
1.000000,3.400000
2.000000,2.100000
3.000000,4.500000
```

### JSON Output
```json
{
  "version": "1.0",
  "exportDate": "2026-01-13T21:00:00.000Z",
  "series": [
    {
      "id": "signal",
      "name": "Signal",
      "type": "line",
      "data": {
        "x": [0, 1, 2, 3],
        "y": [1.2, 3.4, 2.1, 4.5]
      }
    }
  ]
}
```

### MATLAB Usage
```matlab
% Load in MATLAB
data = jsondecode(fileread('export.mat.json'));

% Access variables
x = data.variables(1).data;
y = data.variables(2).data;

% Plot
plot(x, y);
title('Imported from SciChart Engine');
```

### Python Usage
```python
import json
import numpy as np

# Load data
with open('data.npy.json', 'r') as f:
    data = json.load(f)

# Access arrays
x = np.array(data['arrays']['signal_x']['data'], dtype=np.float32)
y = np.array(data['arrays']['signal_y']['data'], dtype=np.float32)

# Plot
import matplotlib.pyplot as plt
plt.plot(x, y)
plt.title('Imported from SciChart Engine')
plt.show()
```

## Plugin Configuration

```typescript
interface PluginDataExportConfig {
  // Enabled export formats
  formats?: ExportFormat[];
  
  // Default format when not specified
  defaultFormat?: ExportFormat;
  
  // Decimal places for numbers
  defaultPrecision?: number;
  
  // Include metadata by default
  includeMetadata?: boolean;
  
  // Auto-download on export
  autoDownload?: boolean;
  
  // Custom filename generator
  filenameGenerator?: (format, seriesIds) => string;
  
  // Pre-export hook (return false to cancel)
  beforeExport?: (options) => options | false;
  
  // Post-export callback
  afterExport?: (result) => void;
}
```

## See Also

- [Data Export Plugin API](/api/plugin-data-export) - Complete API reference
- [Chart API](/api/chart) - Core chart configuration
- [Analysis Plugin](/api/analysis) - Data analysis before export
