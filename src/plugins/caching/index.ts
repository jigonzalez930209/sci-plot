/**
 * @fileoverview Advanced caching plugin for performance optimization
 * @module plugins/caching
 */

import type {
  PluginCachingConfig,
  CachingAPI,
  CacheEntry,
  CacheStats,
} from './types';
import type {
  ChartPlugin,
  PluginContext,
  PluginManifest,
} from '../types';

const manifest: PluginManifest = {
  name: 'sci-plot-caching',
  version: '1.0.0',
  description: 'Advanced caching system for performance optimization',
  provides: ['caching', 'performance'],
  tags: ['optimization', 'cache', 'memory'],
};

const DEFAULT_CONFIG: Required<PluginCachingConfig> = {
  enabled: true,
  maxSize: 50 * 1024 * 1024, // 50MB
  strategy: 'lru',
  defaultTTL: undefined as any,
  autoInvalidate: true,
  cacheTypes: {
    transforms: true,
    analysis: true,
    frames: false,
    bounds: true,
  },
  onInvalidate: () => {},
  debug: false,
};

export function PluginCaching(
  userConfig: Partial<PluginCachingConfig> = {}
): ChartPlugin<PluginCachingConfig> {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  let ctx: PluginContext | null = null;

  // Cache storage
  const cache = new Map<string, CacheEntry>();
  
  // Statistics
  const stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };
  
  let currentSize = 0;

  /**
   * Estimate size of value in bytes
   */
  function estimateSize(value: any): number {
    if (value === null || value === undefined) return 0;
    
    const type = typeof value;
    
    if (type === 'boolean') return 4;
    if (type === 'number') return 8;
    if (type === 'string') return value.length * 2;
    
    if (value instanceof Float32Array || value instanceof Float64Array) {
      return value.byteLength;
    }
    
    if (Array.isArray(value)) {
      return value.reduce((sum, item) => sum + estimateSize(item), 0);
    }
    
    if (type === 'object') {
      return Object.keys(value).reduce(
        (sum, key) => sum + key.length * 2 + estimateSize(value[key]),
        0
      );
    }
    
    return 100; // Default estimate
  }

  /**
   * Evict entries based on strategy
   */
  function evict(requiredSpace: number): void {
    if (cache.size === 0) return;

    const entries = Array.from(cache.entries());
    
    // Sort based on strategy
    if (config.strategy === 'lru') {
      // Least recently used
      entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);
    } else if (config.strategy === 'lfu') {
      // Least frequently used
      entries.sort((a, b) => a[1].hits - b[1].hits);
    }
    // FIFO is already in insertion order (Map preserves order)
    
    let freedSpace = 0;
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace) break;
      
      keysToDelete.push(key);
      freedSpace += entry.size;
      currentSize -= entry.size;
      stats.evictions++;
    }
    
    // Delete entries
    for (const key of keysToDelete) {
      cache.delete(key);
    }
    
    if (config.debug && keysToDelete.length > 0) {
      console.log(`[Cache] Evicted ${keysToDelete.length} entries, freed ${freedSpace} bytes`);
    }
  }

  /**
   * Prune expired entries
   */
  function pruneExpired(): number {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of cache.entries()) {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
        currentSize -= entry.size;
      }
    }
    
    for (const key of keysToDelete) {
      cache.delete(key);
    }
    
    if (config.debug && keysToDelete.length > 0) {
      console.log(`[Cache] Pruned ${keysToDelete.length} expired entries`);
    }
    
    return keysToDelete.length;
  }

  /**
   * Get value from cache
   */
  function get<T>(key: string): T | undefined {
    if (!config.enabled) return undefined;
    
    const entry = cache.get(key);
    
    if (!entry) {
      stats.misses++;
      return undefined;
    }
    
    // Check TTL
    if (entry.ttl) {
      const age = Date.now() - entry.timestamp;
      if (age > entry.ttl) {
        cache.delete(key);
        currentSize -= entry.size;
        stats.misses++;
        return undefined;
      }
    }
    
    // Update access metadata
    entry.lastAccess = Date.now();
    entry.hits++;
    stats.hits++;
    
    if (config.debug) {
      console.log(`[Cache] HIT: ${key}`);
    }
    
    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  function set<T>(
    key: string,
    value: T,
    options: { ttl?: number; tags?: string[]; size?: number } = {}
  ): void {
    if (!config.enabled) return;
    
    // Estimate size
    const size = options.size ?? estimateSize(value);
    
    // Check if we need to evict
    if (currentSize + size > config.maxSize) {
      const requiredSpace = currentSize + size - config.maxSize;
      evict(requiredSpace);
    }
    
    // Still too large after eviction?
    if (size > config.maxSize) {
      console.warn(`[Cache] Value too large to cache: ${key} (${size} bytes)`);
      return;
    }
    
    // Remove old entry if exists
    const oldEntry = cache.get(key);
    if (oldEntry) {
      currentSize -= oldEntry.size;
    }
    
    // Create entry
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      lastAccess: Date.now(),
      hits: 0,
      size,
      ttl: options.ttl ?? config.defaultTTL,
      tags: options.tags,
    };
    
    cache.set(key, entry);
    currentSize += size;
    
    if (config.debug) {
      console.log(`[Cache] SET: ${key} (${size} bytes)`);
    }
  }

  /**
   * Check if key exists
   */
  function has(key: string): boolean {
    return cache.has(key);
  }

  /**
   * Delete specific key
   */
  function deleteKey(key: string): boolean {
    const entry = cache.get(key);
    if (entry) {
      currentSize -= entry.size;
      return cache.delete(key);
    }
    return false;
  }

  /**
   * Clear all cache
   */
  function clear(): void {
    const count = cache.size;
    cache.clear();
    currentSize = 0;
    
    if (config.debug) {
      console.log(`[Cache] Cleared ${count} entries`);
    }
    
    if (config.onInvalidate) {
      config.onInvalidate({
        keys: [],
        reason: 'manual',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Invalidate by tags
   */
  function invalidateByTags(tags: string[]): number {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of cache.entries()) {
      if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
        keysToDelete.push(key);
        currentSize -= entry.size;
      }
    }
    
    for (const key of keysToDelete) {
      cache.delete(key);
    }
    
    if (config.debug && keysToDelete.length > 0) {
      console.log(`[Cache] Invalidated ${keysToDelete.length} entries by tags:`, tags);
    }
    
    if (config.onInvalidate && keysToDelete.length > 0) {
      config.onInvalidate({
        keys: keysToDelete,
        reason: 'tag',
        timestamp: Date.now(),
      });
    }
    
    return keysToDelete.length;
  }

  /**
   * Get cache statistics
   */
  function getStats(): CacheStats {
    const total = stats.hits + stats.misses;
    
    return {
      hits: stats.hits,
      misses: stats.misses,
      hitRatio: total > 0 ? stats.hits / total : 0,
      currentSize,
      maxSize: config.maxSize,
      entryCount: cache.size,
      evictions: stats.evictions,
    };
  }

  /**
   * Reset statistics
   */
  function resetStats(): void {
    stats.hits = 0;
    stats.misses = 0;
    stats.evictions = 0;
  }

  /**
   * Get all keys
   */
  function keys(): string[] {
    return Array.from(cache.keys());
  }

  /**
   * Get cache size
   */
  function size(): number {
    return cache.size;
  }

  // API implementation
  const api: CachingAPI & Record<string, unknown> = {
    get,
    set,
    has,
    delete: deleteKey,
    clear,
    invalidateByTags,
    getStats,
    resetStats,
    keys,
    size,
    prune: pruneExpired,
    updateConfig(newConfig: Partial<PluginCachingConfig>) {
      Object.assign(config, newConfig);
    },
  };

  // Periodic cleanup
  let cleanupInterval: number | null = null;

  return {
    manifest,

    onInit(pluginCtx: PluginContext) {
      ctx = pluginCtx;

      // Attach to chart API
      (ctx.chart as any).caching = api;

      // Setup periodic cleanup (every 60 seconds)
      cleanupInterval = window.setInterval(() => {
        pruneExpired();
      }, 60000);

      // TODO: Auto-invalidate on data changes if enabled
      // Requires 'dataUpdate' event to be added to ChartEventMap
      // if (config.autoInvalidate) {
      //   ctx.chart.on?.('dataUpdate', () => {
      //     if (config.cacheTypes.transforms) invalidateByTags(['transform']);
      //     if (config.cacheTypes.analysis) invalidateByTags(['analysis']);
      //     if (config.cacheTypes.bounds) invalidateByTags(['bounds']);
      //   });
      // }
    },

    onDestroy(pluginCtx: PluginContext) {
      // Clear cleanup interval
      if (cleanupInterval !== null) {
        clearInterval(cleanupInterval);
      }

      // Clear cache
      clear();

      // Remove from chart API
      delete (pluginCtx.chart as any).caching;

      ctx = null;
    },

    api,
  };
}

export default PluginCaching;

// Type exports
export type {
  PluginCachingConfig,
  CachingAPI,
  CacheEntry,
  CacheStats,
  CacheStrategy,
  CacheInvalidationEvent,
} from './types';
