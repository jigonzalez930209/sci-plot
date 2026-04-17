---
title: Anomaly Detection Plugin
description: Real-time anomaly detection with multiple statistical algorithms
---

# Anomaly Detection Plugin

The Anomaly Detection plugin provides real-time detection of outliers and anomalies in your data using multiple statistical and machine learning algorithms.

## Features

- **4 Detection Algorithms**: Z-Score, MAD, IQR, and Isolation Forest
- **Real-time Detection**: Monitor data as it streams
- **Configurable Sensitivity**: Adjust thresholds for each algorithm
- **Rolling Windows**: Analyze recent data only
- **Event Emission**: Get notified when anomalies are detected
- **Per-Series or Global**: Detect on specific series or all at once

## Installation

```typescript
import { createChart, PluginAnomalyDetection } from 'sci-plot';

const chart = createChart({
  container: document.getElementById('chart')
});

// Add the plugin
chart.use(PluginAnomalyDetection({
  method: 'zscore',
  sensitivity: 3,
  realtime: true,
  highlight: true
}));
```

## Configuration

### PluginAnomalyDetectionConfig

```typescript
interface PluginAnomalyDetectionConfig {
  /** Detection method (default: 'zscore') */
  method?: 'zscore' | 'mad' | 'iqr' | 'isolation-forest';
  
  /** Sensitivity threshold (default: varies by method) */
  sensitivity?: number;
  
  /** Enable real-time detection (default: false) */
  realtime?: boolean;
  
  /** Highlight anomalies on chart (default: true) */
  highlight?: boolean;
  
  /** Highlight color (default: '#ff0000') */
  highlightColor?: string;
  
  /** Highlight marker size (default: 8) */
  highlightSize?: number;
  
  /** Minimum window size (default: 30) */
  minWindowSize?: number;
  
  /** Use rolling window (default: false) */
  rollingWindow?: boolean;
  
  /** Rolling window size (default: 100) */
  windowSize?: number;
  
  /** Series IDs to monitor (empty = all) */
  seriesIds?: string[];
}
```

## Detection Methods

Each method uses a **different statistical approach** to define "normal" and detect anomalies:

### 1. Z-Score (Parametric - Mean-Based)

**How it works**: Measures how many standard deviations a point is from the local mean.

```typescript
localMean = average(surrounding points)
localStdDev = standard_deviation(surrounding points)
zScore = |value - localMean| / localStdDev
isAnomaly = zScore > threshold
```

**Key Characteristics**:
- ✅ Uses **mean** (sensitive to outliers in window)
- ✅ Uses **standard deviation** (parametric measure)
- ✅ Assumes **normal distribution**
- ⚠️ Can be affected by extreme values in the window

**Best for**: Clean data with approximately normal distribution

**Sensitivity**: Number of standard deviations (typical: 2-4)
- 2σ: ~95% confidence (more sensitive)
- 3σ: ~99.7% confidence (balanced)
- 4σ: ~99.99% confidence (less sensitive)

```typescript
chart.use(PluginAnomalyDetection({
  method: 'zscore',
  sensitivity: 3  // 3 standard deviations
}));
```

---

### 2. MAD (Non-Parametric - Median-Based)

**How it works**: Uses median instead of mean for robustness to outliers.

```typescript
localMedian = median(surrounding points)
localMAD = median(|surrounding points - localMedian|)
modifiedZScore = |0.6745 * (value - localMedian)| / localMAD
isAnomaly = modifiedZScore > threshold
```

**Key Characteristics**:
- ✅ Uses **median** (robust to outliers in window)
- ✅ Uses **MAD** (robust measure of spread)
- ✅ **Non-parametric** (no distribution assumption)
- ✅ More stable with existing outliers

**Best for**: Data with existing outliers, skewed distributions

**Sensitivity**: MAD multiplier (typical: 2.5-4)

```typescript
chart.use(PluginAnomalyDetection({
  method: 'mad',
  sensitivity: 3.5  // MAD multiplier
}));
```

---

### 3. IQR (Quartile-Based - Box Plot)

**How it works**: Classic box plot method using quartiles.

```typescript
Q1 = 25th percentile(surrounding points)
Q3 = 75th percentile(surrounding points)
IQR = Q3 - Q1
lowerBound = Q1 - multiplier * IQR
upperBound = Q3 + multiplier * IQR
isAnomaly = value < lowerBound OR value > upperBound
```

