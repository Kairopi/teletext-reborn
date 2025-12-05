/**
 * Teletext Reborn - API Utilities Tests
 * 
 * Tests for the fetch wrapper with retry logic, timeout handling,
 * and cache integration.
 * 
 * Requirements: 14.2, 14.3, 15.1, 15.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  fetchWithRetry,
  get,
  post,
  buildUrl,
  isOnline,
  getErrorMessage,
  isRetryableError,
  ApiError,
  ErrorTypes,
  ErrorMessages,
  CacheTTL,
} from './api.js';
import { getStateManager, resetStateManager } from '../state.js';

// ============================================
// Test Setup
// ============================================

describe('API Utilities', () => {
  let originalFetch;
  let mockFetch;

  beforeEach(() => {
    // Reset state manager before each test
    resetStateManager();
    localStorage.clear();
    
    // Store original fetch
    originalFetch = global.fetch;
    
    // Create mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  // ============================================
  // ApiError Tests
  // ============================================

  describe('ApiError', () => {
    it('should create error with correct properties', () => {
      const error = new ApiError(ErrorTypes.NETWORK, 'Network failed');
      
      expect(error.name).toBe('ApiError');
      expect(error.type).toBe(ErrorTypes.NETWORK);
      expect(error.message).toBe('Network failed');
      expect(error.retryable).toBe(true);
      expect(error.userMessage).toEqual(ErrorMessages[ErrorTypes.NETWORK]);
    });

    it('should mark network errors as retryable', () => {
      const error = new ApiError(ErrorTypes.NETWORK, 'test');
      expect(error.retryable).toBe(true);
    });

    it('should mark timeout errors as retryable', () => {
      const error = new ApiError(ErrorTypes.TIMEOUT, 'test');
      expect(error.retryable).toBe(true);
    });

    it('should mark server errors as retryable', () => {
      const error = new ApiError(ErrorTypes.SERVER, 'test');
      expect(error.retryable).toBe(true);
    });

    it('should mark parse errors as not retryable', () => {
      const error = new ApiError(ErrorTypes.PARSE, 'test');
      expect(error.retryable).toBe(false);
    });

    it('should mark validation errors as not retryable', () => {
      const error = new ApiError(ErrorTypes.VALIDATION, 'test');
      expect(error.retryable).toBe(false);
    });

    it('should allow overriding retryable flag', () => {
      const error = new ApiError(ErrorTypes.NETWORK, 'test', { retryable: false });
      expect(error.retryable).toBe(false);
    });

    it('should include status code when provided', () => {
      const error = new ApiError(ErrorTypes.SERVER, 'test', { status: 500 });
      expect(error.status).toBe(500);
    });
  });

  // ============================================
  // ErrorMessages Tests
  // ============================================

  describe('ErrorMessages', () => {
    it('should have messages for all error types', () => {
      Object.values(ErrorTypes).forEach(type => {
        expect(ErrorMessages[type]).toBeDefined();
        expect(ErrorMessages[type].title).toBeDefined();
        expect(ErrorMessages[type].message).toBeDefined();
        expect(ErrorMessages[type].action).toBeDefined();
      });
    });

    it('should have Teletext-style titles (uppercase)', () => {
      Object.values(ErrorMessages).forEach(msg => {
        expect(msg.title).toBe(msg.title.toUpperCase());
      });
    });
  });

  // ============================================
  // fetchWithRetry Tests
  // ============================================

  describe('fetchWithRetry', () => {
    it('should return data on successful fetch', async () => {
      const mockData = { test: 'data' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await fetchWithRetry('https://api.example.com/data');
      
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should cache response when cacheKey and cacheTTL provided (Req 14.2)', async () => {
      const mockData = { test: 'cached' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      await fetchWithRetry('https://api.example.com/data', {
        cacheKey: 'test_cache',
        cacheTTL: CacheTTL.FIVE_MINUTES,
      });

      const stateManager = getStateManager();
      const cached = stateManager.getCache('test_cache');
      
      expect(cached).toEqual(mockData);
    });

    it('should return cached data without fetching (Req 14.3)', async () => {
      const cachedData = { cached: true };
      const stateManager = getStateManager();
      stateManager.setCache('test_cache', cachedData, CacheTTL.FIVE_MINUTES);

      const result = await fetchWithRetry('https://api.example.com/data', {
        cacheKey: 'test_cache',
        cacheTTL: CacheTTL.FIVE_MINUTES,
      });

      expect(result).toEqual(cachedData);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should retry on network failure (Req 15.2)', async () => {
      const mockData = { success: true };
      
      // Fail twice, succeed on third attempt
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockData),
        });

      const result = await fetchWithRetry('https://api.example.com/data', {
        maxRetries: 3,
      });

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should throw ApiError after max retries', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        fetchWithRetry('https://api.example.com/data', { maxRetries: 3 })
      ).rejects.toThrow(ApiError);

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should return stale cache on failure (Req 15.2)', async () => {
      // Set up expired cache directly in localStorage
      const staleData = { stale: true };
      const cacheKey = 'test_stale_fallback';
      
      // Set cache with expired TTL
      // The API now uses getFreshCache which doesn't delete expired entries
      localStorage.setItem(`teletext_cache_${cacheKey}`, JSON.stringify({
        data: staleData,
        timestamp: Date.now() - 1000000, // Expired long ago
        ttl: 1000,
      }));

      // Make fetch fail
      mockFetch.mockRejectedValue(new Error('Network error'));

      // fetchWithRetry should:
      // 1. Check fresh cache via getFreshCache() - returns null (expired but NOT deleted)
      // 2. Try to fetch - fails
      // 3. Get stale cache via getStaleCache() - finds the expired data
      // 4. Return stale data with _stale flag
      const result = await fetchWithRetry('https://api.example.com/data', {
        cacheKey: cacheKey,
        cacheTTL: CacheTTL.ONE_HOUR,
        maxRetries: 1,
      });

      expect(result).toEqual({ stale: true, _stale: true });
    });

    it('should handle 404 errors (Req 15.1)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(
        fetchWithRetry('https://api.example.com/data', { maxRetries: 1 })
      ).rejects.toMatchObject({
        type: ErrorTypes.NOT_FOUND,
      });
    });

    it('should handle 429 rate limit errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      await expect(
        fetchWithRetry('https://api.example.com/data', { maxRetries: 1 })
      ).rejects.toMatchObject({
        type: ErrorTypes.RATE_LIMIT,
      });
    });

    it('should handle 500 server errors with retry', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      const result = await fetchWithRetry('https://api.example.com/data', {
        maxRetries: 2,
      });

      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle JSON parse errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(
        fetchWithRetry('https://api.example.com/data', { maxRetries: 1 })
      ).rejects.toMatchObject({
        type: ErrorTypes.PARSE,
      });
    });

    it('should not retry parse errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(
        fetchWithRetry('https://api.example.com/data', { maxRetries: 3 })
      ).rejects.toThrow();

      // Should only try once since parse errors are not retryable
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // get() Tests
  // ============================================

  describe('get', () => {
    it('should make GET request with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      });

      await get('https://api.example.com/data');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Accept': 'application/json',
          }),
        })
      );
    });

    it('should support caching options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      });

      await get('https://api.example.com/data', {
        cacheKey: 'get_test',
        cacheTTL: CacheTTL.ONE_MINUTE,
      });

      const stateManager = getStateManager();
      expect(stateManager.getCache('get_test')).toEqual({ data: 'test' });
    });
  });

  // ============================================
  // post() Tests
  // ============================================

  describe('post', () => {
    it('should make POST request with JSON body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const body = { name: 'test', value: 123 };
      await post('https://api.example.com/data', body);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }),
          body: JSON.stringify(body),
        })
      );
    });
  });

  // ============================================
  // buildUrl Tests
  // ============================================

  describe('buildUrl', () => {
    it('should build URL with query parameters', () => {
      const url = buildUrl('https://api.example.com/data', {
        foo: 'bar',
        num: 123,
      });

      expect(url).toBe('https://api.example.com/data?foo=bar&num=123');
    });

    it('should handle empty params', () => {
      const url = buildUrl('https://api.example.com/data', {});
      expect(url).toBe('https://api.example.com/data');
    });

    it('should skip null and undefined values', () => {
      const url = buildUrl('https://api.example.com/data', {
        foo: 'bar',
        empty: null,
        missing: undefined,
      });

      expect(url).toBe('https://api.example.com/data?foo=bar');
    });

    it('should handle existing query parameters', () => {
      const url = buildUrl('https://api.example.com/data?existing=true', {
        foo: 'bar',
      });

      expect(url).toBe('https://api.example.com/data?existing=true&foo=bar');
    });
  });

  // ============================================
  // isOnline Tests
  // ============================================

  describe('isOnline', () => {
    it('should return navigator.onLine value', () => {
      // navigator.onLine is typically true in test environment
      expect(typeof isOnline()).toBe('boolean');
    });
  });

  // ============================================
  // getErrorMessage Tests
  // ============================================

  describe('getErrorMessage', () => {
    it('should return user message for ApiError', () => {
      const error = new ApiError(ErrorTypes.NETWORK, 'test');
      const message = getErrorMessage(error);

      expect(message).toEqual(ErrorMessages[ErrorTypes.NETWORK]);
    });

    it('should return unknown message for regular Error', () => {
      const error = new Error('test');
      const message = getErrorMessage(error);

      expect(message).toEqual(ErrorMessages[ErrorTypes.UNKNOWN]);
    });
  });

  // ============================================
  // isRetryableError Tests
  // ============================================

  describe('isRetryableError', () => {
    it('should return true for retryable ApiError', () => {
      const error = new ApiError(ErrorTypes.NETWORK, 'test');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for non-retryable ApiError', () => {
      const error = new ApiError(ErrorTypes.PARSE, 'test');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return true for regular Error (default)', () => {
      const error = new Error('test');
      expect(isRetryableError(error)).toBe(true);
    });
  });

  // ============================================
  // CacheTTL Tests
  // ============================================

  describe('CacheTTL', () => {
    it('should have correct values', () => {
      expect(CacheTTL.ONE_MINUTE).toBe(60 * 1000);
      expect(CacheTTL.FIVE_MINUTES).toBe(5 * 60 * 1000);
      expect(CacheTTL.FIFTEEN_MINUTES).toBe(15 * 60 * 1000);
      expect(CacheTTL.ONE_HOUR).toBe(60 * 60 * 1000);
      expect(CacheTTL.ONE_DAY).toBe(24 * 60 * 60 * 1000);
      expect(CacheTTL.SESSION).toBe(Infinity);
    });
  });
});
