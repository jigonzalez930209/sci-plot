<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { createChart, PluginBrokenAxis } from '@src/index';

const chartContainer = ref<HTMLDivElement | null>(null);
let chart: any = null;
const isEnabled = ref(true);

const initChart = async () => {
  if (!chartContainer.value) return;

  chart = createChart({
    container: chartContainer.value,
    theme: 'dark',
  });

  // Create a more dramatic dataset to show "grouping"
  const pointsPerSegment = 1000;
  const totalPoints = pointsPerSegment * 3;
  const x = new Float32Array(totalPoints);
  const y = new Float32Array(totalPoints);
  
  // Dense Burst 1: [0, 100]
  for (let i = 0; i < pointsPerSegment; i++) {
      x[i] = (i / pointsPerSegment) * 100;
      y[i] = Math.sin(x[i] * 0.5) * 5 + Math.random() * 2;
  }
  
  // Dense Burst 2: [500, 600]
  for (let i = 0; i < pointsPerSegment; i++) {
      const idx = pointsPerSegment + i;
      x[idx] = 500 + (i / pointsPerSegment) * 100;
      y[idx] = Math.cos(x[idx] * 0.5) * 5 + 10 + Math.random() * 2;
  }
  
  // Dense Burst 3: [1200, 1300]
  for (let i = 0; i < pointsPerSegment; i++) {
      const idx = pointsPerSegment * 2 + i;
      x[idx] = 1200 + (i / pointsPerSegment) * 100;
      y[idx] = Math.sin(x[idx] * 0.3) * 3 - 8 + Math.random() * 2;
  }

  await chart.use(PluginBrokenAxis({
    axes: {
        default: {
            breaks: [
                { start: 105, end: 495, symbol: 'diagonal', visualRatio: 0.03 },
                { start: 605, end: 1195, symbol: 'zigzag', visualRatio: 0.03 }
            ],
            symbolColor: '#ff00ff'
        }
    }
  }));

  chart.addSeries({
      id: 'discontinuous',
      type: 'line',
      data: { x, y },
      style: { color: '#00f2fe', width: 1.5 }
  });

  chart.zoom({ x: [-50, 1400], y: [-20, 20], animate: false });
};

const toggleBroken = () => {
    isEnabled.value = !isEnabled.value;
    chart.brokenAxis.setEnabled(isEnabled.value);
};

onMounted(() => {
  initChart();
});

onUnmounted(() => {
  if (chart) {
    chart.destroy();
  }
});
</script>

<template>
  <div class="demo-card glass">
    <div class="demo-header">
      <h3>Broken Axis: Handling Data Gaps</h3>
      <div class="demo-controls">
        <button @click="toggleBroken" :class="isEnabled ? 'btn-danger' : 'btn-primary'">
          {{ isEnabled ? 'Disable Axis Breaks' : 'Enable Axis Breaks' }}
        </button>
      </div>
    </div>

    <div class="info-bar">
      <p>The dataset has active segments at <b>0-100</b>, <b>500-600</b>, and <b>1200-1300</b>.</p>
    </div>

    <div ref="chartContainer" class="chart-container"></div>
    
    <div class="legend">
        <div class="legend-item"><span class="marker diagonal"></span> Diagonal Break (110-490)</div>
        <div class="legend-item"><span class="marker zigzag"></span> Zigzag Break (610-1190)</div>
    </div>
  </div>
</template>

<style scoped>
.demo-card {
  background: #1e1e26;
  border-radius: 16px;
  padding: 24px;
  margin: 20px 0;
  color: white;
  border: 1px solid rgba(255, 0, 255, 0.1);
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.info-bar {
    background: rgba(255, 0, 255, 0.05);
    padding: 10px 15px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 0.9rem;
    border-left: 3px solid #ff00ff;
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
    color: #888;
    justify-content: center;
}

.legend-item { display: flex; align-items: center; gap: 8px; }
.marker { width: 12px; height: 12px; display: inline-block; border: 1px solid #ff00ff; border-radius: 2px; }
.marker.diagonal { background: repeating-linear-gradient(45deg, transparent, transparent 2px, #ff00ff 2px, #ff00ff 4px); }
.marker.zigzag { background: #ff00ff; clip-path: polygon(0 25%, 50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%); }

.btn-primary { background: #ff00ff; border: none; padding: 8px 16px; border-radius: 8px; color: white; cursor: pointer; font-weight: 600; }
.btn-danger { background: rgba(255, 255, 255, 0.1); border: 1px solid #ff00ff; padding: 8px 16px; border-radius: 8px; color: #ff00ff; cursor: pointer; }
</style>
