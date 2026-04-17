/**
 * Sci Plot - Internationalization (i18n) Module
 * 
 * Provides locale-aware formatting for numbers, dates, and chart UI.
 * Supports custom format functions and predefined locales.
 * 
 * @module locale
 */

// ============================================
// Types
// ============================================

export interface LocaleConfig {
  /** Locale identifier (e.g., 'en-US', 'es-ES', 'de-DE') */
  locale: string;
  /** Decimal separator override (auto-detected if not specified) */
  decimalSeparator?: string;
  /** Thousands separator override (auto-detected if not specified) */
  thousandsSeparator?: string;
  /** Date format pattern (e.g., 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD') */
  dateFormat?: string;
  /** Time format pattern (e.g., 'HH:mm:ss', 'hh:mm:ss a') */
  timeFormat?: string;
  /** Custom number formatter */
  numberFormatter?: (value: number, decimals?: number) => string;
  /** Custom date formatter */
  dateFormatter?: (date: Date) => string;
  /** Short form labels (used in axis labels) */
  shortLabels?: {
    time?: string;
    value?: string;
    points?: string;
  };
  /** Full form labels (used in tooltips/panels) */
  labels?: {
    start?: string;
    pause?: string;
    reset?: string;
    export?: string;
    autoScale?: string;
    pan?: string;
    zoom?: string;
    select?: string;
    legend?: string;
    fps?: string;
    points?: string;
    loading?: string;
    noData?: string;
    error?: string;
  };
}

export interface LocaleFormatter {
  /** Format a number with the locale settings */
  formatNumber(value: number, decimals?: number): string;
  /** Format a date with the locale settings */
  formatDate(date: Date): string;
  /** Format a time with the locale settings */
  formatTime(date: Date): string;
  /** Format a date and time with the locale settings */
  formatDateTime(date: Date): string;
  /** Format a number with SI prefix (k, M, G, etc.) */
  formatWithPrefix(value: number, unit?: string): string;
  /** Format a number in scientific notation */
  formatScientific(value: number, decimals?: number): string;
  /** Get a localized label */
  getLabel(key: keyof NonNullable<LocaleConfig['labels']>): string;
}

// ============================================
// Predefined Locales
// ============================================

export const LOCALE_EN_US: LocaleConfig = {
  locale: 'en-US',
  decimalSeparator: '.',
  thousandsSeparator: ',',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: 'hh:mm:ss a',
  labels: {
    start: 'Start',
    pause: 'Pause',
    reset: 'Reset',
    export: 'Export',
    autoScale: 'Auto Scale',
    pan: 'Pan',
    zoom: 'Zoom',
    select: 'Select',
    legend: 'Legend',
    fps: 'FPS',
    points: 'points',
    loading: 'Loading...',
    noData: 'No data',
    error: 'Error',
  },
};

export const LOCALE_ES_ES: LocaleConfig = {
  locale: 'es-ES',
  decimalSeparator: ',',
  thousandsSeparator: '.',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm:ss',
  labels: {
    start: 'Iniciar',
    pause: 'Pausar',
    reset: 'Reiniciar',
    export: 'Exportar',
    autoScale: 'Auto Escala',
    pan: 'Mover',
    zoom: 'Zoom',
    select: 'Seleccionar',
    legend: 'Leyenda',
    fps: 'FPS',
    points: 'puntos',
    loading: 'Cargando...',
    noData: 'Sin datos',
    error: 'Error',
  },
};

export const LOCALE_DE_DE: LocaleConfig = {
  locale: 'de-DE',
  decimalSeparator: ',',
  thousandsSeparator: '.',
  dateFormat: 'DD.MM.YYYY',
  timeFormat: 'HH:mm:ss',
  labels: {
    start: 'Start',
    pause: 'Pause',
    reset: 'Zurücksetzen',
    export: 'Exportieren',
    autoScale: 'Auto-Skalierung',
    pan: 'Verschieben',
    zoom: 'Zoom',
    select: 'Auswählen',
    legend: 'Legende',
    fps: 'FPS',
    points: 'Punkte',
    loading: 'Laden...',
    noData: 'Keine Daten',
    error: 'Fehler',
  },
};

