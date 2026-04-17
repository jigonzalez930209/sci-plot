---
title: Offscreen Rendering
description: Decouple rendering from the UI thread for ultimate responsiveness.
---

# Offscreen Rendering

In browsers, the main JavaScript thread handles both user interaction and rendering. When a chart is extremely complex, frames may drop during interaction. **Offscreen Rendering** solves this by moving all WebGL work to a dedicated Worker thread.

## Interaction Stability Demo

Even with high-frequency updates, the UI remains perfectly responsive.

<div class="premium-demo-container">
  <OffscreenDemo />
</div>

## Performance Benefits

1. **Jank-Free Interaction**: Zooming and panning never stutter, regardless of background calculations.
2. **Parallel Processing**: Use multi-core CPUs efficiently by running multiple charts in multiple Workers.
3. **Resource Isolation**: Browser UI and Chart rendering never compete for CPU cycles.

## Implementation

```typescript
import { createChart, PluginOffscreen } from 'sci-plot';

const chart = createChart({ container });

// Initialize the plugin with workers
await chart.use(PluginOffscreen({
  enabled: true,
  workerPool: 1 // Number of workers to spawn
}));

// The chart API remains identical to main-thread rendering
chart.addSeries({ ... });
```

## How it Works

The plugin serializes drawing commands and data updates into a internal buffer, which is then transferred to the Worker using **Transferable Objects**. The Worker renders directly to an `OffscreenCanvas`, which displays on the main page without any UI-to-GPU overhead.

## Requirements

The Offscreen plugin automatically detects browser support. If the environment doesn't support `OffscreenCanvas`, it gracefully falls back to synchronous main-thread rendering.

- **Chrome**: ✅ Full support
- **Firefox**: ✅ Supported (v105+)
- **Safari**: ✅ Supported (v16.4+)

<style>
.premium-demo-container {
  margin: 2rem 0;
  border-radius: 16px;
  overflow: hidden;
  background: #09090b;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
