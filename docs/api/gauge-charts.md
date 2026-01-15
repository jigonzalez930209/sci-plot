# Gauge Charts

**Gauge** charts (or dials) are used to visualize a single value within a defined range, ideal for status metrics, speed, temperature, or any critical KPI.

## Basic Configuration

To create a Gauge, add a series with type `'gauge'`:

```typescript
chart.addSeries({
  id: 'temperature-gauge',
  type: 'gauge',
  data: {
    value: 75,
    min: 0,
    max: 100
  },
  style: {
    label: 'Temperature °C',
    needleColor: '#ff5500',
    ranges: [
      { from: 0, to: 60, color: '#4caf50' },   // Green
      { from: 60, to: 85, color: '#ffeb3b' },  // Yellow
      { from: 85, to: 100, color: '#f44336' }  // Red
    ]
  }
});
```

## Style Properties (`GaugeStyle`)

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `needleColor` | `string` | Needle color | `#333` |
| `needleWidth` | `number` | Needle width in pixels | `3` |
| `radius` | `number` | Dial radius (0 to 1 of available area) | `0.8` |
| `startAngle` | `number` | Start angle in degrees | `135` |
| `endAngle` | `number` | End angle in degrees | `405` |
| `showValue` | `boolean` | Show numerical value in center | `true` |
| `valueColor` | `string` | Value text color | `#fff` |
| `valueSize` | `number` | Value font size | `24` |
| `ranges` | `GaugeRange[]` | Color segments in the arc | `[]` |

### Range Definition (`GaugeRange`)

```typescript
interface GaugeRange {
  from: number;   // Range start (value)
  to: number;     // Range end (value)
  color: string;  // Segment color
  label?: string; // Optional label
}
```

## Data Updates

To animate or change the gauge value:

```typescript
chart.updateSeries('temperature-gauge', {
  value: 82.5
});
```

The engine automatically applies a smooth transition if animations are enabled.
