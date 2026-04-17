---
title: Cyclic Voltammetry Simulation
description: Real-time simulation of cyclic voltammetry with configurable cycles
---

# Cyclic Voltammetry Simulation

This example demonstrates a real-time simulation of cyclic voltammetry (CV), a common electrochemical technique. The simulation showcases the engine's ability to handle streaming data without X-axis shifting issues.

## Interactive Demo

Configure the number of cycles and watch the CV curve being drawn in real-time. Notice how the X-axis remains stable during streaming while the Y-axis auto-scales smoothly.

<ChartDemo type="cyclic-voltammetry" height="500px" />

## Key Features

- **Stable X-axis**: No visual shifting during data streaming
- **Auto-scaling Y-axis**: Smoothly adjusts to current values
- **Direction indicator**: Visual arrow showing the streaming direction and trend
- **Configurable cycles**: Run 1, 5, 10 cycles or infinite mode
- **Realistic simulation**: Includes peak currents and hysteresis
- **High performance**: Smooth 60 FPS rendering during acquisition

## Cyclic Voltammetry Basics

In CV, the potential is swept linearly between two values:
- **Forward sweep**: -1000 mV → +1000 mV
- **Reverse sweep**: +1000 mV → -1000 mV

The current response reveals information about electrochemical reactions occurring at the electrode surface.

## Basic Usage

```typescript
import { createChart } from '@velo-plot/engine';

const chart = createChart({
  container: document.getElementById('chart'),
  xAxis: { 
    label: 'Potential (mV)',
    auto: true  // Auto-scale enabled
  },
  yAxis: { 
    label: 'Current (µA)',
    auto: true  // Auto-scale enabled
  }
});

chart.addSeries({
  id: 'cv',
  type: 'line',
  data: { x: new Float32Array(0), y: new Float32Array(0) },
  color: '#2196F3',
  strokeWidth: 2
});

// CV parameters
const scanRate = 100; // mV/s
const vStart = -1000;
const vEnd = 1000;
const cycles = 10;

// Simulate CV data acquisition
let time = 0;
let cycle = 0;
let direction = 1; // 1 = forward, -1 = reverse
let potential = vStart;

const interval = setInterval(() => {
  // Update potential
  potential += direction * scanRate * 0.016; // 60 FPS
  
  // Reverse direction at limits
  if (potential >= vEnd) {
    direction = -1;
  } else if (potential <= vStart) {
    direction = 1;
    cycle++;
    if (cycle >= cycles) {
      clearInterval(interval);
      return;
    }
  }
  
  // Simulate current response (simplified Randles-Sevcik)
  const E0 = 0; // Formal potential
  const n = 1; // Electrons transferred
  const F = 96485; // Faraday constant
  const R = 8.314; // Gas constant
  const T = 298; // Temperature (K)
  
  const eta = (potential - E0) * n * F / (R * T);
  const current = 100 * (
    Math.exp(0.5 * eta) / (1 + Math.exp(eta)) -
    Math.exp(-0.5 * eta) / (1 + Math.exp(-eta))
  );
  
  // Add noise
  const noise = (Math.random() - 0.5) * 2;
  
  // Append data point
  chart.appendData('cv', 
    new Float32Array([potential]),
    new Float32Array([current + noise])
  );
  
  time += 0.016;
}, 16); // ~60 FPS
```

## Configuration Options

| Parameter | Description | Typical Values |
|-----------|-------------|----------------|
| **Scan Rate** | Speed of potential sweep | 10-1000 mV/s |
| **Potential Range** | Start and end potentials | -1.5 to +1.5 V |
| **Cycles** | Number of complete cycles | 1-10 (or infinite) |
| **Sample Rate** | Data points per second | 60-1000 Hz |

## Advanced Features

### Multiple Cycles with Different Scan Rates

