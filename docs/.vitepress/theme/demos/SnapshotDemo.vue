<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const chartContainer = ref<HTMLDivElement | null>(null);
let chart: any = null;

const format = ref<'png' | 'jpeg' | 'webp'>('png');
const resolution = ref('standard');
const quality = ref(0.9);
const includeBackground = ref(true);
const includeOverlays = ref(true);
const watermarkText = ref('Sci Plot Export');
const lastSnapshotUrl = ref('');
const isExporting = ref(false);

const resolutions = [
  { value: 'standard', label: 'Standard (Live)' },
  { value: '2k', label: '2K (FHD+)' },
  { value: '4k', label: '4K (Ultra HD)' },
  { value: '8k', label: '8K (Publication)' },
];

const formats = ['png', 'jpeg', 'webp'];

async function initChart() {
  if (typeof window === 'undefined' || !chartContainer.value) return;
  
  const { createChart, PluginSnapshot, PluginTools, PluginAnnotations } = await import('@src/index');
  
  console.log('Plugins imported:', { PluginSnapshot: !!PluginSnapshot, PluginTools: !!PluginTools });
  
  chart = createChart({
    container: chartContainer.value,
    title: 'Snapshot Export Demo',
    theme: 'midnight',
    showLegend: true,
  });

  if (!PluginSnapshot) {
    console.error('PluginSnapshot is undefined! Check exports.');
    return;
  }

  chart.use(PluginTools());
  chart.use(PluginAnnotations());
  chart.use(PluginSnapshot());

  // Add some dummy data
  const x = new Float32Array(1000);
  const y = new Float32Array(1000);
  for (let i = 0; i < 1000; i++) {
    x[i] = i / 100;
    y[i] = Math.sin(x[i] * 5) * Math.exp(-x[i] * 0.2) + Math.sin(x[i] * 20) * 0.1;
  }

  chart.addSeries({
    id: 'signal',
    name: 'Scientific Signal',
    type: 'line',
    data: { x, y },
    style: { color: '#00f2ff', width: 2 }
  });

  // Add some annotations to test overlay capture
  chart.addAnnotation({
    type: 'text',
    text: 'Peak Detection',
    x: 0.3,
    y: 1.0,
    style: { color: '#ff6b6b', fontSize: 14 }
  });

  chart.addAnnotation({
    type: 'line',
    x: 0,
    y: 0.5,
    x1: 10,
    y1: 0.5,
    style: { color: 'rgba(255, 255, 255, 0.2)', width: 1, lineDash: [5, 5] }
  });

// Initial auto-scale to frame the waves
  setTimeout(() => {
    if (chart) chart.autoScale();
  }, 300);
}

async function takeSnapshot() {
  if (!chart || isExporting.value) return;
  
  isExporting.value = true;
  try {
    if (!chart.snapshot) {
      throw new Error('Snapshot plugin not initialized. Did you call chart.use(PluginSnapshot())?');
    }
    const url = await chart.snapshot.takeSnapshot({
      format: format.value,
      resolution: resolution.value === 'standard' ? 'standard' : resolution.value,
      quality: quality.value,
      includeBackground: includeBackground.value,
      includeOverlays: includeOverlays.value,
      watermarkText: watermarkText.value,
    });
    
    lastSnapshotUrl.value = url as string;
  } catch (err) {
    console.error('Snapshot failed:', err);
  } finally {
    isExporting.value = false;
  }
}

async function download() {
  if (!chart || !chart.snapshot) {
    console.error('Snapshot plugin not available');
    return;
  }
  await chart.snapshot.downloadSnapshot({
    format: format.value,
    resolution: resolution.value,
    quality: quality.value,
    includeBackground: includeBackground.value,
    includeOverlays: includeOverlays.value,
    watermarkText: watermarkText.value,
    fileName: 'sci-plot-pro-export'
  });
}

onMounted(() => {
  initChart();
});

onUnmounted(() => {
  chart?.destroy();
});
</script>

