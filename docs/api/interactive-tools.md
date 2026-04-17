---
title: Interactive Tools
description: Advanced measurement and analysis tools like Delta (cursor measurement) and Peak Analysis.
---

# Interactive Tools

Sci Plot provides professional interactive tools for manual measurement and detailed peak analysis. These tools are part of the `PluginTools` module.

## Requirement

To use the interactive tools, you must load the `PluginTools`.

```typescript
import { createChart } from 'sci-plot';
import { PluginTools } from 'sci-plot/plugins';

const chart = createChart({ container });

// Enable interactive tools
await chart.use(PluginTools());
```

## Delta Tool (Measurement)

The Delta Tool allows you to measure distances ($\Delta X$, $\Delta Y$) and slopes between two points on the chart.

### Activation

```typescript
// Enable delta measurement mode
chart.setMode('delta');

// The tool can also be accessed directly
const deltaTool = chart.getDeltaTool();
deltaTool.enable();
```

### Usage
- **Click and drag** on the chart to create a measurement region.
- The tool will display $\Delta X$, $\Delta Y$, and the slope ($m = \Delta Y / \Delta X$) between the start and end points.
- Measurements are persistent and follow the chart as you zoom or pan.

### Configuration
```typescript
chart.getDeltaTool().configure({
  lineColor: '#00f2ff',
  fontSize: 12,
  showSlope: true,
  precision: 4
});
```

---

## Peak Tool (Interactive Analysis)

The Peak Tool provides specialized analysis for individual peaks, including area integration and baseline subtraction.

### Activation

```typescript
// Enable peak analysis mode
chart.setMode('peak');

// Access the tool API
const peakTool = chart.getPeakTool();
```

### Usage
- **Drag a region** over a peak.
- The tool automatically identifies the peak within the region.
- It calculates a **linear baseline** based on the start and end points.
- It calculates the **integrated area** (with background subtraction) and the **peak height**.

### Configuration
```typescript
chart.getPeakTool().configure({
  baselineColor: '#ffea00',
  fillColor: 'rgba(255, 234, 0, 0.2)',
  showArea: true,
  showHeight: true
});
```

## Summary of Modes

| Mode | Key Binding | Description |
|------|-------------|-------------|
| `'pan'` | `P` | Default navigation (Drag to pan, Scroll to zoom) |
| `'select'` | `S` | Box selection of data points |
| `'zoom'` | `Z` | Box zoom (Right-drag by default in pan mode) |
| `'delta'` | `D` | Interactive measurement cursors |
| `'peak'` | `A` | Peak area and baseline analysis |

You can switch modes programmatically:
```typescript
chart.setMode('pan');
chart.setMode('delta');
```
