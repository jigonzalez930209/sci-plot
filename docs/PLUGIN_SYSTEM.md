# SciChart Engine - Plugin System

## Overview

The SciChart Engine plugin system provides a comprehensive architecture for extending chart functionality. Plugins can add new features, visualizations, interactions, and analysis tools without modifying the core engine.

## Features

- **Complete Lifecycle Hooks** - Init, render, data, view, interaction, and destroy events
- **Rich Plugin Context** - Access to all chart internals in a controlled manner
- **Plugin Storage** - Persistent state management per plugin
- **Dependency Management** - Plugins can declare dependencies on other plugins
- **Global Registry** - Third-party plugin discovery and registration
- **Built-in Plugins** - Common functionality out of the box

## Quick Start

### Using a Built-in Plugin

```typescript
import { createChart, CrosshairPlugin, StatsPlugin } from 'scichart-engine';

const chart = createChart({
  container: document.getElementById('chart'),
  // ... other options
});

// Add crosshair plugin
await chart.use(CrosshairPlugin({
  showVertical: true,
  showHorizontal: true,
  snapToData: true,
}));

// Add statistics overlay
await chart.use(StatsPlugin({
  position: 'top-right',
  show: ['count', 'mean', 'min', 'max'],
}));
```

### Creating a Custom Plugin

```typescript
import { createPlugin, PluginContext } from 'scichart-engine';

const MyPlugin = createPlugin({
  manifest: {
    name: 'my-plugin',
    version: '1.0.0',
    description: 'My custom plugin',
    provides: ['visualization'],
  },

  onInit(ctx: PluginContext) {
    ctx.log.info('Plugin initialized!');
    
    // Subscribe to chart events
    ctx.events.on('render', () => {
      // Handle render event
    });
  },

  onAfterRender(ctx) {
    // Custom rendering
    const ctx2d = ctx.render.ctx2d;
    if (ctx2d) {
      ctx2d.fillStyle = 'red';
      ctx2d.fillRect(100, 100, 50, 50);
    }
  },

  onDestroy(ctx) {
    ctx.log.info('Plugin destroyed');
  },
});

// Use the plugin
chart.use(MyPlugin);
```

### Creating a Configurable Plugin

```typescript
import { createConfigurablePlugin, PluginManifest } from 'scichart-engine';

interface MyPluginConfig {
  color: string;
  enabled: boolean;
  threshold: number;
}

const manifest: PluginManifest = {
  name: 'my-configurable-plugin',
  version: '1.0.0',
  provides: ['analysis'],
};

const MyConfigurablePlugin = createConfigurablePlugin<MyPluginConfig>(
  manifest,
  (config) => ({
    onInit(ctx) {
      ctx.log.info(`Color: ${config?.color}`);
      ctx.storage.set('threshold', config?.threshold ?? 0.5);
    },

    onDataUpdate(ctx, event) {
      if (config?.enabled) {
        const threshold = ctx.storage.get<number>('threshold');
        // Process data with threshold
      }
    },
  })
);

// Use with configuration
chart.use(MyConfigurablePlugin({
  color: '#ff0000',
  enabled: true,
  threshold: 0.75,
}));
```

## Plugin Context API

The `PluginContext` provides access to chart functionality:

### Chart Access
```typescript
ctx.chart           // Full Chart API
ctx.requestRender() // Request re-render
```

### Rendering
```typescript
ctx.render.gl        // WebGL context
ctx.render.ctx2d     // 2D canvas context
ctx.render.pixelRatio
ctx.render.canvasSize
ctx.render.plotArea
```

### Coordinate Conversion
```typescript
ctx.coords.dataToPixelX(dataX)
ctx.coords.dataToPixelY(dataY, yAxisId?)
ctx.coords.pixelToDataX(pixelX)
ctx.coords.pixelToDataY(pixelY, yAxisId?)
ctx.coords.pickPoint(pixelX, pixelY, radius?)
```

### Data Access
```typescript
ctx.data.getAllSeries()
ctx.data.getSeries(id)
ctx.data.getSeriesData(id)
ctx.data.getViewBounds()
ctx.data.getYAxisBounds(yAxisId?)
ctx.data.getAnnotations()
ctx.data.getSelectedPoints()
```

### UI Management
```typescript
ctx.ui.container           // Chart container
ctx.ui.theme               // Current theme
ctx.ui.createOverlay(id, options)
ctx.ui.removeOverlay(id)
ctx.ui.showNotification(message, options)
```

### Events
```typescript
// Subscribe to chart events
const unsubscribe = ctx.events.on('render', handler);

// Subscribe once
ctx.events.once('zoom', handler);

// Emit custom plugin events
ctx.events.emit('my-plugin:data-ready', data);

// Listen to custom plugin events
ctx.events.onPlugin('other-plugin:event', handler);
```

### Storage
```typescript
ctx.storage.set('key', value)
ctx.storage.get<Type>('key')
ctx.storage.remove('key')
ctx.storage.clear()
ctx.storage.keys()
```

### Logging
```typescript
ctx.log.debug('Debug message')
ctx.log.info('Info message')
ctx.log.warn('Warning message')
ctx.log.error('Error message')
```

