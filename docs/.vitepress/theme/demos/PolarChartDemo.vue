<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

const chartContainer = ref<HTMLDivElement | null>(null);
let chart: any = null;

const selectedPattern = ref('wind-rose');
const angleMode = ref<'degrees' | 'radians'>('degrees');
const fillEnabled = ref(true);
const closePathEnabled = ref(true);
const angularDivisions = ref(12);
const radialDivisions = ref(5);

const patterns = [
  { value: 'wind-rose', label: 'Wind Rose', icon: '🌬️' },
  { value: 'radar', label: 'Radar Chart', icon: '📊' },
  { value: 'spiral', label: 'Spiral', icon: '🌀' },
  { value: 'flower', label: 'Flower Pattern', icon: '🌸' },
  { value: 'cv', label: 'Cyclic Voltammetry', icon: '⚡' },
];

// Generate different polar patterns
function generateWindRose() {
  const directions = 8;
  const r = new Float32Array(directions);
  const theta = new Float32Array(directions);
  
  for (let i = 0; i < directions; i++) {
    theta[i] = i * (360 / directions);
    r[i] = 3 + Math.random() * 7; // 3-10 range
  }
  
  return { r, theta };
}

function generateRadarChart() {
  const metrics = 6;
  const r = new Float32Array(metrics);
  const theta = new Float32Array(metrics);
  
  const values = [85, 90, 75, 80, 95, 70];
  
  for (let i = 0; i < metrics; i++) {
    theta[i] = i * (360 / metrics);
    r[i] = values[i] / 10; // Scale to 0-10
  }
  
  return { r, theta };
}

function generateSpiral() {
  const points = 200;
  const turns = 3;
  const r = new Float32Array(points);
  const theta = new Float32Array(points);
  
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * turns * 360;
    theta[i] = angle;
    r[i] = (angle / 360) * 3; // Radius increases with angle
  }
  
  return { r, theta };
}

function generateFlower() {
  const points = 200;
  const petals = 5;
  const r = new Float32Array(points);
  const theta = new Float32Array(points);
  
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 360;
    theta[i] = angle;
    // Rose curve: r = a * cos(k * θ)
    const angleRad = angle * Math.PI / 180;
    r[i] = 5 + 3 * Math.cos(petals * angleRad);
  }
  
  return { r, theta };
}

function generateCV() {
  const points = 300;
  const cycles = 2;
  const r = new Float32Array(points);
  const theta = new Float32Array(points);
  
  for (let i = 0; i < points; i++) {
    const t = (i / points) * cycles * 2 * Math.PI;
    const potential = Math.sin(t) * 5;
    const current = (Math.exp(-Math.pow(t - Math.PI, 2) * 0.5) - 
                     Math.exp(-Math.pow(t - 3 * Math.PI, 2) * 0.5)) * 3;
    
    // Convert to polar
    r[i] = Math.sqrt(potential * potential + current * current);
    theta[i] = Math.atan2(current, potential) * 180 / Math.PI;
  }
  
  return { r, theta };
}

function getPatternData(pattern: string) {
  switch (pattern) {
    case 'wind-rose': return generateWindRose();
    case 'radar': return generateRadarChart();
    case 'spiral': return generateSpiral();
    case 'flower': return generateFlower();
    case 'cv': return generateCV();
    default: return generateWindRose();
  }
}

function getPatternColor(pattern: string): string {
  switch (pattern) {
    case 'wind-rose': return '#4ecdc4';
    case 'radar': return '#00f2ff';
    case 'spiral': return '#9b59b6';
    case 'flower': return '#ff6b9d';
    case 'cv': return '#ff6b6b';
    default: return '#00f2ff';
  }
}

function updateChart() {
  if (!chart) return;
  
  const data = getPatternData(selectedPattern.value);
  const color = getPatternColor(selectedPattern.value);
  const patternLabel = patterns.find(p => p.value === selectedPattern.value)?.label || 'Polar';
  
  // Remove existing series and add new one with updated data
  chart.removeSeries('polar');
  chart.addSeries({
    id: 'polar',
    name: patternLabel,
    type: 'polar',
    data,
    style: {
      color,
      width: 2,
      angleMode: angleMode.value,
      fill: fillEnabled.value,
      fillOpacity: 0.3,
      closePath: closePathEnabled.value,
      angularDivisions: angularDivisions.value,
      radialDivisions: radialDivisions.value
    }
  });
  
  // Auto-scale to fit new data
  chart.autoScale();
}

