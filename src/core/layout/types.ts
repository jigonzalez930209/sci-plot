/**
 * Layout Configuration Types
 * 
 * Provides detailed control over chart component positioning and spacing.
 */

// ============================================
// Legend Configuration
// ============================================

/** Position presets for legend placement */
export type LegendPositionPreset =
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'top-center'
    | 'bottom-center';

export interface LegendOptions {
    /** Show the legend (default: from theme) */
    visible?: boolean;
    /** Position preset or custom coordinates */
    position?: LegendPositionPreset | { x: number; y: number };
    /** Width of the legend in pixels */
    width?: number;
    /** 
     * Highlight series color on hover in legend (default: false)
     * When false, series still comes to foreground but color doesn't change
     */
    highlightOnHover?: boolean;
    /** 
     * Bring series to foreground (z-index) on hover in legend (default: true)
     */
    bringToFrontOnHover?: boolean;
    /** Draggable legend (default: true) */
    draggable?: boolean;
    /** Resizable legend (default: true) */
    resizable?: boolean;
}

// ============================================
// Crosshair/Cursor Value Display
// ============================================

/** Mode for displaying crosshair coordinate values */
export type CrosshairValueMode =
    | 'disabled'   // Never show X,Y values
    | 'corner'     // Show values in a corner
    | 'floating';  // Show values next to cursor

/** Corner positions for crosshair value display */
export type CornerPosition =
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';

export interface CrosshairOptions {
    /** Show crosshair lines (default: true) */
    enabled?: boolean;
    /** Show vertical line (default: true) */
    showVertical?: boolean;
    /** Show horizontal line (default: true) */
    showHorizontal?: boolean;
    /** Line color (default: from theme) */
    color?: string;
    /** Line style (default: 'dashed') */
    lineStyle?: 'solid' | 'dashed' | 'dotted';
    /** Line width in pixels (default: 1) */
    lineWidth?: number;
    /** Snap to nearest data point (default: false) */
    snapToData?: boolean;
    /** 
     * Display mode for X,Y coordinate values (default: 'disabled')
     * - 'disabled': Never show coordinate values
     * - 'corner': Show values in a fixed corner position
     * - 'floating': Show values next to the cursor
     */
    valueDisplayMode?: CrosshairValueMode;
    /** 
     * Corner position when valueDisplayMode is 'corner' (default: 'top-left')
     */
    cornerPosition?: CornerPosition;
    /** Value display formatting options */
    valueFormat?: {
        /** X value precision (default: 4) */
        xPrecision?: number;
        /** Y value precision (default: 4) */
        yPrecision?: number;
        /** Use scientific notation for large/small values */
        scientific?: boolean;
    };
}

// ============================================
// Toolbar Configuration
// ============================================

/** Position presets for toolbar placement */
export type ToolbarPositionPreset =
    | 'top-left'
    | 'top-right'
    | 'top-center'
    | 'bottom-left'
    | 'bottom-right'
    | 'bottom-center';

export interface ToolbarPosition {
    /** Horizontal position: distance from left edge in pixels or preset */
    horizontal?: number | 'left' | 'center' | 'right';
    /** Vertical position: distance from top edge in pixels or preset */
    vertical?: number | 'top' | 'bottom';
    /** Offset from calculated position */
    offset?: { x?: number; y?: number };
}

// ============================================
// Title Configuration
// ============================================

export interface ChartTitleOptions {
    /** Title text */
    text?: string;
    /** Title visibility */
    visible?: boolean;
    /** Font size in pixels */
    fontSize?: number;
    /** Font family */
    fontFamily?: string;
    /** Font weight */
    fontWeight?: string | number;
    /** Text color */
    color?: string;
    /** Title position */
    position?: 'top' | 'bottom';
    /** Alignment within position */
    align?: 'left' | 'center' | 'right';
    /** Padding around title */
    padding?: number | { top?: number; bottom?: number };
}

// ============================================
// Axis Layout Options
// ============================================

export interface AxisLayoutOptions {
    /** Distance between axis line and axis title in pixels */
    titleGap?: number;
    /** Distance between tick labels and axis line in pixels */
    labelGap?: number;
    /** Distance between tick marks and axis line in pixels */
    tickGap?: number;
    /** Padding between axis area and plot area in pixels */
    axisPadding?: number;
}

