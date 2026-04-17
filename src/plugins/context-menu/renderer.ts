/**
 * Context Menu Renderer
 * 
 * Handles DOM creation and rendering of the context menu.
 * 
 * @module plugins/context-menu/renderer
 */

import type { 
  MenuItem, 
  MenuStyle, 
  MenuPosition,
  MenuContext,
  MenuState 
} from "./types";

// ============================================
// Default Styles
// ============================================

const DEFAULT_STYLE: Required<MenuStyle> = {
  backgroundColor: 'rgba(30, 30, 40, 0.95)',
  textColor: '#e0e0e0',
  borderColor: 'rgba(100, 100, 120, 0.5)',
  borderRadius: '8px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '13px',
  itemPadding: '8px 16px',
  hoverBackground: 'rgba(0, 242, 255, 0.15)',
  separatorColor: 'rgba(100, 100, 120, 0.3)',
  disabledOpacity: 0.4,
  minWidth: '180px',
  maxWidth: '300px',
  animationDuration: '150ms'
};

// ============================================
// Menu Renderer Class
// ============================================

export class MenuRenderer {
  private _container: HTMLElement;
  private menuElement: HTMLDivElement | null = null;
  private style: Required<MenuStyle>;
  private onItemClick: (item: MenuItem, context: MenuContext) => void;
  private zIndex: number;

  constructor(
    container: HTMLElement,
    style: MenuStyle | undefined,
    zIndex: number,
    onItemClick: (item: MenuItem, context: MenuContext) => void
  ) {
    this._container = container;
    this.style = { ...DEFAULT_STYLE, ...style };
    this.zIndex = zIndex;
    this.onItemClick = onItemClick;
  }

  /**
   * Show the context menu
   */
  show(state: MenuState): void {
    this.hide();

    if (!state.items.length || !state.context) return;

    this.menuElement = this.createMenu(state.items, state.context);
    this.positionMenu(state.position);
    document.body.appendChild(this.menuElement);

    // Animate in
    requestAnimationFrame(() => {
      if (this.menuElement) {
        this.menuElement.style.opacity = '1';
        this.menuElement.style.transform = 'scale(1)';
      }
    });

    // Add click-outside listener
    document.addEventListener('mousedown', this.handleOutsideClick);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Hide the context menu
   */
  hide(): void {
    if (this.menuElement) {
      this.menuElement.style.opacity = '0';
      this.menuElement.style.transform = 'scale(0.95)';
      
      setTimeout(() => {
        if (this.menuElement?.parentNode) {
          this.menuElement.parentNode.removeChild(this.menuElement);
        }
        this.menuElement = null;
      }, 100);
    }

    document.removeEventListener('mousedown', this.handleOutsideClick);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Check if menu is visible
   */
  isVisible(): boolean {
    return this.menuElement !== null;
  }

  /**
   * Destroy the renderer
   */
  destroy(): void {
    this.hide();
  }

  /**
   * Update styling
   */
  updateStyle(style: MenuStyle): void {
    this.style = { ...DEFAULT_STYLE, ...style };
  }

  /**
   * Get container reference
   */
  getContainer(): HTMLElement {
    return this._container;
  }

  // ============================================
  // Private Methods
  // ============================================

  private createMenu(items: MenuItem[], context: MenuContext): HTMLDivElement {
    const menu = document.createElement('div');
    menu.className = 'velo-plot-context-menu';
    menu.style.cssText = this.getMenuStyle();

    items.forEach(item => {
      const element = this.createMenuItem(item, context);
      if (element) {
        menu.appendChild(element);
      }
    });

    return menu;
  }

  private createMenuItem(item: MenuItem, context: MenuContext): HTMLElement | null {
    // Hidden items
    if ('hidden' in item && item.hidden) return null;

    // Separator
    if (item.type === 'separator') {
      const sep = document.createElement('div');
      sep.className = 'velo-plot-menu-separator';
      sep.style.cssText = `
        height: 1px;
        margin: 4px 8px;
        background: ${this.style.separatorColor};
      `;
      return sep;
    }

    // Regular item
    const el = document.createElement('div');
    el.className = 'velo-plot-menu-item';
    
    const isDisabled = 'disabled' in item && Boolean(item.disabled);
    el.style.cssText = this.getItemStyle(isDisabled);

    // Icon
    if ('icon' in item && item.icon) {
      const icon = document.createElement('span');
      icon.className = 'velo-plot-menu-icon';
      icon.style.cssText = 'margin-right: 12px; width: 16px; text-align: center;';
      icon.textContent = item.icon;
      el.appendChild(icon);
    }

    // Label
    const label = document.createElement('span');
    label.className = 'velo-plot-menu-label';
    label.style.cssText = 'flex: 1;';
    label.textContent = item.label;
    el.appendChild(label);

    // Checkbox/Radio indicator
    if (item.type === 'checkbox') {
      const check = document.createElement('span');
      check.style.cssText = 'margin-left: 12px; width: 16px;';
      check.textContent = item.checked ? '✓' : '';
      el.appendChild(check);
    }

    if (item.type === 'radio') {
      const radio = document.createElement('span');
      radio.style.cssText = 'margin-left: 12px; width: 16px;';
      radio.textContent = item.selected ? '●' : '○';
      el.appendChild(radio);
    }

    // Shortcut
    if ('shortcut' in item && item.shortcut) {
      const shortcut = document.createElement('span');
      shortcut.className = 'velo-plot-menu-shortcut';
      shortcut.style.cssText = `
        margin-left: 24px;
        opacity: 0.5;
        font-size: 11px;
      `;
      shortcut.textContent = item.shortcut;
      el.appendChild(shortcut);
    }

    // Submenu arrow
    if (item.type === 'submenu') {
      const arrow = document.createElement('span');
      arrow.style.cssText = 'margin-left: 8px;';
      arrow.textContent = '▶';
      el.appendChild(arrow);

      // Create submenu on hover
      el.addEventListener('mouseenter', () => {
        this.showSubmenu(el, item.items, context);
      });
      el.addEventListener('mouseleave', (e: MouseEvent) => {
        this.hideSubmenu(el, e);
      });
    }

    // Hover effects
    if (!isDisabled) {
      el.addEventListener('mouseenter', () => {
        el.style.background = this.style.hoverBackground;
      });
      el.addEventListener('mouseleave', () => {
        el.style.background = 'transparent';
      });

      // Click handler
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (item.type !== 'submenu') {
          this.onItemClick(item, context);
        }
      });
    }

    return el;
  }

