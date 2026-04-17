---
title: Peak Analysis Demo
description: Baseline correction and peak integration tools
---

# Peak Analysis Demo

Scientific data often requires pre-processing before meaningful parameters can be extracted. This demo showcases the **Baseline Subtraction** and **Numerical Integration** tools provided by the `sci-plot-analysis` plugin.

## Interactive Example

The chart below shows a Gaussian peak on top of a linear drifting baseline (common in sensors and electrochemistry).
- **Baseline Correction**: Removes the linear drift.
- **Integration**: Calculates the area under the peak (e.g., total charge $Q$ in voltammetry).

<ChartDemo type="analysis" height="500px" />

## Implementation Details

The analysis features are available via the `PluginAnalysis` API, which is auto-loaded in most scientific chart configurations.

### 1. Baseline Subtraction

Experimental backgrounds can be modeled as a linear trend between two points.

```typescript
// Access analysis via the chart instance
const analysis = chart.getPluginAPI('sci-plot-analysis');

// Correct raw data using points at x=10 and x=90 as background anchors
const correctedY = analysis.subtractBaseline(rawX, rawY, 10, 90);

chart.addSeries({
  id: 'corrected-signal',
  data: { x: rawX, y: correctedY },
  style: { color: '#00f2ff' }
});
```

### 2. Peak Integration

Calculates the area under a curve within a specific range using the **Trapezoidal Rule**.

```typescript
const analysis = chart.getPluginAPI('sci-plot-analysis');

// Calculate area between specific X bounds
const area = analysis.integrate(xData, yData, { xMin: 0.2, xMax: 0.8 });

console.log(`Integrated Area: ${area.toFixed(6)} units²`);
```

## Advanced Tools

For more complex analysis, you can use the **Peak Tool** from the `sci-plot-tools` plugin:

```typescript
// Enable interactive peak analysis tool
chart.setMode('peak');

// Listen for measurement events
chart.on('measure', (m) => {
  if (m.type === 'peak') {
    console.log('Peak Area:', m.area);
    console.log('FWHM:', m.fwhm);
  }
});
```

## Key Features

- **Interpolated Range**: The integration tool automatically interpolates Y values if the specified bounds don't fall exactly on data points.
- **High Performance**: Optimized for large `Float32Array` or `Float64Array` buffers using hardware acceleration where possible.
- **Flexible Models**: Supports linear, polynomial, and moving-average based baselines.