// ============================================
// Chart Margins & Padding
// ============================================

export interface ChartMargins {
    /** Top margin in pixels */
    top?: number;
    /** Right margin in pixels */
    right?: number;
    /** Bottom margin in pixels */
    bottom?: number;
    /** Left margin in pixels */
    left?: number;
}

export interface PlotAreaPadding {
    /** Padding inside the plot area - top */
    top?: number;
    /** Padding inside the plot area - right */
    right?: number;
    /** Padding inside the plot area - bottom */
    bottom?: number;
    /** Padding inside the plot area - left */
    left?: number;
}

// ============================================
// Complete Layout Configuration
// ============================================

export interface LayoutOptions {
    /** Chart title configuration */
    title?: ChartTitleOptions;
    /** Legend positioning and behavior */
    legend?: LegendOptions;
    /** Toolbar positioning */
    toolbarPosition?: ToolbarPositionPreset | ToolbarPosition;
    /** Crosshair/cursor configuration */
    crosshair?: CrosshairOptions;
    /** Chart margins (space between container and chart) */
    margins?: ChartMargins;
    /** Plot area padding (space inside the chart border) */
    plotPadding?: PlotAreaPadding;
    /** X-axis layout options */
    xAxisLayout?: AxisLayoutOptions;
    /** Y-axis layout options */
    yAxisLayout?: AxisLayoutOptions;
    /** Auto-adjust margins based on axis content (default: true) */
    autoMargins?: boolean;
}

/**
 * Default layout values
 */
export const DEFAULT_LAYOUT: Required<LayoutOptions> = {
    title: {
        text: '',
        visible: false,
        fontSize: 16,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 600,
        color: '#ffffff',
        position: 'top',
        align: 'center',
        padding: { top: 10, bottom: 10 },
    },
    legend: {
        visible: true,
        position: 'top-right',
        width: 120,
        highlightOnHover: false,   // Default: no color change on hover
        bringToFrontOnHover: true, // Default: bring to front on hover
        draggable: true,
        resizable: true,
    },
    toolbarPosition: 'top-right',
    crosshair: {
        enabled: true,
        showVertical: true,
        showHorizontal: true,
        lineStyle: 'dashed',
        lineWidth: 1,
        snapToData: false,
        valueDisplayMode: 'disabled', // Default: no X,Y values shown
        cornerPosition: 'top-left',
        valueFormat: {
            xPrecision: 4,
            yPrecision: 4,
            scientific: false,
        },
    },
    margins: {
        top: 20,
        right: 30,
        bottom: 55,
        left: 75,
    },
    plotPadding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    },
    xAxisLayout: {
        titleGap: 45,
        labelGap: 4,
        tickGap: 2,
        axisPadding: 0,
    },
    yAxisLayout: {
        titleGap: 50,
        labelGap: 4,
        tickGap: 2,
        axisPadding: 0,
    },
    autoMargins: true,
};

/**
 * Merge user layout options with defaults
 */
export function mergeLayoutOptions(
    userOptions?: Partial<LayoutOptions>
): Required<LayoutOptions> {
    if (!userOptions) return { ...DEFAULT_LAYOUT };

    return {
        title: { ...DEFAULT_LAYOUT.title, ...userOptions.title },
        legend: { ...DEFAULT_LAYOUT.legend, ...userOptions.legend },
        toolbarPosition: userOptions.toolbarPosition ?? DEFAULT_LAYOUT.toolbarPosition,
        crosshair: {
            ...DEFAULT_LAYOUT.crosshair,
            ...userOptions.crosshair,
            valueFormat: {
                ...DEFAULT_LAYOUT.crosshair.valueFormat,
                ...userOptions.crosshair?.valueFormat,
            },
        },
        margins: { ...DEFAULT_LAYOUT.margins, ...userOptions.margins },
        plotPadding: { ...DEFAULT_LAYOUT.plotPadding, ...userOptions.plotPadding },
        xAxisLayout: { ...DEFAULT_LAYOUT.xAxisLayout, ...userOptions.xAxisLayout },
        yAxisLayout: { ...DEFAULT_LAYOUT.yAxisLayout, ...userOptions.yAxisLayout },
        autoMargins: userOptions.autoMargins ?? DEFAULT_LAYOUT.autoMargins,
    };
}
