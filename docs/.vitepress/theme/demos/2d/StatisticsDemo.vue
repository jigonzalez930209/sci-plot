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
    showStatistics: true, // Key feature for this demo
    showControls: true
  })

  chart.on('render', (e: any) => {
    fps.value = Math.round(e.fps)
  })

  initDemo()
})

function initDemo() {
  const n = 10000;
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  
  for (let i = 0; i < n; i++) {
    const t = i / (n / 20);
    x[i] = t;
    y[i] = Math.sin(t) * Math.cos(t * 0.3) + Math.sin(t * 5) * 0.2 + (Math.random() - 0.5) * 0.1;
  }
  
  chart.addSeries({
    id: 'data',
    type: 'line',
    data: { x, y },
    style: { color: '#00f2ff', width: 2 },
  });
  
  pointCount.value = n
}

function resetDemo() {
  if (chart) {
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
    <div ref="chartContainer" class="chart-container" :style="{ height: height || '450px' }"></div>
    <p class="chart-hint">The statistics panel is in the bottom-right corner. Zoom/pan to see it update.</p>
  </div>
</template>

<style scoped>
@import "../../demos.css";
</style>
