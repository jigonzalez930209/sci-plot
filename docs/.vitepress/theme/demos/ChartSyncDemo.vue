<template>
  <div class="sync-demo">
    <div class="info-bar">
      <span class="badge">{{ syncMode }}</span>
      <span class="description">Zoom or pan one chart - the other follows!</span>
    </div>
    
    <div class="sync-controls">
      <button 
        v-for="mode in modes" 
        :key="mode.value"
        :class="{ active: syncMode === mode.value }"
        @click="setSyncMode(mode.value)"
      >
        {{ mode.label }}
      </button>
      <button class="reset-btn" @click="resetCharts">Reset View</button>
    </div>
    
    <div class="charts-container">
      <div class="chart-wrapper">
        <div class="chart-label">Chart 1 - Temperature</div>
        <div ref="chart1Container" class="chart"></div>
      </div>
      <div class="chart-wrapper">
        <div class="chart-label">Chart 2 - Humidity</div>
        <div ref="chart2Container" class="chart"></div>
      </div>
    </div>
    
    <div class="status-bar">
      <span>Cursor Sync: <strong>{{ cursorSync ? 'ON' : 'OFF' }}</strong></span>
      <label class="toggle">
        <input type="checkbox" v-model="cursorSync">
        <span class="slider"></span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const chart1Container = ref<HTMLDivElement | null>(null)
const chart2Container = ref<HTMLDivElement | null>(null)
const syncMode = ref<'x' | 'y' | 'xy' | 'none'>('x')
const cursorSync = ref(true)

let chart1: any = null
let chart2: any = null
let isUpdating = false

const modes = [
  { value: 'x' as const, label: 'X-Axis Sync' },
  { value: 'y' as const, label: 'Y-Axis Sync' },
  { value: 'xy' as const, label: 'Both Axes' },
  { value: 'none' as const, label: 'No Sync' },
]

function generateData(points: number, baseValue: number, variance: number) {
  const x = new Float32Array(points)
  const y = new Float32Array(points)
  
  let value = baseValue
  for (let i = 0; i < points; i++) {
    x[i] = i
    value += (Math.random() - 0.5) * variance + Math.sin(i / 30) * variance * 0.5
    y[i] = value
  }
  
  return { x, y }
}

function setSyncMode(mode: 'x' | 'y' | 'xy' | 'none') {
  syncMode.value = mode
}

function resetCharts() {
  // Reset without animation
  chart1?.autoScale(false)
  chart2?.autoScale(false)
}

function syncZoom(source: any, target: any) {
  if (isUpdating || syncMode.value === 'none') return
  
  isUpdating = true
  
  try {
    const bounds = source.getViewBounds()
    
    const zoomOpts: any = {
      animate: false, // Disable animation for instant sync
    }
    
    if (syncMode.value === 'x' || syncMode.value === 'xy') {
      zoomOpts.x = [bounds.xMin, bounds.xMax]
    }
    if (syncMode.value === 'y' || syncMode.value === 'xy') {
      zoomOpts.y = [bounds.yMin, bounds.yMax]
    }
    
    if (zoomOpts.x || zoomOpts.y) {
      target.zoom(zoomOpts)
      // Force immediate render without animation queue
      target.render()
    }
  } finally {
    // Use requestAnimationFrame to reset the flag after the render cycle
    requestAnimationFrame(() => {
      isUpdating = false
    })
  }
}

onMounted(async () => {
  if (typeof window === 'undefined') return
  if (!chart1Container.value || !chart2Container.value) return
  
  const { createChart } = await import('@src/index')
  
  // Create first chart with animations disabled
  chart1 = createChart({
    container: chart1Container.value,
    xAxis: { label: 'Time (s)' },
    yAxis: { label: 'Temperature (°C)' },
    theme: 'midnight',
    showControls: false,
    animation: { enabled: false }, // Disable animations
  })
  
  // Disable animation config if method exists
  if (chart1.setAnimationConfig) {
    chart1.setAnimationConfig({ enabled: false })
  }
  
  const tempData = generateData(300, 25, 3)
  chart1.addSeries({
    id: 'temp',
    type: 'line',
    data: { x: tempData.x, y: tempData.y },
    style: { color: '#ff6b6b', width: 1.5 },
  })
  
  chart1.autoScale(false)
  
  // Create second chart with animations disabled
  chart2 = createChart({
    container: chart2Container.value,
    xAxis: { label: 'Time (s)' },
    yAxis: { label: 'Humidity (%)' },
    theme: 'midnight',
    showControls: false,
    animation: { enabled: false }, // Disable animations
  })
  
  // Disable animation config if method exists
  if (chart2.setAnimationConfig) {
    chart2.setAnimationConfig({ enabled: false })
  }
  
  const humidityData = generateData(300, 60, 5)
  chart2.addSeries({
    id: 'humidity',
    type: 'line',
    data: { x: humidityData.x, y: humidityData.y },
    style: { color: '#4ecdc4', width: 1.5 },
  })
  
  chart2.autoScale(false)
  
  // Set up synchronization using zoom events
  // Use 'boundsChanged' or 'zoom' event - checking both for compatibility
  const zoomEvent = 'zoom'
  
  chart1.on(zoomEvent, () => {
    syncZoom(chart1, chart2)
  })
  
  chart2.on(zoomEvent, () => {
    syncZoom(chart2, chart1)
  })
})

onUnmounted(() => {
  chart1?.destroy()
  chart2?.destroy()
})
</script>

<style scoped>
.sync-demo {
  background: #1a1a2e;
  border-radius: 8px;
  padding: 16px;
}

.info-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.badge {
  background: linear-gradient(135deg, #00f2ff, #4ecdc4);
  color: #000;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.description {
  color: #a0aec0;
  font-size: 14px;
}

.sync-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.sync-controls button {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #16213e;
  color: #a0aec0;
  cursor: pointer;
  transition: all 0.2s;
}

.sync-controls button:hover {
  border-color: #00f2ff;
  color: #fff;
}

.sync-controls button.active {
  background: linear-gradient(135deg, #00f2ff20, #4ecdc420);
  border-color: #00f2ff;
  color: #00f2ff;
}

.reset-btn {
  margin-left: auto;
}

.charts-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .charts-container {
    grid-template-columns: 1fr;
  }
}

.chart-wrapper {
  background: #16213e;
  border-radius: 8px;
  overflow: hidden;
}

.chart-label {
  padding: 8px 12px;
  font-size: 12px;
  color: #a0aec0;
  border-bottom: 1px solid #2a2a4a;
}

.chart {
  width: 100%;
  height: 200px;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #2a2a4a;
  color: #a0aec0;
  font-size: 13px;
}

.status-bar strong {
  color: #00f2ff;
}

.toggle {
  position: relative;
  width: 40px;
  height: 20px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #444;
  border-radius: 20px;
  transition: 0.3s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
}

input:checked + .slider {
  background: linear-gradient(135deg, #00f2ff, #4ecdc4);
}

input:checked + .slider:before {
  transform: translateX(20px);
}
</style>
