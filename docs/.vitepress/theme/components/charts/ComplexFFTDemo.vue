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
const viewMode = ref<'realimag' | 'magnitude' | 'phase' | 'reconstructed'>('realimag')
const signalType = ref<'sine' | 'cosine' | 'complex' | 'multi'>('sine')
const frequency = ref(50)
const frequency2 = ref(120)
const frequency3 = ref(200)
const phaseShift = ref(0) // Phase in degrees
const showNegativeFreqs = ref(false)
const showMultiFreq = ref(false)

// Use 16384 points (next power of 2 after 10000)
const N = 16384
const SAMPLE_RATE = 1000 // 1kHz sample rate

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

    updateChart()
  } catch (err) {
    console.error('ComplexFFTDemo: Error initializing chart', err)
  }
})

function generateSignal(): { real: Float32Array, imag: Float32Array, t: Float32Array } {
  const real = new Float32Array(N)
  const imag = new Float32Array(N)
  const t = new Float32Array(N)
  
  const phaseRad = (phaseShift.value * Math.PI) / 180 // Convert to radians
  
  for (let i = 0; i < N; i++) {
    t[i] = i / SAMPLE_RATE
    const phase1 = 2 * Math.PI * frequency.value * t[i] + phaseRad
    
    switch (signalType.value) {
      case 'sine':
        // Pure sine with phase shift: sin(wt + φ)
        real[i] = Math.sin(phase1)
        imag[i] = 0
        break
      case 'cosine':
        // Pure cosine with phase shift: cos(wt + φ)
        real[i] = Math.cos(phase1)
        imag[i] = 0
        break
      case 'complex':
        // Complex exponential with phase: e^(j(wt + φ)) = cos(wt+φ) + j*sin(wt+φ)
        real[i] = Math.cos(phase1)
        imag[i] = Math.sin(phase1)
        break
      case 'multi':
        // Multiple frequencies with different phases
        const phase2 = 2 * Math.PI * frequency2.value * t[i] + phaseRad * 0.5
        const phase3 = 2 * Math.PI * frequency3.value * t[i] + phaseRad * 1.5
        real[i] = Math.sin(phase1) + 0.7 * Math.sin(phase2) + 0.4 * Math.sin(phase3)
        imag[i] = 0
        break
    }
  }
  
  return { real, imag, t }
}

