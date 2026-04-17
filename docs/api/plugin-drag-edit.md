---
title: Drag & Drop Editing Plugin
description: Interactive point editing with drag and drop
---

# Drag & Drop Editing

The Drag & Drop Editing plugin enables interactive modification of data points directly on the chart by dragging them with the mouse. This is useful for manual data correction, curve fitting adjustments, and interactive data exploration.

## Features

- ✅ **Interactive Point Dragging** - Click and drag points to new positions
- ✅ **Axis Constraints** - Restrict editing to X-axis, Y-axis, or both
- ✅ **Grid Snapping** - Snap points to grid intervals
- ✅ **Validation** - Custom validation before applying changes
- ✅ **Visual Feedback** - Preview lines and highlighted points during drag
- ✅ **Event Callbacks** - onDragStart, onDrag, onDragEnd events
- ✅ **Selective Editing** - Choose which series are editable

## Basic Usage

```typescript
import { createChart, PluginDragEdit } from 'sci-plot';

const chart = createChart({
  container: document.getElementById('chart')!
});

// Add series
chart.addSeries({
  id: 'data',
  data: { x: [1, 2, 3, 4, 5], y: [2, 4, 3, 5, 4] }
});

// Enable drag editing
await chart.use(PluginDragEdit({
  enabled: true,
  constraint: 'both', // Can edit both X and Y
  onDragEnd: (event) => {
    console.log(`Point ${event.index} moved`);
  }
}));
```

## Configuration Options

### `PluginDragEditConfig`

```typescript
interface PluginDragEditConfig {
  enabled?: boolean;          // Default: true
  constraint?: 'x' | 'y' | 'both' | 'none';  // Default: 'both'
  snapToGrid?: boolean;      // Default: false
  snapIntervalX?: number;
  snapIntervalY?: number;
  dragThreshold?: number;    // Default: 5px
  hitRadius?: number;        // Default: 10px
  editableSeries?: string[];
  validator?: (point: DraggedPoint) => DragValidation | boolean;
  onDragStart?: (event: DragEditEvent) => void;
  onDrag?: (event: DragEditEvent) => void;
  onDragEnd?: (event: DragEditEvent) => void;
  highlightColor?: string;   // Default: '#ffff00'
  showPreview?: boolean;     // Default: true
  previewStyle?: {
    color?: string;
    width?: number;
    dash?: number[];
    opacity?: number;
  };
}
```

## See Also

- [Interactive Tools](/api/interactive-tools)
- [Annotations](/api/annotations)
- [Selection API](/api/selection)
