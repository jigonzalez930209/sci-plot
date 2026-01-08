---
title: FFT Waveforms (Sine, Square, Triangle)
description: Interactive FFT demo with multiple waveform types, filters, and domain switching.
---

# FFT Analysis: Waveforms Comparison

Interactive demonstration of **Fast Fourier Transform (FFT)** analysis on different waveform types. Each chart shows multiple frequencies with their interference patterns, and you can switch between time and frequency domains, and apply different filters in real-time.

## Sine Waves Analysis

Pure sinusoidal signals show single sharp peaks at their fundamental frequencies in the FFT spectrum. This is the "purest" waveform with no harmonics.

<SineWavesChart height="550px" />

---

## Square Waves Analysis

Digital-like signals with sharp transitions. In the FFT spectrum, square waves show the **fundamental frequency plus odd harmonics** (3f, 5f, 7f...) with amplitudes decreasing as 1/n.

<SquareWavesChart height="550px" />

---

## Triangle Waves Analysis

Linear ramp waveforms. Similar to square waves, triangle waves contain **only odd harmonics**, but their amplitudes decay faster as **1/n²**, making them smoother.

<TriangleWavesChart height="550px" />

---

## Key Concepts

### Waveform Characteristics

| Waveform | Time Domain | FFT Spectrum |
|----------|-------------|--------------|
| **Sine** | Smooth oscillation | Single peak at fundamental |
| **Square** | Abrupt ±1 transitions | Odd harmonics (1/n decay) |
| **Triangle** | Linear ramps | Odd harmonics (1/n² decay) |

### Filter Effects

- **Low Pass**: Removes high-frequency components, smoothing the waveform. In FFT, attenuates higher frequencies.
- **High Pass**: Removes low-frequency components and DC offset. Emphasizes transitions and edges.
- **Band Pass**: Allows only a specific frequency band through. Useful for isolating specific signals.

### Understanding Harmonics

When you switch to FFT mode for **square** or **triangle** waves, notice:
- Each fundamental frequency (3Hz, 8Hz, 20Hz etc.) produces peaks at 3×, 5×, 7× its frequency
- Square wave harmonics are stronger than triangle wave harmonics
- Applying low-pass filter reduces harmonic content

## Technical Details

- **Sample Rate**: 512 Hz
- **Samples**: 1024 (power of 2 for efficient FFT)
- **Nyquist Frequency**: 256 Hz
- **Frequency Resolution**: 0.5 Hz per bin

## API Reference

```typescript
import { analyzeSpectrum } from 'scichart-engine/analysis'

const signal = new Float32Array(1024)
// ... fill signal data

const result = analyzeSpectrum(signal, 512)
// result.frequency: Float32Array of frequency bins
// result.magnitude: Float32Array of magnitudes
// result.phase: Float32Array of phase angles
```

### Generating Different Waveforms

```typescript
// Sine wave
const sine = (freq: number, t: number) => Math.sin(2 * Math.PI * freq * t)

// Square wave
const square = (freq: number, t: number) => Math.sign(Math.sin(2 * Math.PI * freq * t))

// Triangle wave
const triangle = (freq: number, t: number) => {
  const phase = ((2 * Math.PI * freq * t) % (2 * Math.PI)) / (2 * Math.PI)
  return phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase
}
```

