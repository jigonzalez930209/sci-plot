---
title: Multi-Axis Charts
description: Create charts with multiple Y axes for visualizing different scales, such as current vs voltage or temperature vs pressure on a single chart.
---

# Multi-Axis Charts

SciChart Engine supports multiple Y axes, allowing you to visualize data with different scales on the same chart. This is essential for scientific applications where you need to correlate variables like current (µA) and potential (V), or temperature and pressure.

## Creating Multi-Axis Charts

### At Chart Creation

Define multiple Y axes when creating the chart:

```typescript
import { createChart } from 'scichart-engine';

const chart = createChart({
  container: document.getElementById('chart'),
  xAxis: { label: 'Time (s)', auto: true },
  yAxis: [
    { 
      id: 'current', 
      position: 'left', 
      label: 'Current (µA)',
      color: '#00f2ff',
      auto: true 
    },
    { 
      id: 'voltage', 
      position: 'right', 
      label: 'Potential (V)',
      color: '#ff6b6b',
      auto: true 
    },
  ],
});

// Add series linked to specific axes
chart.addSeries({
  id: 'current-data',
  type: 'line',
  yAxisId: 'current', // Links to 'current' axis
  data: { x: timeData, y: currentData },
  style: { color: '#00f2ff' },
});

chart.addSeries({
  id: 'voltage-data',
  type: 'line',
  yAxisId: 'voltage', // Links to 'voltage' axis
  data: { x: timeData, y: voltageData },
  style: { color: '#ff6b6b' },
});
```

### Adding Axes Dynamically

Add new axes at runtime:

```typescript
// Add a third axis for temperature
chart.addYAxis({
  id: 'temperature',
  position: 'right',
  label: 'Temperature (°C)',
  color: '#4ecdc4',
  offset: 60, // Offset for stacking
});

// Link a series to the new axis
chart.addSeries({
  id: 'temp-data',
  type: 'line',
  yAxisId: 'temperature',
  data: { x: timeData, y: tempData },
  style: { color: '#4ecdc4' },
});
```

## Axis Configuration Options

### Basic Options

| Option | Type | Description |
|--------|------|-------------|
| `id` | `string` | Unique identifier for the axis |
| `position` | `'left' \| 'right'` | Position on the chart |
| `label` | `string` | Axis label text |
| `scale` | `'linear' \| 'log'` | Scale type (default: `'linear'`) |
| `auto` | `boolean` | Enable auto-scaling (default: `true`) |
| `min` | `number` | Fixed minimum value |
| `max` | `number` | Fixed maximum value |

### Styling Options

| Option | Type | Description |
|--------|------|-------------|
| `color` | `string` | Axis color (line, ticks, labels) |
| `lineWidth` | `number` | Axis line width in pixels |
| `showLine` | `boolean` | Show/hide axis line |
| `showTicks` | `boolean` | Show/hide tick marks |
| `showLabels` | `boolean` | Show/hide labels |
| `showGrid` | `boolean` | Show grid lines for this axis |
| `gridColor` | `string` | Grid line color |
| `gridOpacity` | `number` | Grid line opacity |
| `offset` | `number` | Offset from edge in pixels |
| `visible` | `boolean` | Axis visibility |
| `labelFontSize` | `number` | Label font size |

## Managing Axes

### Update Axis Configuration

```typescript
chart.updateYAxis('temperature', {
  label: 'Temp (K)', // Change label
  color: '#ff9f43', // Change color
  showGrid: true,   // Enable grid
});
```

### Remove an Axis

```typescript
const removed = chart.removeYAxis('temperature');
// Note: Primary axis cannot be removed
// Series using removed axis are moved to primary axis
```

### Get Axis Information

```typescript
// Get specific axis
const tempAxis = chart.getYAxis('temperature');
console.log(tempAxis?.label);

// Get all axes
const allAxes = chart.getAllYAxes();
console.log(`Chart has ${allAxes.length} Y axes`);

// Get primary axis ID
const primaryId = chart.getPrimaryYAxisId();
```

## Multi-Axis Auto-Scaling

Each axis auto-scales independently based on the series linked to it:

```typescript
// Auto-scale all axes
chart.autoScale();

// Series on 'current' axis will scale to fit current data
// Series on 'voltage' axis will scale to fit voltage data
```

## Example: Electrochemistry Dashboard

```typescript
const chart = createChart({
  container: document.getElementById('echem-chart'),
  theme: 'electrochemistry',
  xAxis: { label: 'E / V', unit: 'V' },
  yAxis: [
    { 
      id: 'current', 
      label: 'I / µA', 
      unit: 'A', 
      prefix: 'µ',
      color: '#00f2ff',
    },
    { 
      id: 'charge', 
      position: 'right', 
      label: 'Q / mC',
      unit: 'C',
      prefix: 'm',
      color: '#ff6b6b',
    },
  ],
});

// Cyclic voltammetry data
chart.addSeries({
  id: 'cv',
  type: 'line',
  yAxisId: 'current',
  data: { x: potentialData, y: currentData },
});

// Integrated charge
chart.addSeries({
  id: 'charge-series',
  type: 'area',
  yAxisId: 'charge',
  data: { x: potentialData, y: chargeData },
  style: { color: 'rgba(255, 107, 107, 0.3)' },
});
```

## Best Practices

1. **Use distinct colors** for each axis and its associated series
2. **Position axes strategically**: Primary data on left, secondary on right
3. **Use offsets** when stacking multiple right-hand axes
4. **Label axes clearly** with units to avoid confusion
5. **Consider grid lines** only for primary axis to reduce clutter
6. **Link series explicitly** using `yAxisId` to avoid confusion
