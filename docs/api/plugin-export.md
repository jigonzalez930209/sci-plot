# Export & Media Plugins

This suite provides tools for high-resolution image generation, real-time video capture, and multi-format data extraction.

## Snapshot Plugin (`PluginSnapshot`)

The snapshot plugin allows capturing the current state of the chart as a high-resolution image.

### Configuration
```typescript
{
  defaultFormat: 'png' | 'jpeg' | 'webp';
  quality?: number; // 0-1
}
```

### API
- `takeSnapshot(options)`: Returns a data URL of the capture.
- `downloadSnapshot(options)`: Triggers a browser download.

---

## Video Recorder Plugin (`PluginVideoRecorder`)

Captures the chart's animation loop and overlays directly into a video file.

### Configuration
```typescript
{
  fps?: number; // default: 30
  bitrate?: number; // default: 2.5Mbps
  mimeType?: string;
}
```

### API
- `start()`: Begins recording.
- `stop()`: Ends recording and returns a `Blob`.

---

## Data Export Plugin (`PluginDataExport`)

Extracts scientific data from series into various standard formats.

### Configuration
```typescript
{
  defaultFormat: 'csv';
  precision?: number;
}
```

### API
- `export(format, options)`: Returns string or binary content.
- `download(format, options)`: Triggers a file download.

### Supported Formats
- **Textual**: `csv`, `tsv`, `json`, `xlsx` (Excel CSV).
- **Scientific**: `matlab`, `python` (NumPy).
- **Binary**: `binary` (TypedArray buffers).
