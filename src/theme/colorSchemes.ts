/**
 * Color Schemes - Palettes optimized for multi-series charts
 * 
 * Each scheme includes:
 * - 20 distinct colors for series
 * - 1 highlight color for hover/selection states
 * 
 * These schemes are designed to work with both dark and light themes
 * and provide maximum visual distinction between multiple series.
 */

export interface ColorScheme {
  /** Scheme name */
  name: string;
  /** Series color palette (20 colors) */
  colors: string[];
  /** Highlight color for hover/selection (distinct from palette) */
  highlightColor: string;
  /** Whether optimized for dark backgrounds */
  isDark: boolean;
}

/**
 * VIBRANT - High saturation, energetic colors for dark backgrounds
 */
export const VIBRANT_SCHEME: ColorScheme = {
  name: "vibrant",
  isDark: true,
  colors: [
    "#FF6B6B", // Coral Red
    "#4ECDC4", // Turquoise
    "#FFE66D", // Golden Yellow
    "#95E1D3", // Mint
    "#F38181", // Salmon
    "#AA96DA", // Lavender
    "#FCBAD3", // Pink
    "#A8D8EA", // Sky Blue
    "#FF8C42", // Orange
    "#6BCF7F", // Green
    "#D4A5A5", // Dusty Rose
    "#9B59B6", // Purple
    "#3498DB", // Blue
    "#E74C3C", // Red
    "#F39C12", // Amber
    "#1ABC9C", // Teal
    "#E67E22", // Carrot
    "#ECF0F1", // Silver
    "#34495E", // Navy
    "#16A085", // Sea Green
  ],
  highlightColor: "#FFFFFF", // Pure White
};

/**
 * PASTEL - Soft, muted colors for light backgrounds
 */
export const PASTEL_SCHEME: ColorScheme = {
  name: "pastel",
  isDark: false,
  colors: [
    "#FF9AA2", // Light Coral
    "#FFB7B2", // Melon
    "#FFDAC1", // Apricot
    "#E2F0CB", // Tea Green
    "#B5EAD7", // Magic Mint
    "#C7CEEA", // Periwinkle
    "#D4A5A5", // Rosy Brown
    "#FFB6C1", // Light Pink
    "#FFA07A", // Light Salmon
    "#98D8C8", // Pearl Aqua
    "#F7DC6F", // Cream
    "#BB8FCE", // Light Purple
    "#85C1E2", // Baby Blue
    "#F8B88B", // Apricot
    "#A2D5F2", // Columbia Blue
    "#FFD1DC", // Pink Lace
    "#C5E1A5", // Light Green
    "#FFCCBC", // Light Orange
    "#B0BEC5", // Blue Gray
    "#D1C4E9", // Lavender Blue
  ],
  highlightColor: "#1A1A1A", // Near Black
};

/**
 * NEON - Electric, fluorescent colors for dark backgrounds
 */
export const NEON_SCHEME: ColorScheme = {
  name: "neon",
  isDark: true,
  colors: [
    "#39FF14", // Neon Green
    "#FF073A", // Neon Red
    "#00F0FF", // Neon Cyan
    "#FF10F0", // Neon Magenta
    "#DFFF00", // Neon Yellow
    "#BC13FE", // Neon Purple
    "#FF6700", // Neon Orange
    "#00FFFF", // Neon Aqua
    "#FF1493", // Deep Pink
    "#7FFF00", // Chartreuse
    "#FF00FF", // Fuchsia
    "#00FF7F", // Spring Green
    "#FF4500", // Orange Red
    "#9D00FF", // Violet
    "#FFFF00", // Yellow
    "#00BFFF", // Deep Sky Blue
    "#FF69B4", // Hot Pink
    "#ADFF2F", // Green Yellow
    "#FF00AA", // Neon Pink
    "#00FFAA", // Bright Teal
  ],
  highlightColor: "#FFFFFF", // Pure White
};

/**
 * EARTH - Natural, organic tones for light backgrounds
 */
export const EARTH_SCHEME: ColorScheme = {
  name: "earth",
  isDark: false,
  colors: [
    "#8B4513", // Saddle Brown
    "#A0522D", // Sienna
    "#CD853F", // Peru
    "#DEB887", // Burlywood
    "#D2691E", // Chocolate
    "#BC8F8F", // Rosy Brown
    "#F4A460", // Sandy Brown
    "#DAA520", // Goldenrod
    "#B8860B", // Dark Goldenrod
    "#CD5C5C", // Indian Red
    "#556B2F", // Dark Olive Green
    "#6B8E23", // Olive Drab
    "#808000", // Olive
    "#8B7355", // Burlywood Dark
    "#A0826D", // Beaver
    "#926F5B", // Dirt
    "#C19A6B", // Camel
    "#8B7D6B", // Khaki Dark
    "#704214", // Sepia
    "#966919", // Golden Brown
  ],
  highlightColor: "#000000", // Pure Black
};

/**
 * OCEAN - Blue and aquatic tones for both backgrounds
 */
export const OCEAN_SCHEME: ColorScheme = {
  name: "ocean",
  isDark: true,
  colors: [
    "#006994", // Sea Blue
    "#0077BE", // Ocean Blue
    "#0091AD", // Blue-Green
    "#00A86B", // Jade
    "#00B2A9", // Turquoise Surf
    "#00CED1", // Dark Turquoise
    "#1E90FF", // Dodger Blue
    "#4169E1", // Royal Blue
    "#4682B4", // Steel Blue
    "#5F9EA0", // Cadet Blue
    "#6495ED", // Cornflower Blue
    "#00BFFF", // Deep Sky Blue
    "#87CEEB", // Sky Blue
    "#87CEFA", // Light Sky Blue
    "#ADD8E6", // Light Blue
    "#B0E0E6", // Powder Blue
    "#AFEEEE", // Pale Turquoise
    "#00CED1", // Dark Turquoise
    "#48D1CC", // Medium Turquoise
    "#40E0D0", // Turquoise
  ],
  highlightColor: "#FFD700", // Gold
};

/**
 * All available color schemes
 */
export const COLOR_SCHEMES: ColorScheme[] = [
  VIBRANT_SCHEME,
  PASTEL_SCHEME,
  NEON_SCHEME,
  EARTH_SCHEME,
  OCEAN_SCHEME,
];

/**
 * Get a color scheme by name
 */
export function getColorScheme(name: string): ColorScheme {
  const scheme = COLOR_SCHEMES.find(s => s.name === name);
  if (!scheme) {
    console.warn(`[ColorScheme] Unknown scheme "${name}", using vibrant`);
    return VIBRANT_SCHEME;
  }
  return scheme;
}

/**
 * Get color from scheme by index (cycles if index > 20)
 */
export function getColorFromScheme(scheme: ColorScheme, index: number): string {
  return scheme.colors[index % scheme.colors.length];
}

/**
 * Auto-select appropriate scheme based on theme
 */
export function getDefaultSchemeForTheme(isDark: boolean): ColorScheme {
  return isDark ? VIBRANT_SCHEME : PASTEL_SCHEME;
}
