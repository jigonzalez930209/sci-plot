---
title: createChart API
description: Learn how to initialize Sci Plot with createChart, including configuration for axes, themes, and WebGL rendering options.
---

# createChart

Creates a new Sci Plot instance.

## Signature

```typescript
function createChart(options: ChartOptions): Chart
```

## Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `container` | `HTMLElement` | **required** | Container element for the chart |
| `xAxis` | `AxisOptions` | `{ auto: true }` | X-axis configuration |
| `yAxis` | `AxisOptions` | `{ auto: true }` | Y-axis configuration |
| `theme` | `string \| ChartTheme` | `'dark'` | Theme name or custom theme object |
| `background` | `string` | Theme default | Background color |
| `showControls` | `boolean` | `false` | Show toolbar controls |
| `showLegend` | `boolean` | `false` | Show series legend |
| `showStatistics` | `boolean` | `false` | Enable stats panel (requires `StatsPlugin`) |
| `devicePixelRatio` | `number` | `window.devicePixelRatio` | Pixel ratio for rendering |
| `loading` | `boolean \| LoadingConfig` | `true` | Show loading indicator on init |
| `animations` | `boolean \| AnimationConfig` | `true` | Enable navigation animations |
| `responsive` | `boolean \| ResponsiveConfig` | `true` | Auto-resize on container change |
| `layout` | `LayoutOptions` | defaults | Control margins and axis title spacing |

::: tip Modular Architecture
From version 1.5.0, Sci Plot uses a highly modular plugin-based architecture. To maintain a small core bundle, advanced features like **Tooltips**, **Analysis**, and **Annotations** must be explicitly loaded using `chart.use()`.
:::
### AxisOptions

```typescript
interface AxisOptions {
  scale?: 'linear' | 'log'  // Scale type
  label?: string            // Axis label
  auto?: boolean            // Auto-scale to fit data
  min?: number              // Fixed minimum (if auto=false)
  max?: number              // Fixed maximum (if auto=false)
  invertAxis?: boolean      // Render the axis in descending order
}
```

### Inverted Axes

Set `invertAxis: true` when a domain conventionally reads high-to-low. The data arrays stay in their natural order, but the rendered axis direction and interaction coordinates are reversed.

```typescript
const chart = createChart({
  container: document.getElementById('chart'),
  xAxis: {
    label: 'Wavenumber (cm^-1)',
    auto: true,
    invertAxis: true,
  },
  yAxis: {
    label: 'Transmittance (%)',
    auto: true,
  },
})
```

### Axis Label Spacing

Adjust the distance between the axis label and the plot border with layout settings:

```typescript
const chart = createChart({
  container: document.getElementById('chart'),
  layout: {
    xAxisLayout: { titleGap: 48 },
    yAxisLayout: { titleGap: 24 },
  },
})
```

`xAxisLayout.titleGap` moves the X-axis label vertically. `yAxisLayout.titleGap` moves Y-axis labels horizontally.

By default, the X-axis label gap is `45` and the Y-axis label gap is `50`.

## Returns

Returns a `Chart` instance with the following methods:

### Series Management

```typescript
chart.addSeries({
  id: 'my-series',
  type: 'line',           // 'line' | 'scatter' | 'both' | 'candlestick' | 'step' | 'area' | 'band'
  data: { x, y },         // Float32Array or Float64Array
  style: { color: '#00f2ff', width: 2 },
})


// Update series data
chart.updateSeries('my-series', { x: newX, y: newY })

// Append data to existing series
chart.updateSeries('my-series', { x: newX, y: newY, append: true })

// Remove a series
chart.removeSeries('my-series')

// Get a series
const series = chart.getSeries('my-series')

// Get all series
const allSeries = chart.getAllSeries()
```

### View Control

```typescript
// Zoom to specific bounds
chart.zoom({ x: [0, 100], y: [-1, 1] })

// Pan by pixel delta
chart.pan(50, 0)  // Pan right 50px

// Reset to auto-scale
chart.resetZoom()

// Force auto-scale
chart.autoScale()

// { xMin: 0, xMax: 100, yMin: -1, yMax: 1 }

// NOTE: Auto-scale now uses a 0.5% padding by default for scientific precision.
```

### Loading State

Control the built-in loading indicator (enabled by default).

```typescript
// Show with custom message
chart.loading.show("Processing large dataset...")

// Update progress (0-100)
chart.loading.setProgress(45)

// Hide manually
chart.loading.hide()
```

### Cursor

```typescript
// Enable crosshair cursor
chart.enableCursor({
  snap: true,           // Snap to nearest data point
  crosshair: true,      // Show crosshair lines
  formatter: (x, y) => `X: ${x.toFixed(2)}\nY: ${y.toFixed(2)}`,
})

// Disable cursor
chart.disableCursor()
```

### Events

```typescript
// Listen to render events (for FPS monitoring)
chart.on('render', ({ fps, frameTime }) => {
  console.log(`${fps} FPS, ${frameTime}ms per frame`)
})

// Listen to zoom events
chart.on('zoom', ({ x, y }) => {
  console.log(`View: X[${x[0]}, ${x[1]}], Y[${y[0]}, ${y[1]}]`)
})

// Listen to pan events
chart.on('pan', ({ deltaX, deltaY }) => {
  console.log(`Panned: ${deltaX}, ${deltaY}`)
})

// Remove listener
chart.off('render', handler)
```

### Lifecycle

```typescript
// Manually resize (usually automatic via ResizeObserver)
chart.resize(800, 600)

// Force a render
chart.render()

// Export as image
const dataUrl = chart.exportImage('png')  // or 'jpeg'

// Export as SVG string
const svg = chart.exportSVG()

// Use a plugin
chart.use(myPlugin)

// Clean up when done
chart.destroy()
```

## Example

```typescript
import { createChart } from 'velo-plot'

// Create chart
const chart = createChart({
  container: document.getElementById('chart'),
  xAxis: { label: 'Time (s)', auto: true },
  yAxis: { label: 'Amplitude', auto: true },
  theme: 'midnight',
  showControls: true,
  showLegend: true,
})

// Generate data
const n = 10000
const x = new Float32Array(n)
const y = new Float32Array(n)

for (let i = 0; i < n; i++) {
  x[i] = i / 100
  y[i] = Math.sin(x[i]) + Math.random() * 0.1
}

// Add series
chart.addSeries({
  id: 'signal',
  type: 'line',
  data: { x, y },
  style: { color: '#00f2ff', width: 1.5 },
})

// Enable cursor with custom formatting
chart.enableCursor({
  snap: true,
  crosshair: true,
  formatter: (xVal, yVal) => 
    `Time: ${xVal.toFixed(2)}s\nValue: ${yVal.toFixed(4)}`,
})

// Monitor performance
chart.on('render', ({ fps }) => {
  document.getElementById('fps').textContent = `${fps} FPS`
})
```

## Themes

Built-in themes: `'dark'`, `'light'`, `'midnight'`, `'electrochemistry'`

```typescript
// Use built-in theme
const chart = createChart({
  container,
  theme: 'midnight',
})

// Use custom theme
import { createTheme } from 'velo-plot'

const myTheme = createTheme({
  name: 'custom',
  backgroundColor: '#1a1a2e',
  gridColor: 'rgba(255,255,255,0.1)',
  axisColor: '#888',
  // ... more options
})

const chart = createChart({
  container,
  theme: myTheme,
})
```
