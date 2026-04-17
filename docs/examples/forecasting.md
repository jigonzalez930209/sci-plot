# Time Series Forecasting

The `PluginForecasting` provides a suite of algorithms to predict future values based on historical time series data. It supports various statistical models from simple moving averages to complex seasonal models.

## Features

- **Multiple Algorithms**: SMA, EMA, Linear Trend, Holt (Double), and Holt-Winters (Triple).
- **Seasonal Support**: Automated detection and modeling of periodic cycles.
- **Visual Overlays**: Automated rendering of forecast lines and confidence intervals.
- **Series Integration**: Direct integration with the chart's data engine.
- **API Access**: Programmatic access to prediction results for further processing.

## Interactive Demo

<ForecastingDemo height="500px" />

## Usage

To use forecasting, register the plugin and then call the forecasting API.

```typescript
import { createChart, PluginForecasting } from 'sci-plot';

const chart = createChart({ container: 'chart-id' });

// Register plugin
await chart.use(PluginForecasting({
  defaultVisualization: {
    lineStyle: { color: '#fbbf24', dash: [5, 5] },
    showConfidenceInterval: true
  }
}));

// Run forecast on a series
const result = await chart.forecasting.forecastSeries('my-series-id', {
  method: 'holtWinters',
  horizon: 50,
  params: { period: 12 } // Monthly seasonality
});

// Visualize it
chart.forecasting.visualize(result);
```

## Forecasting Methods

### 1. Simple Moving Average (SMA)
Calculates the average of the last `N` points and projects it forward as a constant. Best for stable data without clear trends.

### 2. Linear Projection
Fits a first-order polynomial ($y = mx + b$) to the historical data using least squares and extends the line into the future. Ideal for data with a consistent linear trend.

### 3. Holt's Linear Trend (Double Exp Smoothing)
Separates the level and the trend components. It adapts to changes in the trend over time, making it superior to simple linear regression for changing trends.

### 4. Holt-Winters (Triple Exp Smoothing)
The most advanced built-in model, adding a **Seasonal** component. It requires at least two full cycles of data to accurately model periodic behaviors (e.g., daily power consumption, yearly sales).

## Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `method` | `string` | Method ID (`sma`, `linear`, `holt`, `holtWinters`) |
| `horizon` | `number` | Number of data points to project |
| `params.alpha` | `number` | Level smoothing factor (0 to 1) |
| `params.beta` | `number` | Trend smoothing factor (0 to 1) |
| `params.gamma` | `number` | Seasonality smoothing factor (0 to 1) |
| `params.period` | `number` | Cycle length (e.g., 24 for hourly, 12 for monthly) |

## Confidence Intervals

The plugin can visualize uncertainty. For statistical models (Holt/Holt-Winters), the confidence interval typically widens as the forecast moves further into the future, reflecting increasing uncertainty.
