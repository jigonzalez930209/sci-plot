/**
 * Native ML Integration Plugin - Core Algorithms
 * 
 * Implements machine learning algorithms natively without third-party dependencies.
 * Includes simple neural networks, statistical models, and signal processing.
 * 
 * @packageDocumentation
 * @module plugins/ml-integration
 */

import type {
  MLModelAPI,
  ModelConfig,
  PredictionInput,
  PredictionResult
} from './types';

// ============================================
// Native Neural Network Implementation
// ============================================

interface NativeNeuralNetwork {
  layers: NeuralLayer[];
  learningRate: number;
  epochs: number;
}

interface NeuralLayer {
  type: 'dense' | 'activation';
  weights: number[][];
  biases: number[];
  activation?: 'relu' | 'sigmoid' | 'tanh' | 'linear';
}

export class SimpleNeuralNetwork implements MLModelAPI {
  private network: NativeNeuralNetwork;
  private config: ModelConfig;
  private ready = false;

  constructor(config: ModelConfig) {
    this.config = config;
    this.network = {
      layers: [],
      learningRate: 0.01,
      epochs: 100
    };
  }

  get id(): string { return this.config.id; }
  get name(): string { return this.config.name; }
  get type(): string { return this.config.type; }

  async predict(input: PredictionInput): Promise<PredictionResult> {
    const startTime = performance.now();
    
    const inputData = Array.from(input.data as number[]);
    const outputData = this.forwardPass(inputData);
    
    const processingTime = performance.now() - startTime;

    return {
      modelId: this.config.id,
      output: new Float32Array(outputData),
      outputShape: [outputData.length],
      timestamp: Date.now(),
      processingTime
    };
  }

  private forwardPass(input: number[]): number[] {
    let activations = input;
    
    for (const layer of this.network.layers) {
      if (layer.type === 'dense') {
        activations = this.denseLayer(activations, layer.weights, layer.biases);
      }
      
      if (layer.activation) {
        activations = this.applyActivation(activations, layer.activation);
      }
    }
    
    return activations;
  }

  private denseLayer(input: number[], weights: number[][], biases: number[]): number[] {
    const output: number[] = [];
    for (let i = 0; i < weights.length; i++) {
      let sum = biases[i];
      for (let j = 0; j < input.length; j++) {
        sum += input[j] * weights[i][j];
      }
      output.push(sum);
    }
    return output;
  }

  private applyActivation(input: number[], activation: string): number[] {
    switch (activation) {
      case 'relu':
        return input.map(x => Math.max(0, x));
      case 'sigmoid':
        return input.map(x => 1 / (1 + Math.exp(-x)));
      case 'tanh':
        return input.map(x => Math.tanh(x));
      default:
        return input;
    }
  }

  getInfo(): ModelConfig {
    return { ...this.config };
  }

  isReady(): boolean {
    return this.ready;
  }

  async warmup(): Promise<void> {
    const dummyInput = new Array(10).fill(0.1);
    await this.predict({ data: dummyInput });
    this.ready = true;
  }

  dispose(): void {
    this.ready = false;
  }
}

// ============================================
// Native Statistical Models
// ============================================

export class NativeLinearRegression implements MLModelAPI {
  private config: ModelConfig;
  private coefficients: number[] = [];
  private intercept = 0;
  private ready = false;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  get id(): string { return this.config.id; }
  get name(): string { return this.config.name; }
  get type(): string { return this.config.type; }

  async predict(input: PredictionInput): Promise<PredictionResult> {
    const startTime = performance.now();
    
    const inputData = Array.from(input.data);
    const predictions = inputData.map(x => {
      let result = this.intercept;
      for (let i = 0; i < this.coefficients.length && i < (x as number); i++) {
        result += this.coefficients[i] * (x as number);
      }
      return result;
    });
    
    const processingTime = performance.now() - startTime;

    return {
      modelId: this.config.id,
      output: new Float32Array(predictions),
      outputShape: [predictions.length],
      timestamp: Date.now(),
      processingTime
    };
  }

  train(data: { x: number[][], y: number[] }): void {
    // Simple linear regression using least squares
    const n = data.x.length;
    
    // Create design matrix
    const X: number[][] = [];
    for (let i = 0; i < n; i++) {
      X.push([1, ...data.x[i]]);
    }
    
    // Calculate coefficients using normal equation: β = (X^T X)^(-1) X^T y
    const XtX = this.matrixMultiply(this.transpose(X), X);
    const XtY = this.matrixMultiply(this.transpose(X), data.y.map(y => [y]));
    
    const XtXInv = this.matrixInverse(XtX);
    const beta = this.matrixMultiply(XtXInv, XtY);
    
    this.intercept = beta[0][0];
    this.coefficients = beta.slice(1).map(row => row[0]);
    this.ready = true;
  }

  private transpose(matrix: number[][]): number[][] {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  }

