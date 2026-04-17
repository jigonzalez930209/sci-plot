---
title: Radar (Spider) Charts
description: Comparing multi-dimensional data visually
---

# Radar Charts Demo

Radar charts (also known as spider charts or web charts) are a graphical method of displaying multivariate data in the form of a two-dimensional chart of three or more quantitative variables represented on axes starting from the same point.

## Interactive Demo

The following demo compares two different products across six key performance metrics.

<RadarDemo height="550px" />

## When to use Radar Charts

- **Performance Analysis**: Comparing players, employees, or products across multiple skills/metrics.
- **Survey Results**: Visualizing responses to multiple related questions.
- **Decision Making**: Comparing candidate options against multiple requirements.

## Example Code

```typescript
import { createChart } from 'velo-plot';
import { PluginRadar } from 'velo-plot/plugins';

const chart = createChart({ container });

const radar = PluginRadar({
  categories: ['Marketing', 'Sales', 'Product', 'Support', 'Legal'],
  maxValue: 10
});

await chart.use(radar);

radar.api.addSeries({
  id: 'current-quarter',
  points: [
    { category: 'Marketing', value: 8 },
    { category: 'Sales', value: 9 },
    { category: 'Product', value: 7 },
    { category: 'Support', value: 5 },
    { category: 'Legal', value: 6 }
  ],
  style: { color: '#00f2ff' }
});
```

## Features in Sci Plot

- **Smooth Animations**: Update series data and the chart will smoothly transition.
- **Customizable Grid**: Change colors, line styles, and the number of grid levels.
- **Hardware Accelerated**: Rendering is optimized for high refresh rates.
- **Thematic Consistency**: Automatically adapts to dark and light themes.
