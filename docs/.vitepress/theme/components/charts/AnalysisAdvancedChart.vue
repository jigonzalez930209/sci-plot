<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  height?: string
}>()

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const chartTheme = computed(() => isDark.value ? 'midnight' : 'light')
let chart: any = null

// State
const mode = ref<'time' | 'fft' | 'power'>('time')
const activeFilter = ref<'none' | 'lowpass' | 'highpass' | 'butterworth'>('none')
const windowFunction = ref<'none' | 'hanning' | 'hamming' | 'blackman'>('none')
const noiseLevel = ref(0.3)
const fps = ref(0)

// Data Config
const N = 2048
const SAMPLE_RATE = 1000 // 1kHz
const FREQ_SIGNAL = 50   // 50Hz main signal
const FREQ_NOISE = 120   // 120Hz interference

onMounted(async () => {
  if (typeof window === 'undefined') return
  if (!chartContainer.value) return
  
  try {
    const { createChart } = await import('@src/index')
    
    chart = createChart({
      container: chartContainer.value,
      theme: chartTheme.value,
      showControls: true,
      showStatistics: false,
    })

    chart.on('render', (e: any) => { fps.value = Math.round(e.fps) })

    updateChart()
  } catch (err) {
    console.error('AnalysisAdvancedChart: Error initializing chart', err)
  }
})

function generateSignal(): { t: Float32Array, y: Float32Array, yClean: Float32Array } {
  const t = new Float32Array(N)
  const y = new Float32Array(N)
  const yClean = new Float32Array(N)
  
  for (let i = 0; i < N; i++) {
    t[i] = i / SAMPLE_RATE
    yClean[i] = Math.sin(2 * Math.PI * FREQ_SIGNAL * t[i])
    y[i] = yClean[i] + 
           Math.sin(2 * Math.PI * FREQ_NOISE * t[i]) * 0.5 + 
           (Math.random() - 0.5) * noiseLevel.value
  }
  return { t, y, yClean }
}

function applyWindow(signal: Float32Array, type: string): Float32Array {
  if (type === 'none') return signal
  
  const windowed = new Float32Array(signal.length)
  const n = signal.length
  
  for (let i = 0; i < n; i++) {
    let w = 1
    if (type === 'hanning') {
      w = 0.5 * (1 - Math.cos(2 * Math.PI * i / (n - 1)))
    } else if (type === 'hamming') {
      w = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (n - 1))
    } else if (type === 'blackman') {
      w = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)) + 0.08 * Math.cos(4 * Math.PI * i / (n - 1))
    }
    windowed[i] = signal[i] * w
  }
  return windowed
}

function applyFilter(signal: Float32Array, type: string): Float32Array {
  if (type === 'none') return signal
  
  const filtered = new Float32Array(signal.length)
  
  if (type === 'lowpass') {
    let val = signal[0]
    const alpha = 0.15
    for (let i = 0; i < signal.length; i++) {
      val = val + alpha * (signal[i] - val)
      filtered[i] = val
    }
  } else if (type === 'highpass') {
    const alpha = 0.9
    filtered[0] = signal[0]
    for (let i = 1; i < signal.length; i++) {
      filtered[i] = alpha * (filtered[i - 1] + signal[i] - signal[i - 1])
    }
  } else if (type === 'butterworth') {
    const fc = 60 / (SAMPLE_RATE / 2)
    const k = Math.tan(Math.PI * fc)
    const k2 = k * k
    const sqrt2 = Math.sqrt(2)
    const norm = 1 / (1 + sqrt2 * k + k2)
    
    const a0 = k2 * norm
    const a1 = 2 * a0
    const a2 = a0
    const b1 = 2 * (k2 - 1) * norm
    const b2 = (1 - sqrt2 * k + k2) * norm
    
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0
    for (let i = 0; i < signal.length; i++) {
      const x = signal[i]
      filtered[i] = a0 * x + a1 * x1 + a2 * x2 - b1 * y1 - b2 * y2
      x2 = x1
      x1 = x
      y2 = y1
      y1 = filtered[i]
    }
  }
  return filtered
}

async function updateChart() {
  if (!chart || chart.isDestroyed) return

  try {
    const seriesList = chart.getAllSeries ? chart.getAllSeries() : []
    seriesList.forEach((s: any) => chart.removeSeries(s.getId()))
    chart.clearAnnotations?.()

    const { t, y, yClean } = generateSignal()
    let processed = applyFilter(y, activeFilter.value)
    
    if (mode.value === 'time') {
      const zoom = 400
      const tSlice = t.slice(0, zoom)
      const ySlice = processed.slice(0, zoom)
      const cleanSlice = yClean.slice(0, zoom)

      chart.addSeries({
        id: 'signal',
        type: 'line',
        data: { x: tSlice, y: ySlice },
        style: { 
          color: activeFilter.value === 'none' ? '#ff6b6b' : '#00f2ff', 
          width: 2 
        }
      })
      
      if (activeFilter.value === 'none') {
        chart.addSeries({
          id: 'clean-ref',
          type: 'line',
          data: { x: tSlice, y: cleanSlice },
          style: { color: 'rgba(100,255,100,0.5)', width: 2, lineDash: [5, 5] }
        })
      }

    } else {
      const { analyzeSpectrum, powerSpectrum } = await import('@src/analysis')
      processed = applyWindow(processed, windowFunction.value)
      
      if (mode.value === 'fft') {
        const spec = analyzeSpectrum(processed, SAMPLE_RATE)
        
        chart.addSeries({
          id: 'fft',
          type: 'area',
          data: { x: spec.frequency, y: spec.magnitude },
          style: { 
            color: '#a855f7',
            fillColor: 'rgba(168, 85, 247, 0.2)',
            width: 2 
          }
        })
        
        chart.addAnnotation({
          type: 'verticalLine', x: FREQ_SIGNAL, color: '#10b981', lineWidth: 2
        })
        
        if (activeFilter.value === 'none') {
          chart.addAnnotation({
            type: 'verticalLine', x: FREQ_NOISE, color: '#f43f5e', lineWidth: 2, lineDash: [4, 4]
          })
        }
        
      } else if (mode.value === 'power') {
        const ps = powerSpectrum(processed, SAMPLE_RATE)
        
        chart.addSeries({
          id: 'power',
          type: 'line',
          data: { x: ps.frequency, y: ps.powerDb },
          style: { color: '#f59e0b', width: 2 }
        })
        
        chart.addAnnotation({
          type: 'verticalLine', x: FREQ_SIGNAL, color: '#10b981', lineWidth: 2
        })
      }
    }

    chart.autoScale()
    chart.render()
  } catch (err) {
    console.error('AnalysisAdvancedChart: Error in updateChart', err)
  }
}

