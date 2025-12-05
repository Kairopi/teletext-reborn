/**
 * Teletext Reborn - Page Transition Animations
 * 
 * GSAP-powered page transitions for authentic Teletext navigation experience.
 * Includes fade, slide, and static flash effects.
 * 
 * Requirements: 3.6, 25.1, 30.9, 31.1-31.10
 * 
 * Transition Types:
 * - fade: Default transition with vertical movement
 * - slideLeft: Horizontal slide for "next" navigation
 * - slideRight: Horizontal slide for "previous" navigation
 * - slideUp: Vertical slide for page number input
 * - fastext: Fade with color flash for Fastext buttons
 */

import gsap from 'gsap';
import { playStatic } from '../services/soundManager.js';

/**
 * Transition state management
 * @type {{ isTransitioning: boolean, currentTimeline: gsap.core.Timeline | null, visitedPages: Set<number> }}
 */
let transitionState = {
  isTransitioning: false,
  currentTimeline: null,
  visitedPages: new Set()
};

/**
 * Transition type constants
 */
export const TRANSITION_TYPES = {
  FADE: 'fade',
  SLIDE_LEFT: 'slideLeft',
  SLIDE_RIGHT: 'slideRight',
  SLIDE_UP: 'slideUp',
  SLIDE_DOWN: 'slideDown',
  FASTEXT: 'fastext'
};

/**
 * Default transition durations (in seconds)
 * Based on Requirements 31.1-31.4
 */
export const TRANSITION_DURATIONS = {
  EXIT: 0.15,           // Req 31.1: Exit fade duration
  STATIC_FLASH: 0.05,   // Req 31.2: Static flash duration (50ms)
  HEADER_ENTER: 0.1,    // Req 31.3: Header enter duration
  CONTENT_ENTER: 0.2,   // Req 31.3: Content enter duration
  NAV_ENTER: 0.1,       // Req 31.3: Navigation enter duration
  LINE_STAGGER: 0.03,   // Req 31.4: Content line stagger delay
  FAST_TOTAL: 0.2       // Req 31.9: Fast transition for revisited pages
};

/**
 * Check if a page has been visited before
 * @param {number} pageNumber - Page number to check
 * @returns {boolean} True if page was previously visited
 */
export function hasVisitedPage(pageNumber) {
  return transitionState.visitedPages.has(pageNumber);
}

/**
 * Mark a page as visited
 * @param {number} pageNumber - Page number to mark
 */
export function markPageVisited(pageNumber) {
  transitionState.visitedPages.add(pageNumber);
}

/**
 * Clear visited pages history
 */
export function clearVisitedPages() {
  transitionState.visitedPages.clear();
}


/**
 * Check if a transition is currently in progress
 * @returns {boolean} True if transitioning
 */
export function isTransitioning() {
  return transitionState.isTransitioning;
}

/**
 * Get the slide offset based on transition type
 * @param {string} type - Transition type
 * @param {boolean} isExit - Whether this is exit animation
 * @returns {{ x: number, y: number }} Offset values
 */
function getSlideOffset(type, isExit) {
  const offset = 30; // pixels
  
  switch (type) {
    case TRANSITION_TYPES.SLIDE_LEFT:
      return { x: isExit ? -offset : offset, y: 0 };
    case TRANSITION_TYPES.SLIDE_RIGHT:
      return { x: isExit ? offset : -offset, y: 0 };
    case TRANSITION_TYPES.SLIDE_UP:
      return { x: 0, y: isExit ? -offset : offset };
    case TRANSITION_TYPES.SLIDE_DOWN:
      return { x: 0, y: isExit ? offset : -offset };
    case TRANSITION_TYPES.FADE:
    case TRANSITION_TYPES.FASTEXT:
    default:
      // Req 31.1: Fade out from bottom to top
      return { x: 0, y: isExit ? -20 : 20 };
  }
}

