/**
 * Context Menu Plugin - Type Definitions
 * 
 * @module plugins/context-menu/types
 */

// ============================================
// Menu Item Types
// ============================================

/**
 * Base menu item properties
 */
export interface MenuItemBase {
  /** Unique identifier for the item */
  id?: string;
  
  /** Display label */
  label: string;
  
  /** Icon (emoji, SVG string, or icon class) */
  icon?: string;
  
  /** Keyboard shortcut hint */
  shortcut?: string;
  
  /** Whether the item is disabled */
  disabled?: boolean;
  
  /** Whether the item is hidden */
  hidden?: boolean;
  
  /** CSS class for styling */
  className?: string;
}

/**
 * Separator item
 */
export interface MenuSeparator {
  type: 'separator';
}

/**
 * Action menu item
 */
export interface MenuActionItem extends MenuItemBase {
  type?: 'action';
  
  /** Action identifier (for built-in actions) */
  action?: BuiltinAction;
  
  /** Custom click handler */
  onClick?: (context: MenuContext) => void;
}

/**
 * Submenu item
 */
export interface MenuSubmenuItem extends MenuItemBase {
  type: 'submenu';
  
  /** Submenu items */
  items: MenuItem[];
}

/**
 * Checkbox menu item
 */
export interface MenuCheckboxItem extends MenuItemBase {
  type: 'checkbox';
  
  /** Whether the checkbox is checked */
  checked?: boolean;
  
  /** Change handler */
  onChange?: (checked: boolean, context: MenuContext) => void;
}

/**
 * Radio group item
 */
export interface MenuRadioItem extends MenuItemBase {
  type: 'radio';
  
  /** Radio group name */
  group: string;
  
  /** Value for this option */
  value: string;
  
  /** Whether this option is selected */
  selected?: boolean;
  
  /** Change handler */
  onChange?: (value: string, context: MenuContext) => void;
}

/**
 * All menu item types
 */
export type MenuItem = 
  | MenuActionItem 
  | MenuSubmenuItem 
  | MenuCheckboxItem 
  | MenuRadioItem 
  | MenuSeparator;

// ============================================
// Built-in Actions
// ============================================

/**
 * Built-in menu actions
 */
export type BuiltinAction = 
  | 'zoomToFit'
  | 'zoomIn'
  | 'zoomOut'
  | 'resetView'
  | 'panMode'
  | 'boxZoomMode'
  | 'selectMode'
  | 'exportCSV'
  | 'exportJSON'
  | 'exportImage'
  | 'copyToClipboard'
  | 'toggleLegend'
  | 'toggleGrid'
  | 'toggleCrosshair'
  | 'addHorizontalLine'
  | 'addVerticalLine'
  | 'addTextAnnotation'
  | 'clearAnnotations'
  | 'showStats';

// ============================================
// Context Types
// ============================================

/**
 * Context passed to menu handlers
 */
export interface MenuContext {
  /** The chart instance */
  chart: unknown;
  
  /** Mouse event that triggered the menu */
  event: MouseEvent;
  
  /** Click position in pixels */
  pixelPosition: { x: number; y: number };
  
  /** Click position in data coordinates */
  dataPosition: { x: number; y: number } | null;
  
  /** Series ID if clicked on a series */
  seriesId: string | null;
  
  /** Annotation ID if clicked on an annotation */
  annotationId: string | null;
  
  /** Point index if clicked near a data point */
  pointIndex: number | null;
  
  /** Area where the click occurred */
  area: 'plot' | 'xAxis' | 'yAxis' | 'legend' | 'title' | 'outside';
}

/**
 * Position for the menu
 */
export interface MenuPosition {
  x: number;
  y: number;
}

// ============================================
// Menu Configuration
// ============================================

/**
 * Menu template definition
 */
export interface MenuTemplate {
  /** Template name */
  name: string;
  
  /** Items in this template */
  items: MenuItem[];
  
  /** Condition to show this template */
  condition?: (context: MenuContext) => boolean;
}

/**
 * Menu styling options
 */
export interface MenuStyle {
  /** Background color */
  backgroundColor?: string;
  
  /** Text color */
  textColor?: string;
  
  /** Border color */
  borderColor?: string;
  
  /** Border radius */
  borderRadius?: string;
  
  /** Box shadow */
  boxShadow?: string;
  
  /** Font family */
  fontFamily?: string;
  
  /** Font size */
  fontSize?: string;
  
  /** Item padding */
  itemPadding?: string;
  
  /** Hover background */
  hoverBackground?: string;
  
  /** Separator color */
  separatorColor?: string;
  
  /** Disabled opacity */
  disabledOpacity?: number;
  
  /** Menu min width */
  minWidth?: string;
  
  /** Menu max width */
  maxWidth?: string;
  
  /** Animation duration */
  animationDuration?: string;
}

// ============================================
// Plugin Configuration
// ============================================

/**
 * Configuration for PluginContextMenu
 */
export interface PluginContextMenuConfig {
  /** Enable context menu */
  enabled?: boolean;
  
  /** Custom menu items */
  items?: MenuItem[];
  
  /** Menu templates for different contexts */
  templates?: MenuTemplate[];
  
  /** Use default menu items */
  useDefaults?: boolean;
  
  /** Custom styling */
  style?: MenuStyle;
  
  /** Prevent default browser context menu */
  preventDefault?: boolean;
  
  /** Show on right-click */
  showOnRightClick?: boolean;
  
  /** Show on long-press (touch) */
  showOnLongPress?: boolean;
  
  /** Long press duration in ms */
  longPressDuration?: number;
  
  /** Before show hook */
  beforeShow?: (context: MenuContext) => MenuItem[] | false;
  
  /** After hide hook */
  afterHide?: () => void;
  
  /** Z-index for the menu */
  zIndex?: number;
}

// ============================================
// Menu State
// ============================================

/**
 * Current menu state
 */
export interface MenuState {
  /** Whether the menu is visible */
  visible: boolean;
  
  /** Menu position */
  position: MenuPosition;
  
  /** Current items to display */
  items: MenuItem[];
  
  /** Active submenu path */
  submenuPath: string[];
  
  /** Current context */
  context: MenuContext | null;
}
