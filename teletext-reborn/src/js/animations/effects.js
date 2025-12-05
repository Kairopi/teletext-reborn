/**
 * Teletext Reborn - Micro-Interaction Effects
 * 
 * GSAP-powered micro-interactions for authentic Teletext experience.
 * Includes hover effects, click feedback, loading animations, and idle screen flicker.
 * 
 * Requirements: 2.9, 20.1-20.4, 27.1-27.10
 */

import gsap from 'gsap';

/**
 * Effects state management
 * @type {{ idleTimer: number | null, idleFlickerTween: gsap.core.Tween | null, isIdle: boolean, loadingTweens: Map<HTMLElement, gsap.core.Tween>, cursorTweens: Map<HTMLElement, gsap.core.Tween> }}
 */
let effectsState = {
  idleTimer: null,
  idleFlickerTween: null,
  isIdle: false,
  loadingTweens: new Map(),
  cursorTweens: new Map()
};

/**
 * Duration constants (in seconds)
 */
export const EFFECT_DURATIONS = {
  BUTTON_HOVER: 0.15,       // Req 27.1: Button hover duration
  BUTTON_CLICK: 0.1,        // Req 27.3: Button click duration
  MENU_HOVER: 0.15,         // Req 27.4: Menu item hover
  SUCCESS_FLASH: 0.3,       // Req 27.7: Success flash duration
  ERROR_SHAKE: 0.1,         // Req 27.8: Error shake per cycle
  CURSOR_BLINK: 0.53,       // Req 20.1: Cursor blink duration
  IDLE_FLICKER_MIN: 3,      // Req 2.9: Minimum idle flicker interval
  IDLE_FLICKER_MAX: 5,      // Req 2.9: Maximum idle flicker interval
  IDLE_TIMEOUT: 30          // Req 2.9: Seconds before idle state
};

// ============================================
// BUTTON HOVER AND CLICK EFFECTS (Req 27.1-27.3)
// ============================================

/**
 * Apply hover effect to a button element
 * Req 27.1: brightness 1.2, glow effect
 * Req 27.2: underline slide animation
 * 
 * @param {HTMLElement} element - Button element
 * @param {string} [glowColor='#FFFF00'] - Glow color (hex)
 * @returns {gsap.core.Tween} The hover tween
 */
export function buttonHoverIn(element, glowColor = '#FFFF00') {
  if (!element) return null;
  
  // Reset any existing animation
  gsap.killTweensOf(element);
  
  return gsap.to(element, {
    filter: 'brightness(1.2)',
    boxShadow: `0 0 8px ${glowColor}`,
    duration: EFFECT_DURATIONS.BUTTON_HOVER,
    ease: 'power1.out'
  });
}

/**
 * Remove hover effect from a button element
 * 
 * @param {HTMLElement} element - Button element
 * @returns {gsap.core.Tween} The hover out tween
 */
export function buttonHoverOut(element) {
  if (!element) return null;
  
  gsap.killTweensOf(element);
  
  return gsap.to(element, {
    filter: 'brightness(1)',
    boxShadow: '0 0 0px transparent',
    duration: EFFECT_DURATIONS.BUTTON_HOVER,
    ease: 'power1.out'
  });
}

/**
 * Apply click effect to a button element
 * Req 27.3: scale 0.95 for 100ms
 * 
 * @param {HTMLElement} element - Button element
 * @returns {gsap.core.Tween} The click tween
 */
export function buttonClick(element) {
  if (!element) return null;
  
  return gsap.to(element, {
    scale: 0.95,
    duration: EFFECT_DURATIONS.BUTTON_CLICK,
    ease: 'power2.out',
    yoyo: true,
    repeat: 1
  });
}

// ============================================
// MENU ITEM EFFECTS (Req 27.4, 27.5)
// ============================================

/**
 * Apply hover effect to a menu item
 * Req 27.4: cyan color, ► prefix animation
 * 
 * @param {HTMLElement} element - Menu item element
 * @returns {gsap.core.Timeline} The hover timeline
 */
export function menuItemHoverIn(element) {
  if (!element) return null;
  
  const tl = gsap.timeline();
  
  // Change color to cyan
  tl.to(element, {
    color: '#00FFFF',
    duration: EFFECT_DURATIONS.MENU_HOVER,
    ease: 'power1.out'
  });
  
  // Animate the ► prefix if it exists
  const prefix = element.querySelector('.menu-prefix, .menu-arrow');
  if (prefix) {
    tl.to(prefix, {
      opacity: 1,
      x: 0,
      duration: EFFECT_DURATIONS.MENU_HOVER,
      ease: 'power2.out'
    }, 0);
  }
  
  return tl;
}

/**
 * Remove hover effect from a menu item
 * 
 * @param {HTMLElement} element - Menu item element
 * @returns {gsap.core.Timeline} The hover out timeline
 */
