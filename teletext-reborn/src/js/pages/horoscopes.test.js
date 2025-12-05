/**
 * Teletext Reborn - Horoscopes Page Tests
 * 
 * Property-based tests for horoscopes page component.
 * 
 * @module pages/horoscopes.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import {
  render,
  getFastextButtons,
  getSignIdFromPageNumber,
  getHoroscopePages,
  resetHoroscopesPageState,
  HOROSCOPE_PAGES
} from './horoscopes.js';
import { ZODIAC_SIGNS, getAllSigns } from '../services/horoscopeService.js';

// Mock GSAP to avoid animation issues in tests
vi.mock('gsap', () => ({
  default: {
    timeline: () => ({
      from: vi.fn().mockReturnThis(),
      to: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      kill: vi.fn()
    }),
    to: vi.fn(() => ({ kill: vi.fn() })),
    from: vi.fn(() => ({ kill: vi.fn() })),
    killTweensOf: vi.fn()
  }
}));

describe('Horoscopes Page', () => {
  
  beforeEach(() => {
    // Reset page state before each test
    resetHoroscopesPageState();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    Object.defineProperty(global, 'localStorage', { value: localStorageMock });
  });
  
  afterEach(() => {
    resetHoroscopesPageState();
    vi.clearAllMocks();
  });
  
  // ============================================
  // Property 3: Zodiac Sign Coverage
  // **Feature: teletext-classic-features, Property 3: Zodiac Sign Coverage**
  // **Validates: Requirements 27.3**
  // ============================================
  
  describe('Property 3: Zodiac Sign Coverage', () => {
    it('should render exactly 12 zodiac signs on the index page (450)', () => {
      const html = render(HOROSCOPE_PAGES.INDEX);
      
      // Count zodiac sign elements in the rendered HTML
      const signMatches = html.match(/class="zodiac-sign/g);
      
      expect(signMatches).not.toBeNull();
      expect(signMatches.length).toBe(12);
    });
    
    it('should include all 12 zodiac symbols in the index page', () => {
      const html = render(HOROSCOPE_PAGES.INDEX);
      const allSigns = getAllSigns();
      
      // Verify each zodiac symbol is present
      for (const sign of allSigns) {
        expect(html).toContain(sign.symbol);
        expect(html).toContain(sign.name.toUpperCase());
      }
    });
    
    it('should render all zodiac signs with correct page links', () => {
      const html = render(HOROSCOPE_PAGES.INDEX);
      
      // Each sign should link to its corresponding page (451-462)
      for (let signId = 1; signId <= 12; signId++) {
        const expectedPage = 450 + signId;
        expect(html).toContain(`data-page="${expectedPage}"`);
      }
    });
  });
  
  // ============================================
  // Page Number Mapping Tests
  // ============================================
  
  describe('Page Number Mapping', () => {
    it('should correctly map page numbers to sign IDs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 451, max: 462 }),
          (pageNumber) => {
            const signId = getSignIdFromPageNumber(pageNumber);
            
            expect(signId).toBe(pageNumber - 450);
            expect(signId).toBeGreaterThanOrEqual(1);
            expect(signId).toBeLessThanOrEqual(12);
            
            return true;
          }
        ),
        { numRuns: 12 }
      );
    });
    
    it('should return null for non-sign pages', () => {
      expect(getSignIdFromPageNumber(450)).toBeNull();
      expect(getSignIdFromPageNumber(463)).toBeNull();
      expect(getSignIdFromPageNumber(100)).toBeNull();
    });
  });
  
  // ============================================
  // Render Function Tests
  // ============================================
  
  describe('render()', () => {
    it('should render index page for page 450', () => {
      const html = render(450);
      
      expect(html).toContain('MYSTIC STARS');
      expect(html).toContain('zodiac-grid');
      expect(html).toContain('The stars reveal your destiny');
    });
    
    it('should render individual sign pages for pages 451-462', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 451, max: 462 }),
          (pageNumber) => {
            const html = render(pageNumber);
            const signId = pageNumber - 450;
            const sign = ZODIAC_SIGNS.find(s => s.id === signId);
            
            expect(html).toContain(sign.symbol);
            expect(html).toContain(sign.name.toUpperCase());
            expect(html).toContain('TODAY\'S READING');
            expect(html).toContain('LUCKY NUMBERS');
            expect(html).toContain('LUCKY COLOR');
            expect(html).toContain('BEST MATCH');
            
            return true;
          }
        ),
        { numRuns: 12 }
      );
    });
    
    it('should render lucky numbers page for page 463', () => {
      const html = render(463);
      
      expect(html).toContain('LUCKY NUMBERS');
      expect(html).toContain('lucky-number');
      expect(html).toContain('GENERATE NEW');
    });
    
    it('should render error for invalid pages', () => {
      const html = render(999);
      
      expect(html).toContain('PAGE NOT FOUND');
    });
  });
  
  // ============================================
  // Fastext Buttons Tests
  // ============================================
  
  describe('getFastextButtons()', () => {
    it('should return valid button config for index page', () => {
      const buttons = getFastextButtons(450);
      
      expect(buttons).toHaveProperty('red');
      expect(buttons).toHaveProperty('green');
      expect(buttons).toHaveProperty('yellow');
      expect(buttons).toHaveProperty('cyan');
      
      expect(buttons.red.label).toBe('HOME');
      expect(buttons.yellow.label).toBe('LUCKY #');
    });
    
    it('should return valid button config for sign pages', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 451, max: 462 }),
          (pageNumber) => {
            const buttons = getFastextButtons(pageNumber);
            
            expect(buttons.red.label).toBe('ALL SIGNS');
            expect(buttons.green.label).toBe('PREV');
            expect(buttons.yellow.label).toBe('NEXT');
            expect(buttons.cyan.label).toBe('LUCKY #');
            
            // Verify prev/next pages are correct
            const signId = pageNumber - 450;
            const prevSignId = signId === 1 ? 12 : signId - 1;
            const nextSignId = signId === 12 ? 1 : signId + 1;
            
            expect(buttons.green.page).toBe(450 + prevSignId);
            expect(buttons.yellow.page).toBe(450 + nextSignId);
            
            return true;
          }
        ),
        { numRuns: 12 }
      );
    });
    
    it('should return valid button config for lucky numbers page', () => {
      const buttons = getFastextButtons(463);
      
      expect(buttons.red.label).toBe('ALL SIGNS');
      expect(buttons.cyan.label).toBe('HOME');
    });
  });
  
  // ============================================
  // Horoscope Pages Constants Tests
  // ============================================
  
  describe('HOROSCOPE_PAGES', () => {
    it('should have correct page numbers', () => {
      const pages = getHoroscopePages();
      
      expect(pages.INDEX).toBe(450);
      expect(pages.ARIES).toBe(451);
      expect(pages.TAURUS).toBe(452);
      expect(pages.GEMINI).toBe(453);
      expect(pages.CANCER).toBe(454);
      expect(pages.LEO).toBe(455);
      expect(pages.VIRGO).toBe(456);
      expect(pages.LIBRA).toBe(457);
      expect(pages.SCORPIO).toBe(458);
      expect(pages.SAGITTARIUS).toBe(459);
      expect(pages.CAPRICORN).toBe(460);
      expect(pages.AQUARIUS).toBe(461);
      expect(pages.PISCES).toBe(462);
      expect(pages.LUCKY_NUMBERS).toBe(463);
    });
  });
});
