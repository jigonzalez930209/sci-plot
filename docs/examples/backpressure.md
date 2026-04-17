---
title: Backpressure Demo
description: Interactive demo of streaming backpressure handling with buffer management
---

<script setup>
import BackpressureDemo from '../.vitepress/theme/demos/BackpressureDemo.vue'
</script>

# Streaming Backpressure Demo

Watch how the backpressure manager handles high-speed data streams. Adjust the data rate and buffer size to see different overflow strategies in action.

<BackpressureDemo />

## How It Works

When data arrives faster than it can be processed, the buffer fills up. The backpressure manager uses different strategies to handle overflow:

| Strategy | Behavior |
|----------|----------|
| **Drop Oldest** | Removes oldest points to make room for new ones |
| **Drop Newest** | Ignores new points when buffer is full |
| **Sample** | Keeps every Nth point (downsampling) |
| **Pause** | Stops accepting data until buffer drains |

## Health Metrics

- **Buffer Fill** - Current buffer utilization (0-100%)
- **Incoming Rate** - Points arriving per second
- **Outgoing Rate** - Points consumed per second
- **Dropped** - Total points lost due to overflow
- **Health Score** - Overall buffer health (0-100)

## Usage

```typescript
import { 
  BackpressureManager,
  createBackpressureManager,
  createRealtimeBackpressure,
} from 'sci-plot';

// Create a backpressure manager
const bp = createBackpressureManager(10000, 'drop-oldest');

// Or with full options
const bp = new BackpressureManager({
  maxBuffer: 10000,
  strategy: 'drop-oldest',
  warningThreshold: 0.7,    // 70% = warning
  criticalThreshold: 0.9,   // 90% = critical
  onOverflow: (dropped) => {
    console.log(`Dropped ${dropped} points`);
  },
});

// Push incoming data
websocket.onmessage = (data) => {
  bp.push('sensor1', data.points);
};

// Consume for chart updates
setInterval(() => {
  const points = bp.consume('sensor1', 100);
  chart.appendData('series1', points);
}, 16);

// Check health
const health = bp.getHealth();
if (health.status === 'critical') {
  console.warn('Buffer under heavy load!');
}
```

## Strategies Explained

### Drop Oldest (Recommended for Real-time)
```typescript
const bp = createBackpressureManager(5000, 'drop-oldest');
// Best for live monitoring where recent data matters most
```

### Pause (For Lossless Data)
```typescript
const bp = createLosslessBackpressure(100000);
// Pauses stream when full - no data loss
// Requires handling the paused state
```

### Sample (For High-frequency Sensors)
```typescript
const bp = new BackpressureManager({
  maxBuffer: 5000,
  strategy: 'sample',
  sampleRate: 4,  // Keep 1 in every 4 points
});
```

## Circular Buffer

For custom implementations, use the CircularBuffer directly:

```typescript
import { CircularBuffer } from 'sci-plot';

const buffer = new CircularBuffer(1000);

buffer.push(point);           // Add (returns false if full)
buffer.pushOverwrite(point);  // Add, overwrite oldest if full
buffer.shift();               // Remove oldest
buffer.shiftMany(100);        // Remove N oldest
buffer.fillLevel();           // 0.0 - 1.0
buffer.isFull();
buffer.isEmpty();
```

See [Streaming Guide](/guide/realtime) for more on real-time data handling.