/**
 * Create the exit animation timeline
 * Req 31.1: Fade out content from bottom to top with 0.15s duration
 * 
 * @param {Object} options - Animation options
 * @param {HTMLElement} options.contentArea - Content area element
 * @param {string} [options.type='fade'] - Transition type
 * @param {boolean} [options.fast=false] - Use fast transition
 * @returns {gsap.core.Timeline} Exit animation timeline
 */
export function createExitTimeline(options = {}) {
  const { contentArea, type = TRANSITION_TYPES.FADE, fast = false } = options;
  
  if (!contentArea) {
    console.error('Content area element required for exit animation');
    return gsap.timeline();
  }
  
  const tl = gsap.timeline();
  const offset = getSlideOffset(type, true);
  const duration = fast ? TRANSITION_DURATIONS.FAST_TOTAL / 2 : TRANSITION_DURATIONS.EXIT;
  
  // Req 31.1: Exit animation - fade out with movement
  tl.to(contentArea, {
    opacity: 0,
    x: offset.x,
    y: offset.y,
    duration: duration,
    ease: 'power2.in' // Req 25.1: power2 for transitions
  });
  
  return tl;
}

/**
 * Create the static flash animation timeline
 * Req 31.2: Brief static/noise flash (50ms) after content fades
 * 
 * @param {Object} options - Animation options
 * @param {HTMLElement} [options.staticOverlay] - Static overlay element
 * @returns {gsap.core.Timeline} Static flash timeline
 */
export function createStaticFlashTimeline(options = {}) {
  const { staticOverlay } = options;
  
  const tl = gsap.timeline();
  
  // Play static sound effect during transition
  playStatic();
  
  if (!staticOverlay) {
    // If no static overlay, just add a brief pause
    tl.to({}, { duration: TRANSITION_DURATIONS.STATIC_FLASH * 2 });
    return tl;
  }
  
  // Req 31.2, 30.9: Brief static flash between pages
  tl.to(staticOverlay, {
    opacity: 0.5,
    duration: TRANSITION_DURATIONS.STATIC_FLASH,
    ease: 'power2.in'
  })
  .to(staticOverlay, {
    opacity: 0,
    duration: TRANSITION_DURATIONS.STATIC_FLASH,
    ease: 'power2.out'
  });
  
  return tl;
}

/**
 * Create the enter animation timeline
 * Req 31.3: Header first (0.1s), content (0.2s), navigation (0.1s)
 * Req 31.4: Content lines stagger effect (0.03s delay)
 * 
 * @param {Object} options - Animation options
 * @param {HTMLElement} options.contentArea - Content area element
 * @param {HTMLElement} [options.headerBar] - Header bar element
 * @param {HTMLElement} [options.navigationBar] - Navigation bar element
 * @param {string} [options.type='fade'] - Transition type
 * @param {boolean} [options.fast=false] - Use fast transition
 * @returns {gsap.core.Timeline} Enter animation timeline
 */
