# Responsive Design

Automatic responsive design for charts that adapts to container size and device capabilities.

## Interactive Demo
<ChartDemo type="responsive" height="300px" />

## Overview

The Responsive Design system provides:
- **Automatic font scaling** based on container size
- **Tick density adjustment** for different screen sizes
- **Touch optimization** for mobile/tablet devices
- **Reduced motion** support for accessibility
- **Breakpoint-based** configuration

## Quick Start

```typescript
import { createChart } from 'scichart-engine';

// Responsive is enabled by default
const chart = createChart({
  container: document.getElementById('chart')!,
  responsive: true, // Optional, default is true
});

// Or with custom configuration
const chart = createChart({
  container: document.getElementById('chart')!,
  responsive: {
    enabled: true,
    touchOptimized: 'auto',
    reducedMotion: 'auto',
    breakpoints: {
      mobile: { maxWidth: 480, fontScale: 0.8 },
      tablet: { maxWidth: 768, fontScale: 0.9 },
      desktop: { fontScale: 1.0 },
    },
  },
});
```

## Configuration Options

### ResponsiveConfig

```typescript
interface ResponsiveConfig {
  /** Enable responsive behavior (default: true) */
  enabled?: boolean;
  
  /** Custom breakpoints (overrides presets) */
  breakpoints?: {
    mobile?: ResponsiveBreakpoint;
    tablet?: ResponsiveBreakpoint;
    desktop?: ResponsiveBreakpoint;
  };
  
  /** Optimize for touch interactions (default: 'auto') */
  touchOptimized?: boolean | 'auto';
  
  /** Respect user's reduced motion preference (default: 'auto') */
  reducedMotion?: boolean | 'auto';
  
  /** Debounce time for resize events in ms (default: 100) */
  resizeDebounce?: number;
}
```

### Breakpoint Configuration

Each breakpoint can configure:

```typescript
interface ResponsiveBreakpoint {
  /** Maximum width for this breakpoint */
  maxWidth?: number;
  
  /** Minimum width for this breakpoint */
  minWidth?: number;
  
  /** Font size multiplier (default: 1) */
  fontScale?: number;
  
  /** Number of X-axis ticks */
  xTickCount?: number;
  
  /** Number of Y-axis ticks */
  yTickCount?: number;
  
  /** Point size multiplier */
  pointScale?: number;
  
  /** Line width multiplier */
  lineScale?: number;
  
  /** Hit radius multiplier for touch targets */
  hitRadiusScale?: number;
  
  /** Whether to show legend */
  showLegend?: boolean;
  
  /** Legend position override */
  legendPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}
```

## Default Breakpoints

| Breakpoint | Width Range | Font Scale | Ticks (X/Y) | Point/Line Scale |
|------------|-------------|------------|-------------|------------------|
| Mobile     | ≤480px      | 0.8        | 5/4         | 1.2              |
| Tablet     | 481-768px   | 0.9        | 7/5         | 1.1              |
| Desktop    | ≥769px      | 1.0        | 10/6        | 1.0              |

## API Methods

### Get Responsive State

```typescript
const state = chart.getResponsiveState();
console.log(state.breakpoint); // 'mobile' | 'tablet' | 'desktop'
console.log(state.touchOptimized); // boolean
console.log(state.reducedMotion); // boolean
console.log(state.scales); // { font, point, line, hitRadius }
console.log(state.ticks); // { x, y }
```

### Configure at Runtime

```typescript
chart.configureResponsive({
  breakpoints: {
    mobile: {
      fontScale: 0.7,
      showLegend: false,
    },
  },
});
```

### Check Status

```typescript
if (chart.isResponsiveEnabled()) {
  console.log('Responsive mode is active');
}
```

## Touch Optimization

When `touchOptimized` is enabled (or auto-detected):
- Hit areas are enlarged (1.5x) for easier tapping
- Point sizes are increased for visibility
- Selection targets are expanded

Detection uses:
- `ontouchstart` support
- `navigator.maxTouchPoints`
- `(pointer: coarse)` media query

```typescript
const chart = createChart({
  container,
  responsive: {
    touchOptimized: 'auto', // Auto-detect (default)
    // or: true / false for explicit control
  },
});
```

## Reduced Motion

The system respects the user's motion preferences:

```typescript
const chart = createChart({
  container,
  responsive: {
    reducedMotion: 'auto', // Detect from system preference
  },
});
```

When reduced motion is enabled:
- Animations are skipped or minimized
- Transitions are instant
- No automatic scrolling effects

## Responsive Events

Listen for responsive changes:

```typescript
chart.on('resize', (e) => {
  console.log('New size:', e.width, 'x', e.height);
});
```

## Example: Custom Mobile Layout

```typescript
const chart = createChart({
  container,
  responsive: {
    breakpoints: {
      mobile: {
        maxWidth: 480,
        fontScale: 0.75,
        xTickCount: 4,
        yTickCount: 3,
        pointScale: 1.5,
        hitRadiusScale: 2.0,
        showLegend: false,
      },
      tablet: {
        minWidth: 481,
        maxWidth: 1024,
        fontScale: 0.85,
        xTickCount: 6,
        yTickCount: 5,
        showLegend: true,
        legendPosition: 'bottom-right',
      },
      desktop: {
        minWidth: 1025,
        fontScale: 1.0,
        xTickCount: 12,
        yTickCount: 8,
        showLegend: true,
        legendPosition: 'top-right',
      },
    },
  },
});
```

## Example: Embed Mode

Optimized settings for embedded charts:

```typescript
const chart = createChart({
  container,
  showControls: false,
  showLegend: false,
  responsive: {
    breakpoints: {
      mobile: { fontScale: 0.7, xTickCount: 3, yTickCount: 3 },
      tablet: { fontScale: 0.8, xTickCount: 5, yTickCount: 4 },
      desktop: { fontScale: 0.9, xTickCount: 7, yTickCount: 5 },
    },
  },
});
```

## Performance

- Uses `ResizeObserver` for efficient size detection
- Debounced resize handling (configurable, default 100ms)
- Minimal re-renders on size changes
- Automatic cleanup on chart destruction
