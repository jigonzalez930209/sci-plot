/**
 * Pattern Recognition Plugin Types
 * 
 * Provides types for technical pattern recognition in financial and scientific data.
 * Supports common chart patterns like head-shoulders, double tops, triangles.
 * 
 * @packageDocumentation
 * @module plugins/pattern-recognition
 */

// ============================================
// Pattern Types
// ============================================

export type PatternType = 
  | 'head-shoulders'
  | 'inverse-head-shoulders'
  | 'double-top'
  | 'double-bottom'
  | 'triple-top'
  | 'triple-bottom'
  | 'ascending-triangle'
  | 'descending-triangle'
  | 'symmetrical-triangle'
  | 'rising-wedge'
  | 'falling-wedge'
  | 'rectangle'
  | 'flag'
  | 'pennant'
  | 'custom';

export interface PatternDefinition {
  /** Pattern identifier */
  id: string;
  /** Pattern type */
  type: PatternType;
  /** Pattern name for display */
  name: string;
  /** Pattern description */
  description?: string;
  /** Minimum number of points required */
  minPoints: number;
  /** Maximum number of points allowed */
  maxPoints?: number;
  /** Pattern validation function */
  validator: (points: PatternPoint[]) => PatternValidationResult;
  /** Pattern confidence calculator */
  confidenceCalculator?: (points: PatternPoint[], validation: PatternValidationResult) => number;
}

// ============================================
// Data Types
// ============================================

export interface PatternPoint {
  /** X coordinate (time/index) */
  x: number;
  /** Y coordinate (price/value) */
  y: number;
  /** Point type in pattern context */
  type?: 'peak' | 'valley' | 'start' | 'end';
  /** Volume at this point (optional) */
  volume?: number;
}

export interface PatternSegment {
  /** Start point */
  start: PatternPoint;
  /** End point */
  end: PatternPoint;
  /** Segment type */
  type: 'support' | 'resistance' | 'trendline';
  /** Segment strength (0-1) */
  strength?: number;
}

export interface PatternValidationResult {
  /** Whether pattern is valid */
  valid: boolean;
  /** Confidence score (0-1) */
  confidence: number;
  /** Pattern segments */
  segments: PatternSegment[];
  /** Key points in pattern */
  keyPoints: PatternPoint[];
  /** Pattern measurements */
  measurements?: PatternMeasurements;
  /** Validation errors */
  errors?: string[];
}

export interface PatternMeasurements {
  /** Pattern height (high - low) */
  height: number;
  /** Pattern width (duration) */
  width: number;
  /** Pattern slope */
  slope: number;
  /** Volume profile */
  volumeProfile?: {
    increasing: number;
    decreasing: number;
    neutral: number;
  };
  /** Breakout target */
  breakoutTarget?: number;
  /** Stop loss level */
  stopLoss?: number;
}

// ============================================
// Detection Results
// ============================================

export interface PatternMatch {
  /** Pattern definition */
  pattern: PatternDefinition;
  /** Match confidence (0-1) */
  confidence: number;
  /** Pattern location */
  location: {
    startIndex: number;
    endIndex: number;
    startPoint: PatternPoint;
    endPoint: PatternPoint;
  };
  /** Validation result */
  validation: PatternValidationResult;
  /** Detection timestamp */
  timestamp: number;
  /** Series ID where pattern was found */
  seriesId: string;
}

export interface PatternDetectionResult {
  /** All pattern matches found */
  matches: PatternMatch[];
  /** Detection summary */
  summary: {
    totalPatterns: number;
    patternsByType: Record<PatternType, number>;
    averageConfidence: number;
    detectionTime: number;
  };
  /** Processed data points */
  processedPoints: number;
  /** Detection parameters used */
  parameters: PatternDetectionParameters;
}

// ============================================
// Detection Parameters
// ============================================

export interface PatternDetectionParameters {
  /** Minimum pattern confidence threshold */
  minConfidence: number;
  /** Maximum patterns to detect */
  maxPatterns?: number;
  /** Pattern types to detect */
  patternTypes: PatternType[];
  /** Sensitivity for peak/valley detection */
  sensitivity: number;
  /** Minimum pattern size (points) */
  minPatternSize: number;
  /** Maximum pattern size (points) */
  maxPatternSize: number;
  /** Overlap tolerance between patterns */
  overlapTolerance: number;
  /** Enable volume confirmation */
  enableVolumeConfirmation: boolean;
  /** Enable trend confirmation */
  enableTrendConfirmation: boolean;
}