  private showSubmenu(parent: HTMLElement, items: MenuItem[], context: MenuContext): void {
    // Remove any existing submenu
    const existing = parent.querySelector('.velo-plot-submenu');
    if (existing) return;

    const submenu = document.createElement('div');
    submenu.className = 'velo-plot-submenu';
    submenu.style.cssText = `
      ${this.getMenuStyle()}
      position: absolute;
      left: 100%;
      top: 0;
      margin-left: 4px;
    `;

    items.forEach(item => {
      const el = this.createMenuItem(item, context);
      if (el) submenu.appendChild(el);
    });

    parent.style.position = 'relative';
    parent.appendChild(submenu);
  }

  private hideSubmenu(parent: HTMLElement, e: MouseEvent): void {
    const submenu = parent.querySelector('.velo-plot-submenu');
    if (!submenu) return;

    // Check if moving to submenu
    const rect = submenu.getBoundingClientRect();
    if (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    ) {
      return;
    }

    setTimeout(() => {
      submenu.remove();
    }, 100);
  }

  private positionMenu(position: MenuPosition): void {
    if (!this.menuElement) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Initial position
    this.menuElement.style.left = `${position.x}px`;
    this.menuElement.style.top = `${position.y}px`;

    // Get actual dimensions
    const rect = this.menuElement.getBoundingClientRect();

    // Adjust if off-screen
    if (rect.right > viewportWidth) {
      this.menuElement.style.left = `${position.x - rect.width}px`;
    }
    if (rect.bottom > viewportHeight) {
      this.menuElement.style.top = `${position.y - rect.height}px`;
    }
  }

  private getMenuStyle(): string {
    return `
      position: fixed;
      z-index: ${this.zIndex};
      background: ${this.style.backgroundColor};
      color: ${this.style.textColor};
      border: 1px solid ${this.style.borderColor};
      border-radius: ${this.style.borderRadius};
      box-shadow: ${this.style.boxShadow};
      font-family: ${this.style.fontFamily};
      font-size: ${this.style.fontSize};
      min-width: ${this.style.minWidth};
      max-width: ${this.style.maxWidth};
      padding: 4px 0;
      opacity: 0;
      transform: scale(0.95);
      transform-origin: top left;
      transition: opacity ${this.style.animationDuration}, transform ${this.style.animationDuration};
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    `;
  }

  private getItemStyle(disabled: boolean): string {
    return `
      display: flex;
      align-items: center;
      padding: ${this.style.itemPadding};
      cursor: ${disabled ? 'default' : 'pointer'};
      opacity: ${disabled ? this.style.disabledOpacity : 1};
      user-select: none;
      transition: background 100ms;
    `;
  }

  private handleOutsideClick = (e: MouseEvent): void => {
    if (this.menuElement && !this.menuElement.contains(e.target as Node)) {
      this.hide();
    }
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.hide();
    }
  };
}
