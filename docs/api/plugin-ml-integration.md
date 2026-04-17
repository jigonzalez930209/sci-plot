---
title: PluginMLIntegration
description: Bridge for integrating custom AI models into your charts
---

# PluginMLIntegration

The `PluginMLIntegration` provides a standardized interface for connecting machine learning models (e.g., Tensorflow.js, ONNX) to the Sci Plot. It handles data extraction, asynchronous inference, and high-performance visualization of predictions and confidence intervals.

## Core API

### `registerModel(model)`
Register a custom model implementation that satisfies the `MLModelAPI` interface.

```typescript
chart.ml.registerModel({
  id: 'my-nn-forecaster',
  name: 'Forecasting Model',
  type: 'forecasting',
  async predict(data) {
    // data.x and data.y are plain arrays extracted from series
    const prediction = await myLoadedModel.predict(tf.tensor(data.y));
    return {
      x: futureXArray,
      y: predictionArray,
      confidence: confidenceIntervalArray
    };
  }
});
```

### `runInference(modelId, seriesId)`
Runs analysis on a specific data series. It returns the `PredictionResult` directly.

### `visualizeResults(result, config)`
Renders the result on the chart overlay. This is extremely efficient as it avoids creating new heavy-weight series for transient predictions.

- `showConfidenceInterval`: Renders a translucent band around the prediction.
- `intervalOpacity`: Control the transparency of the confidence band.
- `lineStyle`: Customize the appearance of the prediction curve.

## Scientific Application

Specifically designed for:
- **Real-time Signal Denoising**: Using autoencoders to predict clean signals.
- **Anomaly Detection**: Visualizing probability scores across a time series.
- **Electrochemical Forecasting**: Predicting peak positions in future CV cycles.
- **Trend Extrapolation**: Using LSTMs to forecast multi-variable trends.
