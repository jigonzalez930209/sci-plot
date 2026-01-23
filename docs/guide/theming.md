# Theming

Customize the look and feel of your charts with themes.

<script setup>
import { ref } from 'vue'
</script>

## Interactive Demo

This chart automatically syncs with the documentation theme. Toggle dark/light mode to see it change!

<ChartDemo type="basic" height="350px" :points="20000" />

## Built-in Themes

SciChart Engine includes four pre-built themes:

| Theme | Description | Best For |
|-------|-------------|----------|
| `dark` | High contrast dark theme | General use |
| `light` | Clean light theme | Print, presentations |
| `midnight` | Deep blue dark theme | Extended viewing |
| `electrochemistry` | Scientific blue theme | Lab applications |

### Using Themes

```typescript
import { createChart } from 'scichart-engine'

// Use theme by name
const chart = createChart({
  container,
  theme: 'midnight',
})
```

### Theme Objects

```typescript
import { DARK_THEME, LIGHT_THEME, MIDNIGHT_THEME } from 'scichart-engine'

const chart = createChart({
  container,
  theme: MIDNIGHT_THEME,
})
```

## Dynamic Theme Switching

To change theme at runtime, recreate the chart:

```typescript
function setTheme(themeName) {
  // Save current state
  const seriesData = chart.getAllSeries().map(s => ({
    id: s.getId(),
    type: s.getType(),
    data: s.getData(),
    style: s.getStyle(),
  }))
  const bounds = chart.getViewBounds()
  
  // Destroy old chart
  chart.destroy()
  
  // Create new chart with new theme
  chart = createChart({
    container,
    theme: themeName,
  })
  
  // Restore series
  seriesData.forEach(s => chart.addSeries(s))
  
  // Restore view
  chart.zoom({ 
    x: [bounds.xMin, bounds.xMax], 
    y: [bounds.yMin, bounds.yMax] 
  })
}
```

## Custom Themes

Create your own theme with `createTheme`:

```typescript
import { createTheme } from 'scichart-engine'

const myTheme = createTheme({
  name: 'my-custom-theme',
  backgroundColor: '#1e1e2e',
  
  grid: {
    color: 'rgba(255,255,255,0.08)',
    width: 1,
  },
  
  axis: {
    color: '#6c7086',
    labelColor: '#cdd6f4',
    tickColor: '#6c7086',
    labelFont: '12px Inter, sans-serif',
  },
  
  legend: {
    visible: true,
    backgroundColor: 'rgba(30,30,46,0.2)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
    textColor: '#cdd6f4',
    font: '12px Inter, sans-serif',
  },
  
  cursor: {
    lineColor: '#89b4fa',
    lineWidth: 1,
    tooltipBackground: 'rgba(30,30,46,0.95)',
    tooltipBorder: '#45475a',
    tooltipTextColor: '#cdd6f4',
    tooltipFont: '12px monospace',
  },
  
  toolbar: {
    backgroundColor: 'rgba(30,30,46,0.2)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
  },
})

const chart = createChart({
  container,
  theme: myTheme,
})
```

## Extending Themes

Base your theme on an existing one:

```typescript
import { DARK_THEME, createTheme } from 'scichart-engine'

const customDark = createTheme({
  ...DARK_THEME,
  name: 'custom-dark',
  backgroundColor: '#0a0a0f',
  grid: {
    ...DARK_THEME.grid,
    color: 'rgba(100,100,255,0.1)',
  },
})
```

## Theme Structure

```typescript
interface ChartTheme {
  name: string
  backgroundColor: string
  plotAreaBackground: string
  plotBorderColor: string
  
  grid: {
    visible: boolean
    majorColor: string
    minorColor: string
    majorWidth: number
    minorWidth: number
    majorDash: number[]
    minorDash: number[]
    showMinor: boolean
    minorDivisions: number
  }
  
  xAxis: AxisTheme
  yAxis: AxisTheme
  
  legend: {
    visible: boolean
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right"
    backgroundColor: string
    borderColor: string
    borderRadius: number
    textColor: string
    fontSize: number
    fontFamily: string
    padding: number
    itemGap: number
    swatchSize: number
  }
  
  cursor: {
    lineColor: string
    lineWidth: number
    lineDash: number[]
    tooltipBackground: string
    tooltipBorder: string
    tooltipColor: string
    tooltipSize: number
  }
  
  toolbar: {
    backgroundColor: string
    borderColor: string
    borderRadius: number
  }
}
```

## CSS Variables Integration

Read colors from your app's CSS variables:

```typescript
const getCSSVar = (name) => 
  getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()

const cssTheme = createTheme({
  name: 'css-vars',
  backgroundColor: getCSSVar('--bg-primary'),
  axis: {
    color: getCSSVar('--text-secondary'),
    labelColor: getCSSVar('--text-primary'),
    tickColor: getCSSVar('--border-color'),
    labelFont: `12px ${getCSSVar('--font-family')}`,
  },
  // ...
})
```

## Popular Theme Presets

### Catppuccin Mocha

```typescript
const catppuccin = createTheme({
  name: 'catppuccin-mocha',
  backgroundColor: '#1e1e2e',
  grid: { color: 'rgba(147,153,178,0.1)', width: 1 },
  axis: {
    color: '#6c7086',
    labelColor: '#cdd6f4',
    tickColor: '#6c7086',
    labelFont: '12px sans-serif',
  },
  // ...
})
```

