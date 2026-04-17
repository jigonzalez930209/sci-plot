---
title: Financial Indicators Demo
description: Interactive demo of technical analysis indicators - SMA, EMA, RSI, MACD, Bollinger Bands
---

<script setup>
import IndicatorsDemo from '../.vitepress/theme/demos/IndicatorsDemo.vue'
</script>

# Financial Indicators Demo

Experience real-time technical analysis indicators for financial charting. Select different indicators to see how they analyze price data.

<IndicatorsDemo />

## Available Indicators

### Moving Averages
- **SMA (Simple Moving Average)** - Equal weight to all prices in the period
- **EMA (Exponential Moving Average)** - More weight to recent prices
- Note how EMA reacts faster to price changes than SMA

### Bollinger Bands
- Middle band is a 20-period SMA
- Upper/lower bands are 2 standard deviations from the middle
- Price tends to bounce within the bands

### RSI (Relative Strength Index)
- Oscillates between 0-100
- Above 70 = Overbought (potential sell signal)
- Below 30 = Oversold (potential buy signal)

### MACD (Moving Average Convergence Divergence)
- MACD Line = 12-EMA minus 26-EMA
- Signal Line = 9-EMA of MACD line
- Histogram = MACD minus Signal
- Buy signal when MACD crosses above signal

## Usage

```typescript
import { 
  sma, ema, bollingerBands, rsi, macd,
  type IndicatorResult, type OHLCData 
} from 'velo-plot';

// Moving averages on close prices
const prices = chart.getSeries('price').getYValues();
const sma20 = sma(prices, 20);
const ema20 = ema(prices, 20);

// Bollinger Bands
const bb = bollingerBands(prices, 20, 2);
chart.addSeries({ id: 'bb-upper', y: bb.upper });
chart.addSeries({ id: 'bb-lower', y: bb.lower });

// RSI - outputs 0-100 range
const rsiValues = rsi(prices, 14);

// MACD - returns multiple lines
const macdResult = macd(prices, 12, 26, 9);
// macdResult.values - MACD line
// macdResult.signal - Signal line
// macdResult.histogram - Histogram bars
```

## Full Indicator List

| Category | Indicators |
|----------|-----------|
| **Moving Averages** | SMA, EMA, WMA, DEMA, TEMA |
| **Momentum** | RSI, MACD, Stochastic, ROC, Momentum |
| **Volatility** | Bollinger Bands, ATR, Std Deviation |
| **Volume** | VWAP, OBV |
| **Trend** | ADX, Aroon |

See [API Reference](/api/indicators) for complete documentation.
