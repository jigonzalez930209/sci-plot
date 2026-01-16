/**
 * @fileoverview Caching plugin exports
 * @module plugins/caching
 */

export { PluginCaching, default } from './index';
export type {
  PluginCachingConfig,
  CachingAPI,
  CacheEntry,
  CacheStats,
  CacheStrategy,
  CacheInvalidationEvent,
} from './types';
