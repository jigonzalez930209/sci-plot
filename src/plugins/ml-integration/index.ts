/**
 * Native ML Integration Plugin - Main Implementation
 * 
 * Provides 100% native machine learning capabilities without third-party dependencies.
 * Includes neural networks, statistical models, and signal processing.
 * 
 * @example
 * ```typescript
// Main plugin
export { PluginMLIntegration, default } from './index';
export { NativeLinearRegression } from './native-algorithms';chart-engine/plugins/ml-integration';
 * 
 * chart.use(PluginMLIntegration({
 *   defaultRuntime: 'native',
 *   models: {
 *     'linear-predictor': {
 *       id: 'linear-predictor',
 *       type: 'linear-regression',
 *       metadata: { algorithm: 'least-squares' }
 *     }
 *   }
 * }));
 * 
 * // Train model
 * const model = await chart.ml.getModel('linear-predictor');
 * if (model && model instanceof NativeLinearRegression) {
 *   model.train({
 *     x: [[1, 2, 3], [2, 4, 6], [3, 6, 9]],
 *     y: [2, 4, 6]
 *   });
 * }
 * 
 * // Predict
 * const result = await chart.ml.predict('linear-predictor', {
 *   data: [4, 8, 12]
 * });
 * ```
 * 
 * @packageDocumentation
 * @module plugins/ml-integration
 */

import type { 
  PluginManifest, 
  ChartPlugin, 
  PluginContext,
  BeforeRenderEvent,
  DataUpdateEvent
} from '../types';

import type {
  PluginMLIntegrationConfig,
  MLIntegrationAPI,
  MLModelAPI,
  ModelConfig,
  PredictionInput,
  PredictionResult,
  VisualizationConfig,
  ModelLoadedEvent,
  PredictionEvent,
  ModelErrorEvent
} from './types';

import { createNativeModel, nativeFFT, nativeMean, nativeStandardDeviation, nativeCorrelation } from './native-algorithms';


// ============================================
// Plugin Manifest
// ============================================

const manifestMLIntegration: PluginManifest = {
  name: 'ml-integration',
  version: '1.0.0',
  description: 'Native machine learning integration without third-party dependencies',
  author: 'SciChart Engine Team',
  provides: ['ml', 'prediction', 'native-ml', 'signal-processing']
};

// ============================================
// Default Configuration
// ============================================

const DEFAULT_CONFIG: Required<PluginMLIntegrationConfig> = {
  defaultRuntime: 'native',
  models: {},
  enableGPU: false, // Native implementation doesn't use GPU
  maxCacheSize: 5,
  defaultVisualization: {
    type: 'overlay',
    colorScheme: '#ff6b6b',
    opacity: 0.8,
    lineStyle: 'dashed',
    showConfidence: false,
    confidenceLevel: 0.95
  },
  enableRealtime: false,
  debounceTime: 100,
  enableWarmup: true
};

// ============================================
// Native ML Integration Plugin Implementation
// ============================================

