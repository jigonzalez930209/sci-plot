/**
 * SciChart Engine - Theme Editor Module
 * 
 * Provides a visual theme editor for customizing chart appearance:
 * - Color pickers for all theme elements
 * - Live preview
 * - Theme export/import
 * - Preset theme gallery
 * 
 * @module theme-editor
 */

// Use a flexible internal type to avoid strict EditorTheme compatibility issues
// The editor works with partial theme configs that can be applied via createTheme()
export type EditorTheme = Record<string, unknown>;

// ============================================
// Types
// ============================================

export interface ThemeEditorOptions {
  /** Base theme to start from */
  baseTheme?: EditorTheme | string;
  /** Enable live preview (default: true) */
  livePreview?: boolean;
  /** Show advanced options (default: false) */
  showAdvanced?: boolean;
  /** Custom CSS class for the editor */
  className?: string;
  /** Callback when theme changes */
  onChange?: (theme: EditorTheme) => void;
  /** Callback when export is requested */
  onExport?: (theme: EditorTheme, json: string) => void;
}

export interface ThemePreset {
  /** Preset name */
  name: string;
  /** Description */
  description?: string;
  /** Theme configuration */
  theme: EditorTheme;
  /** Preview colors (for UI) */
  previewColors?: string[];
  /** Tags for filtering */
  tags?: string[];
}

export interface ColorGroup {
  /** Group label */
  label: string;
  /** Group description */
  description?: string;
  /** Color properties in this group */
  colors: ColorProperty[];
}

export interface ColorProperty {
  /** Property key path (e.g., 'background', 'axis.color') */
  key: string;
  /** Display label */
  label: string;
  /** Description/tooltip */
  description?: string;
  /** Current value */
  value: string;
  /** Default value */
  defaultValue?: string;
}

// ============================================
// Default Theme Structure
// ============================================

const THEME_COLOR_GROUPS: ColorGroup[] = [
  {
    label: "Background & Canvas",
    description: "Chart background and canvas colors",
    colors: [
      { key: "backgroundColor", label: "Background", value: "", description: "Main chart background" },
      { key: "plotAreaBackground", label: "Plot Area", value: "", description: "Data plotting area background" },
    ],
  },
  {
    label: "Axes",
    description: "Axis lines, ticks, and labels",
    colors: [
      { key: "axis.color", label: "Axis Lines", value: "", description: "Axis line color" },
      { key: "axis.labelColor", label: "Axis Labels", value: "", description: "Axis label text color" },
      { key: "axis.titleColor", label: "Axis Titles", value: "", description: "Axis title text color" },
    ],
  },
  {
    label: "Grid",
    description: "Grid lines and markers",
    colors: [
      { key: "grid.color", label: "Grid Lines", value: "", description: "Major grid line color" },
      { key: "grid.minorColor", label: "Minor Grid", value: "", description: "Minor grid line color" },
    ],
  },
  {
    label: "Series Palette",
    description: "Default colors for data series",
    colors: [
      { key: "seriesPalette.0", label: "Series 1", value: "", description: "First series color" },
      { key: "seriesPalette.1", label: "Series 2", value: "", description: "Second series color" },
      { key: "seriesPalette.2", label: "Series 3", value: "", description: "Third series color" },
      { key: "seriesPalette.3", label: "Series 4", value: "", description: "Fourth series color" },
      { key: "seriesPalette.4", label: "Series 5", value: "", description: "Fifth series color" },
      { key: "seriesPalette.5", label: "Series 6", value: "", description: "Sixth series color" },
    ],
  },
  {
    label: "Legend",
    description: "Legend styling",
    colors: [
      { key: "legend.backgroundColor", label: "Legend Background", value: "", description: "Legend panel background" },
      { key: "legend.textColor", label: "Legend Text", value: "", description: "Legend text color" },
      { key: "legend.borderColor", label: "Legend Border", value: "", description: "Legend border color" },
    ],
  },
  {
    label: "Cursor & Selection",
    description: "Interactive elements",
    colors: [
      { key: "cursor.color", label: "Crosshair", value: "", description: "Cursor crosshair color" },
      { key: "cursor.labelBackground", label: "Cursor Label BG", value: "", description: "Cursor label background" },
      { key: "selection.color", label: "Selection", value: "", description: "Selection highlight color" },
      { key: "selection.handleColor", label: "Selection Handles", value: "", description: "Selection handle color" },
    ],
  },
  {
    label: "Annotations",
    description: "Annotation default colors",
    colors: [
      { key: "annotation.lineColor", label: "Line Annotations", value: "", description: "Default line annotation color" },
      { key: "annotation.fillColor", label: "Fill Annotations", value: "", description: "Default fill annotation color" },
      { key: "annotation.textColor", label: "Text Annotations", value: "", description: "Default text annotation color" },
    ],
  },
];

