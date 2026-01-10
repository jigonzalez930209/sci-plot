# SciChart Engine - Propuestas de Mejora

> Documento de análisis y propuestas de mejora para la librería SciChart Engine.  
> Fecha: 2026-01-07

---

## Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Mejoras de Alto Impacto](#mejoras-de-alto-impacto)
3. [Mejoras de Mediano Impacto](#mejoras-de-mediano-impacto)
4. [Mejoras de Bajo Impacto](#mejoras-de-bajo-impacto)
5. [Matriz de Priorización](#matriz-de-priorización)

---

## Resumen Ejecutivo

Este documento presenta 20 propuestas de mejora para SciChart Engine, una librería de gráficos científicos de alto rendimiento basada en WebGL. Las mejoras están categorizadas por impacto en los usuarios y puntuadas por complejidad de implementación (1-5, donde 1 es simple y 5 es muy complejo).

---

## Mejoras de Alto Impacto

Estas mejoras tienen el potencial de atraer significativamente más usuarios y mejorar drásticamente la experiencia de uso.

---

### 1. 🔥 Sistema de Animaciones y Transiciones

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐⭐⭐ (4/5) |
| **Impacto** | ALTO |
| **Beneficio** | UX premium, diferenciación de competidores |

**Descripción:**  
Implementar un sistema de animaciones fluidas para transiciones entre estados del chart (zoom, pan, actualización de datos, cambio de series).

**Mejora para usuarios:**  
- Transiciones suaves al hacer zoom/pan
- Animación de entrada al cargar datos
- Interpolación entre actualizaciones de datos en tiempo real
- Sensación de producto premium y pulido

**Implementación sugerida:**
```typescript
// Nuevo archivo: src/core/animation/AnimationEngine.ts
interface AnimationOptions {
  duration: number; // ms
  easing: 'linear' | 'easeInOut' | 'easeOut' | 'spring';
  onUpdate: (progress: number) => void;
  onComplete?: () => void;
}

// API propuesta
chart.animateTo({
  xRange: [0, 100],
  yRange: [-5, 5],
  duration: 300,
  easing: 'easeOut'
});

// En ChartOptions
{
  animations: {
    enabled: true,
    zoom: { duration: 200 },
    pan: { duration: 100 },
    dataUpdate: { duration: 150 }
  }
}
```

---

### 2. 📊 Soporte Multi-Eje Avanzado (Y1, Y2, Y3...)

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐⭐⭐ (4/5) |
| **Impacto** | ALTO |
| **Beneficio** | Esencial para dashboards científicos complejos |

**Descripción:**  
Permitir múltiples ejes Y con escalas independientes, colores diferenciados y vinculación automática de series.

**Mejora para usuarios:**  
- Visualizar corriente (µA) y potencial (V) en el mismo gráfico
- Temperatura + Humedad + Presión en un solo dashboard
- Científicos pueden correlacionar múltiples variables

**Implementación sugerida:**
```typescript
// API propuesta
const chart = createChart({
  container,
  xAxis: { label: 'Time (s)' },
  yAxis: [
    { id: 'current', position: 'left', label: 'I (µA)', color: '#00f2ff' },
    { id: 'voltage', position: 'right', label: 'E (V)', color: '#ff6b6b' },
    { id: 'temp', position: 'right', label: 'T (°C)', color: '#4ecdc4', offset: 60 }
  ]
});

chart.addSeries({
  id: 'current-data',
  yAxisId: 'current', // Vinculación explícita
  data: { x, y: currentData }
});
```

---

### 3. 📦 Sistema de Plugins Robusto

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐⭐⭐⭐ (5/5) |
| **Impacto** | ALTO |
| **Beneficio** | Ecosistema extensible, comunidad activa |

**Descripción:**  
Ampliar el sistema de plugins actual para permitir:
- Plugins de terceros
- Hot-reload de plugins
- Marketplace/registry de plugins
- Plugins de análisis (FFT, filtros, etc.)

**Mejora para usuarios:**  
- Extensibilidad sin modificar el core
- Comunidad puede contribuir funcionalidades
- Casos de uso especializados (electroquímica, biología, etc.)

**Implementación sugerida:**
```typescript
// Nuevo: src/plugins/PluginRegistry.ts
interface PluginManifest {
  name: string;
  version: string;
  hooks: ('init' | 'beforeRender' | 'afterRender' | 'destroy')[];
  provides?: string[]; // 'fft-analysis', 'kalman-filter', etc.
}

// Plugins oficiales propuestos:
// - scichart-engine/plugins/analysis (FFT, Kalman, Regression)
// - scichart-engine/plugins/electrochemistry (CV, DPV, SWV specific)
```

---

### 4. 🎯 Hit-Testing y Selección de Puntos Mejorada

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐⭐ (3/5) |
| **Impacto** | ALTO |
| **Beneficio** | Interactividad profesional |

**Descripción:**  
Mejorar la detección de clics/hover en puntos de datos con:
- Selección múltiple (Ctrl+click, box selection)
- Callbacks detallados con índice, serie y datos
- Highlight visual de puntos seleccionados
- Arrastrar puntos (edición interactiva)

**Mejora para usuarios:**  
- Seleccionar picos para análisis
- Marcar regiones de interés
- Editar datos directamente en el gráfico
- Exportar solo puntos seleccionados

**Implementación sugerida:**
```typescript
// Nuevos eventos
chart.on('pointSelect', (e: PointSelectEvent) => {
  console.log(e.points); // Array de puntos seleccionados
  console.log(e.mode); // 'single' | 'add' | 'remove'
});

chart.on('regionSelect', (e: RegionSelectEvent) => {
  console.log(e.bounds); // { xMin, xMax, yMin, yMax }
  console.log(e.containedPoints);
});

// API de selección
chart.selectPoints([{ seriesId: 'data', indices: [10, 11, 12] }]);
chart.getSelectedPoints();
chart.clearSelection();
```

---

### 5. 📱 Responsive Design Automático

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐⭐ (3/5) |
| **Impacto** | ALTO |
| **Beneficio** | Mejor experiencia móvil/tablet |

**Descripción:**  
Sistema inteligente que adapta automáticamente:
- Tamaño de fuentes y etiquetas
- Densidad de ticks en ejes
- Tamaño de puntos/líneas
- Layout de leyenda
- Controles táctiles vs mouse

**Mejora para usuarios:**  
- Gráficos perfectos en cualquier dispositivo
- Sin necesidad de código condicional
- PWA-ready para aplicaciones científicas móviles

**Implementación sugerida:**
```typescript
// ChartOptions
{
  responsive: {
    enabled: true,
    breakpoints: {
      mobile: { maxWidth: 480, fontSize: 10, tickCount: 5 },
      tablet: { maxWidth: 768, fontSize: 12, tickCount: 7 },
      desktop: { fontSize: 14, tickCount: 10 }
    },
    touchOptimized: true, // Aumentar áreas de toque
    reducedMotion: 'auto' // Detectar preferencias del sistema
  }
}
```

---

### 6. 💾 Serialización y Estado Persistente

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐⭐ (3/5) |
| **Impacto** | ALTO |
| **Beneficio** | Guardar/cargar configuraciones, compartir |

**Descripción:**  
Permitir exportar/importar el estado completo del chart:
- Configuración de ejes
- Series y sus estilos
- Zoom/pan actual
- Anotaciones
- Tema activo

**Mejora para usuarios:**  
- Guardar configuraciones favoritas
- Compartir gráficos vía URL
- Undo/Redo de cambios
- Reproducibilidad científica

**Implementación sugerida:**
```typescript
// API propuesta
const state = chart.serialize(); // { version, axes, series, annotations, view }
localStorage.setItem('chart-config', JSON.stringify(state));

// Restaurar
const saved = JSON.parse(localStorage.getItem('chart-config'));
chart.deserialize(saved);

// URL sharing
const hash = chart.toUrlHash(); // Base64 comprimido
window.location.hash = hash;
```

---

### 7. 🔬 Análisis Científico Avanzado (FFT, Filtros)

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐⭐⭐ (4/5) |
| **Impacto** | ALTO |
| **Beneficio** | Diferenciador clave para científicos |

**Descripción:**  
Expandir el módulo `analysis/` con:
- FFT (Fast Fourier Transform)
- Filtros digitales (paso bajo, paso alto, Butterworth)
- Detección de anomalías
- Correlación cruzada
- Integración numérica (Simpson, trapezoidal)

**Mejora para usuarios:**  
- Análisis espectral sin salir de la app
- Filtrado de ruido en tiempo real
- Detección automática de eventos
- Todo procesado en GPU para máximo rendimiento

**Implementación sugerida:**
```typescript
// Nuevo: src/analysis/fft.ts
export function fft(data: Float32Array): { frequency: Float32Array, magnitude: Float32Array };
export function ifft(spectrum: ComplexArray): Float32Array;

// Nuevo: src/analysis/filters.ts
export function lowPassFilter(data: Float32Array, cutoffHz: number, sampleRate: number): Float32Array;
export function highPassFilter(data: Float32Array, cutoffHz: number, sampleRate: number): Float32Array;
export function butterworth(data: Float32Array, order: number, cutoff: number): Float32Array;

// GPU Compute version (WebGPU)
import { GpuCompute } from 'scichart-engine';
const gpu = new GpuCompute();
const spectrum = await gpu.fft(largeDataset); // 10M puntos en <100ms
```

---

## Mejoras de Mediano Impacto

Estas mejoras añaden valor significativo pero tienen un alcance más específico.

---

### 8. 📐 Anotaciones Interactivas Avanzadas

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐⭐ (3/5) |
| **Impacto** | MEDIO |
| **Beneficio** | Mejor análisis visual |

**Descripción:**  
Mejorar el sistema de anotaciones con:
- Arrastre y redimensionamiento
- Anotaciones sobre puntos específicos
- Flechas con cabezas personalizables
- Áreas sombreadas con gradiente
- Anotaciones vinculadas a datos (se mueven con zoom)

**Mejora para usuarios:**  
- Marcar regiones de interés permanentemente
- Presentaciones científicas más claras
- Anotaciones que sobreviven actualizaciones de datos

**Implementación sugerida:**
```typescript
chart.addAnnotation({
  type: 'callout',
  dataPoint: { seriesId: 'main', index: 42 }, // Vinculada a punto
  label: 'Pico de oxidación',
  style: {
    backgroundColor: 'rgba(255,107,107,0.2)',
    borderColor: '#ff6b6b',
    arrowDirection: 'auto'
  },
  draggable: true,
  onDragEnd: (newPosition) => console.log(newPosition)
});
```

---

### 9. 🎨 Editor de Temas Visual

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐⭐ (3/5) |
| **Impacto** | MEDIO |
| **Beneficio** | Personalización sin código |

**Descripción:**  
Componente React/Vue para editar temas visualmente:
- Color pickers para cada elemento
- Preview en tiempo real
- Exportar tema como JSON
- Galería de temas de la comunidad

**Mejora para usuarios:**  
- Diseñadores pueden crear temas sin código
- Branding corporativo fácil
- Modo oscuro/claro con un click

**Implementación sugerida:**
```tsx
// Nuevo componente: src/react/ThemeEditor.tsx
import { ThemeEditor } from 'scichart-engine/react';

<ThemeEditor
  baseTheme="dark"
  onChange={(theme) => chart.setTheme(theme)}
  onExport={(themeJson) => downloadFile(themeJson)}
/>
```

---

### 10. 📈 Indicadores Técnicos (Trading/Finance)

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐⭐ (3/5) |
| **Impacto** | MEDIO |
| **Beneficio** | Nuevo segmento de usuarios |

**Descripción:**  
Añadir indicadores financieros populares:
- RSI, MACD, Bollinger Bands
- Medias móviles (SMA, EMA, WMA)
- Volumen, VWAP
- Líneas de tendencia automáticas

**Mejora para usuarios:**  
- Aplicaciones de trading
- Análisis técnico sin dependencias externas
- Científicos financieros

**Implementación sugerida:**
```typescript
// Nuevo: src/analysis/indicators.ts
export function sma(data: Float32Array, period: number): Float32Array;
export function ema(data: Float32Array, period: number): Float32Array;
export function rsi(close: Float32Array, period: number): Float32Array;
export function bollingerBands(data: Float32Array, period: number, stdDev: number): { upper, middle, lower };

// Uso
import { indicators } from 'scichart-engine';
const ema20 = indicators.ema(closeData, 20);
```

---

### 11. 🖨️ Exportación Avanzada (SVG vectorial)

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐⭐ (3/5) |
| **Impacto** | MEDIO |
| **Beneficio** | Publicaciones científicas |

**Descripción:**  
Exportar gráficos en formatos vectoriales para publicaciones:
- SVG con capas editables
- PNG/JPEG escalables
- Formato CSV/JSON para datos

**Mejora para usuarios:**  
- Gráficos listos para journals científicos
- Edición posterior en Illustrator/Inkscape
- Reproducibilidad en publicaciones

**Implementación actual:**
```typescript
// API implementada
import { exportToSVG } from 'scichart-engine';

const svgString = exportToSVG(chart);

// También disponible:
const csvData = chart.exportCSV();
const jsonData = chart.exportJSON();
const imageData = chart.exportImage('png');
```

---

### 12. 🔗 Sincronización de Charts (Linked Charts)

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐⭐ (3/5) |
| **Impacto** | MEDIO |
| **Beneficio** | Dashboards científicos |

**Descripción:**  
Sincronizar múltiples charts:
- Zoom/pan sincronizado
- Cursor crosshair compartido
- Selección de puntos compartida

**Mejora para usuarios:**  
- Comparar experimentos lado a lado
- Dashboards de monitoreo
- Análisis correlacional visual

**Implementación sugerida:**
```typescript
// API propuesta
import { ChartGroup } from 'scichart-engine';

const group = new ChartGroup();
group.add(chart1, chart2, chart3);
group.syncAxis('x'); // Solo X, o 'xy' para ambos
group.syncCursor(true);
group.syncSelection(true);
```

---

### 13. ⚡ Streaming con Backpressure

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐⭐ (3/5) |
| **Impacto** | MEDIO |
| **Beneficio** | Robustez en tiempo real |

**Descripción:**  
Mejorar el módulo `streaming/` con:
- Backpressure handling
- Buffer circular con límites configurables
- Métricas de rendimiento (latencia, throughput)
- Reconexión automática con exponential backoff

**Mejora para usuarios:**  
- Streams estables en conexiones lentas
- Sin pérdida de datos bajo carga
- Monitoring de salud del stream

**Implementación sugerida:**
```typescript
const stream = createWebSocketStream({
  url: 'wss://sensor.local/data',
  backpressure: {
    maxBuffer: 10000,
    strategy: 'drop-oldest', // o 'pause', 'sample'
    onPressure: (stats) => console.warn('Buffer at', stats.fillLevel)
  },
  reconnect: {
    enabled: true,
    maxAttempts: 10,
    backoff: 'exponential'
  }
});
```

---

### 14. 🧪 Testing Utilities para Usuarios

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐ (2/5) |
| **Impacto** | MEDIO |
| **Beneficio** | DX para equipos de desarrollo |

**Descripción:**  
Proveer utilidades de testing:
- Mock data generators
- Chart test harness
- Snapshot testing helpers
- Performance benchmarks

**Mejora para usuarios:**  
- Tests más fáciles de escribir
- CI/CD pipelines robustos
- Detección de regresiones visuales

**Implementación sugerida:**
```typescript
// Nuevo: scichart-engine/testing
import { createMockChart, generateSineWave, benchmarkRender } from 'scichart-engine/testing';

// En tests
const chart = createMockChart({ width: 800, height: 600 });
chart.addSeries({ id: 'test', type: 'line', data: generateSineWave(1000) });
expect(chart.getSeriesCount()).toBe(1);

// Performance test
const results = await benchmarkRender(chart, { duration: 5000 });
expect(results.avgFps).toBeGreaterThan(55);
```

---

## Mejoras de Bajo Impacto

Mejoras pequeñas pero valiosas para casos de uso específicos.

---

### 15. 📋 Copiar/Pegar Datos al Portapapeles

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐ (1/5) |
| **Impacto** | BAJO |
| **Beneficio** | Productividad |

**Descripción:**  
Ctrl+C en puntos seleccionados copia datos a portapapeles en formato CSV/TSV.

**Implementación:**
```typescript
chart.enableClipboard({
  format: 'tsv', // Para pegar en Excel
  includeHeaders: true
});
```

---

### 16. 🔍 Modo Debug Visual

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐ (2/5) |
| **Impacto** | BAJO |
| **Beneficio** | Debugging |

**Descripción:**  
Overlay visual que muestra:
- FPS actual
- Número de puntos renderizados
- Bounds de ejes
- Memoria GPU usada

**Implementación:**
```typescript
chart.setDebug(true); // Muestra overlay transparente
```

---

### 17. 🌐 Internacionalización (i18n)

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐ (2/5) |
| **Impacto** | BAJO |
| **Beneficio** | Audiencia global |

**Descripción:**  
Soporte para locale en:
- Separadores de miles/decimales
- Formatos de fecha
- Textos de UI (tooltips, controles)

**Implementación:**
```typescript
createChart({
  container,
  locale: 'es-ES', // Usa coma como decimal
  dateFormat: 'DD/MM/YYYY'
});
```

---

### 18. 🎹 Atajos de Teclado Personalizables

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐ (2/5) |
| **Impacto** | BAJO |
| **Beneficio** | Power users |

**Descripción:**  
Mapeo configurable de teclas:
- R: Reset zoom
- H: Home (auto-scale)
- A: Add annotation mode
- Flechas: Pan

**Implementación:**
```typescript
chart.setKeyBindings({
  'r': 'resetZoom',
  'h': 'autoScale',
  'Escape': 'clearSelection',
  'Delete': 'deleteSelected'
});
```

---

### 19. 📊 Indicador de Carga Progresiva

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐ (1/5) |
| **Impacto** | BAJO |
| **Beneficio** | UX con datasets grandes |

**Descripción:**  
Barra de progreso al cargar datasets grandes (>100K puntos).

**Implementación:**
```typescript
chart.on('dataLoading', (e) => {
  showSpinner(e.progress); // 0-100
});
```

---

### 20. 🔒 Modo Solo Lectura

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐ (1/5) |
| **Impacto** | BAJO |
| **Beneficio** | Embeds y reportes |

**Descripción:**  
Deshabilitar todas las interacciones para presentaciones o embeds.

**Implementación:**
```typescript
createChart({
  container,
  readOnly: true // Sin zoom, pan, tooltips
});
```

---

## Matriz de Priorización

| # | Mejora | Impacto | Complejidad | Estado |
|---|--------|---------|-------------|--------|
| 1 | Animaciones y Transiciones | 🔴 Alto | 4/5 | ✅ **Done** |
| 2 | Multi-Eje Avanzado | 🔴 Alto | 4/5 | ✅ **Done** |
| 3 | Sistema de Plugins | 🔴 Alto | 5/5 | ✅ **Done** |
| 4 | Hit-Testing Mejorado | 🔴 Alto | 3/5 | ✅ **Done** |
| 5 | Responsive Design | 🔴 Alto | 3/5 | ✅ **Done** |
| 6 | Serialización | 🔴 Alto | 3/5 | ✅ **Done** |
| 7 | Análisis FFT/Filtros | 🔴 Alto | 4/5 | ✅ **Done** |
| 8 | Anotaciones Avanzadas | 🟡 Medio | 3/5 | ✅ **Done** |
| 9 | Editor de Temas | 🟡 Medio | 3/5 | ✅ **Done** |
| 10 | Indicadores Financieros | 🟡 Medio | 3/5 | ✅ **Done** |
| 11 | Exportación SVG | 🟡 Medio | 3/5 | ✅ **Done** |
| 12 | Sincronización Charts | 🟡 Medio | 3/5 | ✅ **Done** |
| 13 | Streaming Backpressure | 🟡 Medio | 3/5 | ✅ **Done** |
| 14 | Testing Utilities | 🟡 Medio | 2/5 | ✅ **Done** |
| 15 | Copiar al Portapapeles | 🟢 Bajo | 1/5 | ✅ **Done** |
| 16 | Modo Debug | 🟢 Bajo | 2/5 | ✅ **Done** |
| 17 | Internacionalización | 🟢 Bajo | 2/5 | ✅ **Done** |
| 18 | Atajos de Teclado | 🟢 Bajo | 2/5 | ✅ **Done** |
| 19 | Indicador de Carga | 🟢 Bajo | 1/5 | ✅ **Done** |
| 20 | Modo Solo Lectura | 🟢 Bajo | 1/5 | ✅ **Done** |

---

## Recomendación de Roadmap

### Q1 2026 (Completed)
- ✅ Mejora #5: Responsive Design (3/5)
- ✅ Mejora #4: Hit-Testing Mejorado (3/5)
- ✅ Mejora #1: Animaciones (4/5)
- ✅ Mejora #19, #20: Quick wins de bajo impacto (1/5)

### Q2 2026 (Completed)
- ✅ Mejora #2: Multi-Eje Avanzado (4/5)
- ✅ Mejora #6: Serialización (3/5)
- ✅ Mejora #15, #16: Quick wins de bajo impacto (1-2/5)

### Q3 2026 (Completed)
- ✅ Mejora #8: Anotaciones Avanzadas (3/5)
- ✅ Mejora #14: Testing Utilities (2/5)
- ✅ Mejora #7: Análisis FFT/Filtros (4/5)

### Q4 2026 (Completed)
- ✅ Mejora #11: Exportación SVG (3/5)
- ✅ Mejora #14: Testing Utilities (2/5)
- ✅ Mejora #15: Copiar al Portapapeles (1/5)
- ✅ Mejora #16: Modo Debug (2/5)
- ✅ Mejora #17: Internacionalización (2/5)
- ✅ Mejora #18: Atajos de Teclado (2/5)
- ✅ Mejora #19: Indicador de Carga (1/5)
- ✅ Mejora #20: Modo Solo Lectura (1/5)

### Q1 2027 (Completed)
- ✅ Mejora #12: Sincronización Charts (3/5)
- ✅ Mejora #9: Editor de Temas (3/5)
- ✅ Mejora #10: Indicadores Financieros (3/5)
- ✅ Mejora #13: Streaming Backpressure (3/5)

### Q2 2027 (Pending)
- 🏗️ Mejora #3: Sistema de Plugins (5/5)

---

*Documento generado automáticamente. Última actualización: 2026-01-08*

---

## Próximas Mejoras - Análisis Científico Avanzado

Las siguientes mejoras están planificadas para futuras versiones, enfocadas en características clave para análisis científico profesional:

---

### 21. 🔬 Filtro Savitzky-Golay (Suavizado Inteligente)

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐⭐ (3/5) |
| **Impacto** | ALTO |
| **Beneficio** | Preserva forma de picos mientras elimina ruido |

**Descripción:**  
El ruido es el enemigo #1 en señales científicas. El suavizado simple (Media Móvil) destruye la altura de los picos, lo cual es fatal para análisis cuantitativo.

**Killer Feature:**  
El filtro Savitzky-Golay ajusta un polinomio local a una ventana de puntos en lugar de promediar. Elimina ruido preservando la forma, ancho y altura de los picos.

**Casos de uso:**
- Espectroscopía (IR, UV-Vis, Raman)
- Cromatografía (HPLC, GC)
- Señales electroquímicas ruidosas

**Implementación sugerida:**
```typescript
// src/analysis/smoothing.ts
export function savitzkyGolay(
  data: Float32Array,
  windowSize: number,
  polynomialOrder: number
): Float32Array;

// Uso
const smoothed = savitzkyGolay(rawSignal, 11, 3); // Ventana 11 puntos, polinomio orden 3
```

---

### 22. 📉 Corrección de Línea Base (Baseline Correction)

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐⭐⭐ (4/5) |
| **Impacto** | ALTO |
| **Beneficio** | Picos limpios sobre cero para integración precisa |

**Descripción:**  
En electroquímica y cromatografía, la señal casi siempre tiene "drift" (inclinación) u "offset" debido a capacitancia o cambios de temperatura.

**Métodos:**
- **Simple:** Resta lineal entre punto inicial y final
- **Pro:** Asymmetric Least Squares (ALS) - Algoritmo iterativo que encuentra la línea base automáticamente

**Implementación sugerida:**
```typescript
// src/analysis/baseline.ts
export function subtractBaseline(
  data: Float32Array,
  method: 'linear' | 'polynomial' | 'als'
): { corrected: Float32Array; baseline: Float32Array };

export function alsBaseline(
  data: Float32Array,
  lambda?: number,    // Smoothness (default: 1e6)
  p?: number,         // Asymmetry (default: 0.01)
  iterations?: number // Max iterations (default: 10)
): Float32Array;
```

---

### 23. 🎯 Peak Picking Avanzado (Detección de Picos)

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐⭐ (3/5) |
| **Impacto** | ALTO |
| **Beneficio** | Tabla automática de picos sin intervención manual |

**Descripción:**  
El usuario no quiere buscar picos con el mouse; quiere una tabla con los picos detectados automáticamente.

**No es solo max():** Necesita algoritmo que detecte picos basados en:
- **Prominencia:** Altura respecto a valles vecinos (ignora ruido)
- **FWHM:** Ancho a media altura (filtra ruido eléctrico o drift)
- **Umbral:** Mínima señal para considerarse pico

**Implementación sugerida:**
```typescript
// src/analysis/peaks.ts (extensión)
export interface PeakResult {
  index: number;
  x: number;
  y: number;
  prominence: number;
  fwhm: number;           // Full Width at Half Maximum
  leftBase: number;
  rightBase: number;
  area?: number;          // Si se integra
}

export function findPeaksAdvanced(
  x: Float32Array,
  y: Float32Array,
  options: {
    minProminence?: number;
    minWidth?: number;
    maxWidth?: number;
    threshold?: number;
    calculateArea?: boolean;
  }
): PeakResult[];
```

---

### 24. ∫ Integración Numérica (Área bajo la curva)

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐ (2/5) |
| **Impacto** | ALTO |
| **Beneficio** | Cálculo de carga total (Coulombs) o concentración |

**Descripción:**  
Para un electroquímico, el área bajo el pico representa la carga total (Q = ∫I dt) o concentración real, más importante que la altura.

**Funcionalidad:**
- Selección de ROI (Region of Interest)
- Integración con regla del trapecio o Simpson
- Resta automática de línea base antes de integrar

**Implementación sugerida:**
```typescript
// src/analysis/integration.ts
export function integrate(
  x: Float32Array,
  y: Float32Array,
  method?: 'trapezoid' | 'simpson'
): number;

export function integrateRange(
  x: Float32Array,
  y: Float32Array,
  xStart: number,
  xEnd: number,
  options?: {
    subtractBaseline?: boolean;
    baselineMethod?: 'linear' | 'als';
  }
): { area: number; baseline: Float32Array };
```

---

### 25. 📐 Derivadas (Primera y Segunda)

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐ (2/5) |
| **Impacto** | MEDIO |
| **Beneficio** | Detección de puntos de inflexión y cambios de pendiente |

**Descripción:**  
A veces el cambio de pendiente es más importante que el valor absoluto (ej. puntos de inflexión en titulación o voltamperometría cíclica).

**Aplicaciones:**
- **1ra derivada:** Transforma señal confusa en picos claros donde la pendiente cambia
- **2da derivada:** Encuentra puntos de inflexión exactos

**Implementación sugerida:**
```typescript
// src/analysis/derivatives.ts
export function derivative(
  x: Float32Array,
  y: Float32Array,
  order?: 1 | 2,
  smoothing?: number  // Aplicar Savitzky-Golay antes
): Float32Array;

// Uso
const dy = derivative(x, y, 1);      // Primera derivada
const d2y = derivative(x, y, 2, 5);  // Segunda derivada con suavizado
```

---

### 26. 📊 LTTB Downsampling Visual

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐⭐ (3/5) |
| **Impacto** | ALTO |
| **Beneficio** | Rendimiento extremo sin perder picos visuales |

**Descripción:**  
Vital para Web Performance. Si renderizas 1 millón de puntos, el navegador explota.

**Largest-Triangle-Three-Buckets (LTTB):**
- Algoritmo estándar de la industria
- Reduce 100,000 puntos a 1,000 visualmente idénticos
- **Diferencia con promediar:** LTTB mantiene extremos (picos y valles)

**Implementación sugerida:**
```typescript
// src/analysis/downsampling.ts
export function lttb(
  x: Float32Array,
  y: Float32Array,
  targetPoints: number
): { x: Float32Array; y: Float32Array };

// Auto-downsample basado en ancho de canvas
export function autoDownsample(
  x: Float32Array,
  y: Float32Array,
  canvasWidth: number,
  oversampleFactor?: number // Default: 2x
): { x: Float32Array; y: Float32Array };
```

---

### 27. 📏 Delta Tool (Herramienta de Cursores)

| Atributo | Valor |
|----------|-------|
| **Complejidad** | ⭐⭐⭐ (3/5) |
| **Impacto** | MEDIO |
| **Beneficio** | Medición manual de distancias y pendientes |

**Descripción:**  
Más allá de ver el valor (x, y), el científico necesita medir distancias entre puntos.

**Funcionalidad:**
- Click y arrastrar para medir ΔX, ΔY
- Calcular pendiente (m = ΔY/ΔX)
- Útil para constantes de tiempo, anchos de banda, etc.

**Implementación sugerida:**
```typescript
// src/core/tools/DeltaTool.ts
export interface DeltaMeasurement {
  x1: number; y1: number;
  x2: number; y2: number;
  deltaX: number;
  deltaY: number;
  slope: number;        // ΔY/ΔX
  distance: number;     // Euclidean distance
}

export class DeltaTool {
  enable(): void;
  disable(): void;
  getMeasurement(): DeltaMeasurement | null;
  onMeasure(callback: (m: DeltaMeasurement) => void): void;
}

// En Chart API
chart.enableDeltaTool();
chart.onDeltaMeasure((m) => {
  console.log(`ΔX: ${m.deltaX}, ΔY: ${m.deltaY}, Slope: ${m.slope}`);
});
```

---

## Matriz de Priorización - Funciones Matemáticas Avanzadas

| # | Mejora | Impacto | Complejidad | Estado | Ubicación API |
|---|--------|---------|-------------|--------|---------------|
| 21 | Savitzky-Golay | 🔴 Alto | 3/5 | ✅ **Done** | `analysis.savitzkyGolay()` |
| 22 | Corrección Línea Base | 🔴 Alto | 4/5 | ✅ **Done** | `analysis.subtractBaseline()` |
| 23 | Peak Picking Avanzado | 🔴 Alto | 3/5 | ✅ **Done** | `analysis.detectPeaks()` |
| 24 | Integración Numérica | 🔴 Alto | 2/5 | ✅ **Done** | `analysis.integrate()` |
| 25 | Derivadas | 🟡 Medio | 2/5 | ✅ **Done** | `analysis.derivative()` |
| 26 | LTTB Downsampling | 🔴 Alto | 3/5 | ✅ **Done** | `analysis.downsampleLTTB()` |
| 27 | Delta Tool | 🟡 Medio | 3/5 | ✅ **Done** | `DeltaTool` class |

---

## Funciones Matemáticas Avanzadas - Resumen de Implementación

Todas las funciones de análisis científico están disponibles bajo `chart.analysis.*` o importables directamente:

```typescript
import { 
  savitzkyGolay,      // Smoothing preserving peaks
  subtractBaseline,   // Linear baseline correction
  detectPeaks,        // Peak detection with prominence
  integrate,          // Trapezoidal integration
  derivative,         // Numerical derivatives
  downsampleLTTB,     // Visual downsampling
  fft, ifft,          // Fourier Transform
  lowPassFilter,      // FIR filters
  highPassFilter,
  butterworth,        // IIR Butterworth filter
  crossCorrelation,   // Signal correlation
  anomalyDetection,   // Z-score anomaly detection
  // Technical indicators
  sma, ema, macd, rsi, bollingerBands, atr, vwap
} from 'scichart-engine/analysis';
```

### Uso con el Chart API

```typescript
const chart = createChart({ container });

// Access analysis directly from chart instance
const smoothed = chart.analysis.savitzkyGolay(data, 11, 3);
const peaks = chart.analysis.detectPeaks(x, y, { minProminence: 0.1 });
const area = chart.analysis.integrate(x, y);
```

---

## Demo Interactivo

Ver la demostración interactiva de funciones matemáticas avanzadas en:
**`/examples/analysis-advanced`**

La demo incluye botones dinámicos para:
- 📈 Aplicar/remover Savitzky-Golay
- 📉 Corrección de línea base
- 🎯 Detección automática de picos
- ∫ Calcular área bajo la curva
- 📐 Calcular derivadas
- 🔍 LTTB downsampling visual
- 📏 Herramienta Delta Tool

---

## Notas de Desarrollo

### ✅ Completado
- Todas las funciones matemáticas avanzadas (#21-#27)
- **Mejora del diseño responsivo**: Reducción de fuente por breakpoint, aumento de grosor de ejes y nueva resolución `smallMobile` (≤360px).
- Indicadores de carga con LoadingIndicator
- Sistema de Plugins Robusto con hooks completos, contexto, registro global y plugins built-in
- Delta Tool para mediciones interactivas
- Exportación SVG vectorial
- Sistema de eventos dataLoading y deltaMeasure

### 🏗️ En Progreso  
- (Ninguno actualmente)

---