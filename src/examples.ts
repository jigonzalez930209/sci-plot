/**
 * Sci Plot - Usage Example
 *
 * This file demonstrates how to use the Sci Plot
 * for electrochemical data visualization.
 */

import { createChart } from "./index";
import { formatWithPrefix, detectCycles, analyzeSpectrum } from "./plugins/analysis";

/**
 * Example: Basic CV Plot
 */
export function exampleBasicCV() {
  // Get canvas element
  const container = document.getElementById("chart") as HTMLDivElement;

  // Create chart instance
  const chart = createChart({
    container,
    xAxis: {
      scale: "linear",
      label: "E / V",
      auto: true,
    },
    yAxis: {
      scale: "linear",
      label: "I / A",
      auto: true,
    },
    background: "#1a1a2e",
  });

  // Generate sample CV data (simulated)
  const points = 10000;
  const x = new Float32Array(points);
  const y = new Float32Array(points);

  for (let i = 0; i < points; i++) {
    // Triangular potential waveform
    const t = i / points;
    const cycle = Math.floor(t * 2);
    const phase = (t * 2) % 1;
    const potential = cycle % 2 === 0 ? phase : 1 - phase;

    x[i] = (potential - 0.5) * 1.0; // -0.5V to +0.5V

    // Simulated CV response (simplified Randles-Sevcik)
    const scanRate = 0.05; // V/s
    const peakPotential = 0.2;
    const gaussWidth = 0.08;
    const peakCurrent = 1e-5 * Math.sqrt(scanRate);

    const diff = x[i] - peakPotential;
    y[i] =
      peakCurrent * Math.exp(-(diff * diff) / (2 * gaussWidth * gaussWidth));

    // Add some noise
    y[i] += (Math.random() - 0.5) * 1e-7;
  }

  // Add series to chart
  chart.addSeries({
    id: "cv-forward",
    type: "line",
    data: { x, y },
    style: {
      color: "#ff0055",
      width: 1.5,
    },
  });

  // Enable cursor
  chart.enableCursor({
    snap: true,
    crosshair: true,
    formatter: (xVal, yVal) =>
      `E = ${formatWithPrefix(xVal, "V")}\nI = ${formatWithPrefix(yVal, "A")}`,
  });

  return chart;
}

/**
 * Example: FFT of sine, square, and mixed waves
 */
export function exampleFFTWaveforms(target?: HTMLDivElement) {
  const container =
    target ?? (document.getElementById("chart") as HTMLDivElement | null);
  if (!container) {
    throw new Error(
      "exampleFFTWaveforms: container not found. Pass a target or ensure #chart exists."
    );
  }

  // Clear container and create two panels (time + spectrum)
  container.innerHTML = "";
  const timeDiv = document.createElement("div");
  const freqDiv = document.createElement("div");
  timeDiv.style.height = "300px";
  freqDiv.style.height = "300px";
  timeDiv.style.marginBottom = "16px";
  container.appendChild(timeDiv);
  container.appendChild(freqDiv);

  const sampleRate = 512; // Hz
  const samples = 1024; // power-of-two recommended
  const freq = 5; // Hz

  const x = new Float32Array(samples);
  const sine = new Float32Array(samples);
  const square = new Float32Array(samples);
  const mixed = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const angle = 2 * Math.PI * freq * t;
    const s = Math.sin(angle);
    const sq = Math.sign(Math.sin(angle)) || 1; // ±1
    x[i] = t;
    sine[i] = s;
    square[i] = sq;
    mixed[i] = s + 0.5 * sq;
  }

  // Time-domain signals
  const timeChart = createChart({
    container: timeDiv,
    xAxis: { label: "Time / s" },
    yAxis: { label: "Amplitude" },
    background: "#111826",
  });

  timeChart.addSeries({
    id: "sine",
    type: "line",
    data: { x, y: sine },
    style: { color: "#00eaff", width: 2 },
  });

  timeChart.addSeries({
    id: "square",
    type: "line",
    data: { x, y: square },
    style: { color: "#ff8a00", width: 2 },
  });

  timeChart.addSeries({
    id: "mixed",
    type: "line",
    data: { x, y: mixed },
    style: { color: "#c084fc", width: 2 },
  });

  // FFT of each signal
  const sineSpec = analyzeSpectrum(sine, sampleRate);
  const squareSpec = analyzeSpectrum(square, sampleRate);
  const mixedSpec = analyzeSpectrum(mixed, sampleRate);

  const freqChart = createChart({
    container: freqDiv,
    xAxis: { label: "Frequency / Hz" },
    yAxis: { label: "Magnitude" },
    background: "#0f172a",
  });

  freqChart.addSeries({
    id: "sine-spec",
    type: "line",
    data: { x: sineSpec.frequency, y: sineSpec.magnitude },
    style: { color: "#00eaff", width: 2 },
  });

  freqChart.addSeries({
    id: "square-spec",
    type: "line",
    data: { x: squareSpec.frequency, y: squareSpec.magnitude },
    style: { color: "#ff8a00", width: 2 },
  });

  freqChart.addSeries({
    id: "mixed-spec",
    type: "line",
    data: { x: mixedSpec.frequency, y: mixedSpec.magnitude },
    style: { color: "#c084fc", width: 2 },
  });

  return {
    destroy() {
      timeChart.destroy();
      freqChart.destroy();
    },
  };
}

