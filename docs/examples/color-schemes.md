---
title: Color Schemes & Legend Hover
description: Multi-series charts with automatic color assignment and interactive legend
---

<script setup>
import { ref } from 'vue'
</script>

# Color Schemes & Legend Hover

Demonstrates the 5 professional color schemes with 20 colors each, and the bring-to-front legend hover feature.

<ChartDemo type="multi" height="400px" :series="20" />

## Features

- **5 Color Schemes**: Vibrant, Pastel, Neon, Earth, Ocean
- **20 Colors Each**: Distinct colors that cycle for 21+ series
- **Highlight Color**: Unique color for hover states (different from the 20)
- **Bring-to-Front**: Hover over legend → series comes to front
- **Auto-Assignment**: Series without colors get scheme colors automatically

## Basic Usage

```typescript
import { createChart } from 'sci-plot'

const chart = createChart({
  container: document.getElementById('chart'),
  theme: 'dark',
  colorScheme: 'vibrant',  // Choose from 5 schemes
  showLegend: true
})

// Add series without colors - auto-assigned from scheme
for (let i = 0; i < 20; i++) {
  chart.addSeries({
    id: `series${i}`,
    name: `Dataset ${i + 1}`,
    type: 'line',
    data: generateData(i)
    // No color specified - uses scheme automatically
  })
}
```

## Color Schemes

### Vibrant (Dark Themes)

High saturation colors for dark backgrounds.

```typescript
chart.setColorScheme('vibrant')
```

**Colors**: Coral Red, Turquoise, Golden Yellow, Mint, Salmon, Lavender...  
**Highlight**: White (`#FFFFFF`)

### Pastel (Light Themes)

Soft, muted colors for light backgrounds.

```typescript
chart.setColorScheme('pastel')
```

**Colors**: Light Coral, Melon, Apricot, Tea Green, Magic Mint...  
**Highlight**: Near Black (`#1A1A1A`)

### Neon (Dark Themes)

Electric, fluorescent colors.

```typescript
chart.setColorScheme('neon')
```

**Colors**: Neon Green, Neon Red, Neon Cyan, Neon Magenta...  
**Highlight**: White (`#FFFFFF`)

### Earth (Light Themes)

Natural, organic tones.

```typescript
chart.setColorScheme('earth')
```

**Colors**: Saddle Brown, Sienna, Peru, Burlywood, Chocolate...  
**Highlight**: Black (`#000000`)

### Ocean (Dark Themes)

Blue and aquatic tones.

```typescript
chart.setColorScheme('ocean')
```

**Colors**: Sea Blue, Ocean Blue, Turquoise, Jade, Cadet Blue...  
**Highlight**: Gold (`#FFD700`)

## Legend Interaction

### Bring-to-Front on Hover

When you hover over a series in the legend:

1. **Series renders on top** of all others
2. **Color changes** to the highlight color from the scheme
3. **Returns to normal** when you move away

```typescript
const chart = createChart({
  container,
  showLegend: true,
  colorScheme: 'ocean'  // Highlight color = Gold
})

// Add many series
for (let i = 0; i < 15; i++) {
  chart.addSeries({
    id: `s${i}`,
    type: 'line',
    data: generateData(i)
  })
}

// Now hover over any series name in the legend
// → It comes to front and turns gold!
```

### Toggle Visibility

Click on a series name to show/hide it:

```typescript
// Click legend item → toggles series visibility
// The legend automatically updates opacity and color
```

## Dynamic Scheme Switching

Change schemes at runtime:

```typescript
// Create chart with initial scheme
const chart = createChart({
  container,
  colorScheme: 'vibrant'
})

// Add series
chart.addSeries({ id: 's1', type: 'line', data: { x, y } })
chart.addSeries({ id: 's2', type: 'line', data: { x, y } })

// Switch to different scheme
chart.setColorScheme('ocean')

// Series colors won't change (they were already assigned)
// But new series will use new scheme colors
chart.addSeries({ id: 's3', type: 'line', data: { x, y } })  // Ocean colors
```

## Custom Color Scheme

Create your own scheme:

```typescript
import { type ColorScheme } from 'sci-plot'

const customScheme: ColorScheme = {
  name: 'corporate',
  colors: [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#A2D5F2',
    '#FFD1DC', '#C5E1A5', '#FFCCBC', '#B0BEC5', '#D1C4E9',
    '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA'
  ],
  highlightColor: '#FFD700',  // Gold for hover
  isDark: true
}

chart.setColorScheme(customScheme)
```

## Best Practices

### 1. Match Scheme to Theme

```typescript
// Dark themes
createChart({ theme: 'dark', colorScheme: 'vibrant' })      // ✅ Good
createChart({ theme: 'midnight', colorScheme: 'neon' })    // ✅ Good
createChart({ theme: 'dark', colorScheme: 'pastel' })      // ❌ Poor contrast

// Light themes
createChart({ theme: 'light', colorScheme: 'pastel' })     // ✅ Good
createChart({ theme: 'light', colorScheme: 'earth' })      // ✅ Good
createChart({ theme: 'light', colorScheme: 'vibrant' })    // ❌ Too bright
```

### 2. Explicit Colors for Important Series

```typescript
// Important series with fixed color
chart.addSeries({
  id: 'baseline',
  type: 'line',
  data: { x, y },
  style: { color: '#FF0000' }  // Always red, regardless of scheme
})

// Other series use scheme
chart.addSeries({ id: 's1', type: 'line', data: { x, y } })
chart.addSeries({ id: 's2', type: 'line', data: { x, y } })
```

### 3. Show Legend for Multi-Series

```typescript
const chart = createChart({
  container,
  colorScheme: 'ocean',
  showLegend: true  // ✅ Essential for identifying series
})

// Add many series
for (let i = 0; i < 20; i++) {
  chart.addSeries({
    id: `s${i}`,
    name: `Sensor ${i + 1}`,  // Give meaningful names
    type: 'line',
    data: sensorData[i]
  })
}
```

## React Example

```tsx
import { SciPlot } from 'sci-plot/react'
import { useState } from 'react'

function MultiSeriesChart() {
  const [scheme, setScheme] = useState('vibrant')
  
  // Generate 15 series
  const series = Array.from({ length: 15 }, (_, i) => ({
    id: `series${i}`,
    name: `Dataset ${i + 1}`,
    x: generateX(),
    y: generateY(i)
  }))
  
  return (
    <div>
      <select value={scheme} onChange={e => setScheme(e.target.value)}>
        <option value="vibrant">Vibrant</option>
        <option value="pastel">Pastel</option>
        <option value="neon">Neon</option>
        <option value="earth">Earth</option>
        <option value="ocean">Ocean</option>
      </select>
      
      <SciPlot
        series={series}
        theme="dark"
        colorScheme={scheme}
        showLegend={true}
        height="400px"
      />
    </div>
  )
}
```

## See Also

- [Theming Guide](/guide/theming) - Full theming documentation
- [Interactions Guide](/guide/interactions) - Legend and other interactions
- [Series Guide](/guide/series) - Working with series data
