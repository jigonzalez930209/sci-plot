---
title: ROI (Region of Interest) Selection
description: Interactive tools for selecting and analyzing specific data regions in scientific charts.
---

# ROI (Region of Interest) Selection

Modern scientific analysis often requires isolating specific features within a dataset. The ROI plugin allows users to draw, modify, and analyze free-hand or geometric regions on the chart.

## Interactive Tools Demo

Capture regions using a **Rectangle**, **Circle**, **Polygon**, or free-hand **Lasso**.

<div class="premium-demo-container">
  <RoiDemo />
</div>

## Features

- **Multi-region Selection**: Draw multiple ROIs and manage them collectively.
- **Data Indexing**: Get the exact indices of data points inside any region.
- **Styling**: Distinct colors and labels for different categories of interest.
- **API Extraction**: Programmatically create and remove regions from background processes.

## Basic Implementation

```typescript
import { createChart, PluginROI } from 'sci-plot';

const chart = createChart({ container });

// Enable ROI functionality
await chart.use(PluginROI({
  defaultTool: 'rectangle',
  fill: 'rgba(0, 242, 255, 0.2)',
  stroke: '#00f2ff'
}));

// Listen for selection results
chart.events.on('roi:selected', ({ region, masks }) => {
  console.log('ROI ID:', region.id);
  
  masks.forEach(mask => {
    console.log(`Series ${mask.seriesId} has ${mask.indices.length} points inside.`);
  });
});
```

## Available Tools

| Tool | Interaction | Best For |
| :--- | :--- | :--- |
| **Rectangle** | Drag from corner to corner | Standard windowing, time-gated signals. |
| **Circle** | Drag from center outwards | Radial clusters, particle detection. |
| **Polygon** | Click to add vertices, double-click to close | Complex geometric envelopes. |
| **Lasso** | Hold and draw free-hand path | Non-linear clusters, irregular outliers. |

## Advanced Scripting

You can also use the ROI tool programmatically to highlight known areas of interest:

```typescript
chart.roi.addRegion({
  id: 'peak-alpha',
  tool: 'rectangle',
  points: [
    { x: 8.5, y: -0.5 },
    { x: 12.0, y: 5.2 }
  ],
  label: 'Alpha Wave'
});
```

<style>
.premium-demo-container {
  margin: 2rem 0;
  border-radius: 16px;
  overflow: hidden;
  background: #09090b;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
