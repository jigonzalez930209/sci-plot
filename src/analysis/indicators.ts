/**
 * SciChart Engine - Financial/Technical Indicators Module
 * 
 * Provides common financial and technical analysis indicators:
 * - Moving Averages (SMA, EMA, WMA)
 * - Momentum Indicators (RSI, MACD, Stochastic)
 * - Volatility (Bollinger Bands, ATR)
 * - Volume (VWAP, OBV)
 * - Trend (ADX, Aroon)
 * 
 * @module indicators
 */

// ============================================
// Types
// ============================================

export interface IndicatorResult {
  /** Indicator values (NaN for insufficient data) */
  values: Float32Array;
  /** Additional line (e.g., signal line for MACD) */
  signal?: Float32Array;
  /** Upper band (e.g., Bollinger upper) */
  upper?: Float32Array;
  /** Lower band (e.g., Bollinger lower) */
  lower?: Float32Array;
  /** Histogram (e.g., MACD histogram) */
  histogram?: Float32Array;
}

export interface OHLCData {
  open: Float32Array | Float64Array;
  high: Float32Array | Float64Array;
  low: Float32Array | Float64Array;
  close: Float32Array | Float64Array;
  volume?: Float32Array | Float64Array;
}

// ============================================
// Moving Averages
// ============================================

/**
 * Simple Moving Average (SMA)
 * @param data Input data array
 * @param period Number of periods
 */
export function sma(data: Float32Array | Float64Array | number[], period: number): Float32Array {
  const input = data instanceof Float32Array || data instanceof Float64Array ? data : Float32Array.from(data);
  const result = new Float32Array(input.length);
  
  if (period < 1 || period > input.length) {
    result.fill(NaN);
    return result;
  }

  // Fill initial values with NaN
  for (let i = 0; i < period - 1; i++) {
    result[i] = NaN;
  }

  // Calculate first SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += input[i];
  }
  result[period - 1] = sum / period;

  // Calculate remaining SMAs using sliding window
  for (let i = period; i < input.length; i++) {
    sum = sum - input[i - period] + input[i];
    result[i] = sum / period;
  }

  return result;
}

/**
 * Exponential Moving Average (EMA)
 * @param data Input data array
 * @param period Number of periods
 */
export function ema(data: Float32Array | Float64Array | number[], period: number): Float32Array {
  const input = data instanceof Float32Array || data instanceof Float64Array ? data : Float32Array.from(data);
  const result = new Float32Array(input.length);
  
  if (period < 1 || period > input.length) {
    result.fill(NaN);
    return result;
  }

  const multiplier = 2 / (period + 1);

  // Fill initial values with NaN
  for (let i = 0; i < period - 1; i++) {
    result[i] = NaN;
  }

  // First EMA is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += input[i];
  }
  result[period - 1] = sum / period;

  // Calculate remaining EMAs
  for (let i = period; i < input.length; i++) {
    result[i] = (input[i] - result[i - 1]) * multiplier + result[i - 1];
  }

  return result;
}

/**
 * Weighted Moving Average (WMA)
 * @param data Input data array
 * @param period Number of periods
 */
export function wma(data: Float32Array | Float64Array | number[], period: number): Float32Array {
  const input = data instanceof Float32Array || data instanceof Float64Array ? data : Float32Array.from(data);
  const result = new Float32Array(input.length);
  
  if (period < 1 || period > input.length) {
    result.fill(NaN);
    return result;
  }

  const weightSum = (period * (period + 1)) / 2;

  // Fill initial values with NaN
  for (let i = 0; i < period - 1; i++) {
    result[i] = NaN;
  }

  // Calculate WMAs
  for (let i = period - 1; i < input.length; i++) {
    let weightedSum = 0;
    for (let j = 0; j < period; j++) {
      weightedSum += input[i - period + 1 + j] * (j + 1);
    }
    result[i] = weightedSum / weightSum;
  }

  return result;
}

