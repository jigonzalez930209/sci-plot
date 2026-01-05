/**
 * Orbit controller for mouse/touch interaction with OrbitCamera.
 * Handles rotation, zoom, and pan gestures.
 */

import type { OrbitCamera } from '../camera/OrbitCamera';

export interface OrbitControllerOptions {
  rotateSpeed?: number;
  zoomSpeed?: number;
  panSpeed?: number;
  enableRotate?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  rotateButton?: number;   // 0 = left, 1 = middle, 2 = right
  panButton?: number;
  dampingFactor?: number;  // 0 = no damping, 1 = instant stop
}

interface PointerState {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
}

export class OrbitController {
  private camera: OrbitCamera;
  private element: HTMLElement;
  
  // Settings
  rotateSpeed = 0.005;
  zoomSpeed = 0.001;
  panSpeed = 0.01;
  enableRotate = true;
  enableZoom = true;
  enablePan = true;
  rotateButton = 0;
  panButton = 2;
  dampingFactor = 0.1;
  
  // State
  private isRotating = false;
  private isPanning = false;
  private lastX = 0;
  private lastY = 0;
  
  // Touch state
  private pointers: Map<number, PointerState> = new Map();
  private lastPinchDistance = 0;
  
  // Velocity for damping
  private velocityTheta = 0;
  private velocityPhi = 0;
  private velocityRadius = 0;
  
  // Callbacks
  private onChangeCallback?: () => void;
  
  // Bound handlers for cleanup
  private boundHandlers: {
    onPointerDown: (e: PointerEvent) => void;
    onPointerMove: (e: PointerEvent) => void;
    onPointerUp: (e: PointerEvent) => void;
    onWheel: (e: WheelEvent) => void;
    onContextMenu: (e: Event) => void;
  };
  
  constructor(
    camera: OrbitCamera,
    element: HTMLElement,
    options: OrbitControllerOptions = {}
  ) {
    this.camera = camera;
    this.element = element;
    
    if (options.rotateSpeed !== undefined) this.rotateSpeed = options.rotateSpeed;
    if (options.zoomSpeed !== undefined) this.zoomSpeed = options.zoomSpeed;
    if (options.panSpeed !== undefined) this.panSpeed = options.panSpeed;
    if (options.enableRotate !== undefined) this.enableRotate = options.enableRotate;
    if (options.enableZoom !== undefined) this.enableZoom = options.enableZoom;
    if (options.enablePan !== undefined) this.enablePan = options.enablePan;
    if (options.rotateButton !== undefined) this.rotateButton = options.rotateButton;
    if (options.panButton !== undefined) this.panButton = options.panButton;
    if (options.dampingFactor !== undefined) this.dampingFactor = options.dampingFactor;
    
    this.boundHandlers = {
      onPointerDown: this.onPointerDown.bind(this),
      onPointerMove: this.onPointerMove.bind(this),
      onPointerUp: this.onPointerUp.bind(this),
      onWheel: this.onWheel.bind(this),
      onContextMenu: (e: Event) => e.preventDefault(),
    };
    
    this.attach();
  }
  
  /**
   * Attach event listeners to element.
   */
  private attach(): void {
    const { element, boundHandlers } = this;
    
    element.addEventListener('pointerdown', boundHandlers.onPointerDown);
    element.addEventListener('pointermove', boundHandlers.onPointerMove);
    element.addEventListener('pointerup', boundHandlers.onPointerUp);
    element.addEventListener('pointercancel', boundHandlers.onPointerUp);
    element.addEventListener('pointerleave', boundHandlers.onPointerUp);
    element.addEventListener('wheel', boundHandlers.onWheel, { passive: false });
    element.addEventListener('contextmenu', boundHandlers.onContextMenu);
    
    element.style.touchAction = 'none';
  }
  
  /**
   * Detach event listeners.
   */
  detach(): void {
    const { element, boundHandlers } = this;
    
    element.removeEventListener('pointerdown', boundHandlers.onPointerDown);
    element.removeEventListener('pointermove', boundHandlers.onPointerMove);
    element.removeEventListener('pointerup', boundHandlers.onPointerUp);
    element.removeEventListener('pointercancel', boundHandlers.onPointerUp);
    element.removeEventListener('pointerleave', boundHandlers.onPointerUp);
    element.removeEventListener('wheel', boundHandlers.onWheel);
    element.removeEventListener('contextmenu', boundHandlers.onContextMenu);
  }
  
  /**
   * Set callback for camera changes.
   */
  onChange(callback: () => void): void {
    this.onChangeCallback = callback;
  }
  
