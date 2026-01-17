/**
 * @fileoverview Types for caching plugin
 * @module plugins/caching/types
 */

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T = any> {
  /** Cached value */
  value: T;
  /** Timestamp when cached */
  timestamp: number;
  /** Last access timestamp */
  lastAccess: number;
  /** Access count */
  hits: number;
  /** Approximate size in bytes */
  size: number;
  /** Optional TTL (time to live) in ms */
  ttl?: number;
  /** Optional tags for bulk invalidation */
  tags?: string[];
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total cache hits */
  hits: number;
  /** Total cache misses */
  misses: number;
  /** Hit ratio (0-1) */
  hitRatio: number;
  /** Current cache size in bytes */
  currentSize: number;
  /** Maximum cache size in bytes */
  maxSize: number;
  /** Number of entries */
  entryCount: number;
  /** Number of evictions */
  evictions: number;
}

/**
 * Cache strategy
 */
export type CacheStrategy = 'lru' | 'lfu' | 'fifo';

/**
 * Cache invalidation event
 */
export interface CacheInvalidationEvent {
  /** Keys invalidated */
  keys: string[];
  /** Reason for invalidation */
  reason: 'manual' | 'ttl' | 'size' | 'tag';
  /** Timestamp */
  timestamp: number;
}

/**
 * Plugin configuration
 */
export interface PluginCachingConfig {
  /** Enable caching (default: true) */
  enabled?: boolean;
  
  /** Maximum cache size in bytes (default: 50MB) */
  maxSize?: number;
  
  /** Cache strategy (default: 'lru') */
  strategy?: CacheStrategy;
  
  /** Default TTL in milliseconds (default: undefined = no expiration) */
  defaultTTL?: number;
  
  /** Enable automatic invalidation on data changes (default: true) */
  autoInvalidate?: boolean;
  
  /** Cache specific data types */
  cacheTypes?: {
    /** Cache transformed data (default: true) */
    transforms?: boolean;
    /** Cache analysis results (default: true) */
    analysis?: boolean;
    /** Cache rendered frames (default: false) */
    frames?: boolean;
    /** Cache computed bounds (default: true) */
    bounds?: boolean;
  };
  
  /** Callback when cache is invalidated */
  onInvalidate?: (event: CacheInvalidationEvent) => void;
  
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * Plugin API
 */
export interface CachingAPI {
  /** Get value from cache */
  get<T>(key: string): T | undefined;
  
  /** Set value in cache */
  set<T>(key: string, value: T, options?: {
    ttl?: number;
    tags?: string[];
    size?: number;
  }): void;
  
  /** Check if key exists */
  has(key: string): boolean;
  
  /** Delete specific key */
  delete(key: string): boolean;
  
  /** Clear all cache */
  clear(): void;
  
  /** Invalidate by tags */
  invalidateByTags(tags: string[]): number;
  
  /** Get cache statistics */
  getStats(): CacheStats;
  
  /** Reset statistics */
  resetStats(): void;
  
  /** Get all keys */
  keys(): string[];
  
  /** Get cache size */
  size(): number;
  
  /** Prune expired entries */
  prune(): number;
  
  /** Update configuration */
  updateConfig(config: Partial<PluginCachingConfig>): void;
}
