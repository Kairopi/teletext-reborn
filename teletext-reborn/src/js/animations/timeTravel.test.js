/**
 * Teletext Reborn - Time Travel Animation Tests
 * 
 * Tests for the time travel animation functionality.
 * Requirements: 11.1-11.10, 25.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createTimeTravelHTML,
  createTimeTravelTimeline,
  playTimeTravelAnimation,
  playReverseTimeTravelAnimation,
  isTimeTravelPlaying,
  isTimeTravelComplete,
  getTimeTravelDirection,
  cancelTimeTravelAnimation,
  cleanupTimeTravelAnimation,
  resetTimeTravelState,
  getTimeTravelState,
  TIME_TRAVEL_DURATIONS
} from './timeTravel.js';

// Mock GSAP
vi.mock('gsap', () => {
  const mockTimeline = {
    set: vi.fn().mockReturnThis(),
    to: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    call: vi.fn().mockReturnThis(),
    add: vi.fn().mockReturnThis(),
    kill: vi.fn(),
    progress: vi.fn().mockReturnValue(0),
    duration: vi.fn().mockReturnValue(2.5),
    play: vi.fn().mockReturnThis(),
    pause: vi.fn().mockReturnThis(),
    _onStart: null,
    _onComplete: null
  };
  
  // Capture callbacks
  mockTimeline.set.mockImplementation(function() { return this; });
  mockTimeline.to.mockImplementation(function() { return this; });
  mockTimeline.from.mockImplementation(function() { return this; });
  mockTimeline.call.mockImplementation(function() { return this; });
  mockTimeline.add.mockImplementation(function() { return this; });
  
  return {
    default: {
      timeline: vi.fn((options = {}) => {
        mockTimeline._onStart = options.onStart;
        mockTimeline._onComplete = options.onComplete;
        return mockTimeline;
      }),
      to: vi.fn().mockReturnValue(mockTimeline),
      from: vi.fn().mockReturnValue(mockTimeline),
      set: vi.fn().mockReturnValue(mockTimeline),
      registerPlugin: vi.fn()
    },
    TextPlugin: {}
  };
});

describe('Time Travel Animation', () => {
  let container;
  
  beforeEach(() => {
    // Reset state before each test
    resetTimeTravelState();
    
    // Create container element
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    // Clean up
    cleanupTimeTravelAnimation();
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.clearAllMocks();
  });

  
  describe('TIME_TRAVEL_DURATIONS', () => {
    it('should have total duration of 2.5 seconds (Req 11.1)', () => {
      expect(TIME_TRAVEL_DURATIONS.TOTAL).toBe(2.5);
    });
    
    it('should have blur phase duration of 0.3 seconds (Req 11.2)', () => {
      expect(TIME_TRAVEL_DURATIONS.BLUR_PHASE).toBe(0.3);
    });
    
    it('should have flash durations totaling 0.2 seconds (Req 11.2)', () => {
      expect(TIME_TRAVEL_DURATIONS.FLASH_IN + TIME_TRAVEL_DURATIONS.FLASH_OUT).toBe(0.2);
    });
    
    it('should have year counter duration of 1.5 seconds (Req 11.2)', () => {
      expect(TIME_TRAVEL_DURATIONS.YEAR_COUNTER).toBe(1.5);
    });
    
    it('should have unblur phase duration of 0.3 seconds (Req 11.2)', () => {
      expect(TIME_TRAVEL_DURATIONS.UNBLUR_PHASE).toBe(0.3);
    });
    
    it('should have final pause duration of 0.2 seconds (Req 11.5)', () => {
      expect(TIME_TRAVEL_DURATIONS.FINAL_PAUSE).toBe(0.2);
    });
  });
  
  describe('createTimeTravelHTML', () => {
    it('should return HTML string with overlay structure', () => {
      const html = createTimeTravelHTML();
      
      expect(html).toContain('time-travel-overlay');
      expect(html).toContain('time-travel-flash');
      expect(html).toContain('time-travel-content');
      expect(html).toContain('time-travel-text');
      expect(html).toContain('time-travel-year');
    });
    
    it('should include proper IDs for DOM manipulation', () => {
      const html = createTimeTravelHTML();
      
      expect(html).toContain('id="time-travel-overlay"');
      expect(html).toContain('id="time-travel-flash"');
      expect(html).toContain('id="time-travel-content"');
      expect(html).toContain('id="time-travel-text"');
      expect(html).toContain('id="time-travel-year"');
    });
    
    it('should include double-height class for year display (Req 11.3)', () => {
      const html = createTimeTravelHTML();
      
      expect(html).toContain('double-height');
    });
    
    it('should include phosphor-glow class for CRT effect', () => {
      const html = createTimeTravelHTML();
      
      expect(html).toContain('phosphor-glow');
    });
  });
  
  describe('State Management', () => {
    it('should start with isPlaying false', () => {
      expect(isTimeTravelPlaying()).toBe(false);
    });
    
    it('should start with isComplete false', () => {
      expect(isTimeTravelComplete()).toBe(false);
    });
    
    it('should start with direction null', () => {
      expect(getTimeTravelDirection()).toBe(null);
    });
    
    it('should return correct state object', () => {
      const state = getTimeTravelState();
      
      expect(state).toHaveProperty('isPlaying');
      expect(state).toHaveProperty('isComplete');
      expect(state).toHaveProperty('direction');
      expect(state.isPlaying).toBe(false);
      expect(state.isComplete).toBe(false);
      expect(state.direction).toBe(null);
    });
    
    it('should reset state correctly', () => {
      // Manually set some state by inserting HTML
      container.insertAdjacentHTML('afterbegin', createTimeTravelHTML());
      
      resetTimeTravelState();
      
      const state = getTimeTravelState();
      expect(state.isPlaying).toBe(false);
      expect(state.isComplete).toBe(false);
      expect(state.direction).toBe(null);
    });
  });

  
  describe('createTimeTravelTimeline', () => {
    beforeEach(() => {
      // Insert the overlay HTML
      container.insertAdjacentHTML('afterbegin', createTimeTravelHTML());
    });
    
    it('should return null if targetYear is not provided', () => {
      const timeline = createTimeTravelTimeline({});
      
      expect(timeline).toBe(null);
    });
    
    it('should return null if overlay elements are not found', () => {
      // Remove the overlay
      const overlay = document.getElementById('time-travel-overlay');
      if (overlay) overlay.remove();
      
      const timeline = createTimeTravelTimeline({ targetYear: 1969 });
      
      expect(timeline).toBe(null);
    });
    
    it('should create timeline with valid targetYear', () => {
      const timeline = createTimeTravelTimeline({ targetYear: 1969 });
      
      expect(timeline).not.toBe(null);
    });
    
    it('should use current year as default startYear', () => {
      const currentYear = new Date().getFullYear();
      const timeline = createTimeTravelTimeline({ targetYear: 1969 });
      
      // Timeline should be created (we can't easily verify startYear without more complex mocking)
      expect(timeline).not.toBe(null);
    });
    
    it('should set direction to forward for normal time travel', () => {
      createTimeTravelTimeline({ targetYear: 1969, isReverse: false });
      
      expect(getTimeTravelDirection()).toBe('forward');
    });
    
    it('should set direction to backward for reverse time travel (Req 11.7)', () => {
      createTimeTravelTimeline({ targetYear: 2025, isReverse: true });
      
      expect(getTimeTravelDirection()).toBe('backward');
    });
  });
  
  describe('playTimeTravelAnimation', () => {
    it('should return null if container is not provided', () => {
      const timeline = playTimeTravelAnimation({ targetYear: 1969 });
      
      expect(timeline).toBe(null);
    });
    
    it('should return null if targetYear is not provided', () => {
      const timeline = playTimeTravelAnimation({ container });
      
      expect(timeline).toBe(null);
    });
    
    it('should insert overlay HTML into container', () => {
      playTimeTravelAnimation({ container, targetYear: 1969 });
      
      const overlay = document.getElementById('time-travel-overlay');
      expect(overlay).not.toBe(null);
    });
    
    it('should call disableNavigation if provided (Req 11.10)', () => {
      const disableNavigation = vi.fn();
      
      playTimeTravelAnimation({ 
        container, 
        targetYear: 1969,
        disableNavigation 
      });
      
      expect(disableNavigation).toHaveBeenCalled();
    });
    
    it('should return null if animation is already playing (Req 11.10)', () => {
      // Start first animation
      const firstTimeline = playTimeTravelAnimation({ container, targetYear: 1969 });
      
      // Manually trigger onStart to set isPlaying state (simulating GSAP behavior)
      if (firstTimeline && firstTimeline._onStart) {
        firstTimeline._onStart();
      }
      
      // Try to start second animation
      const secondTimeline = playTimeTravelAnimation({ container, targetYear: 1985 });
      
      // Second should be rejected
      expect(secondTimeline).toBe(null);
    });
  });
  
  describe('playReverseTimeTravelAnimation', () => {
    it('should return null if container is not provided', () => {
      const timeline = playReverseTimeTravelAnimation({ fromYear: 1969 });
      
      expect(timeline).toBe(null);
    });
    
    it('should return null if fromYear is not provided', () => {
      const timeline = playReverseTimeTravelAnimation({ container });
      
      expect(timeline).toBe(null);
    });
    
    it('should insert overlay HTML into container', () => {
      playReverseTimeTravelAnimation({ container, fromYear: 1969 });
      
      const overlay = document.getElementById('time-travel-overlay');
      expect(overlay).not.toBe(null);
    });
    
    it('should call disableNavigation if provided (Req 11.10)', () => {
      const disableNavigation = vi.fn();
      
      playReverseTimeTravelAnimation({ 
        container, 
        fromYear: 1969,
        disableNavigation 
      });
      
      expect(disableNavigation).toHaveBeenCalled();
    });
    
    it('should return null if animation is already playing (Req 11.10)', () => {
      // Start first animation
      const firstTimeline = playReverseTimeTravelAnimation({ container, fromYear: 1969 });
      
      // Manually trigger onStart to set isPlaying state (simulating GSAP behavior)
      if (firstTimeline && firstTimeline._onStart) {
        firstTimeline._onStart();
      }
      
      // Try to start second animation
      const secondTimeline = playReverseTimeTravelAnimation({ container, fromYear: 1985 });
      
      // Second should be rejected
      expect(secondTimeline).toBe(null);
    });
  });

  
  describe('Reverse Time Travel Animation (Req 11.7, 11.8)', () => {
    beforeEach(() => {
      container.insertAdjacentHTML('afterbegin', createTimeTravelHTML());
    });
    
    it('should set direction to backward for reverse animation (Req 11.7)', () => {
      const currentYear = new Date().getFullYear();
      createTimeTravelTimeline({ 
        targetYear: currentYear, 
        startYear: 1969,
        isReverse: true 
      });
      
      expect(getTimeTravelDirection()).toBe('backward');
    });
    
    it('should count years forward from historical to current (Req 11.8)', () => {
      const currentYear = new Date().getFullYear();
      const fromYear = 1969;
      
      // The reverse animation should go from fromYear to currentYear
      const timeline = createTimeTravelTimeline({ 
        targetYear: currentYear, 
        startYear: fromYear,
        isReverse: true 
      });
      
      // Timeline should be created successfully
      expect(timeline).not.toBe(null);
    });
    
    it('playReverseTimeTravelAnimation should use current year as target', () => {
      const fromYear = 1969;
      
      const timeline = playReverseTimeTravelAnimation({ 
        container, 
        fromYear 
      });
      
      // Timeline should be created
      expect(timeline).not.toBe(null);
      
      // Direction should be backward
      expect(getTimeTravelDirection()).toBe('backward');
    });
  });
  
  describe('cancelTimeTravelAnimation', () => {
    it('should reset isPlaying to false', () => {
      // Start animation
      playTimeTravelAnimation({ container, targetYear: 1969 });
      
      // Cancel it
      cancelTimeTravelAnimation();
      
      expect(isTimeTravelPlaying()).toBe(false);
    });
    
    it('should reset direction to null', () => {
      // Start animation
      playTimeTravelAnimation({ container, targetYear: 1969 });
      
      // Cancel it
      cancelTimeTravelAnimation();
      
      expect(getTimeTravelDirection()).toBe(null);
    });
  });
  
  describe('cleanupTimeTravelAnimation', () => {
    it('should remove overlay element from DOM', () => {
      // Start animation
      playTimeTravelAnimation({ container, targetYear: 1969 });
      
      // Verify overlay exists
      expect(document.getElementById('time-travel-overlay')).not.toBe(null);
      
      // Clean up
      cleanupTimeTravelAnimation();
      
      // Verify overlay is removed
      expect(document.getElementById('time-travel-overlay')).toBe(null);
    });
    
    it('should reset state', () => {
      // Start animation
      playTimeTravelAnimation({ container, targetYear: 1969 });
      
      // Clean up
      cleanupTimeTravelAnimation();
      
      const state = getTimeTravelState();
      expect(state.isPlaying).toBe(false);
      expect(state.isComplete).toBe(false);
      expect(state.direction).toBe(null);
    });
  });
  
  describe('Requirements Validation', () => {
    beforeEach(() => {
      container.insertAdjacentHTML('afterbegin', createTimeTravelHTML());
    });
    
    it('Req 11.1: Animation should be configured for 2.5 seconds total', () => {
      expect(TIME_TRAVEL_DURATIONS.TOTAL).toBe(2.5);
    });
    
    it('Req 11.2: Should have all four phases defined', () => {
      // Phase 1: Blur (0-0.3s)
      expect(TIME_TRAVEL_DURATIONS.BLUR_PHASE).toBe(0.3);
      
      // Phase 2: Flash (0.3-0.5s)
      expect(TIME_TRAVEL_DURATIONS.FLASH_IN).toBe(0.1);
      expect(TIME_TRAVEL_DURATIONS.FLASH_OUT).toBe(0.1);
      
      // Phase 3: Year counter (0.5-2.0s)
      expect(TIME_TRAVEL_DURATIONS.YEAR_COUNTER).toBe(1.5);
      
      // Phase 4: Unblur (2.0-2.5s)
      expect(TIME_TRAVEL_DURATIONS.UNBLUR_PHASE).toBe(0.3);
    });
    
    it('Req 11.3: Year counter should use double-height text', () => {
      const html = createTimeTravelHTML();
      expect(html).toContain('double-height');
    });
    
    it('Req 11.4: Should have typewriter text duration defined', () => {
      expect(TIME_TRAVEL_DURATIONS.TYPEWRITER).toBe(0.8);
    });
    
    it('Req 11.5: Should have final pause duration defined', () => {
      expect(TIME_TRAVEL_DURATIONS.FINAL_PAUSE).toBe(0.2);
    });
    
    it('Req 11.6: Should have content stagger duration defined', () => {
      expect(TIME_TRAVEL_DURATIONS.CONTENT_STAGGER).toBe(0.05);
    });
    
    it('Req 11.7: Reverse animation should set direction to backward', () => {
      createTimeTravelTimeline({ targetYear: 2025, isReverse: true });
      expect(getTimeTravelDirection()).toBe('backward');
    });
    
    it('Req 11.9: Should have screen shake duration defined', () => {
      expect(TIME_TRAVEL_DURATIONS.SHAKE_DURATION).toBe(0.05);
    });
    
    it('Req 11.10: Should prevent multiple simultaneous animations', () => {
      // Start first animation
      const first = playTimeTravelAnimation({ container, targetYear: 1969 });
      
      // Manually trigger onStart to set isPlaying state (simulating GSAP behavior)
      if (first && first._onStart) {
        first._onStart();
      }
      
      // Try to start second
      const second = playTimeTravelAnimation({ container, targetYear: 1985 });
      
      expect(first).not.toBe(null);
      expect(second).toBe(null);
    });
  });
});
