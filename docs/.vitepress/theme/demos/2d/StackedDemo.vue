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
  const n = 100;
  const x = new Float32Array(n);
  const y1 = new Float32Array(n);
  const y2 = new Float32Array(n);
  const y3 = new Float32Array(n);
  
  for (let i = 0; i < n; i++) {
    x[i] = i;
    y1[i] = 10 + Math.sin(i * 0.1) * 5 + Math.random() * 2;
    y2[i] = 8 + Math.cos(i * 0.1) * 4 + Math.random() * 2;
    y3[i] = 12 + Math.sin(i * 0.15) * 6 + Math.random() * 2;
  }
  
  const stackId = 'my-stack';
  
  chart.addSeries({
    id: 'Baseline (S1)',
    type: 'area',
    stackId,
    data: { x, y: y1 },
    style: { color: 'rgba(255, 107, 107, 0.7)' }
  });
  
  chart.addSeries({
    id: 'Middle (S2)',
    type: 'area',
    stackId,
    data: { x, y: y2 },
    style: { color: 'rgba(78, 205, 196, 0.7)' }
  });
  
  chart.addSeries({
    id: 'Top (S3)',
    type: 'area',
    stackId,
    data: { x, y: y3 },
    style: { color: 'rgba(255, 230, 109, 0.7)' }
  });
  
  chart.zoom({ y: [0, 40] });
  pointCount.value = n * 3;
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
    <p class="chart-hint">Scroll to zoom • Drag to pan • Stacked area charts</p>
  </div>
</template>

<style scoped>
@import "../../demos.css";
</style>
