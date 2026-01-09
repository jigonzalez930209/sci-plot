/**
 * Color palettes and themes for 3D charts
 * Provides optimized color schemes for both dark and light backgrounds
 */

export type ColorPalette = Array<[number, number, number]>;

export interface ColorTheme {
  /** Series color palette */
  seriesPalette: ColorPalette;
  /** Highlight color for hover states */
  highlightColor: [number, number, number];
  /** Default background color */
  backgroundColor?: [number, number, number, number];
}

/**
 * Dark theme - optimized for dark backgrounds
 * Uses vibrant, saturated colors that pop against dark backgrounds
 */
export const DARK_THEME: ColorTheme = {
  seriesPalette: [
    [0.3, 0.7, 1.0],   // Bright Blue
    [1.0, 0.5, 0.3],   // Bright Orange
    [0.3, 0.95, 0.6],  // Bright Green
    [1.0, 0.4, 0.9],   // Bright Magenta
    [1.0, 0.95, 0.3],  // Bright Yellow
    [0.6, 0.4, 1.0],   // Bright Purple
    [0.4, 0.95, 0.95], // Bright Cyan
    [1.0, 0.7, 0.4],   // Bright Peach
  ],
  highlightColor: [1.0, 1.0, 0.9], // Bright white-yellow
  backgroundColor: [0.05, 0.05, 0.1, 1],
};

/**
 * Light theme - optimized for light backgrounds
 * Uses deeper, more saturated colors that stand out against white/light backgrounds
 */
export const LIGHT_THEME: ColorTheme = {
  seriesPalette: [
    [0.2, 0.4, 0.8],   // Deep Blue
    [0.9, 0.4, 0.1],   // Deep Orange
    [0.1, 0.6, 0.3],   // Deep Green
    [0.7, 0.2, 0.6],   // Deep Magenta
    [0.8, 0.7, 0.1],   // Deep Yellow
    [0.4, 0.2, 0.7],   // Deep Purple
    [0.1, 0.5, 0.6],   // Deep Teal
    [0.7, 0.3, 0.2],   // Deep Brown
  ],
  highlightColor: [0.1, 0.1, 0.5], // Deep navy blue for contrast
  backgroundColor: [0.95, 0.95, 0.98, 1],
};

/**
 * Auto-detect theme based on background color luminance
 */
export function getThemeFromBackground(
  backgroundColor: [number, number, number, number]
): ColorTheme {
  const [r, g, b] = backgroundColor;
  // Calculate relative luminance
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  
  // If background is light (luminance > 0.5), use light theme
  return luminance > 0.5 ? LIGHT_THEME : DARK_THEME;
}

/**
 * Create a custom theme or merge with defaults
 */
export interface CustomThemeOptions {
  /** Custom series palette (overrides default) */
  seriesPalette?: ColorPalette;
  /** Custom highlight color (overrides default) */
  highlightColor?: [number, number, number];
  /** Base theme to use ('dark' | 'light' | 'auto') */
  baseTheme?: 'dark' | 'light' | 'auto';
}

export function createTheme(
  options: CustomThemeOptions,
  backgroundColor?: [number, number, number, number]
): ColorTheme {
  let baseTheme: ColorTheme;
  
  if (options.baseTheme === 'dark') {
    baseTheme = DARK_THEME;
  } else if (options.baseTheme === 'light') {
    baseTheme = LIGHT_THEME;
  } else {
    // Auto-detect from background
    baseTheme = backgroundColor 
      ? getThemeFromBackground(backgroundColor)
      : DARK_THEME;
  }
  
  return {
    seriesPalette: options.seriesPalette ?? baseTheme.seriesPalette,
    highlightColor: options.highlightColor ?? baseTheme.highlightColor,
    backgroundColor: baseTheme.backgroundColor,
  };
}
