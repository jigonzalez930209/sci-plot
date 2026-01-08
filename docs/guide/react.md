# React Integration Guide

Learn how to use SciChart Engine seamlessly within React applications.

## Official Components

The engine provides a React-first experience through two main paths: the `<SciChart />` component for declarative usage, and the `useSciChart` hook for imperative control.

### 1. Declarative Component

The simplest way to add a chart to your React app.

```tsx
import { SciChart } from 'scichart-engine/react'

function App() {
  const data = {
    x: new Float32Array([0, 1, 2, 3]),
    y: new Float32Array([10, 20, 15, 25])
  }

  return (
    <div style={{ width: '800px', height: '400px' }}>
      <SciChart
        series={[{
          id: 'sensor-data',
          type: 'line',
          data,
          style: { color: '#00f2ff' }
        }]}
        xAxis={{ label: 'Time (s)', auto: true }}
        yAxis={{ label: 'Value (V)', auto: true }}
        theme="midnight"
      />
    </div>
  )
}
```

### 2. Imperative Hook

Use `useSciChart` when you need full access to the low-level `Chart` instance (e.g., for specialized analysis, dynamic series management, or custom plugins).

```tsx
import { useSciChart } from 'scichart-engine/react'
import { useEffect } from 'react'

function CustomChart() {
  const { ref, chart } = useSciChart({
    theme: 'midnight',
    xAxis: { label: 'Frequency' }
  })

  useEffect(() => {
    if (!chart) return
    
    // Low-level imperative access
    const series = chart.addSeries({
      id: 'spectrum',
      type: 'area',
      data: { x: freqX, y: powerY }
    })
    
    return () => chart.removeSeries('spectrum')
  }, [chart])

  return <div ref={ref} style={{ height: '400px' }} />
}
```

## State Management Strategies

### Local Data Updates
When updating data in real-time, avoid putting massive TypedArrays into React state. Instead, use a `ref` or update the chart directly.

```tsx
const dataRef = useRef({ x: new Float32Array(0), y: new Float32Array(0) })

// In your data processing loop
const update = () => {
  // ... process data
  chart.updateSeries('live', { x: newX, y: newY, append: true })
}
```

### Dynamic Styling
You can use standard React state to control chart appearance.

```tsx
const [theme, setTheme] = useState('midnight')

return (
  <>
    <button onClick={() => setTheme('light')}>Light Mode</button>
    <SciChart theme={theme} ... />
  </>
)
```

## Performance Tips for React

1. **Keep Containers Small**: Ensure the parent element of `<SciChart />` has a fixed or relative size.
2. **Memoize Large Data**: Use `useMemo` for large static datasets to avoid unnecessary prop diffing.
3. **Clean Up**: Always call `chart.destroy()` if you are creating charts manually. The official components handle this for you automatically.

## Next Steps

- Explore the [React API Reference](/api/react-scichart)
- See the [React Hook Reference](/api/react-hook)
- View the [React Integration Example](/examples/react)