/**
 * Double Exponential Moving Average (DEMA)
 * @param data Input data array
 * @param period Number of periods
 */
export function dema(data: Float32Array | Float64Array | number[], period: number): Float32Array {
  const ema1 = ema(data, period);
  const ema2 = ema(ema1, period);
  const result = new Float32Array(data.length);

  for (let i = 0; i < data.length; i++) {
    result[i] = 2 * ema1[i] - ema2[i];
  }

  return result;
}

/**
 * Triple Exponential Moving Average (TEMA)
 * @param data Input data array
 * @param period Number of periods
 */
export function tema(data: Float32Array | Float64Array | number[], period: number): Float32Array {
  const ema1 = ema(data, period);
  const ema2 = ema(ema1, period);
  const ema3 = ema(ema2, period);
  const result = new Float32Array(data.length);

  for (let i = 0; i < data.length; i++) {
    result[i] = 3 * ema1[i] - 3 * ema2[i] + ema3[i];
  }

  return result;
}

// ============================================
// Momentum Indicators
// ============================================

/**
 * Relative Strength Index (RSI)
 * @param data Close prices
 * @param period RSI period (default: 14)
 */
export function rsi(data: Float32Array | Float64Array | number[], period: number = 14): Float32Array {
  const input = data instanceof Float32Array || data instanceof Float64Array ? data : Float32Array.from(data);
  const result = new Float32Array(input.length);
  
  if (period < 1 || input.length < period + 1) {
    result.fill(NaN);
    return result;
  }

  // Fill initial values with NaN
  for (let i = 0; i < period; i++) {
    result[i] = NaN;
  }

  // Calculate initial average gain/loss
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = input[i] - input[i - 1];
    if (change > 0) {
      avgGain += change;
    } else {
      avgLoss += Math.abs(change);
    }
  }

  avgGain /= period;
  avgLoss /= period;

  // First RSI value
  if (avgLoss === 0) {
    result[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    result[period] = 100 - (100 / (1 + rs));
  }

  // Calculate remaining RSI values using smoothed averages
  for (let i = period + 1; i < input.length; i++) {
    const change = input[i] - input[i - 1];
    let gain = 0;
    let loss = 0;

    if (change > 0) {
      gain = change;
    } else {
      loss = Math.abs(change);
    }

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = 100 - (100 / (1 + rs));
    }
  }

  return result;
}

/**
 * Moving Average Convergence Divergence (MACD)
 * @param data Close prices
 * @param fastPeriod Fast EMA period (default: 12)
 * @param slowPeriod Slow EMA period (default: 26)
 * @param signalPeriod Signal line period (default: 9)
 */
export function macd(
  data: Float32Array | Float64Array | number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): IndicatorResult {
  const input = data instanceof Float32Array || data instanceof Float64Array ? data : Float32Array.from(data);
  
  const fastEma = ema(input, fastPeriod);
  const slowEma = ema(input, slowPeriod);
  
  // MACD Line = Fast EMA - Slow EMA
  const macdLine = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    macdLine[i] = fastEma[i] - slowEma[i];
  }
  
  // Signal Line = EMA of MACD Line
  const signal = ema(macdLine, signalPeriod);
  
  // Histogram = MACD Line - Signal Line
  const histogram = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    histogram[i] = macdLine[i] - signal[i];
  }

  return {
    values: macdLine,
    signal,
    histogram,
  };
}

/**
 * Stochastic Oscillator
 * @param ohlc OHLC data
 * @param kPeriod %K period (default: 14)
 * @param dPeriod %D smoothing period (default: 3)
 */
