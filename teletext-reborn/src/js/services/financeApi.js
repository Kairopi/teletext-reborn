/**
 * Teletext Reborn - Finance API Service
 * 
 * Integrates with Coinlore API for cryptocurrency prices.
 * Displays top 7 cryptocurrencies by market cap with 24h changes.
 * 
 * API: https://api.coinlore.net/api/tickers/ (FREE, no API key required)
 * 
 * @module services/financeApi
 * Requirements: 7.1-7.7
 */

import { get, buildUrl, CacheTTL, ApiError, ErrorTypes } from './api.js';
import { truncateToWidth } from '../utils/teletext.js';

// ============================================
// Constants
// ============================================

/**
 * Coinlore API endpoint (FREE - no API key required)
 */
export const CRYPTO_API = 'https://api.coinlore.net/api/tickers/';

/**
 * Cache TTL for crypto data (1 minute - Req 7.7)
 */
export const CACHE_TTL = CacheTTL.ONE_MINUTE;

/**
 * Maximum cryptocurrencies to display (Req 7.2)
 */
export const MAX_CRYPTOS = 7;

/**
 * Rate limit window in milliseconds (1 minute)
 */
export const RATE_LIMIT_WINDOW = 60 * 1000;

/**
 * Maximum requests per minute (self-imposed limit)
 */
export const MAX_REQUESTS_PER_MINUTE = 30;

/**
 * Finance page number constant
 */
export const FINANCE_PAGE = 300;

/**
 * Debug mode flag
 * @private
 */
const DEBUG = false;

/**
 * Log debug message
 * @param {string} message - Message to log
 * @param {any} [data] - Optional data to log
 * @private
 */
function debugLog(message, data) {
  if (DEBUG) {
    if (data !== undefined) {
      console.debug('[FinanceAPI] ' + message, data);
    } else {
      console.debug('[FinanceAPI] ' + message);
    }
  }
}

// ============================================
// Rate Limit Management
// ============================================

/**
 * Request timestamps for rate limiting
 * @private
 */
let requestTimes = [];

/**
 * Check if we can make a request (rate limit check)
 * @returns {boolean} True if request is allowed
 */
export function canMakeRequest() {
  const now = Date.now();
  const oneMinuteAgo = now - RATE_LIMIT_WINDOW;
  requestTimes = requestTimes.filter(time => time > oneMinuteAgo);
  return requestTimes.length < MAX_REQUESTS_PER_MINUTE;
}

/**
 * Track a request for rate limiting
 * @private
 */
function trackRequest() {
  requestTimes.push(Date.now());
  debugLog('Request tracked', { count: requestTimes.length });
}

/**
 * Get time until rate limit resets
 * @returns {number} Milliseconds until reset, or 0 if not limited
 */
export function getTimeUntilReset() {
  if (requestTimes.length === 0) return 0;
  const oldestRequest = Math.min(...requestTimes);
  const resetTime = oldestRequest + RATE_LIMIT_WINDOW;
  return Math.max(0, resetTime - Date.now());
}

/**
 * Reset rate limits (for testing)
 */
