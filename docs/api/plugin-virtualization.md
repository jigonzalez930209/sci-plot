---
title: Data Virtualization Plugin
description: Render massive datasets (10M+ points) by using Level-of-Detail (LOD) and dynamic downsampling strategies.
---

# Data Virtualization Plugin

The Virtualization plugin is essential for maintaining 60 FPS performance when working with extremely large datasets. It uses intelligent Level-of-Detail (LOD) switching and dynamic downsampling to ensure the GPU only renders what is necessary for the current view.

## Features

- ✅ **Dynamic LOD**: Automatically switches between full resolution and downsampled views based on zoom level.
- ✅ **Optimized Strategies**: Supports LTTB (Largest-Triangle-Three-Buckets) and Min-Max downsampling.
- ✅ **Automatic Point Counting**: Targets a specific number of points per pixel to maintain visual integrity while reducing load.
- ✅ **Lazy-Load Integration**: Works seamlessly with the [Lazy Loading Plugin](/api/plugin-lazy-load) for a complete big-data pipeline.
- ✅ **Memory Efficiency**: Transparently manages data buffers to minimize overhead.

## Basic Usage

```typescript
import { createChart, PluginVirtualization } from 'sci-plot';

const chart = createChart({
  container: document.getElementById('chart')!
});

// Initialize with LTTB strategy
await chart.use(PluginVirtualization({
  mode: 'lod',
  strategy: 'lttb',
  targetPoints: 'auto',
  pointsPerPixel: 2.5
}));

// The plugin will now automatically manage all series added to the chart
chart.addSeries({
  id: 'massive-series',
  data: { x: largeX, y: largeY } // e.g., 10 million points
});
```

## API Reference

### `chart.virtualization`

```typescript
// Get performance stats for a series
const stats = chart.virtualization.getStats('massive-series');
console.log(`Original: ${stats.originalPoints}, Rendered: ${stats.renderedPoints}`);

// Invalidate cache and force re-downsample
chart.virtualization.invalidate('massive-series');

// Update configuration at runtime
chart.virtualization.updateConfig({
  strategy: 'minmax' // Switch to faster min-max for even larger sets
});
```

## Configuration Options

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `mode` | `'lod' \| 'bins' \| 'hybrid'` | `'lod'` | Virtualization mode. |
| `strategy` | `'lttb' \| 'minmax'` | `'lttb'` | Downsampling algorithm. |
| `targetPoints` | `number \| 'auto'` | `'auto'` | Max points to send to GPU. |
| `pointsPerPixel` | `number` | `2` | Detail density when `targetPoints` is `'auto'`. |
| `lodLevels` | `number[]` | `[1, 4, 8, 16]` | Pre-calculated LOD factors. |
| `includeSeries` | `string[]` | `all` | Specific series to virtualize. |

## Virtualization Strategies

### 1. LTTB (Largest-Triangle-Three-Buckets)
**Best for**: General time-series where visual shape preservation is critical.
LTTB is more computationally expensive but provides the best representation of peaks and valleys in the data.

### 2. Min-Max
**Best for**: Signals with very high frequency or noise where you want to see the "envelope" of the signal.
Min-Max is extremely fast and ensures that outliers (highest and lowest points) are never missed.

## Performance Tips

1. **Use `targetPoints: 'auto'`**: This allows the plugin to adapt to the container size, preventing over-rendering on small screens.
2. **Combine with Caching**: Use the [Caching Plugin](/api/plugin-caching) to preserve downsampled buffers across view changes.
3. **Wait for Idle**: For background initialization, use the `chart.virtualization.invalidate()` method sparingly to avoid stuttering during interaction.

## See Also
- [Lazy Loading Plugin](/api/plugin-lazy-load)
- [Caching Plugin](/api/plugin-caching)
- [Performance Guide](/guide/performance)
