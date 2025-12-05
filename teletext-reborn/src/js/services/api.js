/**
 * Teletext Reborn - Base API Utilities
 * 
 * Provides a fetch wrapper with:
 * - Retry logic (3 attempts)
 * - Timeout handling
 * - Cache integration via StateManager
 * - Error handling with typed errors
 * 
 * Requirements: 14.2, 14.3, 15.1, 15.2
 */

import { getStateManager } from '../state.js';

// ============================================
// Constants
// ============================================

/**
 * Default configuration for API requests
 */
const DEFAULT_CONFIG = {
  /** Maximum number of retry attempts */
  maxRetries: 3,
  /** Request timeout in milliseconds */
  timeout: 10000,
  /** Base delay for exponential backoff (ms) */
  baseDelay: 1000,
};

/**
 * Error types for API failures
 */
export const ErrorTypes = {
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  RATE_LIMIT: 'rate_limit',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  PARSE: 'parse',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown',
};

/**
 * User-friendly error messages in Teletext style (Req 15.1)
 */
export const ErrorMessages = {
  [ErrorTypes.NETWORK]: {
    title: 'CONNECTION LOST',
    message: 'Please check your internet connection',
    action: 'RETRY',
  },
  [ErrorTypes.TIMEOUT]: {
    title: 'SERVICE SLOW',
    message: 'The service is taking too long',
    action: 'RETRY',
  },
  [ErrorTypes.RATE_LIMIT]: {
    title: 'SERVICE BUSY',
    message: 'Using cached data - please wait',
    action: 'WAIT',
  },
  [ErrorTypes.NOT_FOUND]: {
    title: 'NOT FOUND',
    message: 'The requested data was not found',
    action: 'HOME',
  },
  [ErrorTypes.SERVER]: {
    title: 'SERVICE ERROR',
    message: 'Something went wrong on the server',
    action: 'RETRY',
  },
  [ErrorTypes.PARSE]: {
    title: 'DATA ERROR',
    message: 'Could not read the response data',
    action: 'RETRY',
  },
  [ErrorTypes.VALIDATION]: {
    title: 'INVALID INPUT',
    message: 'Please check your entry',
    action: 'FIX',
  },
  [ErrorTypes.UNKNOWN]: {
    title: 'ERROR',
    message: 'An unexpected error occurred',
    action: 'RETRY',
  },
};

// ============================================
// Custom Error Class
// ============================================

/**
 * Custom API error with type and metadata
 */
export class ApiError extends Error {
  /**
   * @param {string} type - Error type from ErrorTypes
   * @param {string} message - Error message
   * @param {Object} [options] - Additional options
   * @param {number} [options.status] - HTTP status code
   * @param {any} [options.data] - Additional error data
   * @param {boolean} [options.retryable] - Whether the error is retryable
   */
  constructor(type, message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = options.status;
    this.data = options.data;
    this.retryable = options.retryable ?? this._isRetryable(type);
    this.userMessage = ErrorMessages[type] || ErrorMessages[ErrorTypes.UNKNOWN];
  }