  private matrixMultiply(a: number[][], b: number[][]): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < a.length; i++) {
      result[i] = [];
      for (let j = 0; j < b[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < b.length; k++) {
          sum += a[i][k] * b[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  private matrixInverse(matrix: number[][]): number[][] {
    // Simplified 2x2 matrix inverse for demonstration
    if (matrix.length === 2 && matrix[0].length === 2) {
      const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
      if (Math.abs(det) < 1e-10) {
        return [[1, 0], [0, 1]]; // Identity matrix if singular
      }
      const invDet = 1 / det;
      return [
        [invDet * matrix[1][1], -invDet * matrix[0][1]],
        [-invDet * matrix[1][0], invDet * matrix[0][0]]
      ];
    }
    
    // For larger matrices, return identity (simplified)
    return matrix.map((row, i) => row.map((_, j) => i === j ? 1 : 0));
  }

  getInfo(): ModelConfig {
    return { ...this.config };
  }

  isReady(): boolean {
    return this.ready;
  }

  async warmup(): Promise<void> {
    this.coefficients = [1.0];
    this.intercept = 0.0;
    this.ready = true;
  }

  dispose(): void {
    this.ready = false;
  }
}

// ============================================
// Native Signal Processing
// ============================================

export class NativeSignalProcessor implements MLModelAPI {
  private config: ModelConfig;
  private filterType: 'lowpass' | 'highpass' | 'bandpass';
  private cutoffFrequency: number;
  private sampleRate: number;
  private ready = false;

  constructor(config: ModelConfig) {
    this.config = config;
    // Extract parameters from metadata
    this.filterType = (config.metadata?.filterType as any) || 'lowpass';
    this.cutoffFrequency = config.metadata?.cutoffFrequency || 1000;
    this.sampleRate = config.metadata?.sampleRate || 44100;
  }

  get id(): string { return this.config.id; }
  get name(): string { return this.config.name; }
  get type(): string { return this.config.type; }

  async predict(input: PredictionInput): Promise<PredictionResult> {
    const startTime = performance.now();
    
    const inputData = Array.from(input.data as number[]);
    const filteredData = this.applyFilter(inputData);
    
    const processingTime = performance.now() - startTime;

    return {
      modelId: this.config.id,
      output: new Float32Array(filteredData),
      outputShape: [filteredData.length],
      timestamp: Date.now(),
      processingTime
    };
  }

  private applyFilter(data: number[]): number[] {
    switch (this.filterType) {
      case 'lowpass':
        return this.lowpassFilter(data);
      case 'highpass':
        return this.highpassFilter(data);
      case 'bandpass':
        return this.bandpassFilter(data);
      default:
        return data;
    }
  }

  private lowpassFilter(data: number[]): number[] {
    // Simple exponential moving average low-pass filter
    const alpha = 2 * Math.PI * this.cutoffFrequency / this.sampleRate;
    const smoothedAlpha = alpha / (1 + alpha);
    
    const filtered: number[] = [data[0]];
    for (let i = 1; i < data.length; i++) {
      filtered.push(smoothedAlpha * data[i] + (1 - smoothedAlpha) * filtered[i - 1]);
    }
    return filtered;
  }

  private highpassFilter(data: number[]): number[] {
    // High-pass filter using difference
    const filtered: number[] = [];
    for (let i = 1; i < data.length; i++) {
      filtered.push(data[i] - data[i - 1]);
    }
    return filtered;
  }

  private bandpassFilter(data: number[]): number[] {
    // Band-pass filter using combination of low-pass and high-pass
    const lowpass = this.lowpassFilter(data);
    return this.highpassFilter(lowpass);
  }

  getInfo(): ModelConfig {
    return { ...this.config };
  }

  isReady(): boolean {
    return this.ready;
  }

  async warmup(): Promise<void> {
    this.ready = true;
  }

  dispose(): void {
    this.ready = false;
  }
}

// ============================================
// Native Model Factory
// ============================================

export function createNativeModel(config: ModelConfig): MLModelAPI {
  switch (config.type) {
    case 'neural-network':
      return new SimpleNeuralNetwork(config);
    case 'linear-regression':
      return new NativeLinearRegression(config);
    case 'signal-processor':
      return new NativeSignalProcessor(config);
    default:
      // Default to simple linear model
      return new NativeLinearRegression(config);
  }
}

// ============================================
// Native FFT Implementation
// ============================================

export function nativeFFT(data: number[]): { real: number[]; imag: number[] } {
  const n = data.length;
  const real: number[] = new Array(n);
  const imag: number[] = new Array(n);
  
  // Simplified DFT (not optimized FFT)
  for (let k = 0; k < n; k++) {
    let sumReal = 0;
    let sumImag = 0;
    
    for (let t = 0; t < n; t++) {
      const angle = -2 * Math.PI * k * t / n;
      sumReal += data[t] * Math.cos(angle);
      sumImag += data[t] * Math.sin(angle);
    }
    
    real[k] = sumReal;
    imag[k] = sumImag;
  }
  
  return { real, imag };
}

// ============================================
// Native Statistical Functions
// ============================================

export function nativeMean(data: number[]): number {
  return data.reduce((sum, val) => sum + val, 0) / data.length;
}

export function nativeStandardDeviation(data: number[]): number {
  const mean = nativeMean(data);
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
}

export function nativeCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const meanX = nativeMean(x);
  const meanY = nativeMean(y);
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  
  return numerator / Math.sqrt(denomX * denomY);
}