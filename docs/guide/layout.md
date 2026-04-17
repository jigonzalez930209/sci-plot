# Layout & Positioning

Configure the positioning and behavior of chart components with fine-grained control.

<script setup>
import { ref } from 'vue'
</script>

## Overview

The layout system provides detailed control over:
- **Legend** - positioning, hover behavior, and interactivity
- **Crosshair** - coordinate value display modes
- **Toolbar** - position presets and custom placement
- **Margins** - space around the chart
- **Axis Spacing** - gaps between axis elements

## Quick Start

```typescript
import { createChart } from 'velo-plot';

const chart = createChart({
  container: document.getElementById('chart'),
  theme: 'midnight',
  layout: {
    legend: {
      highlightOnHover: false,  // Don't change color (default)
      bringToFrontOnHover: true, // Bring to front (default)
    },
    crosshair: {
      valueDisplayMode: 'corner', // 'disabled' | 'corner' | 'floating'
      cornerPosition: 'top-left',
    },
    margins: { top: 30, right: 40, bottom: 60, left: 80 },
  },
});
```

## Legend Configuration

### Hover Behavior

By default, hovering over a series in the legend:
- ✅ **Brings the series to the foreground** (z-index)
- ❌ **Does NOT change the series color**

This is the new default behavior in v2.x. To enable color highlighting:

```typescript
const chart = createChart({
  container,
  layout: {
    legend: {
      highlightOnHover: true,  // Enable color change on hover
      bringToFrontOnHover: true, // Still bring to front
    },
  },
});
```

### Position

```typescript
layout: {
  legend: {
    // Preset positions
    position: 'top-right', // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    
    // Or custom coordinates
    position: { x: 100, y: 50 },
  },
}
```

### Legend Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `visible` | `boolean` | `true` | Show/hide the legend |
| `position` | `preset \| {x,y}` | `'top-right'` | Position preset or coordinates |
| `width` | `number` | `120` | Legend width in pixels |
| `highlightOnHover` | `boolean` | **`false`** | Change series color on hover |
| `bringToFrontOnHover` | `boolean` | **`true`** | Bring series to front on hover |
| `draggable` | `boolean` | `true` | Allow dragging |
| `resizable` | `boolean` | `true` | Allow resizing |

## Crosshair Value Display

The crosshair supports three modes for displaying X,Y coordinate values:

### Disabled (Default)

```typescript
layout: {
  crosshair: {
    valueDisplayMode: 'disabled', // No values shown
  },
}
```

### Corner Mode

Values displayed in a fixed corner box:

```typescript
layout: {
  crosshair: {
    valueDisplayMode: 'corner',
    cornerPosition: 'top-left', // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  },
}
```

### Floating Mode

Values displayed as axis labels next to cursor:

```typescript
layout: {
  crosshair: {
    valueDisplayMode: 'floating',
  },
}
```

### Crosshair Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Show crosshair lines |
| `showVertical` | `boolean` | `true` | Show vertical line |
| `showHorizontal` | `boolean` | `true` | Show horizontal line |
| `valueDisplayMode` | `'disabled' \| 'corner' \| 'floating'` | **`'disabled'`** | Value display mode |
| `cornerPosition` | corner preset | `'top-left'` | Corner for 'corner' mode |
| `snapToData` | `boolean` | `false` | Snap to nearest point |

## Margins & Padding

### Chart Margins

Space between the container edges and the chart area:

```typescript
layout: {
  margins: {
    top: 30,    // Space above (for title)
    right: 40,  // Space on right
    bottom: 60, // Space below (for x-axis labels)
    left: 80,   // Space on left (for y-axis labels)
  },
}
```

### Plot Area Padding

Space inside the plot area, between the axes and the data:

```typescript
layout: {
  plotPadding: {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10,
  },
}
```

## Axis Layout

Control spacing between axis elements:

```typescript
layout: {
  xAxisLayout: {
    titleGap: 12,   // Distance from axis line to title
    labelGap: 6,    // Distance from tick labels to axis line
    tickGap: 2,     // Distance from tick marks to axis line
    axisPadding: 0, // Padding between axis area and plot
  },
  yAxisLayout: {
    titleGap: 10,
    labelGap: 4,
    tickGap: 2,
    axisPadding: 0,
  },
}
```

## Chart Title

```typescript
layout: {
  title: {
    text: 'My Chart Title',
    visible: true,
    fontSize: 18,
    fontWeight: 600,
    color: '#ffffff',
    position: 'top',      // 'top' | 'bottom'
    align: 'center',      // 'left' | 'center' | 'right'
    padding: { top: 12, bottom: 8 },
  },
}
```

## Toolbar Position

```typescript
layout: {
  // Preset position
  toolbarPosition: 'top-right',
  
  // Or custom position
  toolbarPosition: {
    horizontal: 'center',  // 'left' | 'center' | 'right' | number
    vertical: 'top',       // 'top' | 'bottom' | number
    offset: { x: 0, y: 10 },
  },
}
```

## Complete Example

```typescript
import { createChart } from 'velo-plot';

const chart = createChart({
  container: document.getElementById('chart'),
  theme: 'midnight',
  
  layout: {
    // Chart title
    title: {
      text: 'Scientific Data Analysis',
      visible: true,
      fontSize: 18,
      position: 'top',
      align: 'center',
    },
    
    // Legend: bring to front but don't change color
    legend: {
      visible: true,
      position: 'top-right',
      highlightOnHover: false,
      bringToFrontOnHover: true,
      draggable: true,
    },
    
    // Crosshair: show values in corner
    crosshair: {
      enabled: true,
      valueDisplayMode: 'corner',
      cornerPosition: 'top-left',
    },
    
    // Toolbar at top center
    toolbarPosition: 'top-center',
    
    // Custom margins
    margins: {
      top: 50,  // Extra space for title
      right: 30,
      bottom: 60,
      left: 80,
    },
    
    // Axis spacing
    xAxisLayout: { titleGap: 12, labelGap: 6 },
    yAxisLayout: { titleGap: 10, labelGap: 4 },
  },
  
  xAxis: { label: 'Time (s)' },
  yAxis: { label: 'Current (µA)' },
});
```

## Default Values (v2.x)

| Feature | Default | Behavior |
|---------|---------|----------|
| Legend hover color | **`false`** | No color change on hover |
| Legend bring-to-front | **`true`** | Series comes to front on hover |
| Crosshair values | **`'disabled'`** | No X,Y values displayed |

## Migration from v1.x

### Legend Hover Behavior

**v1.x:** Legend hover always changed series color.

**v2.x:** Legend hover does NOT change color by default.

```typescript
// To restore v1.x behavior:
layout: {
  legend: {
    highlightOnHover: true,
  },
}
```

### Crosshair Labels

**v1.x:** Axis labels shown by default (`showAxisLabels: true`).

**v2.x:** Values hidden by default (`valueDisplayMode: 'disabled'`).

```typescript
// To restore v1.x behavior:
layout: {
  crosshair: {
    valueDisplayMode: 'floating',
  },
}
```

## TypeScript Types

```typescript
import type {
  LayoutOptions,
  LegendOptions,
  CrosshairOptions,
  CrosshairValueMode,
  CornerPosition,
  ChartMargins,
  AxisLayoutOptions,
} from 'velo-plot';
```
