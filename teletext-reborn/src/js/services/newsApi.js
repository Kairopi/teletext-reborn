/**
 * Teletext Reborn - News API Service
 * 
 * Integrates with NewsData.io API for current news headlines.
 * Supports multiple categories: Top Stories, World, Technology, Business, Sports.
 * 
 * @module services/newsApi
 * Requirements: 5.1-5.7
 */

import { get, buildUrl, CacheTTL, ApiError, ErrorTypes } from './api.js';
import { truncateToWidth } from '../utils/teletext.js';
import { formatRelativeTime } from '../utils/date.js';

// ============================================
// Constants
// ============================================

/**
 * NewsData.io API endpoint
 * @see https://newsdata.io/documentation
 */
const NEWS_API = 'https://newsdata.io/api/1/news';

/**
 * API Key for NewsData.io
 * Free tier: 200 requests/day
 * Loaded from environment variable (see .env file)
 */
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || '';

/**
 * Debug mode flag - enables verbose logging in development
 * @private
 */
const DEBUG = import.meta.env.DEV || false;

/**
 * Log debug message (only in development)
 * @param {string} message - Message to log
 * @param {any} [data] - Optional data to log
 * @private
 */
function debugLog(message, data) {
  if (DEBUG) {
    if (data !== undefined) {
      console.debug(`[NewsAPI] ${message}`, data);
    } else {
      console.debug(`[NewsAPI] ${message}`);
    }
  }
}

// Validate API key on module load
if (!NEWS_API_KEY) {
  console.warn(
    '[NewsAPI] No API key configured. ' +
    'Set VITE_NEWS_API_KEY in .env file. ' +
    'News features will use mock data.'
  );
}

/**
 * Cache TTL for news data (5 minutes - Req 5.7)
 */
const CACHE_TTL = CacheTTL.FIVE_MINUTES;

/**
 * News categories mapping to page numbers (Req 5.2)
 */
export const NEWS_CATEGORIES = {
  top: { page: 101, label: 'TOP STORIES', apiCategory: 'top' },
  world: { page: 102, label: 'WORLD NEWS', apiCategory: 'world' },
  technology: { page: 103, label: 'TECHNOLOGY', apiCategory: 'technology' },
  business: { page: 104, label: 'BUSINESS', apiCategory: 'business' },
  sports: { page: 105, label: 'SPORTS', apiCategory: 'sports' },
};

/**
 * Page number to category mapping
 */
export const PAGE_TO_CATEGORY = {
  101: 'top',
  102: 'world',
  103: 'technology',
  104: 'business',
  105: 'sports',
};

/**
 * Maximum headlines per category
 */
const MAX_HEADLINES = 10;

/**
 * Maximum headline text length (Req 5.6)
 */
const MAX_HEADLINE_LENGTH = 38; // Leave room for bullet

/**
 * Rate limit tracking
 */
let requestCount = 0;
let requestDate = null;
const MAX_DAILY_REQUESTS = 200;

// ============================================
// Rate Limit Management
// ============================================

/**
 * Check if we can make a news API request
 * @returns {boolean} True if request is allowed
 */
export function canMakeRequest() {
  const today = new Date().toDateString();
  
  // Reset counter on new day
  if (requestDate !== today) {
    requestCount = 0;
    requestDate = today;
    _saveRateLimitState();
  }
  
  return requestCount < MAX_DAILY_REQUESTS;
}

/**
 * Track a news API request
 */
function trackRequest() {
  const today = new Date().toDateString();
  
  if (requestDate !== today) {
    requestCount = 0;
    requestDate = today;
  }
  
  requestCount++;
  _saveRateLimitState();
}

/**
 * Get remaining requests for today
 * @returns {number} Remaining requests
 */
export function getRemainingRequests() {
  const today = new Date().toDateString();
  
  if (requestDate !== today) {
    return MAX_DAILY_REQUESTS;
  }
  
  return Math.max(0, MAX_DAILY_REQUESTS - requestCount);
}

/**
 * Save rate limit state to localStorage
 * @private
 */
