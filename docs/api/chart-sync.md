---
title: Chart Synchronization
description: Link multiple charts for synchronized zoom, pan, and cursor tracking
---

# Chart Synchronization

Link multiple charts together so they share zoom, pan, and cursor states. Perfect for dashboards with related data.

## Basic Usage

### Link Two Charts

```typescript
import { createChart, linkCharts } from 'velo-plot';

const chart1 = createChart({ container: document.getElementById('chart1') });
const chart2 = createChart({ container: document.getElementById('chart2') });

// Link charts - they now share the same X-axis view
const group = linkCharts(chart1, chart2);
```

### Create a Chart Group

```typescript
import { createChartGroup } from 'velo-plot';

const group = createChartGroup([chart1, chart2, chart3], {
  axis: 'x',           // Sync X-axis only (default)
  syncCursor: true,    // Share cursor position
  syncZoom: true,      // Share zoom state
  syncPan: true,       // Share pan movements
});
```

## Synchronization Options

### Axis Modes

```typescript
createChartGroup([chart1, chart2], {
  axis: 'x',    // Only X-axis synchronized
});

createChartGroup([chart1, chart2], {
  axis: 'y',    // Only Y-axis synchronized  
});

createChartGroup([chart1, chart2], {
  axis: 'xy',   // Both axes synchronized
});

createChartGroup([chart1, chart2], {
  axis: 'none', // No axis sync (cursor only)
});
```

### Cursor Sync

When you hover over one chart, the cursor position appears on all linked charts:

```typescript
createChartGroup([chart1, chart2], {
  syncCursor: true,  // Show cursor on all charts
});
```

### Master-Slave Relationship

One chart controls another, but not vice versa:

```typescript
import { createMasterSlave } from 'velo-plot';

// chart1 controls chart2, but chart2 doesn't affect chart1
const group = createMasterSlave(chart1, chart2, 'x');
```

## Managing Groups

### Add/Remove Charts

```typescript
const group = createChartGroup([chart1, chart2]);

// Add another chart
group.add(chart3);

// Remove a chart
group.remove(chart2);
```

### Sync All Charts to a View

```typescript
// Set all charts to the same view
group.syncTo({
  xMin: 0,
  xMax: 100,
  yMin: -1,
  yMax: 1,
});
```

### Reset All Charts

```typescript
// Reset all charts to auto-scale
group.resetAll();
```

### Check Group Status

```typescript
console.log(group.size());          // Number of charts
console.log(group.has(chart1));     // Is chart in group?
console.log(group.getCharts());     // Get all charts
```

### Cleanup

```typescript
// Destroy the group (charts remain, just unlinked)
group.destroy();
```

## Advanced Configuration

### Debounce Sync Events

For performance, debounce rapid sync updates:

```typescript
createChartGroup([chart1, chart2], {
  debounce: 16,  // Wait 16ms between sync updates
});
```

### Selection Sync

Sync selected data points across charts:

```typescript
createChartGroup([chart1, chart2], {
  syncSelection: true,
});
```

## Use Cases

### Multi-Timeframe Analysis

```typescript
// Same data at different zoom levels
const overview = createChart({ ... });  // Full dataset
const detail = createChart({ ... });    // Zoomed detail

createMasterSlave(overview, detail, 'x');
```

### Stacked Indicators

```typescript
// Price chart with separate RSI panel
const priceChart = createChart({ ... });
const rsiChart = createChart({ ... });

createChartGroup([priceChart, rsiChart], {
  axis: 'x',         // Sync time axis
  syncCursor: true,  // Show crosshair on both
});
```

### Multi-Sensor Dashboard

```typescript
// Multiple sensors sharing the same time window
const temp = createChart({ ... });
const pressure = createChart({ ... });
const humidity = createChart({ ... });

createChartGroup([temp, pressure, humidity], {
  axis: 'x',
  syncCursor: true,
});
```

## API Reference

### ChartGroup Class

```typescript
class ChartGroup {
  add(chart: ChartLike): this;
  addAll(...charts: ChartLike[]): this;
  remove(chart: ChartLike): this;
  getCharts(): ChartLike[];
  size(): number;
  has(chart: ChartLike): boolean;
  syncAxis(axis: SyncAxis): this;
  syncCursor(enabled: boolean): this;
  syncSelection(enabled: boolean): this;
  syncTo(bounds: Partial<Bounds>, excludeChartId?: string): void;
  resetAll(): void;
  clearAllSelections(): void;
  destroy(): void;
}
```

### SyncOptions

```typescript
interface SyncOptions {
  axis?: 'x' | 'y' | 'xy' | 'none';
  syncCursor?: boolean;      // Default: true
  syncSelection?: boolean;   // Default: false
  syncZoom?: boolean;        // Default: true
  syncPan?: boolean;         // Default: true
  debounce?: number;         // Default: 0
  bidirectional?: boolean;   // Default: true
}
```
