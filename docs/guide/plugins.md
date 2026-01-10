# Plugin System

The SciChart Engine features a modular plugin system that allows you to extend chart functionality, add custom visualizations, and hook into the internal lifecycle of the chart.

## Core Concepts

Plugins are self-contained modules that receive a **PluginContext** upon initialization. This context provides access to:
- **Render Context**: WebGL and 2D Canvas contexts, plot area information.
- **Data Context**: Access to series data and bounds.
- **UI Context**: Methods for creating overlays and managing themes.
- **Coordinate Context**: Conversions between data and pixel coordinates.
- **Event Context**: Mechanism to subscribe to and emit events.

## Using Built-in Plugins

The most common plugins are **auto-loaded** by defaults in `ChartCore`, but you can also configure them explicitly.

```typescript
import { createChart, PluginTools, PluginAnalysis } from 'scichart-engine';

const chart = createChart({
  container: document.getElementById('chart'),
  theme: 'midnight'
});

// Accessing auto-loaded plugins
const tools = chart.getPluginAPI('scichart-tools');
const analysis = chart.getPluginAPI('scichart-analysis');
const annotations = chart.getPluginAPI('scichart-annotations');

// Example: setting a measurement tool
tools.setMode('delta');
```

## Creating a Custom Plugin

A plugin is an object or a function returning an object that implements the `ChartPlugin` interface.

```typescript
import { definePlugin, type PluginContext } from 'scichart-engine';

export const MyCustomPlugin = definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  provides: ['visualization']
}, (config = {}) => {
  let container: HTMLElement;

  return {
    onInit(ctx: PluginContext) {
      ctx.log.info("My plugin initialized!");
      
      // Create a 2D overlay
      const overlay = ctx.ui.createOverlay('my-overlay', {
        zIndex: 100
      });
      overlay.innerHTML = '<div style="color: white">Hello Plugin!</div>';
    },

    onRenderOverlay(ctx: PluginContext) {
      // Custom drawing on the 2D canvas after everything else
      const { ctx2d } = ctx.render;
      if (!ctx2d) return;

      ctx2d.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx2d.fillRect(50, 50, 100, 100);
    },

    onDestroy(_ctx: PluginContext) {
    }
  };
});
```

## Plugin Lifecycle Hooks

The following hooks are available in a plugin:

| Hook | Purpose |
| :--- | :--- |
| `onInit` | Initial setup, subscribing to events, creating UI elements. |
| `onBeforeRender` | Called before the render frame starts. Can return `false` to skip render. |
| `onRenderWebGL` | Hook for custom WebGL drawing. |
| `onRenderOverlay` | Hook for custom 2D Canvas drawing (tooltips, crosshairs). |
| `onInteraction` | React to mouse, touch, or keyboard events. |
| `onViewChange` | Triggered on zoom or pan. |
| `onDataUpdate` | Triggered when series data changes. |
| `onDestroy` | Resource cleanup. |

## Why use plugins?

1. **Decoupling**: Keep specialized logic (like FFT or specialized measurements) out of the core rendering engine.
2. **Performance**: Plugins can use the same optimized render loop and coordinate systems as the core.
3. **Reusability**: Package complex interactive features once and share them across different projects.
