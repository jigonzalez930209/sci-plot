<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  height?: string
}>()

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const isRunning = ref(false)
const currentCycle = ref(0)
const totalCycles = ref(10)
const currentPotential = ref(0)
const dataPointCount = ref(0)
const status = ref('Ready')

const cycleOptions = [
  { label: '1 Cycle', value: 1 },
  { label: '3 Cycles', value: 3 },
  { label: '5 Cycles', value: 5 },
  { label: '10 Cycles', value: 10 },
  { label: 'Infinite', value: 999999 }
]

const scanRateOptions = [
  { label: '50 mV/s', value: 50 },
  { label: '100 mV/s', value: 100 },
  { label: '200 mV/s', value: 200 },
  { label: '500 mV/s', value: 500 }
]

let chart: any = null
let animationId: number | null = null
let direction = 1 // 1 = forward, -1 = reverse
let potential = -1000
const vStart = -1000
const vEnd = 1000
const selectedCycles = ref(10)
const selectedScanRate = ref(100)

const chartTheme = computed(() => isDark.value ? 'midnight' : 'light')

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return
  const { createChart } = await import('@src/index')
  
  chart = createChart({
    container: chartContainer.value,
    xAxis: { 
      label: 'Potential (mV)',
      auto: true
    },
    yAxis: { 
      label: 'Current (µA)',
      auto: true
    },
    theme: chartTheme.value,
    showControls: true,
    loading: false
  })

  chart.addSeries({
    id: 'cv',
    type: 'line',
    data: { x: new Float32Array(0), y: new Float32Array(0) },
    style: { color: '#2196F3', width: 2 }
  })
})

// Simulate CV current response (simplified Randles-Sevcik equation)
function calculateCurrent(pot: number): number {
  // Simplified current response with peak characteristics
  const anodic = 100 * Math.exp(-Math.pow((pot - 200) / 300, 2))
  const cathodic = -80 * Math.exp(-Math.pow((pot + 200) / 300, 2))
  
  // Add capacitive current
  const capacitive = 0.5 * direction
  
  // Add noise
  const noise = (Math.random() - 0.5) * 1.5
  
  return anodic + cathodic + capacitive + noise
}

function animate() {
  if (!chart || !isRunning.value) return
  
  const scanRate = selectedScanRate.value
  
  // Update potential (60 FPS, so dt = 1/60 s)
  const dt = 1 / 60
  potential += direction * scanRate * dt
  
  // Check for direction reversal
  if (potential >= vEnd && direction === 1) {
    direction = -1
    potential = vEnd
  } else if (potential <= vStart && direction === -1) {
    direction = 1
    potential = vStart
    currentCycle.value++
    
    // Check if we've completed all cycles
    if (currentCycle.value >= totalCycles.value) {
      stopSimulation()
      status.value = 'Completed'
      return
    }
  }
  
  // Calculate current
  const current = calculateCurrent(potential)
  
  // Append data to chart
  chart.appendData('cv', 
    new Float32Array([potential]),
    new Float32Array([current])
  )
  
  dataPointCount.value++
  currentPotential.value = Math.round(potential)
  
  // Continue animation
  animationId = requestAnimationFrame(animate)
}

function startSimulation() {
  if (isRunning.value) return
  
  totalCycles.value = selectedCycles.value
  
  // Reset if starting fresh
  if (currentCycle.value === 0 && dataPointCount.value === 0) {
    potential = vStart
    direction = 1
  }
  
  isRunning.value = true
  status.value = 'Running'
  
  animate()
}

function stopSimulation() {
  isRunning.value = false
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  status.value = 'Stopped'
}

function resetSimulation() {
  stopSimulation()
  currentCycle.value = 0
  dataPointCount.value = 0
  potential = vStart
  direction = 1
  currentPotential.value = 0
  status.value = 'Ready'
  
  if (chart) {
    chart.removeSeries('cv')
    chart.addSeries({
      id: 'cv',
      type: 'line',
      data: { x: new Float32Array(0), y: new Float32Array(0) },
      style: { color: '#2196F3', width: 2 }
    })
  }
}

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
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
          ⚡ <strong>{{ status }}</strong>
        </span>
        <span class="stat">
          🔄 Cycle: <strong>{{ currentCycle + 1 }} / {{ totalCycles === 999999 ? '∞' : totalCycles }}</strong>
        </span>
        <span class="stat">
          📊 <strong>{{ currentPotential }}</strong> mV
        </span>
        <span class="stat">
          📈 <strong>{{ dataPointCount.toLocaleString() }}</strong> points
        </span>
      </div>
      <div class="chart-controls">
        <select v-model="selectedCycles" class="btn select" :disabled="isRunning">
          <option v-for="opt in cycleOptions" :key="opt.label" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <select v-model="selectedScanRate" class="btn select" :disabled="isRunning">
          <option v-for="opt in scanRateOptions" :key="opt.label" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <button @click="isRunning ? stopSimulation() : startSimulation()" class="btn btn-primary">
          {{ isRunning ? '⏸ Stop' : '▶ Start' }}
        </button>
        <button @click="resetSimulation" class="btn">🔄 Reset</button>
      </div>
    </div>
    <div ref="chartContainer" class="chart-container" :style="{ height: height || '400px' }"></div>
    <p class="chart-hint">
      ✨ Notice: X-axis (Potential) remains stable during streaming • Y-axis (Current) auto-scales smoothly
    </p>
  </div>
</template>

<style scoped>
@import "../../demos.css";
</style>
