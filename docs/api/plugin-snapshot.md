# PluginSnapshot

The `PluginSnapshot` provides high-resolution image export capabilities for SciChart Engine. It allows capturing the chart (including WebGL series and SVG/Canvas overlays) at resolutions up to 8K, suitable for scientific publications and presentations.

## Installation

```typescript
import { createChart, PluginSnapshot } from 'scichart-engine';

const chart = createChart({
  container: document.getElementById('chart'),
  // ... options
});

chart.use(PluginSnapshot({
  defaultOptions: {
    format: 'png',
    watermarkText: 'SciChart Engine'
  }
}));
```

## API Reference

The plugin exposes the `SnapshotAPI` through the chart instance.

### `takeSnapshot(options?: SnapshotOptions): Promise<string | Blob>`
Captures the current chart view.

| Option | Type | Default | Description |
|---|-|---|-|
| `format` | `'png' \| 'jpeg' \| 'webp'` | `'png'` | Output image format |
| `quality` | `number` | `0.9` | Image quality (0-1) for lossy formats |
| `resolution` | `SnapshotResolution` | `'standard'` | `'standard'`, `'2k'`, `'4k'`, `'8k'`, or scale factor |
| `includeBackground` | `boolean` | `true` | Include the chart theme background |
| `includeOverlays` | `boolean` | `true` | Include annotations, tooltips, and legends |
| `watermarkText` | `string` | `''` | Add a semi-transparent watermark to the capture |
| `transparent` | `boolean` | `false` | Export with transparent background (PNG/WebP only) |
| `download` | `boolean` | `false` | Automatically trigger a browser download |
| `fileName` | `string` | `'snapshot'` | Filename for automatic download |

### `downloadSnapshot(options?: SnapshotOptions): Promise<void>`
Shortcut for `takeSnapshot` with `download: true`.

## High-Resolution Export

`PluginSnapshot` supports rendering the chart at much higher resolutions than displayed on screen:

- **Standard**: Matches the current screen resolution (considering DPR).
- **2K**: ~2000px width.
- **4K**: ~4000px width (Ultra HD).
- **8K**: ~8000px width (Publication Grade).

When a high-resolution export is requested, the plugin temporarily resizes the internal rendering buffers, performs a high-fidelity render pass, captures the image, and restores the original state.

## Example

```typescript
const snapshotPlugin = chart.getPlugin('scichart-snapshot');

// Simple PNG capture
const dataUrl = await snapshotPlugin.takeSnapshot();

// High-res 4K JPEG for publication
await snapshotPlugin.downloadSnapshot({
  format: 'jpeg',
  resolution: '4k',
  quality: 1.0,
  watermarkText: 'Laboratory Alpha - Experiment 42',
  fileName: 'spectrum_analysis_highres'
});
```

## Features
- **Layer Composition**: Automatically merges the WebGL data layer with the HTML/Canvas overlay layer.
- **Async Execution**: Capturing doesn't block the main UI thread (except for the render pass).
- **Transparency**: Support for transparent exports (useful for embedding in dark-themed presentations).
- **Watermarking**: Professional watermark support with automatic scaling.
