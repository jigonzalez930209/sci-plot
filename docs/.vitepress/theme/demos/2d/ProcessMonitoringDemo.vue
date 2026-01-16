<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  height?: string
}>()

const { isDark } = useData()
const signalContainer = ref<HTMLElement | null>(null)
const gaugeContainer = ref<HTMLElement | null>(null)
const sankeyContainer = ref<HTMLElement | null>(null)

const isInitialized = ref(false)
const transformActive = ref(false)
const smoothedActive = ref(false)
const currentRate = ref(65)

let signalChart: any = null
let gaugeChart: any = null
let sankeyChart: any = null

const chartTheme = computed(() => isDark.value ? 'midnight' : 'light')

// Initial Signal Data
function generateSignalData(points = 100) {
  const x = new Float32Array(points)
  const y = new Float32Array(points)
  for (let i = 0; i < points; i++) {
    x[i] = i
    // Base sine + high frequency noise + spike
    y[i] = Math.sin(i * 0.2) * 20 + 50 + (Math.random() - 0.5) * 15
    if (i === 50) y[i] += 40 // Anomaly
  }
  return { x, y }
}

onMounted(async () => {
  if (typeof window === 'undefined') return
  
  // Wait for containers
  let attempts = 0
  while ((!signalContainer.value || !gaugeContainer.value || !sankeyContainer.value) && attempts < 20) {
    await new Promise(r => setTimeout(r, 50))
    attempts++
  }

  try {
    const { createChart } = await import('@src/index')
    const { PluginDataTransform } = await import('@src/plugins')
    
    // 1. Signal Processing Chart
    signalChart = createChart({
      container: signalContainer.value!,
      theme: chartTheme.value,
      showControls: true
    })
    await signalChart.use(PluginDataTransform())
    
    const data = generateSignalData()
    signalChart.addSeries({
      id: 'sensor-raw',
      name: 'Raw Sensor Data',
      type: 'line',
      data,
      style: { color: isDark.value ? '#64748b' : '#94a3b8', width: 1.5, opacity: 0.6 }
    })
    
    // 2. Gauge Chart
    gaugeChart = createChart({
      container: gaugeContainer.value!,
      theme: chartTheme.value,
      showControls: false,
      showLegend: false, // Cleaner for small KPIs
      loading: false     // Disable overlay for small nested charts
    })
    gaugeChart.addSeries({
      id: 'efficiency',
      type: 'gauge',
      data: { value: 65, min: 0, max: 100 },
      style: {
        label: 'PROCESS EFFICIENCY',
        needleColor: '#00ccff',
        ranges: [
          { from: 0, to: 40, color: 'rgba(244, 67, 54, 0.4)' },
          { from: 40, to: 75, color: 'rgba(255, 235, 59, 0.4)' },
          { from: 75, to: 100, color: 'rgba(76, 175, 80, 0.4)' }
        ]
      }
    })

    // 3. Sankey Chart
    sankeyChart = createChart({
      container: sankeyContainer.value!,
      theme: chartTheme.value,
      showControls: false,
      showLegend: false,
      loading: false
    })
    sankeyChart.addSeries({
      id: 'resource-flow',
      type: 'sankey',
      data: {
        nodes: [
          { id: 'input', name: 'Raw Material', color: '#6366f1' },
          { id: 'process', name: 'Reaction', color: '#10b981' },
          { id: 'output', name: 'Product', color: '#3b82f6' },
          { id: 'waste', name: 'Byproduct', color: '#f43f5e' }
        ],
        links: [
          { source: 'input', target: 'process', value: 100 },
          { source: 'process', target: 'output', value: 85 },
          { source: 'process', target: 'waste', value: 15 }
        ]
      },
      style: {
        nodeWidth: 20,
        linkOpacity: 0.4,
        showLabels: true
      }
    })

    isInitialized.value = true
    startSim()
  } catch (err) {
    console.error('ProcessMonitoringDemo: Init failed', err)
  }
})

let timer: any = null
let gaugeTimer: any = null

function startSim() {
  // 1. High-frequency Gauge Update (Smooth movement)
  gaugeTimer = setInterval(() => {
    if (!isInitialized.value || !gaugeChart) return
    const target = 60 + Math.random() * 25
    currentRate.value = currentRate.value + (target - currentRate.value) * 0.1
    gaugeChart.updateSeries('efficiency', { value: currentRate.value })
  }, 100)

  // 2. Process simulation (Signal + Sankey)
  timer = setInterval(() => {
    if (!isInitialized.value) return
    
    // Update Signal (rolling)
    const series = signalChart?.getSeries('sensor-raw')
    if (series) {
      const data = series.getData()
      const lastX = data.x[data.x.length - 1]
      const nextY = Math.sin((lastX + 1) * 0.2) * 20 + 50 + (Math.random() - 0.5) * 15
      
      signalChart.updateSeries('sensor-raw', {
        x: new Float32Array([lastX + 1]),
        y: new Float32Array([nextY]),
        append: true,
        maxPoints: 100
      })

      if (transformActive.value) {
        applyTransform()
      }
    }
    
    // Update Sankey flow (Dramatic changes)
    const inputVal = 80 + Math.random() * 40 // Fluctuating input
    const wasteRatio = 0.05 + Math.random() * 0.2 // 5% to 25% waste
    const wasteValue = inputVal * wasteRatio
    
    sankeyChart?.updateSeries('resource-flow', {
      links: [
        { source: 'input', target: 'process', value: inputVal },
        { source: 'process', target: 'output', value: inputVal - wasteValue },
        { source: 'process', target: 'waste', value: wasteValue }
      ]
    })
    
    signalChart?.autoScale()
  }, 800)
}

