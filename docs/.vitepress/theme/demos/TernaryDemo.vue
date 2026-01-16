<template>
  <div class="ternary-demo">
    <div class="demo-controls">
      <h3>Ternary Plot Demo</h3>
      
      <div class="control-group">
        <label>Dataset:</label>
        <select v-model="selectedDataset" @change="updatePlot">
          <option value="soil">Soil Classification</option>
          <option value="phase">Phase Diagram</option>
          <option value="budget">Budget Allocation</option>
          <option value="random">Random Points</option>
        </select>
      </div>

      <div class="control-group">
        <label>Point Size: {{ pointSize }}px</label>
        <input v-model.number="pointSize" type="range" min="3" max="15" @input="updatePlot" />
      </div>

      <div class="control-group">
        <label>Grid Divisions: {{ gridDivisions }}</label>
        <input v-model.number="gridDivisions" type="range" min="5" max="20" @input="updatePlot" />
      </div>

      <div class="control-group">
        <label>Point Color:</label>
        <input v-model="pointColor" type="color" @input="updatePlot" />
      </div>

      <div class="control-group">
        <label>
          <input v-model="showGrid" type="checkbox" @change="updatePlot" />
          Show Grid
        </label>
      </div>

      <div class="control-group">
        <label>
          <input v-model="showLabels" type="checkbox" @change="updatePlot" />
          Show Labels
        </label>
      </div>

      <button @click="generateRandom" class="btn-generate">Generate Random Data</button>
    </div>

    <div class="canvas-container" :style="{ height: height || '600px' }">
      <canvas ref="canvasRef"></canvas>
    </div>

    <div class="info-panel">
      <h4>Current Dataset: {{ datasetNames[selectedDataset] }}</h4>
      <div class="component-labels">
        <div class="label-item">
          <span class="label-marker top"></span>
          <strong>{{ currentLabels.a }}</strong>
        </div>
        <div class="label-item">
          <span class="label-marker left"></span>
          <strong>{{ currentLabels.b }}</strong>
        </div>
        <div class="label-item">
          <span class="label-marker right"></span>
          <strong>{{ currentLabels.c }}</strong>
        </div>
      </div>
      <p class="info-text">Point Count: {{ pointCount }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useData } from 'vitepress';

const props = defineProps<{
  height?: string;
}>();

const { isDark } = useData();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const selectedDataset = ref('soil');
const pointSize = ref(8);
const gridDivisions = ref(10);
const pointColor = ref('#00f2ff');
const showGrid = ref(true);
const showLabels = ref(true);

let renderFunc: any = null;

const datasets = {
  soil: {
    a: [0.60, 0.40, 0.20, 0.10, 0.70, 0.50, 0.30],
    b: [0.30, 0.40, 0.60, 0.20, 0.20, 0.30, 0.50],
    c: [0.10, 0.20, 0.20, 0.70, 0.10, 0.20, 0.20]
  },
  phase: {
    a: [0.5, 0.6, 0.3, 0.4, 0.7, 0.2],
    b: [0.3, 0.2, 0.4, 0.3, 0.2, 0.5],
    c: [0.2, 0.2, 0.3, 0.3, 0.1, 0.3]
  },
  budget: {
    a: [0.5, 0.4, 0.6, 0.3, 0.55],
    b: [0.3, 0.4, 0.2, 0.5, 0.25],
    c: [0.2, 0.2, 0.2, 0.2, 0.20]
  },
  random: {
    a: [] as number[],
    b: [] as number[],
    c: [] as number[]
  }
};

const labels = {
  soil: { a: 'Sand', b: 'Silt', c: 'Clay' },
  phase: { a: 'Fe', b: 'Cr', c: 'Ni' },
  budget: { a: 'Education', b: 'Healthcare', c: 'Infrastructure' },
  random: { a: 'Component A', b: 'Component B', c: 'Component C' }
};

const datasetNames = {
  soil: 'Soil Classification',
  phase: 'Phase Diagram',
  budget: 'Budget Allocation',
  random: 'Random Points'
};

const currentLabels = computed(() => labels[selectedDataset.value as keyof typeof labels]);
const pointCount = computed(() => {
  const data = datasets[selectedDataset.value as keyof typeof datasets];
  return data.a.length;
});

function generateRandom() {
  const count = 20;
  datasets.random.a = [];
  datasets.random.b = [];
  datasets.random.c = [];

  for (let i = 0; i < count; i++) {
    const a = Math.random();
    const b = Math.random() * (1 - a);
    const c = 1 - a - b;
    
    datasets.random.a.push(a);
    datasets.random.b.push(b);
    datasets.random.c.push(c);
  }

  selectedDataset.value = 'random';
  updatePlot();
}

function updatePlot() {
  if (!canvasRef.value || !renderFunc) return;

  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const data = datasets[selectedDataset.value as keyof typeof datasets];
  const currentLabel = labels[selectedDataset.value as keyof typeof labels];

  renderFunc(ctx, data, {
    labelA: currentLabel.a,
    labelB: currentLabel.b,
    labelC: currentLabel.c,
    showGrid: showGrid.value,
    showLabels: showLabels.value,
    style: {
      pointSize: pointSize.value,
      color: pointColor.value,
      gridColor: isDark.value ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
      gridWidth: 1,
      gridDivisions: gridDivisions.value
    }
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

  updatePlot();
}

onMounted(async () => {
  if (typeof window === 'undefined') return;

  try {
    const { renderTernaryPlot } = await import('@src/renderer/ternary');
    renderFunc = renderTernaryPlot;

    // Setup canvas
    await new Promise(r => setTimeout(r, 100));
    resizeCanvas();

    // Listen for window resize
    window.addEventListener('resize', resizeCanvas);

    // Generate initial random data
    generateRandom();
  } catch (err) {
    console.error('TernaryDemo: Error during initialization', err);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas);
});
</script>

<style scoped>
.ternary-demo {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
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

.control-group select,
.control-group input[type="color"] {
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
  width: 100%;
  max-width: 200px;
}

.control-group select option {
  background: #1a1a2e;
  color: #fff;
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

input[type='checkbox'] {
  margin-right: 0.5rem;
}

.btn-generate {
  margin-top: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #00f2ff 0%, #0099ff 100%);
  border: none;
  border-radius: 6px;
  color: #000;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-generate:hover {
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
  padding: 1.5rem;
}

.info-panel h4 {
  margin: 0 0 1rem 0;
  color: #00f2ff;
  font-size: 1.1rem;
}

.component-labels {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.label-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
}

.label-marker {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.label-marker.top {
  background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
}

.label-marker.left {
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
}

.label-marker.right {
  background: linear-gradient(135deg, #f7b731, #f79f1f);
}

.info-text {
  margin: 0.5rem 0 0 0;
  color: #94a3b8;
  font-family: 'Courier New', monospace;
}
</style>