watch([mode, activeFilter, windowFunction, noiseLevel], () => {
  updateChart()
})

watch(isDark, () => {
  if (chart) {
    chart.setTheme(chartTheme.value)
    setTimeout(() => { chart.render() }, 100)
  }
})

onUnmounted(() => {
  if (chart) chart.destroy()
})
</script>

<template>
  <div class="chart-compact" :class="{ dark: isDark }">
    <div class="toolbar">
      <div class="toolbar-row">
        <div class="btn-group primary">
          <button :class="{ active: mode === 'time' }" @click="mode = 'time'">Time</button>
          <button :class="{ active: mode === 'fft' }" @click="mode = 'fft'">FFT</button>
          <button :class="{ active: mode === 'power' }" @click="mode = 'power'">dB</button>
        </div>
        
        <div class="btn-group">
          <button :class="{ active: activeFilter === 'none' }" @click="activeFilter = 'none'">Raw</button>
          <button :class="{ active: activeFilter === 'lowpass' }" @click="activeFilter = 'lowpass'">LP</button>
          <button :class="{ active: activeFilter === 'highpass' }" @click="activeFilter = 'highpass'">HP</button>
          <button :class="{ active: activeFilter === 'butterworth' }" @click="activeFilter = 'butterworth'">BW</button>
        </div>
        
        <select v-if="mode !== 'time'" v-model="windowFunction" class="select-sm">
          <option value="none">Window: None</option>
          <option value="hanning">Hanning</option>
          <option value="hamming">Hamming</option>
          <option value="blackman">Blackman</option>
        </select>
        
        <div class="slider-inline">
          <span>Noise</span>
          <input type="range" min="0" max="1" step="0.05" v-model.number="noiseLevel" />
          <span class="val">{{ (noiseLevel * 100).toFixed(0) }}%</span>
        </div>
        
        <span class="fps">{{ fps }} FPS</span>
      </div>
    </div>
    
    <div ref="chartContainer" class="chart-area" :style="{ height: height || '420px' }"></div>
    
    <div class="info-bar">
      <span v-if="mode === 'time'">{{ FREQ_SIGNAL }}Hz + {{ FREQ_NOISE }}Hz interference</span>
      <span v-else-if="mode === 'fft'">Magnitude Spectrum{{ windowFunction !== 'none' ? ` (${windowFunction})` : '' }}</span>
      <span v-else>Power Spectral Density (dB)</span>
      <span v-if="activeFilter !== 'none'" class="filter-tag">{{ activeFilter }}</span>
    </div>
  </div>
</template>

<style scoped>
.chart-compact {
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.08);
  overflow: hidden;
  margin: 1rem 0;
}

.toolbar {
  padding: 8px 12px;
  background: rgba(0,0,0,0.3);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-group {
  display: inline-flex;
  background: rgba(255,255,255,0.05);
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.btn-group button {
  background: transparent;
  border: none;
  color: #64748b;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-group button:hover {
  color: #94a3b8;
  background: rgba(255,255,255,0.05);
}

.btn-group button.active {
  background: #00f2ff;
  color: #000;
}

.btn-group.primary button.active {
  background: linear-gradient(135deg, #00f2ff, #00c8ff);
  box-shadow: 0 2px 8px rgba(0,242,255,0.3);
}

.select-sm {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px;
  color: #94a3b8;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
}

.select-sm:focus {
  outline: none;
  border-color: #00f2ff;
}

.slider-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #64748b;
}

.slider-inline input[type="range"] {
  width: 60px;
  height: 3px;
  -webkit-appearance: none;
  background: rgba(255,255,255,0.15);
  border-radius: 2px;
}

.slider-inline input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 10px;
  height: 10px;
  background: #00f2ff;
  border-radius: 50%;
  cursor: pointer;
}

.slider-inline .val {
  color: #00f2ff;
  min-width: 28px;
}

.fps {
  margin-left: auto;
  font-size: 11px;
  color: #00f2ff;
  font-weight: 600;
}

.chart-area {
  background: transparent;
}

.info-bar {
  padding: 6px 12px;
  background: rgba(0,0,0,0.2);
  font-size: 11px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-tag {
  background: rgba(0,242,255,0.15);
  color: #00f2ff;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  text-transform: uppercase;
}
</style>
