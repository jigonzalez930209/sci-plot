<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { createChart, PluginLazyLoad } from '../../../../src';

const chartContainer = ref<HTMLDivElement | null>(null);
let chart: any = null;
const loadingStatus = ref('Idle');
const loadedChunks = ref(0);
const progress = ref(0);

const initChart = async () => {
  if (!chartContainer.value) return;

  chart = createChart({
    container: chartContainer.value,
    theme: 'dark',
  });

  await chart.use(PluginLazyLoad({
    chunkSize: 10000,
    viewportBuffer: 1.5,
    maxLoadedChunks: 50,
    debug: true,
    onLoadStart: (ev) => {
        loadingStatus.value = `Loading chunk ${ev.chunkIndex}...`;
    },
    onLoadProgress: (ev) => {
        progress.value = (ev.loadedPoints / ev.totalPoints) * 100;
    },
    onLoadComplete: (ev) => {
        loadingStatus.value = 'Ready';
        loadedChunks.value++;
    }
  }));

  // Define a dummy data provider with 1M points
  const provider = {
      getTotalCount: () => 1000000,
      loadChunk: async (start, end) => {
          // Simulate network delay
          await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
          
          const count = end - start;
          const x = new Float32Array(count);
          const y = new Float32Array(count);
          
          for (let i = 0; i < count; i++) {
              const idx = start + i;
              x[i] = idx;
              // Base sine wave + harmonics + noise
              y[i] = Math.sin(idx * 0.001) * 10 + 
                     Math.sin(idx * 0.01) * 2 + 
                     Math.random() * 0.5;
          }
          
          return {
              startIndex: start,
              endIndex: end,
              x, y,
              loadedAt: Date.now()
          };
      }
  };

  chart.addSeries({
      id: 'massive-series',
      type: 'line',
      color: '#00f2fe',
      width: 1
  });

  chart.lazyLoad.registerSeries('massive-series', provider);
  
  // Set initial view
  chart.zoom({ x: [0, 50000], y: [-15, 15], animate: false });
};

const resetView = () => {
    chart.zoom({ x: [0, 50000], y: [-15, 15], animate: true });
};

const panToMillion = () => {
    chart.zoom({ x: [950000, 1000000], y: [-15, 15], animate: true });
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
      <h3>Lazy Load: 1 Million Points</h3>
      <div class="demo-controls">
        <button @click="resetView" class="btn-outline">Go to Start</button>
        <button @click="panToMillion" class="btn-primary">Jump to 1,000,000</button>
      </div>
    </div>

    <div class="stats-bar">
      <div class="stat">
        <span class="label">Status:</span>
        <span class="value" :class="{ 'loading': loadingStatus.includes('Loading') }">{{ loadingStatus }}</span>
      </div>
      <div class="stat">
        <span class="label">Chunks Loaded:</span>
        <span class="value cyan">{{ loadedChunks }}</span>
      </div>
      <div class="progress-wrap">
          <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      </div>
    </div>

    <div ref="chartContainer" class="chart-container"></div>
    
    <div class="demo-footer">
      <p>💡 Zoom and Pan to trigger on-demand data loading. Chunks are 10k points each.</p>
    </div>
  </div>
</template>

<style scoped>
.demo-card {
  background: rgba(20, 20, 30, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  margin: 20px 0;
  color: white;
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.demo-controls {
  display: flex;
  gap: 10px;
}

.stats-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 15px;
  background: rgba(0, 0, 0, 0.2);
  padding: 10px 15px;
  border-radius: 8px;
}

.stat {
  display: flex;
  gap: 8px;
  font-size: 0.9rem;
}

.label { color: #888; }
.value { font-weight: bold; font-family: monospace; }
.value.loading { color: #f6d365; }
.value.cyan { color: #00f2fe; }

.progress-wrap {
    flex: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background: #00f2fe;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-container {
  height: 350px;
  width: 100%;
  border-radius: 8px;
  background: #0b0b0e;
}

.demo-footer {
    margin-top: 15px;
    font-size: 0.85rem;
    color: #888;
    text-align: center;
}

.btn-primary { background: #4facfe; border: none; padding: 8px 16px; border-radius: 6px; color: white; cursor: pointer; font-weight: 600; }
.btn-outline { background: transparent; border: 1px solid #4facfe; padding: 8px 16px; border-radius: 6px; color: #4facfe; cursor: pointer; }
</style>
