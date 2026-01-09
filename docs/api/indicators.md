---
title: Financial Indicators
description: Technical analysis indicators for financial charts - SMA, EMA, RSI, MACD, Bollinger Bands, and more
---

# Financial/Technical Indicators

SciChart Engine includes a comprehensive library of technical analysis indicators commonly used in financial charting and signal analysis.

## Moving Averages

### Simple Moving Average (SMA)

```typescript
import { sma } from 'scichart-engine';

const prices = new Float32Array([10, 11, 12, 11, 13, 14, 15, 14, 16, 17]);
const sma20 = sma(prices, 20);  // 20-period SMA
```

### Exponential Moving Average (EMA)

EMA gives more weight to recent prices for faster response:

```typescript
import { ema, dema, tema } from 'scichart-engine';

const emaValues = ema(prices, 12);  // 12-period EMA
const demaValues = dema(prices, 12); // Double EMA (smoother)
const temaValues = tema(prices, 12); // Triple EMA (smoothest)
```

### Weighted Moving Average (WMA)

```typescript
import { wma } from 'scichart-engine';

const wmaValues = wma(prices, 10); // Linear weighted MA
```

## Momentum Indicators

### RSI (Relative Strength Index)

```typescript
import { rsi } from 'scichart-engine';

const rsiValues = rsi(prices, 14);  // 14-period RSI (0-100)

// RSI > 70: Overbought
// RSI < 30: Oversold
```

### MACD (Moving Average Convergence Divergence)

```typescript
import { macd, type IndicatorResult } from 'scichart-engine';

const result = macd(prices, 12, 26, 9);
// result.values: MACD line (Fast EMA - Slow EMA)
// result.signal: Signal line (EMA of MACD)
// result.histogram: MACD - Signal
```

### Stochastic Oscillator

```typescript
import { stochastic, type OHLCData } from 'scichart-engine';

const ohlc: OHLCData = {
  open: openPrices,
  high: highPrices,
  low: lowPrices,
  close: closePrices,
};

const stoch = stochastic(ohlc, 14, 3);
// stoch.values: %K line
// stoch.signal: %D line (SMA of %K)
```

### Momentum & ROC

```typescript
import { momentum, roc } from 'scichart-engine';

const mom = momentum(prices, 10);  // Price - Price[n periods ago]
const rocValues = roc(prices, 10); // Percentage change over n periods
```

## Volatility Indicators

### Bollinger Bands

```typescript
import { bollingerBands } from 'scichart-engine';

const bb = bollingerBands(prices, 20, 2);
// bb.values: Middle band (20-SMA)
// bb.upper: Upper band (SMA + 2*StdDev)
// bb.lower: Lower band (SMA - 2*StdDev)
```

### ATR (Average True Range)

```typescript
import { atr, type OHLCData } from 'scichart-engine';

const atrValues = atr(ohlc, 14);
// Measures volatility, useful for position sizing
```

### Standard Deviation

```typescript
import { standardDeviation } from 'scichart-engine';

const stdDev = standardDeviation(prices, 20);
```

## Volume Indicators

### VWAP (Volume Weighted Average Price)

```typescript
import { vwap, type OHLCData } from 'scichart-engine';

const ohlcWithVolume: OHLCData = {
  ...ohlc,
  volume: volumeData,
};

const vwapValues = vwap(ohlcWithVolume);
// Institutional benchmark price
```

### OBV (On-Balance Volume)

```typescript
import { obv } from 'scichart-engine';

const obvValues = obv(closePrices, volumeData);
// Volume flow indicator
```

## Trend Indicators

### ADX (Average Directional Index)

```typescript
import { adx } from 'scichart-engine';

const adxResult = adx(ohlc, 14);
// adxResult.values: ADX (trend strength 0-100)
// adxResult.upper: +DI (bullish direction)
// adxResult.lower: -DI (bearish direction)

// ADX > 25: Strong trend
// ADX < 20: Weak/no trend
```

### Aroon Oscillator

```typescript
import { aroon } from 'scichart-engine';

const aroonResult = aroon(ohlc, 25);
// aroonResult.values: Aroon Oscillator (Up - Down)
// aroonResult.upper: Aroon Up (0-100)
// aroonResult.lower: Aroon Down (0-100)
```

## Utility Functions

```typescript
import { percentChange, cumsum, normalize } from 'scichart-engine';

// Percentage change
const returns = percentChange(prices, 1); // Daily returns

// Cumulative sum
const cumulative = cumsum(dailyReturns);

// Normalize to 0-100 range
const normalized = normalize(data);
```

## Creating Chart with Indicators

```typescript
import { createChart, ema, bollingerBands } from 'scichart-engine';

// Sample OHLC data
const prices = stockData.close;

// Calculate indicators
const ema20 = ema(prices, 20);
const bb = bollingerBands(prices, 20, 2);

// Create chart with multiple series
const chart = createChart({
  container: document.getElementById('chart'),
  xAxis: { title: 'Date' },
  yAxis: { title: 'Price' },
});

// Add price series
chart.addSeries({ type: 'line', x: dates, y: prices, name: 'Price' });

// Add EMA overlay
chart.addSeries({ 
  type: 'line', 
  x: dates, 
  y: ema20, 
  name: 'EMA 20',
  style: { color: '#ff9800', lineWidth: 1.5 }
});

// Add Bollinger Bands
chart.addSeries({
  type: 'band',
  x: dates,
  y: bb.values,
  yHigh: bb.upper,
  yLow: bb.lower,
  name: 'BB(20,2)',
  style: { fillColor: 'rgba(33, 150, 243, 0.1)', lineColor: '#2196f3' }
});
```

## Type Reference

```typescript
interface OHLCData {
  open: Float32Array | Float64Array;
  high: Float32Array | Float64Array;
  low: Float32Array | Float64Array;
  close: Float32Array | Float64Array;
  volume?: Float32Array | Float64Array;
}

interface IndicatorResult {
  values: Float32Array;      // Main indicator line
  signal?: Float32Array;     // Signal line (MACD, Stochastic)
  upper?: Float32Array;      // Upper band (BB, ADX +DI)
  lower?: Float32Array;      // Lower band (BB, ADX -DI)
  histogram?: Float32Array;  // Histogram (MACD)
}
```

## Performance Notes

All indicator functions:
- Accept `Float32Array`, `Float64Array`, or regular `number[]`
- Return `Float32Array` for memory efficiency
- Use `NaN` for insufficient data periods
- Are optimized for large datasets (100k+ points)
