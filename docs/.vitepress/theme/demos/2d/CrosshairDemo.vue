<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  height?: string
}>()

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const fps = ref(0)
const pointCount = ref(0)
let chart: any = null
let chartModules: { createChart: any } | null = null

const chartTheme = computed(() => (isDark.value ? 'midnight' : 'light'))

// Interactive controls
const valueDisplayMode = ref<'disabled' | 'corner' | 'floating'>('corner')
const cornerPosition = ref<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-right')
const lineStyle = ref<'solid' | 'dashed' | 'dotted'>('dashed')
const snapToData = ref(false)

// Signal data (cached for recreation)
let signalData: { x: Float32Array; y1: Float32Array; y2: Float32Array } | null = null

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return

  const indexModule = await import('@src/index')
  chartModules = { createChart: indexModule.createChart }

  generateSignalData()
  await createChartWithConfig()
})

function generateSignalData() {
  const n = 2000
  const x = new Float32Array(n)
  const y1 = new Float32Array(n)
  const y2 = new Float32Array(n)

  for (let i = 0; i < n; i++) {
    const t = i / 50
    x[i] = t
    y1[i] = Math.sin(t) * 1.5 + 2
    y2[i] = Math.cos(t * 0.7) * 1.2 - 1
  }

  signalData = { x, y1, y2 }
  pointCount.value = n * 2
}

async function createChartWithConfig() {
  if (!chartModules || !chartContainer.value || !signalData) return

  // Destroy existing chart if any
  if (chart) {
    chart.destroy()
    chart = null
  }

  const { createChart } = chartModules

  chart = createChart({
    container: chartContainer.value,
    xAxis: { label: 'Time (s)', auto: true },
    yAxis: { label: 'Amplitude', auto: true },
    theme: chartTheme.value,
    showControls: true,
  })

  chart.on('render', (e: any) => {
    fps.value = Math.round(e.fps)
  })

  chart.addSeries({
    id: 'signal-a',
    name: 'Signal A',
    type: 'line',
    data: { x: signalData.x, y: signalData.y1 },
    style: { color: '#00f2ff', width: 2 },
  })

  chart.addSeries({
    id: 'signal-b',
    name: 'Signal B',
    type: 'line',
    data: { x: signalData.x, y: signalData.y2 },
    style: { color: '#ff9f1c', width: 1.6, lineDash: [6, 6] },
  })

  // Use native cursor with new options
  chart.enableCursor({
    enabled: true,
    crosshair: true,
    snap: snapToData.value,
    valueDisplayMode: valueDisplayMode.value,
    cornerPosition: cornerPosition.value,
    lineStyle: lineStyle.value,
  })

  setTimeout(() => {
    if (chart) {
      chart.resize()
      chart.autoScale(false)
      chart.render()
    }
  }, 100)
}

function resetDemo() {
  generateSignalData()
  createChartWithConfig()
}

onUnmounted(() => {
  if (chart) chart.destroy()
})

watch(isDark, () => {
  if (!chart) return
  chart.setTheme(chartTheme.value)
  setTimeout(() => {
    chart.resize()
    chart.render()
  }, 100)
})

// Recreate chart when cursor settings change
watch([valueDisplayMode, cornerPosition, lineStyle, snapToData], createChartWithConfig)
</script>

<template>
  <div class="chart-demo" :class="{ dark: isDark }">
    <div class="chart-header">
      <div class="chart-stats">
        <span class="stat">
          📊 <strong>{{ pointCount.toLocaleString() }}</strong> points
        </span>
        <span class="stat" :class="{ good: fps >= 55, warn: fps >= 30 && fps < 55, bad: fps < 30 }">
          🎯 <strong>{{ fps }}</strong> FPS
        </span>
      </div>
      <div class="chart-controls">
        <button @click="resetDemo" class="btn">🔄 Reset</button>
      </div>
    </div>

    <!-- Interactive Controls Panel -->
    <div class="controls-panel">
      <div class="control-group">
        <label>Value Display:</label>
        <select v-model="valueDisplayMode" class="control-select">
          <option value="disabled">Disabled</option>
          <option value="corner">Corner Box</option>
          <option value="floating">Floating</option>
        </select>
      </div>

      <div class="control-group" v-if="valueDisplayMode === 'corner'">
        <label>Corner:</label>
        <select v-model="cornerPosition" class="control-select">
          <option value="top-left">Top Left</option>
          <option value="top-right">Top Right</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-right">Bottom Right</option>
        </select>
      </div>

      <div class="control-group">
        <label>Line Style:</label>
        <select v-model="lineStyle" class="control-select">
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </div>

      <div class="control-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="snapToData" />
          Snap to Data
        </label>
      </div>
    </div>

    <div ref="chartContainer" class="chart-container" :style="{ height: height || '400px' }"></div>
    <p class="chart-hint">Hover to see crosshair • Scroll to zoom • Drag to pan</p>
  </div>
</template>

<style scoped>
@import "../../demos.css";

.controls-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.dark .controls-panel {
  background: rgba(255, 255, 255, 0.05);
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.control-group label {
  color: #666;
  font-weight: 500;
}

.dark .control-group label {
  color: #aaa;
}

.control-select {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  border: 1px solid #ddd;
  background: #fff;
  font-size: 0.875rem;
  cursor: pointer;
}

.dark .control-select {
  background: #2a2a2a;
  border-color: #444;
  color: #eee;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
}

.checkbox-label input {
  cursor: pointer;
}
</style>