function _saveRateLimitState() {
  try {
    localStorage.setItem('teletext_news_rate_limit', JSON.stringify({
      count: requestCount,
      date: requestDate,
    }));
  } catch (error) {
    debugLog('Failed to save rate limit state', error);
  }
}

/**
 * Load rate limit state from localStorage
 * @private
 */
function _loadRateLimitState() {
  try {
    const stored = localStorage.getItem('teletext_news_rate_limit');
    if (stored) {
      const state = JSON.parse(stored);
      const today = new Date().toDateString();
      
      if (state.date === today) {
        requestCount = state.count || 0;
        requestDate = state.date;
        debugLog('Loaded rate limit state', { count: requestCount, date: requestDate });
      }
    }
  } catch (error) {
    debugLog('Failed to load rate limit state', error);
  }
}

// Initialize rate limit state on module load
_loadRateLimitState();

// ============================================
// Helper Functions
// ============================================

/**
 * Generate cache key for news data
 * @param {string} category - News category
 * @returns {string} Cache key
 */
function getCacheKey(category) {
  return `news_${category}`;
}

/**
 * Parse news article from API response
 * @param {Object} article - Raw article from API
 * @returns {Object} Parsed article
 */
function parseArticle(article) {
  const pubDate = article.pubDate ? new Date(article.pubDate) : null;
  
  return {
    title: article.title || 'NO TITLE',
    description: article.description || '',
    source: article.source_id || article.source_name || 'UNKNOWN',
    pubDate: pubDate,
    timeAgo: pubDate ? formatRelativeTime(pubDate) : '',
    link: article.link || null,
    imageUrl: article.image_url || null,
    category: article.category?.[0] || 'general',
  };
}

/**
 * Parse news response from NewsData.io API
 * @param {Object} data - API response
 * @param {string} category - News category
 * @returns {Object} Parsed news data
 */
function parseNewsResponse(data, category) {
  const categoryInfo = NEWS_CATEGORIES[category] || NEWS_CATEGORIES.top;
  const articles = data.results || [];
  
  return {
    category: category,
    categoryLabel: categoryInfo.label,
    pageNumber: categoryInfo.page,
    articles: articles.slice(0, MAX_HEADLINES).map(parseArticle),
    totalResults: data.totalResults || articles.length,
    nextPage: data.nextPage || null,
    lastUpdated: new Date(),
    _stale: data._stale || false,
  };
}

/**
 * Format headline for Teletext display (Req 5.3, 5.6)
 * @param {Object} article - Parsed article
 * @returns {Object} Formatted headline
 */
export function formatHeadline(article) {
  return {
    title: truncateToWidth(article.title, MAX_HEADLINE_LENGTH),
    source: truncateToWidth(article.source.toUpperCase(), 15),
    timeAgo: article.timeAgo || '',
    fullTitle: article.title,
    link: article.link,
  };
}

/**
 * Format all headlines for display
 * @param {Array} articles - Array of parsed articles
 * @returns {Array} Array of formatted headlines
 */
export function formatHeadlines(articles) {
  if (!Array.isArray(articles)) {
    return [];
  }
  return articles.map(formatHeadline);
}

// ============================================
// Main API Functions
// ============================================

/**
 * Fetch news headlines for a category
 * 
 * @param {string} [category='top'] - News category (top, world, technology, business, sports)
 * @returns {Promise<Object>} News data with headlines
 * @throws {ApiError} On API failure
 * 
 * Requirements: 5.1-5.7
 * 
 * @example
 * const news = await getNews('technology');
 * // Returns:
 * // {
 * //   category: 'technology',
 * //   categoryLabel: 'TECHNOLOGY',
 * //   pageNumber: 103,
 * //   articles: [{ title, source, timeAgo, ... }, ...],
 * //   lastUpdated: Date
 * // }
 */
