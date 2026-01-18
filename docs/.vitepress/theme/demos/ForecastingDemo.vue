<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  height?: string
}>()

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const isInitialized = ref(false)
const selectedMethod = ref('holtWinters')
const horizon = ref(48)
const alpha = ref(0.3)
const beta = ref(0.1)
const gamma = ref(0.1)

let chart: any = null

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
    const { createChart, PluginTools, PluginForecasting } = await import('@src/index')
    
    chart = createChart({
      container: chartContainer.value!,
      theme: chartTheme.value,
      showControls: true
    })

    await chart.use(PluginTools({ useEnhancedTooltips: true }))
    await chart.use(PluginForecasting({
        defaultVisualization: {
            lineStyle: { color: '#fbbf24', width: 3, dash: [5, 5] },
            intervalStyle: { fillColor: '#fbbf24', opacity: 0.15 }
        }
    }))

    isInitialized.value = true
    generateData()
    runForecast()
  } catch (err) {
    console.error('ForecastingDemo: Error during initialization', err)
  }
})

function generateData() {
    if (!chart) return
    
    const n = 120 // 10 years of monthly data
    const x = new Float32Array(n)
    const y = new Float32Array(n)
    
    // Base trend + seasonality (yearly cycle of 12) + noise
    for (let i = 0; i < n; i++) {
        x[i] = i
        const trend = 10 + 0.5 * i
        const seasonality = 15 * Math.sin((2 * Math.PI * i) / 12)
        const noise = (Math.random() - 0.5) * 8
        y[i] = trend + seasonality + noise
    }
    
    if (chart.getSeries('raw-data')) {
        chart.updateSeries('raw-data', { x, y })
    } else {
        chart.addSeries({
            id: 'raw-data',
            name: 'Historical Data',
            type: 'line',
            data: { x, y },
            style: { color: '#3b82f6', width: 2 }
        })
    }
}

async function runForecast() {
    if (!chart || !isInitialized.value) return
    
    try {
        chart.forecasting.clear()
        
        const options = {
            method: selectedMethod.value,
            horizon: horizon.value,
            params: {
                alpha: alpha.value,
                beta: beta.value,
                gamma: gamma.value,
                period: 12
            }
        }
        
        const result = await chart.forecasting.forecastSeries('raw-data', options)
        
        // Add artificial confidence intervals for some methods for visual impact
        if (selectedMethod.value === 'holtWinters') {
            result.lowerBound = result.yValues.map((v: number, i: number) => v - 5 - i * 0.2)
            result.upperBound = result.yValues.map((v: number, i: number) => v + 5 + i * 0.2)
        } else if (selectedMethod.value === 'linear') {
            result.lowerBound = result.yValues.map((v: number, i: number) => v - 10 - i * 0.5)
            result.upperBound = result.yValues.map((v: number, i: number) => v + 10 + i * 0.5)
        }

        chart.forecasting.visualize(result)
        chart.render()
    } catch (e) {
        console.error('Forecasting failed', e)
    }
}

watch([selectedMethod, horizon, alpha, beta, gamma, isDark], () => {
    if (chart) {
        chart.setTheme(chartTheme.value)
        runForecast()
    }
})

onUnmounted(() => {
  if (chart) chart.destroy()
})
</script>

<template>
  <div class="forecasting-demo" :class="{ dark: isDark }">
    <div class="demo-controls">
      <div class="control-group">
        <label>Method</label>
        <select v-model="selectedMethod" :disabled="!isInitialized">
          <option value="sma">Moving Average (Flat)</option>
          <option value="linear">Linear Projection (Trend)</option>
          <option value="holt">Double Exp Smoothing (Trend)</option>
          <option value="holtWinters">Triple Exp Smoothing (Seasonal)</option>
        </select>
      </div>
      
      <div class="control-group">
        <label>Horizon: {{ horizon }} pts</label>
        <input type="range" v-model.number="horizon" min="5" max="120" step="1" />
      </div>

      <div class="control-group" v-if="selectedMethod.includes('holt')">
        <label>Smoothing (α): {{ alpha }}</label>
        <input type="range" v-model.number="alpha" min="0.01" max="1" step="0.01" />
      </div>

      <div class="control-group">
        <button @click="generateData(); runForecast()" class="btn-refresh" :disabled="!isInitialized">
          🎲 New Data
        </button>
      </div>
    </div>

    <div ref="chartContainer" class="main-chart" :style="{ height: height || '450px' }"></div>
    
    <div class="bottom-info">
      <p>Forecasting uses <strong>Holt-Winters (Triple Exponential Smoothing)</strong> for seasonal data and <strong>Recurrent Projections</strong> for trends.</p>
    </div>
  </div>
</template>

<style scoped>
.forecasting-demo {
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
  gap: 1.25rem;
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

input[type="range"] {
  width: 120px;
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
