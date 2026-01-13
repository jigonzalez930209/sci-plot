<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, reactive } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  height?: string
}>()

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const fps = ref(0)
const pointCount = ref(0)

let chart: any = null
let originalData: { x: Float32Array; y: Float32Array } | null = null

// Transform pipeline state - each transform is applied cumulatively
const transforms = reactive({
  smoothing: false,
  baseline: false,
  peaks: false,
  derivative: false,
  downsampled: false
})

// Results
const results = reactive({
  area: null as number | null,
  peakCount: 0,
})

const chartTheme = computed(() => isDark.value ? 'midnight' : 'light')

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return
  const { createChart } = await import('@src/index')
  const { PluginAnalysis, PluginTools } = await import('@src/plugins')
  
  chart = createChart({
    container: chartContainer.value,
    theme: chartTheme.value,
    showControls: true,
    animations: { enabled: true, zoom: { duration: 200 } }
  })

  // Explicitly enable required plugins
  await chart.use(PluginAnalysis())
  await chart.use(PluginTools({ useEnhancedTooltips: true }))

  chart.on('render', (e: any) => {
    fps.value = Math.round(e.fps)
  })

  initDemo()
})

function generateNoisySignal(n: number): { x: Float32Array; y: Float32Array } {
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  
  for (let i = 0; i < n; i++) {
    const t = i / (n / 10)
    x[i] = t
    // Signal with peaks, baseline drift, and noise
    const peaks = 
      2 * Math.exp(-((t - 2) ** 2) / 0.1) +
      3 * Math.exp(-((t - 5) ** 2) / 0.15) +
      1.5 * Math.exp(-((t - 7.5) ** 2) / 0.08);
    const baseline = 0.3 * t;
    const noise = (Math.random() - 0.5) * 0.3;
    y[i] = peaks + baseline + noise;
  }
  
  return { x, y }
}

function initDemo() {
  if (!chart) return
  
  const data = generateNoisySignal(2000)
  originalData = { 
    x: new Float32Array(data.x), 
    y: new Float32Array(data.y) 
  }
  
  chart.addSeries({
    id: 'main',
    type: 'line',
    data: { x: data.x, y: data.y },
    style: { color: '#00f2ff', width: 2 },
    name: 'Signal'
  })
  
  pointCount.value = data.x.length
  resetTransforms()
}

function resetTransforms() {
  transforms.smoothing = false
  transforms.baseline = false
  transforms.peaks = false
  transforms.derivative = false
  transforms.downsampled = false
  results.area = null
  results.peakCount = 0
  if (chart) {
     try { chart.removeSeries('area-fill') } catch {}
     try { chart.removeSeries('peaks') } catch {}
     try { chart.removeSeries('derivative') } catch {}
  }
}

// Apply all active transforms in sequence
async function applyTransformPipeline() {
  if (!chart || !originalData) return
  
  let currentX = new Float32Array(originalData.x)
  let currentY = new Float32Array(originalData.y)
  
  // 1. Downsampling first (if active)
  if (transforms.downsampled) {
    const { downsampleLTTB } = await import('@src/plugins/analysis')
    const result = downsampleLTTB(currentX, currentY, 300)
    currentX = result.x
    currentY = result.y
  }
  
  // 2. Smoothing
  if (transforms.smoothing) {
    const { savitzkyGolay } = await import('@src/plugins/analysis')
    currentY = savitzkyGolay(currentY, 15, 3)
  }
  
  // 3. Baseline correction
  if (transforms.baseline) {
    const { subtractBaseline } = await import('@src/plugins/analysis')
    currentY = subtractBaseline(
      Array.from(currentX), 
      Array.from(currentY), 
      currentX[0], 
      currentX[currentX.length - 1]
    )
  }
  
  // Update main series
  chart.updateSeries('main', { 
    x: currentX, 
    y: currentY, 
    append: false 
  })
  
  pointCount.value = currentX.length
  
  // 4. Show derivative as overlay
  if (transforms.derivative) {
    try { chart.removeSeries('derivative') } catch {}
    const { derivative } = await import('@src/plugins/analysis')
    const dy = derivative(currentX, currentY, 1)
    
    // Scale to fit
    const maxDy = Math.max(...Array.from(dy).map(Math.abs)) || 1
    const maxY = Math.max(...Array.from(currentY).map(Math.abs)) || 1
    const scale = maxY / maxDy * 0.5
    const scaled = new Float32Array(dy.length)
    for (let i = 0; i < dy.length; i++) {
      scaled[i] = dy[i] * scale
    }
    
    chart.addSeries({
      id: 'derivative',
      type: 'line',
      data: { x: currentX, y: scaled },
      style: { color: '#ff9f43', width: 1.5, lineDash: [4, 2] },
      name: 'Derivative'
    })
  } else {
    try { chart.removeSeries('derivative') } catch {}
  }
  
  // 5. Detect peaks
  if (transforms.peaks) {
    try { chart.removeSeries('peaks') } catch {}
    const { detectPeaks } = await import('@src/plugins/analysis')
    const peaks = detectPeaks(currentX, currentY, { 
      minProminence: 0.2, 
      type: 'max' 
    })
    
    if (peaks.length > 0) {
      chart.addSeries({
        id: 'peaks',
        type: 'scatter',
        data: { 
          x: new Float32Array(peaks.map(p => p.x)), 
          y: new Float32Array(peaks.map(p => p.y)) 
        },
        style: { 
          color: '#ff0000', // Bright red
          pointSize: 12, 
          symbol: 'triangle' 
        },
        name: 'Peaks'
      })
      results.peakCount = peaks.length
    }
  } else {
    try { chart.removeSeries('peaks') } catch {}
    results.peakCount = 0
  }
  
  chart.autoScale()
}

