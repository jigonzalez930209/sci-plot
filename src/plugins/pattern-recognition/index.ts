/**
 * Pattern Recognition Plugin - Main Implementation
 * 
 * Provides technical pattern recognition for financial and scientific data.
 * Supports common chart patterns and custom pattern definitions.
 * 
 * @example
 * ```typescript
 * import { PluginPatternRecognition } from 'sci-plot/plugins/pattern-recognition';
 * 
 * chart.use(PluginPatternRecognition({
 *   defaultParameters: {
 *     minConfidence: 0.7,
 *     patternTypes: ['head-shoulders', 'double-top', 'ascending-triangle'],
 *     sensitivity: 0.5
 *   },
 *   enableRealtime: true,
 *   visualization: {
 *     showPatterns: true,
 *     showLabels: true,
 *     colorScheme: {
 *       'head-shoulders': '#ff6b6b',
 *       'double-top': '#4ecdc4',
 *       'ascending-triangle': '#45b7d1'
 *     }
 *   }
 * }));
 * 
 * // Detect patterns
 * const result = await chart.patterns.detectPatterns('series1', dataPoints);
 * console.log(`Found ${result.matches.length} patterns`);
 * 
 * // Enable real-time detection
 * chart.patterns.enableRealtimeDetection('series1');
 * ```
 * 
 * @packageDocumentation
 * @module plugins/pattern-recognition
 */

import type { 
  PluginManifest, 
  ChartPlugin, 
  PluginContext,
  BeforeRenderEvent,
  DataUpdateEvent
} from '../types';

import type {
  PluginPatternRecognitionConfig,
  PatternRecognitionAPI,
  PatternDetectionResult,
  PatternMatch,
  PatternPoint,
  PatternDetectionParameters,
  PatternType,
  CustomPatternConfig,
  PatternDefinition,
  PatternValidationResult,
  PatternDetectedEvent
} from './types';

import { BUILTIN_PATTERNS } from './patterns';

// ============================================
// Plugin Manifest
// ============================================

const manifestPatternRecognition: PluginManifest = {
  name: 'pattern-recognition',
  version: '1.0.0',
  description: 'Technical pattern recognition for financial and scientific data',
  author: 'Sci Plot Team',
  provides: ['patterns', 'technical-analysis', 'chart-patterns']
};

// ============================================
// Default Configuration
// ============================================

const DEFAULT_CONFIG: Required<PluginPatternRecognitionConfig> = {
  defaultParameters: {
    minConfidence: 0.7,
    maxPatterns: 10,
    patternTypes: ['head-shoulders', 'double-top', 'double-bottom', 'ascending-triangle', 'descending-triangle'],
    sensitivity: 0.5,
    minPatternSize: 5,
    maxPatternSize: 50,
    overlapTolerance: 0.3,
    enableVolumeConfirmation: false,
    enableTrendConfirmation: true
  },
  customPatterns: [],
  enableRealtime: false,
  debounceTime: 500,
  maxStoredPatterns: 100,
  visualization: {
    showPatterns: true,
    showLabels: true,
    showTargets: true,
    colorScheme: {
      'head-shoulders': '#ff6b6b',
      'inverse-head-shoulders': '#4ecdc4',
      'double-top': '#ff9f43',
      'double-bottom': '#00d2d3',
      'triple-top': '#ff6b6b',
      'triple-bottom': '#4ecdc4',
      'ascending-triangle': '#45b7d1',
      'descending-triangle': '#f39c12',
      'symmetrical-triangle': '#9b59b6',
      'rising-wedge': '#e74c3c',
      'falling-wedge': '#27ae60',
      'rectangle': '#34495e',
      'flag': '#f1c40f',
      'pennant': '#e67e22',
      'custom': '#95a5a6'
    },
    opacity: 0.7,
    lineWidth: 2
  },
  notifications: {
    enableAlerts: false,
    minAlertConfidence: 0.8,
    alertTypes: ['head-shoulders', 'double-top', 'double-bottom']
  }
};

// ============================================
// Pattern Recognition Plugin Implementation
// ============================================

