# Interactions

SciChart Engine provides rich built-in interactions for exploring data.

<script setup>
import { ref } from 'vue'
</script>

## Interactive Demo

<ChartDemo type="basic" height="350px" :points="50000" />

## Built-in Interactions

### Mouse Wheel Zoom

Scroll the mouse wheel to zoom in/out centered on the cursor position.

- **Scroll up**: Zoom in
- **Scroll down**: Zoom out
- **Shift + Scroll**: Zoom X-axis only
- **Ctrl + Scroll**: Zoom Y-axis only

### Interaction Modes

SciChart Engine uses a mode-based interaction system. You can switch between different modes depending on the desired user interaction:

| Mode | Action | Best For |
|------|--------|----------|
| `pan` | Click & Drag to pan | Default navigation |
| `boxZoom` | Draw a rectangle to zoom | Deep diving into data |
| `select` | Click or Drag to select points | Data exploration & export |
| `delta` | Click two points to measure | Signal measurements |
| `peak` | Click two points to integrate | Peak analysis (area, height) |

```typescript
// Set the interaction mode
chart.setMode('boxZoom');

// Get current mode
const mode = chart.getMode(); // 'boxZoom'
```

### Pan (Drag)

When in `pan` mode (default), click and drag with the left mouse button to pan the view.

### Box Zoom

When in `boxZoom` mode, click and drag to draw a selection rectangle. The view will zoom to fit the selected area.

## Legend Interactions

### Bring-to-Front on Hover

When you hover over a series name in the legend:

- **Series brought to front**: The series renders on top of all others
- **Highlighted color**: The series changes to the highlight color from the active color scheme
- **Instant response**: Changes happen smoothly in real-time

This feature is particularly useful for dense multi-series charts where you need to identify a specific series.

```typescript
const chart = createChart({
  container,
  showLegend: true,
  colorScheme: 'vibrant'  // Provides highlight color
})

// Add multiple series
for (let i = 0; i < 10; i++) {
  chart.addSeries({
    id: `series${i}`,
    type: 'line',
    data: generateData(i)
  })
}

// Hover over any series in legend → brings to front + highlights
```

### Toggle Series Visibility

Click on a series name in the legend to toggle its visibility on/off.

```typescript
// Series visibility is automatically managed
// Clicking the legend item shows/hides the series
```
Alternatively, you can always **Right-click + Drag** to perform a box zoom regardless of the current mode.

### Point Selection

When in `select` mode, you can click on individual points to select them, or drag to create a selection region.

```typescript
chart.setMode('select');

chart.on('pointSelect', ({ seriesId, index }) => {
  console.log(`Selected point ${index} in series ${seriesId}`);
});
```

### Advanced Tools (Delta & Peak)

- **Delta Tool**: Measures the difference (ΔX, ΔY, distance, slope) between two points.
- **Peak Tool**: Performs peak analysis between two points, automatically detecting a linear baseline and calculating the integrated area, peak height, and center.

```typescript
chart.setMode('delta');

chart.on('deltaMeasure', (measurement) => {
  console.log(`Measured ΔY: ${measurement.deltaY}`);
});
```

### Double-click Reset

Double-click to reset the view to auto-scale (fit all data).

## Cursor

Enable an interactive cursor with crosshair and tooltips.

### Basic Cursor

```typescript
chart.enableCursor({
  snap: true,      // Snap to nearest data point
  crosshair: true, // Show crosshair lines
})
```

### Custom Tooltip

```typescript
chart.enableCursor({
  snap: true,
  crosshair: true,
  formatter: (x, y) => {
    return `Time: ${x.toFixed(2)}s\nValue: ${y.toFixed(4)}`
  },
})
```

### Disable Cursor

```typescript
chart.disableCursor()
```

## Programmatic Control

### Zoom to Range

```typescript
// Zoom to specific bounds
chart.zoom({
  x: [0, 100],    // X range
  y: [-1, 1],     // Y range
})

// Zoom X only
chart.zoom({ x: [10, 50] })

// Zoom Y only
chart.zoom({ y: [0, 100] })
```

### Pan

```typescript
// Pan by data units
chart.pan(10, 0)   // Pan right by 10 units
chart.pan(0, -5)   // Pan down by 5 units
```

### Reset View

```typescript
// Reset to auto-scale
chart.resetZoom()

// Or explicitly auto-scale
chart.autoScale()
```

### Get Current View

