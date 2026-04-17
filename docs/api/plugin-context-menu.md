---
title: Context Menu Plugin
description: Customizable right-click context menu for chart interactions
---

# Context Menu Plugin

The **PluginContextMenu** provides a fully customizable right-click context menu with built-in actions for common chart operations and extensibility for custom functionality.

## Features

- **18+ Built-in Actions**: Zoom, pan, export, annotations, and more
- **Custom Menu Items**: Add your own actions with icons and keyboard shortcuts
- **Nested Submenus**: Organize related actions in expandable submenus
- **Context-Aware**: Access data coordinates, series info, and click area
- **Touch Support**: Long-press gesture triggers the menu on mobile devices
- **Glassmorphism Design**: Modern backdrop blur with smooth animations
- **Keyboard Navigation**: Escape key closes the menu

## Installation

```typescript
import { createChart } from 'sci-plot';
import { PluginContextMenu } from 'sci-plot/plugins/context-menu';

const chart = createChart({ container });
chart.use(PluginContextMenu({
  useDefaults: true,
  items: [
    { label: 'Custom Action', icon: '⚡', onClick: () => {} }
  ]
}));
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable/disable the context menu |
| `items` | `MenuItem[]` | `[]` | Custom menu items |
| `templates` | `MenuTemplate[]` | `[]` | Context-specific menu templates |
| `useDefaults` | `boolean` | `true` | Include built-in menu items |
| `style` | `MenuStyle` | Glassmorphism | Custom styling options |
| `preventDefault` | `boolean` | `true` | Prevent browser context menu |
| `showOnRightClick` | `boolean` | `true` | Show on right-click |
| `showOnLongPress` | `boolean` | `true` | Show on long-press (touch) |
| `longPressDuration` | `number` | `500` | Long press duration in ms |
| `beforeShow` | `function` | - | Pre-show hook |
| `afterHide` | `function` | - | Post-hide callback |
| `zIndex` | `number` | `10000` | Menu z-index |

## API Reference

### `show(x, y, items?)`

Show the context menu programmatically at specified coordinates.

```typescript
const menu = chart.getPlugin('sci-plot-context-menu');
menu.api.show(200, 300);

// With custom items
menu.api.show(200, 300, [
  { label: 'Custom Item', onClick: () => {} }
]);
```

### `hide()`

Hide the context menu.

```typescript
menu.api.hide();
```

### `isVisible()`

Check if the menu is currently visible.

```typescript
if (menu.api.isVisible()) {
  console.log('Menu is open');
}
```

### `setItems(items)`

Update menu items dynamically.

```typescript
menu.api.setItems([
  { label: 'New Action 1', onClick: () => {} },
  { label: 'New Action 2', onClick: () => {} },
]);
```

### `setEnabled(enabled)`

Enable or disable the context menu.

```typescript
menu.api.setEnabled(false);  // Disable
menu.api.setEnabled(true);   // Enable
```

### `setStyle(style)`

Update menu styling.

```typescript
menu.api.setStyle({
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  textColor: '#ffffff',
  hoverBackground: 'rgba(0, 200, 255, 0.3)'
});
```

### `getBuiltinActions()`

Get list of available built-in action names.

```typescript
const actions = menu.api.getBuiltinActions();
// ['zoomToFit', 'resetView', 'panMode', ...]
```

## Menu Item Types

### Action Item

Standard clickable menu item.

```typescript
{
  label: 'My Action',
  icon: '🔧',           // Optional emoji or icon
  shortcut: 'Ctrl+M',   // Optional keyboard hint
  disabled: false,      // Gray out if true
  hidden: false,        // Don't show if true
  className: 'custom',  // Optional CSS class
  action: 'zoomToFit',  // Use built-in action
  onClick: (ctx) => {   // Or custom handler
    console.log(ctx.dataPosition);
  }
}
```

### Separator

Visual divider between menu sections.

```typescript
{ type: 'separator' }
```

### Submenu

Nested menu that expands on hover.

```typescript
{
  label: 'Export',
  icon: '💾',
  type: 'submenu',
  items: [
    { label: 'CSV', action: 'exportCSV' },
    { label: 'JSON', action: 'exportJSON' },
    { label: 'Image', action: 'exportImage' },
  ]
}
```

### Checkbox

Toggle item with checkmark indicator.

```typescript
{
  label: 'Show Grid',
  type: 'checkbox',
  checked: true,
  onChange: (checked, context) => {
    context.chart.setShowGrid(checked);
  }
}
```

### Radio

Mutually exclusive option within a group.

```typescript
{
  label: 'Pan Mode',
  type: 'radio',
  group: 'interactionMode',
  value: 'pan',
  selected: true,
  onChange: (value, context) => {
    context.chart.setMode(value);
  }
}
```

## Built-in Actions

| Action | Description | Shortcut |
|--------|-------------|----------|
| `zoomToFit` | Fit all data in view | Home |
| `zoomIn` | Zoom in 1.5x | - |
| `zoomOut` | Zoom out 0.67x | - |
| `resetView` | Reset to initial view | R |
| `panMode` | Enable pan interaction | - |
| `boxZoomMode` | Enable box zoom selection | - |
| `selectMode` | Enable point selection | - |
| `exportCSV` | Export data as CSV | - |
| `exportJSON` | Export data as JSON | - |
| `exportImage` | Download chart as PNG | - |
| `copyToClipboard` | Copy data to clipboard | Ctrl+C |
| `toggleLegend` | Show/hide legend | L |
| `toggleGrid` | Show/hide grid | G |
| `toggleCrosshair` | Show/hide crosshair | - |
| `addHorizontalLine` | Add H-line at click Y | - |
| `addVerticalLine` | Add V-line at click X | - |
| `addTextAnnotation` | Add text at click | - |
| `clearAnnotations` | Remove all annotations | - |
| `showStats` | Show statistics panel | S |

## Menu Context

When a menu item is clicked, the handler receives detailed context:

```typescript
interface MenuContext {
  // Chart instance
  chart: Chart;
  