export async function getNews(category = 'top') {
  // Validate category
  const validCategory = NEWS_CATEGORIES[category] ? category : 'top';
  const categoryInfo = NEWS_CATEGORIES[validCategory];
  
  const cacheKey = getCacheKey(validCategory);
  
  // Check rate limit (Req 5.5 - graceful handling)
  if (!canMakeRequest()) {
    // Try to return cached data with rate limit notice
    const cachedData = _getStaleCache(cacheKey);
    if (cachedData) {
      return {
        ...cachedData,
        _stale: true,
        _rateLimited: true,
        _message: 'RATE LIMIT REACHED - USING CACHED DATA',
      };
    }
    
    throw new ApiError(
      ErrorTypes.RATE_LIMIT,
      'DAILY REQUEST LIMIT REACHED',
      { retryable: false }
    );
  }
  
  const url = buildUrl(NEWS_API, {
    apikey: NEWS_API_KEY,
    language: 'en',
    category: categoryInfo.apiCategory,
  });
  
  try {
    // Track the request before making it
    trackRequest();
    
    const data = await get(url, {
      cacheKey,
      cacheTTL: CACHE_TTL,
    });
    
    return parseNewsResponse(data, validCategory);
    
  } catch (error) {
    // If API fails, try to return stale cache (Req 5.5)
    const cachedData = _getStaleCache(cacheKey);
    if (cachedData) {
      return {
        ...cachedData,
        _stale: true,
        _error: error.message,
      };
    }
    
    throw error;
  }
}

/**
 * Fetch news for a specific page number
 * 
 * @param {number} pageNumber - Page number (101-105)
 * @returns {Promise<Object>} News data
 * @throws {ApiError} On invalid page or API failure
 */
export async function getNewsByPage(pageNumber) {
  const category = PAGE_TO_CATEGORY[pageNumber];
  
  if (!category) {
    throw new ApiError(
      ErrorTypes.NOT_FOUND,
      `INVALID NEWS PAGE: ${pageNumber}`,
      { retryable: false }
    );
  }
  
  return getNews(category);
}

/**
 * Get all news categories with their page numbers
 * @returns {Array} Array of category info objects
 */
export function getNewsCategories() {
  return Object.entries(NEWS_CATEGORIES).map(([key, value]) => ({
    id: key,
    ...value,
  }));
}

/**
 * Check if a page number is a news page
 * @param {number} pageNumber - Page number to check
 * @returns {boolean} True if it's a news page
 */
export function isNewsPage(pageNumber) {
  return pageNumber >= 101 && pageNumber <= 109;
}

/**
 * Get category info for a page number
 * @param {number} pageNumber - Page number
 * @returns {Object|null} Category info or null
 */
export function getCategoryForPage(pageNumber) {
  const category = PAGE_TO_CATEGORY[pageNumber];
  if (!category) return null;
  
  return {
    id: category,
    ...NEWS_CATEGORIES[category],
  };
}

// ============================================
// Cache Helpers
// ============================================

/**
 * Get stale cache data (ignoring TTL)
 * @param {string} key - Cache key
 * @returns {Object|null} Cached data or null
 * @private
 */
function _getStaleCache(key) {
  try {
    const cacheKey = `teletext_cache_${key}`;
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      const entry = JSON.parse(stored);
      if (entry.data) {
        // Re-parse to ensure consistent format
        const category = key.replace('news_', '');
        debugLog('Retrieved stale cache', { key, category });
        return parseNewsResponse(entry.data, category);
      }
    }
  } catch (error) {
    debugLog('Failed to get stale cache', error);
  }
  return null;
}

/**
 * Clear news cache for a category
 * @param {string} [category] - Category to clear, or all if not specified
 */
export function clearNewsCache(category) {
  try {
    if (category) {
      const cacheKey = `teletext_cache_${getCacheKey(category)}`;
      localStorage.removeItem(cacheKey);
      debugLog('Cleared cache for category', category);
    } else {
      // Clear all news cache
      Object.keys(NEWS_CATEGORIES).forEach(cat => {
        const cacheKey = `teletext_cache_${getCacheKey(cat)}`;
        localStorage.removeItem(cacheKey);
      });
      debugLog('Cleared all news cache');
    }
  } catch (error) {
    debugLog('Failed to clear news cache', error);
  }
}

/**
 * Check if news data is cached and fresh
 * @param {string} category - News category
 * @returns {boolean} True if fresh cache exists
 */