**Key Characteristics**:
- ✅ Uses **quartiles** (25th and 75th percentiles)
- ✅ **Distribution-free** (works with any distribution)
- ✅ Well-understood, visual interpretation
- ✅ Standard statistical method

**Best for**: General purpose, when you want a well-known method

**Sensitivity**: IQR multiplier (typical: 1.5-3)
- 1.5: Standard outlier detection
- 3.0: Extreme outlier detection

```typescript
chart.use(PluginAnomalyDetection({
  method: 'iqr',
  sensitivity: 1.5  // IQR multiplier
}));
```

---

### 4. Isolation Forest (Machine Learning)

**How it works**: Isolates anomalies through random partitioning.

```typescript
for each point:
  build random decision trees
  measure how quickly point is isolated
  points isolated quickly = anomalies
```

**Key Characteristics**:
- ✅ **Machine learning** approach
- ✅ Works with **complex patterns**
- ✅ No distribution assumptions
- ⚠️ Slower than statistical methods

**Best for**: Complex, high-dimensional data with unknown patterns

**Sensitivity**: Contamination rate (typical: 0.01-0.1)
- 0.01: Expect 1% anomalies
- 0.05: Expect 5% anomalies
- 0.1: Expect 10% anomalies

```typescript
chart.use(PluginAnomalyDetection({
  method: 'isolation-forest',
  sensitivity: 0.05  // 5% contamination
}));
```

---

## Method Comparison

| Method | Statistic | Robustness | Speed | Best For |
|--------|-----------|------------|-------|----------|
| **Z-Score** | Mean + StdDev | ⭐⭐ Moderate | ⚡⚡⚡ Fast | Normal distributions |
| **MAD** | Median + MAD | ⭐⭐⭐ High | ⚡⚡ Moderate | Outlier-heavy data |
| **IQR** | Quartiles (Q1, Q3) | ⭐⭐⭐ High | ⚡⚡⚡ Fast | General purpose |
| **Isolation Forest** | Random trees | ⭐⭐⭐ High | ⚡ Slow | Complex patterns |

**Key Differences**:
- **Z-Score**: Sensitive to outliers (uses mean)
- **MAD**: Robust to outliers (uses median)
- **IQR**: Based on percentiles (quartile method)
- **Isolation Forest**: ML-based (no assumptions)

## API Methods

### detect(seriesId)

Run anomaly detection on a specific series.

```typescript
const anomalyPlugin = chart.getPlugin('anomaly-detection');
const result = anomalyPlugin.detect('series1');

console.log(`Found ${result.anomalies.length} anomalies`);
```

**Returns**: `AnomalyDetectionResult | null`

### detectAll()

Run detection on all monitored series.

```typescript
const results = anomalyPlugin.detectAll();

results.forEach((result, seriesId) => {
  console.log(`${seriesId}: ${result.anomalies.length} anomalies`);
});
```

**Returns**: `Map<string, AnomalyDetectionResult>`

### getResults(seriesId)

Get cached detection results for a series.

```typescript
const result = anomalyPlugin.getResults('series1');
if (result) {
  console.log(`Last detection: ${new Date(result.timestamp)}`);
}
```

**Returns**: `AnomalyDetectionResult | undefined`

### getAllResults()

Get all cached detection results.

```typescript
const allResults = anomalyPlugin.getAllResults();
```

**Returns**: `Map<string, AnomalyDetectionResult>`

### clear()

Clear all cached detection results.

```typescript
anomalyPlugin.clear();
```

### setConfig(config)

Update plugin configuration.

```typescript
anomalyPlugin.setConfig({
  method: 'mad',
  sensitivity: 4
});
```

### getConfig()

Get current configuration.

```typescript
const config = anomalyPlugin.getConfig();
console.log(`Method: ${config.method}`);
```

## Data Types

### AnomalyPoint

```typescript
interface AnomalyPoint {
  /** Index in the data array */
  index: number;
  /** X value */
  x: number;
  /** Y value */
  y: number;
  /** Anomaly score (higher = more anomalous) */
  score: number;
  /** Method used for detection */
  method: 'zscore' | 'mad' | 'iqr' | 'isolation-forest';
}
```

### AnomalyDetectionResult

```typescript
interface AnomalyDetectionResult {
  /** Series ID */
  seriesId: string;
  /** Detected anomalies */
  anomalies: AnomalyPoint[];
  /** Total points analyzed */
  totalPoints: number;
  /** Detection method used */
  method: 'zscore' | 'mad' | 'iqr' | 'isolation-forest';
  /** Threshold value used */
  threshold: number;
  /** Timestamp of detection */
  timestamp: number;
}
```

