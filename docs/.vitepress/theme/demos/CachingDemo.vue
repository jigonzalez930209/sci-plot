<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { createChart, PluginCaching, type CachingAPI } from '../../../../src';

const chartContainer = ref<HTMLDivElement | null>(null);
let chart: any = null;
const stats = ref<any>(null);
const loading = ref(false);
const executionTime = ref(0);

const initChart = async () => {
  if (!chartContainer.value) return;

  chart = createChart({
    container: chartContainer.value,
    theme: 'dark',
  });

  await chart.use(PluginCaching({
    maxSize: 10 * 1024 * 1024, // 10MB
    ttl: 30000, // 30 seconds
    strategy: 'lru'
  }));

  // Add initial series
  chart.addSeries({
    id: 'data',
    type: 'line',
    name: 'Raw Data',
    color: '#00f2fe'
  });

  generateData();
  updateStats();
};

const generateData = () => {
  const x = new Float32Array(50000);
  const y = new Float32Array(50000);
  for (let i = 0; i < 50000; i++) {
    x[i] = i;
    y[i] = Math.sin(i * 0.01) + Math.random() * 0.2;
  }
  chart.updateSeries('data', { x, y });
};

const runExpensiveAnalysis = async (type: string) => {
  if (!chart) return;
  
  loading.value = true;
  const t0 = performance.now();
  
  // Try to get from cache first via the Plugin API
  const cacheKey = `analysis-${type}`;
  const cachedResult = chart.caching.get(cacheKey);
  
  if (cachedResult) {
    console.log(`[Cache Hit] ${type}`);
    chart.updateSeries('data', cachedResult);
    executionTime.value = performance.now() - t0;
    loading.value = false;
    updateStats();
    return;
  }

  // Simulate expensive calculation
  console.log(`[Cache Miss] Calculating ${type}...`);
  await new Promise(resolve => setTimeout(resolve, 800)); // Artificial delay
  
  const series = chart.getSeries('data');
  const data = series.getData();
  const resultY = new Float32Array(data.y.length);
  
  if (type === 'smooth') {
    // Simple moving average
    for (let i = 5; i < data.y.length - 5; i++) {
      let sum = 0;
      for (let j = -5; j <= 5; j++) sum += data.y[i + j];
      resultY[i] = sum / 11;
    }
  } else if (type === 'derivative') {
    for (let i = 1; i < data.y.length; i++) {
      resultY[i] = (data.y[i] - data.y[i-1]) * 10;
    }
  }

  const result = { x: data.x, y: resultY };
  
  // Save to cache
  chart.caching.set(cacheKey, result, { tags: ['analysis'] });
  
  chart.updateSeries('data', result);
  executionTime.value = performance.now() - t0;
  loading.value = false;
  updateStats();
};

const clearCache = () => {
    chart.caching.clear();
    updateStats();
};

const updateStats = () => {
    if (chart && chart.caching) {
        stats.value = chart.caching.getStats();
    }
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
      <h3>Caching Performance Demo</h3>
      <div class="demo-controls">
        <button @click="runExpensiveAnalysis('smooth')" :disabled="loading" class="btn-primary">
          Smooth (Complex)
        </button>
        <button @click="runExpensiveAnalysis('derivative')" :disabled="loading" class="btn-secondary">
          Derivative
        </button>
        <button @click="clearCache" class="btn-outline">Clear Cache</button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-item">
        <span class="label">Time</span>
        <span class="value" :class="{ 'hit': executionTime < 10 }">{{ executionTime.toFixed(1) }}ms</span>
      </div>
      <div class="stat-item">
        <span class="label">Hits</span>
        <span class="value">{{ stats?.hits || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="label">Misses</span>
        <span class="value">{{ stats?.misses || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="label">Ratio</span>
        <span class="value">{{ ((stats?.hitRatio || 0) * 100).toFixed(0) }}%</span>
      </div>
    </div>

    <div ref="chartContainer" class="chart-container"></div>
    
    <div v-if="loading" class="loading-overlay">
      <div class="loader"></div>
      <p>Simulating Expensive Calculation...</p>
    </div>
  </div>
</template>

<style scoped>
.demo-card {
  background: rgba(30, 30, 40, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  margin: 20px 0;
  position: relative;
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
  background: rgba(0, 0, 0, 0.3);
  padding: 15px;
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.label {
  font-size: 0.8rem;
  color: #aaa;
  margin-bottom: 4px;
}

.value {
  font-weight: bold;
  font-family: monospace;
  font-size: 1.1rem;
}

.value.hit {
  color: #00f2fe;
}

.chart-container {
  height: 400px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.btn-primary { background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); border: none; padding: 8px 16px; border-radius: 8px; color: white; cursor: pointer; font-weight: 600; }
.btn-secondary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; padding: 8px 16px; border-radius: 8px; color: white; cursor: pointer; font-weight: 600; }
.btn-outline { background: transparent; border: 1px solid rgba(255, 255, 255, 0.3); padding: 8px 16px; border-radius: 8px; color: white; cursor: pointer; }

.btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.loading-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 16px;
  z-index: 10;
}

.loader {
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top: 4px solid #00f2fe;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
