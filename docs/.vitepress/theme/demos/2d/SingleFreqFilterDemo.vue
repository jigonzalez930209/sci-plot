<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  height?: string
}>()

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const chartTheme = computed(() => isDark.value ? 'midnight' : 'light')
const isInitialized = ref(false)
const initError = ref<string | null>(null)

let chart: any = null
let SciPlot: any = null

const N = 2048
const SAMPLE_RATE = 1000
const targetFreq = ref(50)
const bandwidth = ref(2)
const isFilterEnabled = ref(true)
const displayMode = ref<'time' | 'fft'>('time')

onMounted(async () => {
  if (typeof window === 'undefined') return
  
  // Wait for container to be available
  let attempts = 0;
  while (!chartContainer.value && attempts < 20) {
    await new Promise(r => setTimeout(r, 50));
    attempts++;
  }

  if (!chartContainer.value) {
    initError.value = "Chart container not found after several attempts";
    return;
  }
  
  try {
    SciPlot = await import('@src/index')
    const { createChart, PluginTools, PluginAnalysis, PluginAnnotations } = SciPlot;
    
    chart = createChart({
      container: chartContainer.value,
      theme: chartTheme.value,
      showControls: true,
      xAxis: { label: 'Time (s)', unit: 's' },
      yAxis: { label: 'Amplitude', unit: 'V' }
    })

    await chart.use(PluginTools({ useEnhancedTooltips: true }))
    await chart.use(PluginAnalysis())
    await chart.use(PluginAnnotations())

    isInitialized.value = true
    await draw()
  } catch (err: any) {
    console.error('SingleFreqFilterDemo: Error during initialization', err)
    initError.value = `Init Error: ${err.message || 'Unknown'}`;
  }
})

function generateSignal() {
  const t = new Float32Array(N)
  const yClean = new Float32Array(N)
  const yNoisy = new Float32Array(N)

  const f1 = 8; const f2 = 24; const f3 = 48;

  for (let i = 0; i < N; i++) {
    t[i] = i / SAMPLE_RATE
    yClean[i] = Math.sin(2 * Math.PI * f1 * t[i]) + 
               0.5 * Math.sin(2 * Math.PI * f2 * t[i]) + 
               0.3 * Math.sin(2 * Math.PI * f3 * t[i]);
    
    const noise = 1.2 * Math.sin(2 * Math.PI * targetFreq.value * t[i]);
    yNoisy[i] = yClean[i] + noise
  }

  return { t, yClean, yNoisy }
}

async function draw() {
  if (!chart || chart.isDestroyed || !SciPlot) return

  try {
    const { singleFrequencyFilter, powerSpectrum } = SciPlot;
    const { t, yClean, yNoisy } = generateSignal()
    
    const yFiltered = singleFrequencyFilter(yNoisy, {
      frequency: targetFreq.value,
      sampleRate: SAMPLE_RATE,
      bandwidth: bandwidth.value
    })

    // Clear existing series
    const seriesList = chart.getAllSeries ? chart.getAllSeries() : []
    seriesList.forEach((s: any) => chart.removeSeries(s.getId()))
    if (chart.clearAnnotations) chart.clearAnnotations()

    if (displayMode.value === 'time') {
      // --- TIME DOMAIN ---
      if (chart.updateXAxis) {
          chart.updateXAxis({ label: 'Time (s)', unit: 's', min: 0, max: 0.4 })
      }
      if (chart.updateYAxis) {
          chart.updateYAxis('default', { label: 'Amplitude', unit: 'V', min: -3, max: 3 })
      }

      if (isFilterEnabled.value) {
          chart.addSeries({
              id: 'filtered',
              name: 'Filtered Result',
              type: 'line',
              data: { x: t, y: yFiltered },
              style: { color: '#00f2ff', width: 3 }
          })
          chart.addSeries({
              id: 'clean',
              name: 'Target Signal (Ref)',
              type: 'line',
              data: { x: t, y: yClean },
              style: { color: '#00ffaa', width: 1.5, opacity: 0.4, lineDash: [5, 5] }
          })
      } else {
          chart.addSeries({
              id: 'noisy',
              name: 'Raw Signal + Interference',
              type: 'line',
              data: { x: t, y: yNoisy },
              style: { color: '#ff3366', width: 3 }
          })
      }
    } else {
      // --- FFT DOMAIN ---
      if (chart.updateXAxis) {
          chart.updateXAxis({ label: 'Frequency (Hz)', unit: 'Hz', min: 0, max: 200 })
      }
      if (chart.updateYAxis) {
          chart.updateYAxis('default', { label: 'Magnitude (dB)', unit: 'dB', min: -80, max: 20 })
      }

      const fftNoisy = powerSpectrum(yNoisy, SAMPLE_RATE)
      const fftFiltered = powerSpectrum(yFiltered, SAMPLE_RATE)

      // Backdrop noisy spectrum
      chart.addSeries({
          id: 'spectrum-noisy',
          name: 'Noisy Spectrum',
          type: 'area',
          data: { x: fftNoisy.frequency, y: fftNoisy.powerDb },
          style: { color: '#ff3366', opacity: 0.2, fillColor: 'rgba(255, 51, 102, 0.15)', width: 1.5 }
      })

      if (isFilterEnabled.value) {
          chart.addSeries({
              id: 'spectrum-filtered',
              name: 'Filtered Spectrum',
              type: 'line',
              data: { x: fftFiltered.frequency, y: fftFiltered.powerDb },
              style: { color: '#00f2ff', width: 3 }
          })
          chart.addAnnotation({
              type: 'vertical-line', x: targetFreq.value, color: 'rgba(0, 242, 255, 0.6)', 
              width: 2, lineDash: [3, 3], label: `Notch filter at ${targetFreq.value}Hz`
          })
      } else {
          chart.addAnnotation({
              type: 'vertical-line', x: targetFreq.value, color: 'rgba(255, 51, 102, 0.6)', 
              width: 2, lineDash: [3, 3], label: `Target interference: ${targetFreq.value}Hz`
          })
      }
    }

    chart.autoScale()
    chart.render()
  } catch (err) {
    console.error('SingleFreqFilterDemo: Error during draw', err)
  }
}