export function menuItemHoverOut(element) {
  if (!element) return null;
  
  const tl = gsap.timeline();
  
  // Return to original color (yellow)
  tl.to(element, {
    color: '#FFFF00',
    duration: EFFECT_DURATIONS.MENU_HOVER,
    ease: 'power1.out'
  });
  
  // Hide the ► prefix
  const prefix = element.querySelector('.menu-prefix, .menu-arrow');
  if (prefix) {
    tl.to(prefix, {
      opacity: 0,
      x: -5,
      duration: EFFECT_DURATIONS.MENU_HOVER,
      ease: 'power2.out'
    }, 0);
  }
  
  return tl;
}

/**
 * Apply CRT flicker effect to clickable text
 * Req 27.5: Clickable text flicker effect
 * 
 * @param {HTMLElement} element - Text element
 * @returns {gsap.core.Timeline} The flicker timeline
 */
export function clickableTextFlicker(element) {
  if (!element) return null;
  
  const tl = gsap.timeline();
  
  tl.to(element, { opacity: 0.7, duration: 0.04, ease: 'none' })
    .to(element, { opacity: 1, duration: 0.04, ease: 'none' })
    .to(element, { opacity: 0.85, duration: 0.03, ease: 'none' })
    .to(element, { opacity: 1, duration: 0.04, ease: 'none' });
  
  return tl;
}

// ============================================
// NAVIGATION ARROW EFFECTS (Req 27.9)
// ============================================

/**
 * Apply hover effect to navigation arrow
 * Req 27.9: Scale 1.2x on hover
 * 
 * @param {HTMLElement} element - Arrow element
 * @returns {gsap.core.Tween} The hover tween
 */
export function navArrowHoverIn(element) {
  if (!element) return null;
  
  return gsap.to(element, {
    scale: 1.2,
    duration: EFFECT_DURATIONS.BUTTON_HOVER,
    ease: 'power2.out'
  });
}

/**
 * Remove hover effect from navigation arrow
 * 
 * @param {HTMLElement} element - Arrow element
 * @returns {gsap.core.Tween} The hover out tween
 */
export function navArrowHoverOut(element) {
  if (!element) return null;
  
  return gsap.to(element, {
    scale: 1,
    duration: EFFECT_DURATIONS.BUTTON_HOVER,
    ease: 'power2.out'
  });
}


// ============================================
// FEEDBACK ANIMATIONS (Req 27.7, 27.8, 20.1, 20.2)
// ============================================

/**
 * Apply success flash effect
 * Req 27.7: Green border flash (300ms)
 * 
 * @param {HTMLElement} element - Element to flash
 * @returns {gsap.core.Timeline} The flash timeline
 */
export function successFlash(element) {
  if (!element) return null;
  
  const tl = gsap.timeline();
  
  // Store original border
  const originalBorder = getComputedStyle(element).borderColor;
  
  tl.to(element, {
    borderColor: '#00FF00',
    boxShadow: '0 0 10px #00FF00',
    duration: EFFECT_DURATIONS.SUCCESS_FLASH / 2,
    ease: 'power2.in'
  })
  .to(element, {
    borderColor: originalBorder || 'transparent',
    boxShadow: 'none',
    duration: EFFECT_DURATIONS.SUCCESS_FLASH / 2,
    ease: 'power2.out'
  });
  
  return tl;
}

/**
 * Apply error shake effect with red border flash
 * Req 27.8: translateX ±3px, 3 cycles, 300ms total, red border flash
 * 
 * @param {HTMLElement} element - Element to shake
 * @returns {gsap.core.Timeline} The shake timeline
 */
export function errorShake(element) {
  if (!element) return null;
  
  const tl = gsap.timeline();
  
  // Store original border
  const originalBorder = getComputedStyle(element).borderColor;
  
  // Add red border flash
  tl.to(element, {
    borderColor: '#FF0000',
    boxShadow: '0 0 10px #FF0000',
    duration: 0.05,
    ease: 'power2.in'
  });
  
  // Shake animation: 3 cycles = 6 movements (left-right-left-right-left-right)
  // 300ms total / 6 movements = 50ms per movement
  tl.to(element, {
    x: 3,
    duration: 0.05,
    ease: 'power2.inOut'
  }, 0)
  .to(element, {
    x: -3,
    duration: 0.05,
    ease: 'power2.inOut'
  })
  .to(element, {
    x: 3,
    duration: 0.05,
    ease: 'power2.inOut'
  })
  .to(element, {
    x: -3,
    duration: 0.05,
    ease: 'power2.inOut'
  })
  .to(element, {
    x: 3,
    duration: 0.05,
    ease: 'power2.inOut'
  })
  .to(element, {
    x: 0,
    duration: 0.05,
    ease: 'power2.inOut'
  });
  
  // Remove red border after shake
  tl.to(element, {
    borderColor: originalBorder || 'transparent',
    boxShadow: 'none',
    duration: 0.05,
    ease: 'power2.out'
  });
  
  return tl;
}

/**
 * Create a blinking cursor animation
 * Req 20.1: Loading cursor blink (530ms)
 * 
 * @param {HTMLElement} cursorElement - Cursor element
 * @returns {gsap.core.Tween} The cursor tween (infinite)
 */