async function updateChart() {
  if (!chart || chart.isDestroyed) return

  try {
    const seriesList = chart.getAllSeries ? chart.getAllSeries() : []
    seriesList.forEach((s: any) => chart.removeSeries(s.getId()))
    chart.clearAnnotations?.()

    const { analyzeComplexSpectrum, fftFromComplexInput, ifftComplex, arraysToComplex, getPositiveFrequencies } = await import('@src/plugins/analysis')
    
    const signal = generateSignal()
    
    // Perform FFT
    let fftResult
    if (signalType.value === 'complex') {
      fftResult = fftFromComplexInput(signal.real, signal.imag)
    } else {
      fftResult = analyzeComplexSpectrum(signal.real, SAMPLE_RATE)
    }
    
    // Build frequency axis
    const freqAxis = new Float32Array(fftResult.length)
    for (let i = 0; i < fftResult.length; i++) {
      if (showNegativeFreqs.value) {
        freqAxis[i] = i < fftResult.nyquist 
          ? (i * SAMPLE_RATE / fftResult.length)
          : ((i - fftResult.length) * SAMPLE_RATE / fftResult.length)
      } else {
        freqAxis[i] = (i * SAMPLE_RATE) / fftResult.length
      }
    }

    // Limit display range for clarity (show up to 300 Hz)
    const maxDisplayFreq = 350
    const maxBin = Math.min(Math.ceil(maxDisplayFreq * fftResult.length / SAMPLE_RATE), fftResult.nyquist)

    if (viewMode.value === 'realimag') {
      const displayLen = showNegativeFreqs.value ? fftResult.length : maxBin
      const displayFreq = showNegativeFreqs.value ? freqAxis : freqAxis.slice(0, maxBin)
      const displayReal = fftResult.real.slice(0, displayLen)
      const displayImag = fftResult.imag.slice(0, displayLen)
      
      chart.addSeries({
        id: 'fft-real',
        type: 'line',
        data: { x: displayFreq, y: displayReal },
        style: { color: '#00f2ff', width: 2 }
      })
      
      chart.addSeries({
        id: 'fft-imag',
        type: 'line',
        data: { x: displayFreq, y: displayImag },
        style: { color: '#f97316', width: 2 }
      })
      
      // Add vertical lines at signal frequencies
      chart.addAnnotation({
        type: 'verticalLine', x: frequency.value, color: '#22c55e', lineWidth: 2, lineDash: [4, 4]
      })
      
      if (signalType.value === 'multi') {
        chart.addAnnotation({
          type: 'verticalLine', x: frequency2.value, color: '#a855f7', lineWidth: 2, lineDash: [4, 4]
        })
        chart.addAnnotation({
          type: 'verticalLine', x: frequency3.value, color: '#ec4899', lineWidth: 2, lineDash: [4, 4]
        })
      }
      
    } else if (viewMode.value === 'magnitude') {
      const displayLen = showNegativeFreqs.value ? fftResult.length : maxBin
      const displayFreq = showNegativeFreqs.value ? freqAxis : freqAxis.slice(0, maxBin)
      const displayMag = fftResult.magnitude.slice(0, displayLen)
      
      chart.addSeries({
        id: 'fft-mag',
        type: 'area',
        data: { x: displayFreq, y: displayMag },
        style: { color: '#a855f7', fillColor: 'rgba(168, 85, 247, 0.2)', width: 2 }
      })
      
      chart.addAnnotation({
        type: 'verticalLine', x: frequency.value, color: '#22c55e', lineWidth: 2
      })
      
      if (signalType.value === 'multi') {
        chart.addAnnotation({
          type: 'verticalLine', x: frequency2.value, color: '#a855f7', lineWidth: 2
        })
        chart.addAnnotation({
          type: 'verticalLine', x: frequency3.value, color: '#ec4899', lineWidth: 2
        })
      }
      
    } else if (viewMode.value === 'phase') {
      const displayLen = showNegativeFreqs.value ? fftResult.length : maxBin
      const displayFreq = showNegativeFreqs.value ? freqAxis : freqAxis.slice(0, maxBin)
      const displayPhase = fftResult.phase.slice(0, displayLen)
      
      chart.addSeries({
        id: 'fft-phase',
        type: 'line',
        data: { x: displayFreq, y: displayPhase },
        style: { color: '#eab308', width: 2 }
      })
      
      chart.addAnnotation({
        type: 'horizontalLine', y: Math.PI, color: '#64748b', lineWidth: 1, lineDash: [4, 4]
      })
      chart.addAnnotation({
        type: 'horizontalLine', y: -Math.PI, color: '#64748b', lineWidth: 1, lineDash: [4, 4]
      })
      chart.addAnnotation({
        type: 'horizontalLine', y: 0, color: '#64748b', lineWidth: 1
      })
      
    } else if (viewMode.value === 'reconstructed') {
      const complex = arraysToComplex(fftResult.real, fftResult.imag)
      const reconstructed = ifftComplex(complex)
      
      // Show portion of signal
      const displayLen = 200
      const tSlice = signal.t.slice(0, displayLen)
      const origReal = signal.real.slice(0, displayLen)
      const reconReal = reconstructed.real.slice(0, displayLen)
      
      chart.addSeries({
        id: 'orig-real',
        type: 'line',
        data: { x: tSlice, y: origReal },
        style: { color: '#00f2ff', width: 2 }
      })
      
      chart.addSeries({
        id: 'recon-real',
        type: 'scatter',
        data: { x: tSlice, y: reconReal },
        style: { color: '#22c55e', size: 3, symbol: 'circle' }
      })
      
      if (signalType.value === 'complex') {
        const origImag = signal.imag.slice(0, displayLen)
        const reconImag = reconstructed.imag.slice(0, displayLen)
        
        chart.addSeries({
          id: 'orig-imag',
          type: 'line',
          data: { x: tSlice, y: origImag },
          style: { color: '#f97316', width: 2 }
        })
        
        chart.addSeries({
          id: 'recon-imag',
          type: 'scatter',
          data: { x: tSlice, y: reconImag },
          style: { color: '#a855f7', size: 3, symbol: 'circle' }
        })
      }
    }

    chart.autoScale()
    chart.render()
  } catch (err) {
    console.error('ComplexFFTDemo: Error in updateChart', err)
  }
}

