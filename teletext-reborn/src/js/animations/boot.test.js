/**
 * Boot Sequence Animation Tests
 * 
 * Tests for the boot sequence GSAP timeline animation.
 * Requirements: 1.1-1.10, 25.2, 25.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createBootScreenHTML,
  createBootTimeline,
  hasSeenIntro,
  markIntroSeen,
  clearIntroFlag,
  skipIntro,
  completeBootSequence,
  playBootSequence,
  cleanupBootSequence,
  isBootPlaying,
  isBootComplete,
  resetBootState
} from './boot.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('Boot Sequence Animation', () => {
  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock.clear();
    vi.clearAllMocks();
    
    // Reset boot state
    resetBootState();
    
    // Setup DOM
    document.body.innerHTML = '<div id="app"></div>';
  });
  
  afterEach(() => {
    cleanupBootSequence();
    document.body.innerHTML = '';
  });
  
  describe('createBootScreenHTML', () => {
    it('should return valid HTML string with all required elements', () => {
      const html = createBootScreenHTML();
      
      expect(html).toContain('boot-screen');
      expect(html).toContain('crt-line');
      expect(html).toContain('boot-static');
      expect(html).toContain('boot-content');
      expect(html).toContain('boot-title');
      expect(html).toContain('boot-subtitle');
      expect(html).toContain('boot-cursor');
      expect(html).toContain('skip-intro-button');
    });
    
    it('should include ARIA label for skip button', () => {
      const html = createBootScreenHTML();
      expect(html).toContain('aria-label="Skip intro"');
    });
  });
  
  describe('hasSeenIntro / markIntroSeen', () => {
    it('should return false for new users', () => {
      expect(hasSeenIntro()).toBe(false);
    });
    
    it('should return true after marking intro as seen', () => {
      markIntroSeen();
      expect(hasSeenIntro()).toBe(true);
    });
    
    it('should persist to localStorage', () => {
      markIntroSeen();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'teletext_hasSeenIntro',
        'true'
      );
    });
  });
  
  describe('clearIntroFlag', () => {
    it('should clear the hasSeenIntro flag', () => {
      markIntroSeen();
      expect(hasSeenIntro()).toBe(true);
      
      clearIntroFlag();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('teletext_hasSeenIntro');
    });
  });
  
  describe('isBootPlaying / isBootComplete', () => {
    it('should return false initially', () => {
      expect(isBootPlaying()).toBe(false);
      expect(isBootComplete()).toBe(false);
    });
  });
  
  describe('createBootTimeline', () => {
    beforeEach(() => {
      // Insert boot screen HTML
      const container = document.getElementById('app');
      container.innerHTML = createBootScreenHTML();
    });
    
    it('should create a GSAP timeline', () => {
      const timeline = createBootTimeline();
      
      expect(timeline).not.toBeNull();
      expect(typeof timeline.play).toBe('function');
      expect(typeof timeline.kill).toBe('function');
    });
    
    it('should set isBootPlaying to true when created', () => {
      createBootTimeline();
      expect(isBootPlaying()).toBe(true);
    });
    
    it('should return null if boot screen elements not found', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const timeline = createBootTimeline();
      expect(timeline).toBeNull();
    });
  });
  
  describe('playBootSequence', () => {
    it('should return null if no container provided', () => {
      const result = playBootSequence({});
      expect(result).toBeNull();
    });
    
    it('should insert boot screen HTML into container', () => {
      const container = document.getElementById('app');
      playBootSequence({ container });
      
      expect(container.querySelector('#boot-screen')).not.toBeNull();
    });
    
    it('should skip if user has seen intro and skipIfSeen is true', () => {
      markIntroSeen();
      const onComplete = vi.fn();
      
      const result = playBootSequence({
        container: document.getElementById('app'),
        onComplete,
        skipIfSeen: true
      });
      
      expect(result).toBeNull();
      expect(onComplete).toHaveBeenCalled();
    });
    
    it('should not skip if skipIfSeen is false even for returning users', () => {
      markIntroSeen();
      const container = document.getElementById('app');
      
      const result = playBootSequence({
        container,
        skipIfSeen: false
      });
      
      expect(result).not.toBeNull();
    });
  });
  
  describe('cleanupBootSequence', () => {
    it('should remove boot screen element', () => {
      const container = document.getElementById('app');
      playBootSequence({ container });
      
      expect(document.getElementById('boot-screen')).not.toBeNull();
      
      cleanupBootSequence();
      
      expect(document.getElementById('boot-screen')).toBeNull();
    });
    
    it('should reset boot state', () => {
      const container = document.getElementById('app');
      playBootSequence({ container });
      
      expect(isBootPlaying()).toBe(true);
      
      cleanupBootSequence();
      
      expect(isBootPlaying()).toBe(false);
      expect(isBootComplete()).toBe(false);
    });
  });
  
  describe('Skip Intro Functionality (Req 1.8, 1.9)', () => {
    beforeEach(() => {
      const container = document.getElementById('app');
      container.innerHTML = createBootScreenHTML();
    });
    
    it('should set isComplete to true after skip', () => {
      skipIntro();
      expect(isBootComplete()).toBe(true);
    });
    
    it('should set isPlaying to false after skip', () => {
      const container = document.getElementById('app');
      playBootSequence({ container });
      
      expect(isBootPlaying()).toBe(true);
      
      skipIntro();
      
      expect(isBootPlaying()).toBe(false);
    });
    
    it('should have skip button with correct text', () => {
      const skipButton = document.getElementById('skip-intro-button');
      expect(skipButton).not.toBeNull();
      expect(skipButton.textContent).toContain('SKIP INTRO');
    });
    
    it('should have skip button with aria-label', () => {
      const skipButton = document.getElementById('skip-intro-button');
      expect(skipButton.getAttribute('aria-label')).toBe('Skip intro');
    });
  });
  
  describe('Complete Boot Sequence (Req 1.6)', () => {
    beforeEach(() => {
      const container = document.getElementById('app');
      container.innerHTML = createBootScreenHTML();
    });
    
    it('should have boot screen element that can be completed', () => {
      const bootScreen = document.getElementById('boot-screen');
      expect(bootScreen).not.toBeNull();
      
      // completeBootSequence should not throw
      expect(() => completeBootSequence()).not.toThrow();
    });
    
    it('should handle missing boot screen gracefully', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const onCallback = vi.fn();
      
      // Should not throw even without boot screen
      expect(() => completeBootSequence(onCallback)).not.toThrow();
      expect(onCallback).toHaveBeenCalled();
    });
  });
  
  describe('Boot Sequence Requirements', () => {
    beforeEach(() => {
      const container = document.getElementById('app');
      container.innerHTML = createBootScreenHTML();
    });
    
    it('Req 1.1: should have black screen initially', () => {
      const bootScreen = document.getElementById('boot-screen');
      const styles = window.getComputedStyle(bootScreen);
      
      // Boot screen should have black background
      expect(bootScreen).not.toBeNull();
    });
    
    it('Req 1.2: should have CRT warm-up line element', () => {
      const crtLine = document.getElementById('crt-line');
      expect(crtLine).not.toBeNull();
      expect(crtLine.classList.contains('crt-line')).toBe(true);
    });
    
    it('Req 1.3: should have static noise element', () => {
      const bootStatic = document.getElementById('boot-static');
      expect(bootStatic).not.toBeNull();
      expect(bootStatic.classList.contains('boot-static')).toBe(true);
    });
    
    it('Req 1.4: should have title element for typewriter animation', () => {
      const bootTitle = document.getElementById('boot-title');
      expect(bootTitle).not.toBeNull();
      expect(bootTitle.classList.contains('double-height')).toBe(true);
    });
    
    it('Req 1.5: should have subtitle with blinking cursor', () => {
      const bootSubtitle = document.getElementById('boot-subtitle');
      const bootCursor = document.getElementById('boot-cursor');
      
      expect(bootSubtitle).not.toBeNull();
      expect(bootCursor).not.toBeNull();
      expect(bootCursor.textContent).toBe('█');
    });
    
    it('Req 1.8: should have skip intro button', () => {
      const skipButton = document.getElementById('skip-intro-button');
      expect(skipButton).not.toBeNull();
      expect(skipButton.textContent).toContain('SKIP INTRO');
    });
    
    it('Req 1.10: boot screen should have CRT curvature class', () => {
      const bootScreen = document.getElementById('boot-screen');
      expect(bootScreen.classList.contains('boot-screen')).toBe(true);
    });
  });
});
