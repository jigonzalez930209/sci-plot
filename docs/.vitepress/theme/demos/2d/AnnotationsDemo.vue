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
    xAxis: { label: 'Time (s)', auto: true },
    yAxis: { label: 'Value', auto: true },
    theme: chartTheme.value,
    showControls: true
  })

  chart.on('render', (e: any) => {
    fps.value = Math.round(e.fps)
  })

  initAnnotationsDemo()
})

function initAnnotationsDemo() {
  const n = 2000
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  
  for (let i = 0; i < n; i++) {
    const t = (i / n) * 4 * Math.PI
    x[i] = Math.sin(t) * 0.5
    y[i] = (Math.sin(t) * Math.cos(t * 1.5) * 0.5 + Math.random() * 0.05) * 1e-5
  }
  
  chart.addSeries({
    id: 'cv-data',
    type: 'line',
    data: { x, y },
    style: { color: '#00f2ff', width: 1.5 },
  })
  
  chart.addAnnotation({
    type: 'horizontal-line',
    y: 3e-6,
    color: '#ff6b6b',
    lineWidth: 2,
    lineDash: [5, 5],
    label: 'Anodic Peak',
    labelPosition: 'right'
  })
  
  chart.addAnnotation({
    type: 'horizontal-line',
    y: -3e-6,
    color: '#4ecdc4',
    lineWidth: 2,
    lineDash: [5, 5],
    label: 'Cathodic Peak',
    labelPosition: 'right'
  })
  
  chart.addAnnotation({
    type: 'horizontal-line',
    y: 0,
    color: 'rgba(255,255,255,0.3)',
    lineWidth: 1
  })
  
  chart.addAnnotation({
    type: 'vertical-line',
    x: 0,
    color: '#a855f7',
    lineWidth: 2,
    lineDash: [3, 3],
    label: 'E½',
    labelPosition: 'top'
  })
  
  chart.addAnnotation({
    type: 'band',
    xMin: -0.3,
    xMax: 0.3,
    fillColor: 'rgba(168, 85, 247, 0.1)',
    label: 'Redox Region'
  })
  
  chart.addAnnotation({
    type: 'text',
    x: 0.35,
    y: 4e-6,
    text: '📊 CV Scan #1',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 6
  })
  
  chart.addAnnotation({
    type: 'arrow',
    x1: 0.4,
    y1: 2e-6,
    x2: 0.15,
    y2: 3.5e-6,
    color: '#ffe66d',
    lineWidth: 2,
    headSize: 8
  })
  
  pointCount.value = n
}

function resetDemo() {
  if (chart) {
    chart.clearAnnotations?.()
    chart.getAllSeries().forEach((s: any) => chart.removeSeries(s.getId()))
    initAnnotationsDemo()
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
    <p class="chart-hint">Scroll to zoom • Drag to pan • Right-drag for box zoom</p>
  </div>
</template>

<style scoped>
@import "../../demos.css";
</style>
