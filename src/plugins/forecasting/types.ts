/**
 * Forecasting Plugin - Type Definitions
 * 
 * Defines interfaces for time series forecasting models and parameters.
 */

import type { SeriesData } from "../../types";

export type ForecastingMethod = 
  | 'sma'           // Simple Moving Average
  | 'ema'           // Exponential Moving Average
  | 'wma'           // Weighted Moving Average
  | 'linear'        // Linear Trend Projection
  | 'expSmoothing'  // Simple Exponential Smoothing
  | 'holt'          // Holt's Linear Trend (Double Exponential Smoothing)
  | 'holtWinters';  // Triple Exponential Smoothing (Seasonality)

export interface ForecastingOptions {
  /** Method to use for forecasting */
  method: ForecastingMethod;
  /** Number of periods to forecast ahead */
  horizon: number;
  /** Confidence level (e.g., 0.95 for 95% confidence interval) */
  confidence?: number;
  /** Parameters specific to the chosen method */
  params?: ForecastingParams;
}

export interface ForecastingParams {
  /** Period for moving averages */
  windowSize?: number;
  /** Smoothing factor for level (alpha) */
  alpha?: number;
  /** Smoothing factor for trend (beta) */
  beta?: number;
  /** Smoothing factor for seasonality (gamma) */
  gamma?: number;
  /** Length of the seasonal cycle (for Holt-Winters) */
  period?: number;
  /** Polynomial order for trend fitting (default: 1) */
  polynomialOrder?: number;
}

export interface ForecastingResult {
  /** Forecasted points (X values) */
  xValues: Float64Array | number[];
  /** Forecasted values (Y values) */
  yValues: Float64Array | number[];
  /** Lower confidence bound */
  lowerBound?: Float64Array | number[];
  /** Upper confidence bound */
  upperBound?: Float64Array | number[];
  /** Method used */
  method: ForecastingMethod;
  /** Metadata and fit statistics */
  metadata: {
    mse?: number;      // Mean Squared Error
    mae?: number;      // Mean Absolute Error
    r2?: number;       // R-squared (for trend fitting)
    aic?: number;      // Akaike Information Criterion
  };
}

export interface ForecastingVisualizationConfig {
  /** Whether to show the forecast line (default: true) */
  showLine?: boolean;
  /** Whether to show the confidence interval (default: true) */
  showConfidenceInterval?: boolean;
  /** Line style for the forecast */
  lineStyle?: {
    color?: string;
    width?: number;
    dash?: number[];
  };
  /** Style for the confidence interval */
  intervalStyle?: {
    fillColor?: string;
    opacity?: number;
  };
}

export interface PluginForecastingConfig {
  /** Default forecasting options */
  defaultOptions?: Partial<ForecastingOptions>;
  /** Default visualization settings */
  defaultVisualization?: ForecastingVisualizationConfig;
}

export interface ForecastingAPI {
  /**
   * Forecast future values for a given dataset
   */
  forecast(data: SeriesData | number[] | Float32Array, options: ForecastingOptions): ForecastingResult;
  
  /**
   * Forecast future values for a series by ID
   */
  forecastSeries(seriesId: string, options: ForecastingOptions): Promise<ForecastingResult>;
  
  /**
   * Visualize the forecast on the chart overlay
   */
  visualize(result: ForecastingResult, config?: ForecastingVisualizationConfig): string;
  
  /**
   * Clear active forecast visualizations
   */
  clear(id?: string): void;
  [key: string]: unknown;
}
