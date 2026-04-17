---
title: Context Menu Demo
description: Customizable right-click context menu for chart interactions
---

<script setup>
import ContextMenuDemo from '../.vitepress/theme/demos/ContextMenuDemo.vue'
</script>

# Context Menu Demo

The **PluginContextMenu** provides a fully customizable right-click context menu with built-in actions and extensibility for custom functionality.

<ContextMenuDemo />

## Features

- **Built-in Actions**: Zoom, pan, export, annotations, legend toggle
- **Custom Menu Items**: Add your own actions with icons and shortcuts
- **Submenus**: Organize related actions in nested menus
- **Context-Aware**: Get data coordinates and clicked series info
- **Touch Support**: Long-press on mobile triggers the menu
- **Glassmorphism Styling**: Modern backdrop blur with smooth animations

## Basic Usage

```typescript
import { createChart } from 'velo-plot';
import { PluginContextMenu } from 'velo-plot/plugins/context-menu';

const chart = createChart({
  container: document.getElementById('chart'),
  plugins: [
    PluginContextMenu({
      useDefaults: true,  // Include built-in menu items
    })
  ]
});
```

## Custom Menu Items

```typescript
chart.use(PluginContextMenu({
  useDefaults: true,
  items: [
    {
      label: 'My Custom Action',
      icon: '⚡',
      shortcut: 'Ctrl+M',
      onClick: (context) => {
        console.log('Clicked at:', context.dataPosition);
        console.log('Series:', context.seriesId);
      }
    },
    { type: 'separator' },
    {
      label: 'More Options',
      icon: '📋',
      type: 'submenu',
      items: [
        { label: 'Option A', onClick: () => {} },
        { label: 'Option B', onClick: () => {} },
      ]
    }
  ]
}));
```

## Built-in Actions

Use the `action` property to access built-in functionality:

| Action | Description |
|--------|-------------|
| `zoomToFit` | Fit all data in view |
| `resetView` | Reset to initial view |
| `panMode` | Enable pan interaction |
| `boxZoomMode` | Enable box zoom selection |
| `selectMode` | Enable point selection |
| `exportCSV` | Export data as CSV |
| `exportJSON` | Export data as JSON |
| `exportImage` | Download chart as PNG |
| `copyToClipboard` | Copy data to clipboard |
| `toggleLegend` | Show/hide legend |
| `toggleGrid` | Show/hide grid |
| `addHorizontalLine` | Add H-line annotation at click Y |
| `addVerticalLine` | Add V-line annotation at click X |
| `addTextAnnotation` | Add text at click position |
| `clearAnnotations` | Remove all annotations |

```typescript
{
  label: 'Reset View',
  icon: '↻',
  action: 'resetView',
  shortcut: 'R'
}
```

## Menu Context

When a menu item is clicked, the handler receives a context object:

```typescript
interface MenuContext {
  chart: Chart;              // Chart instance
  event: MouseEvent;         // Original mouse event
  pixelPosition: { x, y };   // Click position in pixels
  dataPosition: { x, y };    // Click position in data coords
  seriesId: string | null;   // Series ID if clicked on series
  pointIndex: number | null; // Point index if near a point
  area: 'plot' | 'xAxis' | 'yAxis' | 'legend';
}
```

## Checkbox and Radio Items

```typescript
{
  label: 'Show Grid',
  type: 'checkbox',
  checked: true,
  onChange: (checked, context) => {
    context.chart.setShowGrid(checked);
  }
}

{
  label: 'Line Style',
  type: 'radio',
  group: 'lineStyle',
  value: 'solid',
  selected: true,
  onChange: (value, context) => {
    console.log('Selected:', value);
  }
}
```

## Custom Styling

```typescript
chart.use(PluginContextMenu({
  style: {
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    textColor: '#e0e0e0',
    borderColor: 'rgba(100, 100, 120, 0.5)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    hoverBackground: 'rgba(0, 200, 255, 0.2)',
    fontSize: '14px',
    itemPadding: '10px 16px',
    animationDuration: '200ms'
  }
}));
```

## Programmatic Control

```typescript
const menu = chart.getPlugin('velo-plot-context-menu');

// Show menu at specific position
menu.api.show(200, 300);

// Hide menu
menu.api.hide();

// Check if visible
if (menu.api.isVisible()) { ... }

// Dynamically update items
menu.api.setItems([...newItems]);

// Enable/disable
menu.api.setEnabled(false);
```

## Configuration Options

```typescript
interface PluginContextMenuConfig {
  enabled?: boolean;           // Enable context menu (default: true)
  items?: MenuItem[];          // Custom menu items
  templates?: MenuTemplate[];  // Context-specific templates
  useDefaults?: boolean;       // Include default items (default: true)
  style?: MenuStyle;           // Custom styling
  preventDefault?: boolean;    // Prevent browser menu (default: true)
  showOnRightClick?: boolean;  // Show on right-click (default: true)
  showOnLongPress?: boolean;   // Show on long-press (default: true)
  longPressDuration?: number;  // Long press ms (default: 500)
  beforeShow?: (ctx) => MenuItem[] | false;  // Pre-show hook
  afterHide?: () => void;      // Post-hide callback
  zIndex?: number;             // Menu z-index (default: 10000)
}
```

## See Also

- [Context Menu Plugin API](/api/plugin-context-menu) - Complete API reference
- [Data Export Plugin](/api/plugin-export#data-export-plugin) - Export functionality
- [Annotations](/api/annotations) - Chart annotations