export function createCursorBlink(cursorElement) {
  if (!cursorElement) return null;
  
  // Kill any existing cursor animation on this element
  if (effectsState.cursorTweens.has(cursorElement)) {
    effectsState.cursorTweens.get(cursorElement).kill();
  }
  
  const tween = gsap.to(cursorElement, {
    opacity: 0,
    duration: EFFECT_DURATIONS.CURSOR_BLINK,
    repeat: -1,
    yoyo: true,
    ease: 'steps(1)'
  });
  
  effectsState.cursorTweens.set(cursorElement, tween);
  
  return tween;
}

/**
 * Stop cursor blink animation
 * 
 * @param {HTMLElement} cursorElement - Cursor element
 */
export function stopCursorBlink(cursorElement) {
  if (!cursorElement) return;
  
  if (effectsState.cursorTweens.has(cursorElement)) {
    effectsState.cursorTweens.get(cursorElement).kill();
    effectsState.cursorTweens.delete(cursorElement);
  }
  
  gsap.set(cursorElement, { opacity: 1 });
}

/**
 * Create animated loading dots
 * Req 20.2: LOADING. → LOADING.. → LOADING...
 * 
 * @param {HTMLElement} element - Text element
 * @param {string} [baseText='LOADING'] - Base text before dots
 * @returns {gsap.core.Timeline} The loading timeline (infinite)
 */
export function createLoadingDots(element, baseText = 'LOADING') {
  if (!element) return null;
  
  // Kill any existing loading animation on this element
  if (effectsState.loadingTweens.has(element)) {
    effectsState.loadingTweens.get(element).kill();
  }
  
  const tl = gsap.timeline({ repeat: -1 });
  
  // Use call() instead of set() with innerText to avoid GSAP warnings
  tl.call(() => { element.textContent = `${baseText}.`; })
    .to({}, { duration: 0.5 })
    .call(() => { element.textContent = `${baseText}..`; })
    .to({}, { duration: 0.5 })
    .call(() => { element.textContent = `${baseText}...`; })
    .to({}, { duration: 0.5 });
  
  effectsState.loadingTweens.set(element, tl);
  
  return tl;
}

/**
 * Stop loading dots animation
 * 
 * @param {HTMLElement} element - Text element
 */
export function stopLoadingDots(element) {
  if (!element) return;
  
  if (effectsState.loadingTweens.has(element)) {
    effectsState.loadingTweens.get(element).kill();
    effectsState.loadingTweens.delete(element);
  }
}

/**
 * Create block progress bar animation
 * Req 20.2: ░░░░░░░░░░ → ██████████
 * 
 * @param {HTMLElement} element - Progress bar element
 * @param {number} [duration=2] - Total animation duration in seconds
 * @param {Function} [onComplete] - Callback when complete
 * @returns {gsap.core.Timeline} The progress timeline
 */
export function createBlockProgress(element, duration = 2, onComplete) {
  if (!element) return null;
  
  const totalBlocks = 10;
  const emptyBlock = '░';
  const filledBlock = '█';
  
  const tl = gsap.timeline({ onComplete });
  
  // Animate each block filling using call() instead of set() with innerText
  for (let i = 0; i <= totalBlocks; i++) {
    const filled = filledBlock.repeat(i);
    const empty = emptyBlock.repeat(totalBlocks - i);
    
    tl.call(() => {
      element.textContent = filled + empty;
    }, null, i * (duration / totalBlocks));
  }
  
  return tl;
}

/**
 * Create an enhanced animated block progress bar with color transitions
 * Req 30.1: Loading animated block progress bar ░░░░░░░░░░ → ██████████
 * 
 * @param {HTMLElement} container - Container element for progress bar
 * @param {Object} options - Configuration options
 * @param {number} [options.duration=2] - Animation duration in seconds
 * @param {number} [options.blocks=20] - Number of blocks
 * @param {boolean} [options.showPercent=false] - Show percentage
 * @param {boolean} [options.loop=false] - Loop the animation
 * @param {Function} [options.onComplete] - Callback when complete
 * @returns {Object} Controller with start, stop, setProgress methods
 */
export function createAnimatedProgressBar(container, options = {}) {
  if (!container) return null;
  
  const {
    duration = 2,
    blocks = 20,
    showPercent = false,
    loop = false,
    onComplete
  } = options;
  
  const emptyBlock = '░';
  const filledBlock = '█';
  
  let timeline = null;
  let currentProgress = 0;
  
  // Create the progress bar HTML
  function render(progress) {
    const filledCount = Math.round((progress / 100) * blocks);
    const emptyCount = blocks - filledCount;
    
    const filled = `<span class="block-progress-filled">${filledBlock.repeat(filledCount)}</span>`;
    const empty = `<span class="block-progress-empty">${emptyBlock.repeat(emptyCount)}</span>`;
    const percent = showPercent ? ` <span class="block-progress-percent">${Math.round(progress)}%</span>` : '';
    
    container.innerHTML = `<div class="block-progress-animated">${filled}${empty}${percent}</div>`;
  }
  
  // Initialize
  render(0);
  
  /**
   * Start the progress animation
   */
  function start() {
    if (timeline) timeline.kill();
    
    currentProgress = 0;
    render(0);
    
    timeline = gsap.timeline({
      repeat: loop ? -1 : 0,
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });
    
    // Animate progress from 0 to 100
    timeline.to({ progress: 0 }, {
      progress: 100,
      duration,
      ease: 'none',
      onUpdate: function() {
        currentProgress = this.targets()[0].progress;
        render(currentProgress);
      }
    });
    
    return timeline;
  }
  
  /**
   * Stop the animation
   */
  function stop() {
    if (timeline) {
      timeline.kill();
      timeline = null;
    }
  }
  
  /**
   * Set progress to a specific value
   * @param {number} progress - Progress value 0-100
   */
  function setProgress(progress) {
    currentProgress = Math.max(0, Math.min(100, progress));
    render(currentProgress);
  }
  
  /**
   * Get current progress
   * @returns {number} Current progress 0-100
   */
  function getProgress() {
    return currentProgress;
  }
  
  return { start, stop, setProgress, getProgress, render };
}

