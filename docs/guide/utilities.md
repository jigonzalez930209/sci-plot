---
title: Utilities & DX
description: Developer experience utilities including keyboard shortcuts, clipboard, debug overlay, and internationalization
---

# Utilities & Developer Experience

SciChart Engine includes several utilities to enhance developer experience and improve productivity.

## Keyboard Shortcuts

Configure keyboard shortcuts for common chart interactions:

```typescript
import { createChart, KeyBindingManager, DEFAULT_KEY_BINDINGS } from 'scichart-engine';

const chart = createChart({
  container: document.getElementById('chart'),
  keyBindings: true, // Enable default shortcuts
});

// Or customize shortcuts
const chart = createChart({
  container: document.getElementById('chart'),
  keyBindings: [
    { key: 'KeyR', action: 'resetZoom', description: 'Reset zoom' },
    { key: 'KeyH', action: 'autoScale' },
    { key: 'Escape', action: 'clearSelection' },
    { key: 'KeyC', action: 'copy', ctrl: true },
  ],
});
```

### Default Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `R` | Reset Zoom | Reset to fit all data |
| `H` | Auto Scale | Fit data to view |
| `Arrow Keys` | Pan | Pan in direction |
| `Ctrl + C` | Copy | Copy selected data |
| `Escape` | Clear | Clear selection |
| `Ctrl + E` | Export | Export chart image |

## Clipboard

Copy chart data to clipboard in various formats:

```typescript
import { copyToClipboard, getClipboardManager } from 'scichart-engine';

// Copy selected points
const result = await copyToClipboard(selectedPoints, {
  format: 'tsv',     // Excel-compatible
  includeHeaders: true,
  precision: 6,
});

console.log(`Copied ${result.pointCount} points`);

// Available formats: 'tsv', 'csv', 'json', 'markdown'
```

### Format Examples

**TSV (Excel-compatible)**:
```
X	Y
0.000	1.234
0.001	2.345
```

**CSV**:
```
X,Y
0.000,1.234
0.001,2.345
```

**JSON**:
```json
[
  { "x": 0.000, "y": 1.234 },
  { "x": 0.001, "y": 2.345 }
]
```

## Debug Overlay

Enable a visual debug overlay showing performance metrics:

```typescript
import { createChart } from 'scichart-engine';

const chart = createChart({
  container: document.getElementById('chart'),
  debug: true, // Show debug overlay
});

// Or with options
const chart = createChart({
  container: document.getElementById('chart'),
  debug: {
    showFps: true,
    showPointCount: true,
    showBounds: true,
    showRendererInfo: true,
    showMemory: true,
    position: 'top-left',
  },
});
```

The debug overlay shows:
- **FPS** - Current frames per second (color-coded: green >55, yellow >30, red <30)
- **Frame Time** - Average milliseconds per frame
- **Point Count** - Total data points being rendered
- **Draw Calls** - Number of WebGL draw calls
- **Memory** - Estimated GPU memory usage
- **View Bounds** - Current X/Y axis ranges
- **Renderer** - WebGL info and GPU name

## Internationalization (i18n)

Configure locale-specific formatting:

```typescript
import { 
  createChart, 
  setGlobalLocale, 
  createLocaleFormatter,
  LOCALE_ES_ES 
} from 'scichart-engine';

// Set global locale
setGlobalLocale('es-ES');

// Or use per-chart locale
const chart = createChart({
  container: document.getElementById('chart'),
  locale: 'es-ES', // Use decimal comma, DD/MM/YYYY dates
});

// Create a formatter
const formatter = createLocaleFormatter('de-DE');
console.log(formatter.formatNumber(1234.56)); // "1.234,56"
console.log(formatter.formatDate(new Date())); // "08.01.2026"
console.log(formatter.formatWithPrefix(1.5e-6, 'A')); // "1,50 µA"
```

### Supported Locales

| Locale | Decimal | Thousands | Date Format |
|--------|---------|-----------|-------------|
| `en-US` | . | , | MM/DD/YYYY |
| `es-ES` | , | . | DD/MM/YYYY |
| `de-DE` | , | . | DD.MM.YYYY |
| `fr-FR` | , | (space) | DD/MM/YYYY |
| `pt-BR` | , | . | DD/MM/YYYY |
| `zh-CN` | . | , | YYYY/MM/DD |
| `ja-JP` | . | , | YYYY/MM/DD |

## Loading Indicators

Show loading states for large data operations:

```typescript
import { showLoading, showProgress, LoadingIndicator } from 'scichart-engine';

// Simple spinner
const loader = showLoading(container, 'Loading data...');
await fetchData();
loader.hide();

// Progress bar
const progress = showProgress(container);
for (let i = 0; i <= 100; i += 10) {
  progress.setProgress(i, `Processing ${i}%...`);
  await process(batch);
}
// Auto-hides when reaching 100%

// Advanced usage
const indicator = new LoadingIndicator(container, {
  type: 'progress',      // 'spinner' | 'progress' | 'skeleton' | 'pulse'
  message: 'Processing...',
  accentColor: '#00f2ff',
  size: 'medium',
});
indicator.show();
```

## Read-Only Mode

Disable all interactions for presentation or embedding:

```typescript
const chart = createChart({
  container: document.getElementById('chart'),
  readOnly: true, // No zoom, pan, tooltips, or selection
});
```

This is useful for:
- Embedding charts in reports or presentations
- Displaying static analysis results
- Creating dashboard tiles without interaction

## Testing Utilities

Generate mock data for testing:

```typescript
import {
  generateSineWave,
  generateSquareWave,
  generateRandomData,
  generateCVData,
  generateNyquistData,
  benchmarkRender,
  assertPerformance,
  waitForFrames,
} from 'scichart-engine';

// Generate waveforms
const sine = generateSineWave({
  pointCount: 10000,
  frequency: 5,
  amplitude: 2,
  noise: 0.1,
});

// Generate CV (Cyclic Voltammetry) data
const cv = generateCVData({
  pointCount: 2000,
  vMin: -0.5,
  vMax: 0.5,
  cycles: 3,
  peakCurrent: 10e-6,
});

// Benchmark performance
const result = await benchmarkRender(chart, {
  duration: 5000,
  warmup: 1000,
  verbose: true,
});

// Assert performance requirements
const { passed, failures } = assertPerformance(result, {
  minFps: 55,
  maxFrameTime: 20,
});

// Wait for frames (useful in tests)
await waitForFrames(5);
```

### Available Waveform Generators

| Function | Description |
|----------|-------------|
| `generateSineWave` | Sine wave with configurable frequency/amplitude/noise |
| `generateSquareWave` | Square wave |
| `generateSawtoothWave` | Sawtooth wave |
| `generateTriangleWave` | Triangle wave |
| `generateRandomData` | Random data with optional seeded RNG |
| `generateCVData` | Mock Cyclic Voltammetry data |
| `generateNyquistData` | Mock EIS Nyquist plot data |

## API Reference

- [LocaleConfig](/api/locale)
- [KeyBindingManager](/api/keybindings)
- [ClipboardManager](/api/clipboard)
- [DebugOverlay](/api/debug)
- [LoadingIndicator](/api/loading)
- [Testing Utilities](/api/testing)
