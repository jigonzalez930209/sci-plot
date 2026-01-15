<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  height?: string
}>()

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const isInitialized = ref(false)
const activeTab = ref<'boxplot' | 'errorbar' | 'ml'>('boxplot')
const datasetType = ref<'enzyme' | 'clinical' | 'sensor'>('enzyme')

// Stats
const meanValue = ref(0)
const stdDev = ref(0)
const correlation = ref(0)
const mlPredictionActive = ref(false)

let chart: any = null

const chartTheme = computed(() => isDark.value ? 'midnight' : 'light')

// Sample scientific datasets
const datasets = {
  enzyme: {
    name: 'Enzyme Kinetics (Michaelis-Menten)',
    xLabel: 'Substrate Concentration (mM)',
    yLabel: 'Reaction Velocity (μmol/min)',
    generate: () => {
      const n = 25
      const x = new Float32Array(n)
      const y = new Float32Array(n)
      const yError = new Float32Array(n)
      
      const Vmax = 120
      const Km = 5
      
      for (let i = 0; i < n; i++) {
        x[i] = 0.5 + i * 0.8
        // Michaelis-Menten equation with noise
        const theoretical = (Vmax * x[i]) / (Km + x[i])
        y[i] = theoretical + (Math.random() - 0.5) * 10
        yError[i] = 3 + Math.random() * 5
      }
      
      return { x, y, yError }
    }
  },
  clinical: {
    name: 'Clinical Trial Response',
    xLabel: 'Dosage (mg/kg)',
    yLabel: 'Response (%)',
    generate: () => {
      const n = 20
      const x = new Float32Array(n)
      const y = new Float32Array(n)
      const yError = new Float32Array(n)
      
      for (let i = 0; i < n; i++) {
        x[i] = 0.1 + i * 0.5
        // Sigmoidal dose-response
        const EC50 = 5
        const Hill = 2
        const theoretical = 100 / (1 + Math.pow(EC50 / x[i], Hill))
        y[i] = theoretical + (Math.random() - 0.5) * 8
        yError[i] = 5 + Math.random() * 7
      }
      
      return { x, y, yError }
    }
  },
  sensor: {
    name: 'Electrochemical Sensor',
    xLabel: 'Analyte Concentration (μM)',
    yLabel: 'Current (nA)',
    generate: () => {
      const n = 30
      const x = new Float32Array(n)
      const y = new Float32Array(n)
      const yError = new Float32Array(n)
      
      for (let i = 0; i < n; i++) {
        x[i] = 0.1 + i * 3
        // Linear calibration with saturation
        const sensitivity = 2.5
        const saturation = 200
        const theoretical = saturation * (1 - Math.exp(-sensitivity * x[i] / saturation))
        y[i] = theoretical + (Math.random() - 0.5) * 8
        yError[i] = 2 + Math.random() * 4
      }
      
      return { x, y, yError }
    }
  }
}

// BoxPlot data generation
function generateBoxPlotData() {
  const groups = ['Control', 'Low Dose', 'Medium Dose', 'High Dose', 'Ultra Dose']
  const n = groups.length
  
  const x = new Float32Array(n)
  const low = new Float32Array(n)    // min
  const open = new Float32Array(n)   // Q1
  const median = new Float32Array(n)
  const close = new Float32Array(n)  // Q3
  const high = new Float32Array(n)   // max
  
  for (let i = 0; i < n; i++) {
    x[i] = i + 1
    const baseValue = 50 + i * 15 + (Math.random() - 0.5) * 10
    const spread = 10 + i * 3
    
    low[i] = baseValue - spread * 1.5
    open[i] = baseValue - spread * 0.5
    median[i] = baseValue
    close[i] = baseValue + spread * 0.5
    high[i] = baseValue + spread * 1.5
  }
  
  return { x, low, open, median, close, high, groups }
}

onMounted(async () => {
  if (typeof window === 'undefined') return
  
  let attempts = 0;
  while (!chartContainer.value && attempts < 20) {
    await new Promise(r => setTimeout(r, 50));
    attempts++;
  }

  try {
    const { createChart, PluginTools, PluginAnnotations, PluginMLIntegration } = await import('@src/index')
    
    chart = createChart({
      container: chartContainer.value!,
      theme: chartTheme.value,
      showControls: true
    })

    await chart.use(PluginTools({ useEnhancedTooltips: true }))
    await chart.use(PluginAnnotations())
    await chart.use(PluginMLIntegration())

    isInitialized.value = true
    loadDataset()
  } catch (err) {
    console.error('ScientificDemo: Error during initialization', err)
  }
})