/**
 * Create a simple loading indicator with block characters
 * Shows: ░░░░░░░░░░ with animated fill
 * 
 * @param {HTMLElement} element - Element to show loading in
 * @param {string} [text='LOADING'] - Loading text
 * @returns {Object} Controller with start, stop methods
 */
export function createBlockLoadingIndicator(element, text = 'LOADING') {
  if (!element) return null;
  
  let timeline = null;
  let cursorTween = null;
  
  function start() {
    // Create loading HTML
    element.innerHTML = `
      <div class="block-loading" style="text-align: center;">
        <div class="block-loading-text" style="color: var(--tt-yellow); margin-bottom: 8px;">
          ${text}<span class="block-loading-cursor" style="color: var(--tt-cyan);">█</span>
        </div>
        <div class="block-loading-bar" style="color: var(--tt-cyan);">░░░░░░░░░░░░░░░░░░░░</div>
      </div>
    `;
    
    const cursor = element.querySelector('.block-loading-cursor');
    const bar = element.querySelector('.block-loading-bar');
    
    // Blink cursor
    if (cursor) {
      cursorTween = gsap.to(cursor, {
        opacity: 0,
        duration: 0.53,
        repeat: -1,
        yoyo: true,
        ease: 'steps(1)'
      });
    }
    
    // Animate progress bar
    if (bar) {
      const blocks = 20;
      const emptyBlock = '░';
      const filledBlock = '█';
      
      timeline = gsap.timeline({ repeat: -1 });
      
      for (let i = 0; i <= blocks; i++) {
        timeline.call(() => {
          bar.textContent = filledBlock.repeat(i) + emptyBlock.repeat(blocks - i);
        }, null, i * 0.1);
      }
      
      // Reset after completing
      timeline.call(() => {
        bar.textContent = emptyBlock.repeat(blocks);
      }, null, (blocks + 1) * 0.1);
    }
    
    return { timeline, cursorTween };
  }
  
  function stop() {
    if (timeline) {
      timeline.kill();
      timeline = null;
    }
    if (cursorTween) {
      cursorTween.kill();
      cursorTween = null;
    }
  }
  
  return { start, stop };
}

/**
 * Create rotating spinner animation
 * Req 26.4: ◐ → ◓ → ◑ → ◒
 * 
 * @param {HTMLElement} element - Spinner element
 * @returns {gsap.core.Timeline} The spinner timeline (infinite)
 */
export function createSpinner(element) {
  if (!element) return null;
  
  const spinnerChars = ['◐', '◓', '◑', '◒'];
  
  const tl = gsap.timeline({ repeat: -1 });
  
  // Use call() instead of set() with innerText to avoid GSAP warnings
  spinnerChars.forEach((char, index) => {
    tl.call(() => { element.textContent = char; }, null, index * 0.15);
  });
  
  effectsState.loadingTweens.set(element, tl);
  
  return tl;
}

// ============================================
// EXTENDED LOADING STATES (Req 26.7, 26.8)
// ============================================

/**
 * Extended loading state manager
 * Req 26.7: "STILL LOADING - PLEASE WAIT" after 3 seconds
 * Req 26.8: "READY" flash in green on completion
 * 
 * @param {HTMLElement} container - Container element for loading UI
 * @param {Object} options - Configuration options
 * @param {number} [options.extendedDelay=3000] - Delay before showing extended message (ms)
 * @param {Function} [options.onReady] - Callback when ready is shown
 * @returns {Object} Controller with show, complete, and cancel methods
 */
