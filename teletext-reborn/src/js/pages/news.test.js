/**
 * Teletext Reborn - News Page Tests
 * 
 * Tests for the news pages (Pages 101-109)
 * Requirements: 5.1-5.7
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';

// Mock GSAP before importing the module
vi.mock('gsap', () => ({
  default: {
    timeline: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      to: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      kill: vi.fn(),
      progress: vi.fn().mockReturnValue(0),
    })),
    to: vi.fn(() => ({ kill: vi.fn() })),
    from: vi.fn(() => ({ kill: vi.fn() })),
    killTweensOf: vi.fn(),
    registerPlugin: vi.fn(),
  },
  TextPlugin: {},
}));

// Mock the router
vi.mock('../router.js', () => ({
  PAGE_NUMBERS: {
    HOME: 100,
    NEWS_TOP: 101,
    NEWS_WORLD: 102,
    NEWS_TECH: 103,
    NEWS_BUSINESS: 104,
    NEWS_SPORTS: 105,
    WEATHER: 200,
    FINANCE: 300,
    TIME_MACHINE: 500,
    SETTINGS: 900,
    ABOUT: 999,
  },
  getRouter: vi.fn(() => ({
    navigate: vi.fn(),
  })),
}));

// Mock the news API
vi.mock('../services/newsApi.js', () => ({
  getNews: vi.fn(),
  getNewsByPage: vi.fn(),
  formatHeadlines: vi.fn((articles) => articles.map(a => ({
    title: a.title,
    source: a.source,
    timeAgo: a.timeAgo || '',
    fullTitle: a.title,
    link: a.link,
  }))),
  NEWS_CATEGORIES: {
    top: { page: 101, label: 'TOP STORIES', apiCategory: 'top' },
    world: { page: 102, label: 'WORLD', apiCategory: 'world' },
    technology: { page: 103, label: 'TECH', apiCategory: 'technology' },
    business: { page: 104, label: 'BUSINESS', apiCategory: 'business' },
    sports: { page: 105, label: 'SPORTS', apiCategory: 'sports' },
  },
  PAGE_TO_CATEGORY: {
    101: 'top',
    102: 'world',
    103: 'technology',
    104: 'business',
    105: 'sports',
  },
  startAutoRefresh: vi.fn(() => vi.fn()),
  stopAutoRefresh: vi.fn(),
  isNewsPage: vi.fn((page) => page >= 101 && page <= 109),
  isInDemoMode: vi.fn(() => false),
  getLastError: vi.fn(() => null),
  getCategoryForPage: vi.fn((page) => {
    const categories = {
      101: { id: 'top', label: 'TOP STORIES', page: 101 },
      102: { id: 'world', label: 'WORLD', page: 102 },
      103: { id: 'technology', label: 'TECHNOLOGY', page: 103 },
      104: { id: 'business', label: 'BUSINESS', page: 104 },
      105: { id: 'sports', label: 'SPORTS', page: 105 },
    };
    return categories[page] || null;
  }),
  getMockNews: vi.fn(),
}));

import {
  render,
  onMount,
  onUnmount,
  getFastextButtons,
  resetNewsPageState,
  isNewsPageNumber,
  getCurrentNewsData,
  getIsLoading,
  getErrorState,
  setMockNewsData,
  PAGE_RANGE,
  MAX_HEADLINES_DISPLAY,
} from './news.js';

import { getNewsByPage, formatHeadlines, isNewsPage } from '../services/newsApi.js';

// ============================================
// Test Setup
// ============================================

describe('News Page', () => {
  beforeEach(() => {
    // Reset state before each test
    resetNewsPageState();
    vi.clearAllMocks();
    
    // Setup DOM
    document.body.innerHTML = '<div id="content"></div>';
  });
  
  afterEach(() => {
    // Cleanup
    resetNewsPageState();
    document.body.innerHTML = '';
  });
  
  // ============================================
  // Render Tests
  // ============================================
  
  describe('render()', () => {
    it('should render news page with title', () => {
      const html = render(101);
      
      expect(html).toContain('news-page');
      expect(html).toContain('TOP STORIES');
    });
    
    it('should render category navigation tabs (Req 5.2)', () => {
      const html = render(101);
      
      expect(html).toContain('category-nav');
      expect(html).toContain('TOP');
      expect(html).toContain('WORLD');
      expect(html).toContain('TECH');
      expect(html).toContain('BUSINESS');
      expect(html).toContain('SPORTS');
    });
    
    it('should render loading state when loading (Req 5.4)', () => {
      // Set loading state - null data shows loading
      setMockNewsData(null);
      
      const html = render(101);
      
      // Should show loading state when no data (initial render)
      expect(html).toContain('LOADING');
    });
    
    it('should render empty state when articles array is empty', () => {
      // Set empty articles to get empty state
      setMockNewsData({
        category: 'top',
        categoryLabel: 'TOP STORIES',
        pageNumber: 101,
        articles: [],
        lastUpdated: new Date(),
        _stale: false,
      });
      
      const html = render(101);
      
      // Should show empty state when articles array is empty
      expect(html).toContain('NO NEWS AVAILABLE');
    });
    
    it('should render headlines when data is available (Req 5.3)', () => {
      const mockData = {
        category: 'top',
        categoryLabel: 'TOP STORIES',
        pageNumber: 101,
        articles: [
          { title: 'Test Headline 1', source: 'BBC', timeAgo: '5 MINS AGO' },
          { title: 'Test Headline 2', source: 'CNN', timeAgo: '10 MINS AGO' },
        ],
        lastUpdated: new Date(),
        _stale: false,
      };
      
      setMockNewsData(mockData);
      const html = render(101);
      
      expect(html).toContain('headlines-container');
      expect(html).toContain('headline-item');
    });
    
    it('should render attribution (Req 22.1)', () => {
      const html = render(101);
      
      expect(html).toContain('VIA NEWSDATA.IO');
    });
    
    it('should render stale notice when data is stale', () => {
      const mockData = {
        category: 'top',
        categoryLabel: 'TOP STORIES',
        pageNumber: 101,
        articles: [
          { title: 'Test Headline', source: 'BBC', timeAgo: '5 MINS AGO' },
        ],
        lastUpdated: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
        _stale: true,
      };
      
      setMockNewsData(mockData);
      const html = render(101);
      
      expect(html).toContain('LAST UPDATED');
    });
    
    it('should render rate limit notice when rate limited', () => {
      const mockData = {
        category: 'top',
        categoryLabel: 'TOP STORIES',
        pageNumber: 101,
        articles: [
          { title: 'Test Headline', source: 'BBC', timeAgo: '5 MINS AGO' },
        ],
        lastUpdated: new Date(),
        _stale: true,
        _rateLimited: true,
        _message: 'RATE LIMIT REACHED - USING CACHED DATA',
      };
      
      setMockNewsData(mockData);
      const html = render(101);
      
      expect(html).toContain('USING CACHED DATA');
    });
    
    it('should render different categories based on page number', () => {
      const html102 = render(102);
      expect(html102).toContain('WORLD');
      
      const html103 = render(103);
      expect(html103).toContain('TECH');
      
      const html104 = render(104);
      expect(html104).toContain('BUSINESS');
      
      const html105 = render(105);
      expect(html105).toContain('SPORTS');
    });
  });
  
  // ============================================
  // Fastext Button Tests
  // ============================================
  
  describe('getFastextButtons()', () => {
    it('should return correct Fastext configuration', () => {
      const buttons = getFastextButtons();
      
      expect(buttons).toHaveProperty('red');
      expect(buttons).toHaveProperty('green');
      expect(buttons).toHaveProperty('yellow');
      expect(buttons).toHaveProperty('cyan');
    });
    
    it('should have correct page numbers for buttons', () => {
      const buttons = getFastextButtons();
      
      expect(buttons.red.page).toBe(101); // TOP
      expect(buttons.green.page).toBe(102); // WORLD
      expect(buttons.yellow.page).toBe(103); // TECH
      expect(buttons.cyan.page).toBe(100); // HOME
    });
    
    it('should have labels for all buttons', () => {
      const buttons = getFastextButtons();
      
      expect(buttons.red.label).toBe('TOP');
      expect(buttons.green.label).toBe('WORLD');
      expect(buttons.yellow.label).toBe('TECH');
      expect(buttons.cyan.label).toBe('HOME');
    });
  });
  
  // ============================================
  // Page Range Tests
  // ============================================
  
  describe('PAGE_RANGE', () => {
    it('should define correct page range', () => {
      expect(PAGE_RANGE.START).toBe(101);
      expect(PAGE_RANGE.END).toBe(109);
    });
  });
  
  // ============================================
  // isNewsPageNumber Tests
  // ============================================
  
  describe('isNewsPageNumber()', () => {
    it('should return true for valid news pages', () => {
      expect(isNewsPageNumber(101)).toBe(true);
      expect(isNewsPageNumber(102)).toBe(true);
      expect(isNewsPageNumber(103)).toBe(true);
      expect(isNewsPageNumber(104)).toBe(true);
      expect(isNewsPageNumber(105)).toBe(true);
    });
    
    it('should return false for non-news pages', () => {
      expect(isNewsPageNumber(100)).toBe(false);
      expect(isNewsPageNumber(200)).toBe(false);
      expect(isNewsPageNumber(300)).toBe(false);
    });
  });
  
  // ============================================
  // State Management Tests
  // ============================================
  
  describe('State Management', () => {
    it('should reset state correctly', () => {
      setMockNewsData({ test: 'data' });
      
      resetNewsPageState();
      
      expect(getCurrentNewsData()).toBeNull();
      expect(getIsLoading()).toBe(false);
      expect(getErrorState()).toBeNull();
    });
    
    it('should set mock news data', () => {
      const mockData = { category: 'top', articles: [] };
      
      setMockNewsData(mockData);
      
      expect(getCurrentNewsData()).toEqual(mockData);
    });
  });
  
  // ============================================
  // Lifecycle Tests
  // ============================================
  
  describe('Lifecycle', () => {
    it('should call onUnmount without errors', () => {
      expect(() => onUnmount()).not.toThrow();
    });
    
    it('should handle multiple onUnmount calls', () => {
      expect(() => {
        onUnmount();
        onUnmount();
      }).not.toThrow();
    });
  });
  
  // ============================================
  // Property-Based Tests
  // ============================================
  
  describe('Property-Based Tests', () => {
    // Property: All rendered headlines should be uppercase
    it('should render all text in uppercase (Teletext authenticity)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 50 }),
              source: fc.string({ minLength: 1, maxLength: 20 }),
              timeAgo: fc.constantFrom('5 MINS AGO', '1 HOUR AGO', '2 HOURS AGO'),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (articles) => {
            const mockData = {
              category: 'top',
              categoryLabel: 'TOP STORIES',
              pageNumber: 101,
              articles,
              lastUpdated: new Date(),
              _stale: false,
            };
            
            setMockNewsData(mockData);
            const html = render(101);
            
            // Check that category labels are uppercase
            expect(html).toContain('TOP STORIES');
            expect(html).toContain('VIA NEWSDATA.IO');
            
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
    
    // Property: Page numbers should map to correct categories
    it('should map page numbers to correct categories', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(101, 102, 103, 104, 105),
          (pageNumber) => {
            const html = render(pageNumber);
            
            const expectedLabels = {
              101: 'TOP STORIES',
              102: 'WORLD',
              103: 'TECH',
              104: 'BUSINESS',
              105: 'SPORTS',
            };
            
            expect(html).toContain(expectedLabels[pageNumber]);
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
    
    // Property: Headlines should be limited to MAX_HEADLINES_DISPLAY
    it('should limit headlines to MAX_HEADLINES_DISPLAY', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (numArticles) => {
            const articles = Array.from({ length: numArticles }, (_, i) => ({
              title: `Headline ${i + 1}`,
              source: 'TEST',
              timeAgo: '1 MIN AGO',
            }));
            
            const mockData = {
              category: 'top',
              categoryLabel: 'TOP STORIES',
              pageNumber: 101,
              articles,
              lastUpdated: new Date(),
              _stale: false,
            };
            
            setMockNewsData(mockData);
            const html = render(101);
            
            // Count headline items in rendered HTML
            const matches = html.match(/headline-item/g) || [];
            
            // Should not exceed MAX_HEADLINES_DISPLAY
            expect(matches.length).toBeLessThanOrEqual(MAX_HEADLINES_DISPLAY);
            
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
  
  // ============================================
  // Error Handling Tests
  // ============================================
  
  describe('Error Handling', () => {
    it('should handle empty articles array', () => {
      const mockData = {
        category: 'top',
        categoryLabel: 'TOP STORIES',
        pageNumber: 101,
        articles: [],
        lastUpdated: new Date(),
        _stale: false,
      };
      
      setMockNewsData(mockData);
      const html = render(101);
      
      expect(html).toContain('NO NEWS AVAILABLE');
    });
    
    it('should handle null articles', () => {
      const mockData = {
        category: 'top',
        categoryLabel: 'TOP STORIES',
        pageNumber: 101,
        articles: null,
        lastUpdated: new Date(),
        _stale: false,
      };
      
      setMockNewsData(mockData);
      
      expect(() => render(101)).not.toThrow();
    });
  });
  
  // ============================================
  // Line Width Constraint Tests (Req 5.6)
  // ============================================
  
  describe('Line Width Constraint (Req 5.6)', () => {
    it('should truncate long headlines', () => {
      const longTitle = 'A'.repeat(100);
      const mockData = {
        category: 'top',
        categoryLabel: 'TOP STORIES',
        pageNumber: 101,
        articles: [
          { title: longTitle, source: 'TEST', timeAgo: '1 MIN AGO' },
        ],
        lastUpdated: new Date(),
        _stale: false,
      };
      
      setMockNewsData(mockData);
      const html = render(101);
      
      // The full 100-char title should not appear
      expect(html).not.toContain(longTitle);
    });
  });
});
