# Guía de Integración y Uso de Plugins

Esta guía explica cómo utilizar la nueva arquitectura modular de SciChart Engine y cómo se integran los plugins con el núcleo de la librería.

## 1. Conceptos Fundamentales

El núcleo de SciChart (`scichart-engine`) ahora solo pesa **~48KB** porque las funcionalidades pesadas se han movido a plugins. Para utilizar estas funcionalidades, debes "conectar" los plugins que necesites.

### El Método `chart.use()`

Es la puerta de entrada para cualquier plugin. Registra el plugin, resuelve dependencias e inicializa su ciclo de vida.

```typescript
import { createChart } from 'scichart-engine';
import { Plugin3D } from 'scichart-engine/plugins/3d';

const chart = createChart({ container });
await chart.use(Plugin3D()); // Ahora el gráfico soporta 3D
```

---

## 2. Ejemplos Demostrativos

### Ejemplo A: Análisis en Tiempo Real e Internacionalización

Este ejemplo muestra cómo combinar el procesamiento de datos con el soporte de idiomas.

```typescript
import { createChart } from 'scichart-engine';
import { PluginAnalysis } from 'scichart-engine/plugins/analysis';
import { PluginI18n } from 'scichart-engine/plugins/i18n';

const chart = createChart({ container });

// Configurar idioma español
await chart.use(PluginI18n({ locale: 'es-ES' }));

// Activar herramientas de análisis
await chart.use(PluginAnalysis());

// Al usar el API de análisis:
const stats = chart.analysis.calculateStatistics(myData);
console.log(`Media: ${stats.mean}`); // El formateo sigue el locale configurado
```

### Ejemplo B: Streaming y Monitorización de Rendimiento

Ideal para aplicaciones de telemetría de alta frecuencia.

```typescript
import { createChart } from 'scichart-engine';
import { PluginStreaming } from 'scichart-engine/plugins/streaming';
import { PluginDebug } from 'scichart-engine/plugins/debug';

const chart = createChart({ container });

// Ver FPS y estadísticas de memoria en tiempo real
await chart.use(PluginDebug({ showFPS: true }));

// Gestionar flujo de datos de 100ksps con Backpressure
await chart.use(PluginStreaming({
    backpressure: {
        maxPointsPerSecond: 50000,
        strategy: 'drop-old'
    }
}));
```

### Ejemplo C: Anotaciones y Herramientas Avanzadas

Muestra cómo habilitar herramientas de medición interactivas.

```typescript
import { createChart } from 'scichart-engine';
import { PluginAnnotations } from 'scichart-engine/plugins/annotations';
import { PluginTools } from 'scichart-engine/plugins/tools';

const chart = createChart({ container });

// Activar sistema de anotaciones
await chart.use(PluginAnnotations());

// Activar herramientas Delta (medición) y Peak (integración)
await chart.use(PluginTools());

// Cambiar a modo medición
chart.setMode('delta'); 
```

---

## 3. Integración con el Core (Bajo el Capó)

Los plugins no son solo "añadidos", interactúan profundamente con el objeto `Chart` a través del **PluginContext**:

1.  **Hooks de Renderizado**: Los plugins pueden dibujar antes (`onBeforeRender`) o después (`onAfterRender`) de que el core dibuje las series.
2.  **Hooks de Interacción**: Los plugins reciben todos los eventos de ratón/toque (`onInteraction`) permitiendo crear herramientas personalizadas.
3.  **Hooks de Datos**: Cuando el core recibe nuevos datos (`onDataUpdate`), los plugins (como el de Análisis) pueden procesarlos automáticamente.
4.  **UI Compartida**: Los plugins tienen acceso a `ctx.ui` para añadir elementos al DOM del gráfico sin interferir con el lienzo.

---

## 4. Ventajas de este Modelo

*   **Carga Selectiva**: Si tu aplicación no usa 3D, no descargas los 150KB de código 3D.
*   **Extensibilidad**: Puedes crear tus propios plugins siguiendo la interfaz `ChartPlugin`.
*   **Mantenimiento**: El core es más simple y robusto, enfocado solo en el rendimiento del renderizado.
