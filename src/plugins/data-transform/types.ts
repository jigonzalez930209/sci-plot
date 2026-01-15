/**
 * PluginDataTransform - Types
 */

export type TransformType = 
  | 'normalize' 
  | 'smooth' 
  | 'resample' 
  | 'derivative' 
  | 'integral'
  | 'moving-average'
  | 'baseline-removal'
  | 'scale-offset'
  | 'decimate'
  | 'abs'
  | 'log'
  | 'power';

export interface TransformOp {
  type: TransformType;
  parameters?: Record<string, any>;
  [key: string]: any;
}

export interface PluginDataTransformConfig {
  /** Auto-apply transforms on data update */
  autoApply?: boolean;
  /** Whether to create a new series instead of modifying the existing one */
  createDerivativeSeries?: boolean;
  /** Default precision for calculations */
  precision?: number;
}

export interface DataTransformAPI {
  /**
   * Apply a pipeline of transformations to a series
   */
  transform(seriesId: string, pipeline: TransformOp[]): Promise<void>;
  
  /**
   * Reset transformations for a series (restore original data)
   */
  resetTransform(seriesId: string): void;
  
  /**
   * Get the original data for a series
   */
  getOriginalData(seriesId: string): { x: Float32Array; y: Float32Array } | null;
}
