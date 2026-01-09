/**
 * SciChart Engine - Keyboard Shortcuts Module
 * 
 * Provides customizable keyboard shortcuts for chart interactions.
 * Supports key combinations, custom actions, and enable/disable per key.
 * 
 * @module keybindings
 */

// ============================================
// Types
// ============================================

/** Available built-in actions */
export type KeyAction =
  | 'resetZoom'
  | 'autoScale'
  | 'zoomIn'
  | 'zoomOut'
  | 'panLeft'
  | 'panRight'
  | 'panUp'
  | 'panDown'
  | 'togglePan'
  | 'toggleSelect'
  | 'clearSelection'
  | 'deleteSelected'
  | 'selectAll'
  | 'copy'
  | 'exportImage'
  | 'toggleLegend'
  | 'toggleDebug'
  | 'escape'
  | 'undo'
  | 'redo'
  | 'custom';

/** Key binding configuration */
export interface KeyBinding {
  /** The key code (e.g., 'KeyR', 'Escape', 'ArrowLeft') */
  key: string;
  /** Action to perform */
  action: KeyAction;
  /** Require Ctrl/Cmd key */
  ctrl?: boolean;
  /** Require Shift key */
  shift?: boolean;
  /** Require Alt key */
  alt?: boolean;
  /** Require Meta key (Cmd on Mac) */
  meta?: boolean;
  /** Custom handler function (required if action is 'custom') */
  handler?: () => void;
  /** Whether this binding is enabled (default: true) */
  enabled?: boolean;
  /** Description for help/UI display */
  description?: string;
}

/** Callbacks for keyboard actions */
export interface KeyBindingCallbacks {
  onResetZoom?: () => void;
  onAutoScale?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onPanLeft?: () => void;
  onPanRight?: () => void;
  onPanUp?: () => void;
  onPanDown?: () => void;
  onTogglePan?: () => void;
  onToggleSelect?: () => void;
  onClearSelection?: () => void;
  onDeleteSelected?: () => void;
  onSelectAll?: () => void;
  onCopy?: () => void;
  onExportImage?: () => void;
  onToggleLegend?: () => void;
  onToggleDebug?: () => void;
  onEscape?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export interface KeyBindingManagerOptions {
  /** Enable keyboard shortcuts (default: true) */
  enabled?: boolean;
  /** Custom key bindings (merged with defaults) */
  bindings?: KeyBinding[];
  /** Override all default bindings (replace instead of merge) */
  replaceDefaults?: boolean;
  /** Callbacks for built-in actions */
  callbacks: KeyBindingCallbacks;
  /** Target element for keyboard events (default: document) */
  target?: HTMLElement | Document;
  /** Prevent default browser behavior for matched keys (default: true) */
  preventDefault?: boolean;
}

// ============================================
// Default Key Bindings
// ============================================

export const DEFAULT_KEY_BINDINGS: KeyBinding[] = [
  // Zoom/Scale
  { key: 'KeyR', action: 'resetZoom', description: 'Reset zoom to fit data' },
  { key: 'KeyH', action: 'autoScale', description: 'Auto-scale axes' },
  { key: 'Equal', action: 'zoomIn', ctrl: true, description: 'Zoom in' },
  { key: 'Minus', action: 'zoomOut', ctrl: true, description: 'Zoom out' },
  { key: 'Digit0', action: 'resetZoom', ctrl: true, description: 'Reset zoom' },
  
  // Pan (Arrow keys)
  { key: 'ArrowLeft', action: 'panLeft', description: 'Pan left' },
  { key: 'ArrowRight', action: 'panRight', description: 'Pan right' },
  { key: 'ArrowUp', action: 'panUp', description: 'Pan up' },
  { key: 'ArrowDown', action: 'panDown', description: 'Pan down' },
  
  // Mode toggles
  { key: 'KeyP', action: 'togglePan', description: 'Toggle pan mode' },
  { key: 'KeyS', action: 'toggleSelect', description: 'Toggle select mode' },
  
  // Selection
  { key: 'Escape', action: 'escape', description: 'Clear selection / Cancel' },
  { key: 'Delete', action: 'deleteSelected', description: 'Delete selected points' },
  { key: 'Backspace', action: 'deleteSelected', description: 'Delete selected points' },
  { key: 'KeyA', action: 'selectAll', ctrl: true, description: 'Select all points' },
  
  // Clipboard
  { key: 'KeyC', action: 'copy', ctrl: true, description: 'Copy selected to clipboard' },
  
  // Export
  { key: 'KeyE', action: 'exportImage', ctrl: true, description: 'Export chart as image' },
  
  // UI toggles
  { key: 'KeyL', action: 'toggleLegend', description: 'Toggle legend visibility' },
  { key: 'KeyD', action: 'toggleDebug', ctrl: true, shift: true, description: 'Toggle debug overlay' },
  
  // Undo/Redo
  { key: 'KeyZ', action: 'undo', ctrl: true, description: 'Undo' },
  { key: 'KeyZ', action: 'redo', ctrl: true, shift: true, description: 'Redo' },
  { key: 'KeyY', action: 'redo', ctrl: true, description: 'Redo' },
];

// ============================================
// Key Binding Manager
// ============================================

export class KeyBindingManager {
  private bindings: KeyBinding[] = [];
  private callbacks: KeyBindingCallbacks;
  private target: HTMLElement | Document;
  private enabled: boolean = true;
  private preventDefault: boolean = true;
  private boundHandler: (e: KeyboardEvent) => void;

