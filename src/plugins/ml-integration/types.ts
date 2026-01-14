/**
 * Native ML Integration Plugin Types
 * 
 * Types for 100% native machine learning implementation.
 * No third-party dependencies required.
 * 
 * @packageDocumentation
 * @module plugins/ml-integration
 */

// ============================================
// Runtime Types (Native Only)
// ============================================

export type MLRuntime = 'native';

export interface ModelConfig {
  /** Model identifier */
  id: string;
  /** Runtime to use (always 'native' for this implementation) */
  runtime: MLRuntime;
  /** Model path or configuration */
  modelPath?: string;
  /** Model metadata */
  metadata?: {
    name?: string;
    version?: string;
    description?: string;
    inputShape?: number[];
    outputShape?: number[];
    dataType?: 'float32' | 'float64' | 'int32' | 'int8';
    algorithm?: string;
    filterType?: string;
    cutoffFrequency?: number;
    sampleRate?: number;
    type?: string;
  };
  /** Model type for native implementation */
  type?: 'neural-network' | 'linear-regression' | 'signal-processor' | 'statistical';
}

// ============================================
// Prediction Types
// ============================================

export interface PredictionInput {
  /** Input data array */
  data: Float32Array | Float64Array | number[];
  /** Input shape (auto-detected if not provided) */
  shape?: number[];
  /** Data preprocessing options */
  preprocessing?: {
    normalize?: boolean;
    scale?: number;
    offset?: number;
    windowSize?: number;
  };
}

export interface PredictionResult {
  /** Model identifier */
  modelId: string;
  /** Prediction output */
  output: Float32Array | Float64Array | number[];
  /** Output shape */
  outputShape: number[];
  /** Confidence scores (if available) */
  confidence?: number[];
  /** Prediction timestamp */
  timestamp: number;
  /** Processing time in milliseconds */
  processingTime: number;
}

// ============================================
// Visualization Types
// ============================================

export interface VisualizationConfig {
  /** How to visualize predictions */
  type: 'overlay' | 'separate' | 'heatmap';
  /** Color scheme for predictions */
  colorScheme?: string;
  /** Opacity for overlay visualization */
  opacity?: number;
  /** Line style for predictions */
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  /** Show confidence intervals */
  showConfidence?: boolean;
  /** Confidence level (0-1) */
  confidenceLevel?: number;
}

// ============================================
// Plugin Configuration
// ============================================

export interface PluginMLIntegrationConfig {
  /** Default runtime for models (always 'native') */
  defaultRuntime: MLRuntime;
  /** Pre-configured models */
  models?: Record<string, ModelConfig>;
  /** Enable GPU acceleration (not applicable to native) */
  enableGPU?: boolean;
  /** Maximum model cache size */
  maxCacheSize?: number;
  /** Default visualization settings */
  defaultVisualization?: VisualizationConfig;
  /** Enable real-time predictions */
  enableRealtime?: boolean;
  /** Prediction debounce time in ms */
  debounceTime?: number;
  /** Enable model warmup on load */
  enableWarmup?: boolean;
}

// ============================================
// Event Types
// ============================================

export interface ModelLoadedEvent {
  modelId: string;
  config: ModelConfig;
  loadTime: number;
}

export interface PredictionEvent {
  modelId: string;
  input: PredictionInput;
  result: PredictionResult;
  seriesId?: string;
}

export interface ModelErrorEvent {
  modelId: string;
  error: Error | string;
  context: 'load' | 'predict' | 'dispose';
}

// ============================================
// API Types
// ============================================

export interface MLModelAPI {
  /** Run prediction on input data */
  predict(input: PredictionInput): Promise<PredictionResult>;
  /** Get model information */
  getInfo(): ModelConfig;
  /** Check if model is ready */
  isReady(): boolean;
  /** Warm up model (pre-load for faster predictions) */
  warmup(): Promise<void>;
  /** Dispose model resources */
  dispose(): void;
}

export interface MLIntegrationAPI {
  /** Load a new model */
  loadModel(config: ModelConfig): Promise<MLModelAPI>;
  /** Get loaded model */
  getModel(modelId: string): MLModelAPI | undefined;
  /** List all loaded models */
  listModels(): string[];
  /** Remove/unload a model */
  removeModel(modelId: string): boolean;
  /** Run prediction on specific model */
  predict(modelId: string, input: PredictionInput): Promise<PredictionResult>;
  /** Visualize predictions on chart */
  visualizePredictions(modelId: string, seriesId: string, config?: VisualizationConfig): void;
  /** Enable real-time predictions for series */
  enableRealtime(seriesId: string, modelId: string, config?: VisualizationConfig): void;
  /** Disable real-time predictions */
  disableRealtime(seriesId: string): void;
  /** Update plugin configuration */
  updateConfig(config: Partial<PluginMLIntegrationConfig>): void;
  /** Get current configuration */
  getConfig(): PluginMLIntegrationConfig;
}

// ============================================
// Native Statistical Functions API
// ============================================

export interface NativeStatsAPI {
  /** Fast Fourier Transform */
  fft(data: number[]): { real: number[]; imag: number[] };
  /** Calculate mean */
  mean(data: number[]): number;
  /** Calculate standard deviation */
  stdDev(data: number[]): number;
  /** Calculate correlation coefficient */
  correlation(x: number[], y: number[]): number;
}