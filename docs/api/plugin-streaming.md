---
title: Real-Time Streaming Plugin
description: Connect your chart to high-frequency data sources via WebSockets with built-in backpressure management.
---

# Real-Time Streaming Plugin

The Streaming plugin provides a robust foundation for building real-time dashboards and monitoring systems. It handles the complexities of network connections, data parsing, and high-frequency updates while ensuring the chart remains responsive.

## Features

- ✅ **WebSocket Integration**: Connect directly to streaming APIs with automatic reconnection.
- ✅ **Backpressure Management**: Buffer and throttle incoming data if it arrives faster than the rendering loop can handle.
- ✅ **Message Parsing**: Extensible architecture for parsing binary or JSON protocols.
- ✅ **Mock Streaming**: Generate synthetic data streams for local development and testing.
- ✅ **Binary Protocol Support**: Optimized for high-throughput scientific data.

## Basic Usage

```typescript
import { createChart, PluginStreaming } from 'scichart-engine';

const chart = createChart({ container });
await chart.use(PluginStreaming());

// Connect to a WebSocket source
const stream = chart.streaming.createWebSocketStream('ws://api.mysensor.com/v1/data');

// Link stream to a specific series
stream.on('message', (data) => {
  chart.updateSeries('sensor-1', data, { append: true });
});

stream.connect();
```

## Backpressure Management

When data arrives at thousands of points per second, the `BackpressureManager` helps maintain a stable frame rate.

```typescript
import { createBackpressureManager } from 'scichart-engine/streaming';

const bp = createBackpressureManager({
  maxBufferSize: 5000,
  overflowStrategy: 'drop-oldest'
});

// The manager will buffer points and release them in chunks aligned with the render loop
chart.on('render', () => {
  const points = bp.flush();
  if (points.length > 0) {
    chart.updateSeries('sensor-1', points, { append: true });
  }
});
```

## Mock Streaming for Testing

Quickly test your UI without a real backend.

```typescript
const mockStream = chart.streaming.createMockStream({
  type: 'sine',
  frequency: 1,
  pointsPerSecond: 60,
  noise: 0.1
});

mockStream.on('data', (point) => {
  chart.updateSeries('test-data', point, { append: true });
});

mockStream.start();
```

## Configuration Options

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `url` | `string` | `undefined` | Default WebSocket URL. |
| `backpressure.maxBufferSize` | `number` | `10000` | Max points to buffer before applying strategy. |
| `backpressure.overflowStrategy` | `string` | `'drop-oldest'` | How to handle overflows: `'drop-oldest'`, `'drop-newest'`, or `'error'`. |

## See Also
- [Data Virtualization](/api/plugin-virtualization) - Manage memory for long-running streams.
- [Snapshot Plugin](/api/plugin-export) - Capture anomalies recorded during streaming.