export function PluginPatternRecognition(
  userConfig: Partial<PluginPatternRecognitionConfig> = {}
): ChartPlugin<PluginPatternRecognitionConfig> {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  let ctx: PluginContext | null = null;
  
  // Pattern storage
  const patternMatches = new Map<string, PatternMatch[]>();
  const registeredPatterns = new Map<PatternType, PatternDefinition>(Object.entries(BUILTIN_PATTERNS) as [PatternType, PatternDefinition][]);
  const realtimeSeries = new Set<string>();
  const debounceTimers = new Map<string, any>();
  
  // ============================================
  // Pattern Detection Engine
  // ============================================
  
  async function detectPatterns(
    seriesId: string, 
    dataPoints: PatternPoint[], 
    parameters?: Partial<PatternDetectionParameters>
  ): Promise<PatternDetectionResult> {
    const params = { ...config.defaultParameters, ...parameters };
    const startTime = performance.now();
    
    const matches: PatternMatch[] = [];
    const patternsByType: Record<PatternType, number> = {} as any;
    
    // Preprocess data - find peaks and valleys
    const processedPoints = preprocessData(dataPoints, params.sensitivity);
    
    // Check each pattern type
    for (const patternType of params.patternTypes) {
      const pattern = registeredPatterns.get(patternType);
      if (!pattern) continue;
      
      // Slide window through data
      for (let i = params.minPatternSize; i <= Math.min(processedPoints.length, params.maxPatternSize); i++) {
        const window = processedPoints.slice(Math.max(0, i - params.maxPatternSize), i);
        
        if (window.length < pattern.minPoints) continue;
        if (pattern.maxPoints && window.length > pattern.maxPoints) continue;
        
        // Validate pattern
        const validation = pattern.validator(window);
        
        if (validation.valid && validation.confidence >= params.minConfidence) {
          const match: PatternMatch = {
            pattern,
            confidence: validation.confidence,
            location: {
              startIndex: Math.max(0, i - params.maxPatternSize),
              endIndex: i,
              startPoint: window[0],
              endPoint: window[window.length - 1]
            },
            validation,
            timestamp: Date.now(),
            seriesId
          };
          
          // Check for overlaps
          if (!hasSignificantOverlap(match, matches, params.overlapTolerance)) {
            matches.push(match);
            patternsByType[patternType] = (patternsByType[patternType] || 0) + 1;
            
            // Limit number of patterns
            if (matches.length >= params.maxPatterns!) {
              break;
            }
          }
        }
      }
      
      if (matches.length >= params.maxPatterns!) {
        break;
      }
    }
    
    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);
    
    // Store matches
    patternMatches.set(seriesId, matches);
    
    const detectionTime = performance.now() - startTime;
    
    // Emit events for high-confidence patterns
    for (const match of matches) {
      if (match.confidence >= config.notifications.minAlertConfidence &&
          config.notifications.alertTypes.includes(match.pattern.type)) {
        ctx?.events.emit('pattern:detected', {
          match,
          seriesId,
          timestamp: Date.now()
        } as PatternDetectedEvent);
      }
    }
    
    const result: PatternDetectionResult = {
      matches,
      summary: {
        totalPatterns: matches.length,
        patternsByType,
        averageConfidence: matches.length > 0 ? matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length : 0,
        detectionTime
      },
      processedPoints: processedPoints.length,
      parameters: params
    };
    
    ctx?.log.info(`Pattern detection completed for ${seriesId}: ${matches.length} patterns found`);
    
    return result;
  }
  
  function preprocessData(dataPoints: PatternPoint[], sensitivity: number): PatternPoint[] {
    return dataPoints.filter((point, index) => {
      if (index === 0 || index === dataPoints.length - 1) return true;
      
      const prev = dataPoints[index - 1];
      
      const priceChange = Math.abs(point.y - prev.y) / prev.y;
      return priceChange >= sensitivity * 0.01;
    });
  }
  
  function hasSignificantOverlap(newMatch: PatternMatch, existingMatches: PatternMatch[], tolerance: number): boolean {
    for (const existing of existingMatches) {
      const overlapStart = Math.max(newMatch.location.startIndex, existing.location.startIndex);
      const overlapEnd = Math.min(newMatch.location.endIndex, existing.location.endIndex);
      const overlapSize = overlapEnd - overlapStart;
      
      const newMatchSize = newMatch.location.endIndex - newMatch.location.startIndex;
      const existingMatchSize = existing.location.endIndex - existing.location.startIndex;
      
      const overlapRatio = overlapSize / Math.min(newMatchSize, existingMatchSize);
      
      if (overlapRatio > tolerance) {
        return true;
      }
    }
    return false;
  }
  
  // ============================================
  // Custom Pattern Registration
  // ============================================
  
  function registerCustomPattern(customConfig: CustomPatternConfig): void {
    const pattern: PatternDefinition = {
      id: customConfig.id,
      type: 'custom',
      name: customConfig.name,
      minPoints: customConfig.pointSequence.length,
      maxPoints: customConfig.pointSequence.length,
      validator: (points) => validateCustomPattern(points, customConfig)
    };
    
    registeredPatterns.set('custom', pattern);
    ctx?.log.info(`Custom pattern registered: ${customConfig.id}`);
  }
  
  function validateCustomPattern(points: PatternPoint[], config: CustomPatternConfig): PatternValidationResult {
    if (points.length < config.pointSequence.length) {
      return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Insufficient points'] };
    }
    
    let confidence = 1.0;
    const errors: string[] = [];
    
    for (let i = 0; i < config.pointSequence.length; i++) {
      const sequencePoint = config.pointSequence[i];
      const actualPoint = points[i];
      
      if (sequencePoint.constraints) {
        const constraints = sequencePoint.constraints;
        
        if (constraints.higherThanPrevious && i > 0) {
          if (actualPoint.y <= points[i - 1].y) {
            confidence *= 0.8;
            errors.push(`Point ${i} not higher than previous`);
          }
        }
        
        if (constraints.lowerThanPrevious && i > 0) {
          if (actualPoint.y >= points[i - 1].y) {
            confidence *= 0.8;
            errors.push(`Point ${i} not lower than previous`);
          }
        }
        
        if (constraints.withinRange) {
          const [min, max] = constraints.withinRange;
          if (actualPoint.y < min || actualPoint.y > max) {
            confidence *= 0.7;
            errors.push(`Point ${i} not within range [${min}, ${max}]`);
          }
        }
      }
    }
    
    return {
      valid: confidence >= 0.5,
      confidence,
      segments: [],
      keyPoints: points,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  // ============================================
  // API Implementation
  // ============================================
  
  const api: PatternRecognitionAPI & Record<string, unknown> = {
    detectPatterns,
    
    registerCustomPattern,
    
    getRegisteredPatterns(): PatternDefinition[] {
      return Array.from(registeredPatterns.values());
    },
    
    getPatternMatches(seriesId: string): PatternMatch[] {
      return patternMatches.get(seriesId) || [];
    },
    
    clearPatternMatches(seriesId: string): void {
      patternMatches.delete(seriesId);
      ctx?.log.info(`Pattern matches cleared for series: ${seriesId}`);
    },
    
    enableRealtimeDetection(seriesId: string, parameters?: Partial<PatternDetectionParameters>): void {
      realtimeSeries.add(seriesId);
      
      const chart = ctx?.chart;
      if (chart) {
        const targetSeries = chart.getSeries(seriesId);
        if (targetSeries) {
          const data = targetSeries.getData();
          if (data && data.x.length > 0) {
            const points: PatternPoint[] = Array.from(data.x).map((x, i) => ({
              x: x as number,
              y: data.y[i]
            }));
            
            detectPatterns(seriesId, points, parameters);
          }
        }
      }
      
      ctx?.log.info(`Real-time pattern detection enabled for series: ${seriesId}`);
    },
    
    disableRealtimeDetection(seriesId: string): void {
      realtimeSeries.delete(seriesId);
      
      const timer = debounceTimers.get(seriesId);
      if (timer) {
        clearTimeout(timer);
        debounceTimers.delete(seriesId);
      }
      
      ctx?.log.info(`Real-time pattern detection disabled for series: ${seriesId}`);
    },
    
    getStatistics(seriesId?: string) {
      if (seriesId) {
        const matches = patternMatches.get(seriesId) || [];
        const patternsByType: Record<PatternType, number> = {} as any;
        
        for (const match of matches) {
          patternsByType[match.pattern.type] = (patternsByType[match.pattern.type] || 0) + 1;
        }
        
        return {
          totalDetections: matches.length,
          patternsByType,
          averageConfidence: matches.length > 0 ? matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length : 0,
          detectionRate: matches.length / 100
        };
      } else {
        let totalDetections = 0;
        const allPatternsByType: Record<PatternType, number> = {} as any;
        const allConfidences: number[] = [];
        
        for (const matches of patternMatches.values()) {
          totalDetections += matches.length;
          allConfidences.push(...matches.map(m => m.confidence));
          
          for (const match of matches) {
            allPatternsByType[match.pattern.type] = (allPatternsByType[match.pattern.type] || 0) + 1;
          }
        }
        
        return {
          totalDetections,
          patternsByType: allPatternsByType,
          averageConfidence: allConfidences.length > 0 ? allConfidences.reduce((sum, c) => sum + c, 0) / allConfidences.length : 0,
          detectionRate: totalDetections / 100
        };
      }
    },
    
    updateConfig: (newConfig: Partial<PluginPatternRecognitionConfig>) => {
      Object.assign(config, newConfig);
    },
    
    getConfig: () => ({ ...config }),
    
    visualizePatterns(seriesId: string, showTypes?: PatternType[]): void {
      const chart = ctx?.chart;
      if (!chart) return;
      
      const matches = patternMatches.get(seriesId) || [];
      const filteredMatches = showTypes ? matches.filter(m => showTypes.includes(m.pattern.type)) : matches;
      
      api.hidePatterns(seriesId);
      
      for (const match of filteredMatches) {
        const color = config.visualization.colorScheme[match.pattern.type] || '#666666';
        
        for (const segment of match.validation.segments) {
          const lineId = `${seriesId}_pattern_${match.pattern.id}_${match.location.startIndex}`;
          
          chart.addSeries({
            id: lineId,
            type: 'line',
            data: {
              x: new Float32Array([segment.start.x, segment.end.x]),
              y: new Float32Array([segment.start.y, segment.end.y])
            },
            style: {
              color,
              width: config.visualization.lineWidth,
              opacity: config.visualization.opacity,
              lineDash: [5, 5]
            }
          });
        }
        
        if (config.visualization.showLabels) {
          const labelId = `${seriesId}_label_${match.pattern.id}_${match.location.startIndex}`;
          const centerX = (match.location.startPoint.x + match.location.endPoint.x) / 2;
          const centerY = (match.location.startPoint.y + match.location.endPoint.y) / 2;
          
          chart.addAnnotation({
            id: labelId,
            type: 'text',
            text: match.pattern.name,
            x: centerX,
            y: centerY,
            style: {
              color,
              fontSize: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.8)'
            }
          } as any);
        }
      }
    },
    
    hidePatterns(seriesId: string): void {
      const chart = ctx?.chart;
      if (!chart) return;
      
      const matches = patternMatches.get(seriesId) || [];
      
      for (const match of matches) {
        for (let i = 0; i < match.validation.segments.length; i++) {
          const lineId = `${seriesId}_pattern_${match.pattern.id}_${match.location.startIndex}`;
          if (chart.getSeries(lineId)) {
            chart.removeSeries(lineId);
          }
        }
        
        const labelId = `${seriesId}_label_${match.pattern.id}_${match.location.startIndex}`;
        if (chart.getAnnotation(labelId)) {
          chart.removeAnnotation(labelId);
        }
      }
    }
  };
  
  // ============================================
  // Event Handlers
  // ============================================
  
  function handleDataUpdate(context: PluginContext, event: DataUpdateEvent): void {
    if (!config.enableRealtime) return;
    
    const { seriesId } = event;
    
    if (realtimeSeries.has(seriesId)) {
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
              const points: PatternPoint[] = Array.from(data.x).map((x, i) => ({
                x: x as number,
                y: data.y[i]
              }));
              
              detectPatterns(seriesId, points);
              
              if (config.visualization.showPatterns) {
                api.visualizePatterns(seriesId);
              }
            }
          }
        }
      }, config.debounceTime);
      
      debounceTimers.set(seriesId, newTimer);
    }
  }
  
  // ============================================
  // Plugin Definition
  // ============================================
  
  return {
    manifest: manifestPatternRecognition,
    
    onInit(context: PluginContext) {
      ctx = context;
      
      if (config.customPatterns) {
        for (const customPattern of config.customPatterns) {
          registerCustomPattern(customPattern);
        }
      }
      
      ctx.log.info(`Pattern Recognition plugin initialized with ${registeredPatterns.size} patterns`);
    },
    
    onConfigChange(_context: PluginContext, _newConfig: PluginPatternRecognitionConfig) {
      // Handle config changes
    },
    
    onBeforeRender(_context: PluginContext, _event: BeforeRenderEvent) {
      // Handle pre-render tasks if needed
    },
    
    onDataUpdate: handleDataUpdate,
    
    onDestroy(_context: PluginContext) {
      for (const timer of debounceTimers.values()) {
        clearTimeout(timer);
      }
      debounceTimers.clear();
      
      patternMatches.clear();
      realtimeSeries.clear();
      registeredPatterns.clear();
    },
    
    api
  };
}

export default PluginPatternRecognition;

export type {
  PatternType,
  PatternDefinition,
  PatternPoint,
  PatternSegment,
  PatternValidationResult,
  PatternMeasurements,
  PatternMatch,
  PatternDetectionResult,
  PatternDetectionParameters,
  CustomPatternConfig,
  PluginPatternRecognitionConfig,
  PatternDetectedEvent,
  PatternCompletedEvent,
  PatternFailedEvent,
  PatternRecognitionAPI
} from './types';
