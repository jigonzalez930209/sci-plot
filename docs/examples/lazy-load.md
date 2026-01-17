---
title: Lazy Loading Demo
---

# Lazy Loading Demo

This example demonstrates how to handle **massive datasets** (over 1,000,000 points) by loading data only when it becomes visible in the viewport.

## Interactive Demo

<ClientOnly>
  <LazyLoadDemo />
</ClientOnly>

## Strategy

The chart is configured with a `DataProvider` that simulates an API request with an 800ms delay.
As you scroll (pan) or zoom into the chart, the **LazyLoad Plugin**:

1.  Calculates which 10,000-point **chunks** are missing from the current view.
2.  Requests those chunks from the provider.
3.  Merges the new data into the existing series.
4.  Optionally unloads distant chunks to keep memory usage stable.

## Benefits of Lazy Loading

- **Zero Initial Lag**: Instead of waiting for 1M points, the chart starts instantly with the first 50k.
- **Stable Memory**: By setting `maxLoadedChunks`, you can ensure the browser tab never crashes from data overload.
- **Bandwidth Efficiency**: Only data the user actually looks at is transmitted.

## Integration Code

```typescript
chart.use(PluginLazyLoad({
  chunkSize: 10000,
  viewportBuffer: 1.5, // Preload 50% more than visible
  maxLoadedChunks: 50
}));

const myRemoteProvider = {
  getTotalCount: () => totalFromBackend,
  loadChunk: async (start, end) => {
    const data = await fetch(`/api/data?offset=${start}&limit=${end-start}`);
    return {
      startIndex: start,
      endIndex: end,
      x: data.x,
      y: data.y,
      loadedAt: Date.now()
    };
  }
};

chart.lazyLoad.registerSeries('main', myRemoteProvider);
```

> [!NOTE]
> The plugin automatically listens to the `zoom` and `pan` events of the chart to trigger the loading lifecycle.
