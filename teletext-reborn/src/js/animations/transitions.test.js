/**
 * Teletext Reborn - Page Transition Tests
 * 
 * Tests for page transition animations including:
 * - Transition type determination
 * - State management
 * - Timeline creation
 * 
 * Requirements: 3.6, 25.1, 30.9, 31.1-31.10
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  TRANSITION_TYPES,
  TRANSITION_DURATIONS,
  hasVisitedPage,
  markPageVisited,
  clearVisitedPages,
  isTransitioning,
  getTransitionType,
  createExitTimeline,
  createStaticFlashTimeline,
  createEnterTimeline,
  createPageTransition,
  playPageTransition,
  cancelTransition,
  resetTransitionState,
  getTransitionState
} from './transitions.js';

// Mock GSAP for testing
vi.mock('gsap', () => {
  const mockTimeline = {
    to: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    add: vi.fn().mockReturnThis(),
    call: vi.fn().mockReturnThis(),
    kill: vi.fn().mockReturnThis(),
    duration: vi.fn().mockReturnValue(0.4)
  };
  
  return {
    default: {
      timeline: vi.fn(() => mockTimeline),
      to: vi.fn().mockReturnValue(mockTimeline),
      from: vi.fn().mockReturnValue(mockTimeline),
      set: vi.fn().mockReturnValue(mockTimeline),
      killTweensOf: vi.fn()
    }
  };
});

describe('Page Transitions', () => {
  beforeEach(() => {
    // Reset state before each test
    resetTransitionState();
    
    // Setup minimal DOM
    document.body.innerHTML = `
      <div class="teletext-screen">
        <div class="header-bar" id="header-bar"></div>
        <div class="content-area" id="content-area">
          <div class="content-line">Line 1</div>
          <div class="content-line">Line 2</div>
          <div class="content-line">Line 3</div>
        </div>
        <div class="navigation-bar" id="navigation-bar"></div>
        <div class="static-overlay" id="static-overlay"></div>
      </div>
    `;
  });
  
  afterEach(() => {
    resetTransitionState();
    document.body.innerHTML = '';
  });
  
  describe('Constants', () => {
    it('should export correct transition types', () => {
      expect(TRANSITION_TYPES.FADE).toBe('fade');
      expect(TRANSITION_TYPES.SLIDE_LEFT).toBe('slideLeft');
      expect(TRANSITION_TYPES.SLIDE_RIGHT).toBe('slideRight');
      expect(TRANSITION_TYPES.SLIDE_UP).toBe('slideUp');
      expect(TRANSITION_TYPES.SLIDE_DOWN).toBe('slideDown');
      expect(TRANSITION_TYPES.FASTEXT).toBe('fastext');
    });
    
    it('should export correct transition durations per requirements', () => {
      // Req 31.1: Exit duration 0.15s
      expect(TRANSITION_DURATIONS.EXIT).toBe(0.15);
      
      // Req 31.2: Static flash 50ms
      expect(TRANSITION_DURATIONS.STATIC_FLASH).toBe(0.05);
      
      // Req 31.3: Header enter 0.1s
      expect(TRANSITION_DURATIONS.HEADER_ENTER).toBe(0.1);
      
      // Req 31.3: Content enter 0.2s
      expect(TRANSITION_DURATIONS.CONTENT_ENTER).toBe(0.2);
      
      // Req 31.3: Navigation enter 0.1s
      expect(TRANSITION_DURATIONS.NAV_ENTER).toBe(0.1);
      
      // Req 31.4: Line stagger 0.03s
      expect(TRANSITION_DURATIONS.LINE_STAGGER).toBe(0.03);
      
      // Req 31.9: Fast transition 0.2s
      expect(TRANSITION_DURATIONS.FAST_TOTAL).toBe(0.2);
    });
  });
  
  describe('Visited Pages Tracking', () => {
    it('should track visited pages', () => {
      expect(hasVisitedPage(100)).toBe(false);
      
      markPageVisited(100);
      expect(hasVisitedPage(100)).toBe(true);
      
      markPageVisited(200);
      expect(hasVisitedPage(200)).toBe(true);
      expect(hasVisitedPage(100)).toBe(true);
    });
    
    it('should clear visited pages', () => {
      markPageVisited(100);
      markPageVisited(200);
      
      clearVisitedPages();
      
      expect(hasVisitedPage(100)).toBe(false);
      expect(hasVisitedPage(200)).toBe(false);
    });
  });
  
  describe('Transition State', () => {
    it('should initially not be transitioning', () => {
      expect(isTransitioning()).toBe(false);
    });
    
    it('should report correct state', () => {
      const state = getTransitionState();
      expect(state.isTransitioning).toBe(false);
      expect(state.visitedPagesCount).toBe(0);
      
      markPageVisited(100);
      markPageVisited(200);
      
      const updatedState = getTransitionState();
      expect(updatedState.visitedPagesCount).toBe(2);
    });
    
    it('should reset state correctly', () => {
      markPageVisited(100);
      markPageVisited(200);
      
      resetTransitionState();
      
      const state = getTransitionState();
      expect(state.isTransitioning).toBe(false);
      expect(state.visitedPagesCount).toBe(0);
    });
  });
  
  describe('getTransitionType', () => {
    // Req 31.5: Horizontal slide for Prev/Next
    it('should return slideRight for prev trigger', () => {
      const result = getTransitionType({ trigger: 'prev' });
      expect(result.type).toBe(TRANSITION_TYPES.SLIDE_RIGHT);
    });
    
    it('should return slideLeft for next trigger', () => {
      const result = getTransitionType({ trigger: 'next' });
      expect(result.type).toBe(TRANSITION_TYPES.SLIDE_LEFT);
    });
    
    // Req 31.6: Vertical slide for page number input
    it('should return slideUp for input trigger', () => {
      const result = getTransitionType({ trigger: 'input' });
      expect(result.type).toBe(TRANSITION_TYPES.SLIDE_UP);
    });
    
    // Req 31.7: Fastext with color flash
    it('should return fastext type with color for fastext trigger', () => {
      const result = getTransitionType({ 
        trigger: 'fastext', 
        fastextColor: 'red' 
      });
      expect(result.type).toBe(TRANSITION_TYPES.FASTEXT);
      expect(result.fastextColor).toBe('red');
    });
    
    it('should determine direction by page number comparison', () => {
      // Going to higher page number = slide left
      const forward = getTransitionType({ fromPage: 100, toPage: 200 });
      expect(forward.type).toBe(TRANSITION_TYPES.SLIDE_LEFT);
      
      // Going to lower page number = slide right
      const backward = getTransitionType({ fromPage: 200, toPage: 100 });
      expect(backward.type).toBe(TRANSITION_TYPES.SLIDE_RIGHT);
    });
    
    it('should default to fade for same page or no context', () => {
      const samePage = getTransitionType({ fromPage: 100, toPage: 100 });
      expect(samePage.type).toBe(TRANSITION_TYPES.FADE);
      
      const noContext = getTransitionType({});
      expect(noContext.type).toBe(TRANSITION_TYPES.FADE);
    });
  });
  
  describe('createExitTimeline', () => {
    it('should create exit timeline with content area', () => {
      const contentArea = document.getElementById('content-area');
      const tl = createExitTimeline({ contentArea });
      
      expect(tl).toBeDefined();
      expect(tl.to).toHaveBeenCalled();
    });
    
    it('should handle missing content area gracefully', () => {
      const tl = createExitTimeline({});
      expect(tl).toBeDefined();
    });
    
    it('should use different offsets for different transition types', () => {
      const contentArea = document.getElementById('content-area');
      
      // Test each transition type creates a timeline
      Object.values(TRANSITION_TYPES).forEach(type => {
        const tl = createExitTimeline({ contentArea, type });
        expect(tl).toBeDefined();
      });
    });
  });
  
  describe('createStaticFlashTimeline', () => {
    it('should create static flash timeline with overlay', () => {
      const staticOverlay = document.getElementById('static-overlay');
      const tl = createStaticFlashTimeline({ staticOverlay });
      
      expect(tl).toBeDefined();
      expect(tl.to).toHaveBeenCalled();
    });
    
    it('should handle missing overlay gracefully', () => {
      const tl = createStaticFlashTimeline({});
      expect(tl).toBeDefined();
    });
  });
  
  describe('createEnterTimeline', () => {
    it('should create enter timeline with content area', () => {
      const contentArea = document.getElementById('content-area');
      const tl = createEnterTimeline({ contentArea });
      
      expect(tl).toBeDefined();
      expect(tl.set).toHaveBeenCalled();
      expect(tl.to).toHaveBeenCalled();
    });
    
    it('should include header and navigation when provided', () => {
      const contentArea = document.getElementById('content-area');
      const headerBar = document.getElementById('header-bar');
      const navigationBar = document.getElementById('navigation-bar');
      
      const tl = createEnterTimeline({ contentArea, headerBar, navigationBar });
      
      expect(tl).toBeDefined();
      expect(tl.from).toHaveBeenCalled();
    });
    
    it('should handle missing content area gracefully', () => {
      const tl = createEnterTimeline({});
      expect(tl).toBeDefined();
    });
  });
  
  describe('createPageTransition', () => {
    it('should create complete page transition timeline', () => {
      const contentArea = document.getElementById('content-area');
      const staticOverlay = document.getElementById('static-overlay');
      
      const tl = createPageTransition({ contentArea, staticOverlay });
      
      expect(tl).toBeDefined();
      expect(tl.add).toHaveBeenCalled();
    });
    
    it('should mark target page as visited', () => {
      const contentArea = document.getElementById('content-area');
      
      createPageTransition({ contentArea, targetPage: 100 });
      
      expect(hasVisitedPage(100)).toBe(true);
    });
    
    it('should handle missing content area gracefully', () => {
      const tl = createPageTransition({});
      expect(tl).toBeDefined();
    });
  });
  
  describe('playPageTransition', () => {
    it('should play page transition', () => {
      const contentArea = document.getElementById('content-area');
      
      const tl = playPageTransition({ contentArea });
      
      expect(tl).toBeDefined();
    });
    
    it('should handle missing content area', () => {
      const tl = playPageTransition({});
      expect(tl).toBeDefined();
    });
  });
  
  describe('cancelTransition', () => {
    it('should cancel current transition', () => {
      const contentArea = document.getElementById('content-area');
      
      createPageTransition({ contentArea });
      cancelTransition();
      
      expect(isTransitioning()).toBe(false);
    });
    
    it('should handle no active transition', () => {
      // Should not throw
      expect(() => cancelTransition()).not.toThrow();
    });
  });
});