export const LOCALE_FR_FR: LocaleConfig = {
  locale: 'fr-FR',
  decimalSeparator: ',',
  thousandsSeparator: ' ',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm:ss',
  labels: {
    start: 'Démarrer',
    pause: 'Pause',
    reset: 'Réinitialiser',
    export: 'Exporter',
    autoScale: 'Échelle auto',
    pan: 'Déplacer',
    zoom: 'Zoom',
    select: 'Sélectionner',
    legend: 'Légende',
    fps: 'FPS',
    points: 'points',
    loading: 'Chargement...',
    noData: 'Aucune donnée',
    error: 'Erreur',
  },
};

export const LOCALE_PT_BR: LocaleConfig = {
  locale: 'pt-BR',
  decimalSeparator: ',',
  thousandsSeparator: '.',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm:ss',
  labels: {
    start: 'Iniciar',
    pause: 'Pausar',
    reset: 'Reiniciar',
    export: 'Exportar',
    autoScale: 'Escala Auto',
    pan: 'Mover',
    zoom: 'Zoom',
    select: 'Selecionar',
    legend: 'Legenda',
    fps: 'FPS',
    points: 'pontos',
    loading: 'Carregando...',
    noData: 'Sem dados',
    error: 'Erro',
  },
};

export const LOCALE_ZH_CN: LocaleConfig = {
  locale: 'zh-CN',
  decimalSeparator: '.',
  thousandsSeparator: ',',
  dateFormat: 'YYYY/MM/DD',
  timeFormat: 'HH:mm:ss',
  labels: {
    start: '开始',
    pause: '暂停',
    reset: '重置',
    export: '导出',
    autoScale: '自动缩放',
    pan: '平移',
    zoom: '缩放',
    select: '选择',
    legend: '图例',
    fps: 'FPS',
    points: '点',
    loading: '加载中...',
    noData: '无数据',
    error: '错误',
  },
};

export const LOCALE_JA_JP: LocaleConfig = {
  locale: 'ja-JP',
  decimalSeparator: '.',
  thousandsSeparator: ',',
  dateFormat: 'YYYY/MM/DD',
  timeFormat: 'HH:mm:ss',
  labels: {
    start: '開始',
    pause: '一時停止',
    reset: 'リセット',
    export: 'エクスポート',
    autoScale: '自動スケール',
    pan: 'パン',
    zoom: 'ズーム',
    select: '選択',
    legend: '凡例',
    fps: 'FPS',
    points: 'ポイント',
    loading: '読み込み中...',
    noData: 'データなし',
    error: 'エラー',
  },
};

// Predefined locales map
const PREDEFINED_LOCALES: Record<string, LocaleConfig> = {
  'en-US': LOCALE_EN_US,
  'en': LOCALE_EN_US,
  'es-ES': LOCALE_ES_ES,
  'es': LOCALE_ES_ES,
  'de-DE': LOCALE_DE_DE,
  'de': LOCALE_DE_DE,
  'fr-FR': LOCALE_FR_FR,
  'fr': LOCALE_FR_FR,
  'pt-BR': LOCALE_PT_BR,
  'pt': LOCALE_PT_BR,
  'zh-CN': LOCALE_ZH_CN,
  'zh': LOCALE_ZH_CN,
  'ja-JP': LOCALE_JA_JP,
  'ja': LOCALE_JA_JP,
};

// ============================================
// SI Prefixes
// ============================================

const SI_PREFIXES = [
  { value: 1e-15, symbol: 'f' },
  { value: 1e-12, symbol: 'p' },
  { value: 1e-9, symbol: 'n' },
  { value: 1e-6, symbol: 'µ' },
  { value: 1e-3, symbol: 'm' },
  { value: 1, symbol: '' },
  { value: 1e3, symbol: 'k' },
  { value: 1e6, symbol: 'M' },
  { value: 1e9, symbol: 'G' },
  { value: 1e12, symbol: 'T' },
  { value: 1e15, symbol: 'P' },
];

// ============================================
// Locale Manager
// ============================================

/** Current global locale */
let currentLocale: LocaleConfig = LOCALE_EN_US;

/**
 * Set the global locale for all charts
 */
export function setGlobalLocale(localeOrConfig: string | LocaleConfig): void {
  if (typeof localeOrConfig === 'string') {
    const predefined = PREDEFINED_LOCALES[localeOrConfig];
    if (predefined) {
      currentLocale = predefined;
    } else {
      // Try to create a basic locale from the string
      currentLocale = { ...LOCALE_EN_US, locale: localeOrConfig };
    }
  } else {
    currentLocale = { ...LOCALE_EN_US, ...localeOrConfig };
  }
}

