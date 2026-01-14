<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const chartContainer = ref<HTMLDivElement | null>(null);
let chart: any = null;
let anomalyPlugin: any = null;
let streamInterval: any = null;

const selectedMethod = ref<'zscore' | 'mad' | 'iqr' | 'isolation-forest'>('zscore');
const sensitivity = ref(3);
const realtimeEnabled = ref(false);
const rollingWindow = ref(false);
const windowSize = ref(100);

const detectedAnomalies = ref(0);
const totalPoints = ref(0);
const lastDetectionTime = ref('');
const isStreaming = ref(false);

const methods = [
  { value: 'zscore', label: 'Z-Score', icon: '📊', desc: 'Standard deviation based' },
  { value: 'mad', label: 'MAD', icon: '📈', desc: 'Median absolute deviation' },
  { value: 'iqr', label: 'IQR', icon: '📉', desc: 'Interquartile range' },
  { value: 'isolation-forest', label: 'Isolation Forest', icon: '🌲', desc: 'ML-based approach' }
];

// Generate data with anomalies
function generateDataWithAnomalies(points: number = 200) {
  const x = new Float32Array(points);
  const y = new Float32Array(points);
  
  for (let i = 0; i < points; i++) {
    x[i] = i;
    
    // Normal pattern: sine wave
    y[i] = 50 + 20 * Math.sin(i / 10) + (Math.random() - 0.5) * 5;
    
    // Inject anomalies (10% of points)
    if (Math.random() < 0.1) {
      y[i] += (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 20);
    }
  }
  
  return { x, y };
}

function updateChart() {
  if (!chart) return;
  
  const series = chart.getSeries('data');
  if (!series) return;
  
  const data = series.getData();
  const n = data.y.length;
  
  const anomalyIndices: number[] = [];
  
  // Improved algorithm: Detect both upward and downward anomalies
  // Using local moving average to handle trends
  
  const windowSize = Math.min(20, Math.floor(n / 10)); // Adaptive window
  
  // Calculate local statistics for each point
  for (let i = 0; i < n; i++) {
    // Define local window
    const start = Math.max(0, i - windowSize);
    const end = Math.min(n, i + windowSize + 1);
    
    // Calculate local mean (excluding current point to avoid bias)
    let localSum = 0;
    let count = 0;
    for (let j = start; j < end; j++) {
      if (j !== i) {
        localSum += data.y[j];
        count++;
      }
    }
    const localMean = localSum / count;
    
    // Calculate local standard deviation
    let localSumSq = 0;
    for (let j = start; j < end; j++) {
      if (j !== i) {
        localSumSq += Math.pow(data.y[j] - localMean, 2);
      }
    }
    const localStdDev = Math.sqrt(localSumSq / count);
    
    if (localStdDev === 0) continue;
    
    // Calculate deviation score (positive for upward, negative for downward)
    const deviation = (data.y[i] - localMean) / localStdDev;
    
    // Detect anomalies in BOTH directions
    if (Math.abs(deviation) > sensitivity.value) {
      anomalyIndices.push(i);
    }
  }
  
  // Update stats
  detectedAnomalies.value = anomalyIndices.length;
  totalPoints.value = n;
  lastDetectionTime.value = new Date().toLocaleTimeString();
  
  // Create anomaly markers series
  const anomalyX = new Float32Array(anomalyIndices.length);
  const anomalyY = new Float32Array(anomalyIndices.length);
  
  anomalyIndices.forEach((idx, i) => {
    anomalyX[i] = data.x[idx];
    anomalyY[i] = data.y[idx];
  });
  
  // Remove old anomaly series if exists
  if (chart.getSeries('anomalies')) {
    chart.removeSeries('anomalies');
  }
  
  // Add new anomaly markers
  if (anomalyIndices.length > 0) {
    chart.addSeries({
      id: 'anomalies',
      name: 'Anomalies',
      type: 'scatter',
      data: { x: anomalyX, y: anomalyY },
      style: {
        color: '#ff0000',
        pointSize: 8,
        symbol: 'circle',
        opacity: 0.8
      }
    });
  }
}

function resetData() {
  if (!chart) return;
  
  stopStreaming();
  
  const data = generateDataWithAnomalies(200);
  chart.removeSeries('data');
  if (chart.getSeries('anomalies')) {
    chart.removeSeries('anomalies');
  }
  
  chart.addSeries({
    id: 'data',
    name: 'Sensor Data',
    type: 'line',
    data,
    style: {
      color: '#00f2ff',
      width: 2
    }
  });
  
  chart.autoScale();
  totalPoints.value = 200;
  
  // Run initial detection
  updateChart();
}

