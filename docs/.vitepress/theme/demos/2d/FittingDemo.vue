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
  const n = 50;
  
  // 1. Linear Data (Blue Dots)
  const x1 = new Float32Array(n);
  const y1 = new Float32Array(n);
  const slope = 50.0; // Updated to 5 as requested
  const intercept = -1200;
  for (let i = 0; i < n; i++) {
    x1[i] = i;
    y1[i] = slope * i + intercept + (Math.random() - 0.5) * 25; // Slightly more noise for steeper slope
  }
  
  chart.addSeries({
    id: 'noisy-linear',
    name: 'Linear Sample',
    type: 'scatter',
    data: { x: x1, y: y1 },
    style: { color: '#00f2ff', pointSize: 6, symbol: 'circle' },
  });
  
  // Use the built-in addFitLine with descriptive labels
  chart.addFitLine('noisy-linear', 'linear', { label: 'Linear', precision: 3 });

  // 2. Polynomial Data (Red Squares)
  const x2 = new Float32Array(n);
  const y2 = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const val = (i - n/2) / 5;
    x2[i] = i;
    y2[i] = (Math.pow(val, 3) - 2 * val) * 10 + 60 + (Math.random() - 0.5) * 40;
  }
  
  chart.addSeries({
    id: 'noisy-poly',
    name: 'Polynomial Sample',
    type: 'scatter',
    data: { x: x2, y: y2 },
    style: { color: '#ff6b6b', pointSize: 6, symbol: 'square' },
  });
  
  // Use the built-in addFitLine for cubic polynomial
  chart.addFitLine('noisy-poly', 'polynomial', { degree: 3, label: 'Cubic', precision: 2 });
  
  pointCount.value = n * 2
  
  // Ensure proper rendering after lazy loading
  setTimeout(() => {
    if (chart) {
      chart.resize()
      chart.autoScale(false)
      chart.render()
    }
  }, 100)
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
    <p class="chart-hint">Scroll to zoom • Drag to pan • Linear and Polynomial Regression</p>
  </div>
</template>

<style scoped>
@import "../../demos.css";
</style>
