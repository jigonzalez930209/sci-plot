# SciChart Engine - Plugin System

The SciChart Engine built-in plugin system provides a modular architecture for extending chart functionality. Professional tools like **Delta Measurement**, **Peak Analysis**, and **Advanced Tooltips** are implemented as plugins to keep the core engine lightweight and performant.

![SciChart Tools Demo](/img/scichart-tools-demo.png)

## Professional Tools Plugin (`scichart-tools`)

The `scichart-tools` plugin provides specialized interactive tools for scientific and engineering data analysis.

### Features
- **Delta Tool**: Measures ΔX, ΔY, distance, and slope between two points.
- **Peak Tool**: Identifies peaks, calculates baseline, height, and area under the curve.
- **Advanced Tooltips**: Context-aware tooltips that snap to the nearest data point with high performance.

### Implementation

By default, `ChartCore` auto-loads this plugin. You can switch between modes using `chart.setMode()`:

```typescript
// Enable Delta Tool
chart.setMode('delta');

// Enable Peak Tool
chart.setMode('peak');

// Reset to default interaction (pan/zoom)
chart.setMode('none');

// Listen to measurement results
chart.on('measure', (data) => {
  if (data.type === 'delta') {
    console.log(`Measured Slope: ${data.slope}`);
  } else if (data.type === 'peak') {
    console.log(`Peak Area: ${data.area}`);
  }
});
```

---

## Scientific Analysis Plugin (`scichart-analysis`)

The `scichart-analysis` plugin exposes advanced mathematical functions optimized for Large Datasets.

### Available Methods
- **Curve Fitting**: `chart.addFitLine(seriesId, options)`
- **Signal Processing**: FFT, IFFT, Savitzky-Golay smoothing.
- **Calculus**: Numerical integration and derivatives.
- **Statistics**: Moving averages (SMA, EMA), Bollinger Bands, RSI.

### Usage Example

```typescript
// Access the analysis API
const analysis = chart.getPluginAPI('scichart-analysis');

// Apply smoothing to an existing dataset
const smoothedY = analysis.savitzkyGolay(rawYData, 15, 3);

// Add a regression line to a series
chart.addFitLine('sensor-data', { 
  order: 2, 
  color: '#00ff00' 
});
```

---

## Technical Architecture

Plugins are initialized with a `PluginContext` which provides a bridge to chart internals without exposing the full chart instance directly, ensuring stability and encapsulation.

### Plugin Lifecycle

1. **`onInit(ctx)`**: Called when the chart starts. Here you setup your UI and event listeners.
2. **`onRenderOverlay(ctx)`**: Every frame, this is called to draw on the 2D overlay canvas. This is where tooltips and measurement labels are rendered.
3. **`onInteraction(ctx, event)`**: Handles mouse/touch events.
4. **`onDestroy(ctx)`**: Clean up resources, remove canvases, and clear timeouts.

### Custom Plugin Template

```typescript
import { definePlugin, type PluginContext } from 'scichart-engine';

export const MyAnnotationPlugin = definePlugin({
  name: 'my-annotations',
  provides: ['visualization']
}, (config) => {
  return {
    onInit(ctx: PluginContext) {
      ctx.log.info("My Annotation Plugin active!");
    },
    onRenderOverlay(ctx: PluginContext) {
      const { ctx2d, plotArea } = ctx.render;
      if (!ctx2d) return;

      // Draw a custom label on the chart
      ctx2d.fillStyle = 'yellow';
      ctx2d.fillText("CONFIDENTIAL", plotArea.x + 10, plotArea.y + 20);
    }
  };
});
```

## Plugin API Discovery

You can retrieve any registered plugin's API to interact with it programmatically:

```typescript
const statsApi = chart.getPluginAPI('scichart-stats');
statsApi.show();
```