```typescript
// First cycle: slow scan
runCVCycle(chart, 'cv', 50, -1000, 1000);

// Second cycle: fast scan
setTimeout(() => {
  runCVCycle(chart, 'cv', 200, -1000, 1000);
}, 40000);
```

### Peak Detection

```typescript
chart.use(PluginAnalysis());

// After CV is complete, find peaks
const peaks = chart.analysis.findPeaks('cv', {
  prominence: 10,
  minDistance: 100
});

console.log('Anodic peak:', peaks[0]);
console.log('Cathodic peak:', peaks[1]);
```

### Direction Indicator Plugin

The demo includes a **DirectionIndicator** plugin that **replaces the last data point** with an arrow indicating the **continuous direction** of the streaming data. The arrow renders every frame for smooth, jump-free visualization of the data trend.

```typescript
import { DirectionIndicatorPlugin } from '@velo-plot/engine/plugins';

// Add the direction indicator plugin
await chart.use(DirectionIndicatorPlugin({
  seriesId: 'cv',           // Series to track
  sampleSize: 15,           // Points used for regression calculation
  historySize: 20,          // Points used for smoothing (moving average)
  color: '#FF9800',         // Arrow color (orange)
  size: 25,                 // Triangle size in pixels
  minVelocity: 0.1,         // Minimum velocity to show arrow (pixels/point)
  idleTimeout: 5000         // Hide arrow after 5s of inactivity (ms)
}));
```

**Key features:**
- **Smoothed position**: Uses moving average of last 30 points for fluid movement
- **Smoothed angle**: Both position and direction are smoothed to eliminate jitter
- **Continuous direction**: Uses the actual calculated angle (not discretized into 8 directions)
- **Ultra-smooth rendering**: Updates every frame with no jumping or stuttering
- **Real-time tracking**: Follows the data as it streams, showing forward/reverse sweeps
- **Linear regression**: Calculates direction from the last N points in pixel space for accurate representation

### Export CV Data

```typescript
// Export to CSV for analysis
const csvData = chart.exportToCSV({
  series: ['cv'],
  delimiter: ',',
  includeHeaders: true
});

// Download file
const blob = new Blob([csvData], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'cv_data.csv';
a.click();
```

## Performance Notes

This example demonstrates the fix for X-axis shifting during streaming:

- **Before fix**: X-axis would recalculate padding on every data point, causing visual jumps
- **After fix**: X-axis remains stable, only Y-axis auto-scales during streaming
- **Result**: Smooth, professional visualization suitable for real-time acquisition

The engine uses `autoScaleYOnly()` internally during streaming to prevent X-axis recalculation while maintaining proper Y-axis scaling.

## Real-World Applications

- **Electrochemistry Research**: Real-time monitoring of redox reactions
- **Battery Testing**: Characterization of electrode materials
- **Sensor Development**: Testing electrochemical sensors
- **Quality Control**: Automated CV analysis in production

## Technical Details

### Why X-axis Stability Matters

In electrochemical experiments, the X-axis (potential) is controlled by the instrument and has a known, fixed range. Constantly recalculating the X-axis bounds during streaming causes:

1. **Visual discomfort**: The entire plot shifts horizontally
2. **Analysis difficulty**: Hard to track specific features
3. **Unprofessional appearance**: Looks like a software bug

### The Solution

The engine now intelligently handles auto-scaling during streaming:

```typescript
// During appendData():
if (streaming && !autoScroll) {
  // Only auto-scale Y-axis
  chart.autoScaleYOnly();
  
  // X-axis only updates if data significantly exceeds current range
  if (dataExceedsRange(newBounds, currentBounds, threshold: 0.1)) {
    updateXAxis();
  }
}
```

This provides the best of both worlds: responsive Y-axis scaling with stable X-axis positioning.

## See Also

- [Real-time Streaming](/examples/realtime) - General streaming data patterns
- [Analysis Tools](/examples/analysis) - Peak finding and curve fitting
- [Multiple Y-Axes](/examples/multiple-y-axes) - For multi-channel experiments
