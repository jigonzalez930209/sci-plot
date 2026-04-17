---
title: Theme Editor Demo
description: Visual theme editor for customizing chart appearance with live preview
---

<script setup>
import ThemeEditorDemo from '../.vitepress/theme/demos/ThemeEditorDemo.vue'
</script>

# Theme Editor Demo

Customize your chart's appearance with the visual theme editor. Click a preset to apply it, or fine-tune individual colors. Changes are reflected in the live preview instantly.

<ThemeEditorDemo />

## Available Presets

| Preset | Description |
|--------|-------------|
| **Dark** | Classic dark theme with cyan accents |
| **Light** | Clean white background for publications |
| **Midnight** | Deep blue dark theme |
| **Scientific** | Professional theme for papers |
| **Electrochem** | Optimized for electrochemical data |
| **High Contrast** | Maximum visibility for accessibility |

## Using the Theme Editor

### 1. Apply a Preset
Click any preset button to instantly apply a complete color scheme.

### 2. Customize Colors
Fine-tune individual colors using the color pickers:
- **Background** - Main chart background
- **Series 1-3** - Default colors for your data
- **Grid & Axes** - Grid lines and labels

### 3. Export
Click "Export JSON" to copy your theme configuration. Use it in your code:

```typescript
import { createChart, createTheme, DARK_THEME } from 'velo-plot';

// Use a preset
const chart = createChart({
  theme: 'dark',  // or 'light', 'midnight', etc.
});

// Or create a custom theme
const myTheme = createTheme(DARK_THEME, {
  backgroundColor: '#1a1a2e',
  grid: { majorColor: 'rgba(255,255,255,0.1)' },
  xAxis: { labelColor: '#a0aec0' },
});

const chart = createChart({
  theme: myTheme,
});
```

## Theme API

```typescript
import { 
  createThemeEditor, 
  getPresetTheme,
  getPresetNames,
  THEME_PRESETS 
} from 'velo-plot';

// Create embedded theme editor
const editor = createThemeEditor(container, {
  baseTheme: 'Dark',
  livePreview: true,
  onChange: (theme) => {
    chart.setTheme(theme);
  },
});

// Get a preset by name
const darkTheme = getPresetTheme('Dark');

// List all preset names
console.log(getPresetNames());
// ['Dark', 'Light', 'Midnight', 'Scientific', 'Electrochemistry', 'High Contrast']
```

See [Theming API](/api/themes) for more details.
