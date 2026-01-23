<template>
  <div class="latex-demo-container">
    <div class="demo-controls">
      <h3>LaTeX Core Integration</h3>
      <p>This demo showcases 100% native LaTeX rendering integrated into the chart's core elements.</p>
      
      <div class="test-sections">
        <div class="test-card">
          <h4>Chart Layout</h4>
          <div class="control-row">
            <label>Title:</label>
            <input v-model="titleText" @input="updateChart" class="latex-input" />
          </div>
          <div class="control-row">
            <label>X-Axis:</label>
            <input v-model="xAxisLabel" @input="updateChart" class="latex-input" />
          </div>
          <div class="control-row">
            <label>Y-Axis:</label>
            <input v-model="yAxisLabel" @input="updateChart" class="latex-input" />
          </div>
        </div>

        <div class="test-card">
          <h4>Interactions</h4>
          <p class="hint">Hover the chart to see LaTeX in tooltips</p>
          <div class="control-row">
            <label>Tooltip Template:</label>
            <input v-model="tooltipTemplate" @input="updateChart" class="latex-input" />
          </div>
        </div>
      </div>

      <div class="presets">
        <button v-for="(p, name) in presets" :key="name" @click="applyPreset(p)" class="preset-btn">
          {{ name }}
        </button>
      </div>
    </div>

    <div ref="chartContainer" class="chart-container" :style="{ height: height || '500px' }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useData } from 'vitepress';

const props = defineProps<{
  height?: string;
}>();

const { isDark } = useData();
const chartContainer = ref<HTMLDivElement | null>(null);
let chart: any = null;

const titleText = ref('\\text{Quantum State Observation: } \\psi(x,t) = A e^{i(kx - \\omega t)}');
const xAxisLabel = ref('\\text{Position } x \\text{ (normalized Units)}');
const yAxisLabel = ref('\\text{Probability Density } |\\psi|^2');
const tooltipTemplate = ref('\\text{State: } \\alpha |0\\rangle + \\beta |1\\rangle\n\\text{Energy: } E = h \\nu');

const presets = {
  'Physics': {
    title: '\\text{Heisenberg Uncertainty: } \\sigma_x \\sigma_p \\geq \\frac{\\hbar}{2}',
    x: '\\text{Position } \\Delta x',
    y: '\\text{Momentum } \\Delta p',
    tooltip: '\\text{Relativity: } E = mc^2\n\\text{Entropy: } S = k \\log W'
  },
  'Chemistry': {
    title: 'H_2O + CO_2 \\rightleftharpoons H_2CO_3',
    x: '\\text{Reaction Coordinate}',
    y: '\\text{Free Energy } G',
    tooltip: 'C_6H_{12}O_6 + 6O_2 \\to 6CO_2 + 6H_2O'
  },
  'Calculus': {
    title: '\\text{Fundamental Theorem: } \\int_a^b f(x)dx = F(b) - F(a)',
    x: 'x \\to \\infty',
    y: '\\frac{dy}{dx}',
    tooltip: '\\sum_{n=0}^{\\infty} \\frac{x^n}{n!}'
  }
};

function applyPreset(p: any) {
  titleText.value = p.title;
  xAxisLabel.value = p.x;
  yAxisLabel.value = p.y;
  tooltipTemplate.value = p.tooltip;
  updateChart();
}

async function initChart() {
  if (!chartContainer.value) return;

  const { createChart, PluginLaTeX } = await import('@src/index');

  chart = createChart({
    container: chartContainer.value,
    theme: isDark.value ? 'midnight' : 'light',
    layout: {
      title: {
        text: titleText.value,
        visible: true,
        fontSize: 18,
      },
      margins: { top: 60, bottom: 60, left: 80, right: 40 }
    },
    xAxis: { label: xAxisLabel.value, auto: true },
    yAxis: { label: yAxisLabel.value, auto: true },
  });

  await chart.use(PluginLaTeX());

  // Add some data
  const xData = new Float32Array(100);
  const yData = new Float32Array(100);
  for (let i = 0; i < 100; i++) {
    xData[i] = i / 10;
    yData[i] = Math.sin(i / 5) * Math.exp(-i / 50) + 1;
  }

  chart.addSeries({
    id: 's1',
    type: 'line',
    data: { x: xData, y: yData },
    style: { color: '#00f2ff', lineWidth: 3 }
  });

  // Add LaTeX Annotations
  chart.addAnnotation({
    type: 'text',
    text: '\\text{Local Maximum } \\frac{\\partial f}{\\partial x} = 0',
    position: { x: 7.5, y: 1.5 },
    latex: true,
    style: { fontSize: 20, color: '#ff00ff' }
  });

  chart.addAnnotation({
    type: 'text',
    text: '\\sqrt{a^2 + b^2}',
    position: { x: 2, y: 0.5 },
    latex: true,
    style: { fontSize: 32, color: 'rgba(255, 255, 255, 0.3)' }
  });

  // Enable cursor with LaTeX tooltips
  chart.enableCursor({
    enabled: true,
    crosshair: true,
    valueDisplayMode: 'floating',
    formatter: (x, y) => {
      return `${tooltipTemplate.value}\nx: ${x.toFixed(2)}, y: ${y.toFixed(2)}`;
    }
  });
}

function updateChart() {
  if (!chart) return;
  
  chart.updateLayout({
    title: { text: titleText.value }
  });
  
  chart.updateXAxis({ label: xAxisLabel.value });
  chart.updateYAxis('default', { label: yAxisLabel.value });
  
  chart.enableCursor({
    formatter: (x, y) => {
      const template = tooltipTemplate.value || 'Value';
      return `${template}\nx: ${x.toFixed(2)}, y: ${y.toFixed(2)}`;
    }
  });
}

onMounted(() => {
  setTimeout(initChart, 100);
});

onUnmounted(() => {
  if (chart) chart.destroy();
});

watch(isDark, (val) => {
  if (chart) chart.setTheme(val ? 'midnight' : 'light');
});
</script>

<style scoped>
.latex-demo-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  padding: 1.5rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
}

.demo-controls h3 {
  margin-top: 0;
  color: #00f2ff;
  font-size: 1.5rem;
  background: linear-gradient(to right, #00f2ff, #0099ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.test-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.test-card {
  background: rgba(255, 255, 255, 0.03);
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.test-card h4 {
  margin: 0 0 1rem 0;
  color: #fff;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.7;
}

.control-row {
  margin-bottom: 0.75rem;
}

.control-row label {
  display: block;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.25rem;
}

.latex-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  color: #fff;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.latex-input:focus {
  outline: none;
  border-color: #00f2ff;
  background: rgba(0, 0, 0, 0.5);
  box-shadow: 0 0 0 2px rgba(0, 242, 255, 0.2);
}

.presets {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.preset-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 0.4rem 1rem;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: rgba(0, 242, 255, 0.1);
  border-color: #00f2ff;
  color: #00f2ff;
}

.chart-container {
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.hint {
  font-size: 0.8rem;
  color: #00f2ff;
  margin-top: -0.5rem;
  margin-bottom: 1rem;
  font-style: italic;
}
</style>

