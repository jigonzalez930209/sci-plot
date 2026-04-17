<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  height?: string
}>()

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const isInitialized = ref(false)
const selectedMethod = ref('polynomial')
const isRealtime = ref(true)
const rSquared = ref(0)
const bestModel = ref('')

let chart: any = null
let SciPlot: any = null

const chartTheme = computed(() => isDark.value ? 'midnight' : 'light')

onMounted(async () => {
  if (typeof window === 'undefined') return
  
  // Wait for container
  let attempts = 0;
  while (!chartContainer.value && attempts < 20) {
    await new Promise(r => setTimeout(r, 50));
    attempts++;
  }

  try {
    const { createChart, PluginTools, PluginAnnotations, PluginRegression } = await import('@src/index')
    
    chart = createChart({
      container: chartContainer.value!,
      theme: chartTheme.value,
      showControls: true
    })

    await chart.use(PluginTools({ useEnhancedTooltips: true }))
    await chart.use(PluginAnnotations())
    await chart.use(PluginRegression({
        defaultMethod: 'polynomial',
        modelSelectionCriteria: 'aic'
    }))

    isInitialized.value = true
    generateData()
    runRegression()
  } catch (err) {
    console.error('RegressionDemo: Error during initialization', err)
  }
})

function generateData() {
    if (!chart) return
    
    const n = 40
    const x = new Float32Array(n)
    const y = new Float32Array(n)
    
    for (let i = 0; i < n; i++) {
        x[i] = i
        // Generate something that looks like a polynomial + gaussian
        const base = 50 + 20 * Math.sin(i / 10) + 0.1 * i * i
        const peak = 100 * Math.exp(-Math.pow(i - 25, 2) / 20)
        y[i] = base + peak + (Math.random() - 0.5) * 15
    }
    
    if (chart.getSeries('raw-data')) {
        chart.updateSeries('raw-data', { x, y })
    } else {
        chart.addSeries({
            id: 'raw-data',
            name: 'Experimental Data',
            type: 'scatter',
            data: { x, y },
            style: { color: '#00f2ff', pointSize: 8, symbol: 'circle' }
        })
    }
}

async function runRegression() {
    if (!chart || !isInitialized.value) return
    
    const series = chart.getSeries('raw-data')
    if (!series) return
    const data = series.getData()
    
    try {
        if (selectedMethod.value === 'auto') {
            const result = await chart.regression.autoFit('raw-data', data, ['linear', 'polynomial', 'exponential', 'gaussian'])
            bestModel.value = result.method
            rSquared.value = result.statistics.rSquared
            chart.regression.visualizeFit('raw-data')
        } else {
            const result = await chart.regression.fit('raw-data', data, selectedMethod.value, { degree: 3 })
            rSquared.value = result.statistics.rSquared
            bestModel.value = ''
            chart.regression.visualizeFit('raw-data')
        }
        chart.render()
    } catch (e) {
        console.error('Regression failed', e)
    }
}

function toggleRealtime() {
    isRealtime.value = !isRealtime.value
    if (isRealtime.value) {
        chart?.regression.enableRealtimeFitting('raw-data', selectedMethod.value === 'auto' ? 'polynomial' : selectedMethod.value)
    } else {
        chart?.regression.disableRealtimeFitting('raw-data')
    }
}

watch([selectedMethod, isDark], () => {
    if (chart) {
        chart.setTheme(chartTheme.value)
        runRegression()
    }
})

onUnmounted(() => {
  if (chart) chart.destroy()
})
</script>

<template>
  <div class="regression-demo" :class="{ dark: isDark }">
    <div class="demo-controls">
      <div class="control-group">
        <label>Model</label>
        <select v-model="selectedMethod" :disabled="!isInitialized">
          <option value="linear">Linear (y = ax + b)</option>
          <option value="polynomial">Cubic (y = ax³ + bx² + cx + d)</option>
          <option value="exponential">Exponential (y = a·eᵇˣ + c)</option>
          <option value="gaussian">Gaussian (Bell Curve)</option>
          <option value="auto">🔥 Auto-Select Best (AIC)</option>
        </select>
      </div>
      
      <div class="control-group">
        <button @click="generateData(); runRegression()" class="btn-refresh" :disabled="!isInitialized">
          🎲 New Data
        </button>
      </div>

      <div class="stats-box" v-if="isInitialized">
        <div class="stat-item">
          <span class="label">R² Score</span>
          <span class="value" :style="{ color: rSquared > 0.9 ? '#00ffaa' : '#ffb700' }">
            {{ rSquared.toFixed(4) }}
          </span>
        </div>
        <div class="stat-item" v-if="bestModel">
          <span class="label">Winning Model</span>
          <span class="value winning">{{ bestModel.toUpperCase() }}</span>
        </div>
      </div>
    </div>

    <div ref="chartContainer" class="main-chart" :style="{ height: height || '450px' }"></div>
    
    <div class="bottom-info">
        <p>Advanced regression uses <strong>Gaussian Elimination</strong> for linear/poly and <strong>Gradient Descent</strong> for non-linear models.</p>
    </div>
  </div>
</template>

<style scoped>
.regression-demo {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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

.btn-refresh {
  background: #334155;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: #475569;
}

.stats-box {
  display: flex;
  gap: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 8px 16px;
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
}

.stat-item .value {
  font-family: monospace;
  font-size: 1.1rem;
  font-weight: 800;
}

.value.winning {
    color: #00f2ff;
    text-shadow: 0 0 10px rgba(0, 242, 255, 0.5);
}

.main-chart {
  background: #020617;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.bottom-info {
    font-size: 0.8rem;
    color: #64748b;
    text-align: center;
}
</style>