  constructor(options: KeyBindingManagerOptions) {
    this.callbacks = options.callbacks;
    this.target = options.target || document;
    this.enabled = options.enabled !== false;
    this.preventDefault = options.preventDefault !== false;

    // Merge or replace bindings
    if (options.replaceDefaults) {
      this.bindings = [...(options.bindings || [])];
    } else {
      this.bindings = [...DEFAULT_KEY_BINDINGS, ...(options.bindings || [])];
    }

    // Bind handler
    this.boundHandler = this.handleKeyDown.bind(this);
    this.attach();
  }

  /**
   * Attach keyboard event listeners
   */
  attach(): void {
    this.target.addEventListener('keydown', this.boundHandler as EventListener);
  }

  /**
   * Detach keyboard event listeners
   */
  detach(): void {
    this.target.removeEventListener('keydown', this.boundHandler as EventListener);
  }

  /**
   * Enable/disable all keyboard shortcuts
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if keyboard shortcuts are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Add a custom key binding
   */
  addBinding(binding: KeyBinding): void {
    this.bindings.push(binding);
  }

  /**
   * Remove a key binding by key code
   */
  removeBinding(key: string, modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean }): void {
    this.bindings = this.bindings.filter(b => {
      if (b.key !== key) return true;
      if (modifiers) {
        if (modifiers.ctrl !== undefined && b.ctrl !== modifiers.ctrl) return true;
        if (modifiers.shift !== undefined && b.shift !== modifiers.shift) return true;
        if (modifiers.alt !== undefined && b.alt !== modifiers.alt) return true;
      }
      return false;
    });
  }

  /**
   * Update an existing binding
   */
  updateBinding(key: string, updates: Partial<KeyBinding>): void {
    const binding = this.bindings.find(b => b.key === key);
    if (binding) {
      Object.assign(binding, updates);
    }
  }

  /**
   * Enable/disable a specific binding
   */
  setBindingEnabled(key: string, enabled: boolean): void {
    const binding = this.bindings.find(b => b.key === key);
    if (binding) {
      binding.enabled = enabled;
    }
  }

  /**
   * Get all current bindings
   */
  getBindings(): KeyBinding[] {
    return [...this.bindings];
  }

  /**
   * Get binding for a specific key
   */
  getBinding(key: string): KeyBinding | undefined {
    return this.bindings.find(b => b.key === key);
  }

  /**
   * Get a formatted list of all shortcuts (for help display)
   */
  getShortcutList(): { key: string; description: string }[] {
    return this.bindings
      .filter(b => b.enabled !== false && b.description)
      .map(b => ({
        key: this.formatKeyBinding(b),
        description: b.description || b.action,
      }));
  }

  /**
   * Format a key binding for display
   */
  formatKeyBinding(binding: KeyBinding): string {
    const parts: string[] = [];
    if (binding.ctrl) parts.push('Ctrl');
    if (binding.alt) parts.push('Alt');
    if (binding.shift) parts.push('Shift');
    if (binding.meta) parts.push('⌘');
    
    // Convert key code to display name
    let keyName = binding.key;
    if (keyName.startsWith('Key')) {
      keyName = keyName.slice(3);
    } else if (keyName.startsWith('Digit')) {
      keyName = keyName.slice(5);
    } else if (keyName === 'Equal') {
      keyName = '+';
    } else if (keyName === 'Minus') {
      keyName = '-';
    } else if (keyName.startsWith('Arrow')) {
      keyName = '←→↑↓'['LeftRightUpDown'.indexOf(keyName.slice(5)) / 5 | 0] || keyName;
    }
    
    parts.push(keyName);
    return parts.join('+');
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.enabled) return;

    // Skip if typing in an input element
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Find matching binding
    const binding = this.findMatchingBinding(e);
    if (!binding || binding.enabled === false) return;