function startStreaming() {
  if (isStreaming.value || !chart) return;
  
  isStreaming.value = true;
  let pointIndex = 200;
  
  streamInterval = setInterval(() => {
    const newX = new Float32Array([pointIndex]);
    const newY = new Float32Array([
      50 + 20 * Math.sin(pointIndex / 10) + (Math.random() - 0.5) * 5 +
      (Math.random() < 0.1 ? (Math.random() > 0.5 ? 1 : -1) * 40 : 0)
    ]);
    
    chart.updateSeries('data', { x: newX, y: newY }, { append: true });
    pointIndex++;
    
    // Run detection on new data
    if (realtimeEnabled.value) {
      updateChart();
    }
  }, 100);
}

function stopStreaming() {
  if (streamInterval) {
    clearInterval(streamInterval);
    streamInterval = null;
  }
  isStreaming.value = false;
}

function getSensitivityLabel(): string {
  switch (selectedMethod.value) {
    case 'zscore':
      return `${sensitivity.value.toFixed(1)}σ (std deviations)`;
    case 'mad':
      return `${sensitivity.value.toFixed(1)}× MAD`;
    case 'iqr':
      return `${sensitivity.value.toFixed(1)}× IQR`;
    case 'isolation-forest':
      return `${(sensitivity.value * 100).toFixed(0)}% contamination`;
    default:
      return sensitivity.value.toFixed(1);
  }
}

function getSensitivityRange() {
  if (selectedMethod.value === 'isolation-forest') {
    return { min: 0.01, max: 0.2, step: 0.01, default: 0.05 };
  }
  return { min: 1, max: 5, step: 0.1, default: 3 };
}

function removeAnomalies() {
  if (!chart) return;
  
  const series = chart.getSeries('data');
  if (!series) return;
  
  const data = series.getData();
  const n = data.y.length;
  
  // Calculate anomalies to remove using same improved algorithm
  const anomalyIndices = new Set<number>();
  
  const windowSize = Math.min(20, Math.floor(n / 10));
  
  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - windowSize);
    const end = Math.min(n, i + windowSize + 1);
    
    let localSum = 0;
    let count = 0;
    for (let j = start; j < end; j++) {
      if (j !== i) {
        localSum += data.y[j];
        count++;
      }
    }
    const localMean = localSum / count;
    
    let localSumSq = 0;
    for (let j = start; j < end; j++) {
      if (j !== i) {
        localSumSq += Math.pow(data.y[j] - localMean, 2);
      }
    }
    const localStdDev = Math.sqrt(localSumSq / count);
    
    if (localStdDev === 0) continue;
    
    const deviation = (data.y[i] - localMean) / localStdDev;
    
    if (Math.abs(deviation) > sensitivity.value) {
      anomalyIndices.add(i);
    }
  }
  
  // Create new data without anomalies
  const cleanX = new Float32Array(n - anomalyIndices.size);
  const cleanY = new Float32Array(n - anomalyIndices.size);
  
  let cleanIndex = 0;
  for (let i = 0; i < n; i++) {
    if (!anomalyIndices.has(i)) {
      cleanX[cleanIndex] = data.x[i];
      cleanY[cleanIndex] = data.y[i];
      cleanIndex++;
    }
  }
  
  // Update series with clean data
  chart.removeSeries('data');
  if (chart.getSeries('anomalies')) {
    chart.removeSeries('anomalies');
  }
  
  chart.addSeries({
    id: 'data',
    name: 'Sensor Data (Cleaned)',
    type: 'line',
    data: { x: cleanX, y: cleanY },
    style: {
      color: '#00f2ff',
      width: 2
    }
  });
  
  chart.autoScale();
  
  // Update stats
  totalPoints.value = cleanX.length;
  detectedAnomalies.value = 0;
  lastDetectionTime.value = new Date().toLocaleTimeString();
}

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return;
  
  try {
    const { createChart } = await import('@src/index');
    
    chart = createChart({
      container: chartContainer.value,
      theme: 'midnight',
      showLegend: true,
      showControls: true,
    });
    
    // NOTE: Plugin temporarily disabled for demo
    // Will be enabled once plugin system is fully integrated
    /*
    const { PluginAnomalyDetection } = await import('@src/index');
    
    chart.use(PluginAnomalyDetection({
      method: selectedMethod.value,
      sensitivity: sensitivity.value,
      realtime: realtimeEnabled.value,
      highlight: true,
      highlightColor: '#ff0000'
    }));
    
    anomalyPlugin = chart.getPlugin('anomaly-detection');
    
    // Listen for anomaly detection events
    chart.on('anomaly:detected', (result: any) => {
      detectedAnomalies.value = result.anomalies.length;
      totalPoints.value = result.totalPoints;
      lastDetectionTime.value = new Date(result.timestamp).toLocaleTimeString();
    });
    */
    
    // Initial data
    const data = generateDataWithAnomalies(200);
    chart.addSeries({
      id: 'data',
      name: 'Sensor Data',
      type: 'line',
      data,
      style: {
        color: '#00f2ff',
        width: 2
      }
    });
    
    // Run initial detection to show anomalies
    totalPoints.value = 200;
    updateChart();
    
  } catch (error) {
    console.error('Error initializing chart:', error);
  }
});

