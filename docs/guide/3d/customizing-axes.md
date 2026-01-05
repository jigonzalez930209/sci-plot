# Customizing 3D Axes

Learn how to customize the appearance and behavior of 3D chart axes.

## Overview

The 3D axis system provides professional-grade axis rendering with:
- Wall grids on three planes
- Customizable tick marks and labels
- Billboard text that always faces the camera
- Color-coded axis lines (X=red, Y=green, Z=blue)

## Basic Configuration

```typescript
const renderer = new Bubble3DRenderer({
  canvas,
  axes: {
    xAxis: { label: 'Time (s)' },
    yAxis: { label: 'Amplitude' },
    zAxis: { label: 'Frequency (Hz)' },
    tickCount: 6,
  },
});
```

## Wall Grids

The axis system renders grids on three wall planes:

```
     Y
     |   /Z
     |  /
     | /
     +-------- X
```

### Enable/Disable Grids

```typescript
axes: {
  showFloorGrid: true,   // XZ plane (horizontal floor)
  showWallGrids: true,   // XY and YZ planes (vertical walls)
}
```

### Grid Styling

```typescript
axes: {
  gridColor: [0.4, 0.45, 0.5],  // RGB values 0-1
  gridOpacity: 0.4,             // Floor grid opacity
  wallGridOpacity: 0.2,         // Wall grid opacity (usually lighter)
}
```

## Tick Marks and Labels

### Tick Count

```typescript
axes: {
  tickCount: 5,  // Number of divisions per axis (default: 5)
}
```

### Custom Number Formatting

```typescript
axes: {
  xAxis: {
    label: 'Frequency',
    tickFormat: (value) => {
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}k`;
      }
      return value.toFixed(0);
    },
  },
  yAxis: {
    label: 'Power (dB)',
    tickFormat: (value) => {
      return value >= 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
    },
  },
}
```

### Scientific Notation

```typescript
const scientificFormat = (value: number) => {
  if (Math.abs(value) < 0.001 && value !== 0) {
    return value.toExponential(1);
  }
  if (Math.abs(value) >= 10000) {
    return value.toExponential(1);
  }
  return value.toFixed(1);
};

axes: {
  xAxis: { tickFormat: scientificFormat },
  yAxis: { tickFormat: scientificFormat },
  zAxis: { tickFormat: scientificFormat },
}
```

## Axis Colors

### Default Colors

| Axis | Color | RGB |
|------|-------|-----|
| X | Red | `[0.9, 0.3, 0.3]` |
| Y | Green | `[0.3, 0.9, 0.3]` |
| Z | Blue | `[0.3, 0.3, 0.9]` |

### Custom Axis Colors

```typescript
axes: {
  xAxis: {
    label: 'X',
    color: [1.0, 0.5, 0.0],  // Orange
  },
  yAxis: {
    label: 'Y', 
    color: [0.0, 1.0, 1.0],  // Cyan
  },
  zAxis: {
    label: 'Z',
    color: [1.0, 0.0, 1.0],  // Magenta
  },
}
```

## Box Wireframe

The bounding box helps visualize the 3D space:

```typescript
axes: {
  boxColor: [0.3, 0.35, 0.4],  // Dark gray-blue
  boxOpacity: 0.5,              // 50% opacity
}
```

### Hide Box Wireframe

```typescript
axes: {
  boxOpacity: 0,  // Invisible box
}
```

## Hiding Specific Axes

```typescript
axes: {
  xAxis: { visible: true },
  yAxis: { visible: true },
  zAxis: { visible: false },  // Hide Z axis
}
```

## Dark Mode vs Light Mode

### Dark Theme

```typescript
const darkTheme = {
  backgroundColor: [0.05, 0.05, 0.1, 1],
  axes: {
    gridColor: [0.4, 0.45, 0.5],
    boxColor: [0.3, 0.35, 0.4],
    gridOpacity: 0.4,
  },
};
```

### Light Theme

```typescript
const lightTheme = {
  backgroundColor: [0.95, 0.95, 0.98, 1],
  axes: {
    gridColor: [0.6, 0.6, 0.65],
    boxColor: [0.7, 0.7, 0.75],
    gridOpacity: 0.3,
  },
};
```

## Dynamic Axis Updates

Update axis configuration at runtime:

```typescript
// Update axis options
renderer.setAxesOptions({
  xAxis: { label: 'New X Label' },
  tickCount: 8,
});
```

## Custom Text Rendering

For advanced label styling, use the 2D canvas overlay:

```typescript
// Get label positions
const labels = renderer.getAxisLabels();

// Create 2D overlay
const overlay = document.createElement('canvas');
overlay.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
container.appendChild(overlay);
const ctx = overlay.getContext('2d');

renderer.on('render', () => {
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  
  for (const label of labels) {
    const screen = renderer.projectToScreen(label.worldPosition);
    if (!screen.visible) continue;
    
    // Custom styling
    ctx.font = label.axis === 'title' ? 'bold 14px Inter' : '11px Inter';
    ctx.fillStyle = `rgb(${label.color.map(c => Math.round(c * 255)).join(',')})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add shadow for readability
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 3;
    
    ctx.fillText(label.text, screen.x, screen.y);
    ctx.shadowBlur = 0;
  }
});
```

## Performance Considerations

### Reduce Tick Count for Complex Scenes

```typescript
// Fewer ticks = faster rendering
axes: {
  tickCount: 3,            // Minimum ticks
  showWallGrids: false,    // Disable wall grids
}
```

### Disable Grids for Maximum Performance

```typescript
axes: {
  showFloorGrid: false,
  showWallGrids: false,
  showAxes: true,  // Keep axis lines only
}
```

## Complete Example

```typescript
import { Bubble3DRenderer } from 'scichart-engine/core/3d';

const renderer = new Bubble3DRenderer({
  canvas,
  backgroundColor: [0.05, 0.05, 0.1, 1],
  axes: {
    // X Axis
    xAxis: {
      label: 'Frequency (Hz)',
      color: [1.0, 0.4, 0.4],
      tickFormat: (v) => `${v.toFixed(0)}`,
    },
    // Y Axis  
    yAxis: {
      label: 'Power (dB)',
      color: [0.4, 1.0, 0.4],
      tickFormat: (v) => v >= 0 ? `+${v.toFixed(0)}` : v.toFixed(0),
    },
    // Z Axis
    zAxis: {
      label: 'Time (s)',
      color: [0.4, 0.4, 1.0],
      tickFormat: (v) => `${v.toFixed(1)}s`,
    },
    // Grid settings
    tickCount: 6,
    showFloorGrid: true,
    showWallGrids: true,
    gridColor: [0.3, 0.35, 0.4],
    gridOpacity: 0.4,
    wallGridOpacity: 0.2,
    // Box
    boxColor: [0.25, 0.3, 0.35],
    boxOpacity: 0.6,
  },
});
```

## Related

- [Axes3D API](/api/3d/axes) - Complete API reference
- [Getting Started](/guide/3d/getting-started) - Introduction to 3D charts
- [Camera Controls](/guide/3d/camera-controls) - Camera customization
