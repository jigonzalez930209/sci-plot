# Example: Gauge & Sankey Diagrams

This example demonstrates how to implement Gauge (for individual metrics) and Sankey (for data flows) visualizations in Sci Plot.

<ProcessMonitoringDemo />

## Gauge Chart (KPIs)
Beautiful KPI visualization.

The Gauge chart is ideal for showing a single value within a predefined range.

```typescript
import { SciPlot } from 'velo-plot';

const chart = new SciPlot({
  container: document.getElementById('chart-container'),
  theme: 'midnight'
});

// Add a Gauge to monitor Speed
chart.addSeries({
  id: 'speed-gauge',
  type: 'gauge',
  data: {
    value: 65,
    min: 0,
    max: 120
  },
  style: {
    label: 'Speed (km/h)',
    needleColor: '#00ccff',
    ranges: [
      { from: 0, to: 60, color: 'rgba(76, 175, 80, 0.4)' },
      { from: 60, to: 90, color: 'rgba(255, 235, 59, 0.4)' },
      { from: 90, to: 120, color: 'rgba(244, 67, 54, 0.4)' }
    ]
  }
});

// Simulate data update
setInterval(() => {
  const current = chart.getSeries('speed-gauge').getGaugeData().value;
  const next = current + (Math.random() - 0.5) * 10;
  chart.updateSeries('speed-gauge', { value: next });
}, 1000);
```

## Sankey Diagram (Flows)

The Sankey diagram visualizes how a magnitude is distributed among different categories.

```typescript
// Add a Sankey diagram for energy flow
chart.addSeries({
  id: 'energy-flow',
  type: 'sankey',
  data: {
    nodes: [
      { id: 'solar', name: 'Solar', color: '#ffe66d' },
      { id: 'grid', name: 'Power Grid', color: '#4ecdc4' },
      { id: 'house', name: 'Home', color: '#ff6b6b' },
      { id: 'ev', name: 'Electric Vehicle', color: '#1a535c' },
      { id: 'battery', name: 'Battery', color: '#f7fff7' }
    ],
    links: [
      { source: 'solar', target: 'house', value: 3000 },
      { source: 'solar', target: 'battery', value: 1500 },
      { source: 'grid', target: 'house', value: 1000 },
      { source: 'house', target: 'ev', value: 2000 }
    ]
  },
  style: {
    nodeWidth: 25,
    nodePadding: 15,
    linkOpacity: 0.5,
    showLabels: true
  }
});
```

[View Gauge API Reference](/api/gauge-charts) | [View Sankey API Reference](/api/sankey-diagrams)
