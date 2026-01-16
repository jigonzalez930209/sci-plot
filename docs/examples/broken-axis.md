---
title: Broken Axis Demo
---

# Broken Axis Demo

The **Broken Axis Plugin** is essential for datasets that have large gaps in their range. Instead of showing long horizontal lines with no data, you can "break" the axis to skip those parts.

## Interactive Demo

<ClientOnly>
  <BrokenAxisDemo />
</ClientOnly>

## Key Concepts

- **Discontinuous Mapping**: The plugin treats the x-axis as a series of connected "visible segments".
- **Visual indicators**: Specific symbols are drawn over the plot area to indicate where the axis is broken.
- **Coordinate Transformation**: Mouse events (tooltips, crosshairs) and viewport calculations automatically jump over the breaks.

## Configuration

In this demo, the axis is configured with two breaks:

```typescript
chart.use(PluginBrokenAxis({
  axes: {
    default: {
      breaks: [
        { start: 110, end: 490, symbol: 'diagonal', visualRatio: 0.03 },
        { start: 610, end: 1190, symbol: 'zigzag', visualRatio: 0.03 }
      ],
      symbolColor: '#ff00ff'
    }
  }
}));
```

## Advantages

1.  **Readability**: Focus on different clusters of data side-by-side.
2.  **Comparison**: Bring distant ranges into the same view for easier visual comparison.
3.  **Space Efficiency**: Don't waste pixels on regions where nothing happened.

## API Control

You can enable or disable breaks at runtime without re-creating the entire chart:

```typescript
// Toggle effect
chart.brokenAxis.setEnabled(true | false);

// Add break on the fly
chart.brokenAxis.addBreak('default', {
    start: 2000,
    end: 3000,
    symbol: 'wave'
});
```

> [!WARNING]
> When using broken axes, physical distance between points on screen no longer represents a linear scale of data units across the breaks.
 pulpito