export function hasValidCache(category) {
  try {
    const cacheKey = `teletext_cache_${getCacheKey(category)}`;
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      const entry = JSON.parse(stored);
      if (entry.timestamp && entry.ttl) {
        const isValid = Date.now() - entry.timestamp < entry.ttl;
        debugLog('Cache validity check', { category, isValid });
        return isValid;
      }
    }
  } catch (error) {
    debugLog('Failed to check cache validity', error);
  }
  return false;
}

// ============================================
// Auto-Refresh Support (Req 5.7)
// ============================================

/**
 * Auto-refresh interval ID
 * @private
 */
let autoRefreshInterval = null;

/**
 * Auto-refresh callbacks
 * @private
 */
const refreshCallbacks = new Set();

/**
 * Start auto-refresh for news data (Req 5.7)
 * Refreshes every 5 minutes without disrupting user experience
 * 
 * @param {Function} [onRefresh] - Callback when data is refreshed
 * @returns {Function} Function to stop auto-refresh
 */
export function startAutoRefresh(onRefresh) {
  if (onRefresh) {
    refreshCallbacks.add(onRefresh);
  }
  
  // Only start one interval
  if (!autoRefreshInterval) {
    debugLog('Starting auto-refresh interval');
    autoRefreshInterval = setInterval(async () => {
      // Refresh all categories in background
      for (const category of Object.keys(NEWS_CATEGORIES)) {
        try {
          if (canMakeRequest()) {
            const data = await getNews(category);
            debugLog('Auto-refreshed category', category);
            // Notify callbacks
            refreshCallbacks.forEach(cb => {
              try {
                cb(category, data);
              } catch (error) {
                debugLog('Auto-refresh callback error', error);
              }
            });
          }
        } catch (error) {
          // Silently fail - don't disrupt user experience
          debugLog('Auto-refresh failed for category', { category, error: error.message });
        }
      }
    }, CACHE_TTL); // 5 minutes
  }
  
  // Return unsubscribe function
  return () => {
    if (onRefresh) {
      refreshCallbacks.delete(onRefresh);
    }
    
    // Stop interval if no more callbacks
    if (refreshCallbacks.size === 0 && autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
    }
  };
}

/**
 * Stop all auto-refresh
 */
export function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
  refreshCallbacks.clear();
}

// ============================================
// Mock Data for Development/Testing
// ============================================

/**
 * Mock news data for testing without API
 */
export const MOCK_NEWS_DATA = {
  top: {
    category: 'top',
    categoryLabel: 'TOP STORIES',
    pageNumber: 101,
    articles: [
      {
        title: 'BREAKING: Major Technology Breakthrough Announced',
        description: 'Scientists reveal groundbreaking discovery',
        source: 'BBC',
        pubDate: new Date(Date.now() - 30 * 60 * 1000),
        timeAgo: '30 MINS AGO',
        link: 'https://example.com/1',
      },
      {
        title: 'Global Markets React to Economic News',
        description: 'Stock markets show mixed results',
        source: 'REUTERS',
        pubDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        timeAgo: '2 HOURS AGO',
        link: 'https://example.com/2',
      },
      {
        title: 'Weather Alert: Storm System Approaching',
        description: 'Meteorologists warn of severe weather',
        source: 'CNN',
        pubDate: new Date(Date.now() - 4 * 60 * 60 * 1000),
        timeAgo: '4 HOURS AGO',
        link: 'https://example.com/3',
      },
    ],
    lastUpdated: new Date(),
    _stale: false,
  },
};

/**
 * Get mock news data for testing
 * @param {string} [category='top'] - News category
 * @returns {Object} Mock news data
 */
export function getMockNews(category = 'top') {
  const categoryInfo = NEWS_CATEGORIES[category] || NEWS_CATEGORIES.top;
  const mockData = MOCK_NEWS_DATA.top;
  
  return {
    ...mockData,
    category,
    categoryLabel: categoryInfo.label,
    pageNumber: categoryInfo.page,
  };
}

// ============================================
// Exports for Testing
// ============================================

export {
  NEWS_API,
  CACHE_TTL,
  MAX_HEADLINES,
  MAX_HEADLINE_LENGTH,
  getCacheKey,
  parseArticle,
  parseNewsResponse,
};
