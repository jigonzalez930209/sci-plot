<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  height?: string
}>()

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const fps = ref(0)
const selectedPoints = ref<number>(0)
let chart: any = null

const chartTheme = computed(() => isDark.value ? 'midnight' : 'light')

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return
  const { createChart } = await import('@src/index')
  
  chart = createChart({
    container: chartContainer.value,
    theme: chartTheme.value,
    showControls: true,
    tooltip: { enabled: false }
  })

  chart.on('render', (e: any) => {
    fps.value = Math.round(e.fps)
  })

  // Listen to selection changes
  chart.on('selectionChange', (e: any) => {
    selectedPoints.value = e.selected?.length || 0
  })

  // Disable pan mode to enable selection
  chart.setPanMode(false)

  initDemo()
})

function initDemo() {
  const n = 1000
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  
  for (let i = 0; i < n; i++) {
    x[i] = Math.random() * 100
    y[i] = Math.random() * 100
  }
  
  chart.addSeries({
    id: 'selectable',
    type: 'scatter',
    data: { x, y },
    style: { 
      color: '#4ecdc4', 
      pointSize: 6,
      selectionStyle: { color: '#ff6b6b', pointSize: 10 }
    },
  })
}

function resetDemo() {
  if (chart) {
    chart.clearAnnotations?.()
    chart.getAllSeries().forEach((s: any) => chart.removeSeries(s.getId()))
    selectedPoints.value = 0
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
          🎯 Selected: <strong>{{ selectedPoints }}</strong>
        </span>
        <span class="stat">
          🚀 <strong>{{ fps }}</strong> FPS
        </span>
      </div>
      <div class="chart-controls">
        <button @click="resetDemo" class="btn">🔄 Reset</button>
      </div>
    </div>
    <div ref="chartContainer" class="chart-container" :style="{ height: height || '400px' }"></div>
    <p class="chart-hint">Click or drag-select points to highlight. Double-click to clear.</p>
  </div>
</template>

<style scoped>
@import "../../demos.css";
</style>