// ============================================
// Theme Presets
// ============================================

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: "Dark",
    description: "Classic dark theme with cyan accents",
    previewColors: ["#1a1a2e", "#00f2ff", "#4ecdc4"],
    tags: ["dark", "default"],
    theme: {
      backgroundColor: "#1a1a2e",
      plotAreaBackground: "#16213e",
      axis: {
        color: "#4a5568",
        labelColor: "#a0aec0",
        titleColor: "#e2e8f0",
        labelFontSize: 11,
        titleFontSize: 13,
      },
      grid: {
        color: "rgba(74, 85, 104, 0.3)",
        opacity: 0.3,
      },
      legend: {
        background: "rgba(26, 26, 46, 0.9)",
        textColor: "#e2e8f0",
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      cursor: {
        color: "#00f2ff",
        labelBackground: "rgba(0, 242, 255, 0.9)",
        labelColor: "#000000",
      },
      seriesPalette: ["#00f2ff", "#4ecdc4", "#ff6b6b", "#ffd93d", "#6c5ce7", "#a29bfe", "#fd79a8", "#00cec9"],
      highlightColor: "#00f2ff",
    },
  },
  {
    name: "Light",
    description: "Clean light theme for publications",
    previewColors: ["#ffffff", "#2563eb", "#4f46e5"],
    tags: ["light", "publication"],
    theme: {
      backgroundColor: "#ffffff",
      plotAreaBackground: "#f8fafc",
      axis: {
        color: "#94a3b8",
        labelColor: "#475569",
        titleColor: "#1e293b",
        labelFontSize: 11,
        titleFontSize: 13,
      },
      grid: {
        color: "rgba(148, 163, 184, 0.3)",
        opacity: 0.3,
      },
      legend: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        textColor: "#1e293b",
        borderColor: "rgba(0, 0, 0, 0.1)",
      },
      cursor: {
        color: "#2563eb",
        labelBackground: "rgba(37, 99, 235, 0.95)",
        labelColor: "#ffffff",
      },
      seriesPalette: ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0891b2", "#4f46e5", "#be185d"],
      highlightColor: "#2563eb",
    },
  },
  {
    name: "Midnight",
    description: "Deep blue dark theme",
    previewColors: ["#0f172a", "#3b82f6", "#8b5cf6"],
    tags: ["dark", "blue"],
    theme: {
      backgroundColor: "#0f172a",
      plotAreaBackground: "#1e293b",
      axis: {
        color: "#475569",
        labelColor: "#94a3b8",
        titleColor: "#f1f5f9",
        labelFontSize: 11,
        titleFontSize: 13,
      },
      grid: {
        color: "rgba(71, 85, 105, 0.25)",
        opacity: 0.25,
      },
      legend: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        textColor: "#f1f5f9",
        borderColor: "rgba(255, 255, 255, 0.08)",
      },
      cursor: {
        color: "#3b82f6",
        labelBackground: "rgba(59, 130, 246, 0.95)",
        labelColor: "#ffffff",
      },
      seriesPalette: ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#6366f1", "#f43f5e"],
      highlightColor: "#3b82f6",
    },
  },
  {
    name: "Scientific",
    description: "Clean theme for scientific publications",
    previewColors: ["#fafafa", "#1f2937", "#059669"],
    tags: ["light", "scientific", "publication"],
    theme: {
      backgroundColor: "#fafafa",
      plotAreaBackground: "#ffffff",
      axis: {
        color: "#374151",
        labelColor: "#1f2937",
        titleColor: "#111827",
        labelFontSize: 12,
        titleFontSize: 14,
      },
      grid: {
        color: "rgba(156, 163, 175, 0.4)",
        opacity: 0.4,
      },
      legend: {
        backgroundColor: "#ffffff",
        textColor: "#111827",
        borderColor: "#e5e7eb",
      },
      cursor: {
        color: "#059669",
        labelBackground: "#059669",
        labelColor: "#ffffff",
      },
      seriesPalette: ["#1f2937", "#059669", "#dc2626", "#2563eb", "#7c3aed", "#ea580c", "#0891b2", "#be123c"],
      highlightColor: "#059669",
    },
  },
  {
    name: "Electrochemistry",
    description: "Theme optimized for electrochemical data",
    previewColors: ["#0d1117", "#00f2ff", "#ff6b6b"],
    tags: ["dark", "scientific", "electrochemistry"],
    theme: {
      backgroundColor: "#0d1117",
      plotAreaBackground: "#161b22",
      axis: {
        color: "#30363d",
        labelColor: "#8b949e",
        titleColor: "#c9d1d9",
        labelFontSize: 11,
        titleFontSize: 13,
      },
      grid: {
        color: "rgba(48, 54, 61, 0.5)",
        opacity: 0.5,
      },
      legend: {
        backgroundColor: "rgba(13, 17, 23, 0.95)",
        textColor: "#c9d1d9",
        borderColor: "rgba(48, 54, 61, 0.8)",
      },
      cursor: {
        color: "#00f2ff",
        labelBackground: "rgba(0, 242, 255, 0.95)",
        labelColor: "#000000",
      },
      seriesPalette: ["#00f2ff", "#ff6b6b", "#4ecdc4", "#feca57", "#a29bfe", "#fd79a8", "#00cec9", "#e17055"],
      highlightColor: "#00f2ff",
    },
  },
  {
    name: "High Contrast",
    description: "Maximum visibility theme",
    previewColors: ["#000000", "#ffffff", "#ffff00"],
    tags: ["dark", "accessibility", "high-contrast"],
    theme: {
      backgroundColor: "#000000",
      plotAreaBackground: "#0a0a0a",
      axis: {
        color: "#ffffff",
        labelColor: "#ffffff",
        titleColor: "#ffffff",
        labelFontSize: 12,
        titleFontSize: 14,
      },
      grid: {
        color: "rgba(255, 255, 255, 0.2)",
        opacity: 0.2,
      },
      legend: {
        backgroundColor: "#000000",
        textColor: "#ffffff",
        borderColor: "#ffffff",
      },
      cursor: {
        color: "#ffff00",
        labelBackground: "#ffff00",
        labelColor: "#000000",
      },
      seriesPalette: ["#ffff00", "#00ffff", "#ff00ff", "#00ff00", "#ff8800", "#00ff88", "#8800ff", "#ff0088"],
      highlightColor: "#ffff00",
    },
  },
];