watch([targetFreq, bandwidth, isFilterEnabled, displayMode, isDark], () => {
  if (isInitialized.value && chart) {
    chart.setTheme(chartTheme.value)
    draw()
  }
})

onUnmounted(() => {
  if (chart) chart.destroy()
})
</script>

<template>
  <div class="single-chart-demo" :class="{ dark: isDark }">
    <div v-if="initError" class="error-overlay">
      <p>❌ Error: {{ initError }}</p>
      <button @click="location.reload()">Reload Page</button>
    </div>
    
    <div v-if="!isInitialized && !initError" class="loading-overlay">
      <div class="spinner"></div>
      <p>Initialising Charting Engine...</p>
    </div>

    <div class="demo-header" :style="{ opacity: isInitialized ? 1 : 0.3 }">
      <div class="mode-toggles">
        <button class="mode-btn" :class="{ active: displayMode === 'time' }" :disabled="!isInitialized" @click="displayMode = 'time'">
          📈 Oscilloscope
        </button>
        <button class="mode-btn" :class="{ active: displayMode === 'fft' }" :disabled="!isInitialized" @click="displayMode = 'fft'">
          📊 Spectrum
        </button>
      </div>

      <div class="filter-controls">
        <button class="filter-btn" :class="{ active: isFilterEnabled }" :disabled="!isInitialized" @click="isFilterEnabled = !isFilterEnabled">
          {{ isFilterEnabled ? '🛡️ Filter ACTIVE' : '⚠️ No Filter' }}
        </button>
      </div>
    </div>

    <div class="params-bar" :style="{ opacity: isInitialized ? 1 : 0.3 }">
      <div class="param-item">
        <label>Interference</label>
        <input type="range" v-model.number="targetFreq" min="10" max="200" step="1" :disabled="!isInitialized" />
        <span class="val">{{ targetFreq }} Hz</span>
      </div>
      <div class="param-item">
        <label>Bandwidth</label>
        <input type="range" v-model.number="bandwidth" min="0.1" max="15" step="0.1" :disabled="!isInitialized" />
        <span class="val">{{ bandwidth }} Hz</span>
      </div>
    </div>

    <div ref="chartContainer" class="main-chart" :style="{ height: height || '500px' }"></div>
    
    <div class="status-msg" v-if="isInitialized">
      <p v-if="displayMode === 'time'">
        Showing sum of <strong>8Hz + 24Hz + 48Hz</strong> signals + <strong>{{ targetFreq }}Hz</strong> interference.
      </p>
      <p v-else>
        Analyzing the frequency spectrum. The <strong>Notch Filter</strong> adapts to the slider frequency.
      </p>
    </div>
  </div>
</template>

<style scoped>
.single-chart-demo {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  position: relative;
  min-height: 400px;
}

.loading-overlay, .error-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.9);
  z-index: 10;
  border-radius: 16px;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 242, 255, 0.1);
  border-top: 4px solid #00f2ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
}

.mode-toggles {
  display: flex;
  background: rgba(255, 255, 255, 0.03);
  padding: 4px;
  border-radius: 10px;
}

.mode-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}

.mode-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.mode-btn.active {
  background: #1e293b;
  color: #00f2ff;
}

.filter-btn {
  padding: 10px 20px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: #94a3b8;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-btn.active {
  background: #00f2ff;
  color: #0f172a;
  border-color: #00f2ff;
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.4);
}

.params-bar {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
}

.param-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.param-item label {
  font-size: 0.75rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
}

.param-item input {
  width: 100%;
  accent-color: #00f2ff;
}

.param-item .val {
  font-size: 0.9rem;
  font-weight: 700;
  color: #00f2ff;
  font-family: monospace;
}

.main-chart {
  background: #020617;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  height: 500px;
}

.status-msg {
  padding: 0.75rem 1rem;
  background: rgba(0, 242, 255, 0.05);
  border-radius: 8px;
  font-size: 0.85rem;
  color: #94a3b8;
  text-align: center;
}

.error-overlay p { color: #ff3366; font-weight: bold; }
.error-overlay button {
  padding: 8px 16px;
  background: #334155;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
