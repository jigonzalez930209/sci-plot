---
title: Broken Axis Plugin
description: Support for gaps and breaks in axes with visual indicators.
---

# Broken Axis Plugin

The Broken Axis plugin allows you to define gaps or "breaks" in your data range, allowing you to skip large areas of empty space and focus on the important details of your dataset.

## Features

- ✅ **Define Multiple Breaks**: Skip any number of data ranges.
- ✅ **Customizable Symbols**: Choose between diagonal lines, zigzag, wave, or simple lines.
- ✅ **Visual Ratio Control**: Control how much visual space the break occupies on the plot.
- ✅ **Interactive Compatibility**: Works with zoom and pan.
- ✅ **Automatic Coordinate Mapping**: Points automatically jump over breaks.

## Basic Usage

```typescript
import { createChart, PluginBrokenAxis } from 'scichart-engine';

const chart = createChart({
  container: document.getElementById('chart')!
});

// Configure broken axis
await chart.use(PluginBrokenAxis({
  axes: {
    default: { // 'default' refers to the main X axis
      breaks: [
        { start: 100, end: 500, symbol: 'diagonal', visualRatio: 0.02 },
        { start: 800, end: 1200, symbol: 'zigzag' }
      ]
    }
  }
}));
```

## API Reference

### `chart.brokenAxis`

```typescript
// Add a new break at runtime
chart.brokenAxis.addBreak('default', {
  start: 2000,
  end: 3500,
  symbol: 'wave'
});

// Clear all breaks
chart.brokenAxis.clearBreaks('default');

// Enable/Disable
chart.brokenAxis.setEnabled(false);

// Get current breaks
const currentBreaks = chart.brokenAxis.getBreaks('default');
```

## Configuration

### `AxisBreak` Options

| Property | Type | Description |
|----------|------|-------------|
| `start` | `number` | The start value of the break in data units. |
| `end` | `number` | The end value of the break in data units. |
| `visualRatio` | `number` | The fraction of the axis length the break occupies (0.0 - 1.0). Default: `0.02`. |
| `symbol` | `AxisBreakSymbol` | The symbol to draw: `'diagonal'`, `'zigzag'`, `'wave'`, `'simple'`. |

### `BrokenAxisOptions`

| Property | Type | Description |
|----------|------|-------------|
| `breaks` | `AxisBreak[]` | Array of break definitions. |
| `defaultSymbol` | `AxisBreakSymbol` | Symbol to use if not specified in break. |
| `symbolColor` | `string` | Color for the break indicators. |
| `symbolSize` | `number` | Visual size of the indicators. |

## Use Cases

### 1. Large Time Gaps
Skip night-time or weekends in financial charts while maintaining a continuous visual flow of trading hours.

### 2. Multi-Range Scientific Data
Visualize two distinct experimental result ranges (e.g., 0-10V and 100-110V) in the same plot area without wasting space on the empty middle range.

### 3. Outlier Visualization
Show a baseline and an extreme outlier far away without compressing the baseline data to invisibility.

## Technical Details

The plugin intercepts the chart's coordinate conversion manager. When a value is requested:
1. It checks which "visible segment" the data value belongs to.
2. It calculates the offset based on preceding breaks.
3. It maps the value within its segment to the available visual space.

**Note:** Interaction handles (like box zoom) are currently mapped to the transformed space, ensuring they work intuitively with the breaks.

## See Also

- [Multiple Axes](/api/multi-axis)
- [Coordinate Systems](/guide/coordinates)
- [Performance Optimization](/guide/performance)
