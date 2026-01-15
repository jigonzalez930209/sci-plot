# Sankey Diagrams

**Sankey** diagrams are used to visualize flows, where the width of the lines (flows) is proportional to the flow quantity. They are ideal for energy balances, cost flows, or industrial processes.

## Basic Configuration

```typescript
chart.addSeries({
  id: 'sales-flow',
  type: 'sankey',
  data: {
    nodes: [
      { id: 'marketing', name: 'Marketing', color: '#4ecdc4' },
      { id: 'sales', name: 'Sales', color: '#ff6b6b' },
      { id: 'support', name: 'Support', color: '#ffe66d' }
    ],
    links: [
      { source: 'marketing', target: 'sales', value: 5000 },
      { source: 'sales', target: 'support', value: 2000 }
    ]
  },
  style: {
    nodeWidth: 30,
    nodePadding: 20,
    linkOpacity: 0.4
  }
});
```

## Data Structure (`SankeyData`)

### Nodes (`SankeyNode`)
You can define nodes as an array of strings (IDs) or as detailed objects:

```typescript
interface SankeyNode {
  id: string | number;
  name?: string;  // Display name
  color?: string; // Specific color for the node
}
```

### Links (`SankeyLink`)
Define connections between nodes:

```typescript
interface SankeyLink {
  source: string | number; // Source node ID
  target: string | number; // Target node ID
  value: number;           // Flow magnitude
  color?: string;          // Optional color (defaults to source color)
}
```

## Style Properties (`SankeyStyle`)

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `nodeWidth` | `number` | Width of node blocks | `20` |
| `nodePadding` | `number` | Vertical space between nodes | `15` |
| `linkOpacity` | `number` | Flow line opacity | `0.3` |
| `showLabels` | `boolean` | Show node names | `true` |
| `palette` | `string[]` | Automatic colors if not specified | *(Vibrant)* |

## Implementation Notes
- The engine automatically calculates a layered layout (sources on the left, sinks on the right).
- Each flow width scales proportionally to its value relative to the node's total.
- Rendering uses dynamic Bézier curves with premium transition gradients.
