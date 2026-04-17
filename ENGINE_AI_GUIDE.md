# Sci Plot: Implementation Guide for AI Agents

This document provides a comprehensive technical overview and implementation guide for the **Sci Plot**, a high-performance WebGL-based scientific charting library. This guide is designed to be read by AI agents to facilitate the integration of the library into any analytical or scientific application.

---

## 🚀 Core Architecture

Sci Plot uses a modular, plugin-based architecture centered around the `Chart` instance. It leverages **WebGL** for high-performance rendering (handling 10⁵–10⁶ points at 60 FPS) and a specialized **Plugin System** for advanced analysis and interaction.

### 1. Installation & Initialization

To create a chart, you need a container `HTMLDivElement` and a set of options.

```typescript
import { createChart } from 'sci-plot';

const chart = createChart({
  container: document.getElementById('chart-container'),
  xAxis: { label: 'Time (s)', auto: true },
  yAxis: { label: 'Potential (V)', auto: true },
  theme: 'midnight', // Options: 'dark', 'light', 'midnight', 'electrochemistry'
  showControls: true, // Adds the floating toolbar
  showLegend: true    // Adds the interactive legend
});
```

### 2. Data Management

The engine handles data using Typed Arrays (`Float32Array`) for maximum performance.

#### Adding a Series
```typescript
chart.addSeries({
  id: 'main-series',
  type: 'line', // 'line', 'scatter', 'step', 'band', 'area', 'bar', 'heatmap'
  data: {
    x: new Float32Array([0, 1, 2, 3]),
    y: new Float32Array([10, 20, 15, 25])
  },
  style: {
    color: '#00f2ff',
    width: 2,
    smoothing: 0.5 // Subtle curve smoothing
  }
});
```

#### Real-time Streaming
```typescript
// Append new points efficiently without recreating buffers
chart.appendData('main-series', [nextX], [nextY]);

// Enable auto-scroll to follow new data
chart.setAutoScroll(true);
```

---

## 🛠 Features & Plugins

The engine's power comes from its built-in plugins, which are often loaded automatically or via `chart.use()`.

### 1. Analysis Plugin (`sci-plot-analysis`)
Provides mathematical and statistical operations.

- **Available via `chart.analysis`**:
  - `detectPeaks()`, `detectCycles()`
  - `integrate()`, `derivative()`
  - `movingAverage()`, `fft()`
- **Curve Fitting**:
  ```typescript
  chart.addFitLine('data-series', 'linear'); // Adds a regression line
  ```

### 2. Measurement Tools (`sci-plot-tools`)
Interactive tools for precise data interrogation.

```typescript
// Activate specialized interaction modes
chart.setMode('delta'); // Click two points to measure distance/slope
chart.setMode('peak');  // Click-drag to integrate area under a peak
chart.setMode('select'); // Box select points
```

### 3. Tooltip System
Configurable via the initialization options or `chart.tooltip`.

```typescript
chart.tooltip.configure({
  showCrosshair: true,
  snapToData: true,
  theme: 'dark'
});
```

### 4. Direction Indicator Plugin
A specialized plugin for streaming data that shows a directional arrow based on recent trend.

```typescript
import { DirectionIndicatorPlugin } from 'sci-plot/plugins';

chart.use(DirectionIndicatorPlugin({
  seriesId: 'live-data',
  sampleSize: 30,  // Analyze last 30 points
  historySize: 20  // Smooth the arrow movement
}));
```

---

## 🎨 Theming & Customization

The engine supports rich visual aesthetics with curated palettes.

### Themes
- **`midnight`**: High-contrast neon on deep black (ideal for laboratory monitors).
- **`electrochemistry`**: Professional blue-toned theme.
- **`light`**: Clean, paper-like aesthetic for reports.

```typescript
chart.setTheme('electrochemistry');
```

### Custom Theme Override
```typescript
chart.setTheme({
  backgroundColor: '#1a1a1a',
  grid: { majorColor: 'rgba(255,255,255,0.1)' },
  xAxis: { labelColor: '#fff' }
});
```

---

## 📊 Interaction & Navigation

Standard interactions are handled automatically:
- **Scroll Wheel**: Zoom centered at cursor.
- **Left Click + Drag**: Pan.
- **Right Click + Drag**: Box Zoom.
- **Double Click**: Reset Zoom / Autoscale.

### Programmatic View Control
```typescript
chart.zoom({ x: [0, 10], y: [-1, 1], animate: true });
chart.autoScale(); // Fit all data to view
```

---

## 📤 Exporting Data

Scientific data can be exported in multiple formats.

```typescript
// Export data
const csvData = chart.exportCSV();
const jsonData = chart.exportJSON();

// Export visuals
const dataUrl = chart.exportImage('png');
```

---

## 🧠 AI Agent Implementation Checklist

When implementing Sci Plot in a new view, follow these steps:

1.  **Container**: Ensure the target DOM element has a defined height/width.
2.  **Instance**: Create the chart instance using `createChart`.
3.  **Data Structure**: Convert incoming data to `Float32Array` for the `addSeries` or `appendData` calls.
4.  **Plugins**: Determine if scientific tools (Delta, Peak) are needed and set the appropriate mode.
5.  **Lifecycle**: Call `chart.destroy()` when the component/view is unmounted to prevent WebGL context leaks.
6.  **Responsive**: The engine is responsive by default, but calling `chart.resize()` manually may be needed during complex UI layouts.

---

## 📝 API Reference Summary

- `createChart(options)`: Main entry point.
- `chart.addSeries(options)`: Support for line, scatter, step, area, band, bar, heatmap.
- `chart.updateSeries(id, data)`: Update or replace existing data.
- `chart.removeSeries(id)`: Cleanup specific series.
- `chart.setMode(mode)`: Switch between 'pan', 'boxZoom', 'select', 'delta', 'peak'.
- `chart.on(event, callback)`: Listen for 'zoom', 'pan', 'hover', 'click', 'render', 'measure'.

---
*Documentation generated for agent-to-agent communication. Current Engine Version: 1.5.1*
