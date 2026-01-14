---
title: Anomaly Detection Demo
description: Real-time anomaly detection with multiple algorithms
---

<script setup>
import AnomalyDetectionDemo from '../.vitepress/theme/demos/AnomalyDetectionDemo.vue'
</script>

# Anomaly Detection Demo

Detect outliers and anomalies in your data using statistical and machine learning algorithms.

<AnomalyDetectionDemo />

::: info Visual Anomaly Detection with Local Deviation
The demo above shows **real-time bidirectional anomaly detection** using an improved algorithm. Anomalies are marked with **red circles** on the chart.

**Algorithm Features**:
- ✅ **Local Deviation Analysis**: Uses moving window to handle trends
- ✅ **Bidirectional Detection**: Detects both upward AND downward spikes equally
- ✅ **Adaptive Window**: Automatically adjusts to data size (20 points or 10% of data)
- ✅ **Trend-Aware**: Excludes current point from local statistics to avoid bias

**How it works**:
For each point, the algorithm:
1. Calculates local mean and std dev from surrounding points (±window)
2. Computes deviation score: `(value - localMean) / localStdDev`
3. Marks as anomaly if `|deviation| > sensitivity`

This approach detects anomalies **relative to local context**, not global mean, making it effective for data with trends or patterns.

- Try different **detection methods** to see how they compare
- Adjust **sensitivity** (1.0-5.0) for fine control
- Enable **real-time detection** and **start streaming** to see live detection
- Use **Remove Anomalies** to clean the data
:::

## What is Anomaly Detection?

Anomaly detection identifies data points that deviate significantly from the expected pattern. These outliers can indicate:
- Sensor errors or malfunctions
- Unusual events or conditions
- Data quality issues
- Interesting phenomena worth investigating

## Detection Methods

### 📊 Z-Score (Standard Deviation)

The Z-Score method identifies points that are more than a specified number of standard deviations away from the mean.

**Formula**: `z = (x - μ) / σ`

**Best for**:
- Normally distributed data
- Quick detection
- Well-understood thresholds

**Sensitivity**: Number of standard deviations (typical: 2-4)
- 2σ: ~95% confidence (more sensitive)
- 3σ: ~99.7% confidence (balanced)
- 4σ: ~99.99% confidence (less sensitive)

### 📈 MAD (Median Absolute Deviation)

MAD is more robust to outliers than Z-Score because it uses the median instead of the mean.

**Formula**: `MAD = median(|x - median(x)|)`

**Best for**:
- Data with existing outliers
- Non-normal distributions
- Robust detection

**Sensitivity**: MAD multiplier (typical: 2.5-4)

### 📉 IQR (Interquartile Range)

The classic box plot method. Points outside Q1 - k×IQR and Q3 + k×IQR are considered anomalies.

**Formula**: `IQR = Q3 - Q1`

**Best for**:
- General purpose detection
- Well-understood method
- Visual interpretation

**Sensitivity**: IQR multiplier (typical: 1.5-3)
- 1.5: Standard outlier detection
- 3.0: Extreme outlier detection

### 🌲 Isolation Forest

Machine learning approach that isolates anomalies through random partitioning. Points that are isolated quickly are more likely to be anomalies.

**Best for**:
- Complex patterns
- High-dimensional data
- Unknown distributions

**Sensitivity**: Contamination rate (typical: 0.01-0.1)
- 0.01: Expect 1% anomalies
- 0.05: Expect 5% anomalies
- 0.1: Expect 10% anomalies

## Features

### Real-time Detection

Enable real-time detection to automatically analyze data as it streams in:

```typescript
chart.use(PluginAnomalyDetection({
  realtime: true,
  method: 'zscore',
  sensitivity: 3
}));

chart.on('anomaly:detected', (result) => {
  console.log(`Found ${result.anomalies.length} anomalies`);
});
```

### Rolling Window Analysis

For non-stationary data, use a rolling window to analyze only recent points:

```typescript
chart.use(PluginAnomalyDetection({
  rollingWindow: true,
  windowSize: 100,  // Analyze last 100 points
  method: 'mad'
}));
```

### Multiple Series Monitoring

Monitor specific series or all series at once:

```typescript
// Monitor specific series
chart.use(PluginAnomalyDetection({
  seriesIds: ['sensor1', 'sensor2']
}));

// Or monitor all series
const plugin = chart.getPlugin('anomaly-detection');
const results = plugin.detectAll();
```

## Use Cases

### Sensor Monitoring

Detect sensor failures or unusual readings in real-time:

