---
title: PluginRadar
description: Spider / Radar charts for multi-dimensional data comparison
---

# PluginRadar

The `PluginRadar` allows you to create high-performance Radar (Spider) charts. These are ideal for comparing multiple quantitative variables on a two-dimensional chart of three or more quantitative variables represented on axes starting from the same point.

## Installation

```typescript
import { createChart } from 'velo-plot';
import { PluginRadar } from 'velo-plot/plugins';

const chart = createChart({ container });

// Enable Radar Plugin
await chart.use(PluginRadar({
  categories: ['Speed', 'Power', 'Reliability', 'Safety', 'Efficiency'],
  maxValue: 100,
  gridLevels: 5
}));
```

## Core Features

### 1. Multi-Series Support
Overlay multiple datasets to compare different entities (e.g., product comparison, performance metrics).

```typescript
chart.radar.addSeries({
  id: 'product-a',
  name: 'Product A',
  points: [
    { category: 'Speed', value: 80 },
    { category: 'Power', value: 70 },
    ...
  ],
  style: { 
    color: '#00f2ff', 
    fillColor: 'rgba(0, 242, 255, 0.2)' 
  }
});
```

### 2. Custom Grid
Configure the number of concentric grid levels (concentric polygons) and the spider spokes.

### 3. Automatic Labels
Labels are automatically positioned at the periphery of the spider web.

## API Reference

### `addSeries(data)`
Adds a new radar series.
- `data`: `RadarSeriesData` object.

### `updateSeries(id, points)`
Updates the points of an existing series (supports animations).

### `setCategories(categories)`
Reconfigures the circular axes.

### `setMaxValue(value)`
Sets the maximum value for the radial scales.

## Scientific Configuration

The plugin supports:
- **Normalization**: Automatically maps data values to radial positions.
- **Categorical Mapping**: Equal angular spacing for all categories.
- **Enhanced Overlay**: Renders with sub-pixel precision on the chart overlay.