// ============================================
// Theme Editor Class
// ============================================

export class ThemeEditor {
  private container: HTMLElement;
  private options: Required<ThemeEditorOptions>;
  private currentTheme: EditorTheme;
  private element: HTMLDivElement | null = null;

  constructor(container: HTMLElement, options?: ThemeEditorOptions) {
    this.container = container;
    this.options = {
      baseTheme: THEME_PRESETS[0].theme,
      livePreview: true,
      showAdvanced: false,
      className: 'scichart-theme-editor',
      onChange: undefined,
      onExport: undefined,
      ...options,
    } as Required<ThemeEditorOptions>;

    this.currentTheme = this.resolveTheme(this.options.baseTheme);
    this.render();
  }

  /**
   * Get current theme
   */
  getTheme(): EditorTheme {
    return { ...this.currentTheme };
  }

  /**
   * Set theme
   */
  setTheme(theme: EditorTheme | string): void {
    this.currentTheme = this.resolveTheme(theme);
    this.render();
    this.notifyChange();
  }

  /**
   * Update a specific theme property
   */
  updateProperty(key: string, value: string): void {
    this.setNestedValue(this.currentTheme, key, value);
    this.notifyChange();
  }

  /**
   * Export theme as JSON
   */
  exportTheme(): string {
    const json = JSON.stringify(this.currentTheme, null, 2);
    this.options.onExport?.(this.currentTheme, json);
    return json;
  }

  /**
   * Import theme from JSON
   */
  importTheme(json: string): void {
    try {
      const theme = JSON.parse(json) as EditorTheme;
      this.currentTheme = theme;
      this.render();
      this.notifyChange();
    } catch (e) {
      console.error('[ThemeEditor] Failed to import theme:', e);
    }
  }

  /**
   * Get theme preset by name
   */
  getPreset(name: string): ThemePreset | undefined {
    return THEME_PRESETS.find(p => p.name.toLowerCase() === name.toLowerCase());
  }

  /**
   * Apply a preset
   */
  applyPreset(name: string): void {
    const preset = this.getPreset(name);
    if (preset) {
      this.currentTheme = { ...preset.theme };
      this.render();
      this.notifyChange();
    }
  }

  /**
   * Get all available presets
   */
  getPresets(): ThemePreset[] {
    return THEME_PRESETS;
  }

