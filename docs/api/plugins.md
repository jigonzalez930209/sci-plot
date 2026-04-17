---
title: Plugins API
description: Extend Sci Plot through its powerful plugin system, allowing custom lifecycle hooks for rendering, series management, and UI overlays.
---

# Plugins API

The Sci Plot provides a powerful, extensible plugin system that allows you to hook into every aspect of the chart's lifecycle.

## Plugin Interface

All plugins must implement the `ChartPlugin` interface or be created via a `PluginFactory`.

```typescript
export interface ChartPlugin<TConfig = unknown> {
    /** Unique metadata and capabilities */
    readonly manifest: PluginManifest;

    /** Called when attached to chart. Use for setup and subscriptions. */
    onInit?(ctx: PluginContext, config?: TConfig): void | Promise<void>;

    /** Called when configuration is updated via chart.pluginManager.configure() */
    onConfigChange?(ctx: PluginContext, newConfig: TConfig, oldConfig: TConfig): void;

    /** Prepare or skip current frame */
    onBeforeRender?(ctx: PluginContext, event: BeforeRenderEvent): boolean | void;

    /** Direct WebGL rendering */
    onRenderWebGL?(ctx: PluginContext, event: AfterRenderEvent): void;

    /** Custom 2D canvas drawing on overlay */
    onRenderOverlay?(ctx: PluginContext, event: AfterRenderEvent): void;

    /** Respond to data changes */
    onDataUpdate?(ctx: PluginContext, event: DataUpdateEvent): void;

    /** Respond to zoom/pan */
    onViewChange?(ctx: PluginContext, event: ViewChangeEvent): void;

    /** Clean up resources */
    onDestroy?(ctx: PluginContext): void;

    /** Optional public API exposed to other plugins */
    readonly api?: Record<string, any>;
}
```

## Plugin Context (`ctx`)

Plugins receive a rich context providing safe access to chart internals:

- `ctx.chart`: The full [Chart API](/api/chart).
- `ctx.render`: WebGL context, 2D overlay context, and canvas dimensions.
- `ctx.coords`: Utilities for data-to-pixel and pixel-to-data conversion.
- `ctx.data`: Read-only access to all series, annotations, and bounds.
- `ctx.ui`: Manager for adding/removing HTML overlays and notifications.
- `ctx.events`: Unified event bus for chart and custom plugin events.
- `ctx.storage`: Persistent key-value storage synced with chart state.

## Loading Plugins

Plugins are loaded using the `chart.use()` method. Note that from version 1.5.0, many features like **Tooltips**, **Analysis**, and **Annotations** must be explicitly loaded as plugins.

```typescript
import { createChart } from 'velo-plot';
import { PluginTools, PluginAnalysis, PluginAnnotations } from 'velo-plot/plugins';

const chart = createChart({ container });

// Enable core features
await chart.use(PluginTools({ useEnhancedTooltips: true }));
await chart.use(PluginAnalysis());
await chart.use(PluginAnnotations());
```

## Accessing Plugin APIs

Starting from version 1.9.0, most plugins register their public API directly on the `chart` object for easier access. This makes the code cleaner and provides better TypeScript IntelliSense.

| Plugin Property | Source Plugin | Description |
| :--- | :--- | :--- |
| `chart.snapshot` | `PluginSnapshot` | Export high-res images. |
| `chart.videoRecorder` | `PluginVideoRecorder` | Record chart animations. |
| `chart.dataExport` | `PluginDataExport` | Export raw data to CSV/JSON/XLSX. |
| `chart.roi` | `PluginROI` | Manage selection regions and masking. |
| `chart.analysis` | `PluginAnalysis` | Advanced signal processing. |
| `chart.regression` | `PluginRegression` | Linear and non-linear fitting. |
| `chart.virtualization` | `PluginVirtualization` | Big data management. |
| `chart.themeEditor` | `PluginThemeEditor` | Interactive style editing. |

> [!TIP]
> You can introspect all currently loaded and registered plugins using `chart.getPluginNames()`.

## Creating a Custom Plugin

The recommended way to create a plugin is using the `createPlugin` or `createConfigurablePlugin` helpers.

```typescript
import { createConfigurablePlugin } from 'velo-plot/plugins';

interface MyPluginConfig {
  color: string;
}

const MyPlugin = createConfigurablePlugin<MyPluginConfig>(
  {
    name: "my-custom-plugin",
    version: "1.0.0",
    provides: ["visualization"]
  },
  (config) => ({
    onInit(ctx) {
      ctx.log.info("My plugin initialized with color:", config?.color);
    },
    
    onRenderOverlay(ctx) {
      const { ctx2d, plotArea } = ctx.render;
      ctx2d.fillStyle = config?.color || 'red';
      ctx2d.fillRect(plotArea.x, plotArea.y, 50, 50);
    }
  })
);

// Usage
chart.use(MyPlugin({ color: 'blue' }));
```

## Built-in Plugins

The engine provides several built-in plugins in the `@src/plugins` module:

- `PluginTools`: Tooltips, delta tool, peak tool.
- `PluginAnalysis`: FFT, regressions, statistics.
- `PluginAnnotations`: Text, lines, shapes.
- `PluginLoading`: Custom loading indicators.
- `DirectionIndicatorPlugin`: Real-time data trend arrows.
- `StatsPlugin`: FPS and performance monitoring.