### GitHub Dark

```typescript
const githubDark = createTheme({
  name: 'github-dark',
  backgroundColor: '#0d1117',
  grid: { color: 'rgba(48,54,61,0.5)', width: 1 },
  axis: {
    color: '#484f58',
    labelColor: '#c9d1d9',
    tickColor: '#30363d',
    labelFont: '12px -apple-system, sans-serif',
  },
  // ...
})
```

### Nord

```typescript
const nord = createTheme({
  name: 'nord',
  backgroundColor: '#2e3440',
  grid: { color: 'rgba(76,86,106,0.3)', width: 1 },
  axis: {
    color: '#4c566a',
    labelColor: '#eceff4',
    tickColor: '#4c566a',
    labelFont: '12px sans-serif',
  },
  // ...
})
```

## Series Colors

Series colors are independent of the theme:

```typescript
chart.addSeries({
  id: 'data',
  data: { x, y },
  style: { 
    color: '#ff6b6b',  // This color stays the same regardless of theme
    width: 2 
  },
})
```

To make series colors theme-aware:

```typescript
const seriesColors = {
  dark: '#00f2ff',
  light: '#0066cc',
}

chart.addSeries({
  id: 'data',
  data: { x, y },
  style: { 
    color: seriesColors[currentTheme],
    width: 2 
  },
})
```

## Color Schemes

For multi-series charts, SciChart Engine provides **5 professional color schemes** with 20 distinct colors each, plus a unique highlight color for hover states.

### Available Schemes

| Scheme | Colors | Highlight | Best For |
|--------|--------|-----------|----------|
| `vibrant` | High saturation, energetic | White | Dark themes, dashboards |
| `pastel` | Soft, muted tones | Black | Light themes, reports |
| `neon` | Electric, fluorescent | White | Modern UIs, gaming |
| `earth` | Natural, organic | Black | Environmental data |
| `ocean` | Blue, aquatic tones | Gold | Marine/water data |

### Using Color Schemes

Color schemes automatically assign colors to series that don't have explicit colors:

```typescript
const chart = createChart({
  container,
  theme: 'dark',
  colorScheme: 'vibrant',  // Auto-assign colors from scheme
  showLegend: true
})

// Add series without colors - auto-assigned from scheme
chart.addSeries({ id: 's1', type: 'line', data: { x, y } })  // Gets color #1
chart.addSeries({ id: 's2', type: 'line', data: { x, y } })  // Gets color #2
chart.addSeries({ id: 's3', type: 'line', data: { x, y } })  // Gets color #3
```

### Changing Schemes

```typescript
// Change at runtime
chart.setColorScheme('ocean')

// Get current scheme
const scheme = chart.getColorScheme()
console.log(scheme.name)  // 'ocean'
console.log(scheme.colors.length)  // 20
console.log(scheme.highlightColor)  // '#FFD700' (gold)
```

### Custom Color Schemes

```typescript
import { type ColorScheme } from 'scichart-engine'

const customScheme: ColorScheme = {
  name: 'my-scheme',
  colors: [
    '#FF0000', '#00FF00', '#0000FF',
    // ... 17 more colors (20 total)
  ],
  highlightColor: '#FFFF00',  // Must be distinct from the 20 colors
  isDark: true
}

chart.setColorScheme(customScheme)
```

### Auto-Selection

If no color scheme is specified, one is automatically selected based on the theme:
- **Dark themes** → `vibrant` scheme
- **Light themes** → `pastel` scheme

```typescript
const chart = createChart({
  container,
  theme: 'dark'  // Auto-selects 'vibrant' scheme
})
```

### Explicit Colors Override

Series with explicit colors ignore the color scheme:

```typescript
chart.addSeries({
  id: 's1',
  type: 'line',
  data: { x, y },
  style: { color: '#FF00FF' }  // Uses this, not from scheme
})
```

### Color Cycling

For charts with 20+ series, colors cycle through the palette:

```typescript
// Series 0-19 get colors[0-19]
// Series 20 gets colors[0], series 21 gets colors[1], etc.
for (let i = 0; i < 25; i++) {
  chart.addSeries({
    id: `series${i}`,
    type: 'line',
    data: generateData(i)
    // Colors auto-assigned and cycle
  })
}
```

## Layout vs Theme

Beyond visual styling (colors, fonts, etc.), SciChart Engine provides a separate **layout system** for controlling component positioning and behavior.

| Concern | Use Theme | Use Layout |
|---------|-----------|------------|
| Colors, fonts, gradients | ✅ | ❌ |
| Grid styling | ✅ | ❌ |
| Component positions | ❌ | ✅ |
| Legend hover behavior | ❌ | ✅ |
| Margins & padding | ❌ | ✅ |
| Axis spacing | ❌ | ✅ |

```typescript
const chart = createChart({
  theme: 'midnight',  // Visual styling
  layout: {           // Positioning & behavior
    legend: { highlightOnHover: false },
    crosshair: { valueDisplayMode: 'corner' },
    margins: { top: 40, left: 80 },
  },
})
```

See [Layout & Positioning](/guide/layout) for complete details.

