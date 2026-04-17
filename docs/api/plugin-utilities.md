---
title: Utility Plugins
description: Enhance accessibility, localization, and productivity with Keyboard, I18n, and Clipboard plugins.
---

# Utility Plugins

This collection of plugins adds essential quality-of-life features to your Sci Plot application, focusing on accessibility, internationalization, and user productivity.

## Keyboard Shortcuts (`PluginKeyboard`)

Provides a centralized system for managing keyboard interactions.

### Features
- ✅ **Global & Scoped Hotkeys**: Register shortcuts that work anywhere or only when the chart is focused.
- ✅ **Customizable Bindings**: Override any default behavior (zoom, pan, reset).
- ✅ **Conflict Resolution**: Robust handling of overlapping key combinations.

### Basic Usage
```typescript
import { PluginKeyboard } from 'velo-plot/plugins';

await chart.use(PluginKeyboard({
  extraShortcuts: [
    { key: 'Cmd+S', action: () => chart.snapshot.downloadSnapshot() },
    { key: 'R', action: () => chart.resetZoom() }
  ]
}));
```

---

## Internationalization (`PluginI18n`)

Enables localization for date formats, number separators, and UI strings (tooltips, labels).

### Features
- ✅ **Multi-locale Support**: Switch between languages at runtime.
- ✅ **Date/Time Localization**: Respects regional calendar and time formats.
- ✅ **Scientifc Notation**: Localized decimal points and thousand separators.

### Basic Usage
```typescript
import { PluginI18n } from 'velo-plot/plugins';

await chart.use(PluginI18n({
  locale: 'de-DE', // German formatting
  customLocales: {
    'fr-FR': { number: { thousand: ' ', decimal: ',' } }
  }
}));
```

---

## Clipboard Manager (`PluginClipboard`)

Allows users to copy chart data directly to their system clipboard for use in Excel or other office tools.

### Features
- ✅ **Copy-Paste Integration**: Standard `Ctrl+C` support for selected data regions.
- ✅ **Multiple Formats**: Copy as CSV, plain text, or JSON.
- ✅ **Visual Feedback**: Built-in notifications when data is copied successfully.

### Basic Usage
```typescript
import { PluginClipboard } from 'velo-plot/plugins';

await chart.use(PluginClipboard({
  format: 'csv',
  includeHeaders: true,
  notify: true
}));
```

---

## Loading Indicators (`PluginLoading`)

Shows a customizable loading state while data is being fetched or processed.

### Basic Usage
```typescript
import { PluginLoading } from 'velo-plot/plugins';

await chart.use(PluginLoading({
  type: 'spinner',
  color: '#00f2ff',
  message: 'Loading massive dataset...'
}));

// Trigger state
chart.setLoading(true);
```
