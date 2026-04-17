# PluginForecasting API Reference

The `PluginForecasting` adds advanced time-series prediction capabilities to the Sci Plot. It implements several statistical forecasting models natively in TypeScript.

## Initialization

```typescript
import { createChart, PluginForecasting } from 'velo-plot';

const chart = createChart({ ... });
await chart.use(PluginForecasting({
  defaultOptions: {
    method: 'holtWinters',
    horizon: 50
  }
}));
```

## API Reference

Once registered, the plugin exposes its API through `chart.forecasting`.

### `forecast(data, options)`
Generates a forecast for the provided raw data.

**Parameters:**
- `data`: `SeriesData | number[] | Float32Array` - The historical data.
- `options`: `ForecastingOptions` - Configuration for the forecast.

**Returns:** `ForecastingResult`

### `forecastSeries(seriesId, options)`
Generates a forecast for a specific series already present in the chart.

**Parameters:**
- `seriesId`: `string` - ID of the series to analyze.
- `options`: `ForecastingOptions` - Configuration for the forecast.

**Returns:** `Promise<ForecastingResult>`

### `visualize(result, config?)`
Renders the forecast on the chart overlay.

**Parameters:**
- `result`: `ForecastingResult` - The result from a forecast call.
- `config`: `ForecastingVisualizationConfig` - (Optional) Styling configuration.

**Returns:** `string` (The visualization ID).

### `clear(id?)`
Removes active forecast visualizations.

**Parameters:**
- `id`: `string` - (Optional) ID of a specific visualization to remove. If omitted, all forecasts are cleared.

---

## Interfaces

### `ForecastingOptions`

| Property | Type | Description |
|----------|------|-------------|
| `method` | `string` | Method to use (see below) |
| `horizon` | `number` | Number of points to project |
| `confidence` | `number` | (Optional) Confidence level (0-1) |
| `params` | `ForecastingParams` | Method-specific parameters |

### `ForecastingMethod`
- `'sma'`: Simple Moving Average (projects a flat line).
- `'linear'`: Linear Trend Projection (Least Squares Fit).
- `'holt'`: Double Exponential Smoothing (Trend-aware).
- `'holtWinters'`: Triple Exponential Smoothing (Trend + Seasonality).

### `ForecastingParams`

| Property | Type | Description |
|----------|------|-------------|
| `alpha` | `number` | Smoothing factor for level |
| `beta` | `number` | Smoothing factor for trend |
| `gamma` | `number` | Smoothing factor for seasonality |
| `period` | `number` | Seasonal cycle length |
| `windowSize` | `number` | Window size for SMA |

### `ForecastingResult`

| Property | Type | Description |
|----------|------|-------------|
| `xValues` | `number[]` | Projected X coordinates |
| `yValues` | `number[]` | Projected Y values |
| `lowerBound` | `number[]` | (Optional) Lower confidence limit |
| `upperBound` | `number[]` | (Optional) Upper confidence limit |
| `metadata` | `object` | Fit statistics (MSE, MAE, R²) |
