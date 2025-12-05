/**
 * Teletext Reborn - Time Travel Animation
 * 
 * GSAP-powered time travel animation for the Time Machine feature.
 * Creates a spectacular visual effect when traveling through time.
 * 
 * Requirements: 11.1-11.10, 25.4
 * 
 * Timeline Phases (2.5 seconds total):
 * - Phase 1 (0-0.3s): Blur and brighten screen
 * - Phase 2 (0.3-0.5s): White flash with screen shake
 * - Phase 3 (0.5-2.0s): Year counter animation with typewriter text
 * - Phase 4 (2.0-2.5s): Unblur and reveal content
 */

import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

// Register GSAP plugins
gsap.registerPlugin(TextPlugin);

/**
 * Time travel animation state
 * @type {{ timeline: gsap.core.Timeline | null, isPlaying: boolean, isComplete: boolean, direction: 'forward' | 'backward' | null }}
 */
let timeTravelState = {
  timeline: null,
  isPlaying: false,
  isComplete: false,
  direction: null
};

/**
 * Animation duration constants (in seconds)
 * Based on Requirements 11.1-11.10
 */
export const TIME_TRAVEL_DURATIONS = {
  TOTAL: 2.5,           // Req 11.1: Total animation duration
  BLUR_PHASE: 0.3,      // Req 11.2: Phase 1 duration
  FLASH_IN: 0.1,        // Req 11.2: Flash in duration
  FLASH_OUT: 0.1,       // Req 11.2: Flash out duration
  YEAR_COUNTER: 1.5,    // Req 11.2: Phase 3 duration
  TYPEWRITER: 0.8,      // Req 11.4: Typewriter text duration
  UNBLUR_PHASE: 0.3,    // Req 11.2: Phase 4 duration
  CONTENT_STAGGER: 0.05, // Req 11.6: Content reveal stagger
  FINAL_PAUSE: 0.2,     // Req 11.5: Pause on final year
  SHAKE_DURATION: 0.05  // Req 11.9: Screen shake duration
};


/**
 * Create the time travel overlay HTML structure
 * @returns {string} HTML string for time travel overlay
 */
export function createTimeTravelHTML() {
  return `
    <div class="time-travel-overlay" id="time-travel-overlay">
      <!-- Flash overlay for white flash effect -->
      <div class="time-travel-flash" id="time-travel-flash"></div>
      
      <!-- Time travel content -->
      <div class="time-travel-content" id="time-travel-content">
        <div class="time-travel-text double-height phosphor-glow" id="time-travel-text"></div>
        <div class="time-travel-year double-height phosphor-glow" id="time-travel-year"></div>
      </div>
    </div>
  `;
}

/**
 * Check if time travel animation is currently playing
 * @returns {boolean} True if animation is playing
 */
export function isTimeTravelPlaying() {
  return timeTravelState.isPlaying;
}

/**
 * Check if time travel animation has completed
 * @returns {boolean} True if animation is complete
 */
export function isTimeTravelComplete() {
  return timeTravelState.isComplete;
}

/**
 * Get the current time travel direction
 * @returns {'forward' | 'backward' | null} Direction of travel
 */
export function getTimeTravelDirection() {
  return timeTravelState.direction;
}

/**
 * Create the time travel GSAP timeline
 * Req 11.1: Animation lasting exactly 2.5 seconds
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.targetYear - The year to travel to
 * @param {number} [options.startYear] - Starting year (defaults to current year)
 * @param {HTMLElement} [options.screen] - Screen element to apply effects to
 * @param {Function} [options.onComplete] - Callback when animation completes
 * @param {Function} [options.onStart] - Callback when animation starts
 * @param {Function} [options.onYearReached] - Callback when target year is reached
 * @param {boolean} [options.isReverse=false] - Whether this is a reverse animation (returning to present)
 * @returns {gsap.core.Timeline | null} The time travel timeline
 */