export function resetRateLimits() {
  requestTimes = [];
  debugLog('Rate limits reset');
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generate cache key for crypto data
 * @param {string} type - Cache type identifier
 * @returns {string} Cache key
 */
export function getCacheKey(type) {
  return 'crypto_' + type;
}

/**
 * Format price for display (Req 7.4)
 * @param {number} price - Price in USD
 * @returns {string} Formatted price with $ symbol
 */
export function formatPrice(price) {
  if (typeof price !== 'number' || isNaN(price)) {
    return 'N/A';
  }
  const dollar = '$';
  if (price >= 1000) {
    return dollar + price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } else if (price >= 1) {
    return dollar + price.toFixed(2);
  } else if (price >= 0.01) {
    return dollar + price.toFixed(4);
  } else {
    return dollar + price.toFixed(6);
  }
}

/**
 * Format percentage change for display (Req 7.3, 7.4)
 * @param {number} change - Percentage change
 * @returns {{ text: string, isPositive: boolean, isNegative: boolean }}
 */
export function formatChange(change) {
  if (typeof change !== 'number' || isNaN(change)) {
    return { text: 'N/A', isPositive: false, isNegative: false };
  }

  const isPositive = change > 0;
  const isNegative = change < 0;
  const sign = isPositive ? '+' : '';
  const text = sign + change.toFixed(2) + '%';

  return { text, isPositive, isNegative };
}

/**
 * Format symbol to uppercase
 * @param {string} symbol - Crypto symbol
 * @returns {string} Uppercase symbol
 */
export function formatSymbol(symbol) {
  if (typeof symbol !== 'string') return '';
  return symbol.toUpperCase();
}

/**
 * Format crypto name with truncation
 * @param {string} name - Crypto name
 * @param {number} [maxWidth=15] - Maximum width
 * @returns {string} Truncated name
 */
export function formatCryptoName(name, maxWidth = 15) {
  if (typeof name !== 'string') return '';
  return truncateToWidth(name, maxWidth);
}


// ============================================
// Data Parsing
// ============================================

/**
 * Parse cryptocurrency data from Coinlore API response
 * @param {Object} data - Raw API response
 * @returns {Array} Parsed crypto data array
 */
export function parseCryptoData(data) {
  const coins = (data && data.data) ? data.data : data;

  if (!Array.isArray(coins)) {
    debugLog('Invalid data format', data);
    return [];
  }

  return coins.slice(0, MAX_CRYPTOS).map(coin => ({
    id: coin.id || '',
    symbol: formatSymbol(coin.symbol || ''),
    name: coin.name || '',
    price: coin.price_usd ? parseFloat(coin.price_usd) : null,
    change24h: coin.percent_change_24h ? parseFloat(coin.percent_change_24h) : null,
    change1h: coin.percent_change_1h ? parseFloat(coin.percent_change_1h) : null,
    change7d: coin.percent_change_7d ? parseFloat(coin.percent_change_7d) : null,
    marketCap: coin.market_cap_usd ? parseFloat(coin.market_cap_usd) : null,
    volume24h: coin.volume24 ? parseFloat(coin.volume24) : null,
    rank: coin.rank ? parseInt(coin.rank, 10) : null,
    lastUpdated: new Date().toISOString()
  }));
}

/**
 * Get cached crypto prices (for fallback)
 * @returns {Object|null} Cached data or null
 */
export function getCachedCryptoPrices() {
  try {
    const cacheKey = 'teletext_cache_' + getCacheKey('prices');
    const stored = localStorage.getItem(cacheKey);

    if (stored) {
      const entry = JSON.parse(stored);
      if (entry.data) {
        debugLog('Retrieved cached crypto prices');
        return {
          cryptos: parseCryptoData(entry.data),
          lastUpdated: entry.timestamp ? new Date(entry.timestamp).toISOString() : null,
          _cached: true
        };
      }
    }
  } catch (error) {
    debugLog('Failed to get cached prices', error);
  }
  return null;
}

// ============================================
// Main API Functions
// ============================================

/**
 * Fetch cryptocurrency prices from Coinlore API
 * @returns {Promise<Object>} Crypto data with prices
 * @throws {ApiError} On API failure with no cache
 */
export async function getCryptoPrices() {
  const cacheKey = getCacheKey('prices');

  // Check rate limit (Req 7.7)
  if (!canMakeRequest()) {
    debugLog('Rate limit reached, using cached data');
    const cachedData = getCachedCryptoPrices();

    if (cachedData) {
      return {
        cryptos: cachedData.cryptos,
        lastUpdated: cachedData.lastUpdated,
        _stale: true,
        _rateLimited: true,
        _rateLimitResetIn: getTimeUntilReset()
      };
    }

    throw new ApiError(
      ErrorTypes.RATE_LIMIT,
      'RATE LIMIT REACHED - PLEASE WAIT',
      { retryable: false }
    );
  }

  // Build URL with parameters
  const url = buildUrl(CRYPTO_API, {
    start: 0,
    limit: MAX_CRYPTOS
  });

  // Track the request
  trackRequest();

  try {
    const data = await get(url, {
      cacheKey: cacheKey,
      cacheTTL: CACHE_TTL
    });

    const cryptos = parseCryptoData(data);
    debugLog('Fetched crypto prices', { count: cryptos.length });

    return {
      cryptos: cryptos,
      lastUpdated: new Date().toISOString(),
      _stale: data._stale || false,
      _rateLimited: false
    };

  } catch (error) {
    debugLog('API error, trying cache fallback', error.message);

    // Fallback to cached data on error (Req 7.7)
    const cached = getCachedCryptoPrices();
    if (cached) {
      return {
        cryptos: cached.cryptos,
        lastUpdated: cached.lastUpdated,
        _stale: true,
        _error: error.message
      };
    }

    throw error;
  }
}


// ============================================
// Display Formatting
// ============================================

/**
 * Format single crypto for display
 * @param {Object} crypto - Parsed crypto data
 * @returns {Object|null} Formatted crypto or null
 */
export function formatCryptoForDisplay(crypto) {
  if (!crypto) return null;

  const change = formatChange(crypto.change24h);

  return {
    symbol: crypto.symbol,
    name: formatCryptoName(crypto.name),
    price: formatPrice(crypto.price),
    change: change.text,
    isPositive: change.isPositive,
    isNegative: change.isNegative,
    rank: crypto.rank ? '#' + crypto.rank : ''
  };
}

/**
 * Format all cryptos for display
 * @param {Array} cryptos - Array of parsed cryptos
 * @returns {Array} Array of formatted cryptos
 */
export function formatAllCryptosForDisplay(cryptos) {
  if (!Array.isArray(cryptos)) return [];
  return cryptos.map(formatCryptoForDisplay).filter(Boolean);
}

/**
 * Get CSS color class for change value (Req 7.3)
 * @param {number} change - Change percentage
 * @returns {string} 'positive', 'negative', or ''
 */
export function getChangeColorClass(change) {
  if (typeof change !== 'number' || isNaN(change)) return '';
  if (change > 0) return 'positive';
  if (change < 0) return 'negative';
  return '';
}

/**
 * Format last updated timestamp (Req 7.6)
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted time (HH:MM:SS)
 */
export function formatLastUpdated(isoString) {
  if (!isoString) return 'N/A';

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'N/A';

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return hours + ':' + minutes + ':' + seconds;
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Get rate limit notice message (Req 7.7)
 * @param {number} resetInMs - Milliseconds until reset
 * @returns {string} Notice message
 */
export function getRateLimitNotice(resetInMs) {
  if (!resetInMs || resetInMs <= 0) {
    return 'USING CACHED DATA';
  }

  const seconds = Math.ceil(resetInMs / 1000);
  if (seconds < 60) {
    return 'USING CACHED DATA - REFRESH IN ' + seconds + 'S';
  }

  const minutes = Math.ceil(seconds / 60);
  return 'USING CACHED DATA - REFRESH IN ' + minutes + 'M';
}

// ============================================
// Mock Data for Development/Testing
// ============================================

/**
 * Mock crypto data for testing without API
 */
export const MOCK_CRYPTO_DATA = {
  cryptos: [
    { id: '90', symbol: 'BTC', name: 'Bitcoin', price: 92958.04, change24h: -0.11, rank: 1 },
    { id: '80', symbol: 'ETH', name: 'Ethereum', price: 3174.54, change24h: 2.82, rank: 2 },
    { id: '518', symbol: 'USDT', name: 'Tether', price: 0.999989, change24h: -0.02, rank: 3 },
    { id: '58', symbol: 'XRP', name: 'XRP', price: 2.14, change24h: -1.54, rank: 4 },
    { id: '2710', symbol: 'BNB', name: 'Binance Coin', price: 908.47, change24h: 0.57, rank: 5 },
    { id: '48543', symbol: 'SOL', name: 'Solana', price: 142.75, change24h: 0.48, rank: 6 },
    { id: '33285', symbol: 'USDC', name: 'USD Coin', price: 0.999691, change24h: -0.01, rank: 7 }
  ],
  lastUpdated: new Date().toISOString(),
  _stale: false,
  _rateLimited: false
};

/**
 * Get mock crypto data for testing
 * @returns {Object} Mock crypto data
 */
export function getMockCryptoPrices() {
  return {
    cryptos: MOCK_CRYPTO_DATA.cryptos,
    lastUpdated: new Date().toISOString(),
    _stale: false,
    _rateLimited: false
  };
}

// ============================================
// Finance Page Helpers
// ============================================

/**
 * Check if a page number is a finance page
 * @param {number} pageNumber - Page number to check
 * @returns {boolean} True if it's a finance page
 */
export function isFinancePage(pageNumber) {
  return pageNumber >= 300 && pageNumber <= 309;
}