async function toggleTransform(key: keyof typeof transforms) {
  transforms[key] = !transforms[key]
  await applyTransformPipeline()
}

const showArea = ref(false)

async function calculateArea() {
  if (!chart) return
  
  showArea.value = !showArea.value
  
  if (!showArea.value) {
    try { chart.removeSeries('area-fill') } catch {}
    results.area = null
    return
  }

  const { integrate } = await import('@src/plugins/analysis')
  const series = chart.getSeries('main')
  const data = series?.getData()
  if (!data) return
  
  results.area = integrate(data.x, data.y)
  
  // Create a zero-line for the band fill
  const y2 = new Float32Array(data.x.length)
  // If baseline corrected, fill to 0. If not, fill to min y or 0? 
  // Let's assume filling to 0 is good for standard "area under curve" visualization
  // unless min is far above 0.
  const minY = Math.min(...data.y)
  const fillBase = minY < 0 ? minY : 0
  y2.fill(fillBase)

  chart.addSeries({
    id: 'area-fill',
    type: 'band',
    data: { x: data.x, y: data.y, y2 },
    style: { 
      color: '#00f2ff', 
      opacity: 0.3,
      stroke: 'transparent'
    },
    order: 0 // Draw behind line
  })
}

function getPlotArea() {
  // Approximate plot area
  const container = chartContainer.value
  if (!container) return { x: 75, y: 20, width: 400, height: 350 }
  const rect = container.getBoundingClientRect()
  return {
    x: 75,
    y: 20,
    width: rect.width - 105,
    height: rect.height - 75
  }
}

function formatValue(v: number): string {
  if (Math.abs(v) >= 1000 || (Math.abs(v) < 0.01 && v !== 0)) {
    return v.toExponential(3)
  }
  return v.toFixed(4)
}

function resetDemo() {
  if (!chart) return
  chart.getAllSeries().forEach((s: any) => chart.removeSeries(s.getId()))
  initDemo()
  chart.autoScale()
}

onUnmounted(() => {
  if (chart) chart.destroy()
})