export function createTimeTravelTimeline(options = {}) {
  const {
    targetYear,
    startYear = new Date().getFullYear(),
    screen,
    onComplete,
    onStart,
    onYearReached,
    isReverse = false
  } = options;
  
  if (targetYear === undefined || targetYear === null) {
    console.error('Target year is required for time travel animation');
    return null;
  }
  
  // Get DOM elements
  const overlay = document.getElementById('time-travel-overlay');
  const flash = document.getElementById('time-travel-flash');
  const content = document.getElementById('time-travel-content');
  const travelText = document.getElementById('time-travel-text');
  const yearCounter = document.getElementById('time-travel-year');
  const screenElement = screen || document.querySelector('.teletext-screen');
  
  if (!overlay || !flash || !content || !travelText || !yearCounter) {
    console.error('Time travel overlay elements not found');
    return null;
  }
  
  // Determine travel message based on direction - Req 11.4, 11.7
  const travelMessage = isReverse 
    ? 'RETURNING TO PRESENT...' 
    : `TRAVELING TO ${targetYear}...`;
  
  // Set direction state
  timeTravelState.direction = isReverse ? 'backward' : 'forward';
  
  // Create main timeline - Req 11.1
  const tl = gsap.timeline({
    onStart: () => {
      timeTravelState.isPlaying = true;
      timeTravelState.isComplete = false;
      if (onStart) onStart();
    },
    onComplete: () => {
      timeTravelState.isPlaying = false;
      timeTravelState.isComplete = true;
      timeTravelState.direction = null;
      if (onComplete) onComplete();
    }
  });
  
  // Store timeline reference
  timeTravelState.timeline = tl;
  
  // Initial state setup
  tl.set(overlay, { opacity: 1, visibility: 'visible' })
    .set(flash, { opacity: 0 })
    .set(content, { opacity: 0 })
    .set(travelText, { text: '' })
    .set(yearCounter, { innerText: startYear });

  
  // Phase 1: Blur and brighten (0-0.3s) - Req 11.2
  if (screenElement) {
    tl.to(screenElement, {
      filter: 'blur(10px) brightness(1.5)',
      duration: TIME_TRAVEL_DURATIONS.BLUR_PHASE,
      ease: 'expo.in'
    });
  }
  
  // Show content area for year counter
  tl.to(content, {
    opacity: 1,
    duration: 0.1
  }, '-=0.1');
  
  // Phase 2: White flash with screen shake (0.3-0.5s) - Req 11.2, 11.9
  tl.to(flash, {
    opacity: 1,
    duration: TIME_TRAVEL_DURATIONS.FLASH_IN,
    ease: 'power4.in'
  })
  .to(flash, {
    opacity: 0,
    duration: TIME_TRAVEL_DURATIONS.FLASH_OUT,
    ease: 'power4.out'
  });
  
  // Screen shake during flash - Req 11.9
  if (screenElement) {
    tl.to(screenElement, {
      x: '+=3',
      duration: TIME_TRAVEL_DURATIONS.SHAKE_DURATION,
      repeat: 3,
      yoyo: true,
      ease: 'none'
    }, '-=0.2');
  }
  
  // Phase 3: Year counter animation (0.5-2.0s) - Req 11.2, 11.3
  // Calculate number of steps based on year difference for smooth animation
  const yearDiff = Math.abs(targetYear - startYear);
  const steps = Math.min(Math.max(yearDiff, 10), 50); // Between 10 and 50 steps
  
  tl.to(yearCounter, {
    innerText: targetYear,
    duration: TIME_TRAVEL_DURATIONS.YEAR_COUNTER,
    ease: `steps(${steps})`,
    snap: { innerText: 1 },
    modifiers: {
      innerText: (value) => Math.round(value)
    }
  });
  
  // Typewriter "TRAVELING TO..." text - Req 11.4
  tl.to(travelText, {
    text: travelMessage,
    duration: TIME_TRAVEL_DURATIONS.TYPEWRITER,
    ease: 'none'
  }, `-=${TIME_TRAVEL_DURATIONS.YEAR_COUNTER}`);
  
  // Brief pause on final year - Req 11.5
  tl.to({}, {
    duration: TIME_TRAVEL_DURATIONS.FINAL_PAUSE,
    onComplete: () => {
      if (onYearReached) onYearReached(targetYear);
    }
  });
  
  // Phase 4: Unblur and reveal content (2.0-2.5s) - Req 11.2
  if (screenElement) {
    tl.to(screenElement, {
      filter: 'blur(0px) brightness(1)',
      duration: TIME_TRAVEL_DURATIONS.UNBLUR_PHASE,
      ease: 'expo.out'
    });
  }
  
  // Fade out overlay
  tl.to(overlay, {
    opacity: 0,
    duration: 0.2,
    ease: 'power2.out'
  }, '-=0.2');
  
  // Hide overlay after fade
  tl.set(overlay, { visibility: 'hidden' });
  
  // Stagger content reveal - Req 11.6
  const historicalContent = document.querySelectorAll('.historical-content, .content-line');
  if (historicalContent.length > 0) {
    tl.from(historicalContent, {
      opacity: 0,
      y: 10,
      duration: 0.2,
      stagger: TIME_TRAVEL_DURATIONS.CONTENT_STAGGER,
      ease: 'power2.out'
    }, '-=0.1');
  }
  
  return tl;
}


/**
 * Play the time travel animation (forward - to historical date)
 * Main entry point for time travel to a historical date
 * 
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.container - Container element to render overlay
 * @param {number} options.targetYear - The year to travel to
 * @param {HTMLElement} [options.screen] - Screen element to apply effects to
 * @param {Function} [options.onComplete] - Callback when animation completes
 * @param {Function} [options.onStart] - Callback when animation starts
 * @param {Function} [options.onYearReached] - Callback when target year is reached
 * @param {Function} [options.disableNavigation] - Function to disable navigation - Req 11.10
 * @param {Function} [options.enableNavigation] - Function to enable navigation - Req 11.10
 * @returns {gsap.core.Timeline | null} The timeline or null if already playing
 */
