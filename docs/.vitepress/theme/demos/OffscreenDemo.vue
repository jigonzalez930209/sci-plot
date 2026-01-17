<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useData } from 'vitepress'

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const isWorkerActive = ref(false)
const fps = ref(0)
let chart: any = null

const chartTheme = computed(() => isDark.value ? 'midnight' : 'light')

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return
  const { createChart, PluginOffscreen, PluginTools } = await import('@src/index')
  
  chart = createChart({
    container: chartContainer.value,
    theme: chartTheme.value,
    showControls: true
  })

  // Attempt to use Offscreen plugin
  try {
    await chart.use(PluginOffscreen({
      enabled: true,
      workerPool: 1
    }))
    isWorkerActive.value = chart.offscreen?.isEnabled() || false
  } catch (e) {
    console.warn('Offscreen rendering failed to initialize:', e)
  }

  await chart.use(PluginTools({ useEnhancedTooltips: true }))

  const n = 500000
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    x[i] = i
    y[i] = Math.sin(i * 0.001) + (Math.random() - 0.5) * 0.2
  }

  chart.addSeries({
    id: 'offscreen-data',
    type: 'line',
    data: { x, y },
    style: { color: '#fbbf24', width: 1.5 }
  })

  // Ensure proper rendering and bounds
  setTimeout(() => {
    if (chart) {
      chart.resize()
      chart.autoScale(false)
      chart.render()
    }
  }, 150)

  chart.on('render', (e: any) => {
    fps.value = Math.round(e.fps)
  })
})

onUnmounted(() => {
  if (chart) chart.destroy()
})
</script>

<template>
  <div class="chart-demo" :class="{ dark: isDark }">
    <div class="chart-header">
      <div class="status-badge" :class="{ active: isWorkerActive }">
        <span class="dot"></span>
        {{ isWorkerActive ? 'Worker Thread Active' : 'Main Thread Fallback' }}
      </div>
      <div class="chart-stats">
        <span class="stat">🚀 <strong>{{ fps }}</strong> FPS</span>
      </div>
    </div>

    <div ref="chartContainer" class="chart-container" style="height: 400px;"></div>
    
    <p class="chart-hint">Rendering 500k points. Try resizing the window or interacting quickly!</p>
  </div>
</template>

<style scoped>
@import "../demos.css";

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-badge.active {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.2);
}

.status-badge .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #666;
}

.status-badge.active .dot {
  background: #10b981;
  box-shadow: 0 0 10px #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}
</style>
