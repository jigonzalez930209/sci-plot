---
title: Sine Waves FFT Analysis
description: Interactive sine wave FFT analysis with multiple frequencies and filter controls.
---

# Sine Waves FFT Analysis

Interactive visualization of **pure sinusoidal signals** at multiple frequencies. Sine waves are the fundamental building blocks of signal analysis - they contain only the fundamental frequency with no harmonics.

<SineWavesChart height="600px" />

## About Sine Waves

### Characteristics
- **Purest waveform**: Contains only the fundamental frequency
- **FFT Spectrum**: Shows a single sharp peak at the fundamental frequency
- **No harmonics**: Unlike square or triangle waves

### Frequencies
This demo shows 5 different frequencies simultaneously:
- **5 Hz** - Low frequency (cyan)
- **12 Hz** - Low-mid frequency (orange)
- **25 Hz** - Mid frequency (purple)
- **47 Hz** - Mid-high frequency (green)
- **80 Hz** - High frequency (pink)

### Interference Pattern
When multiple sine waves are combined, they create complex interference patterns. The white dashed line shows the **combined signal** - the sum of all frequencies.

## Filter Effects

| Filter | Effect on Sine Wave | Use Case |
|--------|---------------------|----------|
| **Low Pass** | Attenuates high frequencies | Noise reduction |
| **High Pass** | Attenuates low frequencies | Remove DC offset |
| **Band Pass** | Isolates specific frequencies | Signal extraction |

## Mathematical Definition

```
y(t) = A × sin(2πft + φ)
```

Where:
- `A` = Amplitude
- `f` = Frequency (Hz)
- `t` = Time (seconds)
- `φ` = Phase (radians)
