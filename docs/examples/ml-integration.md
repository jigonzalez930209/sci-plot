---
title: AI & Machine Learning Integration
description: Bringing neural networks to your data visualizations
---

# AI Integration Demo

The SciChart Engine provides a powerful bridge for integrating your own AI models. This allows for real-time predictions, forecasting, and advanced signal analysis directly in the browser.

## Interactive Forecasting

Below is a demonstration of an **AI-powered Forecasting Tool**. It uses the `PluginMLIntegration` to run a mock LSTM inference on historical data and visualizes both the projected trend and the uncertainty (confidence interval).

<MLIntegrationDemo height="450px" />

## How it Works

1.  **Data Extraction**: The plugin extracts raw X/Y data from any registered chart series.
2.  **External Inference**: The data is passed to your registered model (which could use `@tensorflow/tfjs`, `onnxruntime-web`, or a remote API).
3.  **Synchronous Visualization**: The resulting prediction is returned to the plugin, which renders it using the high-performance overlay system.

## Example: Predictive Maintenance

Imagine monitoring laboratory equipment. You can run an anomaly detection model every few seconds:

```typescript
const result = await chart.ml.runInference('anomaly-model', 'sensor-series');

if (result.metadata.anomalyScore > 0.8) {
  chart.ml.visualizeResults(result, {
    lineStyle: { color: '#ef4444' } // High alert red
  });
}
```

## Features

- **Confidence Intervals**: Built-in support for visualizing prediction uncertainty.
- **Low Overload**: Predictions are rendered on an overlay layer, keeping the main WebGL engine focused on high-speed data updates.
- **Model Agnostic**: Works with any JavaScript-based ML library.
