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
  const n = 50
  const x = new Float32Array(n)
  const y1 = new Float32Array(n)
  const y2 = new Float32Array(n)
  const y3 = new Float32Array(n)
  
  for (let i = 0; i < n; i++) {
    x[i] = i
    y1[i] = Math.floor(Math.sin(i * 0.3) * 3 + 5)
    y2[i] = Math.floor(Math.cos(i * 0.2) * 2 + 3)
    y3[i] = Math.floor(Math.sin(i * 0.15) * 4 + 8)
  }
  
  chart.addSeries({
    id: 'step-after',
    type: 'step',
    data: { x, y: y1 },
    style: { color: '#ff6b6b', width: 2, stepMode: 'after' },
  })
  
  chart.addSeries({
    id: 'step-before',
    type: 'step',
    data: { x, y: y2 },
    style: { color: '#4ecdc4', width: 2, stepMode: 'before' },
  })
  
  chart.addSeries({
    id: 'step-center',
    type: 'step+scatter',
    data: { x, y: y3 },
    style: { color: '#ffe66d', width: 2, pointSize: 5, stepMode: 'center' },
  })
  
  chart.addAnnotation({ type: 'text', x: 2, y: 5, text: 'After Mode (red)', fontSize: 11, backgroundColor: 'rgba(0,0,0,0.7)' })
  chart.addAnnotation({ type: 'text', x: 2, y: 3, text: 'Before Mode (teal)', fontSize: 11, backgroundColor: 'rgba(0,0,0,0.7)' })
  chart.addAnnotation({ type: 'text', x: 2, y: 8, text: 'Center Mode (yellow)', fontSize: 11, backgroundColor: 'rgba(0,0,0,0.7)' })
  
  pointCount.value = n * 3
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
    <p class="chart-hint">Scroll to zoom • Drag to pan • Step modes visualization</p>
  </div>
</template>

<style scoped>
@import "../../demos.css";
</style>
