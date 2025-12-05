/**
 * Teletext Reborn - Micro-Interaction Effects Tests
 * 
 * Tests for hover effects, click feedback, loading animations, and idle screen flicker.
 * Requirements: 2.9, 20.1-20.4, 27.1-27.10
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import gsap from 'gsap';
import {
  EFFECT_DURATIONS,
  buttonHoverIn,
  buttonHoverOut,
  buttonClick,
  menuItemHoverIn,
  menuItemHoverOut,
  clickableTextFlicker,
  navArrowHoverIn,
  navArrowHoverOut,
  successFlash,
  errorShake,
  createCursorBlink,
  stopCursorBlink,
  createLoadingDots,
  stopLoadingDots,
  createBlockProgress,
  createSpinner,
  startIdleFlicker,
  stopIdleFlicker,
  initIdleDetection,
  isIdleFlickerActive,
  getEffectsState,
  resetEffectsState,
  attachFastextButtonEffects,
  attachMenuItemEffects,
  attachNavArrowEffects,
  attachAllEffects
} from './effects.js';

// Mock DOM element factory
function createElement(tag = 'div', classes = [], innerHTML = '') {
  const el = document.createElement(tag);
  classes.forEach(cls => el.classList.add(cls));
  el.innerHTML = innerHTML;
  return el;
}

describe('Micro-Interaction Effects', () => {
  beforeEach(() => {
    // Reset GSAP and effects state
    gsap.killTweensOf('*');
    resetEffectsState();
    vi.useFakeTimers();
  });

  afterEach(() => {
    resetEffectsState();
    vi.useRealTimers();
  });

  // ============================================
  // BUTTON HOVER AND CLICK EFFECTS (Req 27.1-27.3)
  // ============================================
  
  describe('Button Hover Effects (Req 27.1, 27.2)', () => {
    it('should return null for null element', () => {
      expect(buttonHoverIn(null)).toBeNull();
      expect(buttonHoverOut(null)).toBeNull();
    });

    it('should create hover in tween with correct duration', () => {
      const button = createElement('button', ['fastext-button']);
      const tween = buttonHoverIn(button, '#FF0000');
      
      expect(tween).not.toBeNull();
      expect(tween.duration()).toBe(EFFECT_DURATIONS.BUTTON_HOVER);
    });

    it('should create hover out tween with correct duration', () => {
      const button = createElement('button', ['fastext-button']);
      const tween = buttonHoverOut(button);
      
      expect(tween).not.toBeNull();
      expect(tween.duration()).toBe(EFFECT_DURATIONS.BUTTON_HOVER);
    });

    it('should use default glow color when not specified', () => {
      const button = createElement('button', ['fastext-button']);
      const tween = buttonHoverIn(button);
      
      expect(tween).not.toBeNull();
    });
  });

  describe('Button Click Effects (Req 27.3)', () => {
    it('should return null for null element', () => {
      expect(buttonClick(null)).toBeNull();
    });

    it('should create click tween with correct duration', () => {
      const button = createElement('button', ['fastext-button']);
      const tween = buttonClick(button);
      
      expect(tween).not.toBeNull();
      expect(tween.duration()).toBe(EFFECT_DURATIONS.BUTTON_CLICK);
    });

    it('should use yoyo and repeat for bounce effect', () => {
      const button = createElement('button', ['fastext-button']);
      const tween = buttonClick(button);
      
      expect(tween.vars.yoyo).toBe(true);
      expect(tween.vars.repeat).toBe(1);
    });
  });

  // ============================================
  // MENU ITEM EFFECTS (Req 27.4, 27.5)
  // ============================================

  describe('Menu Item Hover Effects (Req 27.4)', () => {
    it('should return null for null element', () => {
      expect(menuItemHoverIn(null)).toBeNull();
      expect(menuItemHoverOut(null)).toBeNull();
    });

    it('should create hover in timeline', () => {
      const menuItem = createElement('div', ['menu-item']);
      const tl = menuItemHoverIn(menuItem);
      
      expect(tl).not.toBeNull();
      expect(tl.duration()).toBeGreaterThan(0);
    });

    it('should create hover out timeline', () => {
      const menuItem = createElement('div', ['menu-item']);
      const tl = menuItemHoverOut(menuItem);
      
      expect(tl).not.toBeNull();
      expect(tl.duration()).toBeGreaterThan(0);
    });

    it('should animate prefix element if present', () => {
      const menuItem = createElement('div', ['menu-item'], '<span class="menu-prefix">►</span>');
      const tl = menuItemHoverIn(menuItem);
      
      expect(tl).not.toBeNull();
    });
  });

  describe('Clickable Text Flicker (Req 27.5)', () => {
    it('should return null for null element', () => {
      expect(clickableTextFlicker(null)).toBeNull();
    });

    it('should create flicker timeline', () => {
      const text = createElement('span', ['clickable-text']);
      const tl = clickableTextFlicker(text);
      
      expect(tl).not.toBeNull();
      expect(tl.duration()).toBeGreaterThan(0);
    });
  });

  // ============================================
  // NAVIGATION ARROW EFFECTS (Req 27.9)
  // ============================================

  describe('Navigation Arrow Effects (Req 27.9)', () => {
    it('should return null for null element', () => {
      expect(navArrowHoverIn(null)).toBeNull();
      expect(navArrowHoverOut(null)).toBeNull();
    });

    it('should create hover in tween with scale 1.2', () => {
      const arrow = createElement('button', ['nav-arrow']);
      const tween = navArrowHoverIn(arrow);
      
      expect(tween).not.toBeNull();
      expect(tween.vars.scale).toBe(1.2);
    });

    it('should create hover out tween with scale 1', () => {
      const arrow = createElement('button', ['nav-arrow']);
      const tween = navArrowHoverOut(arrow);
      
      expect(tween).not.toBeNull();
      expect(tween.vars.scale).toBe(1);
    });
  });


  // ============================================
  // FEEDBACK ANIMATIONS (Req 27.7, 27.8, 20.1, 20.2)
  // ============================================

  describe('Success Flash (Req 27.7)', () => {
    it('should return null for null element', () => {
      expect(successFlash(null)).toBeNull();
    });

    it('should create flash timeline with correct duration', () => {
      const element = createElement('div');
      const tl = successFlash(element);
      
      expect(tl).not.toBeNull();
      expect(tl.duration()).toBe(EFFECT_DURATIONS.SUCCESS_FLASH);
    });
  });

  describe('Error Shake (Req 27.8)', () => {
    it('should return null for null element', () => {
      expect(errorShake(null)).toBeNull();
    });

    it('should create shake timeline with correct duration', () => {
      const element = createElement('div');
      element.style.borderColor = 'transparent';
      const tl = errorShake(element);
      
      expect(tl).not.toBeNull();
      // Timeline should be approximately 300ms (0.3s) + border flash time
      expect(tl.duration()).toBeGreaterThan(0);
      expect(tl.duration()).toBeLessThanOrEqual(0.4);
    });

    it('should include red border flash', () => {
      const element = createElement('div');
      element.style.borderColor = 'transparent';
      const tl = errorShake(element);
      
      expect(tl).not.toBeNull();
      // Timeline should have multiple children (border + shake + border reset)
      expect(tl.getChildren().length).toBeGreaterThan(1);
    });
  });

  describe('Cursor Blink (Req 20.1)', () => {
    it('should return null for null element', () => {
      expect(createCursorBlink(null)).toBeNull();
    });

    it('should create cursor blink with correct duration', () => {
      const cursor = createElement('span', ['loading-cursor']);
      const tween = createCursorBlink(cursor);
      
      expect(tween).not.toBeNull();
      expect(tween.duration()).toBe(EFFECT_DURATIONS.CURSOR_BLINK);
    });

    it('should use steps(1) ease for discrete blink', () => {
      const cursor = createElement('span', ['loading-cursor']);
      const tween = createCursorBlink(cursor);
      
      expect(tween.vars.ease).toBe('steps(1)');
    });

    it('should track cursor tween in state', () => {
      const cursor = createElement('span', ['loading-cursor']);
      createCursorBlink(cursor);
      
      const state = getEffectsState();
      expect(state.cursorTweensCount).toBe(1);
    });

    it('should stop cursor blink', () => {
      const cursor = createElement('span', ['loading-cursor']);
      createCursorBlink(cursor);
      stopCursorBlink(cursor);
      
      const state = getEffectsState();
      expect(state.cursorTweensCount).toBe(0);
    });
  });

  describe('Loading Dots (Req 20.2)', () => {
    it('should return null for null element', () => {
      expect(createLoadingDots(null)).toBeNull();
    });

    it('should create loading dots timeline', () => {
      const element = createElement('span', ['loading-text']);
      const tl = createLoadingDots(element);
      
      expect(tl).not.toBeNull();
    });

    it('should track loading tween in state', () => {
      const element = createElement('span', ['loading-text']);
      createLoadingDots(element);
      
      const state = getEffectsState();
      expect(state.loadingTweensCount).toBe(1);
    });

    it('should stop loading dots', () => {
      const element = createElement('span', ['loading-text']);
      createLoadingDots(element);
      stopLoadingDots(element);
      
      const state = getEffectsState();
      expect(state.loadingTweensCount).toBe(0);
    });

    it('should use custom base text', () => {
      const element = createElement('span', ['loading-text']);
      const tl = createLoadingDots(element, 'FETCHING');
      
      expect(tl).not.toBeNull();
    });
  });

  describe('Block Progress (Req 20.2)', () => {
    it('should return null for null element', () => {
      expect(createBlockProgress(null)).toBeNull();
    });

    it('should create progress timeline', () => {
      const element = createElement('span', ['loading-progress']);
      const tl = createBlockProgress(element);
      
      expect(tl).not.toBeNull();
    });

    it('should call onComplete callback', () => {
      const element = createElement('span', ['loading-progress']);
      const onComplete = vi.fn();
      const tl = createBlockProgress(element, 2, onComplete);
      
      // Fast-forward timeline
      tl.progress(1);
      
      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('Spinner (Req 26.4)', () => {
    it('should return null for null element', () => {
      expect(createSpinner(null)).toBeNull();
    });

    it('should create spinner timeline', () => {
      const element = createElement('span', ['loading-spinner']);
      const tl = createSpinner(element);
      
      expect(tl).not.toBeNull();
    });

    it('should track spinner in loading tweens', () => {
      const element = createElement('span', ['loading-spinner']);
      createSpinner(element);
      
      const state = getEffectsState();
      expect(state.loadingTweensCount).toBe(1);
    });
  });

  // ============================================
  // IDLE SCREEN FLICKER (Req 2.9)
  // ============================================

  describe('Idle Screen Flicker (Req 2.9)', () => {
    it('should not start flicker for null element', () => {
      startIdleFlicker(null);
      expect(isIdleFlickerActive()).toBe(false);
    });

    it('should start idle flicker', () => {
      const screen = createElement('div', ['teletext-screen']);
      startIdleFlicker(screen);
      
      expect(isIdleFlickerActive()).toBe(true);
    });

    it('should stop idle flicker', () => {
      const screen = createElement('div', ['teletext-screen']);
      startIdleFlicker(screen);
      stopIdleFlicker();
      
      expect(isIdleFlickerActive()).toBe(false);
    });

    it('should have idle timer after start', () => {
      const screen = createElement('div', ['teletext-screen']);
      startIdleFlicker(screen);
      
      const state = getEffectsState();
      expect(state.hasIdleTimer).toBe(true);
    });

    it('should clear idle timer after stop', () => {
      const screen = createElement('div', ['teletext-screen']);
      startIdleFlicker(screen);
      stopIdleFlicker();
      
      const state = getEffectsState();
      expect(state.hasIdleTimer).toBe(false);
    });
  });

  describe('Idle Detection', () => {
    it('should return cleanup function for null element', () => {
      const cleanup = initIdleDetection(null);
      expect(typeof cleanup).toBe('function');
    });

    it('should return cleanup function', () => {
      const screen = createElement('div', ['teletext-screen']);
      const cleanup = initIdleDetection(screen);
      
      expect(typeof cleanup).toBe('function');
      cleanup();
    });

    it('should start idle flicker after timeout', () => {
      const screen = createElement('div', ['teletext-screen']);
      initIdleDetection(screen);
      
      // Fast-forward past idle timeout (30 seconds)
      vi.advanceTimersByTime(EFFECT_DURATIONS.IDLE_TIMEOUT * 1000 + 100);
      
      expect(isIdleFlickerActive()).toBe(true);
    });

    it('should reset idle timer on user activity', () => {
      const screen = createElement('div', ['teletext-screen']);
      initIdleDetection(screen);
      
      // Advance partway through timeout
      vi.advanceTimersByTime(15000);
      
      // Simulate user activity
      document.dispatchEvent(new Event('mousemove'));
      
      // Advance past original timeout
      vi.advanceTimersByTime(20000);
      
      // Should not be idle yet (timer was reset)
      expect(isIdleFlickerActive()).toBe(false);
    });
  });

  // ============================================
  // ATTACHMENT FUNCTIONS
  // ============================================

  describe('Attach Fastext Button Effects', () => {
    it('should return cleanup function for null container', () => {
      const cleanup = attachFastextButtonEffects(null);
      expect(typeof cleanup).toBe('function');
    });

    it('should attach effects to Fastext buttons', () => {
      const container = createElement('div');
      container.innerHTML = `
        <button class="fastext-button fastext-button--red">RED</button>
        <button class="fastext-button fastext-button--green">GREEN</button>
      `;
      
      const cleanup = attachFastextButtonEffects(container);
      expect(typeof cleanup).toBe('function');
      cleanup();
    });
  });

  describe('Attach Menu Item Effects', () => {
    it('should return cleanup function for null container', () => {
      const cleanup = attachMenuItemEffects(null);
      expect(typeof cleanup).toBe('function');
    });

    it('should attach effects to menu items', () => {
      const container = createElement('div');
      container.innerHTML = `
        <div class="menu-item">Item 1</div>
        <div class="menu-item">Item 2</div>
      `;
      
      const cleanup = attachMenuItemEffects(container);
      expect(typeof cleanup).toBe('function');
      cleanup();
    });
  });

  describe('Attach Nav Arrow Effects', () => {
    it('should return cleanup function for null container', () => {
      const cleanup = attachNavArrowEffects(null);
      expect(typeof cleanup).toBe('function');
    });

    it('should attach effects to nav arrows', () => {
      const container = createElement('div');
      container.innerHTML = `
        <button class="nav-arrow">◄</button>
        <button class="nav-arrow">►</button>
      `;
      
      const cleanup = attachNavArrowEffects(container);
      expect(typeof cleanup).toBe('function');
      cleanup();
    });
  });

  describe('Attach All Effects', () => {
    it('should return cleanup function for null container', () => {
      const cleanup = attachAllEffects(null);
      expect(typeof cleanup).toBe('function');
    });

    it('should attach all effects to container', () => {
      const container = createElement('div', ['teletext-screen']);
      container.innerHTML = `
        <button class="fastext-button fastext-button--red">RED</button>
        <div class="menu-item">Item</div>
        <button class="nav-arrow">◄</button>
      `;
      
      const cleanup = attachAllEffects(container);
      expect(typeof cleanup).toBe('function');
      cleanup();
    });
  });

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  describe('Effects State', () => {
    it('should return initial state', () => {
      const state = getEffectsState();
      
      expect(state.isIdle).toBe(false);
      expect(state.hasIdleTimer).toBe(false);
      expect(state.hasIdleFlickerTween).toBe(false);
      expect(state.loadingTweensCount).toBe(0);
      expect(state.cursorTweensCount).toBe(0);
    });

    it('should reset state', () => {
      const cursor = createElement('span');
      createCursorBlink(cursor);
      
      resetEffectsState();
      
      const state = getEffectsState();
      expect(state.cursorTweensCount).toBe(0);
    });
  });

  // ============================================
  // DURATION CONSTANTS
  // ============================================

  describe('Effect Durations', () => {
    it('should have correct button hover duration (0.15s)', () => {
      expect(EFFECT_DURATIONS.BUTTON_HOVER).toBe(0.15);
    });

    it('should have correct button click duration (0.1s)', () => {
      expect(EFFECT_DURATIONS.BUTTON_CLICK).toBe(0.1);
    });

    it('should have correct success flash duration (0.3s)', () => {
      expect(EFFECT_DURATIONS.SUCCESS_FLASH).toBe(0.3);
    });

    it('should have correct cursor blink duration (0.53s)', () => {
      expect(EFFECT_DURATIONS.CURSOR_BLINK).toBe(0.53);
    });

    it('should have correct idle timeout (30s)', () => {
      expect(EFFECT_DURATIONS.IDLE_TIMEOUT).toBe(30);
    });

    it('should have idle flicker interval between 3-5 seconds', () => {
      expect(EFFECT_DURATIONS.IDLE_FLICKER_MIN).toBe(3);
      expect(EFFECT_DURATIONS.IDLE_FLICKER_MAX).toBe(5);
    });
  });
});


// ============================================
// ERROR DISPLAY TESTS (Req 15.1-15.5, 27.8)
// ============================================

import {
  ERROR_TYPES,
  ERROR_MESSAGES,
  createErrorDisplay,
  showError,
  create404Display,
  show404,
  createExtendedLoadingState
} from './effects.js';

describe('Error Display Component (Req 15.1-15.5)', () => {
  beforeEach(() => {
    gsap.killTweensOf('*');
    resetEffectsState();
  });

  describe('ERROR_TYPES', () => {
    it('should define all error types', () => {
      expect(ERROR_TYPES.NETWORK).toBe('network');
      expect(ERROR_TYPES.TIMEOUT).toBe('timeout');
      expect(ERROR_TYPES.RATE_LIMIT).toBe('rate_limit');
      expect(ERROR_TYPES.NOT_FOUND).toBe('not_found');
      expect(ERROR_TYPES.SERVER).toBe('server');
      expect(ERROR_TYPES.PARSE).toBe('parse');
      expect(ERROR_TYPES.VALIDATION).toBe('validation');
      expect(ERROR_TYPES.INVALID_DATE).toBe('invalid_date');
      expect(ERROR_TYPES.LOCATION).toBe('location');
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should have messages for all error types', () => {
      Object.values(ERROR_TYPES).forEach(type => {
        expect(ERROR_MESSAGES[type]).toBeDefined();
        expect(ERROR_MESSAGES[type].title).toBeDefined();
        expect(ERROR_MESSAGES[type].message).toBeDefined();
        expect(ERROR_MESSAGES[type].action).toBeDefined();
      });
    });

    it('should have RETRY action for network errors', () => {
      expect(ERROR_MESSAGES[ERROR_TYPES.NETWORK].action).toBe('RETRY');
    });

    it('should have HOME action for not found errors', () => {
      expect(ERROR_MESSAGES[ERROR_TYPES.NOT_FOUND].action).toBe('HOME');
    });
  });

  describe('createErrorDisplay', () => {
    it('should create error HTML with warning icon', () => {
      const html = createErrorDisplay(ERROR_TYPES.NETWORK);
      expect(html).toContain('⚠');
      expect(html).toContain('error-icon');
    });

    it('should include error title', () => {
      const html = createErrorDisplay(ERROR_TYPES.NETWORK);
      expect(html).toContain('CONNECTION LOST');
      expect(html).toContain('error-title');
    });

    it('should include error message', () => {
      const html = createErrorDisplay(ERROR_TYPES.NETWORK);
      expect(html).toContain('error-message');
    });

    it('should include retry button for RETRY action types', () => {
      const html = createErrorDisplay(ERROR_TYPES.NETWORK);
      expect(html).toContain('RETRY');
      expect(html).toContain('error-retry-btn');
    });

    it('should include home button', () => {
      const html = createErrorDisplay(ERROR_TYPES.NETWORK);
      expect(html).toContain('HOME');
      expect(html).toContain('error-home-btn');
    });

    it('should use custom message when provided', () => {
      const customMsg = 'Custom error message';
      const html = createErrorDisplay(ERROR_TYPES.NETWORK, { customMessage: customMsg });
      expect(html).toContain(customMsg);
    });

    it('should have ARIA attributes for accessibility', () => {
      const html = createErrorDisplay(ERROR_TYPES.NETWORK);
      expect(html).toContain('role="alert"');
      expect(html).toContain('aria-live="assertive"');
    });

    it('should fall back to SERVER error for unknown type', () => {
      const html = createErrorDisplay('unknown_type');
      expect(html).toContain('SERVICE ERROR');
    });
  });

  describe('showError', () => {
    it('should return null for null container', () => {
      const result = showError(null, ERROR_TYPES.NETWORK);
      expect(result).toBeNull();
    });

    it('should render error in container', () => {
      const container = createElement('div');
      showError(container, ERROR_TYPES.NETWORK);
      
      expect(container.querySelector('.error-container')).not.toBeNull();
      expect(container.querySelector('.error-title')).not.toBeNull();
    });

    it('should return cleanup function', () => {
      const container = createElement('div');
      const result = showError(container, ERROR_TYPES.NETWORK);
      
      expect(result).not.toBeNull();
      expect(typeof result.cleanup).toBe('function');
    });

    it('should call onRetry callback when retry button clicked', () => {
      const container = createElement('div');
      const onRetry = vi.fn();
      
      showError(container, ERROR_TYPES.NETWORK, { onRetry });
      
      const retryBtn = container.querySelector('.error-retry-btn');
      retryBtn.click();
      
      expect(onRetry).toHaveBeenCalled();
    });

    it('should call onHome callback when home button clicked', () => {
      const container = createElement('div');
      const onHome = vi.fn();
      
      showError(container, ERROR_TYPES.NETWORK, { onHome });
      
      const homeBtn = container.querySelector('.error-home-btn');
      homeBtn.click();
      
      expect(onHome).toHaveBeenCalled();
    });
  });

  describe('create404Display (Req 3.5, 18.5)', () => {
    it('should create 404 HTML with error icon', () => {
      const html = create404Display(999);
      expect(html).toContain('⚠');
      expect(html).toContain('ERROR 404');
    });

    it('should include page number in message', () => {
      const html = create404Display(999);
      expect(html).toContain('P.999');
    });

    it('should format page number with leading zeros', () => {
      const html = create404Display(42);
      expect(html).toContain('P.042');
    });

    it('should include humorous message', () => {
      const html = create404Display(999);
      expect(html).toContain('gone on holiday');
    });

    it('should include navigation suggestions', () => {
      const html = create404Display(999);
      expect(html).toContain('HOME');
      expect(html).toContain('NEWS');
      expect(html).toContain('WEATHER');
      expect(html).toContain('TIME MACHINE');
    });

    it('should include navigation buttons', () => {
      const html = create404Display(999);
      expect(html).toContain('error-home-btn');
      expect(html).toContain('error-news-btn');
      expect(html).toContain('error-weather-btn');
      expect(html).toContain('error-time-btn');
    });

    it('should have ARIA attributes for accessibility', () => {
      const html = create404Display(999);
      expect(html).toContain('role="alert"');
      expect(html).toContain('aria-live="assertive"');
    });
  });

  describe('show404', () => {
    it('should return null for null container', () => {
      const result = show404(null, 999);
      expect(result).toBeNull();
    });

    it('should render 404 in container', () => {
      const container = createElement('div');
      show404(container, 999);
      
      expect(container.querySelector('.error-404')).not.toBeNull();
      expect(container.querySelector('.error-title')).not.toBeNull();
    });

    it('should return cleanup function', () => {
      const container = createElement('div');
      const result = show404(container, 999);
      
      expect(result).not.toBeNull();
      expect(typeof result.cleanup).toBe('function');
    });
  });
});

describe('Extended Loading State (Req 26.7, 26.8)', () => {
  beforeEach(() => {
    gsap.killTweensOf('*');
    resetEffectsState();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return null for null container', () => {
    const result = createExtendedLoadingState(null);
    expect(result).toBeNull();
  });

  it('should return controller with show, complete, cancel methods', () => {
    const container = createElement('div');
    const controller = createExtendedLoadingState(container);
    
    expect(typeof controller.show).toBe('function');
    expect(typeof controller.complete).toBe('function');
    expect(typeof controller.cancel).toBe('function');
    expect(typeof controller.isActive).toBe('function');
  });

  it('should show loading UI when show() is called', () => {
    const container = createElement('div');
    const controller = createExtendedLoadingState(container);
    
    controller.show();
    
    expect(container.querySelector('.loading-container')).not.toBeNull();
    expect(container.querySelector('.loading-text')).not.toBeNull();
  });

  it('should show extended message after delay (Req 26.7)', () => {
    const container = createElement('div');
    const controller = createExtendedLoadingState(container, { extendedDelay: 3000 });
    
    controller.show();
    
    // Before delay
    const extendedEl = container.querySelector('.loading-extended');
    expect(extendedEl.style.display).toBe('none');
    
    // After delay
    vi.advanceTimersByTime(3100);
    expect(extendedEl.textContent).toContain('STILL LOADING');
  });

  it('should show READY on complete (Req 26.8)', () => {
    const container = createElement('div');
    const controller = createExtendedLoadingState(container);
    
    controller.show();
    controller.complete();
    
    expect(container.querySelector('.loading-ready')).not.toBeNull();
    expect(container.textContent).toContain('READY');
  });

  it('should cancel loading state', () => {
    const container = createElement('div');
    const controller = createExtendedLoadingState(container);
    
    controller.show();
    expect(controller.isActive()).toBe(true);
    
    controller.cancel();
    expect(controller.isActive()).toBe(false);
  });
});
