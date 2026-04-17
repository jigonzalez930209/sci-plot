---
title: ROI (Region of Interest) Plugin
description: Interactive tools for selecting and masking scientific data regions including rectangles, polygons, and free-hand lasso.
---

# ROI (Region of Interest) Plugin

The ROI plugin provides advanced interactive selection tools for scientific data analysis. It allows users to define specific regions of interest on the chart and perform operations like data masking, filtering, and area calculation.

## Features

- ✅ **Multiple Selection Tools**: Rectangle, Polygon, Lasso, and Circle.
- ✅ **Data Masking**: Automatically identify and filter data points within or outside selected regions.
- ✅ **Persistence**: Optionally keep regions active across view changes or sessions.
- ✅ **Additive Selection**: Define multiple regions to create complex compound masks.
- ✅ **Visual Styling**: Fully customizable stroke, fill, and line styles.
- ✅ **Event System**: Hooks for region creation, selection, and data masking results.

## Basic Usage

```typescript
import { createChart, PluginROI } from 'velo-plot';

const chart = createChart({
  container: document.getElementById('chart')!
});

// Initialize the ROI plugin
await chart.use(PluginROI({
  defaultTool: 'rectangle',
  stroke: '#00f2ff',
  fill: 'rgba(0, 242, 255, 0.15)',
  mask: true // Enable data masking by default
}));

// Listen for selection events
chart.events.on('roi:selected', (event) => {
  console.log('Selected region:', event.region);
  console.log('Masked indices per series:', event.masks);
});
```

## API Reference

### `chart.roi`

The plugin exposes its API through the `chart.roi` object (or whatever name it was registered with).

```typescript
// Switch selection tool
chart.roi.setTool('lasso');

// Manually clear all regions
chart.roi.clear();

// Enable/Disable the plugin
chart.roi.enable();
chart.roi.disable();

// Get all active regions
const regions = chart.roi.getRegions();
```

## Configuration Options

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | `boolean` | `true` | Whether the plugin is active on load. |
| `tools` | `RoiTool[]` | `all` | Array of permitted tools: `'rectangle'`, `'polygon'`, `'lasso'`, `'circle'`. |
| `defaultTool` | `RoiTool` | `'rectangle'` | The tool selected by default. |
| `mask` | `boolean` | `false` | If true, automatically calculates masked indices for all series on selection. |
| `persistent` | `boolean` | `true` | If true, regions stay on the chart until manually cleared. |
| `stroke` | `string` | `theme.accent` | Border color for the selection regions. |
| `fill` | `string` | `rgba(...)` | Background color for the selection regions. |

## Use Cases

### 1. Integration Analysis
Select a specific peak or area in a spectrogram to calculate the integrated area or mean intensity of the underlying data points.

### 2. Data Filtering
Use the Lasso tool to select outliers or noisy data segments and mark them for exclusion from further analysis.

### 3. Feature Extraction
Define regions around specific patterns in a multi-channel signal (e.g., ECG or EEG) to isolate them for machine learning classification.

## Event Hooks

The plugin emits events through the standard chart event bus:

- `roi:created`: Fired when a new region is completed.
- `roi:selected`: Fired when a region is clicked or modified, includes masking results.
- `roi:cleared`: Fired when all regions are removed.

```typescript
chart.events.on('roi:created', ({ region }) => {
  if (region.tool === 'polygon') {
    ctx.log.info('Closed polygon created with ' + region.points.length + ' points');
  }
});
```
