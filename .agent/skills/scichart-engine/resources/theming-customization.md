# Theming & Design System

SciChart Engine uses a powerful CSS-in-JS design system that allows for global themes and granular overrides.

## Predefined Themes
- `midnight`: High-contrast blue-on-black (Standard for Lab software).
- `electrochemistry`: Professional teal and gray tones.
- `dark`: Minimalist dark mode.
- `light`: Clean, high-readability light mode.

## Creating a Custom Theme
Use `createTheme` to define a brand-new aesthetic.

```typescript
import { createTheme } from 'scichart-engine';

const myCustomTheme = createTheme({
  name: 'cyberpunk',
  backgroundColor: '#0d0221',
  grid: {
    color: 'rgba(255, 0, 255, 0.1)',
    width: 0.5
  },
  axis: {
    color: '#00ffcc',
    labelColor: '#00ffcc',
    labelFont: '12px "Orbitron", sans-serif'
  }
});

chart.setTheme(myCustomTheme);
```

## Overriding Specific Elements
You can toggle or tweak specific visual elements without changing the entire theme.

```typescript
chart.setTheme({
  grid: { majorVisible: true, minorVisible: false },
  background: 'transparent' // Useful for overlaying on UI backgrounds
});
```

## CSS Variables Support
The engine can read from your application's CSS variables, allowing the chart to automatically follow your system-wide dark/light mode.

```typescript
const cssTheme = createTheme({
  backgroundColor: 'var(--bg-primary)',
  axis: {
    color: 'var(--text-secondary)',
    labelColor: 'var(--text-primary)'
  }
});
```