  /**
   * Determine if an error type is retryable
   * @param {string} type - Error type
   * @returns {boolean}
   * @private
   */
  _isRetryable(type) {
    return [
      ErrorTypes.NETWORK,
      ErrorTypes.TIMEOUT,
      ErrorTypes.SERVER,
    ].includes(type);
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Delay execution for a specified time
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determine error type from response status code
 * @param {number} status - HTTP status code
 * @returns {string} Error type
 */
function getErrorTypeFromStatus(status) {
  if (status === 404) return ErrorTypes.NOT_FOUND;
  if (status === 429) return ErrorTypes.RATE_LIMIT;
  if (status >= 400 && status < 500) return ErrorTypes.VALIDATION;
  if (status >= 500) return ErrorTypes.SERVER;
  return ErrorTypes.UNKNOWN;
}

/**
 * Determine error type from error object
 * @param {Error} error - Error object
 * @returns {string} Error type
 */
function getErrorTypeFromError(error) {
  const message = (error.message || '').toLowerCase();
  
  if (message.includes('timeout') || message.includes('aborted')) {
    return ErrorTypes.TIMEOUT;
  }
  if (message.includes('network') || message.includes('failed to fetch')) {
    return ErrorTypes.NETWORK;
  }
  return ErrorTypes.UNKNOWN;
}

/**
 * Create an AbortController with timeout
 * @param {number} timeout - Timeout in milliseconds
 * @returns {{ controller: AbortController, timeoutId: number }}
 */
function createTimeoutController(timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  return { controller, timeoutId };
}

// ============================================
// Main Fetch Wrapper
// ============================================

/**
 * Fetch with retry logic, timeout, and cache integration
 * 
 * @param {string} url - URL to fetch
 * @param {Object} [options] - Fetch options
 * @param {Object} [options.fetchOptions] - Standard fetch options (method, headers, body, etc.)
 * @param {string} [options.cacheKey] - Cache key for storing response
 * @param {number} [options.cacheTTL] - Cache TTL in milliseconds
 * @param {number} [options.maxRetries] - Maximum retry attempts (default: 3)
 * @param {number} [options.timeout] - Request timeout in ms (default: 10000)
 * @returns {Promise<any>} Parsed JSON response
 * @throws {ApiError} On failure after all retries
 * 
 * Requirements: 14.2, 14.3, 15.1, 15.2
 */
export async function fetchWithRetry(url, options = {}) {
  const {
    fetchOptions = {},
    cacheKey,
    cacheTTL,
    maxRetries = DEFAULT_CONFIG.maxRetries,
    timeout = DEFAULT_CONFIG.timeout,
  } = options;

  const stateManager = getStateManager();

  // Check cache first (Req 14.3)
  // Note: We use getFreshCache instead of stateManager.getCache to avoid
  // deleting expired entries - we want to keep them for stale fallback
  if (cacheKey) {
    const cached = getFreshCache(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  let lastError = null;

  // Retry loop (Req 15.2)
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const { controller, timeoutId } = createTimeoutController(timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        const errorType = getErrorTypeFromStatus(response.status);
        const isRetryable = response.status >= 500;
        throw new ApiError(
          errorType,
          `HTTP ${response.status}: ${response.statusText}`,
          { status: response.status, retryable: isRetryable }
        );
      }

      // Parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new ApiError(
          ErrorTypes.PARSE,
          'Failed to parse response as JSON',
          { retryable: false }
        );
      }

      // Cache successful response (Req 14.2)
      if (cacheKey && cacheTTL) {
        stateManager.setCache(cacheKey, data, cacheTTL);
      }

      return data;

    } catch (error) {
      clearTimeout(timeoutId);

      // Convert to ApiError if not already
      if (!(error instanceof ApiError)) {
        const errorType = getErrorTypeFromError(error);
        lastError = new ApiError(
          errorType,
          error.message || 'Request failed',
          { retryable: errorType !== ErrorTypes.PARSE }
        );
      } else {
        lastError = error;
      }

      // Don't retry non-retryable errors
      if (!lastError.retryable) {
        break;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff before retry
      const backoffDelay = DEFAULT_CONFIG.baseDelay * attempt;
      await delay(backoffDelay);
    }
  }

  // All retries failed - try to return stale cache (Req 15.2)
  if (cacheKey) {
    // Force get from localStorage even if expired
    const staleData = getStaleCache(cacheKey);
    if (staleData !== null) {
      return { ...staleData, _stale: true };
    }
  }

  // No cache available, throw the error
  throw lastError || new ApiError(ErrorTypes.UNKNOWN, 'Request failed');
}

/**
 * Get fresh cache data (respecting TTL but not deleting expired entries)
 * Used for initial cache check - keeps expired entries for stale fallback
 * @param {string} key - Cache key
 * @returns {any|null} Cached data if fresh, null if expired or not found
 */
function getFreshCache(key) {
  try {
    const cacheKey = `teletext_cache_${key}`;
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      const entry = JSON.parse(stored);
      // Check if cache is still fresh (not expired)
      if (entry.timestamp && entry.ttl) {
        const isExpired = Date.now() - entry.timestamp > entry.ttl;
        if (!isExpired) {
          return entry.data;
        }
      }
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Get stale cache data (ignoring TTL expiration)
 * Used as fallback when API fails
 * @param {string} key - Cache key
 * @returns {any|null} Cached data or null
 */
function getStaleCache(key) {
  try {
    const cacheKey = `teletext_cache_${key}`;
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      const entry = JSON.parse(stored);
      return entry.data || null;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

// ============================================
// Convenience Methods
// ============================================

/**
 * Perform a GET request with retry and caching
 * @param {string} url - URL to fetch
 * @param {Object} [options] - Options
 * @param {string} [options.cacheKey] - Cache key
 * @param {number} [options.cacheTTL] - Cache TTL in ms
 * @param {number} [options.timeout] - Request timeout in ms
 * @returns {Promise<any>} Parsed JSON response
 */
export async function get(url, options = {}) {
  return fetchWithRetry(url, {
    ...options,
    fetchOptions: {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    },
  });
}

/**
 * Perform a POST request with retry
 * @param {string} url - URL to fetch
 * @param {any} body - Request body (will be JSON stringified)
 * @param {Object} [options] - Options
 * @param {number} [options.timeout] - Request timeout in ms
 * @returns {Promise<any>} Parsed JSON response
 */
export async function post(url, body, options = {}) {
  return fetchWithRetry(url, {
    ...options,
    fetchOptions: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    },
  });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if the browser is online
 * @returns {boolean}
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Build URL with query parameters
 * @param {string} baseUrl - Base URL
 * @param {Object} params - Query parameters
 * @returns {string} Full URL with query string
 */
export function buildUrl(baseUrl, params = {}) {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });
  return url.toString();
}

/**
 * Get error message for display
 * @param {ApiError|Error} error - Error object
 * @returns {{ title: string, message: string, action: string }}
 */
export function getErrorMessage(error) {
  if (error instanceof ApiError) {
    return error.userMessage;
  }
  return ErrorMessages[ErrorTypes.UNKNOWN];
}

/**
 * Check if an error is retryable
 * @param {ApiError|Error} error - Error object
 * @returns {boolean}
 */
export function isRetryableError(error) {
  if (error instanceof ApiError) {
    return error.retryable;
  }
  return true; // Default to retryable for unknown errors
}

// ============================================
// Cache TTL Constants (for convenience)
// ============================================

/**
 * Standard cache TTL values in milliseconds
 */
export const CacheTTL = {
  /** 1 minute - for frequently changing data like crypto prices */
  ONE_MINUTE: 60 * 1000,
  /** 5 minutes - for news data */
  FIVE_MINUTES: 5 * 60 * 1000,
  /** 15 minutes - for weather data */
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  /** 1 hour */
  ONE_HOUR: 60 * 60 * 1000,
  /** 24 hours - for historical data */
  ONE_DAY: 24 * 60 * 60 * 1000,
  /** Session only (until page refresh) */
  SESSION: Infinity,
};
