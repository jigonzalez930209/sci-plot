---
name: scichart-engine
description: High-performance scientific charting and data analysis using SciChart Engine (WebGL).
---

# SciChart Engine Skill

This skill allows agents to integrate and manage the **SciChart Engine**, a high-performance WebGL-based charting library for scientific and analytical applications.

## Quick Start

To initialize a chart in a DOM element:

```typescript
import { createChart } from 'scichart-engine';

const chart = createChart({
  container: document.getElementById('chart-id'),
  xAxis: { label: 'Time (s)', auto: true },
  yAxis: { label: 'Value', auto: true },
  theme: 'midnight'
});
```

## Core Concepts

- **WebGL Rendering**: Optimized for 10^5+ points.
- **Series**: Data is added as series (line, scatter, boxplot, etc.).
- **Plugins**: Extend functionality (analysis, tools, export, ML).
- **Themes**: Midnight, Electrochemistry, Light, Dark.

## Guidelines for Agents

1. **Memory Management**: Always call `chart.destroy()` when the component unmounts.
2. **Data Performance**: Use `Float32Array` for large datasets.
3. **Plugins**: Only load necessary plugins to keep bundles small. Use `chart.use(PluginName(config))`.
4. **Tooltips**: Use `scichart-tools` plugin for interactive tooltips and crosshairs.

## Synthesis of Possibilities

- **High-Performance 2D/3D Rendering**: WebGL/WebGPU core handling millions of points.
- **Rich Series Library**: Line, Scatter, Area, Band, Candlestick, BoxPlot, Waterfall, Ternary, Heatmap, Gauges, Sankey.
- **Real-time Processing**: Fast data appending, rolling windows, and streaming plugins.
- **Scientific Analysis**: Peaks, Cycles, FFT, Regression, Smoothing, Filters, Integration, Derivatives.
- **Interactive Interrogation**: Delta measurement, Peak integration, Lasso/Box selection, Crosshairs.
- **Advanced Export**: High-res Snapshots (4K/8K), Video recording, MATLAB/Excel/JSON export.
- **Native LaTeX**: Professional mathematical notation for labels and annotations.
- **UI Customization**: Glassmorphism menus, dynamic themes, responsive layouts.

## Comprehensive Guides
- [API Core Summary](./resources/api-summary.md)
- [Series Types & Data Structures](./resources/series-types.md)
- [Plugins & Extensibility Guide](./resources/plugins-guide.md)
- [Plugin Architecture & Lifecycle](./resources/plugin-architecture.md)
- [Advanced Features (Multi-Axis, Sync)](./resources/advanced-features.md)
- [3D Visualization Library](./resources/chart-3d.md)
- [Scientific Specializations (CV, Broken Axis)](./resources/scientific-specializations.md)
- [Analysis Intelligence (Patterns, Forecasting)](./resources/analysis-intelligence.md)
- [ROI Selection & Anomaly Detection](./resources/selection-anomalies.md)
- [Streaming & Performance Optimization](./resources/streaming-performance.md)
- [Accessibility & Localization Guide](./resources/accessibility-localization.md)
- [Theming & Customization Guide](./resources/theming-customization.md)

## Practical Examples
- [Basic Chart Setup](./examples/basic-chart.ts)
- [React Component Integration (Imperative)](./examples/react-integration.tsx)
- [Declarative React (SciChart Component)](./examples/declarative-react.tsx)
- [Advanced Analysis (FFT & Peaks)](./examples/advanced-analysis.ts)
- [Real-time Streaming](./examples/real-time-streaming.ts)

## Agent Implementation Checklist

When tasked with adding a chart to a project:
1.  **Container**: Ensure a `<div>` with fixed dimensions exists in the DOM.
2.  **Initialization**: Use `createChart`.
3.  **Plugins**: Identify if specialized tools (measurement, analysis) are required.
4.  **Data Processing**: Convert source data to `Float32Array` or `Float64Array`.
5.  **Visuals**: Set the theme and series styles according to UX requirements.
6.  **Cleanup**: Verify the `destroy()` call is wired to the component lifecycle.