/**
 * Get the current global locale
 */
export function getGlobalLocale(): LocaleConfig {
  return currentLocale;
}

/**
 * Get a predefined locale by name
 */
export function getLocale(name: string): LocaleConfig | undefined {
  return PREDEFINED_LOCALES[name];
}

/**
 * Register a custom locale
 */
export function registerLocale(name: string, config: LocaleConfig): void {
  PREDEFINED_LOCALES[name] = config;
}

// ============================================
// Locale Formatter Implementation
// ============================================

/**
 * Create a locale formatter from a configuration
 */
export function createLocaleFormatter(config?: LocaleConfig | string): LocaleFormatter {
  let localeConfig: LocaleConfig;
  
  if (!config) {
    localeConfig = currentLocale;
  } else if (typeof config === 'string') {
    localeConfig = PREDEFINED_LOCALES[config] || { ...LOCALE_EN_US, locale: config };
  } else {
    localeConfig = { ...LOCALE_EN_US, ...config };
  }

  const decSep = localeConfig.decimalSeparator || '.';
  const thousandsSep = localeConfig.thousandsSeparator || ',';
  const labels = { ...LOCALE_EN_US.labels, ...localeConfig.labels };

  return {
    formatNumber(value: number, decimals: number = 2): string {
      if (localeConfig.numberFormatter) {
        return localeConfig.numberFormatter(value, decimals);
      }

      if (!isFinite(value)) {
        return value.toString();
      }

      // Format the number
      const parts = Math.abs(value).toFixed(decimals).split('.');
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);
      const decimalPart = parts[1];

      let result = integerPart;
      if (decimalPart) {
        result += decSep + decimalPart;
      }

      return value < 0 ? '-' + result : result;
    },

    formatDate(date: Date): string {
      if (localeConfig.dateFormatter) {
        return localeConfig.dateFormatter(date);
      }

      const format = localeConfig.dateFormat || 'YYYY-MM-DD';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear());

      return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day);
    },

    formatTime(date: Date): string {
      const format = localeConfig.timeFormat || 'HH:mm:ss';
      const hours24 = date.getHours();
      const hours12 = hours24 % 12 || 12;
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const ampm = hours24 >= 12 ? 'PM' : 'AM';

      return format
        .replace('HH', String(hours24).padStart(2, '0'))
        .replace('hh', String(hours12).padStart(2, '0'))
        .replace('mm', minutes)
        .replace('ss', seconds)
        .replace('a', ampm.toLowerCase())
        .replace('A', ampm);
    },

    formatDateTime(date: Date): string {
      return this.formatDate(date) + ' ' + this.formatTime(date);
    },

    formatWithPrefix(value: number, unit: string = ''): string {
      if (value === 0) return '0' + (unit ? ' ' + unit : '');

      const absValue = Math.abs(value);
      
      // Find appropriate prefix
      let selectedPrefix = SI_PREFIXES[5]; // Default to '' (1)
      for (let i = SI_PREFIXES.length - 1; i >= 0; i--) {
        if (absValue >= SI_PREFIXES[i].value * 0.9999) {
          selectedPrefix = SI_PREFIXES[i];
          break;
        }
      }

      const scaledValue = value / selectedPrefix.value;
      const formatted = this.formatNumber(scaledValue, 2);
      
      const suffix = selectedPrefix.symbol + unit;
      return formatted + (suffix ? ' ' + suffix : '');
    },

    formatScientific(value: number, decimals: number = 2): string {
      if (value === 0) return '0';
      if (!isFinite(value)) return value.toString();

      const exp = Math.floor(Math.log10(Math.abs(value)));
      const mantissa = value / Math.pow(10, exp);
      
      return this.formatNumber(mantissa, decimals) + ' × 10' + formatSuperscript(exp);
    },

    getLabel(key: keyof NonNullable<LocaleConfig['labels']>): string {
      return labels[key] || key;
    },
  };
}

/**
 * Format a number as superscript for scientific notation
 */
function formatSuperscript(num: number): string {
  const superscripts: Record<string, string> = {
    '-': '⁻',
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };
  return String(num).split('').map(c => superscripts[c] || c).join('');
}

// ============================================
// Default Export
// ============================================

export const defaultFormatter = createLocaleFormatter();