### Plugin Access
```typescript
const otherPlugin = ctx.getPlugin<OtherPluginType>('other-plugin');
otherPlugin?.api.doSomething();
```

## Lifecycle Hooks

### Initialization
- `onInit(ctx, config?)` - Plugin attached to chart
- `onDestroy(ctx)` - Plugin being removed
- `onConfigChange(ctx, newConfig, oldConfig)` - Configuration updated

### Rendering
- `onBeforeRender(ctx, event)` - Before each render (return `false` to skip)
- `onRenderWebGL(ctx, event)` - After WebGL rendering
- `onRenderOverlay(ctx, event)` - After overlay rendering
- `onAfterRender(ctx, event)` - After all rendering complete

### Data
- `onDataUpdate(ctx, event)` - Series data changed
- `onSeriesAdd(ctx, event)` - Series added
- `onSeriesRemove(ctx, event)` - Series removed
- `onSeriesChange(ctx, event)` - Series style/visibility changed

### View
- `onViewChange(ctx, event)` - Zoom/pan occurred
- `onResize(ctx, size)` - Chart resized
- `onThemeChange(ctx, theme)` - Theme changed

### Interaction
- `onInteraction(ctx, event)` - Mouse/touch event (return `false` to prevent default)
- `onSelectionChange(ctx, points)` - Selection changed

### Serialization
- `onSerialize(ctx)` - Return plugin state for saving
- `onDeserialize(ctx, data)` - Restore plugin state

## Built-in Plugins

### CrosshairPlugin
Interactive crosshair following the cursor.

```typescript
CrosshairPlugin({
  showVertical: true,    // Show vertical line
  showHorizontal: true,  // Show horizontal line
  color: '#888888',      // Line color
  lineStyle: 'dashed',   // 'solid' | 'dashed' | 'dotted'
  lineWidth: 1,          // Line width
  showAxisLabels: true,  // Show coordinate labels
  snapToData: false,     // Snap to nearest data point
})
```

### StatsPlugin
Real-time statistics overlay.

```typescript
StatsPlugin({
  position: 'top-right',
  show: ['count', 'mean', 'min', 'max', 'std', 'range'],
  seriesId: 'my-series',  // Optional: specific series
  autoUpdate: true,
})
```

### WatermarkPlugin
Chart watermark overlay.

```typescript
WatermarkPlugin({
  text: 'CONFIDENTIAL',
  fontSize: 48,
  fontFamily: 'system-ui',
  color: 'rgba(128, 128, 128, 0.15)',
  position: 'center',  // 'center' | 'bottom-right' | 'bottom-left'
  rotation: -30,
})
```

### GridHighlightPlugin
Highlight specific chart regions.

```typescript
GridHighlightPlugin({
  xIntervals: [
    { start: 0, end: 100, color: 'rgba(255,0,0,0.3)' },
  ],
  yIntervals: [
    { start: -1, end: 1, color: 'rgba(0,255,0,0.3)' },
  ],
  opacity: 0.1,
})
```

### DataLoggerPlugin
Event logging for debugging.

```typescript
DataLoggerPlugin({
  logDataUpdates: true,
  logViewChanges: true,
  logInteractions: false,
  maxEntries: 100,
})
```

## Global Plugin Registry

Register plugins globally for discovery:

```typescript
import { registerPlugin, getPluginRegistry, defineAndRegister } from 'scichart-engine';

// Register a plugin
registerPlugin({
  manifest: {
    name: 'my-global-plugin',
    version: '1.0.0',
    provides: ['analysis'],
    tags: ['fft', 'signal-processing'],
  },
  factory: MyPluginFactory,
});

// Find plugins by capability
const analysisPlugins = getPluginRegistry().findByCapability('analysis');

// Find plugins by tag
const fftPlugins = getPluginRegistry().findByTag('fft');

// Load a registered plugin
import { loadPlugin } from 'scichart-engine';
const plugin = await loadPlugin('my-global-plugin', config);
```

## Plugin Manifest

```typescript
interface PluginManifest {
  name: string;                    // Unique identifier
  version: `${number}.${number}.${number}`;  // Semver
  description?: string;
  author?: string;
  homepage?: string;
  license?: string;
  provides?: PluginCapability[];   // What the plugin offers
  dependencies?: string[];         // Required plugins
  optionalDependencies?: string[];
  engineVersion?: string;          // Minimum engine version
  configSchema?: object;           // JSON Schema for config
  tags?: string[];                 // Discovery tags
}

type PluginCapability =
  | 'analysis'
  | 'visualization'
  | 'interaction'
  | 'data-source'
  | 'export'
  | 'ui'
  | 'annotation'
  | 'theme';
```

## Best Practices

1. **Clean up in onDestroy** - Remove event listeners, overlays, and timers
2. **Use plugin storage** - For persistent state that survives serialization
3. **Use namespaced logging** - `ctx.log` is automatically namespaced
4. **Declare dependencies** - If your plugin needs another, declare it
5. **Provide an API** - Expose functionality via the `api` property
6. **Handle errors gracefully** - Catch exceptions in hooks
7. **Validate configuration** - Use the configSchema in manifest
8. **Test hot-reload** - Ensure clean destruction and re-initialization
