---
title: Offscreen Rendering Plugin
description: Move heavy chart rendering and data processing to background Workers to keep the UI thread responsive.
---

# Offscreen Rendering Plugin

The Offscreen plugin enables `OffscreenCanvas` support, allowing Sci Plot to perform all WebGL rendering and heavy data calculations in a separate Web Worker. This ensures that the UI remains butter-smooth and responsive even during intensive data updates or ultra-high resolution rendering.

## Features

- ✅ **UI Thread Decoupling**: Prevents long-running rendering tasks from blocking user interactions.
- ✅ **Worker Pool Support**: Distribute rendering of multiple charts across multiple CPU workers.
- ✅ **Automatic Fallback**: Gracefully falls back to main-thread rendering if `OffscreenCanvas` is not supported by the browser.
- ✅ **Seamless Integration**: Supports all standard chart operations transparently.
- ✅ **Resource Isolation**: Worker-based coordinate conversion and buffer management.

## Basic Usage

```typescript
import { createChart, PluginOffscreen } from 'velo-plot';

const chart = createChart({
  container: document.getElementById('chart')!
});

// Enable offscreen rendering
await chart.use(PluginOffscreen({
  enabled: true,
  mode: 'auto',
  workerPool: 2 // Use 2 background workers
}));

// All subsequent rendering calls will now be handled inside the Worker
chart.addSeries({ ... });
```

## API Reference

### `chart.offscreen`

```typescript
// Check connection status
if (chart.offscreen.isEnabled()) {
  console.log('Rendering in background worker!');
}

// Get performance metrics
const stats = chart.offscreen.getStats();
console.log(`Background FPS: ${1000 / stats.lastFrameTime}`);

// Force a flush of the command queue
chart.offscreen.flush();
```

## Configuration Options

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | `boolean` | `false` | Enable/disable offscreen rendering. |
| `mode` | `'auto' \| 'webgl-only'` | `'auto'` | Layer rendering mode. |
| `workerPool` | `number` | `1` | Number of background workers to spawn. |
| `transfer` | `'offscreen' \| 'bitmap'`| `'offscreen'` | Data transfer strategy. |
| `fallback` | `'main-thread' \| 'disable'` | `'main-thread'` | Action if worker fails to start. |

## Important Considerations

### Thread Safety
When using the Offscreen plugin, direct access to certain DOM-related chart internals might be limited from within the worker. Use the standard event bus and API calls for communication.

### Cross-Origin Isolation
For maximum performance with `SharedArrayBuffer`, ensure your server headers include:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

## Browser Support
Offscreen rendering requires modern browser support for `OffscreenCanvas`.
- **Chrome/Edge**: Full support.
- **Firefox**: Supported since v105.
- **Safari**: Supported since v16.4.

If unsupported, the plugin automatically reverts to main-thread rendering unless configured otherwise.