onUnmounted(() => {
  stopStreaming();
  chart?.destroy();
});
</script>

<template>
  <div class="anomaly-demo">
    <div ref="chartContainer" class="chart-container"></div>
    
    <div class="controls-panel">
      <div class="stats-section">
        <h4>📊 Detection Stats</h4>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Anomalies</span>
            <span class="stat-value">{{ detectedAnomalies }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Total Points</span>
            <span class="stat-value">{{ totalPoints }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Detection Rate</span>
            <span class="stat-value">{{ totalPoints > 0 ? ((detectedAnomalies / totalPoints) * 100).toFixed(1) : 0 }}%</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Last Update</span>
            <span class="stat-value small">{{ lastDetectionTime || 'N/A' }}</span>
          </div>
        </div>
      </div>
      
      <div class="control-section">
        <h4>🔍 Detection Method</h4>
        <div class="method-buttons">
          <button
            v-for="method in methods"
            :key="method.value"
            :class="{ active: selectedMethod === method.value }"
            @click="selectedMethod = method.value as any; updateChart()"
          >
            <span class="icon">{{ method.icon }}</span>
            <span class="label">{{ method.label }}</span>
            <span class="desc">{{ method.desc }}</span>
          </button>
        </div>
      </div>
      
      <div class="control-section">
        <h4>⚙️ Configuration</h4>
        <div class="config-grid">
          <label class="slider-label">
            <span>Sensitivity: {{ getSensitivityLabel() }}</span>
            <input 
              type="range" 
              v-model.number="sensitivity" 
              :min="getSensitivityRange().min"
              :max="getSensitivityRange().max"
              :step="getSensitivityRange().step"
              @input="updateChart"
            />
          </label>
          
          <label class="checkbox-label">
            <input type="checkbox" v-model="realtimeEnabled" @change="updateChart" />
            <span>Real-time Detection</span>
          </label>
          
          <label class="checkbox-label">
            <input type="checkbox" v-model="rollingWindow" @change="updateChart" />
            <span>Rolling Window</span>
          </label>
          
          <label class="slider-label" v-if="rollingWindow">
            <span>Window Size: {{ windowSize }}</span>
            <input 
              type="range" 
              v-model.number="windowSize" 
              min="50"
              max="200"
              step="10"
              @input="updateChart"
            />
          </label>
        </div>
      </div>
      
      <div class="control-section">
        <h4>🎮 Actions</h4>
        <div class="action-buttons">
          <button @click="resetData" class="btn-primary">
            🔄 Reset Data
          </button>
          <button @click="updateChart" class="btn-secondary">
            🔍 Run Detection
          </button>
          <button 
            @click="isStreaming ? stopStreaming() : startStreaming()" 
            :class="['btn-secondary', { active: isStreaming }]"
          >
            {{ isStreaming ? '⏸️ Stop Stream' : '▶️ Start Stream' }}
          </button>
          <button 
            @click="removeAnomalies" 
            class="btn-danger"
            :disabled="detectedAnomalies === 0"
          >
            🗑️ Remove Anomalies
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.anomaly-demo {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chart-container {
  width: 100%;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
}

.controls-panel {
  background: var(--vp-c-bg-soft);
  padding: 1.5rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.control-section h4,
.stats-section h4 {
  margin: 0 0 0.75rem 0;
  color: #00f2ff;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.stat-card {
  background: var(--vp-c-bg);
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #00f2ff;
}

.stat-value.small {
  font-size: 0.9rem;
}

.method-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.5rem;
}

.method-buttons button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s;
}

.method-buttons button:hover {
  border-color: #00f2ff;
  transform: translateY(-2px);
}

.method-buttons button.active {
  background: linear-gradient(135deg, rgba(0, 242, 255, 0.2), rgba(78, 205, 196, 0.2));
  border-color: #00f2ff;
  color: #00f2ff;
}

.method-buttons .icon {
  font-size: 1.5rem;
}

.method-buttons .label {
  font-size: 0.85rem;
  font-weight: 600;
}

.method-buttons .desc {
  font-size: 0.7rem;
  opacity: 0.7;
}

.config-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.slider-label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slider-label span {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.slider-label input[type="range"] {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--vp-c-divider);
  outline: none;
  cursor: pointer;
}

.slider-label input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #00f2ff;
  cursor: pointer;
}

.slider-label input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #00f2ff;
  cursor: pointer;
  border: none;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.checkbox-label:hover {
  background: var(--vp-c-bg);
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.5rem;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #00f2ff, #4ecdc4);
  color: #000;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 242, 255, 0.3);
}

.btn-secondary {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.btn-secondary:hover {
  border-color: #00f2ff;
  color: #00f2ff;
}

.btn-secondary.active {
  background: rgba(255, 0, 0, 0.2);
  border-color: #ff0000;
  color: #ff0000;
}

.btn-danger {
  background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
  color: #fff;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .chart-container {
    height: 400px;
  }
  
  .method-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
