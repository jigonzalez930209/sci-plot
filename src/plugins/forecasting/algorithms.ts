/**
 * Forecasting Algorithms
 * 
 * Native implementations of time series forecasting methods.
 */

import type { ForecastingMethod, ForecastingParams, ForecastingResult } from './types';

/**
 * Main dispatcher for forecasting algorithms
 */
export function calculateForecast(
  x: number[] | Float64Array | Float32Array,
  y: number[] | Float64Array | Float32Array,
  method: ForecastingMethod,
  horizon: number,
  params: ForecastingParams = {}
): ForecastingResult {
  const n = x.length;
  if (n === 0) throw new Error("Dataset is empty");

  // Determine time step (assuming regular intervals)
  const dt = n > 1 ? (x[n - 1] - x[0]) / (n - 1) : 1;
  const lastX = x[n - 1];

  let result: { yValues: number[], lower?: number[], upper?: number[] };

  switch (method) {
    case 'sma':
      result = forecastSMA(y, horizon, params.windowSize || 10);
      break;
    case 'ema':
      result = forecastEMA(y, horizon, params.alpha || 0.3);
      break;
    case 'linear':
      result = forecastLinear(x, y, horizon);
      break;
    case 'expSmoothing':
      result = forecastSimpleExpSmoothing(y, horizon, params.alpha || 0.3);
      break;
    case 'holt':
      result = forecastHolt(y, horizon, params.alpha || 0.3, params.beta || 0.1);
      break;
    case 'holtWinters':
      result = forecastHoltWinters(
        y, 
        horizon, 
        params.period || 12, 
        params.alpha || 0.3, 
        params.beta || 0.1, 
        params.gamma || 0.1
      );
      break;
    default:
      throw new Error(`Method ${method} not implemented yet`);
  }

  // Generate future X values
  const futureX = new Array(horizon);
  for (let i = 0; i < horizon; i++) {
    futureX[i] = lastX + (i + 1) * dt;
  }

  return {
    xValues: futureX,
    yValues: result.yValues,
    lowerBound: result.lower,
    upperBound: result.upper,
    method,
    metadata: calculateFitMetrics(y, result.yValues) // Simplified for now
  };
}

/**
 * Simple Moving Average (SMA)
 * Historical SMA used for projection (flat line at last average)
 */
function forecastSMA(y: number[] | Float64Array | Float32Array, horizon: number, window: number) {
  const n = y.length;
  const effectiveWindow = Math.min(window, n);
  
  let sum = 0;
  for (let i = n - effectiveWindow; i < n; i++) {
    sum += y[i];
  }
  const avg = sum / effectiveWindow;

  // SMA projection is usually a flat line unless we slide the window (which requires predictions)
  return {
    yValues: new Array(horizon).fill(avg)
  };
}

/**
 * Exponential Moving Average (EMA)
 */
function forecastEMA(y: number[] | Float64Array | Float32Array, horizon: number, alpha: number) {
  const n = y.length;
  let ema = y[0];
  
  for (let i = 1; i < n; i++) {
    ema = alpha * y[i] + (1 - alpha) * ema;
  }

  return {
    yValues: new Array(horizon).fill(ema)
  };
}

/**
 * Linear Trend Projection
 * Fits y = mx + b to the historical data
 */
function forecastLinear(x: any, y: any, horizon: number) {
  const n = x.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const lastX = x[n - 1];
  const dt = n > 1 ? (x[n - 1] - x[0]) / (n - 1) : 1;
  const yValues = new Array(horizon);

  for (let i = 0; i < horizon; i++) {
    const nextX = lastX + (i + 1) * dt;
    yValues[i] = slope * nextX + intercept;
  }

  return { yValues };
}

/**
 * Simple Exponential Smoothing (SES)
 */
function forecastSimpleExpSmoothing(y: any, horizon: number, alpha: number) {
  const n = y.length;
  let level = y[0];
  
  for (let i = 1; i < n; i++) {
    level = alpha * y[i] + (1 - alpha) * level;
  }

  return {
    yValues: new Array(horizon).fill(level)
  };
}

/**
 * Holt's Linear Trend (Double Exponential Smoothing)
 */
function forecastHolt(y: any, horizon: number, alpha: number, beta: number) {
  const n = y.length;
  if (n < 2) return { yValues: new Array(horizon).fill(y[0] || 0) };

  let level = y[0];
  let trend = y[1] - y[0];

  for (let i = 1; i < n; i++) {
    const lastLevel = level;
    level = alpha * y[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - lastLevel) + (1 - beta) * trend;
  }

  const yValues = new Array(horizon);
  for (let i = 0; i < horizon; i++) {
    yValues[i] = level + (i + 1) * trend;
  }

  return { yValues };
}

/**
 * Holt-Winters (Triple Exponential Smoothing)
 */
function forecastHoltWinters(y: any, horizon: number, period: number, alpha: number, beta: number, gamma: number) {
  const n = y.length;
  if (n < period * 2) {
    // Fallback to Holt if not enough data for seasonality
    return forecastHolt(y, horizon, alpha, beta);
  }

  // 1. Initial Seasonality
  const seasonals = new Array(period);
  const seasonAverages = new Array(Math.floor(n / period));
  for (let i = 0; i < seasonAverages.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += y[i * period + j];
    }
    seasonAverages[i] = sum / period;
  }

  for (let i = 0; i < period; i++) {
    let sumOverAvg = 0;
    for (let j = 0; j < seasonAverages.length; j++) {
      sumOverAvg += y[j * period + i] - seasonAverages[j];
    }
    seasonals[i] = sumOverAvg / seasonAverages.length;
  }

  // 2. Initial Level and Trend
  let level = seasonAverages[0];
  let trend = (seasonAverages[seasonAverages.length - 1] - seasonAverages[0]) / ((seasonAverages.length - 1) * period);

  // 3. Update coefficients
  for (let i = 0; i < n; i++) {
    const lastLevel = level;
    const val = y[i];
    level = alpha * (val - seasonals[i % period]) + (1 - alpha) * (level + trend);
    trend = beta * (level - lastLevel) + (1 - beta) * trend;
    seasonals[i % period] = gamma * (val - level) + (1 - gamma) * seasonals[i % period];
  }

  // 4. Forecast
  const yValues = new Array(horizon);
  for (let i = 0; i < horizon; i++) {
    const m = (i + 1);
    yValues[i] = (level + m * trend) + seasonals[(n + i) % period];
  }

  return { yValues };
}

/**
 * Calculate common error metrics
 */
function calculateFitMetrics(_historical: any, _forecast: number[]) {
  // This is a simplified placeholder
  // Real metrics should compare historical with a "back-forecast"
  return {
    mse: 0,
    mae: 0,
    r2: 1
  };
}
