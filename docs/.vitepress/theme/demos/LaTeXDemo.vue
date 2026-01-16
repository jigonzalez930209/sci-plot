<template>
  <div class="latex-demo">
    <div class="demo-controls">
      <h3>LaTeX Expression Editor</h3>
      <div class="control-group">
        <label>Enter LaTeX:</label>
        <input
          v-model="latexInput"
          type="text"
          class="latex-input"
          placeholder="Enter LaTeX expression (e.g., E = mc^2)"
        />
      </div>

      <div class="control-group">
        <label>Font Size: {{ fontSize }}px</label>
        <input v-model.number="fontSize" type="range" min="10" max="40" />
      </div>

      <div class="control-group">
        <label>Color:</label>
        <input v-model="color" type="color" />
      </div>

      <div class="preset-buttons">
        <h4>Quick Presets:</h4>
        <button @click="setPreset('E = mc^2')">Einstein</button>
        <button @click="setPreset('\\frac{\\partial^2 y}{\\partial x^2}')">Derivative</button>
        <button @click="setPreset('\\sum_{i=1}^{n} x_i')">Summation</button>
        <button @click="setPreset('\\int_{0}^{\\infty} e^{-x} dx')">Integral</button>
        <button @click="setPreset('\\alpha + \\beta = \\gamma')">Greek Letters</button>
        <button @click="setPreset('\\sqrt{x^2 + y^2}')">Pythagorean</button>
        <button @click="setPreset('H_2O + CO_2')">Chemistry</button>
        <button @click="setPreset('\\sigma_x \\times \\sigma_y \\geq \\frac{\\hbar}{2}')">Heisenberg</button>
      </div>
    </div>

    <div class="canvas-container" :style="{ height: height || '400px' }">
      <canvas ref="canvasRef"></canvas>
    </div>

    <div class="info-panel">
      <h4>Rendered Dimensions:</h4>
      <div v-if="dimensions">
        <p>Width: {{ dimensions.width.toFixed(2) }}px</p>
        <p>Height: {{ dimensions.height.toFixed(2) }}px</p>
        <p>Baseline: {{ dimensions.baseline.toFixed(2) }}px</p>
      </div>
    </div>

    <div class="supported-commands">
      <h4>Supported LaTeX Commands:</h4>
      <div class="command-grid">
        <div class="command-section">
          <h5>Superscripts & Subscripts</h5>
          <code>x^2, H_2O, x_i^2</code>
        </div>
        <div class="command-section">
          <h5>Fractions</h5>
          <code>\frac{a}{b}</code>
        </div>
        <div class="command-section">
          <h5>Square Roots</h5>
          <code>\sqrt{x}</code>
        </div>
        <div class="command-section">
          <h5>Greek Letters</h5>
          <code>\alpha, \beta, \gamma, \delta, \pi, \sigma, \omega</code>
        </div>
        <div class="command-section">
          <h5>Operators</h5>
          <code>\sum, \int, \partial, \pm, \times, \div, \infty</code>
        </div>
        <div class="command-section">
          <h5>Relations</h5>
          <code>\leq, \geq, \neq, \approx, \equiv</code>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { useData } from 'vitepress';

const props = defineProps<{
  height?: string;
}>();

const { isDark } = useData();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const latexInput = ref('E = mc^2');
const fontSize = ref(24);
const color = ref('#0066ff');
const dimensions = ref<{ width: number; height: number; baseline: number } | null>(null);

let latexAPI: any = null;

function setPreset(latex: string) {
  latexInput.value = latex;
}

async function renderLatex() {
  if (!canvasRef.value || !latexAPI) return;

  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Measure dimensions
  dimensions.value = latexAPI.measure(latexInput.value, {
    fontSize: fontSize.value,
  });

  // Center the LaTeX expression
  const centerX = canvas.width / 2 - (dimensions.value?.width || 0) / 2;
  const centerY = canvas.height / 2;

  // Render LaTeX
  latexAPI.render(latexInput.value, ctx, centerX, centerY, {
    fontSize: fontSize.value,
    color: color.value,
  });
}

function resizeCanvas() {
  if (!canvasRef.value) return;
  
  const container = canvasRef.value.parentElement;
  if (!container) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = container.getBoundingClientRect();
  
  canvasRef.value.width = rect.width * dpr;
  canvasRef.value.height = rect.height * dpr;
  canvasRef.value.style.width = `${rect.width}px`;
  canvasRef.value.style.height = `${rect.height}px`;

  const ctx = canvasRef.value.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
  }

  renderLatex();
}

onMounted(async () => {
  if (typeof window === 'undefined') return;

  try {
    const { PluginLaTeX } = await import('@src/index');

    // Create plugin instance just for the API
    const plugin = PluginLaTeX({
      fontSize: fontSize.value,
      color: color.value,
    });

    // Access the API directly from the plugin
    latexAPI = plugin.api;

    // Setup canvas
    await new Promise(r => setTimeout(r, 100));
    resizeCanvas();

    // Listen for window resize
    window.addEventListener('resize', resizeCanvas);
  } catch (err) {
    console.error('LaTeXDemo: Error during initialization', err);
  }
});

// Watch for changes
watch([latexInput, fontSize, color], () => {
  renderLatex();
});

// Watch theme changes  
watch(isDark, () => {
  renderLatex();
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas);
});
</script>

<style scoped>
.latex-demo {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 8px;
}

.demo-controls {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1.5rem;
}

.demo-controls h3 {
  margin: 0 0 1rem 0;
  color: #00f2ff;
  font-size: 1.25rem;
}

.control-group {
  margin-bottom: 1rem;
}

.control-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #fff;
  font-weight: 500;
}

.latex-input {
  width: 100%;
  padding: 0.75rem;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
  transition: border-color 0.3s;
}

.latex-input:focus {
  outline: none;
  border-color: #00f2ff;
}

input[type='range'] {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  outline: none;
}

input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  background: #00f2ff;
  border-radius: 50%;
  cursor: pointer;
}

input[type='color'] {
  width: 100px;
  height: 40px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.preset-buttons {
  margin-top: 1rem;
}

.preset-buttons h4 {
  margin: 0 0 0.75rem 0;
  color: #fff;
  font-size: 1rem;
}

.preset-buttons button {
  margin: 0.25rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #00f2ff 0%, #0099ff 100%);
  border: none;
  border-radius: 4px;
  color: #000;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.preset-buttons button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 242, 255, 0.4);
}

.canvas-container {
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.canvas-container canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.info-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
}

.info-panel h4 {
  margin: 0 0 0.75rem 0;
  color: #00f2ff;
}

.info-panel p {
  margin: 0.25rem 0;
  color: #fff;
  font-family: 'Courier New', monospace;
}

.supported-commands {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1.5rem;
}

.supported-commands h4 {
  margin: 0 0 1rem 0;
  color: #00f2ff;
}

.command-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.command-section h5 {
  margin: 0 0 0.5rem 0;
  color: #fff;
  font-size: 0.9rem;
}

.command-section code {
  display: block;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  color: #00f2ff;
  font-size: 0.85rem;
  font-family: 'Courier New', monospace;
}
</style>
