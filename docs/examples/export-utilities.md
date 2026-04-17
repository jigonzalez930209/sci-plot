# Export & Media Utilities

Extract data and media from your charts using our professional export plugins.

## High-Resolution Snapshots
Capture the WebGL plot area and all 2D overlays (axes, annotations, legends).
<SnapshotDemo />

## Native Video Recording
Record active chart animations directly from the browser buffer.
<VideoRecorderDemo />

## Multi-Format Data Export
Extract raw data for external analysis in CSV, JSON, and more.
<DataExportDemo />

### API Reference Summary

```typescript
import { PluginSnapshot, PluginVideoRecorder, PluginDataExport } from 'sci-plot';

// High-res Image
chart.use(PluginSnapshot());
await chart.snapshot.takeSnapshot();

// Real-time Video
chart.use(PluginVideoRecorder());
chart.videoRecorder.start();

// Raw Data
chart.use(PluginDataExport());
chart.exportCSV();
```
