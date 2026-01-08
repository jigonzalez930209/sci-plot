<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  height?: string
  points?: number
}>()

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const fps = ref(0)
const pointCount = ref(0)
let chart: any = null

const chartTheme = computed(() => isDark.value ? 'midnight' : 'light')

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return
  
  // Clean up any existing chart instance (for HMR)
  if (chart) {
    try {
      chart.destroy()
    } catch (e) {
      // Ignore errors if chart was already destroyed
    }
    chart = null
  }
  
  const { createChart } = await import('@src/index')
  
  chart = createChart({
    container: chartContainer.value,
    xAxis: { label: 'Time (s)', auto: true },
    yAxis: { label: 'Value', auto: true },
    theme: chartTheme.value,
    showControls: true
  })

  chart.on('render', (e: any) => {
    fps.value = Math.round(e.fps)
  })

  const n = props.points || 10000
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    x[i] = i / (n / 20)
    y[i] = Math.sin(x[i]) * Math.cos(x[i] * 0.5) + Math.sin(x[i] * 3) * 0.3 + Math.random() * 0.1
  }

  chart.addSeries({
    id: 'data',
    type: 'line',
    data: { x, y },
    style: { color: '#00f2ff', width: 1.5 },
  })
  pointCount.value = n
  
  // Ensure proper rendering after lazy loading
  setTimeout(() => {
    if (chart) {
      chart.resize()
      chart.autoScale(false)
      chart.render()
    }
  }, 100)
})

onUnmounted(() => {
  if (chart) chart.destroy()
})

watch(isDark, () => {
  if (chart) {
    chart.setTheme(chartTheme.value)
    setTimeout(() => {
      chart.resize()
      chart.render()
    }, 100)
  }
})

function resetDemo() {
  if (chart) {
    chart.getAllSeries().forEach((s: any) => chart.removeSeries(s.getId()))
    // Re-init data
    const n = props.points || 10000
    const x = new Float32Array(n)
    const y = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      x[i] = i / (n / 20)
      y[i] = Math.sin(x[i]) * Math.cos(x[i] * 0.5) + Math.sin(x[i] * 3) * 0.3 + Math.random() * 0.1
    }
    chart.addSeries({
      id: 'data',
      type: 'line',
      data: { x, y },
      style: { color: '#00f2ff', width: 1.5 },
    })
    pointCount.value = n
  }
}
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
      </div>
      <div class="chart-controls">
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
