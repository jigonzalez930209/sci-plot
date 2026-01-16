
export type MLRuntime = 'native' | 'web-worker' | 'wasm';

export interface ModelConfig {
  id: string;
  name: string;
  type: 'regression' | 'classification' | 'anomaly' | 'forecasting' | 'neural-network' | 'linear-regression' | 'signal-processor' | string;
  metadata?: Record<string, any>;
}

export interface PredictionInput {
  data: number[] | Float32Array;
  metadata?: Record<string, any>;
}

export interface PredictionResult {
  modelId: string;
  output: Float32Array;
  xValues?: Float32Array | Float64Array;
  outputShape: number[];
  timestamp: number;
  processingTime: number;
  confidence?: number[];
  metadata?: Record<string, any>;
}

export interface MLModelAPI {
  id: string;
  name: string;
  type: string;
  predict(input: PredictionInput): Promise<PredictionResult>;
  getInfo(): ModelConfig;
  isReady(): boolean;
  warmup(): Promise<void>;
  dispose(): void;
}

export interface VisualizationConfig {
  showConfidenceInterval?: boolean;
  intervalOpacity?: number;
  lineStyle?: {
    color?: string;
    width?: number;
    dash?: number[];
  };
}

export interface PluginMLIntegrationConfig {
  runtime?: MLRuntime;
  models?: ModelConfig[];
  defaultVisualization?: VisualizationConfig;
}

export interface MLIntegrationAPI {
  registerModel(model: MLModelAPI): void;
  runInference(modelId: string, seriesId: string): Promise<PredictionResult>;
  visualizeResults(result: PredictionResult, config?: VisualizationConfig): string;
  clearResults(visualizationId?: string): void;
  stats: NativeStatsAPI;
}

export interface NativeStatsAPI {
  fft(data: number[]): { real: number[]; imag: number[] };
  mean(data: number[]): number;
  standardDeviation(data: number[]): number;
  correlation(x: number[], y: number[]): number;
}

export interface ModelLoadedEvent {
  modelId: string;
  config: ModelConfig;
}

export interface PredictionEvent {
  modelId: string;
  input: PredictionInput;
  result: PredictionResult;
}

export interface ModelErrorEvent {
  modelId: string;
  error: string;
}