export function PluginMLIntegration(
  userConfig: Partial<PluginMLIntegrationConfig> = {}
): ChartPlugin<PluginMLIntegrationConfig> {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  let ctx: PluginContext | null = null;
  
  // Model management
  const loadedModels = new Map<string, MLModelAPI>();
  const modelConfigs = new Map<string, ModelConfig>();
  
  // Real-time prediction tracking
  const realtimeSeries = new Map<string, string>(); // seriesId -> modelId
  const debounceTimers = new Map<string, any>();
  const predictionSeries = new Map<string, string>(); // seriesId -> predictionSeriesId
  
  // ============================================
  // Model Management (Native Implementation)
  // ============================================
  
  async function loadModel(modelConfig: ModelConfig): Promise<MLModelAPI> {
    const { id } = modelConfig;
    
    // Check if model already loaded
    if (loadedModels.has(id)) {
      return loadedModels.get(id)!;
    }
    
    // Check cache size limit
    if (loadedModels.size >= config.maxCacheSize) {
      const firstModelId = loadedModels.keys().next().value;
      if (firstModelId) {
        removeModel(firstModelId);
      }
    }
    
    // Create native model
    const model = createNativeModel(modelConfig);
    if (!model) {
      throw new Error(`Failed to create model: ${id}`);
    }
    
    // Warm up if enabled
    if (config.enableWarmup) {
      await model.warmup();
    }
    
    // Store model
    loadedModels.set(id, model);
    modelConfigs.set(id, modelConfig);
    
    if (ctx) {
      ctx.log.info(`Native ML model loaded: ${id} (${modelConfig.type || 'unknown'})`);
      ctx.events.emit('model:loaded', {
        modelId: id,
        config: modelConfig,
        loadTime: 0
      } as ModelLoadedEvent);
    }
    
    return model;
  }
  
  function getModel(modelId: string): MLModelAPI | undefined {
    return loadedModels.get(modelId);
  }
  
  function listModels(): string[] {
    return Array.from(loadedModels.keys());
  }
  
  function removeModel(modelId: string): boolean {
    const model = loadedModels.get(modelId);
    if (model) {
      model.dispose();
      loadedModels.delete(modelId);
      modelConfigs.delete(modelId);
      
      // Clean up real-time predictions
      for (const [seriesId, model] of realtimeSeries.entries()) {
        if (model === modelId) {
          disableRealtime(seriesId);
        }
      }
      
      ctx?.log.info(`Native ML model removed: ${modelId}`);
      return true;
    }
    return false;
  }
  
  async function predict(modelId: string, input: PredictionInput): Promise<PredictionResult> {
    const model = getModel(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }
    
    try {
      const result = await model.predict(input);
      
      if (ctx) {
        ctx.events.emit('prediction:complete', {
          modelId,
          input,
          result
        } as PredictionEvent);
      }
      
      return result;
    } catch (error) {
      if (ctx) {
        ctx.log.error(`Native ML prediction failed: ${error}`);
        ctx.events.emit('model:error', {
          modelId,
          error: error as Error,
          context: 'predict'
        } as ModelErrorEvent);
      }
      throw error;
    }
  }
  
  // ============================================
  // Visualization (Native Implementation)
  // ============================================
  
  function visualizePredictions(
    modelId: string, 
    seriesId: string, 
    vizConfig?: Partial<VisualizationConfig>
  ): void {
    const model = getModel(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }
    
    const chart = ctx?.chart;
    if (!chart) {
      throw new Error('Chart not available');
    }
    
    const series = chart.getSeries(seriesId);
    if (!series) {
      throw new Error(`Series not found: ${seriesId}`);
    }
    
    const vizSettings = { ...config.defaultVisualization, ...vizConfig };
    
    // Create prediction series
    const predictionSeriesId = `${seriesId}_predictions_${modelId}`;
    
    // Remove existing prediction series
    if (chart.getSeries(predictionSeriesId)) {
      chart.removeSeries(predictionSeriesId);
    }
    
    // Get series data
    const seriesData = series.getData();
    if (!seriesData || seriesData.x.length === 0) {
      return;
    }
    
    // Run prediction
    predict(modelId, {
      data: new Float32Array(seriesData.y),
      preprocessing: {
        normalize: true,
        windowSize: 100
      }
    }).then(result => {
      if (!ctx?.chart) return;
      // Create prediction series
      ctx.chart.addSeries({
        id: predictionSeriesId,
        type: 'line',
        data: {
          x: new Float32Array(seriesData.x.slice(-result.output.length)),
          y: new Float32Array(result.output)
        },
        style: {
          color: vizSettings.colorScheme || '#ff6b6b',
          width: 2,
          opacity: vizSettings.opacity || 0.8
        }
      });
      
      predictionSeries.set(seriesId, predictionSeriesId);
    }).catch(error => {
      ctx?.log.error(`Native ML prediction visualization failed: ${error}`);
    });
  }
  
  // ============================================
  // Real-time Predictions (Native Implementation)
  // ============================================
  
  function enableRealtime(
    seriesId: string, 
    modelId: string, 
    vizConfig?: Partial<VisualizationConfig>
  ): void {
    const model = getModel(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }
    
    realtimeSeries.set(seriesId, modelId);
    
    // Initial prediction
    visualizePredictions(modelId, seriesId, vizConfig);
    
    ctx?.log.info(`Native real-time ML predictions enabled for series: ${seriesId} -> ${modelId}`);
  }
  
  function disableRealtime(seriesId: string): void {
    realtimeSeries.delete(seriesId);
    
    // Clear debounce timer
    const timer = debounceTimers.get(seriesId);
    if (timer) {
      clearTimeout(timer);
      debounceTimers.delete(seriesId);
    }
    
    // Remove prediction series
    const predictionSeriesId = predictionSeries.get(seriesId);
    if (predictionSeriesId) {
      const chart = ctx?.chart;
      if (chart && chart.getSeries(predictionSeriesId)) {
        chart.removeSeries(predictionSeriesId);
      }
      predictionSeries.delete(seriesId);
    }
    
    ctx?.log.info(`Native real-time ML predictions disabled for series: ${seriesId}`);
  }
  
  // ============================================
  // Native Statistical Functions API
  // ============================================
  
  const nativeStatsAPI = {
    fft: nativeFFT,
    mean: nativeMean,
    stdDev: nativeStandardDeviation,
    correlation: nativeCorrelation
  };
  
  // ============================================
  // Plugin API
  // ============================================
  
  const api: MLIntegrationAPI & Record<string, unknown> = {
    loadModel,
    getModel,
    listModels,
    removeModel,
    predict,
    visualizePredictions,
    enableRealtime,
    disableRealtime,
    updateConfig: (newConfig: Partial<PluginMLIntegrationConfig>) => {
      Object.assign(config, newConfig);
    },
    getConfig: () => ({ ...config }),
    // Expose native statistical functions
    stats: nativeStatsAPI
  };
  
  // ============================================
  // Event Handlers
  // ============================================
  
  function handleDataUpdate(_context: PluginContext, event: DataUpdateEvent): void {
    if (!config.enableRealtime) return;
    
    const { seriesId } = event;
    const modelId = realtimeSeries.get(seriesId);
    
    if (modelId) {
      // Debounce predictions
      const timer = debounceTimers.get(seriesId);
      if (timer) {
        clearTimeout(timer);
      }
      
      const newTimer = setTimeout(() => {
        visualizePredictions(modelId, seriesId);
      }, config.debounceTime);
      
      debounceTimers.set(seriesId, newTimer);
    }
  }
  
  // ============================================
  // Plugin Definition
  // ============================================
  
  return {
    manifest: manifestMLIntegration,
    
    onInit(context: PluginContext) {
      ctx = context;
      
      // Load pre-configured models
      if (config.models) {
        const modelEntries = Object.entries(config.models);
        for (const [id, modelConfig] of modelEntries) {
          loadModel({ ...modelConfig, id }).catch(error => {
            if (ctx) {
              ctx.log.error(`Failed to load native ML model ${id}: ${error}`);
            }
          });
        }
      }
      
      if (ctx) {
        ctx.log.info('Native ML Integration plugin initialized');
      }
    },
    
    onConfigChange(_context: PluginContext, newConfig: Partial<PluginMLIntegrationConfig>) {
      Object.assign(config, newConfig);
    },
    
    onBeforeRender(_context: PluginContext, _event: BeforeRenderEvent) {
      // Handle pre-render tasks if needed
    },
    
    onDataUpdate: handleDataUpdate,
    
    onDestroy(_context: PluginContext) {
      // Clean up all models
      for (const model of loadedModels.values()) {
        model.dispose();
      }
      loadedModels.clear();
      modelConfigs.clear();
      
      // Clear timers
      for (const timer of debounceTimers.values()) {
        clearTimeout(timer);
      }
      debounceTimers.clear();
      
      realtimeSeries.clear();
      predictionSeries.clear();
    },
    
    api
  };
}

export default PluginMLIntegration;

// Re-export types for convenience
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
  MLIntegrationAPI
} from './types';

// Re-export native algorithms
export { 
  createNativeModel,
  nativeFFT,
  nativeMean,
  nativeStandardDeviation,
  nativeCorrelation
} from './native-algorithms';