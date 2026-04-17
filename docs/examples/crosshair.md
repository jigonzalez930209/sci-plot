---
title: Crosshair Cursor
description: Crosshair cursor demo showcasing different value display modes and configuration options.
---

# Crosshair Cursor

Use the crosshair to inspect values precisely. This demo showcases the different value display modes and configuration options.

## Interactive Demo

Try the different crosshair settings using the controls below:

<ChartDemo type="crosshair" />

## Value Display Modes

The cursor supports three modes for displaying coordinate values:

### Floating (Default)

Values are displayed in a tooltip next to the cursor. This provides precise readout that follows the mouse.

```typescript
chart.enableCursor({
  enabled: true,
  crosshair: true,
  valueDisplayMode: 'floating', // Default
});
```

### Corner Mode

Values are displayed in a fixed corner box. This is useful for keeping the values out of the way of the data.

```typescript
chart.enableCursor({
  enabled: true,
  crosshair: true,
  valueDisplayMode: 'corner',
  cornerPosition: 'top-left', // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
});
```

### Disabled Mode

No X,Y values are shown. The crosshair lines are visible, but coordinate readout is hidden.

```typescript
chart.enableCursor({
  enabled: true,
  crosshair: true,
  valueDisplayMode: 'disabled', // Crosshair lines only, no tooltip
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable cursor |
| `crosshair` | `boolean` | `false` | Show vertical and horizontal crosshair lines |
| `snap` | `boolean` | `false` | Snap to nearest data point |
| `valueDisplayMode` | `'disabled' \| 'floating' \| 'corner'` | `'floating'` | How to display coordinate values |
| `cornerPosition` | `'top-left' \| 'top-right' \| ...` | `'top-left'` | Corner for 'corner' mode |
| `lineStyle` | `'solid' \| 'dashed' \| 'dotted'` | `'dashed'` | Crosshair line style |
| `formatter` | `(x, y, seriesId) => string` | — | Custom tooltip formatter |

## Complete Example

```typescript
import { createChart } from 'velo-plot';

const chart = createChart({
  container: document.getElementById('chart'),
  theme: 'midnight',
});

// Enable cursor with corner display
chart.enableCursor({
  enabled: true,
  crosshair: true,
  snap: true,
  valueDisplayMode: 'corner',
  cornerPosition: 'top-right',
  lineStyle: 'dashed',
});

// Add some data
chart.addSeries({
  id: 'signal',
  type: 'line',
  data: { x: new Float32Array([...]), y: new Float32Array([...]) },
});
```

## Custom Formatter

You can customize how values are displayed using the `formatter` option:

```typescript
chart.enableCursor({
  enabled: true,
  crosshair: true,
  valueDisplayMode: 'floating',
  formatter: (x, y, seriesId) => {
    return `Time: ${x.toFixed(2)} s\nValue: ${y.toFixed(4)}`;
  },
});
```

## Disabling the Cursor

To disable the cursor completely:

```typescript
chart.disableCursor();
```
