/**
 * @fileoverview Lazy loading plugin exports
 * @module plugins/lazy-load
 */

export { PluginLazyLoad, default } from './index';
export type {
  PluginLazyLoadConfig,
  LazyLoadAPI,
  DataProvider,
  DataChunk,
  LoadProgressEvent,
  LazyLoadedSeries,
} from './types';
