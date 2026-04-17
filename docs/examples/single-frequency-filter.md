---
title: Single Frequency Filter
description: Removing periodic noise and interference with IIR Notch filters.
---

# Single Frequency Filter

The **Single Frequency Filter** (or Notch Filter) is a specialized digital filter designed to attenuate a very narrow band of frequencies, effectively "notching out" a single periodic component from a signal.

This is extremely useful for:
- Removing **50Hz/60Hz power line noise** from sensor data.
- Eliminating fixed-frequency acoustic or electrical interference.
- Restoring signals corrupted by a single-tone oscillator.

## Interactive Demo

The demonstration below uses a **High-Performance Toggle Interface** to switch between Time and Frequency domains within the same chart instance:

1. **Oscilloscope Mode**: Observe the sum of 3 base frequencies vs the interference-corrupted signal.
2. **Spectrum Mode**: Visualize the frequency components and see the **Notch Filter** create a surgical "hole" at your target frequency.

<div class="custom-block tip">
  <p class="custom-block-title">Try it out</p>
  Move the <strong>Target Frequency</strong> slider to change the interference frequency, and watch how the filter adapts to remove it! Use <strong>Bandwidth</strong> to control how sharp the filter is.
</div>

<style scoped>
.custom-block.tip {
  background: rgba(0, 242, 255, 0.05) !important;
  border-color: #00f2ff !important;
}
</style>

<SingleFreqFilterDemo height="500px" />

## Implementation

The filter is implemented as a **2nd Order IIR Notch Filter**. It provides a zero-phase frequency response when applied using the `filtfilt` (forward-backward) technique, ensuring no time-shifting of your data.

### API Usage

You can use the filter as a standalone function or through the `PluginAnalysis`.

#### 1. Standalone Function

```typescript
import { singleFrequencyFilter } from 'velo-plot';

const filteredData = singleFrequencyFilter(noisyBuffer, {
  frequency: 50,      // Hz to remove
  sampleRate: 1000,   // Hz
  bandwidth: 1.0      // Hz (width of the notch)
});
```

#### 2. Via Analysis Plugin

```typescript
import { PluginAnalysis } from 'velo-plot/plugins';

chart.use(PluginAnalysis());

// Later in your code
const filtered = chart.analysis.singleFrequencyFilter(data, {
  frequency: 60,
  sampleRate: 500
});
```

## How it Works

The filter uses a transfer function in the Z-domain:

$$H(z) = \frac{1 - 2\cos(\omega_0)z^{-1} + z^{-2}}{1 - 2r\cos(\omega_0)z^{-1} + r^2z^{-2}}$$

Where:
- $\omega_0 = 2\pi \frac{f}{f_s}$ is the normalized angular frequency.
- $r$ is the pole radius (calculated from bandwidth), which determines the sharpness of the notch.
- $f$ is the target frequency.
- $f_s$ is the sample rate.

The numerator creates zeros on the unit circle at $\omega_0$ (perfect attenuation), while the denominator creates poles very close to those zeros to keep the rest of the frequency response flat.
