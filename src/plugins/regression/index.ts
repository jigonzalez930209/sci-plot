/**
 * Regression Plugin - Main Implementation
 * 
 * Provides advanced scientific regression and curve fitting capabilities.
 * Supports multiple regression methods with automatic model selection.
 * 
 * @example
 * ```typescript
 * import { PluginRegression } from 'velo-plot/plugins/regression';
 * 
 * chart.use(PluginRegression({
 *   defaultMethod: 'polynomial',
 *   enableAutoSelection: true,
 *   modelSelectionCriteria: 'aic',
 *   maxIterations: 100
 * }));
 * 
 * // Fit polynomial regression
 * const result = await chart.regression.fit('series1', {
 *   x: seriesData.x,
 *   y: seriesData.y
 * }, 'polynomial', { degree: 3 });
 * 
 * console.log(`R² = ${result.statistics.rSquared}`);
 * console.log(`Parameters: ${result.parameters.parameters}`);
 * 
 * // Auto-fit best model
 * const bestFit = await chart.regression.autoFit('series1', data);
 * 
 * // Visualize fit
 * chart.regression.visualizeFit('series1');
 * ```
 * 
 * @packageDocumentation
 * @module plugins/regression
 */

import type { 
  PluginManifest, 
  ChartPlugin, 
  PluginContext,
  BeforeRenderEvent,
  DataUpdateEvent
} from '../types';

import type {
  PluginRegressionConfig,
  RegressionAPI,
  RegressionResult,
  RegressionData,
  RegressionMethod,
  LinearRegressionConfig,
  PolynomialRegressionConfig,
  ExponentialRegressionConfig,
  GaussianRegressionConfig,
  RegressionCompletedEvent,
  RegressionFailedEvent,
  ModelSelectedEvent,
  RegressionStatistics
} from './types';

import {
  linearRegression,
  polynomialRegression,
  exponentialRegression,
  gaussianRegression
} from './algorithms';

// ============================================
// Plugin Manifest
// ============================================

const manifestRegression: PluginManifest = {
  name: 'regression',
  version: '1.0.0',
  description: 'Advanced scientific regression and curve fitting',
  author: 'Sci Plot Team',
  provides: ['regression', 'curve-fitting', 'scientific-analysis']
};

// ============================================
// Default Configuration
// ============================================

const DEFAULT_CONFIG: Required<PluginRegressionConfig> = {
  defaultMethod: 'linear',
  enableAutoSelection: false,
  modelSelectionCriteria: 'aic',
  enableWeightedRegression: false,
  enableRobustRegression: false,
  robustMethod: 'huber',
  maxIterations: 100,
  convergenceTolerance: 1e-6,
  defaultConfidenceLevel: 0.95,
  enableParallelProcessing: false,
  parallelChunkSize: 1000
};

// ============================================
// Regression Plugin Implementation
// ============================================

