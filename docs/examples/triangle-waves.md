---
title: Triangle Waves FFT Analysis
description: Interactive triangle wave FFT analysis showing 1/n² harmonic decay.
---

# Triangle Waves FFT Analysis

Interactive visualization of **triangle waves** at multiple frequencies. Triangle waves feature linear ramps and contain odd harmonics with faster decay than square waves.

<TriangleWavesChart height="600px" />

## About Triangle Waves

### Characteristics
- **Linear ramps**: Smooth linear transitions between peaks
- **Continuous**: No abrupt jumps (unlike square waves)
- **Odd harmonics**: Same harmonic structure as square waves but with different amplitudes

### Frequencies
This demo shows 3 different frequencies:
- **4 Hz** - Low frequency (cyan)
- **11 Hz** - Mid frequency (purple)
- **28 Hz** - Higher frequency (pink)

### Harmonic Content

The FFT spectrum of a triangle wave shows peaks at:
- **Fundamental (f)**: The base frequency
- **3rd harmonic (3f)**: 1/9 amplitude (1/3²)
- **5th harmonic (5f)**: 1/25 amplitude (1/5²)
- **7th harmonic (7f)**: 1/49 amplitude (1/7²)

The amplitude decreases as **1/n²** - much faster than square waves!

## Triangle vs Square Waves

| Property | Square Wave | Triangle Wave |
|----------|-------------|---------------|
| Transitions | Instant | Linear |
| Harmonic decay | 1/n | 1/n² |
| Smoothness | Sharp | Smooth |
| Bandwidth | Wide | Narrower |

## Filter Effects

| Filter | Effect on Triangle Wave | Visual Result |
|--------|------------------------|---------------|
| **Low Pass** | Rounds peaks slightly | Even smoother |
| **High Pass** | Sharpens transitions | More angular |
| **Band Pass** | Isolates fundamentals | Sine-like |

## Mathematical Definition

Triangle wave using Fourier series:
```
y(t) = (8/π²) × [sin(ωt) - sin(3ωt)/9 + sin(5ωt)/25 - ...]
```

Note the alternating signs and 1/n² decay pattern.

## Why 1/n² Decay?

The faster harmonic decay is because triangle waves are **continuous** - they don't have the sharp discontinuities of square waves. Sharp edges require more high-frequency content to reproduce, hence square waves have stronger harmonics.
