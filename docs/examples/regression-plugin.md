---
title: Advanced Regression Plugin
description: Machine learning-ready curve fitting and model selection
---

# Advanced Regression Plugin

The `PluginRegression` is a high-level scientific module that provides model comparison, automatic selection (AIC/BIC), and robust fitting algorithms.

## Interactive Comparison

Use the selector below to switch between different physical models. The **Auto-Select** mode will run all possible regressions and choose the statistically superior model using the **Akaike Information Criterion (AIC)**.

<RegressionDemo height="500px" />

## Advanced API Usage

Unlike the basic `addFitLine`, the `PluginRegression` exposes a full API for scientific analysis.

```typescript
import { PluginRegression } from 'velo-plot/plugins';

// 1. Comparison of multiple models
const candidates = ['linear', 'polynomial', 'exponential', 'gaussian'];
const bestFit = await chart.regression.autoFit('raw-data', data, candidates);

console.log(`The winning model is: ${bestFit.method}`);
console.log(`R-Squared: ${bestFit.statistics.rSquared}`);

// 2. Exporting results for external tools
const matlabCode = chart.regression.exportResults('raw-data', 'matlab');
const csvData = chart.regression.exportResults('raw-data', 'csv');
```

## Statistical Indicators

The plugin computes several indicators for each fit:

- **$R^2$ (Coefficient of Determination)**: Proportion of variance explained by the model.
- **Adjusted $R^2$**: Penalizes models with too many parameters to prevent overfitting.
- **RMSE (Root Mean Square Error)**: Standard deviation of residuals.
- **AIC / BIC**: Information criteria used for model selection.
- **Parameters & Uncertainties**: Full parameter vector with estimated standard errors.

## Mathematical Implementation

All algorithms are implemented in **pure TypeScript** using zero-copy data access.
- **Linear/Polynomial**: Solved via Gaussian elimination with partial pivoting.
- **Gaussian/Non-linear**: Solved via Gradient Descent with adaptive learning.
- **Automatic Selection**: Uses the maximum likelihood estimation framework to compare models with different complexity.
