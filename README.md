# Sci Plot 🚀

A high-performance, WebGL-powered scientific charting engine built for precision, speed, and deep interactivity. Optimized for electrochemical and scientific data visualization.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NPM Version](https://img.shields.io/npm/v/sci-plot.svg)](https://www.npmjs.com/package/sci-plot)


## ✨ Features

-   **🚀 High Performance**: Render millions of data points at 60 FPS using a specialized raw WebGL renderer.
-   **📈 Advanced Analysis**: Built-in peak detection, integration, baseline correction, and customizable curve fitting (linear/poly/exp).
-   **📊 Specialized Series**: Support for Lines, Scatter (SDF symbols), Step charts, Band series, Area charts, **Candlesticks** (OHLC), and **Stacked Charts**.
-   **↕️ Multi-Axis Engine**: Independent scales and units with axis-specific scrolling and zooming.
-   **📏 Professional Tooling**: Real-time Statistics panel, Annotations (Lines/Shapes/Text), and **high-fidelity SVG/PNG export**.
-   **🎨 Color Schemes**: **5 professional palettes** with 20 colors each for multi-series charts, auto-assigned when colors aren't specified.
-   **✨ Interactive Legend**: Hover over series in legend to **bring to front** and highlight with distinct color.
-   **🔌 Extensible**: **Plugin System** with lifecycle hooks for custom drawing and data analysis.
-   **⚛️ Framework First**: Native React support via hooks and high-level components.
-   **🎨 Dynamic Theming**: Sleek built-in themes (Light/Midnight) with support for custom CSS-based skins.
-   **🏗️ Modular Core**: Built on a modern, decoupled architecture for maximum extendability.

## 🛠️ Installation

```bash
npm install sci-plot
# or
pnpm add sci-plot
```

## 🚀 Quick Examples

### React (Recommended)

```tsx
import { SciPlot } from 'sci-plot/react';

function App() {
  const data = {
    x: new Float32Array([0, 1, 2, 3]),
    y: new Float32Array([10, 20, 15, 25])
  };

  return (
    <div style={{ width: '800px', height: '400px' }}>
      <SciPlot 
        series={[{ id: 's1', ...data, color: '#00f2ff' }]}
        xAxis={{ label: 'Time (s)' }}
        yAxis={{ label: 'Voltage (V)' }}
        showControls
      />
    </div>
  );
}
```

### Vanilla JavaScript

```typescript
import { createChart } from 'sci-plot';

const chart = createChart({
  container: document.getElementById('chart-container'),
  theme: 'dark',
  colorScheme: 'vibrant', // Auto-assigns colors from vibrant palette
  showLegend: true
});

// Series without explicit colors get auto-assigned from the scheme
chart.addSeries({
  id: 'signal1',
  type: 'line',
  data: { x: [...], y: [...] }
});

chart.addSeries({
  id: 'signal2',
  type: 'line',
  data: { x: [...], y: [...] }
});

// Change color scheme at runtime
chart.setColorScheme('ocean');
```

### Multi-Series with Color Schemes

```typescript
// Create chart with 20+ series - colors auto-cycle
const chart = createChart({
  container: document.getElementById('chart'),
  colorScheme: 'neon', // 'vibrant', 'pastel', 'neon', 'earth', 'ocean'
  showLegend: true
});

// Add multiple series - colors assigned automatically
for (let i = 0; i < 20; i++) {
  chart.addSeries({
    id: `series${i}`,
    name: `Dataset ${i + 1}`,
    type: 'line',
    data: generateData(i)
  });
}

// Hover over series in legend → brings to front + highlights! ✨
```

## 📖 Documentation

Visit [Sci Plot Docs](https://jigonzalez930209.github.io/sci-plot/) for:
-   [Getting Started Guide](https://jigonzalez930209.github.io/sci-plot/guide/)
-   [Core Concepts](https://jigonzalez930209.github.io/sci-plot/guide/concepts)
-   [API Reference](https://jigonzalez930209.github.io/sci-plot/api/chart)
-   [Interactive Examples](https://jigonzalez930209.github.io/sci-plot/examples/)

## 📄 License

MIT © [jigonzalez930209](https://github.com/jigonzalez930209)
