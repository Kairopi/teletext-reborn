/**
 * Teletext Reborn - Boot Sequence Animation
 * 
 * Authentic TV boot-up animation using GSAP for the Teletext experience.
 * Creates an immersive CRT warm-up effect with typewriter title animation.
 * 
 * Requirements: 1.1-1.10, 25.2, 25.3
 * 
 * Timeline Phases (3 seconds max):
 * - Phase 1 (0-0.2s): Black screen
 * - Phase 2 (0.2-0.7s): CRT warm-up line expansion
 * - Phase 3 (0.7-1.2s): Static noise effect
 * - Phase 4 (1.2-2.5s): Typewriter title animation
 * - Phase 5 (2.5-3.0s): Subtitle fade with blinking cursor
 */

import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

// Register GSAP plugins
gsap.registerPlugin(TextPlugin);

/**
 * Boot sequence state
 * @type {{ timeline: gsap.core.Timeline | null, cursorTween: gsap.core.Tween | null, isPlaying: boolean, isComplete: boolean }}
 */
let bootState = {
  timeline: null,
  cursorTween: null,
  isPlaying: false,
  isComplete: false
};

/**
 * Check if user has seen the intro before
 * @returns {boolean} True if returning user
 */
export function hasSeenIntro() {
  try {
    return localStorage.getItem('teletext_hasSeenIntro') === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark intro as seen
 */
export function markIntroSeen() {
  try {
    localStorage.setItem('teletext_hasSeenIntro', 'true');
  } catch {
    // localStorage not available
  }
}

/**
 * Create the boot screen HTML structure
 * @returns {string} HTML string for boot screen
 */
export function createBootScreenHTML() {
  return `
    <div class="boot-screen" id="boot-screen">
      <!-- CRT warm-up line -->
      <div class="crt-line" id="crt-line"></div>
      
      <!-- Static noise overlay -->
      <div class="boot-static" id="boot-static"></div>
      
      <!-- Boot content -->
      <div class="boot-content" id="boot-content">
        <div class="boot-title double-height phosphor-glow" id="boot-title"></div>
        <div class="boot-subtitle" id="boot-subtitle">
          <span id="boot-subtitle-text"></span>
          <span class="boot-cursor" id="boot-cursor">█</span>
        </div>
      </div>
      
      <!-- Skip intro button (for returning users) -->
      <button class="skip-intro-button" id="skip-intro-button" aria-label="Skip intro">
        SKIP INTRO ►
      </button>
    </div>
  `;
}


/**
 * Create the boot sequence GSAP timeline
 * 
 * @param {Object} options - Configuration options
 * @param {Function} [options.onComplete] - Callback when boot sequence completes
 * @param {Function} [options.onSkip] - Callback when user skips intro
 * @returns {gsap.core.Timeline} The boot sequence timeline
 */
export function createBootTimeline(options = {}) {
  const { onComplete, onSkip } = options;
  
  // Get DOM elements
  const bootScreen = document.getElementById('boot-screen');
  const crtLine = document.getElementById('crt-line');
  const bootStatic = document.getElementById('boot-static');
  const bootContent = document.getElementById('boot-content');
  const bootTitle = document.getElementById('boot-title');
  const bootSubtitleText = document.getElementById('boot-subtitle-text');
  const bootCursor = document.getElementById('boot-cursor');
  const skipButton = document.getElementById('skip-intro-button');
  
  if (!bootScreen || !crtLine || !bootStatic || !bootContent || !bootTitle) {
    console.error('Boot screen elements not found');
    return null;
  }
  
  // Create main timeline
  const tl = gsap.timeline({
    onComplete: () => {
      bootState.isPlaying = false;
      bootState.isComplete = true;
      markIntroSeen();
      if (onComplete) onComplete();
    }
  });
  
  // Store timeline reference
  bootState.timeline = tl;
  bootState.isPlaying = true;
  
  // Initial state setup
  tl.set(bootScreen, { opacity: 1, visibility: 'visible' })
    .set(crtLine, { scaleY: 0, opacity: 1 })
    .set(bootStatic, { opacity: 0 })
    .set(bootContent, { opacity: 0 })
    .set(bootTitle, { text: '' })
    .set(bootSubtitleText, { text: '', opacity: 0 })
    .set(bootCursor, { opacity: 0 })
    .set(skipButton, { opacity: 0, visibility: 'hidden' });
  
  // Phase 1: Black screen (0-0.2s) - Req 1.1
  tl.to(bootScreen, {
    duration: 0.2,
    ease: 'none'
  });
  
  // Phase 2: CRT warm-up line expansion (0.2-0.7s) - Req 1.2
  tl.to(crtLine, {
    scaleY: 400,
    duration: 0.5,
    ease: 'power4.out'
  });
  
  // Phase 3: Static noise effect (0.7-1.2s) - Req 1.3
  tl.to(bootStatic, {
    opacity: 0.6,
    duration: 0.1,
    ease: 'power2.in'
  })
  .to(bootStatic, {
    opacity: 0,
    duration: 0.4,
    ease: 'power2.out'
  });
  
  // Hide CRT line and show content area
  tl.set(crtLine, { opacity: 0 })
    .to(bootContent, {
      opacity: 1,
      duration: 0.1
    });
  
  // Phase 4: Typewriter title animation (1.2-2.5s) - Req 1.4
  tl.to(bootTitle, {
    text: 'TELETEXT REBORN',
    duration: 1.3,
    ease: 'none'
  });
  
  // Phase 5: Subtitle fade with blinking cursor (2.5-3.0s) - Req 1.5
  tl.to(bootSubtitleText, {
    opacity: 1,
    duration: 0.1
  })
  .to(bootSubtitleText, {
    text: 'Press any key to continue...',
    duration: 0.3,
    ease: 'none'
  })
  .to(bootCursor, {
    opacity: 1,
    duration: 0.1
  });
  
  // Start cursor blinking animation
  tl.call(() => {
    bootState.cursorTween = gsap.to(bootCursor, {
      opacity: 0,
      duration: 0.53,
      repeat: -1,
      yoyo: true,
      ease: 'steps(1)'
    });
  });
  
  // Show skip button for returning users after 500ms - Req 1.8
  if (hasSeenIntro() && skipButton) {
    tl.to(skipButton, {
      opacity: 1,
      visibility: 'visible',
      duration: 0.2
    }, 0.5);
    
    // Setup skip button click handler
    skipButton.addEventListener('click', () => {
      skipIntro(onSkip || onComplete);
    });
  }
  
  // Setup key/click listener for "Press any key" - Req 1.6
  const handleInteraction = (e) => {
    // Ignore if clicking skip button
    if (e.target && e.target.id === 'skip-intro-button') return;
    
    if (bootState.isComplete || !bootState.isPlaying) {
      completeBootSequence(onComplete);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    }
  };
  
  // Add listeners after subtitle appears
  tl.call(() => {
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('click', handleInteraction);
  });
  
  return tl;
}


/**
 * Skip the intro animation immediately - Req 1.9
 * @param {Function} [callback] - Callback after skip
 */
export function skipIntro(callback) {
  // Kill current timeline
  if (bootState.timeline) {
    bootState.timeline.kill();
  }
  
  // Kill cursor animation
  if (bootState.cursorTween) {
    bootState.cursorTween.kill();
  }
  
  bootState.isPlaying = false;
  bootState.isComplete = true;
  
  // Fade out boot screen
  const bootScreen = document.getElementById('boot-screen');
  if (bootScreen) {
    gsap.to(bootScreen, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.out',
      onComplete: () => {
        bootScreen.style.visibility = 'hidden';
        markIntroSeen();
        if (callback) callback();
      }
    });
  } else {
    markIntroSeen();
    if (callback) callback();
  }
}

/**
 * Complete the boot sequence and transition to main content - Req 1.6
 * @param {Function} [callback] - Callback after completion
 */
export function completeBootSequence(callback) {
  // Kill cursor animation
  if (bootState.cursorTween) {
    bootState.cursorTween.kill();
  }
  
  const bootScreen = document.getElementById('boot-screen');
  if (bootScreen) {
    gsap.to(bootScreen, {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.inOut',
      onComplete: () => {
        bootScreen.style.visibility = 'hidden';
        if (callback) callback();
      }
    });
  } else {
    if (callback) callback();
  }
}

/**
 * Play the boot sequence
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.container - Container element to render boot screen
 * @param {Function} [options.onComplete] - Callback when boot completes
 * @param {Function} [options.onSkip] - Callback when user skips
 * @param {boolean} [options.skipIfSeen=false] - Skip boot if user has seen it
 * @returns {gsap.core.Timeline | null} The timeline or null if skipped
 */
export function playBootSequence(options = {}) {
  const { container, onComplete, onSkip, skipIfSeen = false } = options;
  
  // Skip if user has seen intro and skipIfSeen is true
  if (skipIfSeen && hasSeenIntro()) {
    if (onComplete) onComplete();
    return null;
  }
  
  if (!container) {
    console.error('Container element required for boot sequence');
    return null;
  }
  
  // Insert boot screen HTML
  container.insertAdjacentHTML('afterbegin', createBootScreenHTML());
  
  // Create and return timeline
  return createBootTimeline({ onComplete, onSkip });
}

/**
 * Clean up boot sequence resources
 */
export function cleanupBootSequence() {
  // Kill timeline
  if (bootState.timeline) {
    bootState.timeline.kill();
    bootState.timeline = null;
  }
  
  // Kill cursor tween
  if (bootState.cursorTween) {
    bootState.cursorTween.kill();
    bootState.cursorTween = null;
  }
  
  // Remove boot screen element
  const bootScreen = document.getElementById('boot-screen');
  if (bootScreen) {
    bootScreen.remove();
  }
  
  // Reset state
  bootState.isPlaying = false;
  bootState.isComplete = false;
}

/**
 * Check if boot sequence is currently playing
 * @returns {boolean} True if playing
 */
export function isBootPlaying() {
  return bootState.isPlaying;
}

/**
 * Check if boot sequence has completed
 * @returns {boolean} True if complete
 */
export function isBootComplete() {
  return bootState.isComplete;
}

/**
 * Reset boot state (for testing)
 */
export function resetBootState() {
  cleanupBootSequence();
  bootState = {
    timeline: null,
    cursorTween: null,
    isPlaying: false,
    isComplete: false
  };
}

/**
 * Clear the hasSeenIntro flag (for testing)
 */
export function clearIntroFlag() {
  try {
    localStorage.removeItem('teletext_hasSeenIntro');
  } catch {
    // localStorage not available
  }
}
