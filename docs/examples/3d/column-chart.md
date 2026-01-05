# 3D Column Chart

3D bar/column visualization for categorical data.

<demo src="column-3d" />

## Overview

The Column 3D chart renders vertical bars in 3D space, perfect for:
- Categorical comparisons
- Multi-dimensional bar charts
- Financial/statistical data

## Basic Usage

```typescript
import { Chart3D } from 'scichart-engine/core/3d';

const chart = new Chart3D({
  canvas: document.getElementById('canvas'),
});

// Sample data: 5x5 grid of columns
const gridSize = 5;
const count = gridSize * gridSize;

const xValues = new Float32Array(count);
const zValues = new Float32Array(count);
const yValues = new Float32Array(count);

for (let i = 0; i < gridSize; i++) {
  for (let j = 0; j < gridSize; j++) {
    const idx = i * gridSize + j;
    xValues[idx] = i * 2;
    zValues[idx] = j * 2;
    yValues[idx] = Math.random() * 5 + 1;
  }
}

chart.addSeries({
  type: 'column',
  id: 'bars',
  xValues,
  zValues,
  yValues,
  columnWidth: 1.5,
  columnDepth: 1.5,
});
```

## Custom Colors

```typescript
const colors = new Float32Array(count * 3);
for (let i = 0; i < count; i++) {
  const height = yValues[i] / 6; // Normalize
  colors[i * 3] = height;        // R
  colors[i * 3 + 1] = 0.3;       // G
  colors[i * 3 + 2] = 1 - height; // B
}

chart.addSeries({
  type: 'column',
  xValues,
  zValues,
  yValues,
  colors,
});
```

## Column Sizing

```typescript
chart.addSeries({
  type: 'column',
  columnWidth: 0.8,  // X dimension
  columnDepth: 0.8,  // Z dimension
  // ...
});
```

## Animated Updates

```typescript
function animate() {
  for (let i = 0; i < count; i++) {
    yValues[i] = Math.abs(Math.sin(Date.now() / 500 + i)) * 5 + 0.5;
  }
  chart.updateSeries('bars', { yValues });
  requestAnimationFrame(animate);
}

animate();
```

## Grouped Columns

```typescript
// Create groups with different colors
const groups = 3;
const itemsPerGroup = 4;

for (let g = 0; g < groups; g++) {
  const groupX = new Float32Array(itemsPerGroup);
  const groupZ = new Float32Array(itemsPerGroup);
  const groupY = new Float32Array(itemsPerGroup);
  const groupColors = new Float32Array(itemsPerGroup * 3);
  
  for (let i = 0; i < itemsPerGroup; i++) {
    groupX[i] = g * 3 + 0.5;
    groupZ[i] = i * 1.5;
    groupY[i] = Math.random() * 5 + 1;
    
    // Group color
    groupColors[i * 3] = g === 0 ? 1 : 0.2;
    groupColors[i * 3 + 1] = g === 1 ? 1 : 0.2;
    groupColors[i * 3 + 2] = g === 2 ? 1 : 0.2;
  }
  
  chart.addSeries({
    type: 'column',
    id: `group-${g}`,
    xValues: groupX,
    zValues: groupZ,
    yValues: groupY,
    colors: groupColors,
  });
}
```

## API Reference

See [Column3D API](/api/3d/column)
