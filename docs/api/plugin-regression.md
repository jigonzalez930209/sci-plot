---
title: PluginRegression
description: Advanced scientific curve fitting and model selection
---

# PluginRegression

The `PluginRegression` provides advanced scientific regression capabilities beyond simple line fitting. It supports multiple regression models, automatic model selection based on statistical criteria (AIC, BIC), robust fitting, and real-time prediction.

## Installation

```typescript
import { createChart } from 'scichart-engine';
import { PluginRegression, PluginAnnotations } from 'scichart-engine/plugins';

const chart = createChart({ container });

// Enable advanced regression and annotations (for visualization)
await chart.use(PluginRegression({
  defaultMethod: 'polynomial',
  modelSelectionCriteria: 'aic' // 'aic' | 'bic' | 'r2' | 'adjusted-r2'
}));
await chart.use(PluginAnnotations());
```

## Core Features

### 1. Advanced Fitting
Perform multiple types of regression with specific configurations.

```typescript
const result = await chart.regression.fit('series-1', data, 'polynomial', { 
  degree: 3 
});

console.log(`R²: ${result.statistics.rSquared}`);
console.log(`Parameters: ${result.parameters.parameters}`);
```

### 2. Auto-Model Selection
Automatically find the best-fitting model from a list of candidates.

```typescript
const bestFit = await chart.regression.autoFit('series-1', data, [
  'linear', 'polynomial', 'exponential', 'gaussian'
]);

console.log(`Best model: ${bestFit.method}`);
```

### 3. Real-time Fitting
Enable automatic recalculation of the regression whenever the source data updates.

```typescript
chart.regression.enableRealtimeFitting('series-1', 'linear');
chart.regression.visualizeFit('series-1');
```

## Supported Methods

| Method | Equation | Parameters |
|--------|----------|------------|
| `'linear'` | $y = ax + b$ | `[slope, intercept]` |
| `'polynomial'` | $y = \sum a_i x^i$ | `[a0, a1, ..., an]` |
| `'exponential'` | $y = a \cdot e^{bx} + c$ | `[amplitude, rate, offset]` |
| `'gaussian'` | $y = a \cdot e^{-\frac{(x-\mu)^2}{2\sigma^2}} + d$ | `[amplitude, mean, std, offset]` |
| `'logarithmic'`| $y = a \cdot \ln(x) + b$ | `[a, b]` |
| `'power'` | $y = a \cdot x^b$ | `[a, b]` |

## API Reference

### `fit(seriesId, data, method, config)`
Performs the regression analysis.
- `seriesId`: Target series ID.
- `data`: Object with `x`, `y` and optional `weights` (Float32Array).
- `method`: One of the supported methods.
- `config`: Method-specific configuration (e.g., `{ degree: 3 }`).

### `autoFit(seriesId, data, candidates)`
Compares multiple models and selects the best one based on the plugin configuration (`modelSelectionCriteria`).

### `predict(seriesId, xValues, resultIndex)`
Generates predicted Y values for a given set of X values using a previously computed result.

### `visualizeFit(seriesId, resultIndex)`
Automatically adds a dashed line series and an equation label to the chart.

### `exportResults(seriesId, format)`
Exports the statistical results to `'json'`, `'csv'`, or `'matlab'` format.

## Mathematical Implementation

The plugin uses **Gaussian elimination with partial pivoting** for linear and polynomial models. For non-linear models like Gaussian, it uses a **gradient descent** approach with adaptive learning rates to find the optimal parameters.

$R^2$ and **Adjusted $R^2$** are provided for all models, allowing for fair comparison between models with different numbers of parameters.
