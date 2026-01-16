---
title: Caching Plugin
description: Advanced caching system for performance optimization
---

# Caching Plugin

High-performance caching system with LRU/LFU/FIFO strategies, TTL support, and automatic memory management.

## Features

- ✅ **Multiple Strategies**: LRU, LFU, FIFO
- ✅ **TTL Support**: Automatic expiration
- ✅ **Memory Management**: Automatic eviction
- ✅ **Tag-based Invalidation**: Bulk cache clearing
- ✅ **Statistics**: Hit/miss ratio tracking
- ✅ **Size Estimation**: Automatic size calculation

## Basic Usage

```typescript
import { createChart, PluginCaching } from 'scichart-engine';

const chart = createChart({
  container: document.getElementById('chart')!
});

// Enable caching
await chart.use(PluginCaching({
  maxSize: 50 * 1024 * 1024, // 50MB
  strategy: 'lru',
  defaultTTL: 60000 // 1 minute
}));

// Use cache
chart.cache.set('myData', processedData, {
  tags: ['transform'],
  ttl: 30000
});

const cached = chart.cache.get('myData');
```

## API Reference

### `chart.cache`

```typescript
// Get/Set
chart.cache.get<T>(key: string): T | undefined
chart.cache.set<T>(key, value, options?)

// Delete
chart.cache.delete(key: string): boolean
chart.cache.clear(): void

// Invalidation
chart.cache.invalidateByTags(tags: string[]): number

// Statistics
chart.cache.getStats(): CacheStats
chart.cache.resetStats(): void

// Utilities
chart.cache.has(key: string): boolean
chart.cache.keys(): string[]
chart.cache.size(): number
chart.cache.prune(): number
```

## Configuration

```typescript
interface PluginCachingConfig {
  enabled?: boolean;
  maxSize?: number;  // bytes
  strategy?: 'lru' | 'lfu' | 'fifo';
  defaultTTL?: number;  // milliseconds
  autoInvalidate?: boolean;
  cacheTypes?: {
    transforms?: boolean;
    analysis?: boolean;
    frames?: boolean;
    bounds?: boolean;
  };
  onInvalidate?: (event) => void;
  debug?: boolean;
}
```

## Strategies

### LRU (Least Recently Used)
Evicts entries that haven't been accessed recently.

### LFU (Least Frequently Used)
Evicts entries with fewest accesses.

### FIFO (First In First Out)
Evicts oldest entries first.

## Use Cases

### Cache Expensive Calculations

```typescript
function getProcessedData(key: string) {
  let data = chart.cache.get(key);
  if (!data) {
    data = expensiveCalculation();
    chart.cache.set(key, data, { tags: ['calculation'] });
  }
  return data;
}
```

### Tag-based Invalidation

```typescript
// Cache with tags
chart.cache.set('transform1', data1, { tags: ['transform'] });
chart.cache.set('transform2', data2, { tags: ['transform'] });

// Invalidate all transforms
chart.cache.invalidateByTags(['transform']);
```

## See Also

- [Performance Guide](/guide/large-datasets)
- [Data Transform Plugin](/api/plugin-data-transform)