export function playTimeTravelAnimation(options = {}) {
  const {
    container,
    targetYear,
    screen,
    onComplete,
    onStart,
    onYearReached,
    disableNavigation,
    enableNavigation
  } = options;
  
  // Req 11.10: Prevent interruption during animation
  if (timeTravelState.isPlaying) {
    console.warn('Time travel animation already in progress');
    return null;
  }
  
  if (!container) {
    console.error('Container element required for time travel animation');
    return null;
  }
  
  if (targetYear === undefined || targetYear === null) {
    console.error('Target year is required for time travel animation');
    return null;
  }
  
  // Req 11.10: Disable navigation during animation
  if (disableNavigation) {
    disableNavigation();
  }
  
  // Insert time travel overlay HTML
  container.insertAdjacentHTML('afterbegin', createTimeTravelHTML());
  
  // Create and return timeline
  return createTimeTravelTimeline({
    targetYear,
    startYear: new Date().getFullYear(),
    screen,
    onStart,
    onYearReached,
    onComplete: () => {
      // Req 11.10: Re-enable navigation after animation
      if (enableNavigation) {
        enableNavigation();
      }
      if (onComplete) onComplete();
    },
    isReverse: false
  });
}

/**
 * Play the reverse time travel animation (backward - returning to present)
 * Req 11.7, 11.8: Reverse animation with "RETURNING TO PRESENT..." message
 * 
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.container - Container element to render overlay
 * @param {number} options.fromYear - The historical year to travel from
 * @param {HTMLElement} [options.screen] - Screen element to apply effects to
 * @param {Function} [options.onComplete] - Callback when animation completes
 * @param {Function} [options.onStart] - Callback when animation starts
 * @param {Function} [options.onYearReached] - Callback when current year is reached
 * @param {Function} [options.disableNavigation] - Function to disable navigation - Req 11.10
 * @param {Function} [options.enableNavigation] - Function to enable navigation - Req 11.10
 * @returns {gsap.core.Timeline | null} The timeline or null if already playing
 */
export function playReverseTimeTravelAnimation(options = {}) {
  const {
    container,
    fromYear,
    screen,
    onComplete,
    onStart,
    onYearReached,
    disableNavigation,
    enableNavigation
  } = options;
  
  // Req 11.10: Prevent interruption during animation
  if (timeTravelState.isPlaying) {
    console.warn('Time travel animation already in progress');
    return null;
  }
  
  if (!container) {
    console.error('Container element required for time travel animation');
    return null;
  }
  
  if (fromYear === undefined || fromYear === null) {
    console.error('From year is required for reverse time travel animation');
    return null;
  }
  
  const currentYear = new Date().getFullYear();
  
  // Req 11.10: Disable navigation during animation
  if (disableNavigation) {
    disableNavigation();
  }
  
  // Insert time travel overlay HTML
  container.insertAdjacentHTML('afterbegin', createTimeTravelHTML());
  
  // Req 11.8: Count years forward from historical date to current year
  return createTimeTravelTimeline({
    targetYear: currentYear,
    startYear: fromYear,
    screen,
    onStart,
    onYearReached,
    onComplete: () => {
      // Req 11.10: Re-enable navigation after animation
      if (enableNavigation) {
        enableNavigation();
      }
      if (onComplete) onComplete();
    },
    isReverse: true
  });
}


/**
 * Cancel the current time travel animation
 */
export function cancelTimeTravelAnimation() {
  if (timeTravelState.timeline) {
    timeTravelState.timeline.kill();
    timeTravelState.timeline = null;
  }
  timeTravelState.isPlaying = false;
  timeTravelState.isComplete = false;
  timeTravelState.direction = null;
}

/**
 * Clean up time travel animation resources
 */
export function cleanupTimeTravelAnimation() {
  // Kill timeline
  cancelTimeTravelAnimation();
  
  // Remove overlay element
  const overlay = document.getElementById('time-travel-overlay');
  if (overlay) {
    overlay.remove();
  }
}

/**
 * Reset time travel state (for testing)
 */
export function resetTimeTravelState() {
  cleanupTimeTravelAnimation();
  timeTravelState = {
    timeline: null,
    isPlaying: false,
    isComplete: false,
    direction: null
  };
}

/**
 * Get the current time travel state (for testing)
 * @returns {{ isPlaying: boolean, isComplete: boolean, direction: string | null }}
 */
export function getTimeTravelState() {
  return {
    isPlaying: timeTravelState.isPlaying,
    isComplete: timeTravelState.isComplete,
    direction: timeTravelState.direction
  };
}