async function applyTransform() {
  if (!signalChart || !signalChart.processing) return
  
  const pipeline = []
  if (smoothedActive.value) {
    pipeline.push({ type: 'moving-average', window: 8 })
  }
  pipeline.push({ type: 'normalize', range: [20, 80] })
  
  // Custom derivative view if needed (can add another series)
  
  await signalChart.processing.transform('sensor-raw', pipeline)
  signalChart.render()
}

function toggleTransform() {
  transformActive.value = !transformActive.value
  if (!transformActive.value) {
    signalChart?.processing.resetTransform('sensor-raw')
    signalChart?.render()
  } else {
    applyTransform()
  }
}

function toggleSmooth() {
  smoothedActive.value = !smoothedActive.value
  if (transformActive.value) applyTransform()
}

watch(isDark, (val) => {
  const theme = val ? 'midnight' : 'light'
  signalChart?.setTheme(theme)
  gaugeChart?.setTheme(theme)
  sankeyChart?.setTheme(theme)
})

onUnmounted(() => {
  clearInterval(timer)
  clearInterval(gaugeTimer)
  signalChart?.destroy()
  gaugeChart?.destroy()
  sankeyChart?.destroy()
})
</script>

<template>
  <div class="process-dashboard" :class="{ dark: isDark }">
    <div class="dashboard-header">
      <div class="title-group">
        <h3>Process Monitoring Dashboard</h3>
        <p>Real-time analytics using DataTransform, Gauge, and Sankey</p>
      </div>
      <div class="header-controls">
        <button @click="toggleTransform" :class="{ active: transformActive }">
          {{ transformActive ? '✓ Transform Active' : '⚡ Apply Transform' }}
        </button>
        <button @click="toggleSmooth" :class="{ active: smoothedActive }">
          {{ smoothedActive ? '✓ Smoothing ON' : '♒ Smoothing OFF' }}
        </button>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- Main Signal View -->
      <div class="grid-item full-width">
        <div class="item-header">Signal Analysis (DataTransform Pipeline)</div>
        <div ref="signalContainer" class="chart-container"></div>
        <div class="item-footer">Applying: <code>Normalization [20, 80]</code> <span v-if="smoothedActive">+ <code>MovingAverage(8)</code></span></div>
      </div>

      <!-- KPI Side -->
      <div class="grid-item">
        <div class="item-header">Efficiency KPI (Gauge Chart)</div>
        <div ref="gaugeContainer" class="chart-container small"></div>
      </div>

      <!-- Flow Side -->
      <div class="grid-item">
        <div class="item-header">Mass Balance (Sankey Diagram)</div>
        <div ref="sankeyContainer" class="chart-container small"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.process-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: rgba(30, 41, 59, 0.5);
  padding: 1.5rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.title-group h3 {
  margin: 0;
  font-size: 1.5rem;
  background: linear-gradient(135deg, #00f2ff, #0096ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.title-group p {
  margin: 0.2rem 0 0 0;
  font-size: 0.85rem;
  color: #94a3b8;
}

.header-controls {
  display: flex;
  gap: 0.75rem;
}

button {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
  padding: 0.6rem 1.25rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

button:hover {
  background: rgba(51, 65, 85, 0.9);
  transform: translateY(-2px);
}

button.active {
  background: linear-gradient(135deg, #00f2ff, #0096ff);
  color: #0f172a;
  border-color: transparent;
  box-shadow: 0 4px 15px rgba(0, 242, 255, 0.3);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.grid-item {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.grid-item.full-width {
  grid-column: span 2;
}

.item-header {
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.05em;
}

.item-footer {
  padding: 0.5rem 1.25rem;
  font-size: 0.7rem;
  color: #475569;
}

code {
  color: #00f2ff;
  background: rgba(0, 242, 255, 0.05);
  padding: 2px 4px;
  border-radius: 4px;
}

.chart-container {
  height: 300px;
}

.chart-container.small {
  height: 250px;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .grid-item.full-width {
    grid-column: span 1;
  }
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>