const patternInfo = computed(() => {
  const info: Record<string, string> = {
    'wind-rose': 'Wind direction and speed distribution. Common in meteorology.',
    'radar': 'Multi-dimensional comparison chart. Shows 6 performance metrics.',
    'spiral': 'Archimedean spiral where radius increases linearly with angle.',
    'flower': 'Rose curve pattern (r = a + b·cos(kθ)). Creates petal shapes.',
    'cv': 'Cyclic Voltammetry simulation showing redox peaks in electrochemistry.'
  };
  return info[selectedPattern.value] || '';
});

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return;
  
  const { createChart } = await import('@src/index');
  
  chart = createChart({
    container: chartContainer.value,
    title: 'Polar Chart Demo',
    theme: 'midnight',
    showLegend: true,
    showControls: true,
  });
  
  const data = getPatternData(selectedPattern.value);
  const color = getPatternColor(selectedPattern.value);
  
  chart.addSeries({
    id: 'polar',
    name: patterns.find(p => p.value === selectedPattern.value)?.label,
    type: 'polar',
    data,
    style: {
      color,
      width: 2,
      angleMode: angleMode.value,
      fill: fillEnabled.value,
      fillOpacity: 0.3,
      closePath: closePathEnabled.value,
      angularDivisions: angularDivisions.value,
      radialDivisions: radialDivisions.value
    }
  });
});

onUnmounted(() => {
  chart?.destroy();
});
</script>

<template>
  <div class="polar-demo">
    <div ref="chartContainer" class="chart-container"></div>
    
    <div class="controls-panel">
      <div class="control-section">
        <h4>📐 Pattern</h4>
        <div class="pattern-buttons">
          <button
            v-for="pattern in patterns"
            :key="pattern.value"
            :class="{ active: selectedPattern === pattern.value }"
            @click="selectedPattern = pattern.value; updateChart()"
          >
            <span class="icon">{{ pattern.icon }}</span>
            <span class="label">{{ pattern.label }}</span>
          </button>
        </div>
        <p class="pattern-info">{{ patternInfo }}</p>
      </div>
      
      <div class="control-section">
        <h4>⚙️ Options</h4>
        <div class="options-grid">
          <label class="checkbox-label">
            <input type="checkbox" v-model="fillEnabled" @change="updateChart" />
            <span>Fill Area</span>
          </label>
          
          <label class="checkbox-label">
            <input type="checkbox" v-model="closePathEnabled" @change="updateChart" />
            <span>Close Path</span>
          </label>
          
          <label class="select-label">
            <span>Angle Mode:</span>
            <select v-model="angleMode" @change="updateChart">
              <option value="degrees">Degrees</option>
              <option value="radians">Radians</option>
            </select>
          </label>
        </div>
      </div>
      
      <!-- Grid controls commented out - pending Phase 2 implementation
      <div class="control-section">
        <h4>🎛️ Grid</h4>
        <div class="slider-group">
          <label>
            <span>Angular Divisions: {{ angularDivisions }}</span>
            <input 
              type="range" 
              v-model.number="angularDivisions" 
              min="4" 
              max="24" 
              step="2"
              @input="updateChart"
            />
          </label>
          
          <label>
            <span>Radial Divisions: {{ radialDivisions }}</span>
            <input 
              type="range" 
              v-model.number="radialDivisions" 
              min="3" 
              max="10" 
              step="1"
              @input="updateChart"
            />
          </label>
        </div>
      </div>
      -->
    </div>
  </div>
</template>

<style scoped>
.polar-demo {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chart-container {
  width: 100%;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
}

.controls-panel {
  background: var(--vp-c-bg-soft);
  padding: 1.5rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.control-section h4 {
  margin: 0 0 0.75rem 0;
  color: #00f2ff;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pattern-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.5rem;
}

.pattern-buttons button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s;
}

.pattern-buttons button:hover {
  border-color: #00f2ff;
  transform: translateY(-2px);
}

.pattern-buttons button.active {
  background: linear-gradient(135deg, rgba(0, 242, 255, 0.2), rgba(78, 205, 196, 0.2));
  border-color: #00f2ff;
  color: #00f2ff;
}

.pattern-buttons .icon {
  font-size: 1.5rem;
}

.pattern-buttons .label {
  font-size: 0.75rem;
  font-weight: 500;
}

.pattern-info {
  margin: 0.75rem 0 0 0;
  padding: 0.75rem;
  background: var(--vp-c-bg);
  border-left: 3px solid #00f2ff;
  border-radius: 4px;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.checkbox-label:hover {
  background: var(--vp-c-bg);
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.select-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.select-label select {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.slider-group label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slider-group span {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.slider-group input[type="range"] {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--vp-c-divider);
  outline: none;
  cursor: pointer;
}

.slider-group input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #00f2ff;
  cursor: pointer;
}

.slider-group input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #00f2ff;
  cursor: pointer;
  border: none;
}

@media (max-width: 768px) {
  .chart-container {
    height: 400px;
  }
  
  .pattern-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