  // Original mouse event
  event: MouseEvent;
  
  // Click position in pixels relative to container
  pixelPosition: { x: number; y: number };
  
  // Click position in data coordinates (null if outside plot)
  dataPosition: { x: number; y: number } | null;
  
  // Series ID if clicked on a data point
  seriesId: string | null;
  
  // Annotation ID if clicked on annotation
  annotationId: string | null;
  
  // Point index if clicked near a data point
  pointIndex: number | null;
  
  // Click area
  area: 'plot' | 'xAxis' | 'yAxis' | 'legend' | 'title' | 'outside';
}
```

## Styling

Customize the menu appearance with the `style` option:

```typescript
interface MenuStyle {
  backgroundColor?: string;    // Menu background
  textColor?: string;         // Text color
  borderColor?: string;       // Border color
  borderRadius?: string;      // Border radius
  boxShadow?: string;         // Shadow effect
  fontFamily?: string;        // Font family
  fontSize?: string;          // Font size
  itemPadding?: string;       // Item padding
  hoverBackground?: string;   // Hover highlight color
  separatorColor?: string;    // Separator line color
  disabledOpacity?: number;   // Disabled item opacity
  minWidth?: string;          // Minimum menu width
  maxWidth?: string;          // Maximum menu width
  animationDuration?: string; // Animation speed
}
```

### Default Style (Glassmorphism)

```typescript
{
  backgroundColor: 'rgba(30, 30, 40, 0.95)',
  textColor: '#e0e0e0',
  borderColor: 'rgba(100, 100, 120, 0.5)',
  borderRadius: '8px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  hoverBackground: 'rgba(0, 242, 255, 0.15)',
  separatorColor: 'rgba(100, 100, 120, 0.3)',
  animationDuration: '150ms'
}
```

## Templates

Use templates for context-specific menus:

```typescript
chart.use(PluginContextMenu({
  templates: [
    {
      name: 'series-menu',
      condition: (ctx) => ctx.seriesId !== null,
      items: [
        { label: 'Edit Series', icon: '✏️', onClick: () => {} },
        { label: 'Remove Series', icon: '🗑️', onClick: () => {} },
      ]
    },
    {
      name: 'axis-menu',
      condition: (ctx) => ctx.area === 'xAxis' || ctx.area === 'yAxis',
      items: [
        { label: 'Configure Axis', icon: '⚙️', onClick: () => {} },
      ]
    }
  ]
}));
```

## Hooks

### beforeShow

Modify items or cancel the menu before showing:

```typescript
beforeShow: (context) => {
  // Return false to cancel
  if (context.area === 'outside') {
    return false;
  }
  
  // Return modified items
  const items = [...defaultItems];
  if (context.seriesId) {
    items.push({ 
      label: `Edit ${context.seriesId}`, 
      onClick: () => {} 
    });
  }
  return items;
}
```

### afterHide

Callback when the menu is closed:

```typescript
afterHide: () => {
  console.log('Menu closed');
  // Cleanup or logging
}
```

## Examples

### Minimal Usage

```typescript
chart.use(PluginContextMenu());
// All default items are included
```

### Custom Actions Only

```typescript
chart.use(PluginContextMenu({
  useDefaults: false,
  items: [
    { label: 'Action 1', onClick: () => {} },
    { label: 'Action 2', onClick: () => {} },
  ]
}));
```

### With Export Integration

```typescript
import { PluginDataExport } from 'sci-plot/plugins/data-export';
import { PluginContextMenu } from 'sci-plot/plugins/context-menu';

chart.use(PluginDataExport({ autoDownload: true }));
chart.use(PluginContextMenu({
  items: [
    {
      label: 'Export to MATLAB',
      icon: '📊',
      onClick: () => {
        chart.getPlugin('sci-plot-data-export').api.download('matlab');
      }
    }
  ]
}));
```

## See Also

- [Context Menu Demo](/examples/context-menu) - Interactive demo
- [Data Export Plugin](/api/plugin-export#data-export-plugin) - Export functionality
- [Annotations](/api/annotations) - Chart annotations
- [Plugin System](/guide/plugins) - Plugin architecture