export function stochastic(
  ohlc: OHLCData,
  kPeriod: number = 14,
  dPeriod: number = 3
): IndicatorResult {
  const { high, low, close } = ohlc;
  const length = close.length;
  const kValues = new Float32Array(length);
  
  // Calculate %K
  for (let i = 0; i < length; i++) {
    if (i < kPeriod - 1) {
      kValues[i] = NaN;
      continue;
    }
    
    let highest = -Infinity;
    let lowest = Infinity;
    
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (high[j] > highest) highest = high[j];
      if (low[j] < lowest) lowest = low[j];
    }
    
    const range = highest - lowest;
    if (range === 0) {
      kValues[i] = 50; // Neutral when no range
    } else {
      kValues[i] = ((close[i] - lowest) / range) * 100;
    }
  }
  
  // %D is SMA of %K
  const dValues = sma(kValues, dPeriod);

  return {
    values: kValues,  // %K
    signal: dValues,  // %D
  };
}

/**
 * Rate of Change (ROC)
 * @param data Close prices
 * @param period ROC period (default: 10)
 */
export function roc(data: Float32Array | Float64Array | number[], period: number = 10): Float32Array {
  const input = data instanceof Float32Array || data instanceof Float64Array ? data : Float32Array.from(data);
  const result = new Float32Array(input.length);
  
  for (let i = 0; i < period; i++) {
    result[i] = NaN;
  }
  
  for (let i = period; i < input.length; i++) {
    const pastValue = input[i - period];
    if (pastValue === 0) {
      result[i] = NaN;
    } else {
      result[i] = ((input[i] - pastValue) / pastValue) * 100;
    }
  }

  return result;
}

/**
 * Momentum
 * @param data Close prices
 * @param period Momentum period (default: 10)
 */
export function momentum(data: Float32Array | Float64Array | number[], period: number = 10): Float32Array {
  const input = data instanceof Float32Array || data instanceof Float64Array ? data : Float32Array.from(data);
  const result = new Float32Array(input.length);
  
  for (let i = 0; i < period; i++) {
    result[i] = NaN;
  }
  
  for (let i = period; i < input.length; i++) {
    result[i] = input[i] - input[i - period];
  }

  return result;
}

// ============================================
// Volatility Indicators
// ============================================

/**
 * Bollinger Bands
 * @param data Close prices
 * @param period SMA period (default: 20)
 * @param stdDev Standard deviation multiplier (default: 2)
 */
export function bollingerBands(
  data: Float32Array | Float64Array | number[],
  period: number = 20,
  stdDev: number = 2
): IndicatorResult {
  const input = data instanceof Float32Array || data instanceof Float64Array ? data : Float32Array.from(data);
  const middle = sma(input, period);
  const upper = new Float32Array(input.length);
  const lower = new Float32Array(input.length);

  for (let i = 0; i < input.length; i++) {
    if (i < period - 1) {
      upper[i] = NaN;
      lower[i] = NaN;
      continue;
    }

    // Calculate standard deviation
    let sumSquares = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = input[j] - middle[i];
      sumSquares += diff * diff;
    }
    const std = Math.sqrt(sumSquares / period);

    upper[i] = middle[i] + stdDev * std;
    lower[i] = middle[i] - stdDev * std;
  }

  return {
    values: middle,
    upper,
    lower,
  };
}

/**
 * Average True Range (ATR)
 * @param ohlc OHLC data
 * @param period ATR period (default: 14)
 */
export function atr(ohlc: OHLCData, period: number = 14): Float32Array {
  const { high, low, close } = ohlc;
  const length = close.length;
  const tr = new Float32Array(length);
  
  // True Range calculation
  tr[0] = high[0] - low[0];
  
  for (let i = 1; i < length; i++) {
    const hl = high[i] - low[i];
    const hc = Math.abs(high[i] - close[i - 1]);
    const lc = Math.abs(low[i] - close[i - 1]);
    tr[i] = Math.max(hl, hc, lc);
  }

  // ATR is smoothed average of True Range
  return ema(tr, period);
}

/**
 * Standard Deviation
 * @param data Input data
 * @param period Period for calculation (default: 20)
 */
