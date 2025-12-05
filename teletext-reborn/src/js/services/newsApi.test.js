/**
 * Teletext Reborn - News API Service Tests
 * 
 * Tests for the NewsData.io API integration including:
 * - News fetching by category
 * - Rate limit handling
 * - Cache management
 * - Headline formatting
 * 
 * Requirements: 5.1-5.7
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import {
  getNews,
  getNewsByPage,
  getNewsCategories,
  isNewsPage,
  getCategoryForPage,
  formatHeadline,
  formatHeadlines,
  canMakeRequest,
  getRemainingRequests,
  clearNewsCache,
  hasValidCache,
  startAutoRefresh,
  stopAutoRefresh,
  getMockNews,
  NEWS_CATEGORIES,
  PAGE_TO_CATEGORY,
  CACHE_TTL,
  MAX_HEADLINES,
  MAX_HEADLINE_LENGTH,
  getCacheKey,
  parseArticle,
  parseNewsResponse,
} from './newsApi.js';

// ============================================
// Test Setup
// ============================================

describe('News API Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Stop any auto-refresh
    stopAutoRefresh();
    // Reset fetch mock
    vi.restoreAllMocks();
  });

  afterEach(() => {
    stopAutoRefresh();
    vi.restoreAllMocks();
  });

  // ============================================
  // Constants Tests
  // ============================================

  describe('Constants', () => {
    it('should have correct news categories', () => {
      expect(NEWS_CATEGORIES).toHaveProperty('top');
      expect(NEWS_CATEGORIES).toHaveProperty('world');
      expect(NEWS_CATEGORIES).toHaveProperty('technology');
      expect(NEWS_CATEGORIES).toHaveProperty('business');
      expect(NEWS_CATEGORIES).toHaveProperty('sports');
    });

    it('should map categories to correct page numbers (Req 5.2)', () => {
      expect(NEWS_CATEGORIES.top.page).toBe(101);
      expect(NEWS_CATEGORIES.world.page).toBe(102);
      expect(NEWS_CATEGORIES.technology.page).toBe(103);
      expect(NEWS_CATEGORIES.business.page).toBe(104);
      expect(NEWS_CATEGORIES.sports.page).toBe(105);
    });

    it('should have page to category mapping', () => {
      expect(PAGE_TO_CATEGORY[101]).toBe('top');
      expect(PAGE_TO_CATEGORY[102]).toBe('world');
      expect(PAGE_TO_CATEGORY[103]).toBe('technology');
      expect(PAGE_TO_CATEGORY[104]).toBe('business');
      expect(PAGE_TO_CATEGORY[105]).toBe('sports');
    });

    it('should have 5 minute cache TTL (Req 5.7)', () => {
      expect(CACHE_TTL).toBe(5 * 60 * 1000);
    });
  });

  // ============================================
  // Category Helper Tests
  // ============================================

  describe('Category Helpers', () => {
    it('should return all news categories', () => {
      const categories = getNewsCategories();
      expect(categories).toHaveLength(5);
      expect(categories[0]).toHaveProperty('id');
      expect(categories[0]).toHaveProperty('page');
      expect(categories[0]).toHaveProperty('label');
    });

    it('should identify news pages correctly', () => {
      expect(isNewsPage(101)).toBe(true);
      expect(isNewsPage(105)).toBe(true);
      expect(isNewsPage(109)).toBe(true);
      expect(isNewsPage(100)).toBe(false);
      expect(isNewsPage(110)).toBe(false);
      expect(isNewsPage(200)).toBe(false);
    });

    it('should get category for valid page numbers', () => {
      const category = getCategoryForPage(101);
      expect(category).not.toBeNull();
      expect(category.id).toBe('top');
      expect(category.label).toBe('TOP STORIES');
    });

    it('should return null for invalid page numbers', () => {
      expect(getCategoryForPage(100)).toBeNull();
      expect(getCategoryForPage(110)).toBeNull();
      expect(getCategoryForPage(200)).toBeNull();
    });
  });

  // ============================================
  // Article Parsing Tests
  // ============================================

  describe('Article Parsing', () => {
    it('should parse article with all fields', () => {
      const rawArticle = {
        title: 'Test Headline',
        description: 'Test description',
        source_id: 'bbc',
        pubDate: '2025-12-04T10:00:00Z',
        link: 'https://example.com',
        image_url: 'https://example.com/image.jpg',
        category: ['technology'],
      };

      const parsed = parseArticle(rawArticle);

      expect(parsed.title).toBe('Test Headline');
      expect(parsed.description).toBe('Test description');
      expect(parsed.source).toBe('bbc');
      expect(parsed.pubDate).toBeInstanceOf(Date);
      expect(parsed.link).toBe('https://example.com');
      expect(parsed.imageUrl).toBe('https://example.com/image.jpg');
      expect(parsed.category).toBe('technology');
    });

    it('should handle missing fields gracefully', () => {
      const rawArticle = {};

      const parsed = parseArticle(rawArticle);

      expect(parsed.title).toBe('NO TITLE');
      expect(parsed.description).toBe('');
      expect(parsed.source).toBe('UNKNOWN');
      expect(parsed.pubDate).toBeNull();
      expect(parsed.timeAgo).toBe('');
      expect(parsed.link).toBeNull();
    });

    it('should use source_name as fallback for source', () => {
      const rawArticle = {
        title: 'Test',
        source_name: 'Reuters',
      };

      const parsed = parseArticle(rawArticle);
      expect(parsed.source).toBe('Reuters');
    });
  });

  // ============================================
  // News Response Parsing Tests
  // ============================================

  describe('News Response Parsing', () => {
    it('should parse news response correctly', () => {
      const apiResponse = {
        results: [
          { title: 'Headline 1', source_id: 'bbc' },
          { title: 'Headline 2', source_id: 'cnn' },
        ],
        totalResults: 100,
        nextPage: 'abc123',
      };

      const parsed = parseNewsResponse(apiResponse, 'top');

      expect(parsed.category).toBe('top');
      expect(parsed.categoryLabel).toBe('TOP STORIES');
      expect(parsed.pageNumber).toBe(101);
      expect(parsed.articles).toHaveLength(2);
      expect(parsed.totalResults).toBe(100);
      expect(parsed.nextPage).toBe('abc123');
      expect(parsed.lastUpdated).toBeInstanceOf(Date);
      expect(parsed._stale).toBe(false);
    });

    it('should limit articles to MAX_HEADLINES', () => {
      const manyArticles = Array(20).fill(null).map((_, i) => ({
        title: `Headline ${i}`,
        source_id: 'test',
      }));

      const apiResponse = { results: manyArticles };
      const parsed = parseNewsResponse(apiResponse, 'top');

      expect(parsed.articles.length).toBeLessThanOrEqual(MAX_HEADLINES);
    });

    it('should handle empty results', () => {
      const apiResponse = { results: [] };
      const parsed = parseNewsResponse(apiResponse, 'world');

      expect(parsed.articles).toHaveLength(0);
      expect(parsed.category).toBe('world');
    });

    it('should preserve _stale flag from API response', () => {
      const apiResponse = {
        results: [],
        _stale: true,
      };

      const parsed = parseNewsResponse(apiResponse, 'top');
      expect(parsed._stale).toBe(true);
    });
  });

  // ============================================
  // Headline Formatting Tests (Req 5.3, 5.6)
  // ============================================

  describe('Headline Formatting', () => {
    it('should format headline with truncation (Req 5.6)', () => {
      const article = {
        title: 'This is a very long headline that exceeds the maximum allowed width for Teletext display',
        source: 'bbc',
        timeAgo: '5 MINS AGO',
        link: 'https://example.com',
      };

      const formatted = formatHeadline(article);

      expect(formatted.title.length).toBeLessThanOrEqual(MAX_HEADLINE_LENGTH);
      expect(formatted.source).toBe('BBC');
      expect(formatted.timeAgo).toBe('5 MINS AGO');
      expect(formatted.fullTitle).toBe(article.title);
    });

    it('should preserve short headlines', () => {
      const article = {
        title: 'Short headline',
        source: 'reuters',
        timeAgo: '1 HOUR AGO',
      };

      const formatted = formatHeadline(article);
      expect(formatted.title).toBe('Short headline');
    });

    it('should format array of headlines', () => {
      const articles = [
        { title: 'Headline 1', source: 'bbc', timeAgo: '5 MINS AGO' },
        { title: 'Headline 2', source: 'cnn', timeAgo: '10 MINS AGO' },
      ];

      const formatted = formatHeadlines(articles);

      expect(formatted).toHaveLength(2);
      expect(formatted[0].source).toBe('BBC');
      expect(formatted[1].source).toBe('CNN');
    });

    it('should handle empty array', () => {
      expect(formatHeadlines([])).toHaveLength(0);
    });

    it('should handle non-array input', () => {
      expect(formatHeadlines(null)).toHaveLength(0);
      expect(formatHeadlines(undefined)).toHaveLength(0);
      expect(formatHeadlines('string')).toHaveLength(0);
    });
  });

  // ============================================
  // Property-Based Tests for Headline Formatting
  // ============================================

  describe('Property: Headline Width Constraint (Req 5.6)', () => {
    /**
     * Property: For any headline, the formatted title SHALL NOT exceed MAX_HEADLINE_LENGTH
     * Validates: Requirements 5.6
     */
    it('should never exceed max headline length for any input', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 500 }),
          (title) => {
            const article = {
              title,
              source: 'test',
              timeAgo: '',
            };

            const formatted = formatHeadline(article);
            return formatted.title.length <= MAX_HEADLINE_LENGTH;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve original title in fullTitle field', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          (title) => {
            const article = {
              title,
              source: 'test',
              timeAgo: '',
            };

            const formatted = formatHeadline(article);
            return formatted.fullTitle === title;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should uppercase source names', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          (source) => {
            const article = {
              title: 'Test',
              source,
              timeAgo: '',
            };

            const formatted = formatHeadline(article);
            return formatted.source === formatted.source.toUpperCase();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================
  // Rate Limit Tests
  // ============================================

  describe('Rate Limit Management', () => {
    it('should allow requests when under limit', () => {
      localStorage.clear();
      expect(canMakeRequest()).toBe(true);
    });

    it('should return correct remaining requests', () => {
      localStorage.clear();
      expect(getRemainingRequests()).toBe(200);
    });

    it('should reset count on new day', () => {
      // Set yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      localStorage.setItem('teletext_news_rate_limit', JSON.stringify({
        count: 199,
        date: yesterday.toDateString(),
      }));

      // Should reset on new day
      expect(canMakeRequest()).toBe(true);
      expect(getRemainingRequests()).toBe(200);
    });
  });

  // ============================================
  // Cache Tests
  // ============================================

  describe('Cache Management', () => {
    it('should generate correct cache keys', () => {
      expect(getCacheKey('top')).toBe('news_top');
      expect(getCacheKey('world')).toBe('news_world');
      expect(getCacheKey('technology')).toBe('news_technology');
    });

    it('should clear specific category cache', () => {
      // Set up cache
      localStorage.setItem('teletext_cache_news_top', JSON.stringify({
        data: { results: [] },
        timestamp: Date.now(),
        ttl: CACHE_TTL,
      }));

      clearNewsCache('top');

      expect(localStorage.getItem('teletext_cache_news_top')).toBeNull();
    });

    it('should clear all news cache when no category specified', () => {
      // Set up cache for multiple categories
      Object.keys(NEWS_CATEGORIES).forEach(cat => {
        localStorage.setItem(`teletext_cache_news_${cat}`, JSON.stringify({
          data: { results: [] },
          timestamp: Date.now(),
          ttl: CACHE_TTL,
        }));
      });

      clearNewsCache();

      Object.keys(NEWS_CATEGORIES).forEach(cat => {
        expect(localStorage.getItem(`teletext_cache_news_${cat}`)).toBeNull();
      });
    });

    it('should detect valid cache', () => {
      localStorage.setItem('teletext_cache_news_top', JSON.stringify({
        data: { results: [] },
        timestamp: Date.now(),
        ttl: CACHE_TTL,
      }));

      expect(hasValidCache('top')).toBe(true);
    });

    it('should detect expired cache', () => {
      localStorage.setItem('teletext_cache_news_top', JSON.stringify({
        data: { results: [] },
        timestamp: Date.now() - CACHE_TTL - 1000,
        ttl: CACHE_TTL,
      }));

      expect(hasValidCache('top')).toBe(false);
    });

    it('should return false for missing cache', () => {
      expect(hasValidCache('nonexistent')).toBe(false);
    });
  });

  // ============================================
  // Mock Data Tests
  // ============================================

  describe('Mock Data', () => {
    it('should return mock news data', () => {
      const mockData = getMockNews('top');

      expect(mockData.category).toBe('top');
      expect(mockData.categoryLabel).toBe('TOP STORIES');
      expect(mockData.pageNumber).toBe(101);
      expect(mockData.articles).toBeInstanceOf(Array);
      expect(mockData.articles.length).toBeGreaterThan(0);
    });

    it('should return correct category info for mock data', () => {
      const mockTech = getMockNews('technology');
      expect(mockTech.categoryLabel).toBe('TECHNOLOGY');
      expect(mockTech.pageNumber).toBe(103);
    });

    it('should default to top category for invalid input', () => {
      const mockData = getMockNews('invalid');
      expect(mockData.categoryLabel).toBe('TOP STORIES');
    });
  });

  // ============================================
  // Auto-Refresh Tests (Req 5.7)
  // ============================================

  describe('Auto-Refresh (Req 5.7)', () => {
    it('should return unsubscribe function', () => {
      const unsubscribe = startAutoRefresh();
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should stop auto-refresh when called', () => {
      startAutoRefresh();
      stopAutoRefresh();
      // Should not throw
      expect(true).toBe(true);
    });

    it('should allow multiple callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsub1 = startAutoRefresh(callback1);
      const unsub2 = startAutoRefresh(callback2);

      unsub1();
      unsub2();
      // Should not throw
      expect(true).toBe(true);
    });
  });

  // ============================================
  // Integration Tests (with mocked fetch)
  // ============================================

  describe('API Integration', () => {
    it('should handle API errors gracefully (Req 5.5)', async () => {
      // Mock fetch to fail
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      // Should throw when no cache available
      await expect(getNews('top')).rejects.toThrow();
    });

    it('should validate category and default to top', async () => {
      // Mock successful response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });

      // Invalid category should default to 'top'
      const result = await getNews('invalid_category');
      expect(result.category).toBe('top');
    });

    it('should throw for invalid page number in getNewsByPage', async () => {
      await expect(getNewsByPage(100)).rejects.toThrow('INVALID NEWS PAGE');
      await expect(getNewsByPage(110)).rejects.toThrow('INVALID NEWS PAGE');
      await expect(getNewsByPage(200)).rejects.toThrow('INVALID NEWS PAGE');
    });
  });
});