export function PluginRegression(
  userConfig: Partial<PluginRegressionConfig> = {}
): ChartPlugin<PluginRegressionConfig> {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  let ctx: PluginContext | null = null;
  
  // Results storage
  const regressionResults = new Map<string, RegressionResult[]>();
  const realtimeSeries = new Set<string>();
  const debounceTimers = new Map<string, any>();
  
  // ============================================
  // Core Regression Methods
  // ============================================
  
  async function fit(
    seriesId: string,
    data: RegressionData,
    method: RegressionMethod = config.defaultMethod,
    methodConfig: any = {}
  ): Promise<RegressionResult> {
    try {
      // Clear previous visualization before fitting new model
      api.hideVisualization(seriesId);
      
      let result: RegressionResult;
      
      switch (method) {
        case 'linear':
          result = linearRegression(data, methodConfig as LinearRegressionConfig);
          break;
        case 'polynomial':
          result = polynomialRegression(data, methodConfig as PolynomialRegressionConfig);
          break;
        case 'exponential':
          result = exponentialRegression(data, methodConfig as ExponentialRegressionConfig);
          break;
        case 'gaussian':
          result = gaussianRegression(data, methodConfig as GaussianRegressionConfig);
          break;
        case 'logarithmic':
          // Transform y = a * log(x) + b to linear
          const logX = Array.from(data.x).map(xi => Math.log(xi));
          result = linearRegression({ ...data, x: new Float32Array(logX) }, methodConfig as LinearRegressionConfig);
          result.method = 'logarithmic';
          break;
        case 'power':
          // Transform to linear: log(y) = log(a) + b * log(x)
          const logY = Array.from(data.y).map(yi => Math.log(yi));
          const logXPow = Array.from(data.x).map(xi => Math.log(xi));
          result = linearRegression({ ...data, x: new Float32Array(logXPow), y: new Float32Array(logY) }, methodConfig as LinearRegressionConfig);
          result.method = 'power';
          break;
        case 'lorentzian':
        case 'sigmoid':
        case 'custom':
          // For now, fall back to linear for unsupported methods
          result = linearRegression(data, methodConfig as LinearRegressionConfig);
          break;
        default:
          throw new Error(`Unsupported regression method: ${method}`);
      }
      
      // Clear and store new result (replace, don't accumulate)
      regressionResults.set(seriesId, [result]);
      
      // Emit event
      if (ctx) {
        ctx.events.emit('regression:completed', {
          result,
          seriesId,
          method,
          timestamp: Date.now()
        } as RegressionCompletedEvent);
      }
      
      ctx?.log.info(`Regression completed for ${seriesId}: ${method} (R² = ${result.statistics.rSquared.toFixed(3)})`);
      
      return result;
    } catch (error) {
      if (ctx) {
        ctx.events.emit('regression:failed', {
          error: error as Error,
          seriesId,
          method,
          reason: `Fitting failed: ${error}`,
          timestamp: Date.now()
        } as RegressionFailedEvent);
      }
      
      throw error;
    }
  }
  
  async function fitAndCompare(
    seriesId: string,
    data: RegressionData,
    methods: RegressionMethod[],
    configs?: any[]
  ): Promise<RegressionResult[]> {
    const results: RegressionResult[] = [];
    
    for (let i = 0; i < methods.length; i++) {
      const method = methods[i];
      const methodConfig = configs ? configs[i] : {};
      
      try {
        const result = await fit(seriesId, data, method, methodConfig);
        results.push(result);
      } catch (error) {
        ctx?.log.warn(`Regression failed for ${method}: ${error}`);
      }
    }
    
    // Sort by criteria
    const criteria = config.modelSelectionCriteria;
    results.sort((a, b) => {
      switch (criteria) {
        case 'aic':
          return (a.statistics.aic || 0) - (b.statistics.aic || 0);
        case 'bic':
          return (a.statistics.bic || 0) - (b.statistics.bic || 0);
        case 'adjusted-r2':
          return b.statistics.adjustedRSquared - a.statistics.adjustedRSquared;
        default:
          return b.statistics.rSquared - a.statistics.rSquared;
      }
    });
    
    return results;
  }
  
  async function autoFit(
    seriesId: string,
    data: RegressionData,
    candidateMethods: RegressionMethod[] = ['linear', 'polynomial', 'exponential', 'gaussian']
  ): Promise<RegressionResult> {
    const configs = candidateMethods.map(method => {
      switch (method) {
        case 'polynomial':
          return { degree: 2 } as PolynomialRegressionConfig;
        case 'exponential':
          return {} as ExponentialRegressionConfig;
        case 'gaussian':
          return {} as GaussianRegressionConfig;
        default:
          return {} as LinearRegressionConfig;
      }
    });
    
    const results = await fitAndCompare(seriesId, data, candidateMethods, configs);
    
    if (results.length === 0) {
      throw new Error('No regression methods succeeded');
    }
    
    const bestResult = results[0];
    
    // Emit model selection event
    if (ctx) {
      ctx.events.emit('model:selected', {
        selectedMethod: bestResult.method,
        candidateResults: results,
        selectionCriteria: config.modelSelectionCriteria,
        seriesId,
        timestamp: Date.now()
      } as ModelSelectedEvent);
    }
    
    ctx?.log.info(`Auto-fit selected ${bestResult.method} for ${seriesId} (R² = ${bestResult.statistics.rSquared.toFixed(3)})`);
    
    return bestResult;
  }
  
  // ============================================
  // API Implementation
  // ============================================
  
  const api: RegressionAPI & Record<string, unknown> = {
    fit,
    
    fitAndCompare,
    
    autoFit,
    
    getResults(seriesId: string): RegressionResult[] {
      return regressionResults.get(seriesId) || [];
    },
    
    clearResults(seriesId: string): void {
      regressionResults.delete(seriesId);
      ctx?.log.info(`Regression results cleared for series: ${seriesId}`);
    },
    
    predict(
      seriesId: string,
      xValues: Float32Array | Float64Array | number[],
      resultIndex = 0
    ): Float32Array {
      const results = regressionResults.get(seriesId);
      if (!results || results.length === 0) {
        throw new Error(`No regression results found for series: ${seriesId}`);
      }
      
      const result = results[Math.min(resultIndex, results.length - 1)];
      const x = Array.from(xValues);
      const params = result.parameters.parameters;
      
      const predictions = x.map(xi => {
        switch (result.method) {
          case 'linear':
            return params[0] * xi + (params[1] || 0);
          case 'polynomial':
            let value = 0;
            for (let j = 0; j < params.length; j++) {
              value += params[j] * Math.pow(xi, j);
            }
            return value;
          case 'exponential':
            return params[0] * Math.exp(params[1] * xi) + (params[2] || 0);
          case 'gaussian':
            const exponent = -Math.pow(xi - params[1], 2) / (2 * params[2] * params[2]);
            return params[0] * Math.exp(exponent) + (params[3] || 0);
          case 'logarithmic':
            return params[0] * Math.log(xi) + (params[1] || 0);
          case 'power':
            return params[0] * Math.pow(xi, params[1]);
          default:
            return 0;
        }
      });
      
      return new Float32Array(predictions);
    },
    
    getConfidenceIntervals(
      seriesId: string,
      xValues: Float32Array | Float64Array | number[],
      _level = config.defaultConfidenceLevel,
      resultIndex = 0
    ): { lower: Float32Array; upper: Float32Array } {
      // Simplified confidence intervals
      const predictions = this.predict(seriesId, xValues, resultIndex);
      const margin = 0.1; // Simplified margin
      
      const lower = predictions.map(p => p - margin);
      const upper = predictions.map(p => p + margin);
      
      return {
        lower: new Float32Array(lower),
        upper: new Float32Array(upper)
      };
    },
    
    evaluate(seriesId: string, data: RegressionData, resultIndex = 0): RegressionStatistics {
      const results = regressionResults.get(seriesId);
      if (!results || results.length === 0) {
        throw new Error(`No regression results found for series: ${seriesId}`);
      }
      
      const result = results[Math.min(resultIndex, results.length - 1)];
      const x = Array.from(data.x);
      const y = Array.from(data.y);
      
      // Use existing model to predict
      const predictions = api.predict(seriesId, x, resultIndex);
      const predArray = Array.from(predictions);
      
      const rSquared = calculateRSquared(y, predArray);
      const adjustedRSquared = calculateAdjustedRSquared(rSquared, y.length, result.parameters.parameters.length);
      const rmse = calculateRMSE(y, predArray);
      
      return {
        rSquared,
        adjustedRSquared,
        rmse,
        rss: y.reduce((sum, yi, i) => sum + Math.pow(yi - predArray[i], 2), 0),
        tss: y.reduce((sum, yi) => sum + Math.pow(yi - calculateMean(y), 2), 0),
        n: y.length,
        k: result.parameters.parameters.length
      };
    },
    
    enableRealtimeFitting(
      seriesId: string,
      method: RegressionMethod = config.defaultMethod,
      methodConfig: any = {}
    ): void {
      realtimeSeries.add(seriesId);
      
      // Run initial fitting
      const chart = ctx?.chart;
      if (chart) {
        const series = chart.getSeries(seriesId);
        if (series) {
          const data = series.getData();
          if (data && data.x.length > 0) {
            fit(seriesId, {
              x: data.x,
              y: data.y
            }, method, methodConfig);
          }
        }
      }
      
      ctx?.log.info(`Real-time regression fitting enabled for series: ${seriesId}`);
    },
    
    disableRealtimeFitting(seriesId: string): void {
      realtimeSeries.delete(seriesId);
      
      // Clear debounce timer
      const timer = debounceTimers.get(seriesId);
      if (timer) {
        clearTimeout(timer);
        debounceTimers.delete(seriesId);
      }
      
      ctx?.log.info(`Real-time regression fitting disabled for series: ${seriesId}`);
    },
    
    getStatistics(seriesId?: string) {
      if (seriesId) {
        const results = regressionResults.get(seriesId) || [];
        const methodsUsed: Record<RegressionMethod, number> = {} as any;
        
        for (const result of results) {
          methodsUsed[result.method] = (methodsUsed[result.method] || 0) + 1;
        }
        
        return {
          totalFittings: results.length,
          methodsUsed,
          averageRSquared: results.length > 0 ? results.reduce((sum, r) => sum + r.statistics.rSquared, 0) / results.length : 0,
          averageProcessingTime: results.length > 0 ? results.reduce((sum, r) => sum + r.processingTime, 0) / results.length : 0
        };
      } else {
        // Global statistics
        let totalFittings = 0;
        const allMethodsUsed: Record<RegressionMethod, number> = {} as any;
        const allRSquared: number[] = [];
        const allProcessingTimes: number[] = [];
        
        for (const results of regressionResults.values()) {
          totalFittings += results.length;
          allRSquared.push(...results.map(r => r.statistics.rSquared));
          allProcessingTimes.push(...results.map(r => r.processingTime));
          
          for (const result of results) {
            allMethodsUsed[result.method] = (allMethodsUsed[result.method] || 0) + 1;
          }
        }
        
        return {
          totalFittings,
          methodsUsed: allMethodsUsed,
          averageRSquared: allRSquared.length > 0 ? allRSquared.reduce((sum, r) => sum + r, 0) / allRSquared.length : 0,
          averageProcessingTime: allProcessingTimes.length > 0 ? allProcessingTimes.reduce((sum, t) => sum + t, 0) / allProcessingTimes.length : 0
        };
      }
    },
    
    updateConfig: (newConfig: Partial<PluginRegressionConfig>) => {
      Object.assign(config, newConfig);
    },
    
    getConfig: () => ({ ...config }),
    
    visualizeFit(seriesId: string, resultIndex = 0): void {
      const chart = ctx?.chart;
      if (!chart) return;
      
      const results = regressionResults.get(seriesId);
      if (!results || results.length === 0) return;
      
      const result = results[Math.min(resultIndex, results.length - 1)];
      const series = chart.getSeries(seriesId);
      if (!series) return;
      
      const data = series.getData();
      if (!data) return;
      
      // Remove existing fit visualization
      this.hideVisualization(seriesId);
      
      // Add fitted curve
      const fitSeriesId = `${seriesId}_fit_${result.method}`;
      const fittedValues = api.predict(seriesId, data.x, resultIndex);
      
      chart.addSeries({
        id: fitSeriesId,
        type: 'line',
        data: {
          x: new Float32Array(Array.from(data.x)),
          y: new Float32Array(fittedValues)
        },
        style: {
          color: '#ff6b6b',
          width: 2,
          opacity: 0.8,
          lineDash: [5, 5]
        }
      });
      
      // Add equation annotation
      const equation = formatEquation(result);
      const annotationId = `${seriesId}_equation_${result.method}`;
      
      chart.addAnnotation({
        id: annotationId,
        type: 'text',
        text: `${result.method.toUpperCase()}: ${equation}\\nR² = ${result.statistics.rSquared.toFixed(3)}`,
        x: data.x[0],
        y: Math.max(...Array.from(fittedValues)),
        style: {
          color: '#ff6b6b',
          fontSize: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.9)'
        }
      } as any);
    },
    
    hideVisualization(seriesId: string): void {
      const chart = ctx?.chart;
      if (!chart) return;
      
      // List all possible regression methods to ensure cleanup
      const allMethods: RegressionMethod[] = [
        'linear', 'polynomial', 'exponential', 'gaussian', 
        'logarithmic', 'power', 'lorentzian', 'sigmoid', 'custom'
      ];
      
      for (const method of allMethods) {
        // Remove fit series
        const fitSeriesId = `${seriesId}_fit_${method}`;
        if (chart.getSeries(fitSeriesId)) {
          chart.removeSeries(fitSeriesId);
        }
        
        // Remove equation annotation
        const annotationId = `${seriesId}_equation_${method}`;
        if (chart.getAnnotation(annotationId)) {
          chart.removeAnnotation(annotationId);
        }
      }
    },
    
    exportResults(seriesId: string, format = 'json'): string {
      const results = regressionResults.get(seriesId) || [];
      
      switch (format) {
        case 'json':
          return JSON.stringify(results, null, 2);
        case 'csv':
          let csv = 'Method,R²,RMSE,Parameters,ProcessingTime\n';
          for (const result of results) {
            csv += `${result.method},${result.statistics.rSquared},${result.statistics.rmse},"${result.parameters.parameters.join(', ')}",${result.processingTime}\n`;
          }
          return csv;
        case 'matlab':
          let matlab = `% Regression results for ${seriesId}\n`;
          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            matlab += `result${i + 1}.method = '${result.method}';\n`;
            matlab += `result${i + 1}.rSquared = ${result.statistics.rSquared};\n`;
            matlab += `result${i + 1}.parameters = [${result.parameters.parameters.join(', ')}];\n`;
          }
          return matlab;
        default:
          return JSON.stringify(results, null, 2);
      }
    }
  };
  
  // ============================================
  // Helper Functions
  // ============================================
  
  function calculateMean(data: number[]): number {
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  }
  
  function calculateRSquared(observed: number[], fitted: number[]): number {
    const meanObserved = calculateMean(observed);
    let ssRes = 0;
    let ssTot = 0;
    
    for (let i = 0; i < observed.length; i++) {
      ssRes += Math.pow(observed[i] - fitted[i], 2);
      ssTot += Math.pow(observed[i] - meanObserved, 2);
    }
    
    return 1 - (ssRes / ssTot);
  }
  
  function calculateAdjustedRSquared(rSquared: number, n: number, k: number): number {
    return 1 - ((1 - rSquared) * (n - 1)) / (n - k - 1);
  }
  
  function calculateRMSE(observed: number[], fitted: number[]): number {
    let sumSquaredErrors = 0;
    for (let i = 0; i < observed.length; i++) {
      sumSquaredErrors += Math.pow(observed[i] - fitted[i], 2);
    }
    return Math.sqrt(sumSquaredErrors / observed.length);
  }
  
  function formatEquation(result: RegressionResult): string {
    const params = result.parameters.parameters;
    
    switch (result.method) {
      case 'linear':
        return params.length === 1 ? `y = ${params[0].toFixed(3)}x` : `y = ${params[0].toFixed(3)}x + ${params[1].toFixed(3)}`;
      case 'polynomial':
        let equation = 'y = ';
        for (let i = params.length - 1; i >= 0; i--) {
          if (params[i] !== 0) {
            if (i === 0) {
              equation += params[i].toFixed(3);
            } else if (i === 1) {
              equation += `${params[i].toFixed(3)}x + `;
            } else {
              equation += `${params[i].toFixed(3)}x^${i} + `;
            }
          }
        }
        return equation.replace(' + ', '').trim();
      case 'exponential':
        return `y = ${params[0].toFixed(3)} * exp(${params[1].toFixed(3)}x) + ${params[2]?.toFixed(3) || 0}`;
      case 'gaussian':
        return `y = ${params[0].toFixed(3)} * exp(-((x - ${params[1].toFixed(3)})² / (2 * ${params[2].toFixed(3)}²))) + ${params[3]?.toFixed(3) || 0}`;
      default:
        return 'y = f(x, parameters)';
    }
  }
  
  // ============================================
  // Event Handlers
  // ============================================
  
  function handleDataUpdate(context: PluginContext, event: DataUpdateEvent): void {
    const { seriesId } = event;
    
    if (realtimeSeries.has(seriesId)) {
      // Debounce fitting
      const timer = debounceTimers.get(seriesId);
      if (timer) {
        clearTimeout(timer);
      }
      
      const newTimer = setTimeout(() => {
        const chart = context.chart;
        if (chart) {
          const series = chart.getSeries(seriesId);
          if (series) {
            const data = series.getData();
            if (data && data.x.length > 0) {
              fit(seriesId, {
                x: data.x,
                y: data.y
              });
              
              // Update visualization
              api.visualizeFit(seriesId);
            }
          }
        }
      }, 500); // 500ms debounce
      
      debounceTimers.set(seriesId, newTimer);
    }
  }
  
  // ============================================
  // Plugin Definition
  // ============================================
  
  return {
    manifest: manifestRegression,
    
    onInit(context: PluginContext) {
      ctx = context;
      ctx.log.info('Regression plugin initialized');
    },
    
    onConfigChange(_context: PluginContext, _newConfig: PluginRegressionConfig) {
      // Handle config changes
    },
    
    onBeforeRender(_context: PluginContext, _event: BeforeRenderEvent) {
      // Handle pre-render tasks if needed
    },
    
    onDataUpdate: handleDataUpdate,
    
    onDestroy(_context: PluginContext) {
      // Clean up timers
      for (const timer of debounceTimers.values()) {
        clearTimeout(timer);
      }
      debounceTimers.clear();
      
      // Clear results
      regressionResults.clear();
      realtimeSeries.clear();
    },
    
    api
  };
}

export default PluginRegression;

// Re-export types for convenience
export type {
  RegressionMethod,
  RegressionData,
  RegressionParameters,
  RegressionStatistics,
  RegressionResult,
  LinearRegressionConfig,
  PolynomialRegressionConfig,
  ExponentialRegressionConfig,
  LogarithmicRegressionConfig,
  PowerRegressionConfig,
  GaussianRegressionConfig,
  LorentzianRegressionConfig,
  SigmoidRegressionConfig,
  CustomRegressionConfig,
  PluginRegressionConfig,
  RegressionCompletedEvent,
  RegressionFailedEvent,
  ModelSelectedEvent,
  RegressionAPI
} from './types';