export function createEnterTimeline(options = {}) {
  const { 
    contentArea, 
    headerBar, 
    navigationBar, 
    type = TRANSITION_TYPES.FADE,
    fast = false 
  } = options;
  
  if (!contentArea) {
    console.error('Content area element required for enter animation');
    return gsap.timeline();
  }
  
  const tl = gsap.timeline();
  const offset = getSlideOffset(type, false);
  
  // Calculate durations based on fast mode
  const headerDuration = fast ? 0.05 : TRANSITION_DURATIONS.HEADER_ENTER;
  const contentDuration = fast ? 0.1 : TRANSITION_DURATIONS.CONTENT_ENTER;
  const navDuration = fast ? 0.05 : TRANSITION_DURATIONS.NAV_ENTER;
  const staggerDelay = fast ? 0.015 : TRANSITION_DURATIONS.LINE_STAGGER;
  
  // Set initial state for content area
  tl.set(contentArea, {
    opacity: 0,
    x: -offset.x,
    y: -offset.y
  });
  
  // Req 31.3: Header enters first (if provided)
  if (headerBar) {
    tl.from(headerBar, {
      opacity: 0,
      duration: headerDuration,
      ease: 'power2.out'
    });
  }
  
  // Req 31.3: Content area enters
  tl.to(contentArea, {
    opacity: 1,
    x: 0,
    y: 0,
    duration: contentDuration,
    ease: 'power2.out' // Req 25.1
  }, headerBar ? '-=0.05' : 0);
  
  // Req 31.4: Stagger content lines
  const contentLines = contentArea.querySelectorAll('.content-line');
  if (contentLines.length > 0) {
    tl.from(contentLines, {
      opacity: 0,
      y: 5,
      duration: 0.1,
      stagger: staggerDelay,
      ease: 'power1.out'
    }, '-=0.1');
  }
  
  // Req 31.3: Navigation enters last (if provided)
  if (navigationBar) {
    tl.from(navigationBar, {
      opacity: 0,
      duration: navDuration,
      ease: 'power2.out'
    }, '-=0.05');
  }
  
  return tl;
}


/**
 * Create a Fastext color flash effect
 * Req 31.7: Fade with color flash matching the button pressed
 * 
 * @param {Object} options - Animation options
 * @param {HTMLElement} options.element - Element to flash
 * @param {string} options.color - Fastext color (red, green, yellow, cyan)
 * @returns {gsap.core.Timeline} Color flash timeline
 */
export function createFastextFlashTimeline(options = {}) {
  const { element, color } = options;
  
  const tl = gsap.timeline();
  
  if (!element || !color) {
    return tl;
  }
  
  // Map color names to hex values
  const colorMap = {
    red: '#FF0000',
    green: '#00FF00',
    yellow: '#FFFF00',
    cyan: '#00FFFF'
  };
  
  const hexColor = colorMap[color.toLowerCase()] || color;
  
  // Brief color flash
  tl.to(element, {
    boxShadow: `0 0 30px ${hexColor}, inset 0 0 20px ${hexColor}`,
    duration: 0.1,
    ease: 'power2.in'
  })
  .to(element, {
    boxShadow: 'none',
    duration: 0.15,
    ease: 'power2.out'
  });
  
  return tl;
}

/**
 * Create a complete page transition timeline
 * Combines exit, static flash, and enter animations
 * 
 * @param {Object} options - Transition options
 * @param {HTMLElement} options.contentArea - Content area element
 * @param {HTMLElement} [options.headerBar] - Header bar element
 * @param {HTMLElement} [options.navigationBar] - Navigation bar element
 * @param {HTMLElement} [options.staticOverlay] - Static overlay element
 * @param {string} [options.type='fade'] - Transition type
 * @param {string} [options.fastextColor] - Fastext button color (for fastext transitions)
 * @param {number} [options.targetPage] - Target page number (for visited page check)
 * @param {Function} [options.onExitComplete] - Callback after exit animation (load new content here)
 * @param {Function} [options.onComplete] - Callback when transition completes
 * @param {Function} [options.onStart] - Callback when transition starts
 * @returns {gsap.core.Timeline} Complete transition timeline
 */