```typescript
const bounds = chart.getViewBounds()
console.log(`X: ${bounds.xMin} to ${bounds.xMax}`)
console.log(`Y: ${bounds.yMin} to ${bounds.yMax}`)
```

## Events

Listen to interaction events:

### Zoom Event

```typescript
chart.on('zoom', ({ x, y }) => {
  console.log(`New view: X[${x[0]}, ${x[1]}], Y[${y[0]}, ${y[1]}]`)
})
```

### Pan Event

```typescript
chart.on('pan', ({ deltaX, deltaY }) => {
  console.log(`Panned: ${deltaX}, ${deltaY}`)
})
```

## Touch Support

SciChart Engine supports touch gestures on mobile devices:

| Gesture | Action |
|---------|--------|
| Single finger drag | Pan |
| Pinch | Zoom |
| Double tap | Reset view |

## Keyboard Shortcuts

When the chart is focused:

| Key | Action |
|-----|--------|
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| Arrow keys | Pan |
| `Home` | Reset view |

## Toolbar Configuration

The chart toolbar (modebar) can be customized with specific buttons and interaction behavior.

```typescript
const chart = createChart({
  container,
  toolbar: {
    show: true,
    pinnable: true, // Enable hover-to-expand behavior (default: true)
    buttons: {
      reset: true,    // Enable reset zoom button (disabled by default)
      select: false,  // Disable point selection button
      export: true,
    }
  }
})
```

### Pinnable Behavior (Menu Mode)

By default, the toolbar is **pinnable**. This translates to a "menu-like" behavior:
- **Collapsed**: Only the "Pin" icon is visible.
- **Hover**: Hovering over the pin icon expands the full toolbar.
- **Click**: Clicking the pin icon "locks" the toolbar in place so it stays visible even when the mouse leaves.

### Available Buttons

| Button | ID | Default | Description |
|--------|----|---------|-------------|
| Pan | `pan` | `true` | Standard drag-to-pan mode |
| Box Zoom | `boxZoom` | `true` | Rectangle selection zoom |
| Select | `select` | `true` | Data point selection |
| Delta | `delta` | `true` | Measurement tool |
| Peak | `peak` | `true` | Peak analysis tool |
| **Reset** | `reset` | **`false`** | Immediate reset to auto-scale |
| Auto Scale | `autoscale` | `true` | Scale axes to fit data |
| Type Switch | `type` | `true` | Toggle between line/scatter |
| Smoothing | `smooth` | `true` | Toggle signal smoothing |
| Export | `export` | `true` | Export as PNG |
| Legend | `legend` | `true` | Toggle legend visibility |

## Disabling Interactions

### Disable All

```typescript
const chart = createChart({
  container,
  // No interaction options = interactions enabled by default
})

// To disable specific interactions, use CSS pointer-events
chartContainer.style.pointerEvents = 'none'
```

### Read-only Mode

For display-only charts:

```typescript
const chart = createChart({
  container,
  showControls: false,  // Hide toolbar
})

// Disable mouse interactions
container.style.pointerEvents = 'none'
```

## Synchronized Charts

Sync zoom/pan between multiple charts:

```typescript
const chart1 = createChart({ container: container1 })
const chart2 = createChart({ container: container2 })

// Sync chart2 to chart1
chart1.on('zoom', ({ x, y }) => {
  chart2.zoom({ x, y })
})

// Bidirectional sync
chart2.on('zoom', ({ x, y }) => {
  chart1.zoom({ x, y })
})
```

## Custom Interaction Example

Create a custom "zoom to selection" button:

```typescript
let isSelecting = false
let startPoint = null

container.addEventListener('mousedown', (e) => {
  if (e.button === 0 && e.shiftKey) {  // Shift + left click
    isSelecting = true
    startPoint = { x: e.clientX, y: e.clientY }
  }
})

container.addEventListener('mouseup', (e) => {
  if (isSelecting && startPoint) {
    const rect = container.getBoundingClientRect()
    
    // Convert pixel coordinates to data coordinates
    const bounds = chart.getViewBounds()
    const x1 = pixelToData(startPoint.x - rect.left, bounds.xMin, bounds.xMax, rect.width)
    const x2 = pixelToData(e.clientX - rect.left, bounds.xMin, bounds.xMax, rect.width)
    
    chart.zoom({ x: [Math.min(x1, x2), Math.max(x1, x2)] })
    
    isSelecting = false
    startPoint = null
  }
})

function pixelToData(pixel, min, max, size) {
  return min + (pixel / size) * (max - min)
}
```
