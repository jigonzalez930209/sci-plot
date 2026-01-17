# SciChart Engine - Registro de Cambios v1.9.x

## 📌 Sesión Actual: 2026-01-16

### ✅ Cambios Completados Hoy

#### 1. **Fix ROI Plugin Rendering** (Crítico)
- **Problema**: Plugin ROI no renderizaba correctamente debido a uso incorrecto de `getOverlayContext()` 
- **Solución**: Cambiado a `pluginCtx.render.ctx2d` para acceder al contexto 2D del overlay
- **Archivos modificados**:
  - `src/plugins/roi/index.ts`: Corregido `onRenderOverlay`
  - `src/core/series/Series.ts`: Agregado método `getId()` público y `invalidateBuffers()`
  - `src/core/chart/types.ts`: Agregada propiedad `events` a la interfaz `Chart`
- **Impacto**: ROI tools (polygon, circle, lasso, rectangle) ahora funcionan correctamente

#### 2. **Fix DragEdit Plugin Interaction** (Crítico)
- **Problema**: Plugin DragEdit bloqueaba interacciones del chart después de seleccionar un punto
- **Solución**: Refactorizado para usar `onInteraction` en lugar de event listeners directos
- **Cambios clave**:
  - Removidos `addEventListener` directos del canvas
  - Implementado `onInteraction` hook con soporte correcto para `preventDefault()`
  - Agregado `invalidateBuffers()` para actualizar visualización
  - Removidas funciones `onMouseDown`, `onMouseMove`, `onMouseUp` obsoletas
- **Archivos modificados**:
  - `src/plugins/drag-edit/index.ts`: Refactorización completa del sistema de eventos
  - `src/core/series/Series.ts`: Agregado `invalidateBuffers()` para marcar buffers como que necesitan actualización
- **Comportamiento actual**:
  - Durante drag: Muestra línea discontinua de preview
  - Al soltar: Actualiza la serie con nueva posición del punto
  - No bloquea otras interacciones del chart

#### 3. **Plugin System Unification & Fixes** (Crítico)
- **Problema**: Algunos plugins intentaban asignar APIs a propiedades de `ChartImpl` que ahora son getters de solo lectura, causando errores de inicialización.
- **Solución**: 
  - Centralizados getters en `ChartCore.ts` para todos los plugins principales (`dataExport`, `snapshot`, `roi`, `videoRecorder`, etc.).
  - Removidas asignaciones directas en `onInit` de los plugins.
  - Agregado método `getPluginNames()` para facilitar la depuración.
- **Archivos modificados**:
  - `src/core/chart/ChartCore.ts`, `src/core/chart/types.ts`
  - `src/plugins/snapshot/index.ts`, `src/plugins/data-export/index.ts`, `src/plugins/video-recorder/index.ts`, `src/plugins/roi/index.ts`

#### 4. **Demos & UX Improvements**
- **Cambios**:
  - Agregado auto-scaling automático en `VideoRecorderDemo.vue` y `DataExportDemo.vue`.
  - Mejorado reporte de errores en demos.
- **Archivos modificados**:
  - `docs/.vitepress/theme/demos/*.vue`

#### 5. **Release v1.9.0 Finalization**
- **Changelog**: Completado el historial desde la v1.5.1 hasta la v1.9.0 basado en los logs de Git (Sankey, Gauges, Polar, LaTeX, etc.).
- **Build Verification**: Ejecutado `pnpm build` con éxito, verificando que los cambios en tipos e interfaces no afectan la compilación.
- **Documentación**: Actualizadas todas las referencias a plugins para usar el nuevo patrón de acceso directo (`chart.roi`, `chart.dataExport`).
- **NPM Package**: Actualizado el campo `exports` en `package.json` para incluir los 15+ nuevos plugins (ROI, Virtualization, Offscreen, Snapshot, etc.).

---

## 🚀 Plan de Trabajo: Completar v1.9.x -> COMPLETO 🎉

### Features Pendientes (0/10 restantes):

#### 1. PluginOffscreen ⚡
**Estado**: ✅ COMPLETO
**Prioridad**: Alta ⭐⭐
**Funcionalidad**: Worker pool management, OffscreenCanvas support (infra), ImageBitmap transfers.

#### 2. PluginVirtualization 📊
**Estado**: ✅ COMPLETO
**Prioridad**: Alta ⭐⭐
**Funcionalidad**: LOD (Level of Detail), LTTB downsampling, Min-Max downsampling, 1M+ points support.
**Demo**: `VirtualizationDemo.vue` creada.

#### 3. ROI Enmascaramiento 🎯
**Estado**: ✅ COMPLETO
**Prioridad**: Alta ⭐⭐
**Funcionalidad**: Masking de datos basado en selecciones ROI, ocultamiento dinámico de puntos fuera de zona.
**Demo**: `RoiDemo.vue` actualizada con toggle de masking.

#### 4. Broken Axes (Ejes Rotos) 📏
**Estado**: ✅ COMPLETO (v1.0.1)
**Prioridad**: Media ⭐
**Funcionalidad**: Transformación de coordenadas en gaps, símbolos zigzag/diagonal.
**Demo**: `BrokenAxisDemo.vue` creada y funcional.

---

## 📊 Progreso General v1.9.x

**Total Features**: 10
**Completados**: 10 (100%)
**En Progreso**: 0
**Pendientes**: 0

**¡FASE 1.9.x COMPLETADA!** 🎉

---

## 📅 Próximo Hito: v1.10.x (Q4 2026) - Nueva Generación

Se ha decidido integrar las tareas originalmente planificadas para la v2.0.x en la nueva versión **1.10.x** para mantener la continuidad del ciclo 1.x.

### Features en el Radar (v1.10.x):
1. **PluginCollaboration**: Edición multiusuario.
2. **Bindings para Python**: Soporte para Jupyter Notebooks.
3. **Bridge WASM**: Comunicación zero-copy para integración con STM32.
4. **Gauge & Sankey Charts**: Visualizaciones de flujo y métricas.
5. **PluginForecasting**: Análisis predictivo integrado.

---

## 🔧 Mejoras Técnicas Realizadas (Sesión Final)
- ✅ Implementado **WorkerPool** para renderizado asíncrono.
- ✅ Implementado **Data Masking** dinámico en PluginROI.
- ✅ Creada suite de Demos para validación de performance y UX.
- ✅ Corregidos todos los **Lint Errors** detectados durante la implementación.
- ✅ Registrados todos los componentes en el tema de VitePress.

---

*Última actualización: 2026-01-16 20:20*
*Versión del documento: 1.1 (FINAL PHASE 3)*


---

## 🔧 Mejoras Técnicas Realizadas

### Series Class
- ✅ Agregado método `getId()` público
- ✅ Agregado método `invalidateBuffers()` para invalidar caches

### Chart Types
- ✅ Agregada propiedad `events` a la interfaz `Chart`

### InteractionManager
- ✅ Respeto correcto de `preventDefault()` de plugins

### Plugin System
- ✅ Mejor integración de plugins con sistema de eventos
- ✅ Uso correcto de `onInteraction` hook

---

*Última actualización: 2026-01-16 20:02*
*Versión del documento: 1.0*
