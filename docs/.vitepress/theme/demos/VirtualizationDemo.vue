<template>
  <div class="virtualization-demo">
    <div class="demo-controls">
      <h3>Data Virtualization (1,000,000 Points)</h3>
      <div class="control-group">
        <label>
          <input type="checkbox" v-model="enabled" @change="togglePlugin" />
          Enable Virtualization (LOD)
        </label>
      </div>
      <div class="stats-grid">
        <div class="stat-box">
          <span class="label">Total Points</span>
          <span class="value">1,000,000</span>
        </div>
        <div class="stat-box">
          <span class="label">Rendered</span>
          <span class="value">{{ renderedPoints.toLocaleString() }}</span>
        </div>
        <div class="stat-box">
          <span class="label">Strategy</span>
          <span class="value">{{ strategy }}</span>
        </div>
      </div>
      <div class="control-group">
          <label>Algorithm:</label>
          <select v-model="strategy" @change="updateConfig">
              <option value="lttb">LTTB (Visually Accurate)</option>
              <option value="minmax">Min-Max (Full Range)</option>
          </select>
      </div>
    </div>

    <div ref="chartContainer" class="chart-container" :style="{ height: height || '400px' }"></div>

    <div class="info-panel">
      <p>Performance: <strong>{{ fps }} FPS</strong></p>
      <p>Virtualization automatically downsamples data based on the viewport width and DPR. Zoom in to see more detail!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useData } from 'vitepress';

const props = defineProps<{
  height?: string;
}>();

const { isDark } = useData();
const chartContainer = ref<HTMLDivElement | null>(null);
const enabled = ref(true);
const strategy = ref('lttb');
const renderedPoints = ref(0);
const fps = ref(0);

let chart: any = null;

function togglePlugin() {
    if (chart?.virtualization) {
        if (enabled.value) chart.virtualization.enable();
        else chart.virtualization.disable();
        updateStats();
    }
}

function updateConfig() {
    if (chart?.virtualization) {
        chart.virtualization.updateConfig({ strategy: strategy.value });
        updateStats();
    }
}

function updateStats() {
    if (chart?.virtualization) {
        const stats = chart.virtualization.getStats('series1');
        if (stats) {
            renderedPoints.value = stats.renderedPoints;
        } else {
            renderedPoints.value = 1000000;
        }
    }
}

onMounted(async () => {
  if (typeof window === 'undefined') return;

  try {
    const { createChart, PluginVirtualization } = await import('@src/index');

    chart = createChart({
      container: chartContainer.value!,
      theme: isDark.value ? 'dark' : 'light',
    });

    // Generate 1M points
    const n = 1000000;
    const x = new Float32Array(n);
    const y = new Float32Array(n);
    let val = 100;
    for (let i = 0; i < n; i++) {
        x[i] = i;
        val += (Math.random() - 0.5) * 2;
        y[i] = val + Math.sin(i / 1000) * 10;
    }

    await chart.use(PluginVirtualization({
        enabled: enabled.value,
        strategy: strategy.value as any,
        debug: false
    }));

    chart.addSeries({
      id: 'series1',
      type: 'line',
      data: { x, y },
      style: { color: '#00f2ff', width: 1 }
    });

    chart.autoScale();

    // FPS loop
    let lastTime = performance.now();
    let frames = 0;
    const frame = () => {
        if (!chart) return;
        frames++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
            fps.value = frames;
            frames = 0;
            lastTime = now;
            updateStats();
        }
        requestAnimationFrame(frame);
    };
    frame();

  } catch (err) {
    console.error('VirtualizationDemo: Error', err);
  }
});

onUnmounted(() => {
  if (chart) chart.destroy();
  chart = null;
});
</script>

<style scoped>
.virtualization-demo {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: rgba(20, 20, 35, 0.8);
  border-radius: 12px;
  color: #fff;
}
.demo-controls {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}
.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin: 1rem 0;
}
.stat-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem;
    background: rgba(0,0,0,0.3);
    border-radius: 6px;
}
.stat-box .label { font-size: 0.7rem; color: #aaa; text-transform: uppercase; }
.stat-box .value { font-size: 1.1rem; font-weight: bold; color: #00f2ff; }

.chart-container {
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  background: #000;
}
.info-panel {
  padding: 0.5rem 1rem;
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
}
select {
    background: #333;
    color: #fff;
    border: 1px solid #555;
    padding: 2px 5px;
    border-radius: 4px;
}
</style>
