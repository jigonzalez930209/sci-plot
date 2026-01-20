# SciChart Engine API Summary

## Creation & Lifecycle
- `createChart(options)`: Initialize a chart.
- `chart.destroy()`: Cleanup WebGL context and listeners.
- `chart.resize()`: Manually trigger a resize.

## Data & Series
- `chart.addSeries(options)`: Add a new series.
  - Types: `line`, `scatter`, `step`, `band`, `area`, `bar`, `heatmap`, `boxplot`, `waterfall`, `ternary`.
- `chart.updateSeries(id, data)`: Update data for an existing series.
- `chart.appendData(id, x, y)`: Efficiently append real-time data.
- `chart.removeSeries(id)`: Remove a series.

## Interactions & Cursor
- `chart.enableCursor(options)`: Enable crosshair cursor with snapping.
- `chart.disableCursor()`: Hide the cursor.
- `chart.setMode(mode)`: Change interaction mode (`pan`, `boxZoom`, `select`, `delta`, `peak`).

## Annotations
- `chart.addAnnotation(options)`: Types include `text`, `horizontal-line`, `vertical-line`, `rectangle`, `band`, `arrow`.
- `chart.updateAnnotation(id, options)`: Dynamic update.
- `chart.removeAnnotation(id)`: Cleanup.

## Events
Subscribe using `chart.on(event, callback)`:
- `render`: `{ fps, frameTime }`
- `zoom`: `{ x, y }` (axis ranges)
- `pan`: `{ deltaX, deltaY }`
- `click`: `{ x, y, seriesId? }`
- `measure`: Fired by tools like `delta` or `peak` with results.

## Advanced View Control
- `chart.resetZoom()`: Return to original scale.
- `chart.getViewBounds()`: Get current visible data range.
- `chart.updateXAxis(options)`: Change X-axis labels, scale type, etc.
- `chart.updateYAxis(options)`: Change Y-axis properties.

## Multi-Axis
- `chart.addYAxis(options)`: Add secondary Y-axis (e.g., `yAxis2`).
- Mapping a series: `chart.addSeries({ ..., yAxisId: 'yAxis2' })`.

## Themes
- `chart.setTheme(themeNameOrConfig)`: Predefined: `midnight`, `electrochemistry`, `dark`, `light`.
- `createTheme(config)`: Create a brand-new design system.
