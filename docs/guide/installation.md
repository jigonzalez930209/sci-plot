# Installation

## Package Manager

```bash
# npm
npm install sci-plot

# pnpm
pnpm add sci-plot

# yarn
yarn add sci-plot
```

## Imports

### ES Modules

```typescript
// Core API
import { createChart } from 'sci-plot';

// Specialized Plugins 
import { PluginTools, PluginAnalysis, PluginAnnotations } from 'sci-plot';

// React components
import { SciPlot, useSciPlot } from 'sci-plot';

// Built-in Themes
import { MIDNIGHT_THEME, DARK_THEME, LIGHT_THEME } from 'sci-plot';
```

### TypeScript Usage

Sci Plot is written in TypeScript and includes full type definitions.

```typescript
import { 
  createChart, 
  type Chart, 
  type ChartOptions,
  type SeriesData 
} from 'sci-plot';

const options: ChartOptions = {
  container: document.getElementById('chart')!,
  xAxis: { label: 'Time (s)', auto: true },
  yAxis: { label: 'Voltage (mV)', auto: true },
};

const chart: Chart = createChart(options);
```

## Peer Dependencies

For React usage, ensure you have React 16.8+ installed:

```bash
npm install react react-dom
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

WebGL 2.0 is required for hardware acceleration. Most modern browsers support this out of the box.

## Next Steps

- **[Quick Start](/guide/quick-start)** - Create your first interactive chart.
- **[Plugin System](/guide/plugins)** - Learn how to extend the chart with tools.
- **[Advanced Analysis](/examples/analysis-advanced)** - Deep dive into scientific features.
