# Hit-Testing & Selection API

Advanced point selection and hit-testing capabilities for interactive data exploration.

## Interactive Demo
<ChartDemo type="selection" height="400px" />

## Overview

The Selection API provides:
- **Hit-Testing**: Find data points at specific pixel coordinates
- **Single Selection**: Click to select individual points
- **Multi-Selection**: Ctrl+click to add/toggle points
- **Box Selection**: Drag to select multiple points in a region
- **Selection Events**: React to selection changes
- **Visual Highlighting**: Automatic highlighting of selected points

## Quick Start

```typescript
import { createChart } from 'sci-plot';

const chart = createChart({
  container: document.getElementById('chart')!,
});

// Add some data
chart.addSeries({
  id: 'data',
  type: 'line+scatter',
  data: {
    x: new Float32Array([1, 2, 3, 4, 5]),
    y: new Float32Array([2.3, 4.1, 3.8, 5.2, 4.9])
  }
});

// Listen for selection events
chart.on('pointSelect', (e) => {
  console.log('Selected points:', e.points);
  console.log('Selection mode:', e.mode); // 'single' | 'add' | 'toggle'
  console.log('Source:', e.source); // 'click' | 'box' | 'api'
});

chart.on('selectionChange', (e) => {
  console.log('Current selection:', e.selected);
  console.log('Previous selection:', e.previous);
});
```

## Selection Methods

### Select Points Programmatically

```typescript
// Select specific points
chart.selectPoints([
  { seriesId: 'data', indices: [0, 1, 2] }
]);

// Add to existing selection
chart.selectPoints([
  { seriesId: 'data', indices: [5, 6] }
], 'add');

// Toggle points (add if not selected, remove if selected)
chart.selectPoints([
  { seriesId: 'data', indices: [3] }
], 'toggle');

// Remove from selection
chart.selectPoints([
  { seriesId: 'data', indices: [1] }
], 'remove');
```

### Get Selected Points

```typescript
const selected = chart.getSelectedPoints();
// Returns: [{ seriesId: 'data', index: 0, x: 1, y: 2.3 }, ...]

// Check if specific point is selected
const isSelected = chart.isPointSelected('data', 5);

// Get selection count
const count = chart.getSelectionCount();
```

### Clear Selection

```typescript
chart.clearSelection();
```

## Hit-Testing

### Manual Hit-Test

```typescript
// Get the data point at a pixel coordinate
const hit = chart.hitTest(mouseX, mouseY);

if (hit) {
  console.log('Series:', hit.seriesId);
  console.log('Index:', hit.index);
  console.log('Data X:', hit.x);
  console.log('Data Y:', hit.y);
  console.log('Distance:', hit.distance);
  console.log('Pixel X:', hit.pixelX);
  console.log('Pixel Y:', hit.pixelY);
}
```

## Configuration

```typescript
chart.configureSelection({
  // Enable/disable selection (default: true)
  enabled: true,
  
  // Maximum distance in pixels for hit-testing (default: 20)
  hitRadius: 25,
  
  // Allow multi-selection with Ctrl+click (default: true)
  multiSelect: true,
  
  // Enable box selection with Shift+drag (default: true)
  boxSelect: true,
  
  // Highlight style for selected points
  highlightStyle: {
    color: '#00ffff',
    size: 12,
    ringWidth: 3
  }
});
```

## Events

### pointSelect

Fired when points are selected.

```typescript
interface PointSelectEvent {
  points: SelectedPoint[];
  mode: 'single' | 'add' | 'remove' | 'toggle';
  source: 'click' | 'box' | 'api';
}

chart.on('pointSelect', (e: PointSelectEvent) => {
  // Handle new selection
});
```

### regionSelect

Fired after a box selection is completed.

```typescript
interface RegionSelectEvent {
  bounds: Bounds;
  containedPoints: SelectedPoint[];
}

chart.on('regionSelect', (e: RegionSelectEvent) => {
  // Handle region selection
  console.log('Region bounds:', e.bounds);
  console.log('Points in region:', e.containedPoints.length);
});
```

### selectionChange

Fired whenever the selection changes.

```typescript
chart.on('selectionChange', (e) => {
  console.log('Selected:', e.selected.length, 'points');
  console.log('Was:', e.previous.length, 'points');
});
```

### selectionClear

Fired when selection is cleared.

```typescript
chart.on('selectionClear', () => {
  console.log('Selection cleared');
});
```

## Types

### SelectedPoint

```typescript
interface SelectedPoint {
  seriesId: string;
  index: number;
  x: number;
  y: number;
}
```

### HitTestResult

```typescript
interface HitTestResult {
  seriesId: string;
  index: number;
  x: number;
  y: number;
  distance: number;
  pixelX: number;
  pixelY: number;
}
```

### SelectionMode

```typescript
type SelectionMode = 'single' | 'add' | 'remove' | 'toggle';
```

## User Interactions

| Action | Behavior |
|--------|----------|
| Click on point | Select that point (clears previous) |
| Click on empty space | Clear selection |
| Ctrl + Click on point | Toggle point in selection |
| Shift + Click on point | Add point to selection |
| Shift + Drag | Box select points in region |
| Shift + Ctrl + Drag | Add box selection to existing |

## Example: Peak Selection

```typescript
// Find and select all peaks
function selectPeaks(chart: Chart, seriesId: string) {
  const series = chart.getSeries(seriesId);
  if (!series) return;
  
  const data = series.getData();
  const peakIndices: number[] = [];
  
  for (let i = 1; i < data.y.length - 1; i++) {
    if (data.y[i] > data.y[i-1] && data.y[i] > data.y[i+1]) {
      peakIndices.push(i);
    }
  }
  
  chart.selectPoints([{ seriesId, indices: peakIndices }]);
}
```

## Example: Export Selected Data

```typescript
chart.on('selectionChange', (e) => {
  if (e.selected.length === 0) return;
  
  // Group by series
  const bySeriesMap = new Map<string, number[]>();
  e.selected.forEach((pt) => {
    if (!bySeriesMap.has(pt.seriesId)) {
      bySeriesMap.set(pt.seriesId, []);
    }
    bySeriesMap.get(pt.seriesId)!.push(pt.index);
  });
  
  // Export only selected points
  const csv = chart.exportCSV({
    seriesIds: Array.from(bySeriesMap.keys())
  });
});
```

## Performance Considerations

- Hit-testing uses binary search for O(log n) performance
- Box selection is optimized for large datasets
- Visual highlighting is GPU-accelerated
- Consider increasing `hitRadius` for touch interfaces