export function standardDeviation(data: Float32Array | Float64Array | number[], period: number = 20): Float32Array {
  const input = data instanceof Float32Array || data instanceof Float64Array ? data : Float32Array.from(data);
  const result = new Float32Array(input.length);
  const avg = sma(input, period);

  for (let i = 0; i < input.length; i++) {
    if (i < period - 1) {
      result[i] = NaN;
      continue;
    }

    let sumSquares = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = input[j] - avg[i];
      sumSquares += diff * diff;
    }
    result[i] = Math.sqrt(sumSquares / period);
  }

  return result;
}

// ============================================
// Volume Indicators
// ============================================

/**
 * Volume Weighted Average Price (VWAP)
 * @param ohlc OHLC data with volume
 */
export function vwap(ohlc: OHLCData): Float32Array {
  const { high, low, close, volume } = ohlc;
  
  if (!volume) {
    throw new Error('VWAP requires volume data');
  }

  const length = close.length;
  const result = new Float32Array(length);
  
  let cumulativeTPV = 0; // Cumulative Typical Price * Volume
  let cumulativeVolume = 0;

  for (let i = 0; i < length; i++) {
    const typicalPrice = (high[i] + low[i] + close[i]) / 3;
    cumulativeTPV += typicalPrice * volume[i];
    cumulativeVolume += volume[i];
    
    if (cumulativeVolume === 0) {
      result[i] = typicalPrice;
    } else {
      result[i] = cumulativeTPV / cumulativeVolume;
    }
  }

  return result;
}

/**
 * On-Balance Volume (OBV)
 * @param close Close prices
 * @param volume Volume data
 */
export function obv(
  close: Float32Array | Float64Array | number[],
  volume: Float32Array | Float64Array | number[]
): Float32Array {
  const closeInput = close instanceof Float32Array || close instanceof Float64Array ? close : Float32Array.from(close);
  const volumeInput = volume instanceof Float32Array || volume instanceof Float64Array ? volume : Float32Array.from(volume);
  
  const result = new Float32Array(closeInput.length);
  result[0] = volumeInput[0];

  for (let i = 1; i < closeInput.length; i++) {
    if (closeInput[i] > closeInput[i - 1]) {
      result[i] = result[i - 1] + volumeInput[i];
    } else if (closeInput[i] < closeInput[i - 1]) {
      result[i] = result[i - 1] - volumeInput[i];
    } else {
      result[i] = result[i - 1];
    }
  }

  return result;
}

// ============================================
// Trend Indicators
// ============================================

/**
 * Average Directional Index (ADX)
 * @param ohlc OHLC data
 * @param period ADX period (default: 14)
 */
export function adx(ohlc: OHLCData, period: number = 14): IndicatorResult {
  const { high, low, close } = ohlc;
  const length = close.length;
  
  const plusDM = new Float32Array(length);
  const minusDM = new Float32Array(length);
  const tr = new Float32Array(length);
  
  // Calculate +DM, -DM, TR
  tr[0] = high[0] - low[0];
  plusDM[0] = 0;
  minusDM[0] = 0;

  for (let i = 1; i < length; i++) {
    const upMove = high[i] - high[i - 1];
    const downMove = low[i - 1] - low[i];
    
    plusDM[i] = upMove > downMove && upMove > 0 ? upMove : 0;
    minusDM[i] = downMove > upMove && downMove > 0 ? downMove : 0;
    
    const hl = high[i] - low[i];
    const hc = Math.abs(high[i] - close[i - 1]);
    const lc = Math.abs(low[i] - close[i - 1]);
    tr[i] = Math.max(hl, hc, lc);
  }

  // Smooth with EMA
  const smoothedTR = ema(tr, period);
  const smoothedPlusDM = ema(plusDM, period);
  const smoothedMinusDM = ema(minusDM, period);

  // Calculate +DI and -DI
  const plusDI = new Float32Array(length);
  const minusDI = new Float32Array(length);
  const dx = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    if (smoothedTR[i] === 0 || isNaN(smoothedTR[i])) {
      plusDI[i] = NaN;
      minusDI[i] = NaN;
      dx[i] = NaN;
    } else {
      plusDI[i] = (smoothedPlusDM[i] / smoothedTR[i]) * 100;
      minusDI[i] = (smoothedMinusDM[i] / smoothedTR[i]) * 100;
      
      const diSum = plusDI[i] + minusDI[i];
      dx[i] = diSum === 0 ? 0 : (Math.abs(plusDI[i] - minusDI[i]) / diSum) * 100;
    }
  }

  // ADX is smoothed DX
  const adxValues = ema(dx, period);

  return {
    values: adxValues,
    upper: plusDI,  // +DI
    lower: minusDI, // -DI
  };
}