export function createPageTransition(options = {}) {
  const {
    contentArea,
    headerBar,
    navigationBar,
    staticOverlay,
    type = TRANSITION_TYPES.FADE,
    fastextColor,
    targetPage,
    onExitComplete,
    onComplete,
    onStart
  } = options;
  
  if (!contentArea) {
    console.error('Content area element required for page transition');
    return gsap.timeline();
  }
  
  // Req 31.9: Use fast transition for previously visited pages
  const fast = targetPage !== undefined && hasVisitedPage(targetPage);
  
  // Mark page as visited
  if (targetPage !== undefined) {
    markPageVisited(targetPage);
  }
  
  // Create main timeline
  const tl = gsap.timeline({
    onStart: () => {
      // Req 31.10: Disable navigation during transition
      transitionState.isTransitioning = true;
      transitionState.currentTimeline = tl;
      if (onStart) onStart();
    },
    onComplete: () => {
      transitionState.isTransitioning = false;
      transitionState.currentTimeline = null;
      if (onComplete) onComplete();
    }
  });
  
  // Store timeline reference
  transitionState.currentTimeline = tl;
  
  // Exit animation
  tl.add(createExitTimeline({ contentArea, type, fast }));
  
  // Fastext color flash (if applicable)
  if (type === TRANSITION_TYPES.FASTEXT && fastextColor && contentArea) {
    tl.add(createFastextFlashTimeline({ 
      element: contentArea.parentElement || contentArea, 
      color: fastextColor 
    }), '-=0.1');
  }
  
  // Static flash
  tl.add(createStaticFlashTimeline({ staticOverlay }));
  
  // Callback to load new content
  if (onExitComplete) {
    tl.call(onExitComplete);
  }
  
  // Enter animation
  tl.add(createEnterTimeline({ contentArea, headerBar, navigationBar, type, fast }));
  
  return tl;
}

/**
 * Play a page transition
 * Main entry point for page transitions
 * 
 * @param {Object} options - Transition options (same as createPageTransition)
 * @returns {gsap.core.Timeline | null} The timeline or null if already transitioning
 */
export function playPageTransition(options = {}) {
  // Req 31.10: Prevent interruption during transition
  if (transitionState.isTransitioning) {
    console.warn('Page transition already in progress');
    return null;
  }
  
  return createPageTransition(options);
}

/**
 * Determine the appropriate transition type based on navigation context
 * 
 * @param {Object} context - Navigation context
 * @param {number} context.fromPage - Source page number
 * @param {number} context.toPage - Target page number
 * @param {string} [context.trigger] - What triggered the navigation ('fastext', 'input', 'prev', 'next', 'keyboard')
 * @param {string} [context.fastextColor] - Fastext button color if triggered by fastext
 * @returns {{ type: string, fastextColor?: string }} Transition configuration
 */
export function getTransitionType(context = {}) {
  const { fromPage, toPage, trigger, fastextColor } = context;
  
  // Req 31.7: Fastext button navigation
  if (trigger === 'fastext' && fastextColor) {
    return { type: TRANSITION_TYPES.FASTEXT, fastextColor };
  }
  
  // Req 31.5: Horizontal slide for Prev/Next
  if (trigger === 'prev') {
    return { type: TRANSITION_TYPES.SLIDE_RIGHT };
  }
  if (trigger === 'next') {
    return { type: TRANSITION_TYPES.SLIDE_LEFT };
  }
  
  // Req 31.6: Vertical slide for page number input
  if (trigger === 'input') {
    return { type: TRANSITION_TYPES.SLIDE_UP };
  }
  
  // Default: determine by page number comparison
  if (fromPage !== undefined && toPage !== undefined) {
    if (toPage > fromPage) {
      return { type: TRANSITION_TYPES.SLIDE_LEFT };
    } else if (toPage < fromPage) {
      return { type: TRANSITION_TYPES.SLIDE_RIGHT };
    }
  }
  
  // Default fade transition
  return { type: TRANSITION_TYPES.FADE };
}

/**
 * Cancel the current transition
 */
export function cancelTransition() {
  if (transitionState.currentTimeline) {
    transitionState.currentTimeline.kill();
    transitionState.currentTimeline = null;
  }
  transitionState.isTransitioning = false;
}

/**
 * Reset transition state (for testing)
 */
export function resetTransitionState() {
  cancelTransition();
  transitionState.visitedPages.clear();
}

/**
 * Get the current transition state (for testing)
 * @returns {{ isTransitioning: boolean, visitedPagesCount: number }}
 */
export function getTransitionState() {
  return {
    isTransitioning: transitionState.isTransitioning,
    visitedPagesCount: transitionState.visitedPages.size
  };
}