export function createExtendedLoadingState(container, options = {}) {
  if (!container) return null;
  
  const { extendedDelay = 3000, onReady } = options;
  let extendedTimeout = null;
  let loadingTl = null;
  let isActive = false;
  
  /**
   * Show the loading state
   */
  function show() {
    if (isActive) return;
    isActive = true;
    
    // Create loading UI
    container.innerHTML = `
      <div class="loading-container">
        <div class="loading-text">LOADING<span class="loading-cursor">█</span></div>
        <div class="loading-progress">░░░░░░░░░░</div>
        <div class="loading-extended" style="display: none; margin-top: 16px; color: #FFFF00;"></div>
      </div>
    `;
    
    const textEl = container.querySelector('.loading-text');
    const cursorEl = container.querySelector('.loading-cursor');
    const extendedEl = container.querySelector('.loading-extended');
    
    // Start cursor blink
    if (cursorEl) {
      createCursorBlink(cursorEl);
    }
    
    // Start loading dots
    if (textEl) {
      loadingTl = createLoadingDots(textEl, 'LOADING');
    }
    
    // Set timeout for extended message (Req 26.7)
    extendedTimeout = setTimeout(() => {
      if (extendedEl && isActive) {
        extendedEl.style.display = 'block';
        extendedEl.textContent = 'STILL LOADING - PLEASE WAIT';
      }
    }, extendedDelay);
  }
  
  /**
   * Show completion state (Req 26.8)
   */
  function complete() {
    if (!isActive) return;
    
    // Clear timeout
    if (extendedTimeout) {
      clearTimeout(extendedTimeout);
      extendedTimeout = null;
    }
    
    // Stop loading animation
    if (loadingTl) {
      loadingTl.kill();
      loadingTl = null;
    }
    
    // Stop cursor blink
    const cursorEl = container.querySelector('.loading-cursor');
    if (cursorEl) {
      stopCursorBlink(cursorEl);
    }
    
    // Show READY flash in green
    container.innerHTML = `
      <div class="loading-container">
        <div class="loading-ready" style="color: #00FF00; font-size: 18px;">READY</div>
      </div>
    `;
    
    const readyEl = container.querySelector('.loading-ready');
    if (readyEl) {
      // Flash animation
      gsap.fromTo(readyEl, 
        { opacity: 0 },
        { 
          opacity: 1, 
          duration: 0.15, 
          ease: 'power2.out',
          onComplete: () => {
            // Fade out after brief display
            gsap.to(readyEl, {
              opacity: 0,
              duration: 0.3,
              delay: 0.5,
              ease: 'power2.in',
              onComplete: () => {
                isActive = false;
                if (onReady) onReady();
              }
            });
          }
        }
      );
    }
  }
  
  /**
   * Cancel loading state
   */
  function cancel() {
    if (extendedTimeout) {
      clearTimeout(extendedTimeout);
      extendedTimeout = null;
    }
    
    if (loadingTl) {
      loadingTl.kill();
      loadingTl = null;
    }
    
    const cursorEl = container.querySelector('.loading-cursor');
    if (cursorEl) {
      stopCursorBlink(cursorEl);
    }
    
    isActive = false;
  }
  
  return { show, complete, cancel, isActive: () => isActive };
}

// ============================================
// IDLE SCREEN FLICKER (Req 2.9)
// ============================================

/**
 * Start idle screen flicker effect
 * Req 2.9: Trigger after 30 seconds idle, opacity 0.97-1.0 every 3-5 seconds
 * 
 * @param {HTMLElement} screenElement - Screen element to flicker
 */
export function startIdleFlicker(screenElement) {
  if (!screenElement) return;
  
  // Stop any existing flicker
  stopIdleFlicker();
  
  effectsState.isIdle = true;
  
  // Create random flicker function
  const doFlicker = () => {
    if (!effectsState.isIdle) return;
    
    // Random interval between 3-5 seconds
    const nextInterval = (EFFECT_DURATIONS.IDLE_FLICKER_MIN + 
      Math.random() * (EFFECT_DURATIONS.IDLE_FLICKER_MAX - EFFECT_DURATIONS.IDLE_FLICKER_MIN)) * 1000;
    
    // Subtle brightness flicker
    effectsState.idleFlickerTween = gsap.to(screenElement, {
      opacity: 0.97,
      duration: 0.05,
      yoyo: true,
      repeat: 1,
      ease: 'none',
      onComplete: () => {
        if (effectsState.isIdle) {
          effectsState.idleTimer = setTimeout(doFlicker, nextInterval);
        }
      }
    });
  };
  
  // Start first flicker after random delay
  const initialDelay = (EFFECT_DURATIONS.IDLE_FLICKER_MIN + 
    Math.random() * (EFFECT_DURATIONS.IDLE_FLICKER_MAX - EFFECT_DURATIONS.IDLE_FLICKER_MIN)) * 1000;
  
  effectsState.idleTimer = setTimeout(doFlicker, initialDelay);
}

/**
 * Stop idle screen flicker effect
 */
export function stopIdleFlicker() {
  effectsState.isIdle = false;
  
  if (effectsState.idleTimer) {
    clearTimeout(effectsState.idleTimer);
    effectsState.idleTimer = null;
  }
  
  if (effectsState.idleFlickerTween) {
    effectsState.idleFlickerTween.kill();
    effectsState.idleFlickerTween = null;
  }
}

/**
 * Initialize idle detection for a screen element
 * Starts flicker after 30 seconds of no user activity
 * 
 * @param {HTMLElement} screenElement - Screen element to monitor
 * @returns {Function} Cleanup function to remove listeners
 */
