# Análisis Científico Avanzado

SciChart Engine incluye un completo conjunto de funciones matemáticas para análisis científico profesional. Todas las funciones están optimizadas para trabajar con grandes datasets y están disponibles directamente desde la instancia del chart.

<script setup>
import AdvancedMathDemo from '../.vitepress/theme/demos/2d/AdvancedMathDemo.vue'
</script>

## Demo Interactivo

Experimenta con las funciones de análisis en tiempo real:

<AdvancedMathDemo />

---

## Funciones Disponibles

### 📈 Savitzky-Golay (Suavizado Inteligente)

El filtro Savitzky-Golay ajusta un polinomio local a una ventana de puntos, eliminando ruido mientras preserva la forma, ancho y altura de los picos.

```typescript
import { savitzkyGolay } from 'scichart-engine/analysis';

// Suavizar señal con ventana de 15 puntos y polinomio de orden 3
const smoothed = savitzkyGolay(data, 15, 3);

// Desde el chart
const smoothed = chart.analysis.savitzkyGolay(rawSignal, 11, 3);
```

**Parámetros:**
- `data`: Array de datos a suavizar
- `windowSize`: Tamaño de ventana (debe ser impar)
- `polynomialOrder`: Orden del polinomio (típicamente 2-4)

---

### 📉 Corrección de Línea Base

Elimina drift lineal o desplazamientos de la señal para aislar los picos verdaderos.

```typescript
import { subtractBaseline } from 'scichart-engine/analysis';

// Restar línea base lineal entre x=0 y x=10
const corrected = subtractBaseline(x, y, 0, 10);
```

**Uso típico:**
- Señales electroquímicas con drift capacitivo
- Espectros con inclinación de fondo
- Cromatogramas con línea base variable

---

### 🎯 Detección de Picos

Detecta automáticamente picos locales con filtrado por prominencia.

```typescript
import { detectPeaks } from 'scichart-engine/analysis';

const peaks = detectPeaks(x, y, {
  minProminence: 0.5,  // Prominencia mínima
  type: 'max'          // 'max', 'min', o 'both'
});

// Resultado
peaks.forEach(peak => {
  console.log(`Pico en x=${peak.x}, y=${peak.y}, prominencia=${peak.prominence}`);
});
```

**Opciones:**
- `minProminence`: Altura mínima respecto a valles vecinos
- `type`: Tipo de extremos a detectar

---

### ∫ Integración Numérica

Calcula el área bajo la curva usando la regla del trapecio.

```typescript
import { integrate } from 'scichart-engine/analysis';

// Área total
const totalArea = integrate(x, y);

// Área en rango específico
const partialArea = integrate(x, y, { xMin: 2, xMax: 5 });
```

**Aplicaciones:**
- Carga total (Q = ∫I dt) en electroquímica
- Concentración en cromatografía
- Energía en señales de potencia

---

### 📐 Derivadas Numéricas

Calcula la primera o segunda derivada de los datos.

```typescript
import { derivative } from 'scichart-engine/analysis';

// Primera derivada
const dy = derivative(x, y, 1);

// Segunda derivada con suavizado previo
const d2y = derivative(x, y, 2, 5);
```

**Usos:**
- Encontrar puntos de inflexión
- Detectar cambios de pendiente
- Análisis de titulación

---

### 🔍 LTTB Downsampling

Reduce el número de puntos preservando la forma visual (Largest-Triangle-Three-Buckets).

```typescript
import { downsampleLTTB } from 'scichart-engine/analysis';

// Reducir 100,000 puntos a 1,000
const downsampled = downsampleLTTB(x, y, 1000);

chart.addSeries({
  id: 'optimized',
  type: 'line',
  data: downsampled
});
```

**Beneficios:**
- Rendimiento extremo con grandes datasets
- Preserva picos y valles (a diferencia de promediado)
- Visualización idéntica con 100x menos puntos

---

### 📏 Delta Tool (Herramienta de Medición)

Mide distancias, deltas y pendientes entre dos puntos en el gráfico.

```typescript
import { DeltaTool } from 'scichart-engine';

const deltaTool = new DeltaTool({
  container: chartContainer,
  getPlotArea: () => chart.getPlotArea(),
  getViewBounds: () => chart.getViewBounds(),
  onMeasure: (measurement) => {
    console.log(`ΔX: ${measurement.deltaX}`);
    console.log(`ΔY: ${measurement.deltaY}`);
    console.log(`Slope: ${measurement.slope}`);
    console.log(`Distance: ${measurement.distance}`);
  }
});

// Activar/desactivar
deltaTool.enable();
deltaTool.disable();
```

---

## FFT y Filtros Digitales

### Transformada de Fourier

```typescript
import { fft, ifft, fftFrequencies } from 'scichart-engine/analysis';

// Calcular espectro de frecuencias
const spectrum = fft(timeDomainData);
console.log(spectrum.magnitude); // Amplitud
console.log(spectrum.phase);     // Fase

// Transformada inversa
const reconstructed = ifft(spectrum);
```

### Filtros FIR

```typescript
import { lowPassFilter, highPassFilter, bandPassFilter } from 'scichart-engine/analysis';

// Filtro paso bajo a 100 Hz con sample rate 1000 Hz
const filtered = lowPassFilter(data, 100, 1000);

// Filtro paso alto
const highPassed = highPassFilter(data, 50, 1000);

// Filtro paso banda
const bandPassed = bandPassFilter(data, 50, 200, 1000);
```

### Filtro Butterworth

```typescript
import { butterworth } from 'scichart-engine/analysis';

// Butterworth de orden 4 con frecuencia de corte 0.1 (normalizada)
const filtered = butterworth(data, 4, 0.1);
```

---

## Indicadores Financieros

```typescript
import { 
  sma, ema, macd, rsi, 
  bollingerBands, atr, vwap, adx 
} from 'scichart-engine/analysis';

// Media móvil simple de 20 períodos
const ma20 = sma(closeData, 20);

// Media móvil exponencial
const ema12 = ema(closeData, 12);

// MACD
const macdResult = macd(closeData, 12, 26, 9);
// macdResult.macdLine, macdResult.signalLine, macdResult.histogram

// RSI
const rsiValues = rsi(closeData, 14);

// Bollinger Bands
const bands = bollingerBands(closeData, 20, 2);
// bands.upper, bands.middle, bands.lower
```

---

## Estadísticas y Detección de Anomalías

```typescript
import { 
  crossCorrelation, 
  anomalyDetection,
  tTest 
} from 'scichart-engine/analysis';

// Correlación cruzada entre dos señales
const correlation = crossCorrelation(signal1, signal2);

// Detección de anomalías con Z-score
const anomalies = anomalyDetection(data, {
  method: 'zscore',
  threshold: 3
});

// T-test de dos muestras
const result = tTest(sample1, sample2);
console.log(`p-value: ${result.pValue}, significativo: ${result.significant}`);
```

---

## Acceso desde el Chart

Todas las funciones están disponibles directamente en la instancia del chart:

```typescript
const chart = createChart({ container });

// Acceder al módulo de análisis
chart.analysis.savitzkyGolay(data, 11, 3);
chart.analysis.fft(signal);
chart.analysis.sma(prices, 20);
chart.analysis.detectPeaks(x, y, { minProminence: 0.1 });
```

Esto permite realizar análisis sin necesidad de imports adicionales y con acceso directo a los datos del chart.