<template>
  <div class="snapshot-demo">
    <div class="demo-layout">
      <div class="chart-section">
        <div ref="chartContainer" class="chart-container"></div>
        
        <div class="preview-card" v-if="lastSnapshotUrl">
          <div class="preview-header">
            <span>📷 Last Capture Preview</span>
            <button @click="lastSnapshotUrl = ''" class="close-btn">×</button>
          </div>
          <div class="preview-image-container">
            <img :src="lastSnapshotUrl" alt="Snapshot Preview" />
          </div>
        </div>
      </div>

      <div class="controls-section">
        <div class="control-group">
          <h3>Resolution</h3>
          <div class="radio-group">
            <button 
              v-for="res in resolutions" 
              :key="res.value"
              :class="{ active: resolution === res.value }"
              @click="resolution = res.value"
            >
              {{ res.label }}
            </button>
          </div>
        </div>

        <div class="control-group">
          <h3>Format & Quality</h3>
          <div class="format-options">
            <select v-model="format">
              <option v-for="f in formats" :key="f" :value="f">{{ f.toUpperCase() }}</option>
            </select>
            <div v-if="format !== 'png'" class="quality-slider">
              <span>Quality: {{ Math.round(quality * 100) }}%</span>
              <input type="range" v-model.number="quality" min="0.1" max="1" step="0.05" />
            </div>
          </div>
        </div>

        <div class="control-group">
          <h3>Options</h3>
          <div class="checkbox-options">
            <label>
              <input type="checkbox" v-model="includeBackground" />
              Include Background
            </label>
            <label>
              <input type="checkbox" v-model="includeOverlays" />
              Include Overlays
            </label>
          </div>
          <div class="watermark-input">
            <label>Watermark Text:</label>
            <input type="text" v-model="watermarkText" placeholder="No watermark" />
          </div>
        </div>

        <div class="action-buttons">
          <button @click="takeSnapshot" :disabled="isExporting" class="primary-btn">
            {{ isExporting ? 'Capturing...' : 'Generate Preview' }}
          </button>
          <button @click="download" :disabled="isExporting" class="outline-btn">
            Download Image
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.snapshot-demo {
  margin-top: 1rem;
  font-family: 'Inter', system-ui, sans-serif;
  color: #cdd9e5;
}

.demo-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.5rem;
}

.chart-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chart-container {
  height: 450px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.controls-section {
  background: #1c2128;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.control-group h3 {
  margin: 0 0 0.75rem 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  color: #00f2ff;
  letter-spacing: 0.05em;
}

.radio-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.radio-group button {
  padding: 0.5rem;
  background: #2d333b;
  border: 1px solid #444c56;
  color: #adbac7;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.radio-group button:hover {
  border-color: #00f2ff;
}

.radio-group button.active {
  background: rgba(0, 242, 255, 0.1);
  border-color: #00f2ff;
  color: #00f2ff;
}

.format-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.format-options select {
  width: 100%;
  padding: 0.5rem;
  background: #2d333b;
  border: 1px solid #444c56;
  color: #adbac7;
  border-radius: 6px;
}

.quality-slider {
  font-size: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.checkbox-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.checkbox-options label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.watermark-input {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.watermark-input label {
  font-size: 0.75rem;
  color: #adbac7;
}

.watermark-input input {
  padding: 0.5rem;
  background: #22272e;
  border: 1px solid #444c56;
  color: #adbac7;
  border-radius: 6px;
  font-size: 0.8rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: auto;
}

.primary-btn {
  background: #00f2ff;
  color: #0d1117;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.primary-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.primary-btn:disabled {
  background: #444c56;
  cursor: not-allowed;
}

.outline-btn {
  background: transparent;
  color: #00f2ff;
  border: 1px solid #00f2ff;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.outline-btn:hover:not(:disabled) {
  background: rgba(0, 242, 255, 0.05);
}

.preview-card {
  background: #1c2128;
  border-radius: 12px;
  border: 1px solid rgba(0, 242, 255, 0.3);
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.preview-header {
  padding: 0.5rem 1rem;
  background: rgba(0, 242, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  border-bottom: 1px solid rgba(0, 242, 255, 0.2);
}

.close-btn {
  background: none;
  border: none;
  color: #ff6b6b;
  font-size: 1.25rem;
  cursor: pointer;
}

.preview-image-container {
  padding: 1rem;
  background: #0d1117;
}

.preview-image-container img {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 4px;
}

@media (max-width: 900px) {
  .demo-layout {
    grid-template-columns: 1fr;
  }
}
</style>
