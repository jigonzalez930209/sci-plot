---
title: Pattern Recognition Plugin
description: Detect technical chart patterns like Head & Shoulders, Triangles, and Wedges in real-time.
---

# Pattern Recognition Plugin

The Pattern Recognition plugin provides a powerful engine for identifying geometric and technical patterns in time-series and financial data. It supports a wide range of built-in classic chart patterns and allows developers to define custom pattern validators.

## Features

- ✅ **Built-in Catalog**: Covers Head & Shoulders, Double Top/Bottom, Triangles, Wedges, Flags, and more.
- ✅ **Real-time Detection**: Monitor streaming data and get notified the moment a pattern is completed.
- ✅ **Custom Pattern Engine**: Define your own geometric constraints and sequences.
- ✅ **Automatic Visualization**: Built-in annotations and dashed lines to highlight detected patterns.
- ✅ **Confidence Scoring**: Each match includes a confidence level (0.0 to 1.0) based on mathematical strictlyness.
- ✅ **Volume & Trend Confirmation**: Optionally require volume confirmation for technical breakout patterns.

## Basic Usage

```typescript
import { createChart, PluginPatternRecognition } from 'velo-plot';

const chart = createChart({ container });

// Enable pattern recognition
await chart.use(PluginPatternRecognition({
  defaultParameters: {
    minConfidence: 0.8,
    patternTypes: ['head-shoulders', 'double-top', 'ascending-triangle']
  },
  enableRealtime: true,
  visualization: {
    showPatterns: true,
    showLabels: true,
    colorScheme: {
      'head-shoulders': '#ff6b6b',
      'ascending-triangle': '#45b7d1'
    }
  }
}));

// Listen for detections
chart.events.on('pattern:detected', ({ match, seriesId }) => {
  console.log(`Detected ${match.pattern.name} in ${seriesId} with ${Math.round(match.confidence * 100)}% confidence`);
});
```

## API Reference

### `chart.patterns`

The plugin exposes its methods through the `chart.patterns` namespace.

```typescript
// Manually run detection on a dataset
const result = await chart.patterns.detectPatterns('series-1', dataPoints);

// Register a new custom pattern
chart.patterns.registerCustomPattern({
  id: 'my-spike',
  name: 'Volatile Spike',
  pointSequence: [
    { constraints: { lowerThanPrevious: true } },
    { constraints: { higherThanPrevious: true } },
    { constraints: { lowerThanPrevious: true } }
  ]
});

// Enable/Disable real-time monitoring for a specific series
chart.patterns.enableRealtimeDetection('main-ticker');
```

## Supported Pattern Types

| Category | Typical Patterns |
| :--- | :--- |
| **Reversal** | `head-shoulders`, `double-top`, `double-bottom`, `triple-top` |
| **Continuation** | `flag`, `pennant`, `rectangle` |
| **Consolidation** | `ascending-triangle`, `descending-triangle`, `symmetrical-triangle` |
| **Exhaustion** | `rising-wedge`, `falling-wedge` |

## Configuration Options

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `minConfidence` | `number` | `0.7` | Minimum match accuracy to report a pattern. |
| `sensitivity` | `number` | `0.5` | How strictly to filter noise before detection. |
| `maxPatterns` | `number` | `10` | Maximum patterns to keep active per series. |
| `debounceTime` | `number` | `500` | Delay in ms before re-scanning after data updates. |
| `visualization.opacity` | `number` | `0.7` | Opacity of the pattern overlays. |

## Performance Tips

1. **Limit Series**: Only enable real-time detection on the primary series you are monitoring.
2. **Adjust Sensitivity**: For noisy data, increase the `sensitivity` parameter to ignore micro-fluctuations.
3. **Use Debouncing**: The default `debounceTime` ensures calculations don't happen on every single point in a high-speed stream.

## See Also
- [Technical Indicators](/api/indicators) - Combine patterns with SMA/RSI for better accuracy.
- [Anomaly Detection](/api/plugin-anomaly-detection) - Distinguish between normal patterns and outliers.
- [Real-time Streaming](/api/plugin-streaming) - Setup the data feed for the recognition engine.