## Events

### anomaly:detected

Emitted when anomalies are detected.

```typescript
chart.on('anomaly:detected', (result: AnomalyDetectionResult) => {
  console.log(`Detected ${result.anomalies.length} anomalies in ${result.seriesId}`);
  
  result.anomalies.forEach(anomaly => {
    console.log(`  Point ${anomaly.index}: (${anomaly.x}, ${anomaly.y}) - Score: ${anomaly.score}`);
  });
});
```

## Examples

### Real-time Monitoring

```typescript
const chart = createChart({ container });

chart.use(PluginAnomalyDetection({
  method: 'zscore',
  sensitivity: 3,
  realtime: true,
  rollingWindow: true,
  windowSize: 100
}));

chart.on('anomaly:detected', (result) => {
  if (result.anomalies.length > 0) {
    alert(`Anomaly detected at point ${result.anomalies[0].index}`);
  }
});

// Add streaming data
chart.addSeries({
  id: 'sensor',
  type: 'line',
  data: { x: [], y: [] }
});

// Simulate streaming
setInterval(() => {
  const newPoint = {
    x: new Float32Array([Date.now()]),
    y: new Float32Array([Math.random() * 100])
  };
  chart.updateSeries('sensor', newPoint, { append: true });
}, 1000);
```

### Batch Analysis

```typescript
const chart = createChart({ container });

chart.use(PluginAnomalyDetection({
  method: 'mad',
  sensitivity: 3.5,
  realtime: false
}));

// Add data
chart.addSeries({
  id: 'data',
  type: 'line',
  data: {
    x: new Float32Array([...Array(100)].map((_, i) => i)),
    y: generateDataWithAnomalies()
  }
});

// Run detection
const plugin = chart.getPlugin('anomaly-detection');
const result = plugin.detect('data');

console.log(`Found ${result.anomalies.length} anomalies`);
```

### Multiple Methods Comparison

```typescript
const methods = ['zscore', 'mad', 'iqr', 'isolation-forest'];
const results = {};

for (const method of methods) {
  const plugin = chart.getPlugin('anomaly-detection');
  plugin.setConfig({ method });
  
  const result = plugin.detect('data');
  results[method] = result.anomalies.length;
}

console.log('Anomalies detected by method:', results);
```

### Custom Sensitivity Tuning

```typescript
const plugin = chart.getPlugin('anomaly-detection');

// Test different sensitivities
for (let sensitivity = 2; sensitivity <= 4; sensitivity += 0.5) {
  plugin.setConfig({ sensitivity });
  const result = plugin.detect('data');
  
  console.log(`Sensitivity ${sensitivity}: ${result.anomalies.length} anomalies`);
}
```

## Algorithm Comparison

| Algorithm | Speed | Robustness | Best For |
|-----------|-------|------------|----------|
| **Z-Score** | ⚡⚡⚡ Fast | ⭐⭐ Moderate | Normal distributions |
| **MAD** | ⚡⚡ Moderate | ⭐⭐⭐ High | Outlier-heavy data |
| **IQR** | ⚡⚡⚡ Fast | ⭐⭐⭐ High | General purpose |
| **Isolation Forest** | ⚡ Slow | ⭐⭐⭐ High | Complex patterns |

## Performance Tips

1. **Use Rolling Windows**: For streaming data, enable `rollingWindow` to limit analysis to recent points
2. **Choose the Right Method**: Z-Score is fastest, Isolation Forest is most accurate but slowest
3. **Adjust Sensitivity**: Higher sensitivity = fewer false positives but may miss anomalies
4. **Minimum Window Size**: Ensure at least 30 points for reliable detection

## Troubleshooting

### No Anomalies Detected

- Check if `minWindowSize` is met
- Try lowering `sensitivity`
- Verify data has sufficient variance
- Try a different detection method

### Too Many False Positives

- Increase `sensitivity`
- Use MAD instead of Z-Score for outlier-heavy data
- Enable `rollingWindow` for non-stationary data

### Performance Issues

- Use `rollingWindow` with smaller `windowSize`
- Switch from Isolation Forest to Z-Score or IQR
- Disable `realtime` for batch processing

## See Also

- [Anomaly Detection Demo](/examples/anomaly-detection) - Interactive examples
- [Analysis Plugin](/api/plugin-analysis) - Other analysis tools
- [Streaming Plugin](/api/plugin-streaming) - Real-time data handling