/**
 * Example: Streaming data (real-time)
 */
export function exampleStreaming() {
  const container = document.getElementById("chart") as HTMLDivElement;

  const chart = createChart({
    container,
    xAxis: { label: "Time / s" },
    yAxis: { label: "I / A" },
  });

  // Initial empty series
  chart.addSeries({
    id: "realtime",
    type: "line",
    data: {
      x: new Float32Array(0),
      y: new Float32Array(0),
    },
    style: { color: "#00ff88" },
  });

  // Simulate streaming data
  let time = 0;
  const interval = setInterval(() => {
    // Generate 100 new points
    const newX = new Float32Array(100);
    const newY = new Float32Array(100);

    for (let i = 0; i < 100; i++) {
      time += 0.001; // 1ms per point
      newX[i] = time;
      newY[i] = Math.sin(time * 10) * 1e-6 + (Math.random() - 0.5) * 1e-7;
    }

    // Append to existing data
    chart.updateSeries("realtime", {
      x: newX,
      y: newY,
      append: true,
    });
  }, 100);

  // Cleanup function
  return () => {
    clearInterval(interval);
    chart.destroy();
  };
}

/**
 * Example: Multi-cycle CV with cycle detection
 */
export function exampleMultiCycle() {
  const container = document.getElementById("chart") as HTMLDivElement;

  const chart = createChart({
    container,
    xAxis: { label: "E / V" },
    yAxis: { label: "I / µA" },
  });

  // Generate 3-cycle CV data
  const pointsPerCycle = 5000;
  const numCycles = 3;
  const totalPoints = pointsPerCycle * numCycles;

  const x = new Float32Array(totalPoints);
  const y = new Float32Array(totalPoints);

  for (let i = 0; i < totalPoints; i++) {
    const cycleProgress = (i % pointsPerCycle) / pointsPerCycle;
    const direction = cycleProgress < 0.5 ? 1 : -1;
    const potential =
      direction === 1
        ? cycleProgress * 2 - 0.5 // Forward: -0.5 to 0.5
        : 1.5 - cycleProgress * 2; // Reverse: 0.5 to -0.5

    x[i] = potential;

    // Different peak heights per cycle (simulating electrode fouling)
    const cycleNum = Math.floor(i / pointsPerCycle);
    const peakDecay = Math.exp(-cycleNum * 0.1);
    const peakCurrent = 1e-5 * peakDecay * direction;

    const peakPos = 0.2;
    const gaussFactor = Math.exp(-Math.pow(potential - peakPos, 2) / 0.01);

    y[i] = peakCurrent * gaussFactor + (Math.random() - 0.5) * 1e-7;
  }

  // Detect cycles automatically
  const cycles = detectCycles(x);

  // Add each cycle as separate series
  const colors = ["#ff0055", "#00ff88", "#00aaff"];

  cycles.forEach((cycle: any, idx: number) => {
    const cycleX = x.slice(cycle.startIndex, cycle.endIndex + 1);
    const cycleY = y.slice(cycle.startIndex, cycle.endIndex + 1);

    chart.addSeries({
      id: `cycle-${cycle.number}`,
      type: "line",
      data: { x: cycleX, y: cycleY },
      style: { color: colors[idx % colors.length] },
      cycle: cycle.number,
    });
  });

  return chart;
}

/**
 * Example: Zoom controls
 */
export function exampleZoomControls(chart: ReturnType<typeof createChart>) {
  // Programmatic zoom
  chart.zoom({
    x: [0.1, 0.4],
    y: [-1e-5, 1e-5],
  });

  // Reset zoom
  document.getElementById("reset-zoom")?.addEventListener("click", () => {
    chart.resetZoom();
  });

  // Zoom in button
  document.getElementById("zoom-in")?.addEventListener("click", () => {
    const bounds = chart.getViewBounds();
    const xCenter = (bounds.xMin + bounds.xMax) / 2;
    const yCenter = (bounds.yMin + bounds.yMax) / 2;
    const xRange = (bounds.xMax - bounds.xMin) * 0.8;
    const yRange = (bounds.yMax - bounds.yMin) * 0.8;

    chart.zoom({
      x: [xCenter - xRange / 2, xCenter + xRange / 2],
      y: [yCenter - yRange / 2, yCenter + yRange / 2],
    });
  });
}

// Export for testing
export { createChart };