```typescript
const chart = createChart({ container });

chart.use(PluginAnomalyDetection({
  method: 'zscore',
  sensitivity: 3,
  realtime: true
}));

chart.on('anomaly:detected', (result) => {
  if (result.anomalies.length > 0) {
    sendAlert(`Sensor anomaly detected: ${result.seriesId}`);
  }
});
```

### Quality Control

Identify defective products or process deviations:

```typescript
chart.use(PluginAnomalyDetection({
  method: 'iqr',
  sensitivity: 1.5,  // Standard outlier detection
  highlight: true
}));

const result = plugin.detect('measurements');
const defectRate = (result.anomalies.length / result.totalPoints) * 100;

if (defectRate > 5) {
  console.warn(`High defect rate: ${defectRate.toFixed(1)}%`);
}
```

### Financial Fraud Detection

Detect unusual transactions or trading patterns:

```typescript
chart.use(PluginAnomalyDetection({
  method: 'isolation-forest',
  sensitivity: 0.01,  // Expect 1% fraud
  realtime: true
}));
```

### Network Monitoring

Identify network anomalies or security threats:

```typescript
chart.use(PluginAnomalyDetection({
  method: 'mad',
  sensitivity: 3.5,
  rollingWindow: true,
  windowSize: 1000
}));
```

## Algorithm Comparison

| Feature | Z-Score | MAD | IQR | Isolation Forest |
|---------|---------|-----|-----|------------------|
| **Speed** | ⚡⚡⚡ | ⚡⚡ | ⚡⚡⚡ | ⚡ |
| **Robustness** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Complexity** | Low | Low | Low | High |
| **Memory** | Low | Low | Low | Medium |
| **Best For** | Normal data | Outlier-heavy | General | Complex patterns |

## Code Examples

### Basic Detection

```typescript
import { createChart, PluginAnomalyDetection } from 'scichart-engine';

const chart = createChart({ container });

chart.use(PluginAnomalyDetection({
  method: 'zscore',
  sensitivity: 3
}));

chart.addSeries({
  id: 'data',
  type: 'line',
  data: { x, y }
});

const plugin = chart.getPlugin('anomaly-detection');
const result = plugin.detect('data');

console.log(`Detected ${result.anomalies.length} anomalies`);
```

### Method Comparison

```typescript
const methods = ['zscore', 'mad', 'iqr', 'isolation-forest'];
const plugin = chart.getPlugin('anomaly-detection');

for (const method of methods) {
  plugin.setConfig({ method });
  const result = plugin.detect('data');
  
  console.log(`${method}: ${result.anomalies.length} anomalies`);
}
```

### Sensitivity Tuning

```typescript
const plugin = chart.getPlugin('anomaly-detection');

// Find optimal sensitivity
for (let s = 2; s <= 4; s += 0.5) {
  plugin.setConfig({ sensitivity: s });
  const result = plugin.detect('data');
  
  const rate = (result.anomalies.length / result.totalPoints) * 100;
  console.log(`Sensitivity ${s}: ${rate.toFixed(1)}% anomalies`);
}
```

### Event Handling

```typescript
chart.on('anomaly:detected', (result) => {
  console.log(`Series: ${result.seriesId}`);
  console.log(`Method: ${result.method}`);
  console.log(`Threshold: ${result.threshold}`);
  console.log(`Anomalies: ${result.anomalies.length}/${result.totalPoints}`);
  
  result.anomalies.forEach((anomaly, i) => {
    console.log(`  ${i + 1}. Point ${anomaly.index}: (${anomaly.x}, ${anomaly.y}) - Score: ${anomaly.score.toFixed(2)}`);
  });
});
```

## Tips & Best Practices

### Choosing a Method

1. **Start with Z-Score** for normally distributed data
2. **Use MAD** if you have existing outliers
3. **Try IQR** for general-purpose detection
4. **Use Isolation Forest** for complex, unknown patterns

### Tuning Sensitivity

- **Too many false positives?** Increase sensitivity
- **Missing anomalies?** Decrease sensitivity
- **Unsure?** Start with default values (3 for Z-Score/MAD, 1.5 for IQR, 0.05 for Isolation Forest)

### Performance Optimization

- Enable `rollingWindow` for streaming data
- Use Z-Score or IQR for fastest detection
- Limit `windowSize` to reduce memory usage
- Disable `realtime` for batch processing

### Data Requirements

- **Minimum points**: 30 (configurable via `minWindowSize`)
- **Recommended**: 100+ points for reliable detection
- **Data quality**: Remove NaN/Infinity values before detection

## See Also

- [Anomaly Detection API](/api/plugin-anomaly-detection) - Complete API reference
- [Analysis Plugin](/api/plugin-analysis) - Other analysis tools
- [Streaming Plugin](/api/plugin-streaming) - Real-time data handling
