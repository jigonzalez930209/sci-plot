---
title: Animations API
description: Configure smooth, high-performance animations for zoom, pan, auto-scale, and custom chart transitions with easing functions.
---

# Animations

SciChart Engine includes a powerful animation system for smooth visual transitions during zoom, pan, and auto-scale operations.

## Enabling Animations

Animations are **enabled by default**. You can configure them when creating a chart:

```typescript
import { createChart } from 'scichart-engine';

// Animations enabled by default
const chart = createChart({
  container: document.getElementById('chart'),
  animations: true, // or false to disable all
});

// Custom animation configuration
const chart = createChart({
  container: document.getElementById('chart'),
  animations: {
    enabled: true,
    zoom: { enabled: true, duration: 200, easing: 'easeOutCubic' },
    pan: { enabled: false, duration: 100, easing: 'easeOut' },
    autoScale: { enabled: true, duration: 300, easing: 'easeOutCubic' },
    seriesEntry: { enabled: true, duration: 400, easing: 'easeOutCubic' },
  },
});
```

## Animate To Specific Bounds

Use `animateTo()` to smoothly transition to specific axis ranges:

```typescript
// Animate to specific view
chart.animateTo({
  xRange: [0, 100],
  yRange: [-5, 5],
  duration: 500, // Optional, in ms
  easing: 'easeOutCubic', // Optional
});
```

## Available Easing Functions

| Name | Description | Best For |
|------|-------------|----------|
| `linear` | Constant speed | Progress indicators |
| `easeIn` | Starts slow, accelerates | Exit animations |
| `easeOut` | Starts fast, decelerates | Entry animations |
| `easeInOut` | Slow start and end | Content transitions |
| `easeOutCubic` | Smoother deceleration | **Default, recommended** |
| `easeInOutCubic` | Very smooth both ends | Modal transitions |
| `spring` | Bounce at the end | Playful UIs |
| `elastic` | Overshoot and settle | Attention-grabbing |
| `bounce` | Bouncing ball effect | Fun animations |

## Runtime Configuration

Modify animation settings at runtime:

```typescript
// Get current config
const config = chart.getAnimationConfig();
console.log(config.zoom.duration); // 200

// Update config
chart.setAnimationConfig({
  zoom: { duration: 400 },
});

// Disable all animations
chart.setAnimationConfig({ enabled: false });
```

## Check Animation State

```typescript
// Check if any animation is running
if (chart.isAnimating()) {
  console.log('Animation in progress...');
}
```

## Disable for Specific Operations

Pass `animate: false` to individual operations:

```typescript
// Immediate zoom (no animation)
chart.zoom({
  x: [0, 100],
  y: [-5, 5],
  animate: false,
});

// Immediate auto-scale
chart.autoScale(false);
```

## Using the Animation Engine Directly

For custom animations, use the `AnimationEngine` class:

```typescript
import { AnimationEngine, easings } from 'scichart-engine';

const engine = new AnimationEngine();

// Animate a value from 0 to 100
const handle = engine.interpolate(0, 100, {
  duration: 500,
  easing: 'easeOutCubic',
  onUpdate: (value) => {
    console.log('Current value:', value);
  },
  onComplete: () => {
    console.log('Done!');
  },
});

// Cancel if needed
handle.cancel();

// Or wait for completion
await handle.promise;
```

## Performance Considerations

- Animations use `requestAnimationFrame` for optimal performance
- During animations, only necessary render passes are triggered
- Cancel animations before starting new ones to avoid conflicts
- Disable animations for high-frequency data updates

## Default Configuration

```typescript
import { DEFAULT_ANIMATION_CONFIG } from 'scichart-engine';

console.log(DEFAULT_ANIMATION_CONFIG);
// {
//   enabled: true,
//   zoom: { enabled: true, duration: 200, easing: 'easeOutCubic' },
//   pan: { enabled: false, duration: 100, easing: 'easeOut' },
//   dataUpdate: { enabled: true, duration: 150, easing: 'easeOut' },
//   seriesEntry: { enabled: true, duration: 400, easing: 'easeOutCubic' },
//   autoScale: { enabled: true, duration: 300, easing: 'easeOutCubic' },
// }
```