    // Execute action
    const executed = this.executeAction(binding);
    
    if (executed && this.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  /**
   * Find a binding that matches the current key event
   */
  private findMatchingBinding(e: KeyboardEvent): KeyBinding | undefined {
    return this.bindings.find(b => {
      if (b.key !== e.code) return false;
      if (b.ctrl && !e.ctrlKey && !e.metaKey) return false;
      if (b.shift && !e.shiftKey) return false;
      if (b.alt && !e.altKey) return false;
      if (b.meta && !e.metaKey) return false;
      
      // Also check that extra modifiers aren't pressed
      if (!b.ctrl && (e.ctrlKey || e.metaKey)) return false;
      if (!b.shift && e.shiftKey) return false;
      if (!b.alt && e.altKey) return false;
      
      return true;
    });
  }

  /**
   * Execute the action for a binding
   */
  private executeAction(binding: KeyBinding): boolean {
    const { action, handler } = binding;

    switch (action) {
      case 'resetZoom':
        this.callbacks.onResetZoom?.();
        return true;
      case 'autoScale':
        this.callbacks.onAutoScale?.();
        return true;
      case 'zoomIn':
        this.callbacks.onZoomIn?.();
        return true;
      case 'zoomOut':
        this.callbacks.onZoomOut?.();
        return true;
      case 'panLeft':
        this.callbacks.onPanLeft?.();
        return true;
      case 'panRight':
        this.callbacks.onPanRight?.();
        return true;
      case 'panUp':
        this.callbacks.onPanUp?.();
        return true;
      case 'panDown':
        this.callbacks.onPanDown?.();
        return true;
      case 'togglePan':
        this.callbacks.onTogglePan?.();
        return true;
      case 'toggleSelect':
        this.callbacks.onToggleSelect?.();
        return true;
      case 'clearSelection':
      case 'escape':
        this.callbacks.onEscape?.();
        this.callbacks.onClearSelection?.();
        return true;
      case 'deleteSelected':
        this.callbacks.onDeleteSelected?.();
        return true;
      case 'selectAll':
        this.callbacks.onSelectAll?.();
        return true;
      case 'copy':
        this.callbacks.onCopy?.();
        return true;
      case 'exportImage':
        this.callbacks.onExportImage?.();
        return true;
      case 'toggleLegend':
        this.callbacks.onToggleLegend?.();
        return true;
      case 'toggleDebug':
        this.callbacks.onToggleDebug?.();
        return true;
      case 'undo':
        this.callbacks.onUndo?.();
        return true;
      case 'redo':
        this.callbacks.onRedo?.();
        return true;
      case 'custom':
        handler?.();
        return true;
      default:
        return false;
    }
  }

  /**
   * Destroy the manager and cleanup
   */
  destroy(): void {
    this.detach();
    this.bindings = [];
  }
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Create a simple key binding configuration
 */
export function createKeyBinding(
  key: string,
  action: KeyAction,
  options?: Partial<KeyBinding>
): KeyBinding {
  return {
    key,
    action,
    ...options,
  };
}

/**
 * Parse a shortcut string (e.g., "Ctrl+R") into a KeyBinding
 */
export function parseShortcut(shortcut: string, action: KeyAction): KeyBinding {
  const parts = shortcut.split('+').map(p => p.trim().toLowerCase());
  const binding: KeyBinding = {
    key: '',
    action,
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
  };

  for (const part of parts) {
    switch (part) {
      case 'ctrl':
      case 'control':
        binding.ctrl = true;
        break;
      case 'shift':
        binding.shift = true;
        break;
      case 'alt':
        binding.alt = true;
        break;
      case 'meta':
      case 'cmd':
      case 'command':
        binding.meta = true;
        break;
      default:
        // Convert to key code
        if (part.length === 1) {
          if (/[a-z]/i.test(part)) {
            binding.key = 'Key' + part.toUpperCase();
          } else if (/[0-9]/.test(part)) {
            binding.key = 'Digit' + part;
          } else if (part === '+') {
            binding.key = 'Equal';
          } else if (part === '-') {
            binding.key = 'Minus';
          }
        } else {
          // Handle special keys
          const specialKeys: Record<string, string> = {
            'escape': 'Escape',
            'esc': 'Escape',
            'enter': 'Enter',
            'return': 'Enter',
            'space': 'Space',
            'tab': 'Tab',
            'delete': 'Delete',
            'backspace': 'Backspace',
            'left': 'ArrowLeft',
            'right': 'ArrowRight',
            'up': 'ArrowUp',
            'down': 'ArrowDown',
          };
          binding.key = specialKeys[part] || part;
        }
    }
  }

  return binding;
}
