# Serialization & Persistence

The SciChart Engine provides a robust serialization system to save, restore, and share chart configurations and data.

## Interactive Demo
<ChartDemo type="persistence" height="400px" />

## Overview
The persistence system allows:
- **State Export**: Export axes, series, data, styles, and annotations to a JSON-compatible object.
- **State Import**: Restore a chart's state from a previously exported object.
- **URL Sharing**: Compact, compressed Base64 representation of the chart state for sharing via URL hash.
- **Undo/Redo**: History management using state snapshots.
- **Compact Storage**: Typed data is encoded as Base64 for efficiency.
- **Plugin Persistence**: Plugins can participating in serialization via `onSerialize` and `onDeserialize` hooks.

::: tip Plugin Persistence
From version 1.5.0, the serialization system also includes data from active plugins. For example, the `PluginAnnotations` state is automatically saved with the chart.
:::

## Exporting State

```typescript
// Export complete state including data
const state = chart.serialize();

// Export configuration only (exclude data)
const config = chart.serialize({ includeData: false });

// Save to local storage
localStorage.setItem('my-chart', JSON.stringify(state));
```

## Restoring State

```typescript
// Load from storage
const saved = JSON.parse(localStorage.getItem('my-chart'));

// Restore chart
chart.deserialize(saved);

// Restore config but skip data loading
chart.deserialize(saved, { skipData: true });
```

## URL Sharing

The engine includes utilities to compress the state into a URL-safe string.

```typescript
// Get shareable hash
const hash = chart.toUrlHash();
window.location.hash = hash;

// On page load, restore from hash
window.addEventListener('hashchange', () => {
  chart.fromUrlHash(window.location.hash.substring(1));
});
```

## State Snapshot API

### SerializeOptions
```typescript
interface SerializeOptions {
  /** Include series data (default: true) */
  includeData?: boolean;
  /** Include annotations (default: true) */
  includeAnnotations?: boolean;
  /** Compress output (default: false) */
  compress?: boolean;
}
```

### DeserializeOptions
```typescript
interface DeserializeOptions {
  /** Merge with existing state instead of replacing (default: false) */
  merge?: boolean;
  /** Skip data loading (default: false) */
  skipData?: boolean;
  /** Skip annotations (default: false) */
  skipAnnotations?: boolean;
}
```

## Data Encoding
Numeric data (Float32Array) is encoded as Base64. This provides a ~33% size increase compared to binary, but is much more compact than JSON number arrays (~10-20x smaller for many datasets).

```typescript
import { encodeFloat32Array, decodeFloat32Array } from 'scichart-engine';

const encoded = encodeFloat32Array(new Float32Array([1, 2, 3]));
const decoded = decodeFloat32Array(encoded);
```

## Undo/Redo Implementation
You can use the `StateHistory` utility to implement undo/redo functionality:

```typescript
import { StateHistory } from 'scichart-engine';

const history = new StateHistory(50); // Keep 50 steps

// On every change:
history.push({
  timestamp: Date.now(),
  viewBounds: chart.serialize().viewBounds,
});

// Undo:
const previous = history.undo();
if (previous) {
  chart.deserialize(previous, { skipData: true });
}
```
