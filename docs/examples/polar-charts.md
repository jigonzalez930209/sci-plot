---
title: Polar Charts Demo
description: Interactive examples of polar coordinate visualization
---

<script setup>
import PolarChartDemo from '../.vitepress/theme/demos/PolarChartDemo.vue'
</script>

# Polar Charts Demo

Polar charts visualize data in polar coordinates (r, θ), perfect for circular patterns, directional data, and cyclic phenomena.

<PolarChartDemo />

## What are Polar Charts?

Polar charts represent data points using:
- **r (radius)**: Distance from the origin
- **θ (theta)**: Angle from the reference direction

This coordinate system is ideal for:
- Circular or radial patterns
- Directional data (wind, compass)
- Cyclic phenomena (voltammetry)
- Multi-dimensional comparisons (radar charts)

## Pattern Examples

### 🌬️ Wind Rose
Displays wind direction and speed distribution. Each spoke represents a compass direction, and the radius shows wind speed frequency.

**Use Cases:**
- Meteorology and climate analysis
- Airport runway planning
- Wind energy site assessment

### 📊 Radar Chart
Compares multiple variables on different axes radiating from a central point. Perfect for performance metrics and multi-dimensional data.

**Use Cases:**
- Performance dashboards
- Skills assessment
- Product comparisons

### 🌀 Spiral
Archimedean spiral where radius increases linearly with angle. Creates elegant mathematical patterns.

**Use Cases:**
- Mathematical visualization
- Growth patterns
- Decorative elements

### 🌸 Flower Pattern
Rose curve (r = a + b·cos(kθ)) creates petal-like shapes. The number of petals depends on the frequency parameter.

**Use Cases:**
- Mathematical art
- Pattern design
- Harmonic analysis

### ⚡ Cyclic Voltammetry
Simulates electrochemical measurements showing oxidation-reduction peaks. Critical for battery and sensor research.

**Use Cases:**
- Electrochemistry
- Battery research
- Sensor development

## Basic Implementation

```typescript
import { createChart } from 'sci-plot';

const chart = createChart({
  container: document.getElementById('chart')
});

// Simple polar data
const data = {
  r: new Float32Array([1, 2, 3, 2.5, 1.5]),
  theta: new Float32Array([0, 72, 144, 216, 288])
};

chart.addSeries({
  id: 'polar1',
  type: 'polar',
  data,
  style: {
    color: '#00f2ff',
    width: 2,
    fill: true,
    closePath: true
  }
});
```

## Styling Options

### Fill vs Line

```typescript
// Filled area
{
  fill: true,
  fillOpacity: 0.3,
  closePath: true
}

// Line only
{
  fill: false,
  width: 2
}
```

### Angle Modes

```typescript
// Degrees (0-360)
{
  angleMode: 'degrees',
  theta: [0, 90, 180, 270]
}

// Radians (0-2π)
{
  angleMode: 'radians',
  theta: [0, Math.PI/2, Math.PI, 3*Math.PI/2]
}
```

### Grid Customization

```typescript
{
  angularDivisions: 12,  // 30° intervals
  radialDivisions: 5,    // 5 concentric circles
  showRadialGrid: true,
  showAngularGrid: true
}
```

## Advanced Examples

### Multi-Series Comparison

```typescript
// Compare two datasets
const dataset1 = {
  r: new Float32Array([8, 7, 9, 6, 8, 7]),
  theta: new Float32Array([0, 60, 120, 180, 240, 300])
};

const dataset2 = {
  r: new Float32Array([6, 9, 7, 8, 6, 9]),
  theta: new Float32Array([0, 60, 120, 180, 240, 300])
};

chart.addSeries({
  id: 'series1',
  type: 'polar',
  name: 'Product A',
  data: dataset1,
  style: {
    color: '#00f2ff',
    fill: true,
    fillOpacity: 0.2,
    closePath: true
  }
});

chart.addSeries({
  id: 'series2',
  type: 'polar',
  name: 'Product B',
  data: dataset2,
  style: {
    color: '#ff6b6b',
    fill: true,
    fillOpacity: 0.2,
    closePath: true
  }
});
```

### Animated Spiral

```typescript
function animateSpiral() {
  let frame = 0;
  
  setInterval(() => {
    const points = 200;
    const r = new Float32Array(points);
    const theta = new Float32Array(points);
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 720 + frame;
      theta[i] = angle;
      r[i] = (angle / 360) * 5;
    }
    
    chart.updateSeries('spiral', { r, theta });
    frame = (frame + 2) % 360;
  }, 50);
}
```

### Real-Time Wind Data

```typescript
async function updateWindData() {
  const response = await fetch('/api/wind-data');
  const windData = await response.json();
  
  // Convert wind data to polar coordinates
  const r = new Float32Array(windData.speeds);
  const theta = new Float32Array(windData.directions);
  
  chart.updateSeries('wind', { r, theta });
}

// Update every 5 seconds
setInterval(updateWindData, 5000);
```

## Performance Tips

1. **Use Typed Arrays**: Float32Array is faster than regular arrays
2. **Limit Points**: Keep under 1000 points for smooth rendering
3. **Disable Fill**: Line-only mode is faster
4. **Reduce Grid**: Fewer divisions = better performance

## Browser Compatibility

Polar charts work in all modern browsers:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers

## See Also

- [Polar Charts API](/api/polar-charts) - Complete API reference
- [Series Types](/api/series) - Other chart types
- [Styling Guide](/api/themes) - Customization options
