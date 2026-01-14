/**
 * Native ML Integration Plugin - Exports
 * 
 * Exports all types and functions for the native ML Integration plugin.
 * 
 * @packageDocumentation
 * @module plugins/ml-integration
 */

// Main plugin
export { PluginMLIntegration, default } from './index';

// Types
export type {
  MLRuntime,
  ModelConfig,
  PredictionInput,
  PredictionResult,
  VisualizationConfig,
  PluginMLIntegrationConfig,
  ModelLoadedEvent,
  PredictionEvent,
  ModelErrorEvent,
  MLModelAPI,
  MLIntegrationAPI,
  NativeStatsAPI
} from './types';

// Native Algorithms and Models
export { 
  createNativeModel,
  nativeFFT,
  nativeMean,
  nativeStandardDeviation,
  nativeCorrelation
} from './native-algorithms';
