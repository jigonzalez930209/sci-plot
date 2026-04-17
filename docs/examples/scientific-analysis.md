---
title: Scientific Analysis
description: Advanced scientific visualization with BoxPlots, Error Bars, and ML Integration
---

<script setup>
import ScientificDemo from '../.vitepress/theme/demos/ScientificDemo.vue'
</script>

# Scientific Analysis Demo

Advanced scientific visualization combining **statistical charts**, **measurement uncertainty**, and **machine learning** capabilities—all rendered natively with WebGL for maximum performance.

<ScientificDemo height="500px" />

## Features Demonstrated

### 📦 Box Plot (Statistical Distribution)

Box plots provide a standardized way to display data distribution based on five-number summary:

| Component | Description |
|-----------|-------------|
| **Min** | Minimum value (lower whisker) |
| **Q1** | First quartile (25th percentile) |
| **Median** | Middle value (50th percentile) |
| **Q3** | Third quartile (75th percentile) |
| **Max** | Maximum value (upper whisker) |

```typescript
chart.addSeries({
  id: 'treatment-response',
  type: 'boxplot',
  data: {
    x: [1, 2, 3, 4, 5],        // Group positions
    low: [10, 15, 20, 25, 30], // Min values
    open: [20, 25, 30, 35, 40], // Q1 values
    median: [30, 35, 40, 45, 50],
    close: [40, 45, 50, 55, 60], // Q3 values
    high: [50, 55, 60, 65, 70]   // Max values
  },
  style: {
    color: '#00f2ff',
    barWidth: 0.6
  }
})
```

### 📊 Error Bars (Measurement Uncertainty)

Error bars visualize the uncertainty or variability in measurements. Sci Plot supports:

- **Symmetric errors**: Single ±error value
- **Asymmetric errors**: Separate positive and negative errors
- **Directional**: Show only positive or negative errors
- **Customizable caps**: Toggle and size the end caps

```typescript
chart.addSeries({
  id: 'enzyme-kinetics',
  type: 'scatter',
  data: {
    x: substrateConcData,
    y: velocityData,
    yError: standardDeviations  // Symmetric error
  },
  style: {
    color: '#ff6b6b',
    pointSize: 8,
    errorBars: {
      visible: true,
      color: '#ff6b6b',
      width: 1.5,
      capWidth: 6,
      direction: 'both',  // 'both' | 'positive' | 'negative'
      opacity: 0.7
    }
  }
})
```

#### Asymmetric Errors

```typescript
data: {
  x: values,
  y: measurements,
  yErrorMinus: lowerBounds,
  yErrorPlus: upperBounds
}
```

### 🧠 ML Integration (Signal Processing)

The ML Integration plugin provides native statistical functions without external dependencies:

```typescript
import { PluginMLIntegration } from 'sci-plot'

// Initialize plugin
chart.use(PluginMLIntegration())

// Use native stats
const mean = chart.ml.stats.mean(data)
const std = chart.ml.stats.standardDeviation(data)
const fft = chart.ml.stats.fft(signalData)
const r = chart.ml.stats.correlation(series1, series2)
```

#### Available Functions

| Function | Description |
|----------|-------------|
| `fft(data)` | Fast Fourier Transform (DFT implementation) |
| `mean(data)` | Arithmetic mean |
| `standardDeviation(data)` | Population standard deviation |
| `correlation(x, y)` | Pearson correlation coefficient |

## Use Cases

### Enzyme Kinetics (Michaelis-Menten)

Analyze enzyme-substrate binding with the Michaelis-Menten model:

$$V = \frac{V_{max} \cdot [S]}{K_m + [S]}$$

The demo generates synthetic data following this equation with added Gaussian noise.

### Clinical Trials (Dose-Response)

Visualize sigmoidal dose-response curves common in pharmacology:

$$E = \frac{E_{max}}{1 + (EC_{50}/C)^{Hill}}$$

### Electrochemical Sensors

Calibration curves for biosensors showing linear range and saturation behavior.

## Performance

All visualizations are rendered using **WebGL** for hardware-accelerated performance:

- **Box Plots**: Rendered as GL_TRIANGLES (boxes) + GL_LINES (whiskers)
- **Error Bars**: Rendered as GL_LINES with optional caps
- **Scatter/Line**: Standard WebGL point/line rendering

This approach enables smooth interaction with thousands of data points and real-time updates.

## API Reference

### BoxPlot Series Options

```typescript
interface BoxPlotData {
  x: Float32Array;      // X positions
  low: Float32Array;    // Minimum values
  open: Float32Array;   // Q1 values
  median: Float32Array; // Median values
  close: Float32Array;  // Q3 values
  high: Float32Array;   // Maximum values
}
```

### Error Bar Style Options

```typescript
interface ErrorBarStyle {
  visible?: boolean;
  color?: string;
  width?: number;
  capWidth?: number;
  opacity?: number;
  direction?: 'both' | 'positive' | 'negative';
  showCaps?: boolean;
}
```

## Related

- [Regression Analysis](/examples/regression-analysis) - Curve fitting and model selection
- [ML Integration Plugin](/api/plugin-ml-integration) - Full ML capabilities
- [Advanced Analysis](/examples/analysis-advanced) - FFT and signal processing
