---
title: Waterfall Charts
description: Visualize cumulative effects with bridge charts for financial and business analysis
---

<script setup>
import WaterfallDemo from '../.vitepress/theme/demos/WaterfallDemo.vue'
</script>

# Waterfall Charts

Waterfall charts (also known as bridge charts or cascade charts) visualize the cumulative effect of sequential positive and negative values. They're essential for financial analysis, budget tracking, and understanding how an initial value is affected by a series of changes.

<WaterfallDemo height="480px" />

## Key Features

### Color-Coded Bars

| Bar Type | Color | Description |
|----------|-------|-------------|
| **Positive** | 🟢 Green | Increases the running total |
| **Negative** | 🔴 Red | Decreases the running total |
| **Subtotal** | 🔵 Blue | Shows cumulative sum at key points |

### Connector Lines

Optional horizontal lines connect consecutive bars, making it easy to follow the running total across the chart.

## Usage

```typescript
import { createChart } from 'sci-plot'

const chart = createChart({ container: '#chart' })

// Financial waterfall data
const categories = ['Starting', 'Revenue', 'Costs', 'Tax', 'Ending']
const values = [1000, 500, -300, -80, 0]
const isSubtotal = [false, false, false, false, true]

chart.addSeries({
  id: 'finance-waterfall',
  type: 'waterfall',
  data: {
    x: new Float32Array([1, 2, 3, 4, 5]),
    y: new Float32Array(values)
  },
  style: {
    barWidth: 0.6,
    positiveColor: '#22c55e',
    negativeColor: '#ef4444',
    subtotalColor: '#3b82f6',
    connectorColor: '#64748b',
    showConnectors: true,
    isSubtotal: isSubtotal
  }
})
```

## Style Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `barWidth` | number | 0.6 | Width of each bar (0-1 scale) |
| `positiveColor` | string | '#22c55e' | Color for positive values |
| `negativeColor` | string | '#ef4444' | Color for negative values |
| `subtotalColor` | string | '#3b82f6' | Color for subtotal bars |
| `connectorColor` | string | '#64748b' | Color for connector lines |
| `showConnectors` | boolean | true | Show/hide connector lines |
| `isSubtotal` | boolean[] | [] | Mark specific bars as subtotals |

## Use Cases

### 1. Revenue Analysis

Track how revenue flows from gross income to net profit:

```
Gross Revenue → + Sales → - Refunds → - Discounts → Net Revenue
```

### 2. Budget Tracking

Monitor project budget consumption across phases:

```
Initial Budget → - Phase 1 → - Phase 2 → + Contingency → Final Budget
```

### 3. Inventory Management

Visualize stock movements:

```
Opening Stock → + Received → + Returns → - Sold → - Damaged → Closing Stock
```

### 4. Variance Analysis

Compare actual vs. budget with contribution analysis:

```
Budget → + Volume → + Price → - Cost → - Mix → Actual
```

## Subtotal Bars

Subtotal bars span from the baseline (0) to the current running total. They're useful for:

- Showing intermediate totals at key milestones
- Displaying the final cumulative result
- Resetting the visual baseline after a group of changes

```typescript
const isSubtotal = [false, false, false, true, false, false, true]
// Third and last bars will be subtotals
```

## Performance

Waterfall charts are rendered using WebGL with separate buffers for:

- **Positive bars**: Green triangles (GL_TRIANGLES)
- **Negative bars**: Red triangles (GL_TRIANGLES)  
- **Subtotal bars**: Blue triangles (GL_TRIANGLES)
- **Connectors**: Gray lines (GL_LINES)

This approach enables smooth rendering of hundreds of categories while maintaining 60fps interaction.

## Related

- [Bar Charts](/examples/bar-charts) - Standard bar chart visualization
- [Stacked Charts](/examples/stacked-charts) - Stacked area and bar charts
- [Financial Indicators](/examples/indicators) - Technical analysis indicators
