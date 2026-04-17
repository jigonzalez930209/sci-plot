---
title: Inverted Axis Demo
description: Display descending scientific axes such as IR wavenumbers using invertAxis.
---

# Inverted Axis Demo

This example shows an IR-style spectrum where wavenumber descends from left to right while the data stays in ascending order.

<InvertedAxisDemo />

## Why Invert an Axis

- IR spectra are conventionally displayed with high wavenumbers on the left.
- Many scientific plots use descending domains for readability or domain convention.
- The data itself does not need to be reversed; only the rendered axis direction changes.

## Configuration

```typescript
import { createChart } from 'sci-plot'

const chart = createChart({
  container: document.getElementById('chart'),
  xAxis: {
    label: 'Wavenumber (cm^-1)',
    auto: true,
    invertAxis: true,
  },
  yAxis: {
    label: 'Transmittance (%)',
    auto: true,
  },
})
```

`invertAxis` reverses the rendered direction and interaction coordinates, so cursor readouts and tooltips remain correct.

## Typical Uses

- Infrared and Raman spectra
- Depth or elevation profiles
- Pressure and time-to-failure plots
- Any domain that should read high-to-low on screen