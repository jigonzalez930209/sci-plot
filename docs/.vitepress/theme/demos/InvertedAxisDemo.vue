<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { createChart } from '@src/index';

const chartContainer = ref<HTMLDivElement | null>(null);
let chart: any = null;

const createSpectrum = () => {
  const pointCount = 1600;
  const wavenumber = new Float32Array(pointCount);
  const transmittance = new Float32Array(pointCount);

  const bands = [3650, 3400, 2940, 2350, 1715, 1600, 1450, 1100, 650];
  const amplitudes = [10, 32, 20, 12, 40, 18, 14, 24, 12];
  const widths = [40, 85, 55, 60, 45, 55, 45, 70, 35];

  for (let i = 0; i < pointCount; i++) {
    const x = 400 + (3600 * i) / (pointCount - 1);
    let absorption = 0;

    for (let j = 0; j < bands.length; j++) {
      const offset = x - bands[j];
      absorption += amplitudes[j] * Math.exp(-(offset * offset) / (2 * widths[j] * widths[j]));
    }

    const ripple = 1.2 * Math.sin(x / 110) + 0.8 * Math.cos(x / 170);

    wavenumber[i] = x;
    transmittance[i] = Math.max(4, Math.min(98, 96 - absorption + ripple));
  }

  return { wavenumber, transmittance };
};

const initChart = () => {
  if (!chartContainer.value) return;

  const { wavenumber, transmittance } = createSpectrum();

  chart = createChart({
    container: chartContainer.value,
    theme: 'dark',
    showControls: true,
    xAxis: {
      label: 'Wavenumber (cm^-1)',
      auto: true,
      invertAxis: true,
    },
    yAxis: {
      label: 'Transmittance (%)',
      auto: true,
      min: 0,
      max: 100,
   
    },
    layout: {
      xAxisLayout: { titleGap: 48 },
      yAxisLayout: { titleGap: 50 },
    },
  });

  chart.addSeries({
    id: 'ir-spectrum',
    type: 'line',
    data: { x: wavenumber, y: transmittance },
    style: { color: '#00f2ff', width: 1.8 },
  });

  chart.autoScale();
};

onMounted(() => {
  initChart();
});

onUnmounted(() => {
  if (chart) {
    chart.destroy();
    chart = null;
  }
});
</script>

<template>
    <div class="demo-header">
      <h3>Inverted Axis: IR-Style Spectrum</h3>
      <div class="demo-controls">
        <span class="axis-chip">invertAxis: true</span>
      </div>
    </div>

    <div class="info-bar">
      <p>High wavenumbers render on the left, low wavenumbers on the right, while the data stays in ascending order.</p>
    </div>

    <div ref="chartContainer" class="chart-container"></div>

    <div class="legend">
      <div class="legend-item">Hydroxyl / water band around 3400 cm^-1</div>
      <div class="legend-item">Carbonyl-like band around 1715 cm^-1</div>
    </div>
</template>

<style scoped>
.demo-card {
  background: #1e1e26;
  border-radius: 16px;
  padding: 24px;
  margin: 20px 0;
  color: white;
  border: 1px solid rgba(0, 242, 255, 0.12);
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 15px;
}

.demo-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.axis-chip {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(0, 242, 255, 0.1);
  border: 1px solid rgba(0, 242, 255, 0.25);
  color: #00f2ff;
  font-size: 0.8rem;
  font-weight: 600;
}

.info-bar {
  background: rgba(0, 242, 255, 0.05);
  padding: 10px 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 0.9rem;
  border-left: 3px solid #00f2ff;
}

.chart-container {
  height: 400px;
  width: 100%;
  background: #0d0d12;
  border-radius: 8px;
}

.legend {
  display: flex;
  gap: 20px;
  margin-top: 15px;
  font-size: 0.8rem;
  color: #9aa3af;
  justify-content: space-between;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 700px) {
  .demo-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .legend {
    justify-content: flex-start;
  }
}
</style>