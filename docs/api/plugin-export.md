# Export & Media Plugins

This suite provides tools for high-resolution image generation, real-time video capture, and multi-format data extraction.

## Snapshot Plugin (`PluginSnapshot`)

The `PluginSnapshot` allows capturing the current state of the chart as a high-resolution image, respecting device pixel ratios and including all layers (WebGL, SVG, Canvas).

### Basic Usage

```typescript
import { createChart, PluginSnapshot } from 'sci-plot';

const chart = createChart({ container });
await chart.use(PluginSnapshot({ defaultFormat: 'png' }));

// Direct access to Snapshot API
const dataUrl = await chart.snapshot.downloadSnapshot({
  filename: 'experiment-results',
  format: 'jpeg',
  quality: 0.95
});
```

### Configuration & API

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `defaultFormat` | `string` | `'png'` | Format used if not specified in call. |
| `quality` | `number` | `0.9` | Compression quality for JPEG/WebP. |

**Methods:**
- `takeSnapshot(options)`: Returns `Promise<string>` (Data URL).
- `downloadSnapshot(options)`: Returns `Promise<string>` and triggers file download.

---

## Video Recorder Plugin (`PluginVideoRecorder`)

Captures the chart's animation loop, including transitions, real-time data streaming, and tooltips, directly into a video file (WebM or MP4).

### Basic Usage

```typescript
import { createChart, PluginVideoRecorder } from 'sci-plot';

const chart = createChart({ container });
await chart.use(PluginVideoRecorder({ fps: 60, bitrate: 5000000 }));

// Control recording via direct property
chart.videoRecorder.start();

// After some interaction or data streaming...
const videoBlob = await chart.videoRecorder.stop();
// Or auto-download via config
```

### API Reference

```typescript
chart.videoRecorder.start();      // Start capturing
chart.videoRecorder.pause();      // Pause capture
chart.videoRecorder.resume();     // Resume capture
await chart.videoRecorder.stop(); // Stop and get Blob
```

---

## Data Export Plugin (`PluginDataExport`)

Extracts scientific data from chart series into various standard formats for external processing in tools like Excel, MATLAB, or Python.

### Basic Usage

```typescript
import { createChart, PluginDataExport } from 'sci-plot';

const chart = createChart({ container });
await chart.use(PluginDataExport());

// Download current series data as CSV via direct property
chart.dataExport.download('csv', {
  seriesIds: ['channel-1', 'channel-2'],
  precision: 8,
  includeHeaders: true
});
```

### Supported Formats & Capabilities

| Format | Type | Extension | Note |
| :--- | :--- | :--- | :--- |
| `csv` | Text | `.csv` | Standard comma-separated values. |
| `json` | Text | `.json` | Full series metadata and structure. |
| `binary` | Binary | `.bin` | Raw Float32Array buffers. |
| `xlsx` | Text | `.xlsx` | Tab-separated values for Excel. |

**Advanced Options:**
- `precision`: Number of decimal places for numeric output.
- `delimiter`: Custom separator for text formats.
- `filter`: Callback to exclude specific data ranges during export.