  /**
   * Destroy the editor
   */
  destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }

  // ============================================
  // Private Methods
  // ============================================

  private resolveTheme(theme: EditorTheme | string): EditorTheme {
    if (typeof theme === 'string') {
      const preset = this.getPreset(theme);
      return preset ? { ...preset.theme } : { ...THEME_PRESETS[0].theme };
    }
    return { ...theme };
  }

  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }
    
    current[keys[keys.length - 1]] = value;
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const keys = path.split('.');
    let current: unknown = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[key];
    }
    
    return current;
  }

  private notifyChange(): void {
    if (this.options.livePreview) {
      this.options.onChange?.(this.currentTheme);
    }
  }

  private render(): void {
    // This creates an HTML structure that can be styled with CSS
    // In a real implementation, this would create interactive color pickers
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.className = this.options.className;
      this.container.appendChild(this.element);
    }

    this.element.innerHTML = this.generateHTML();
    this.attachEventListeners();
  }

  private generateHTML(): string {
    const presetButtons = THEME_PRESETS.map(preset => `
      <button class="preset-btn" data-preset="${preset.name}" title="${preset.description || preset.name}">
        <div class="preset-colors">
          ${(preset.previewColors || []).map(c => `<span style="background:${c}"></span>`).join('')}
        </div>
        <span class="preset-name">${preset.name}</span>
      </button>
    `).join('');

    const colorGroups = THEME_COLOR_GROUPS.map(group => {
      const colorInputs = group.colors.map(color => {
        const value = this.getNestedValue(this.currentTheme as Record<string, unknown>, color.key) as string || '#000000';
        return `
          <div class="color-row">
            <label title="${color.description || ''}">${color.label}</label>
            <input type="color" data-key="${color.key}" value="${this.normalizeColor(value)}" />
            <input type="text" data-key="${color.key}" value="${value}" class="color-text" />
          </div>
        `;
      }).join('');

      return `
        <div class="color-group">
          <h4>${group.label}</h4>
          ${group.description ? `<p class="group-desc">${group.description}</p>` : ''}
          ${colorInputs}
        </div>
      `;
    }).join('');

    return `
      <div class="theme-editor-inner">
        <div class="presets-section">
          <h3>Presets</h3>
          <div class="presets-grid">${presetButtons}</div>
        </div>
        <div class="colors-section">
          <h3>Customize</h3>
          ${colorGroups}
        </div>
        <div class="actions-section">
          <button class="export-btn">Export JSON</button>
          <button class="import-btn">Import JSON</button>
        </div>
      </div>
    `;
  }

  private normalizeColor(color: string): string {
    // Convert rgba/rgb to hex for color picker
    if (color.startsWith('rgba') || color.startsWith('rgb')) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        const r = parseInt(match[1]).toString(16).padStart(2, '0');
        const g = parseInt(match[2]).toString(16).padStart(2, '0');
        const b = parseInt(match[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
      }
    }
    return color;
  }

  private attachEventListeners(): void {
    if (!this.element) return;

    // Preset buttons
    this.element.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const presetName = btn.getAttribute('data-preset');
        if (presetName) {
          this.applyPreset(presetName);
        }
      });
    });

    // Color inputs
    this.element.querySelectorAll('input[type="color"], input.color-text').forEach(input => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const key = target.getAttribute('data-key');
        if (key) {
          this.updateProperty(key, target.value);
          // Sync color picker and text input
          const sibling = target.type === 'color' 
            ? target.nextElementSibling as HTMLInputElement
            : target.previousElementSibling as HTMLInputElement;
          if (sibling) {
            sibling.value = target.type === 'color' ? target.value : this.normalizeColor(target.value);
          }
        }
      });
    });

    // Export button
    this.element.querySelector('.export-btn')?.addEventListener('click', () => {
      const json = this.exportTheme();
      navigator.clipboard?.writeText(json).then(() => {
      });
    });

    // Import button
    this.element.querySelector('.import-btn')?.addEventListener('click', () => {
      const json = prompt('Paste theme JSON:');
      if (json) {
        this.importTheme(json);
      }
    });
  }
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Create a theme editor instance
 */
export function createThemeEditor(
  container: HTMLElement,
  options?: ThemeEditorOptions
): ThemeEditor {
  return new ThemeEditor(container, options);
}

/**
 * Get a preset theme by name
 */
export function getPresetTheme(name: string): EditorTheme | undefined {
  const preset = THEME_PRESETS.find(p => p.name.toLowerCase() === name.toLowerCase());
  return preset ? { ...preset.theme } : undefined;
}

/**
 * Get all preset names
 */
export function getPresetNames(): string[] {
  return THEME_PRESETS.map(p => p.name);
}