  private notifyChange(): void {
    if (this.onChangeCallback) {
      this.onChangeCallback();
    }
  }
  
  private onPointerDown(e: PointerEvent): void {
    this.element.setPointerCapture(e.pointerId);
    
    this.pointers.set(e.pointerId, {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
    });
    
    if (this.pointers.size === 1) {
      // Single pointer - rotate or pan
      if (e.button === this.rotateButton && this.enableRotate) {
        this.isRotating = true;
        this.isPanning = false;
      } else if (e.button === this.panButton && this.enablePan) {
        this.isPanning = true;
        this.isRotating = false;
      }
      
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    } else if (this.pointers.size === 2) {
      // Two pointers - pinch zoom
      this.isRotating = false;
      this.isPanning = false;
      this.lastPinchDistance = this.getPinchDistance();
    }
  }
  
  private onPointerMove(e: PointerEvent): void {
    const pointer = this.pointers.get(e.pointerId);
    if (!pointer) return;
    
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    
    if (this.pointers.size === 1) {
      const deltaX = e.clientX - this.lastX;
      const deltaY = e.clientY - this.lastY;
      
      if (this.isRotating && this.enableRotate) {
        this.camera.rotate(
          -deltaX * this.rotateSpeed,
          deltaY * this.rotateSpeed
        );
        this.velocityTheta = -deltaX * this.rotateSpeed;
        this.velocityPhi = deltaY * this.rotateSpeed;
        this.notifyChange();
      } else if (this.isPanning && this.enablePan) {
        const panScale = this.camera.radius * this.panSpeed;
        this.camera.pan(-deltaX * panScale, deltaY * panScale);
        this.notifyChange();
      }
      
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    } else if (this.pointers.size === 2 && this.enableZoom) {
      // Pinch zoom
      const distance = this.getPinchDistance();
      const delta = this.lastPinchDistance - distance;
      
      this.camera.zoom(delta * this.zoomSpeed * this.camera.radius);
      this.lastPinchDistance = distance;
      this.notifyChange();
    }
  }
  
  private onPointerUp(e: PointerEvent): void {
    this.element.releasePointerCapture(e.pointerId);
    this.pointers.delete(e.pointerId);
    
    if (this.pointers.size === 0) {
      this.isRotating = false;
      this.isPanning = false;
    } else if (this.pointers.size === 1) {
      // Switched from pinch to single pointer
      const remaining = this.pointers.values().next().value;
      if (remaining) {
        this.lastX = remaining.x;
        this.lastY = remaining.y;
      }
    }
  }
  
  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    
    if (!this.enableZoom) return;
    
    // Normalize wheel delta across browsers
    let delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 40;  // Lines
    if (e.deltaMode === 2) delta *= 800; // Pages
    
    // Zoom proportional to current radius
    const zoomAmount = delta * this.zoomSpeed * this.camera.radius * 0.1;
    this.camera.zoom(zoomAmount);
    this.velocityRadius = zoomAmount;
    this.notifyChange();
  }
  
  private getPinchDistance(): number {
    if (this.pointers.size < 2) return 0;
    
    const pointerArray = Array.from(this.pointers.values());
    const dx = pointerArray[0].x - pointerArray[1].x;
    const dy = pointerArray[0].y - pointerArray[1].y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Update damping (call each frame for smooth deceleration).
   * Returns true if camera is still moving.
   */
  update(): boolean {
    if (this.dampingFactor <= 0) return false;
    if (this.isRotating || this.isPanning) return false;
    
    const threshold = 0.0001;
    let moving = false;
    
    if (Math.abs(this.velocityTheta) > threshold || Math.abs(this.velocityPhi) > threshold) {
      this.camera.rotate(this.velocityTheta, this.velocityPhi);
      this.velocityTheta *= (1 - this.dampingFactor);
      this.velocityPhi *= (1 - this.dampingFactor);
      moving = true;
    }
    
    if (Math.abs(this.velocityRadius) > threshold) {
      this.camera.zoom(this.velocityRadius);
      this.velocityRadius *= (1 - this.dampingFactor);
      moving = true;
    }
    
    if (moving) {
      this.notifyChange();
    }
    
    return moving;
  }
  
  /**
   * Stop all momentum.
   */
  stopMomentum(): void {
    this.velocityTheta = 0;
    this.velocityPhi = 0;
    this.velocityRadius = 0;
  }
  
  /**
   * Clean up resources.
   */
  destroy(): void {
    this.detach();
    this.pointers.clear();
  }
}