function loadDataset() {
  if (!chart || !isInitialized.value) return
  
  // Clear existing series
  chart.clearAllSeries?.() || chart.series?.forEach((s: any) => chart.removeSeries(s.getId()))
  
  if (activeTab.value === 'boxplot') {
    loadBoxPlotData()
  } else if (activeTab.value === 'errorbar') {
    loadErrorBarData()
  } else {
    loadMLData()
  }
  
  chart.autoScale()
  chart.render()
}

function loadBoxPlotData() {
  const data = generateBoxPlotData()
  
  chart.addSeries({
    id: 'boxplot-data',
    name: 'Treatment Response',
    type: 'boxplot',
    data: {
      x: data.x,
      low: data.low,
      open: data.open,
      median: data.median,
      close: data.close,
      high: data.high
    },
    style: { 
      color: '#00f2ff',
      barWidth: 0.6,
      width: 2
    }
  })
  
  // Calculate stats
  const medianVals = Array.from(data.median)
  meanValue.value = medianVals.reduce((a, b) => a + b, 0) / medianVals.length
  stdDev.value = Math.sqrt(medianVals.reduce((s, v) => s + Math.pow(v - meanValue.value, 2), 0) / medianVals.length)
}

function loadErrorBarData() {
  const ds = datasets[datasetType.value]
  const data = ds.generate()
  
  chart.addSeries({
    id: 'scatter-data',
    name: ds.name,
    type: 'scatter',
    data: {
      x: data.x,
      y: data.y,
      yError: data.yError
    },
    style: {
      color: '#ff6b6b',
      pointSize: 8,
      symbol: 'circle',
      errorBars: {
        visible: true,
        color: '#ff6b6b',
        width: 1.5,
        capWidth: 6,
        opacity: 0.7
      }
    }
  })
  
  // Add trend line
  const xArr = Array.from(data.x)
  const yArr = Array.from(data.y)
  
  // Simple linear regression for trend
  const n = xArr.length
  const sumX = xArr.reduce((a, b) => a + b, 0)
  const sumY = yArr.reduce((a, b) => a + b, 0)
  const sumXY = xArr.reduce((s, x, i) => s + x * yArr[i], 0)
  const sumX2 = xArr.reduce((s, x) => s + x * x, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  const trendY = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    trendY[i] = slope * xArr[i] + intercept
  }
  
  chart.addSeries({
    id: 'trend-line',
    name: 'Linear Fit',
    type: 'line',
    data: { x: data.x, y: trendY },
    style: { color: '#00f2ff', width: 2, dash: [5, 5], opacity: 0.8 }
  })
  
  // Calculate R²
  const yMean = sumY / n
  const SSres = yArr.reduce((s, y, i) => s + Math.pow(y - trendY[i], 2), 0)
  const SStot = yArr.reduce((s, y) => s + Math.pow(y - yMean, 2), 0)
  correlation.value = 1 - (SSres / SStot)
  
  meanValue.value = yMean
  stdDev.value = Math.sqrt(yArr.reduce((s, y) => s + Math.pow(y - yMean, 2), 0) / n)
}

function loadMLData() {
  const ds = datasets.sensor
  const data = ds.generate()
  
  chart.addSeries({
    id: 'raw-signal',
    name: 'Raw Signal',
    type: 'line+scatter',
    data: { x: data.x, y: data.y },
    style: { 
      color: '#94a3b8', 
      width: 1,
      pointSize: 5,
      symbol: 'circle'
    }
  })
  
  meanValue.value = Array.from(data.y).reduce((a, b) => a + b, 0) / data.y.length
  stdDev.value = Math.sqrt(Array.from(data.y).reduce((s, y) => s + Math.pow(y - meanValue.value, 2), 0) / data.y.length)
}