export function initIdleDetection(screenElement) {
  if (!screenElement) return () => {};
  
  let idleTimeout = null;
  
  const resetIdleTimer = () => {
    // Stop any current flicker
    stopIdleFlicker();
    
    // Clear existing timeout
    if (idleTimeout) {
      clearTimeout(idleTimeout);
    }
    
    // Start new idle timeout
    idleTimeout = setTimeout(() => {
      startIdleFlicker(screenElement);
    }, EFFECT_DURATIONS.IDLE_TIMEOUT * 1000);
  };
  
  // Events that reset idle state
  const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
  
  events.forEach(event => {
    document.addEventListener(event, resetIdleTimer, { passive: true });
  });
  
  // Start initial idle timer
  resetIdleTimer();
  
  // Return cleanup function
  return () => {
    events.forEach(event => {
      document.removeEventListener(event, resetIdleTimer);
    });
    
    if (idleTimeout) {
      clearTimeout(idleTimeout);
    }
    
    stopIdleFlicker();
  };
}

// ============================================
// ERROR DISPLAY COMPONENT (Req 15.1-15.5, 27.8)
// ============================================

/**
 * Error types for consistent error handling
 * @type {Object}
 */
export const ERROR_TYPES = {
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  RATE_LIMIT: 'rate_limit',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  PARSE: 'parse',
  VALIDATION: 'validation',
  INVALID_DATE: 'invalid_date',
  LOCATION: 'location'
};

/**
 * Error messages configuration (Teletext style)
 * Req 15.1: User-friendly error messages
 * @type {Object}
 */
export const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: {
    title: 'CONNECTION LOST',
    message: 'Please check your internet\nconnection and try again.',
    action: 'RETRY'
  },
  [ERROR_TYPES.TIMEOUT]: {
    title: 'SERVICE SLOW',
    message: 'The service is taking too long.\nPlease try again.',
    action: 'RETRY'
  },
  [ERROR_TYPES.RATE_LIMIT]: {
    title: 'SERVICE BUSY',
    message: 'Using cached data.\nPlease wait a moment.',
    action: 'WAIT'
  },
  [ERROR_TYPES.NOT_FOUND]: {
    title: 'PAGE NOT FOUND',
    message: 'This page does not exist.\nPlease check the page number.',
    action: 'HOME'
  },
  [ERROR_TYPES.SERVER]: {
    title: 'SERVICE ERROR',
    message: 'Something went wrong.\nPlease try again later.',
    action: 'RETRY'
  },
  [ERROR_TYPES.PARSE]: {
    title: 'DATA ERROR',
    message: 'Could not read the data.\nPlease try again.',
    action: 'RETRY'
  },
  [ERROR_TYPES.VALIDATION]: {
    title: 'INVALID INPUT',
    message: 'Please check your entry\nand try again.',
    action: 'FIX'
  },
  [ERROR_TYPES.INVALID_DATE]: {
    title: 'INVALID DATE',
    message: 'The selected date is not valid.\nPlease choose another date.',
    action: 'FIX'
  },
  [ERROR_TYPES.LOCATION]: {
    title: 'LOCATION UNAVAILABLE',
    message: 'Could not detect your location.\nPlease enter it manually.',
    action: 'FIX'
  }
};

/**
 * Create error display HTML
 * Req 15.1: User-friendly error message in Teletext style
 * Req 15.2: Retry option
 * 
 * @param {string} type - Error type from ERROR_TYPES
 * @param {Object} options - Configuration options
 * @param {string} [options.customMessage] - Custom message to override default
 * @param {Function} [options.onRetry] - Callback for retry button
 * @param {Function} [options.onHome] - Callback for home button
 * @returns {string} HTML string for error display
 */
export function createErrorDisplay(type, options = {}) {
  const { customMessage, onRetry, onHome } = options;
  const errorConfig = ERROR_MESSAGES[type] || ERROR_MESSAGES[ERROR_TYPES.SERVER];
  
  const message = customMessage || errorConfig.message;
  const showRetry = errorConfig.action === 'RETRY' || errorConfig.action === 'FIX';
  
  return `
    <div class="error-container" role="alert" aria-live="assertive">
      <div class="error-icon">⚠</div>
      <div class="error-title double-height">${errorConfig.title}</div>
      <div class="error-message">${message.replace(/\n/g, '<br>')}</div>
      <div class="error-actions">
        ${showRetry ? '<button class="fastext-button fastext-button--red error-retry-btn" aria-label="Retry">RETRY</button>' : ''}
        <button class="fastext-button fastext-button--cyan error-home-btn" aria-label="Go to home page">HOME</button>
      </div>
    </div>
  `;
}

/**
 * Show error in a container with shake animation
 * Req 27.8: Red border with shake animation
 * 
 * @param {HTMLElement} container - Container element to show error in
 * @param {string} type - Error type from ERROR_TYPES
 * @param {Object} options - Configuration options
 * @param {string} [options.customMessage] - Custom message to override default
 * @param {Function} [options.onRetry] - Callback for retry button
 * @param {Function} [options.onHome] - Callback for home button
 * @returns {Object} Controller with cleanup method
 */