watch([viewMode, signalType, frequency, frequency2, frequency3, phaseShift, showNegativeFreqs], () => {
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

const signalDescription = computed(() => {
  const phaseStr = phaseShift.value !== 0 ? ` + ${phaseShift.value}°` : ''
  switch (signalType.value) {
    case 'sine': return `sin(2π×${frequency.value}t${phaseStr}) — N=${N} pts`
    case 'cosine': return `cos(2π×${frequency.value}t${phaseStr}) — N=${N} pts`
    case 'complex': return `e^(j(2π×${frequency.value}t${phaseStr})) — N=${N} pts`
    case 'multi': return `${frequency.value}Hz + ${frequency2.value}Hz + ${frequency3.value}Hz — N=${N} pts`
  }
})

const phaseNote = computed(() => {
  if (phaseShift.value === 0) return ''
  if (phaseShift.value === 90) return 'sin → cos (90° shift)'
  if (phaseShift.value === -90) return 'cos → sin (-90° shift)'
  if (phaseShift.value === 45) return 'Equal real/imag at 45°'
  return `Phase: ${phaseShift.value}°`
})
</script>

<template>
  <div class="chart-compact" :class="{ dark: isDark }">
    <div class="toolbar">
      <div class="toolbar-row">
        <span class="title">🔢 Complex FFT</span>
        
        <div class="btn-group primary">
          <button :class="{ active: viewMode === 'realimag' }" @click="viewMode = 'realimag'">Re/Im</button>
          <button :class="{ active: viewMode === 'magnitude' }" @click="viewMode = 'magnitude'">|Z|</button>
          <button :class="{ active: viewMode === 'phase' }" @click="viewMode = 'phase'">∠φ</button>
          <button :class="{ active: viewMode === 'reconstructed' }" @click="viewMode = 'reconstructed'">IFFT</button>
        </div>
        
        <div class="btn-group">
          <button :class="{ active: signalType === 'sine' }" @click="signalType = 'sine'">sin</button>
          <button :class="{ active: signalType === 'cosine' }" @click="signalType = 'cosine'">cos</button>
          <button :class="{ active: signalType === 'complex' }" @click="signalType = 'complex'">e^jωt</button>
          <button :class="{ active: signalType === 'multi' }" @click="signalType = 'multi'">Multi</button>
        </div>
        
        <label class="checkbox" v-if="viewMode !== 'reconstructed'">
          <input type="checkbox" v-model="showNegativeFreqs" />
          <span>Full</span>
        </label>
      </div>
      
      <div class="toolbar-row">
        <div class="slider-inline">
          <span>f₁</span>
          <input type="range" min="10" max="150" v-model.number="frequency" />
          <span class="val">{{ frequency }}Hz</span>
        </div>
        
        <div class="slider-inline" v-if="signalType === 'multi'">
          <span>f₂</span>
          <input type="range" min="50" max="250" v-model.number="frequency2" />
          <span class="val">{{ frequency2 }}Hz</span>
        </div>
        
        <div class="slider-inline" v-if="signalType === 'multi'">
          <span>f₃</span>
          <input type="range" min="100" max="400" v-model.number="frequency3" />
          <span class="val">{{ frequency3 }}Hz</span>
        </div>
        
        <div class="slider-inline phase-slider">
          <span>φ</span>
          <input type="range" min="-180" max="180" step="15" v-model.number="phaseShift" />
          <span class="val">{{ phaseShift }}°</span>
        </div>
        
        <span class="phase-note" v-if="phaseNote">{{ phaseNote }}</span>
      </div>
    </div>
    
    <div ref="chartContainer" class="chart-area" :style="{ height: height || '420px' }"></div>
    
    <div class="info-bar">
      <span class="signal-desc">{{ signalDescription }}</span>
      <div class="legend" v-if="viewMode === 'realimag'">
        <span class="legend-item" style="color: #00f2ff">● Real</span>
        <span class="legend-item" style="color: #f97316">● Imag</span>
      </div>
      <div class="legend" v-else-if="viewMode === 'reconstructed'">
        <span class="legend-item" style="color: #00f2ff">— Orig</span>
        <span class="legend-item" style="color: #22c55e">● IFFT</span>
      </div>
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
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.toolbar-row:last-child {
  margin-bottom: 0;
}

.title {
  font-weight: 600;
  font-size: 12px;
  color: #94a3b8;
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

.slider-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #64748b;
}

.slider-inline input[type="range"] {
  width: 80px;
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
  min-width: 45px;
  font-weight: 600;
}

.phase-slider input[type="range"] {
  width: 100px;
}

.phase-slider input[type="range"]::-webkit-slider-thumb {
  background: #eab308;
}

.phase-slider .val {
  color: #eab308;
}

.phase-note {
  font-size: 10px;
  color: #a855f7;
  font-style: italic;
  padding: 2px 6px;
  background: rgba(168, 85, 247, 0.15);
  border-radius: 4px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #64748b;
  cursor: pointer;
}

.checkbox input {
  accent-color: #00f2ff;
}

.chart-area {
  background: transparent;
}

.info-bar {
  padding: 8px 12px;
  background: rgba(0,0,0,0.2);
  font-size: 11px;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.signal-desc {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: #94a3b8;
}

.legend {
  display: flex;
  gap: 12px;
}

.legend-item {
  font-weight: 600;
}
</style>
