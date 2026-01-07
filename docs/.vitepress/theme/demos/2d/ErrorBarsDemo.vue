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

const chartTheme = computed(() => isDark.value ? 'midnight' : 'light')

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return
  const { createChart } = await import('@src/index')
  
  chart = createChart({
    container: chartContainer.value,
    theme: chartTheme.value,
    showControls: true
  })

  chart.on('render', (e: any) => {
    fps.value = Math.round(e.fps)
  })

  initDemo()
})

function initDemo() {
  const n = 8
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  const yError = new Float32Array(n)
  
  for (let i = 0; i < n; i++) {
    x[i] = (i + 1) * 0.1
    y[i] = x[i] * 50 + 2 + (Math.random() - 0.5) * 3
    yError[i] = 1 + Math.random() * 2
  }
  
  chart.addSeries({
    id: 'calibration',
    type: 'line+scatter',
    data: { x, y, yError },
    style: { 
      color: '#00f2ff',
      width: 2,
      pointSize: 8,
      errorBars: { color: '#00f2ff', width: 1.5, capWidth: 10, opacity: 0.8 }
    },
  })
  
  const x2 = new Float32Array([0.2, 0.4, 0.6, 0.8])
  const y2 = new Float32Array([8, 18, 30, 42])
  const yErrorPlus = new Float32Array([4, 3, 5, 6])
  const yErrorMinus = new Float32Array([2, 1.5, 2.5, 3])
  
  chart.addSeries({
    id: 'asymmetric',
    type: 'scatter',
    data: { x: x2, y: y2, yErrorPlus, yErrorMinus },
    style: { 
      color: '#ff6b6b',
      pointSize: 10,
      errorBars: { color: '#ff6b6b', width: 2, capWidth: 8, opacity: 0.7 }
    },
  })
  
  chart.addAnnotation({ type: 'text', x: 0.6, y: 50, text: '🔵 Symmetric Error', fontSize: 12, backgroundColor: 'rgba(0,0,0,0.7)' })
  chart.addAnnotation({ type: 'text', x: 0.6, y: 45, text: '🔴 Asymmetric Error', fontSize: 12, backgroundColor: 'rgba(0,0,0,0.7)' })
  
  pointCount.value = n + 4
}

function resetDemo() {
  if (chart) {
    chart.clearAnnotations?.()
    chart.getAllSeries().forEach((s: any) => chart.removeSeries(s.getId()))
    initDemo()
  }
}

onUnmounted(() => {
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
      </div>
      <div class="chart-controls">
        <button @click="resetDemo" class="btn">🔄 Reset</button>
      </div>
    </div>
    <div ref="chartContainer" class="chart-container" :style="{ height: height || '400px' }"></div>
    <p class="chart-hint">Scroll to zoom • Drag to pan • Error bars support</p>
  </div>
</template>

<style scoped>
@import "../../demos.css";
</style>
