/**
 * Anomaly Detection Plugin
 * 
 * Detects anomalies in chart data using statistical methods.
 * This is a simplified version that provides the core API.
 * 
 * @module plugins/anomaly-detection
 */

import type { ChartPlugin, PluginContext } from '../types';
import type { 
  PluginAnomalyDetectionConfig, 
  AnomalyDetectionResult
} from './types';
import { detectAnomalies } from './algorithms';

export type { 
  PluginAnomalyDetectionConfig,
  AnomalyDetectionResult,
  AnomalyPoint,
  AnomalyMethod
} from './types';

const DEFAULT_CONFIG: Required<PluginAnomalyDetectionConfig> = {
  method: 'zscore',
  sensitivity: 3,
  realtime: false,
  highlight: true,
  highlightColor: '#ff0000',
  highlightSize: 8,
  minWindowSize: 30,
  rollingWindow: false,
  windowSize: 100,
  seriesIds: []
};

export const manifestAnomalyDetection = {
  id: 'anomaly-detection',
  name: 'Anomaly Detection',
  version: '1.0.0' as `${number}.${number}.${number}`,
  description: 'Real-time anomaly detection with multiple algorithms',
  author: 'Sci Plot',
  category: 'analysis' as const
};

/**
 * Anomaly Detection Plugin Factory
 */
export function PluginAnomalyDetection(
  userConfig: PluginAnomalyDetectionConfig = {}
): ChartPlugin<PluginAnomalyDetectionConfig> {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  let ctx: PluginContext | null = null;
  const detectionResults = new Map<string, AnomalyDetectionResult>();
  
  return {
    manifest: manifestAnomalyDetection,
    
    onInit(pluginCtx: PluginContext) {
      ctx = pluginCtx;
    },
    
    onDestroy() {
      detectionResults.clear();
      ctx = null;
    },
    
    api: {
      /**
       * Run anomaly detection on a specific series
       */
      detect(seriesId: string): AnomalyDetectionResult | null {
        if (!ctx) return null;
        
        const series = ctx.data.getSeries(seriesId);
        if (!series) return null;
        
        const data = series.getData();
        if (!data || data.x.length < config.minWindowSize) return null;
        
        // Use rolling window if enabled
        let x = data.x;
        let y = data.y;
        
        if (config.rollingWindow && data.x.length > config.windowSize) {
          const start = data.x.length - config.windowSize;
          x = data.x.slice(start);
          y = data.y.slice(start);
        }
        
        // Run detection
        const anomalies = detectAnomalies(x, y, config.method, config.sensitivity);
        
        // Store results
        const result: AnomalyDetectionResult = {
          seriesId,
          anomalies,
          totalPoints: y.length,
          method: config.method,
          threshold: config.sensitivity,
          timestamp: Date.now()
        };
        
        detectionResults.set(seriesId, result);
        
        // Emit event
        ctx.events.emit('anomaly:detected', result);
        
        return result;
      },
      
      /**
       * Run detection on all series
       */
      detectAll(): Map<string, AnomalyDetectionResult> {
        if (!ctx) return new Map();
        
        const results = new Map<string, AnomalyDetectionResult>();
        const allSeries = ctx.data.getAllSeries();
        
        allSeries.forEach((_series, seriesId) => {
          const result = (this as any).detect(String(seriesId));
          if (result) {
            results.set(String(seriesId), result);
          }
        });
        
        return results;
      },
      
      /**
       * Get detection results for a specific series
       */
      getResults(seriesId: string): AnomalyDetectionResult | undefined {
        return detectionResults.get(seriesId);
      },
      
      /**
       * Get all detection results
       */
      getAllResults(): Map<string, AnomalyDetectionResult> {
        return new Map(detectionResults);
      },
      
      /**
       * Clear all detection results
       */
      clear(): void {
        detectionResults.clear();
      },
      
      /**
       * Update configuration
       */
      setConfig(newConfig: Partial<PluginAnomalyDetectionConfig>): void {
        Object.assign(config, newConfig);
      },
      
      /**
       * Get current configuration
       */
      getConfig(): PluginAnomalyDetectionConfig {
        return { ...config };
      }
    }
  };
}
