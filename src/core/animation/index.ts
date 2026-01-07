/**
 * Animation Module
 * 
 * Exports animation utilities for smooth chart transitions.
 */

export {
  AnimationEngine,
  easings,
  DEFAULT_ANIMATION_CONFIG,
  mergeAnimationConfig,
  getSharedAnimationEngine,
  type AnimationOptions,
  type AnimationHandle,
  type BoundsAnimation,
  type ChartAnimationConfig,
  type EasingFunction,
  type EasingName,
} from './AnimationEngine';