watch(isDark, () => {
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
  <div class="chart-demo math-demo" :class="{ dark: isDark }">
    <!-- Header -->
    <div class="demo-header">
      <div class="demo-stats">
        <span class="stat">📊 <b>{{ pointCount.toLocaleString() }}</b> pts</span>
        <span class="stat" :class="{ good: fps >= 55 }">🚀 <b>{{ fps }}</b> FPS</span>
      </div>
    </div>

    <!-- Compact Toolbar -->
    <div class="math-toolbar">
      <div class="toolbar-group">
        <span class="group-label">Transforms</span>
        <button 
          @click="toggleTransform('smoothing')" 
          class="mini-btn" 
          :class="{ active: transforms.smoothing }"
          title="Savitzky-Golay Smoothing"
        >📈 Smooth</button>
        
        <button 
          @click="toggleTransform('baseline')" 
          class="mini-btn"
          :class="{ active: transforms.baseline }"
          title="Baseline Correction"
        >📉 Baseline</button>
        
        <button 
          @click="toggleTransform('downsampled')" 
          class="mini-btn"
          :class="{ active: transforms.downsampled }"
          title="LTTB Downsampling"
        >🔍 LTTB</button>
      </div>
      
      <div class="toolbar-group">
        <span class="group-label">Analysis</span>
        <button 
          @click="toggleTransform('peaks')" 
          class="mini-btn"
          :class="{ active: transforms.peaks }"
          title="Peak Detection"
        >
          🎯 Peaks
          <span v-if="results.peakCount" class="badge">{{ results.peakCount }}</span>
        </button>
        
        <button 
          @click="toggleTransform('derivative')" 
          class="mini-btn"
          :class="{ active: transforms.derivative }"
          title="Show Derivative"
        >📐 d/dx</button>
        
        <button 
          @click="calculateArea" 
          class="mini-btn" 
          :class="{ active: showArea }"
          title="Calculate & Visualise Area"
        >
          ∫ Area
        </button>
      </div>
      
      <button @click="resetTransforms" class="mini-btn reset-btn" title="Reset All">
          ↻ Reset
        </button>
    </div>

    <!-- Results Panel -->
    <div class="results-bar" v-if="results.area !== null">
      <span class="result">∫ Area = <b>{{ results.area.toFixed(4) }}</b></span>
    </div>

    <!-- Chart Container -->
    <div 
      ref="chartContainer" 
      class="chart-container" 
      :style="{ height: height || '450px' }"
    >
    </div>
    
    <p class="chart-hint">
      Las transformaciones son <b>acumulativas</b>: activa varias para combinarlas.
    </p>
  </div>
</template>

<style scoped>
.math-demo {
  background: var(--vp-c-bg);
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  overflow: hidden;
}

.demo-header {
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.demo-stats {
  display: flex;
  gap: 12px;
  font-size: 0.8rem;
}

.demo-stats .stat {
  color: var(--vp-c-text-2);
}

.demo-stats .stat.good b {
  color: #10b981;
}

/* Compact Toolbar */
.math-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 10px 12px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.group-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vp-c-text-3);
  margin-right: 4px;
  font-weight: 600;
}

.mini-btn {
  position: relative;
  padding: 4px 8px;
  font-size: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.mini-btn:hover {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand);
  color: var(--vp-c-text-1);
}

.mini-btn.active {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}

.mini-btn .badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff6b6b;
  color: white;
  font-size: 0.6rem;
  padding: 1px 4px;
  border-radius: 6px;
  font-weight: bold;
}

.delta-btn.active {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
}

.reset-btn {
  background: transparent;
  color: var(--vp-c-text-3);
}

.reset-btn:hover {
  background: rgba(255, 107, 107, 0.15);
  color: #ff6b6b;
  border-color: #ff6b6b;
}

/* Results Bar */
.results-bar {
  display: flex;
  gap: 16px;
  padding: 6px 12px;
  background: linear-gradient(90deg, rgba(0, 242, 255, 0.1), transparent);
  border-bottom: 1px solid var(--vp-c-brand);
  font-size: 0.85rem;
}

.results-bar .result b {
  color: var(--vp-c-brand);
  font-family: 'JetBrains Mono', monospace;
}

/* Chart Container */
.chart-container {
  position: relative;
  background: var(--vp-c-bg);
}

.chart-container.delta-mode {
  cursor: crosshair !important;
}

/* Delta Overlay */
.delta-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
}

.crosshair-line {
  stroke: #ff6b6b;
  stroke-width: 1;
  stroke-dasharray: 4, 3;
  opacity: 0.8;
}

.crosshair-point {
  fill: #ff6b6b;
  stroke: white;
  stroke-width: 2;
}

/* Delta Values Box */
.delta-values {
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #ff6b6b;
  border-radius: 6px;
  padding: 8px 12px;
  color: white;
  font-size: 0.8rem;
  z-index: 101;
  min-width: 140px;
}

.delta-label {
  font-size: 0.7rem;
  color: #ff6b6b;
  margin-bottom: 4px;
  font-weight: 600;
}

.delta-coord {
  font-family: 'JetBrains Mono', monospace;
  margin: 2px 0;
}

.delta-coord b {
  color: #00f2ff;
}

/* Hover Coordinates */
.hover-coords {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  color: #00f2ff;
  padding: 4px 10px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  z-index: 101;
  pointer-events: none;
}

/* Hint */
.chart-hint {
  padding: 8px 12px;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  margin: 0;
  border-top: 1px solid var(--vp-c-divider);
}

@media (max-width: 640px) {
  .math-toolbar {
    flex-direction: column;
    gap: 8px;
  }
  
  .toolbar-group {
    flex-wrap: wrap;
  }
}
</style>