export function showError(container, type, options = {}) {
  if (!container) return null;
  
  const { onRetry, onHome } = options;
  
  // Create error HTML
  container.innerHTML = createErrorDisplay(type, options);
  
  // Get the error container element
  const errorEl = container.querySelector('.error-container');
  
  // Apply shake animation using GSAP
  if (errorEl) {
    errorShake(errorEl);
  }
  
  // Set up button handlers
  const retryBtn = container.querySelector('.error-retry-btn');
  const homeBtn = container.querySelector('.error-home-btn');
  
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };
  
  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      // Default: navigate to home page
      import('../router.js')
        .then(({ getRouter }) => {
          const router = getRouter();
          router.goHome();
        })
        .catch(() => {
          // Fallback if router import fails
          window.location.hash = '#100';
        });
    }
  };
  
  if (retryBtn) {
    retryBtn.addEventListener('click', handleRetry);
  }
  
  if (homeBtn) {
    homeBtn.addEventListener('click', handleHome);
  }
  
  // Return cleanup function
  return {
    cleanup: () => {
      if (retryBtn) {
        retryBtn.removeEventListener('click', handleRetry);
      }
      if (homeBtn) {
        homeBtn.removeEventListener('click', handleHome);
      }
    }
  };
}

/**
 * Create 404 Page Not Found display
 * Req 3.5: Friendly "Page Not Found" message
 * Req 18.5: Humorous Teletext-style message
 * 
 * @param {number} pageNumber - The invalid page number that was requested
 * @param {Object} options - Configuration options
 * @param {Function} [options.onHome] - Callback for home button
 * @returns {string} HTML string for 404 display
 */
export function create404Display(pageNumber, options = {}) {
  const formattedPage = pageNumber ? pageNumber.toString().padStart(3, '0') : '???';
  
  return `
    <div class="error-container error-404" role="alert" aria-live="assertive">
      <div class="error-icon">⚠</div>
      <div class="error-title double-height" style="color: #FF0000;">ERROR 404</div>
      <div class="error-subtitle" style="color: #FFFF00; margin-bottom: 16px;">PAGE NOT FOUND</div>
      
      <div class="error-ascii" style="color: #00FFFF; margin: 16px 0; font-size: 12px;">
        ┌────────────────────────────────────┐
        │                                    │
        │  ████  ████  ████                  │
        │  █  █  █  █  █  █                  │
        │  ████  █  █  ████                  │
        │     █  █  █     █                  │
        │  ████  ████  ████                  │
        │                                    │
        └────────────────────────────────────┘
      </div>
      
      <div class="error-message" style="color: #FFFFFF;">
        Page P.${formattedPage} has gone on holiday!<br>
        Perhaps it's visiting 1985...<br><br>
        <span style="color: #FFFF00;">Try one of these instead:</span>
      </div>
      
      <div class="error-suggestions" style="margin: 16px 0; color: #00FFFF;">
        ► HOME ................ 100<br>
        ► NEWS ................ 101<br>
        ► WEATHER ............. 200<br>
        ► TIME MACHINE ........ 500
      </div>
      
      <div class="error-actions">
        <button class="fastext-button fastext-button--red error-home-btn" aria-label="Go to home page">HOME</button>
        <button class="fastext-button fastext-button--green error-news-btn" aria-label="Go to news">NEWS</button>
        <button class="fastext-button fastext-button--yellow error-weather-btn" aria-label="Go to weather">WEATHER</button>
        <button class="fastext-button fastext-button--cyan error-time-btn" aria-label="Go to time machine">TIME</button>
      </div>
    </div>
  `;
}

/**
 * Show 404 Page Not Found in a container
 * Req 3.5, 18.5: Page Not Found with navigation options
 * 
 * @param {HTMLElement} container - Container element to show 404 in
 * @param {number} pageNumber - The invalid page number that was requested
 * @param {Object} options - Configuration options
 * @returns {Object} Controller with cleanup method
 */
