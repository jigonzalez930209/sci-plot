---
title: Square Waves FFT Analysis
description: Interactive square wave FFT analysis showing odd harmonics and filter effects.
---

# Square Waves FFT Analysis

Interactive visualization of **square waves** at multiple frequencies. Square waves are characterized by their abrupt transitions and contain a rich spectrum of **odd harmonics**.

<SquareWavesChart height="600px" />

## About Square Waves

### Characteristics
- **Sharp transitions**: Instant switching between +1 and -1
- **Digital-like**: Represents binary signals (ON/OFF)
- **Rich harmonics**: Contains all odd harmonics (3f, 5f, 7f, 9f...)

### Frequencies
This demo shows 3 different frequencies:
- **3 Hz** - Low frequency (orange)
- **8 Hz** - Mid frequency (yellow)
- **20 Hz** - Higher frequency (lime)

### Harmonic Content

The FFT spectrum of a square wave shows peaks at:
- **Fundamental (f)**: The base frequency
- **3rd harmonic (3f)**: 1/3 amplitude
- **5th harmonic (5f)**: 1/5 amplitude
- **7th harmonic (7f)**: 1/7 amplitude
- And so on...

The amplitude of each harmonic decreases as **1/n** where n is the harmonic number.

## Why Only Odd Harmonics?

Due to the **symmetry** of the square wave (half-wave symmetry), all even harmonics (2f, 4f, 6f...) cancel out, leaving only odd harmonics.

## Filter Effects

| Filter | Effect on Square Wave | Visual Result |
|--------|----------------------|---------------|
| **Low Pass** | Removes harmonics, rounds edges | Smoother, more sine-like |
| **High Pass** | Removes fundamental, keeps edges | Spike-like |
| **Band Pass** | Isolates specific harmonics | Modified shape |

## Mathematical Definition

Square wave using Fourier series:
```
y(t) = (4/π) × [sin(ωt) + sin(3ωt)/3 + sin(5ωt)/5 + ...]
```

Where ω = 2πf (angular frequency)
