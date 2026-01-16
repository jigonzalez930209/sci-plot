# High-Resolution Snapshot Export

This example demonstrates how to use the `PluginSnapshot` to export charts at various resolutions and formats.

<SnapshotDemo />

## Use Cases

1. **Scientific Publication**: Exporting charts at 4K or 8K resolution ensures that lines and points remain sharp when printed at high DPI or included in PDF documents.
2. **Presentations**: Transparent exports allow placing charts over custom backgrounds in PowerPoint or Keynote without unsightly borders.
3. **Data Logging**: Capturing snapshots alongside experimental data for visual verification of results.

## Key Configuration

To get the best quality, use the `4k` or `8k` resolution settings. Note that larger resolutions require more GPU memory and might take longer to capture.

```typescript
chart.use(PluginSnapshot());

// Export 4K transparent PNG
const blob = await chart.snapshot.takeSnapshot({
  resolution: '4k',
  transparent: true,
  format: 'png'
});
```

## Professional Watermarks

You can add dynamic watermarks to your exports to protect your data or add context (e.g., date, project name, or lab ID).

```typescript
await chart.snapshot.downloadSnapshot({
  watermarkText: `Exp: ${experimentId} | Date: ${new Date().toLocaleDateString()}`,
  fileName: `result_${experimentId}`
});
```