async function runMLPrediction() {
  if (!chart || !chart.ml) {
    console.error('[ScientificDemo] ML plugin not available')
    return
  }
  
  try {
    mlPredictionActive.value = true
    
    const rawSeries = chart.getSeries('raw-signal')
    if (!rawSeries) {
      console.error('[ScientificDemo] raw-signal series not found')
      return
    }
    
    const data = rawSeries.getData()
    const xArr = Array.from(data.x) as number[]
    const yArr = Array.from(data.y) as number[]
    const n = yArr.length
    
    // 1. Calculate mean and std dev using ML stats
    const yMean = chart.ml.stats.mean(yArr)
    const yStd = chart.ml.stats.standardDeviation(yArr)
    
    // 2. Perform polynomial regression (degree 3 for curve fitting)
    // Build Vandermonde matrix for polynomial fit
    const degree = 3
    const X: number[][] = []
    for (let i = 0; i < n; i++) {
      const row: number[] = []
      for (let d = 0; d <= degree; d++) {
        row.push(Math.pow(xArr[i], d))
      }
      X.push(row)
    }
    
    // Solve using normal equation: β = (X^T X)^(-1) X^T y
    // Simplified: compute polynomial coefficients
    const coeffs = fitPolynomial(xArr, yArr, degree)
    
    // 3. Generate smooth prediction curve
    const predicted = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      let val = 0
      for (let d = 0; d <= degree; d++) {
        val += coeffs[d] * Math.pow(xArr[i], d)
      }
      predicted[i] = val
    }
    
    // 4. Add Savitzky-Golay smoothing for noise reduction
    const smoothed = savitzkyGolayFilter(yArr, 5, 2)
    
    // Update or add prediction series
    if (chart.getSeries('filtered-signal')) {
      chart.updateSeries('filtered-signal', { x: data.x, y: new Float32Array(smoothed) })
    } else {
      chart.addSeries({
        id: 'filtered-signal',
        name: 'SG Smoothed',
        type: 'line',
        data: { x: data.x, y: new Float32Array(smoothed) },
        style: { color: '#00f2ff', width: 2.5 }
      })
    }
    
    // Add polynomial trend if not exists
    if (!chart.getSeries('poly-trend')) {
      chart.addSeries({
        id: 'poly-trend',
        name: 'Poly Fit (deg 3)',
        type: 'line',
        data: { x: data.x, y: predicted },
        style: { color: '#ff6b6b', width: 2, dash: [5, 5] }
      })
    } else {
      chart.updateSeries('poly-trend', { x: data.x, y: predicted })
    }
    
    // Calculate R² for polynomial fit
    const SSres = yArr.reduce((s, y, i) => s + Math.pow(y - predicted[i], 2), 0)
    const SStot = yArr.reduce((s, y) => s + Math.pow(y - yMean, 2), 0)
    correlation.value = 1 - (SSres / SStot)
    
    meanValue.value = yMean
    stdDev.value = yStd
    
    chart.render()
  } catch (err) {
    console.error('ML Prediction failed', err)
  }
}

// Polynomial fitting using least squares
function fitPolynomial(x: number[], y: number[], degree: number): number[] {
  const n = x.length
  const m = degree + 1
  
  // Build X^T X matrix
  const XtX: number[][] = Array(m).fill(null).map(() => Array(m).fill(0))
  const XtY: number[] = Array(m).fill(0)
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      for (let k = 0; k < m; k++) {
        XtX[j][k] += Math.pow(x[i], j + k)
      }
      XtY[j] += Math.pow(x[i], j) * y[i]
    }
  }
  
  // Solve using Gaussian elimination
  return gaussianElimination(XtX, XtY)
}

function gaussianElimination(A: number[][], b: number[]): number[] {
  const n = A.length
  const aug = A.map((row, i) => [...row, b[i]])
  
  for (let i = 0; i < n; i++) {
    // Partial pivoting
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k
    }
    [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]]
    
    if (Math.abs(aug[i][i]) < 1e-10) continue
    
    for (let k = i + 1; k < n; k++) {
      const c = aug[k][i] / aug[i][i]
      for (let j = i; j <= n; j++) {
        aug[k][j] -= c * aug[i][j]
      }
    }
  }
  
  // Back substitution
  const x = Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    x[i] = aug[i][n]
    for (let j = i + 1; j < n; j++) {
      x[i] -= aug[i][j] * x[j]
    }
    x[i] /= aug[i][i] || 1
  }
  
  return x
}

// Savitzky-Golay smoothing filter
function savitzkyGolayFilter(data: number[], windowSize: number, polyOrder: number): number[] {
  const halfWindow = Math.floor(windowSize / 2)
  const result = [...data]
  
  // Pre-computed coefficients for window=5, order=2
  const coeffs = [-3/35, 12/35, 17/35, 12/35, -3/35]
  
  for (let i = halfWindow; i < data.length - halfWindow; i++) {
    let sum = 0
    for (let j = -halfWindow; j <= halfWindow; j++) {
      sum += data[i + j] * coeffs[j + halfWindow]
    }
    result[i] = sum
  }
  
  return result
}

function clearMLPrediction() {
  if (chart?.getSeries('filtered-signal')) {
    chart.removeSeries('filtered-signal')
  }
  if (chart?.getSeries('poly-trend')) {
    chart.removeSeries('poly-trend')
  }
  chart?.render()
  mlPredictionActive.value = false
  correlation.value = 0
}

watch([activeTab, datasetType, isDark], () => {
  if (chart) {
    chart.setTheme(chartTheme.value)
    loadDataset()
  }
})

onUnmounted(() => {
  if (chart) chart.destroy()
})
</script>

