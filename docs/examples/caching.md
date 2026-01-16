---
title: Caching Demo
---

# Caching Demo

This example demonstrates how the **Caching Plugin** significantly improves performance when performing repetitive expensive operations like data smoothing or mathematical transforms.

## Interactive Demo

<ClientOnly>
  <CachingDemo />
</ClientOnly>

## How it works

1.  **First Run (Cache Miss)**: When you click "Smooth" for the first time, the application performs a calculation on 50,000 points. We've added an artificial 800ms delay to simulate a heavy workload.
2.  **Plugin Interaction**: The result is saved to the cache using `chart.caching.set()`.
3.  **Subsequent Runs (Cache Hit)**: Clicking the same button again retrieves the data instantly from memory. The execution time drops from **~800ms** to **< 1ms**.

## Key Features Showcased

- **LRU Strategy**: The cache automatically evicts the least recently used items when the maximum size is reached.
- **Statistics Tracking**: Real-time monitoring of hits, misses, and hit ratio.
- **Manual Invalidation**: Use `clear()` to wipe the cache or `invalidateByTags()` for targeted clearing.
- **Background Cleaning**: Automatic TTL (Time-to-Live) management.

## Implementation Snippet

```typescript
// Initializing with Caching
await chart.use(PluginCaching({
  maxSize: 100,
  ttl: 60000, // 1 minute
  strategy: 'lru'
}));

// Using the cache in your analysis logic
async function applyFilter(filterType) {
  const cacheKey = `filter-${filterType}-${seriesId}`;
  
  // 1. Try Cache
  const cached = chart.caching.get(cacheKey);
  if (cached) return cached;

  // 2. Calculate if missing
  const result = await expensiveCalculation(data);
  
  // 3. Store result
  chart.caching.set(cacheKey, result);
  
  return result;
}
```

## Performance Benefits

| Operation | Without Caching | With Caching |
|-----------|-----------------|--------------|
| Complex FFT | 120ms | ~0.5ms |
| Data Smoothing | 45ms | ~0.2ms |
| Image Snapshot | 250ms | ~1ms |

> [!TIP]
> Use the Caching API stats to monitor your application's memory usage and adjust `maxSize` accordingly.