// ============================================
// Custom Pattern Types
// ============================================

export interface CustomPatternConfig {
  /** Pattern identifier */
  id: string;
  /** Pattern name */
  name: string;
  /** Point sequence definition */
  pointSequence: {
    type: 'peak' | 'valley' | 'any';
    relativePosition: number; // 0-1 relative to pattern
    constraints?: {
      higherThanPrevious?: boolean;
      lowerThanPrevious?: boolean;
      withinRange?: [number, number];
    };
  }[];
  /** Validation rules */
  validationRules: {
    slopeConstraints?: {
      minSlope?: number;
      maxSlope?: number;
    };
    ratioConstraints?: {
      heightToWidthRatio?: [number, number];
      symmetryRatio?: [number, number];
    };
    volumeConstraints?: {
      increasingVolume?: boolean;
      volumeConfirmation?: boolean;
    };
  };
}

// ============================================
// Plugin Configuration
// ============================================

export interface PluginPatternRecognitionConfig {
  /** Default detection parameters */
  defaultParameters: PatternDetectionParameters;
  /** Custom patterns to register */
  customPatterns?: CustomPatternConfig[];
  /** Enable real-time detection */
  enableRealtime: boolean;
  /** Detection debounce time (ms) */
  debounceTime: number;
  /** Maximum patterns to store in memory */
  maxStoredPatterns: number;
  /** Pattern visualization settings */
  visualization: {
    showPatterns: boolean;
    showLabels: boolean;
    showTargets: boolean;
    colorScheme: Record<PatternType, string>;
    opacity: number;
    lineWidth: number;
  };
  /** Notification settings */
  notifications: {
    enableAlerts: boolean;
    minAlertConfidence: number;
    alertTypes: PatternType[];
  };
}

// ============================================
// Event Types
// ============================================

export interface PatternDetectedEvent {
  match: PatternMatch;
  seriesId: string;
  timestamp: number;
}

export interface PatternCompletedEvent {
  match: PatternMatch;
  breakoutConfirmed: boolean;
  breakoutDirection: 'upward' | 'downward' | 'none';
  seriesId: string;
  timestamp: number;
}

export interface PatternFailedEvent {
  patternType: PatternType;
  reason: string;
  location: {
    startIndex: number;
    endIndex: number;
  };
  seriesId: string;
  timestamp: number;
}

// ============================================
// API Types
// ============================================

export interface PatternRecognitionAPI {
  /** Detect patterns in series data */
  detectPatterns(seriesId: string, data: PatternPoint[], parameters?: Partial<PatternDetectionParameters>): Promise<PatternDetectionResult>;
  
  /** Register a custom pattern */
  registerCustomPattern(config: CustomPatternConfig): void;
  
  /** Get all registered patterns */
  getRegisteredPatterns(): PatternDefinition[];
  
  /** Get pattern matches for a series */
  getPatternMatches(seriesId: string): PatternMatch[];
  
  /** Clear pattern matches for a series */
  clearPatternMatches(seriesId: string): void;
  
  /** Enable real-time pattern detection for series */
  enableRealtimeDetection(seriesId: string, parameters?: Partial<PatternDetectionParameters>): void;
  
  /** Disable real-time pattern detection for series */
  disableRealtimeDetection(seriesId: string): void;
  
  /** Get pattern statistics */
  getStatistics(seriesId?: string): {
    totalDetections: number;
    patternsByType: Record<PatternType, number>;
    averageConfidence: number;
    detectionRate: number;
  };
  
  /** Update plugin configuration */
  updateConfig(config: Partial<PluginPatternRecognitionConfig>): void;
  
  /** Get current configuration */
  getConfig(): PluginPatternRecognitionConfig;
  
  /** Visualize patterns on chart */
  visualizePatterns(seriesId: string, showTypes?: PatternType[]): void;
  
  /** Hide pattern visualizations */
  hidePatterns(seriesId: string): void;
}