<template>
  <div class="scientific-demo" :class="{ dark: isDark }">
    <!-- Tab Navigation -->
    <div class="tab-nav">
      <button 
        v-for="tab in [
          { id: 'boxplot', label: '📦 Box Plot', desc: 'Statistical Distribution' },
          { id: 'errorbar', label: '📊 Error Bars', desc: 'Measurement Uncertainty' },
          { id: 'ml', label: '🧠 ML Analysis', desc: 'Signal Processing' }
        ]" 
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id as any"
      >
        <span class="tab-label">{{ tab.label }}</span>
        <span class="tab-desc">{{ tab.desc }}</span>
      </button>
    </div>

    <!-- Controls -->
    <div class="demo-controls">
      <div v-if="activeTab === 'errorbar'" class="control-group">
        <label>Dataset</label>
        <select v-model="datasetType" :disabled="!isInitialized">
          <option value="enzyme">Enzyme Kinetics</option>
          <option value="clinical">Clinical Trial</option>
          <option value="sensor">Electrochemical Sensor</option>
        </select>
      </div>

      <div v-if="activeTab === 'ml'" class="control-group">
        <button 
          @click="mlPredictionActive ? clearMLPrediction() : runMLPrediction()"
          class="btn-action"
          :class="{ active: mlPredictionActive }"
          :disabled="!isInitialized"
        >
          {{ mlPredictionActive ? '🔄 Clear' : '🚀 Run ML Filter' }}
        </button>
      </div>

      <div class="control-group">
        <button @click="loadDataset()" class="btn-refresh" :disabled="!isInitialized">
          🎲 Regenerate
        </button>
      </div>

      <!-- Stats Panel -->
      <div class="stats-box" v-if="isInitialized">
        <div class="stat-item">
          <span class="label">Mean</span>
          <span class="value">{{ meanValue.toFixed(2) }}</span>
        </div>
        <div class="stat-item">
          <span class="label">Std Dev</span>
          <span class="value">{{ stdDev.toFixed(2) }}</span>
        </div>
        <div class="stat-item" v-if="activeTab === 'errorbar' || (activeTab === 'ml' && mlPredictionActive)">
          <span class="label">R²</span>
          <span class="value" :style="{ color: correlation > 0.95 ? '#00ffaa' : '#ffb700' }">
            {{ correlation.toFixed(4) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Chart -->
    <div ref="chartContainer" class="main-chart" :style="{ height: height || '450px' }"></div>
    
    <!-- Info Footer -->
    <div class="bottom-info">
      <p v-if="activeTab === 'boxplot'">
        <strong>Box Plot</strong> shows median, quartiles (Q1/Q3), and range. Essential for comparing distributions.
      </p>
      <p v-else-if="activeTab === 'errorbar'">
        <strong>Error Bars</strong> visualize measurement uncertainty. Supports symmetric and asymmetric errors.
      </p>
      <p v-else>
        <strong>ML Integration</strong> provides native FFT, filtering, and statistical analysis without dependencies.
      </p>
    </div>
  </div>
</template>

<style scoped>
.scientific-demo {
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(16px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.tab-nav {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.tab-btn {
  flex: 1;
  min-width: 140px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: rgba(51, 65, 85, 0.9);
  border-color: rgba(100, 116, 139, 0.5);
}

.tab-btn.active {
  background: linear-gradient(135deg, rgba(0, 242, 255, 0.15), rgba(0, 150, 255, 0.1));
  border-color: rgba(0, 242, 255, 0.5);
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.15);
}

.tab-label {
  font-size: 0.95rem;
  font-weight: 700;
  color: #f1f5f9;
}

.tab-desc {
  font-size: 0.7rem;
  color: #64748b;
}

.tab-btn.active .tab-desc {
  color: #00f2ff;
}

.demo-controls {
  display: flex;
  align-items: flex-end;
  gap: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #64748b;
}

select {
  background: #1e293b;
  color: #f1f5f9;
  border: 1px solid #334155;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  cursor: pointer;
}

.btn-refresh, .btn-action {
  background: #334155;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover, .btn-action:hover {
  background: #475569;
}

.btn-action.active {
  background: linear-gradient(135deg, #00f2ff, #0096ff);
  color: #0f172a;
}

.stats-box {
  display: flex;
  gap: 1.5rem;
  background: rgba(0, 0, 0, 0.25);
  padding: 10px 18px;
  border-radius: 10px;
  margin-left: auto;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-item .label {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 700;
  text-transform: uppercase;
}

.stat-item .value {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 1.1rem;
  font-weight: 800;
  color: #e2e8f0;
}

.main-chart {
  background: linear-gradient(180deg, #020617 0%, #0f172a 100%);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.bottom-info {
  font-size: 0.8rem;
  color: #64748b;
  text-align: center;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.bottom-info strong {
  color: #00f2ff;
}
</style>
