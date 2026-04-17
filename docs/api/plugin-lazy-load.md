---
title: Lazy Loading Plugin
description: On-demand data loading for large datasets
---

# Lazy Loading Plugin

Efficient lazy loading system for massive datasets with viewport-based chunking and automatic memory management.

## Features

- ✅ **Chunk-based Loading**: Load data in configurable chunks
- ✅ **Viewport Optimization**: Only load visible data
- ✅ **Auto Unloading**: Free memory from distant chunks
- ✅ **Progress Tracking**: Real-time loading progress
- ✅ **Data Provider**: Abstract data source interface

## Basic Usage

```typescript
import { createChart, PluginLazyLoad } from 'velo-plot';

const chart = createChart({
  container: document.getElementById('chart')!
});

// Enable lazy loading
await chart.use(PluginLazyLoad({
  chunkSize: 10000,
  viewportBuffer: 2,
  maxLoadedChunks: 100
}));

// Create data provider
const provider = {
  getTotalCount: () => 1000000,
  loadChunk: async (start, end) => {
    const data = await fetchDataChunk(start, end);
    return {
      startIndex: start,
      endIndex: end,
      x: new Float32Array(data.x),
      y: new Float32Array(data.y),
      loadedAt: Date.now()
    };
  }
};

// Register series
chart.lazyLoad.registerSeries('large-dataset', provider);
```

## API Reference

### `chart.lazyLoad`

```typescript
// Register/Unregister
chart.lazyLoad.registerSeries(id: string, provider: DataProvider)
chart.lazyLoad.unregisterSeries(id: string)

// Load
chart.lazyLoad.loadRange(id, startIndex, endIndex): Promise<void>
chart.lazyLoad.loadVisible(): Promise<void>
chart.lazyLoad.unloadDistant(): number

// Status
chart.lazyLoad.getLoadingStatus(id)
chart.lazyLoad.clear()
```

## Configuration

```typescript
interface PluginLazyLoadConfig {
  enabled?: boolean;
  chunkSize?: number; // default: 10000
  viewportBuffer?: number; // default: 2
  autoLoad?: boolean; // default: true
  autoUnload?: boolean; // default: true
  unloadThreshold?: number; // default: 5
  preloadAdjacent?: boolean; // default: true
  maxLoadedChunks?: number; // default: 100
  onLoadStart?: (ev) => void;
  onLoadProgress?: (ev) => void;
  onLoadComplete?: (ev) => void;
  onLoadError?: (err, id) => void;
  debug?: boolean;
}
```

## Data Provider Interface

```typescript
interface DataProvider {
  getTotalCount(): number;
  loadChunk(start: number, end: number): Promise<DataChunk>;
  getRange?(): { xMin, xMax, yMin, yMax };
}
```

## Use Cases

### Large Time-Series Data

```typescript
const timeSeriesProvider = {
  getTotalCount: () => 10_000_000,
  loadChunk: async (start, end) => {
    const data = await api.getTimeSeriesData(start, end);
    return {
      startIndex: start,
      endIndex: end,
      x: new Float32Array(data.timestamps),
      y: new Float32Array(data.values),
      loadedAt: Date.now()
    };
  }
};
```

### Database-backed Data

```typescript
const dbProvider = {
  getTotalCount: () => dbQuery('SELECT COUNT(*) FROM measurements')[0],
  loadChunk: async (start, end) => {
    const rows = await dbQuery(
      'SELECT time, value FROM measurements LIMIT ?, ?',
      [start, end - start]
    );
    return {
      startIndex: start,
      endIndex: end,
      x: new Float32Array(rows.map(r => r.time)),
      y: new Float32Array(rows.map(r => r.value)),
      loadedAt: Date.now()
    };
  }
};
```

## See Also

- [Large Datasets Guide](/guide/large-datasets)
- [Caching Plugin](/api/plugin-caching)
- [Performance Tips](/guide/performance)
