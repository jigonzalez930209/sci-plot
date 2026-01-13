<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  height?: string
}>()

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const savedState = ref<string | null>(null)
let chart: any = null

const chartTheme = computed(() => isDark.value ? 'midnight' : 'light')

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return
  const { createChart } = await import('@src/index')
  const { PluginTools } = await import('@src/plugins')
  
  chart = createChart({
    container: chartContainer.value,
    theme: chartTheme.value,
    showControls: true
  })

  await chart.use(PluginTools({ useEnhancedTooltips: true }))

  initDemo()
})

function initDemo() {
  const n = 100
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    x[i] = i
    y[i] = Math.sin(i * 0.1) * 10
  }
  chart.addSeries({
    id: 's1',
    type: 'line',
    data: { x, y },
    style: { color: '#00f2ff' }
  })
}

function saveState() {
  if (chart) {
    const state = chart.serialize()
    savedState.value = JSON.stringify(state, null, 2).slice(0, 100) + '...'
    localStorage.setItem('sc_demo_state', JSON.stringify(state))
  }
}

function loadState() {
  const raw = localStorage.getItem('sc_demo_state')
  if (raw && chart) {
    const state = JSON.parse(raw)
    chart.deserialize(state)
  }
}

onUnmounted(() => {
  if (chart) chart.destroy()
})
</script>

<template>
  <div class="chart-demo" :class="{ dark: isDark }">
    <div class="chart-header">
      <div class="chart-controls">
        <button @click="saveState" class="btn btn-primary">💾 Save State</button>
        <button @click="loadState" class="btn">📂 Load State</button>
        <span v-if="savedState" style="font-size: 10px; opacity: 0.6">Last saved: {{ savedState }}</span>
      </div>
    </div>
    <div ref="chartContainer" class="chart-container" :style="{ height: height || '300px' }"></div>
    <p class="chart-hint">Save the chart state to localStorage and restore it later.</p>
  </div>
</template>

<style scoped>
@import "../../demos.css";
</style>