/**
 * Aroon Indicator
 * @param ohlc OHLC data
 * @param period Aroon period (default: 25)
 */
export function aroon(ohlc: OHLCData, period: number = 25): IndicatorResult {
  const { high, low } = ohlc;
  const length = high.length;
  
  const aroonUp = new Float32Array(length);
  const aroonDown = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    if (i < period) {
      aroonUp[i] = NaN;
      aroonDown[i] = NaN;
      continue;
    }

    let highestIdx = i;
    let lowestIdx = i;
    let highest = -Infinity;
    let lowest = Infinity;

    for (let j = i - period; j <= i; j++) {
      if (high[j] > highest) {
        highest = high[j];
        highestIdx = j;
      }
      if (low[j] < lowest) {
        lowest = low[j];
        lowestIdx = j;
      }
    }

    aroonUp[i] = ((period - (i - highestIdx)) / period) * 100;
    aroonDown[i] = ((period - (i - lowestIdx)) / period) * 100;
  }

  // Aroon Oscillator = Aroon Up - Aroon Down
  const oscillator = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    oscillator[i] = aroonUp[i] - aroonDown[i];
  }

  return {
    values: oscillator,
    upper: aroonUp,
    lower: aroonDown,
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Calculate percentage change
 */
export function percentChange(data: Float32Array | Float64Array | number[], period: number = 1): Float32Array {
  const input = data instanceof Float32Array || data instanceof Float64Array ? data : Float32Array.from(data);
  const result = new Float32Array(input.length);
  
  for (let i = 0; i < period; i++) {
    result[i] = NaN;
  }
  
  for (let i = period; i < input.length; i++) {
    const prev = input[i - period];
    if (prev === 0) {
      result[i] = NaN;
    } else {
      result[i] = ((input[i] - prev) / prev) * 100;
    }
  }

  return result;
}

/**
 * Calculate cumulative sum
 */
export function cumsum(data: Float32Array | Float64Array | number[]): Float32Array {
  const input = data instanceof Float32Array || data instanceof Float64Array ? data : Float32Array.from(data);
  const result = new Float32Array(input.length);
  
  result[0] = input[0];
  for (let i = 1; i < input.length; i++) {
    result[i] = result[i - 1] + input[i];
  }

  return result;
}

/**
 * Normalize data to 0-100 range
 */
export function normalize(data: Float32Array | Float64Array | number[]): Float32Array {
  const input = data instanceof Float32Array || data instanceof Float64Array ? data : Float32Array.from(data);
  const result = new Float32Array(input.length);
  
  let min = Infinity;
  let max = -Infinity;
  
  for (let i = 0; i < input.length; i++) {
    if (!isNaN(input[i])) {
      if (input[i] < min) min = input[i];
      if (input[i] > max) max = input[i];
    }
  }

  const range = max - min;
  if (range === 0) {
    result.fill(50);
  } else {
    for (let i = 0; i < input.length; i++) {
      result[i] = ((input[i] - min) / range) * 100;
    }
  }

  return result;
}
