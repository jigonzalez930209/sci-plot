# PluginDataTransform

The `PluginDataTransform` provides a powerful real-time data processing pipeline. It allows you to chain multiple mathematical and statistical operations non-destructively on any data series.

::: tip Live Demo
See this plugin in action in our [Process Monitoring Dashboard](/examples/gauge-sankey).
:::

## Installation

```typescript
import { SciPlot } from 'sci-plot';
import { PluginDataTransform } from 'sci-plot/plugins';

const chart = new SciPlot({
  // ...
});

// Register the plugin
chart.use(PluginDataTransform());
```

## Plugin API

Once registered, the plugin exposes its functionality through `chart.processing`:

### `transform(seriesId: string, pipeline: TransformOp[])`
Applies a sequence of transformations to the specified series.

### `resetTransform(seriesId: string)`
Restores the original series data, removing all applied transformations.

### `getOriginalData(seriesId: string)`
Returns the original x/y data before any transformations.

---

## Transformation Operations (`TransformOp`)

The pipeline accepts an array of operations. Each operation has a `type` and specific parameters:

### `normalize`
Normalizes Y values to a specific range (default [0, 1]).

```typescript
{ 
  type: 'normalize', 
  parameters: { range: [0, 100] } 
}
```

### `moving-average`
Smooths data using a simple moving average.

```typescript
{ 
  type: 'moving-average', 
  parameters: { window: 10 } 
}
```

### `derivative`
Calculates numerical derivative (dy/dx). Can be applied multiple times for 2nd or 3rd derivatives.

```typescript
{ 
  type: 'derivative', 
  parameters: { order: 1 } 
}
```

### `integral`
Calculates cumulative integral of the data.

```typescript
{ type: 'integral' }
```

### `baseline-removal`
Removes a linear baseline defined by two X points.

```typescript
{ 
  type: 'baseline-removal', 
  parameters: { x1: 0.1, x2: 0.9 } 
}
```

### `resample`
Resamples data to a fixed number of points using linear interpolation.

```typescript
{ 
  type: 'resample', 
  parameters: { points: 500 } 
}
```

### `scale-offset`
Applies manual scale and offset.

```typescript
{ 
  type: 'scale-offset', 
  parameters: { scale: 2, offset: 10 } 
}
```

---

## Complete Usage Example

```typescript
// Apply a complex pipeline: Normalize -> Smooth -> Derivate
await chart.processing.transform('sensor-1', [
  { type: 'normalize', range: [0, 1] },
  { type: 'moving-average', window: 5 },
  { type: 'derivative', order: 1 }
]);

// Reset
chart.processing.resetTransform('sensor-1');
```
