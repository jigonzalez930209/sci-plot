---
title: Chart Synchronization Demo
description: Link multiple charts for synchronized zoom, pan, and cursor tracking
---

<script setup>
import ChartSyncDemo from '../.vitepress/theme/demos/ChartSyncDemo.vue'
</script>

# Chart Synchronization Demo

Link multiple charts together so they share the same view. Try zooming or panning one chart - the other follows!

<ChartSyncDemo />

## Sync Modes

| Mode | Description |
|------|-------------|
| **X-Axis Sync** | Charts share the same X range (time axis) |
| **Y-Axis Sync** | Charts share the same Y range (value axis) |
| **Both Axes** | Full viewport synchronization |
| **No Sync** | Charts are independent |

## Cursor Sync

When enabled, hovering over one chart shows the cursor position on all linked charts. This is useful for comparing values at the same time point across different datasets.

## Usage

```typescript
import { createChart, createChartGroup, linkCharts } from 'sci-plot';

// Create two charts
const chart1 = createChart({ container: document.getElementById('chart1') });
const chart2 = createChart({ container: document.getElementById('chart2') });

// Simple linking (X-axis sync with cursor)
const group = linkCharts(chart1, chart2);

// Or with full options
const group = createChartGroup([chart1, chart2], {
  axis: 'x',           // 'x', 'y', 'xy', or 'none'
  syncCursor: true,    // Share cursor position
  syncZoom: true,      // Share zoom state
  syncPan: true,       // Share pan movements
  debounce: 16,        // Optional debounce (ms)
});

// Sync all charts to specific view
group.syncTo({ xMin: 0, xMax: 100 });

// Reset all to auto-scale
group.resetAll();

// Cleanup when done
group.destroy();
```

## Use Cases

### Multi-Timeframe Analysis
```typescript
const overview = createChart({ ... });  // Full dataset
const detail = createChart({ ... });    // Zoomed view
createMasterSlave(overview, detail, 'x');
```

### Multi-Sensor Dashboard
```typescript
// Multiple sensors sharing the same time window
createChartGroup([temp, pressure, humidity, flow], {
  axis: 'x',
  syncCursor: true,
});
```

### Price + Indicators
```typescript
// Stock price with separate RSI/MACD panels
createChartGroup([priceChart, rsiChart, macdChart], {
  axis: 'x',
  syncCursor: true,
});
```

See [API Reference](/api/chart-sync) for complete documentation.
