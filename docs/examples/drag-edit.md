---
title: Drag & Drop Editing
description: Interactive point editing with drag and drop
---

# Drag & Drop Editing

Interactive editing of chart data by dragging points with the mouse. Perfect for manual data correction, curve fitting, and exploratory analysis.

## Interactive Demo

<DragEditDemo height="400px" />

## What is Drag Editing?

Drag & drop editing allows users to click and drag data points to new positions, making it easy to:
- Manually correct outliers or errors
- Adjust fitted curves interactively
- Modify baselines or reference lines
- Mark peaks or features of interest
- Explore "what-if" scenarios

## Key Features

- **Flexible Constraints**: Edit X-only, Y-only, or both axes
- **Grid Snapping**: Align points to precise grid intervals
- **Validation**: Custom validation before applying changes
- **Visual Feedback**: Preview lines show movement before release
- **Event Callbacks**: React to drag start, drag, and drag end
- **Selective Editing**: Choose which series are editable

## Basic Usage

```typescript
import { createChart, PluginDragEdit } from 'sci-plot';

const chart = createChart({
  container: document.getElementById('chart')!
});

// Add data
chart.addSeries({
  id: 'data',
  data: {
    x: [1, 2, 3, 4, 5],
    y: [2, 4, 3, 5, 4]
  },
  style: {
    mode: 'line+scatter',
    pointSize: 8
  }
});

// Enable drag editing
await chart.use(PluginDragEdit({
  enabled: true,
  constraint: 'both',
  onDragEnd: (event) => {
    console.log(`Moved point ${event.index} to (${event.newX}, ${event.newY})`);
  }
}));
```

## Constraint Modes

### Edit Both Axes

```typescript
await chart.use(PluginDragEdit({
  constraint: 'both' // Default: move anywhere
}));
```

### X-Axis Only (Horizontal)

```typescript
await chart.use(PluginDragEdit({
  constraint: 'x' // Perfect for adjusting timing
}));
```

### Y-Axis Only (Vertical)

```typescript
await chart.use(PluginDragEdit({
  constraint: 'y' // Perfect for baseline correction
}));
```

## Grid Snapping

Snap points to grid intervals for precise alignment:

```typescript
await chart.use(PluginDragEdit({
  snapToGrid: true,
  snapIntervalX: 0.5,
  snapIntervalY: 1.0
}));
```

## Event Handling

```typescript
await chart.use(PluginDragEdit({
  onDragStart: (event) => {
    console.log('Started dragging:', event.index);
  },
  onDrag: (event) => {
    console.log('Current delta:', event.deltaX, event.deltaY);
  },
  onDragEnd: (event) => {
    // Save to backend
    saveData(event.seriesId, event.index, event.newX, event.newY);
  }
}));
```

## Runtime Control

```typescript
// Enable/disable
chart.dragEdit.enable();
chart.dragEdit.disable();

// Check status
if (chart.dragEdit.isEnabled()) {
  // ...
}

// Cancel ongoing drag
chart.dragEdit.cancelDrag();

// Update configuration
chart.dragEdit.updateConfig({
  snapToGrid: true,
  highlightColor: '#ff0000'
});
```

## Use Cases

### 1. Manual Data Correction

Remove outliers or fix measurement errors:

```typescript
await chart.use(PluginDragEdit({
  onDragEnd: (event) => {
    // Mark as manually corrected
    markAsCorrected(event.seriesId, event.index);
  }
}));
```

### 2. Baseline Adjustment

Adjust baseline with vertical-only editing:

```typescript
await chart.use(PluginDragEdit({
  constraint: 'y',
  editableSeries: ['baseline'],
  snapToGrid: true,
  snapIntervalY: 0.1
}));
```

### 3. Interactive Curve Fitting

Adjust control points and see fit update in real-time:

```typescript
await chart.use(PluginDragEdit({
  editableSeries: ['control-points'],
  onDrag: (event) => {
    // Recalculate fit
    updateFit();
  }
}));
```

## API Reference

See [Plugin Drag Edit API](/api/plugin-drag-edit) for complete documentation.

## See Also

- [Interactive Tools](/api/interactive-tools) - Delta and Peak measurement
- [Annotations](/api/annotations) - Manual markers
- [Selection API](/api/selection) - Point selection
