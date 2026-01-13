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
const isRunning = ref(false)
const hasStarted = ref(false)
const windowSize = ref<number | null>(50000)

const windowSizeOptions = [
  { label: '10K', value: 10000 },
  { label: '20K', value: 20000 },
  { label: '50K', value: 50000 },
  { label: '100K', value: 100000 },
  { label: '∞ Infinite', value: null }
]

let chart: any = null
let animationId: number | null = null
let tRef = 0

const chartTheme = computed(() => isDark.value ? 'midnight' : 'light')

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return
  const { createChart } = await import('@src/index')
  const { PluginTools } = await import('@src/plugins')
  
  chart = createChart({
    container: chartContainer.value,
    xAxis: { label: 'Time (s)', auto: true },
    yAxis: { label: 'Value', auto: true },
    theme: chartTheme.value,
    showControls: true,
    loading: false
  })

  await chart.use(PluginTools({ useEnhancedTooltips: true }))

  chart.on('render', (e: any) => {
    fps.value = Math.round(e.fps)
  })

  // No longer auto-starts - user must click "Start" button
})

const pointsPerFrame = 25

function animate() {
  if (!chart || !isRunning.value) return
  
  const batchX = new Float32Array(pointsPerFrame)
  const batchY = new Float32Array(pointsPerFrame)
  
  for (let i = 0; i < pointsPerFrame; i++) {
    batchX[i] = tRef
    const phase = Math.floor(tRef / 100) % 4
    let signal: number
    if (phase === 0) signal = Math.sin(tRef * 0.1)
    else if (phase === 1) signal = Math.sin(tRef * 0.1) + Math.sin(tRef * 0.3) / 3
    else if (phase === 2) signal = ((tRef * 0.05) % (2 * Math.PI)) / Math.PI - 1
    else signal = Math.sin(tRef * 0.1 + Math.sin(tRef * 0.01) * 3)
    
    batchY[i] = signal + Math.random() * 0.05
    tRef += 0.01
  }

  chart.appendData('stream', batchX, batchY)
  pointCount.value = chart.getSeries('stream').getPointCount()
  animationId = requestAnimationFrame(animate)
}

function startRealtime() {
  isRunning.value = true
  hasStarted.value = true
  tRef = 0
  
  const seriesOptions: any = {
    id: 'stream',
    type: 'line',
    data: { x: new Float32Array(0), y: new Float32Array(0) },
    style: { color: '#00f2ff', width: 2 },
  }
  
  if (windowSize.value !== null) {
    seriesOptions.maxPoints = windowSize.value
  }
  
  chart.addSeries(seriesOptions)
  chart.setAutoScroll(true)
  
  animationId = requestAnimationFrame(animate)
}

function toggleRealtime() {
  if (isRunning.value) {
    // Pause
    isRunning.value = false
    if (animationId) cancelAnimationFrame(animationId)
  } else {
    // Start or Resume
    if (!hasStarted.value) {
      startRealtime()
    } else {
      isRunning.value = true
      animationId = requestAnimationFrame(animate)
    }
  }
}

function resetDemo() {
  if (animationId) cancelAnimationFrame(animationId)
  isRunning.value = false
  hasStarted.value = false
  if (chart) {
    chart.getAllSeries().forEach((s: any) => chart.removeSeries(s.getId()))
  }
  pointCount.value = 0
}

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (chart) chart.destroy()
})

watch(isDark, (val) => {
  if (chart) {
    chart.setTheme(chartTheme.value)
    setTimeout(() => {
      chart.resize()
      chart.render()
    }, 100)
  }
})
</script>

<template>
  <div class="chart-demo" :class="{ dark: isDark }">
    <div class="chart-header">
      <div class="chart-stats">
        <span class="stat">
          📊 <strong>{{ pointCount.toLocaleString() }}</strong> points
        </span>
        <span class="stat" :class="{ good: fps >= 55, warn: fps >= 30 && fps < 55, bad: fps < 30 }">
          🚀 <strong>{{ fps }}</strong> FPS
        </span>
        <span class="stat">
          📏 Window: <strong>{{ windowSize === null ? '∞' : (windowSize / 1000) + 'K' }}</strong>
        </span>
      </div>
      <div class="chart-controls">
        <button @click="toggleRealtime" class="btn btn-primary">
          {{ isRunning ? '⏸ Pause' : '▶ Start' }}
        </button>
        <select v-model="windowSize" @change="resetDemo" class="btn select" :disabled="isRunning">
          <option v-for="opt in windowSizeOptions" :key="opt.label" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <button @click="resetDemo" class="btn">🔄 Reset</button>
      </div>
    </div>
    <div ref="chartContainer" class="chart-container" :style="{ height: height || '400px' }"></div>
    <p class="chart-hint">Scroll to zoom • Drag to pan • Right-drag for box zoom</p>
  </div>
</template>

<style scoped>
@import "../../demos.css";
</style>