export function show404(container, pageNumber, options = {}) {
  if (!container) return null;
  
  // Create 404 HTML
  container.innerHTML = create404Display(pageNumber, options);
  
  // Get the error container element
  const errorEl = container.querySelector('.error-container');
  
  // Apply shake animation using GSAP
  if (errorEl) {
    errorShake(errorEl);
  }
  
  // Set up button handlers
  const homeBtn = container.querySelector('.error-home-btn');
  const newsBtn = container.querySelector('.error-news-btn');
  const weatherBtn = container.querySelector('.error-weather-btn');
  const timeBtn = container.querySelector('.error-time-btn');
  
  const navigateTo = (pageNum) => {
    import('../router.js')
      .then(({ getRouter }) => {
        const router = getRouter();
        router.navigate(pageNum);
      })
      .catch(() => {
        // Fallback if router import fails
        window.location.hash = `#${pageNum}`;
      });
  };
  
  const handleHome = () => navigateTo(100);
  const handleNews = () => navigateTo(101);
  const handleWeather = () => navigateTo(200);
  const handleTime = () => navigateTo(500);
  
  if (homeBtn) homeBtn.addEventListener('click', handleHome);
  if (newsBtn) newsBtn.addEventListener('click', handleNews);
  if (weatherBtn) weatherBtn.addEventListener('click', handleWeather);
  if (timeBtn) timeBtn.addEventListener('click', handleTime);
  
  // Return cleanup function
  return {
    cleanup: () => {
      if (homeBtn) homeBtn.removeEventListener('click', handleHome);
      if (newsBtn) newsBtn.removeEventListener('click', handleNews);
      if (weatherBtn) weatherBtn.removeEventListener('click', handleWeather);
      if (timeBtn) timeBtn.removeEventListener('click', handleTime);
    }
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if idle flicker is active
 * @returns {boolean} True if idle
 */
export function isIdleFlickerActive() {
  return effectsState.isIdle;
}

/**
 * Get effects state (for testing)
 * @returns {Object} Current effects state
 */
export function getEffectsState() {
  return {
    isIdle: effectsState.isIdle,
    hasIdleTimer: effectsState.idleTimer !== null,
    hasIdleFlickerTween: effectsState.idleFlickerTween !== null,
    loadingTweensCount: effectsState.loadingTweens.size,
    cursorTweensCount: effectsState.cursorTweens.size
  };
}

/**
 * Reset all effects state (for testing)
 */
export function resetEffectsState() {
  // Stop idle flicker
  stopIdleFlicker();
  
  // Kill all loading tweens
  effectsState.loadingTweens.forEach(tween => tween.kill());
  effectsState.loadingTweens.clear();
  
  // Kill all cursor tweens
  effectsState.cursorTweens.forEach(tween => tween.kill());
  effectsState.cursorTweens.clear();
  
  effectsState = {
    idleTimer: null,
    idleFlickerTween: null,
    isIdle: false,
    loadingTweens: new Map(),
    cursorTweens: new Map()
  };
}

/**
 * Attach hover effects to all Fastext buttons
 * 
 * @param {HTMLElement} container - Container with Fastext buttons
 * @returns {Function} Cleanup function
 */
export function attachFastextButtonEffects(container) {
  if (!container) return () => {};
  
  const buttons = container.querySelectorAll('.fastext-button');
  const cleanupFns = [];
  
  buttons.forEach(button => {
    // Determine glow color based on button class
    let glowColor = '#FFFF00';
    if (button.classList.contains('fastext-button--red')) glowColor = '#FF0000';
    else if (button.classList.contains('fastext-button--green')) glowColor = '#00FF00';
    else if (button.classList.contains('fastext-button--yellow')) glowColor = '#FFFF00';
    else if (button.classList.contains('fastext-button--cyan')) glowColor = '#00FFFF';
    
    const handleMouseEnter = () => buttonHoverIn(button, glowColor);
    const handleMouseLeave = () => buttonHoverOut(button);
    const handleClick = () => buttonClick(button);
    
    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);
    button.addEventListener('click', handleClick);
    
    cleanupFns.push(() => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
      button.removeEventListener('click', handleClick);
    });
  });
  
  return () => cleanupFns.forEach(fn => fn());
}

/**
 * Attach hover effects to all menu items
 * 
 * @param {HTMLElement} container - Container with menu items
 * @returns {Function} Cleanup function
 */
export function attachMenuItemEffects(container) {
  if (!container) return () => {};
  
  const menuItems = container.querySelectorAll('.menu-item');
  const cleanupFns = [];
  
  menuItems.forEach(item => {
    const handleMouseEnter = () => menuItemHoverIn(item);
    const handleMouseLeave = () => menuItemHoverOut(item);
    
    item.addEventListener('mouseenter', handleMouseEnter);
    item.addEventListener('mouseleave', handleMouseLeave);
    
    cleanupFns.push(() => {
      item.removeEventListener('mouseenter', handleMouseEnter);
      item.removeEventListener('mouseleave', handleMouseLeave);
    });
  });
  
  return () => cleanupFns.forEach(fn => fn());
}

/**
 * Attach hover effects to all navigation arrows
 * 
 * @param {HTMLElement} container - Container with nav arrows
 * @returns {Function} Cleanup function
 */
export function attachNavArrowEffects(container) {
  if (!container) return () => {};
  
  const arrows = container.querySelectorAll('.nav-arrow');
  const cleanupFns = [];
  
  arrows.forEach(arrow => {
    const handleMouseEnter = () => navArrowHoverIn(arrow);
    const handleMouseLeave = () => navArrowHoverOut(arrow);
    
    arrow.addEventListener('mouseenter', handleMouseEnter);
    arrow.addEventListener('mouseleave', handleMouseLeave);
    
    cleanupFns.push(() => {
      arrow.removeEventListener('mouseenter', handleMouseEnter);
      arrow.removeEventListener('mouseleave', handleMouseLeave);
    });
  });
  
  return () => cleanupFns.forEach(fn => fn());
}

/**
 * Attach all micro-interaction effects to a container
 * 
 * @param {HTMLElement} container - Main container element
 * @returns {Function} Cleanup function
 */
export function attachAllEffects(container) {
  if (!container) return () => {};
  
  const cleanupFns = [
    attachFastextButtonEffects(container),
    attachMenuItemEffects(container),
    attachNavArrowEffects(container),
    initIdleDetection(container)
  ];
  
  return () => cleanupFns.forEach(fn => fn());
}
