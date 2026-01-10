# Responsive Design

SciChart Engine automatically adjusts its layout, font sizes, and interaction targets based on the container size and device type.

## Automatic Scaling

The chart uses a breakpoint-based system to scale various visual elements:

| Breakpoint | Width | Font Scale | Axis Thickness | Legend |
|------------|-------|------------|----------------|--------|
| **Desktop** | > 768px | 1.0 | 1.0 | Visible |
| **Tablet** | 481px - 768px | 0.9 | 1.1 | Visible |
| **Mobile** | 361px - 480px | 0.8 | 1.3 | Hidden |
| **Small Mobile** | ≤ 360px | 0.7 | 1.5 | Hidden |

### Visual Elements Updated

When a breakpoint triggers, the following elements are updated:
- **Font Sizes**: Axis labels, titles, legend text, and tooltips are scaled.
- **Axis Lines**: The `lineWidth` of axes is increased on smaller screens for better visibility.
- **Tick Density**: The number of grid lines (ticks) is reduced to avoid clutter.
- **Point/Line Sizes**: Series points and lines are slightly enlarged for better visibility on high-DPI mobile screens.
- **Hit Areas**: Point selection and tooltip hit areas are enlarged on touch devices (auto-detected).

## Configuration

Responsive behavior is enabled by default. You can configure it when creating a chart:

```typescript
const chart = createChart({
  container,
  responsive: {
    enabled: true,
    resizeDebounce: 100, // Debounce time in ms
    touchOptimized: 'auto', // Auto-detect touch devices
  }
})
```

### Custom Breakpoints

You can override the default breakpoints:

```typescript
const chart = createChart({
  container,
  responsive: {
    breakpoints: {
      mobile: {
        maxWidth: 500,
        fontScale: 0.75,
        lineScale: 1.4,
        showLegend: false
      }
    }
  }
})
```

## Programmatic Control

### Get Current State

```typescript
const state = chart.getResponsiveState();

console.log(`Current Breakpoint: ${state.breakpoint}`);
console.log(`Is Touch Optimized: ${state.touchOptimized}`);
```

### Configure at Runtime

```typescript
chart.configureResponsive({
  enabled: false // Disable automatic scaling
});
```

## Best Practices for Mobile

1. **Hide the Legend**: On screens below 480px, the legend is hidden by default to maximize the plot area.
2. **Reduced Ticks**: Small screens use fewer tick marks (4-5) to prevent label overlap.
3. **Thicker Axes**: We use 1.5x thicker axes on tiny screens (≤ 360px) to maintain visual hierarchy.
4. **Touch Targets**: Point selection hit radius is automatically increased by 20% on touch devices.
