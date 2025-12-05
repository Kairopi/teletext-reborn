/**
 * Teletext Reborn - Finance API Service Tests
 * 
 * Tests for the Coinlore API integration including:
 * - Crypto price fetching
 * - Rate limit handling
 * - Cache management
 * - Price and change formatting
 * 
 * Requirements: 7.1-7.7
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import {
  getCryptoPrices,
  getCachedCryptoPrices,
  formatCryptoForDisplay,
  formatAllCryptosForDisplay,
  formatPrice,
  formatChange,
  formatSymbol,
  formatCryptoName,
  formatLastUpdated,
  getChangeColorClass,
  getRateLimitNotice,
  canMakeRequest,
  getTimeUntilReset,
  resetRateLimits,
  isFinancePage,
  getMockCryptoPrices,
  parseCryptoData,
  getCacheKey,
  CRYPTO_API,
  CACHE_TTL,
  MAX_CRYPTOS,
  RATE_LIMIT_WINDOW,
  MAX_REQUESTS_PER_MINUTE,
  FINANCE_PAGE,
  MOCK_CRYPTO_DATA,
} from './financeApi.js';

// ============================================
// Test Setup
// ============================================

describe('Finance API Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset rate limits
    resetRateLimits();
    // Reset fetch mock
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetRateLimits();
    vi.restoreAllMocks();
  });

  // ============================================
  // Constants Tests
  // ============================================

  describe('Constants', () => {
    it('should have correct API endpoint', () => {
      expect(CRYPTO_API).toBe('https://api.coinlore.net/api/tickers/');
    });

    it('should have 1 minute cache TTL (Req 7.7)', () => {
      expect(CACHE_TTL).toBe(60 * 1000);
    });

    it('should display 7 cryptocurrencies (Req 7.2)', () => {
      expect(MAX_CRYPTOS).toBe(7);
    });

    it('should have rate limit window of 1 minute', () => {
      expect(RATE_LIMIT_WINDOW).toBe(60 * 1000);
    });

    it('should have max 30 requests per minute', () => {
      expect(MAX_REQUESTS_PER_MINUTE).toBe(30);
    });

    it('should have finance page constant', () => {
      expect(FINANCE_PAGE).toBe(300);
    });
  });

  // ============================================
  // Rate Limit Tests
  // ============================================

  describe('Rate Limit Management', () => {
    it('should allow requests when under limit', () => {
      resetRateLimits();
      expect(canMakeRequest()).toBe(true);
    });

    it('should return 0 time until reset when no requests made', () => {
      resetRateLimits();
      expect(getTimeUntilReset()).toBe(0);
    });

    it('should reset rate limits correctly', () => {
      resetRateLimits();
      expect(canMakeRequest()).toBe(true);
    });
  });

  // ============================================
  // Cache Key Tests
  // ============================================

  describe('Cache Key Generation', () => {
    it('should generate correct cache keys', () => {
      expect(getCacheKey('prices')).toBe('crypto_prices');
      expect(getCacheKey('test')).toBe('crypto_test');
    });
  });

  // ============================================
  // Price Formatting Tests (Req 7.4)
  // ============================================

  describe('Price Formatting (Req 7.4)', () => {
    it('should format large prices with commas', () => {
      expect(formatPrice(92958.04)).toBe('$92,958.04');
      expect(formatPrice(1000)).toBe('$1,000.00');
    });

    it('should format medium prices with 2 decimals', () => {
      expect(formatPrice(142.75)).toBe('$142.75');
      expect(formatPrice(1.50)).toBe('$1.50');
    });

    it('should format small prices with 4 decimals', () => {
      expect(formatPrice(0.05)).toBe('$0.0500');
      expect(formatPrice(0.01)).toBe('$0.0100');
    });

    it('should format very small prices with 6 decimals', () => {
      expect(formatPrice(0.001234)).toBe('$0.001234');
      expect(formatPrice(0.000001)).toBe('$0.000001');
    });

    it('should return N/A for invalid prices', () => {
      expect(formatPrice(null)).toBe('N/A');
      expect(formatPrice(undefined)).toBe('N/A');
      expect(formatPrice(NaN)).toBe('N/A');
      expect(formatPrice('string')).toBe('N/A');
    });
  });

  // ============================================
  // Change Formatting Tests (Req 7.3, 7.4)
  // ============================================

  describe('Change Formatting (Req 7.3, 7.4)', () => {
    it('should format positive changes with + sign', () => {
      const result = formatChange(2.82);
      expect(result.text).toBe('+2.82%');
      expect(result.isPositive).toBe(true);
      expect(result.isNegative).toBe(false);
    });

    it('should format negative changes', () => {
      const result = formatChange(-1.54);
      expect(result.text).toBe('-1.54%');
      expect(result.isPositive).toBe(false);
      expect(result.isNegative).toBe(true);
    });

    it('should format zero change', () => {
      const result = formatChange(0);
      expect(result.text).toBe('0.00%');
      expect(result.isPositive).toBe(false);
      expect(result.isNegative).toBe(false);
    });

    it('should return N/A for invalid changes', () => {
      expect(formatChange(null).text).toBe('N/A');
      expect(formatChange(undefined).text).toBe('N/A');
      expect(formatChange(NaN).text).toBe('N/A');
      expect(formatChange('string').text).toBe('N/A');
    });
  });

  // ============================================
  // Symbol Formatting Tests
  // ============================================

  describe('Symbol Formatting', () => {
    it('should uppercase symbols', () => {
      expect(formatSymbol('btc')).toBe('BTC');
      expect(formatSymbol('eth')).toBe('ETH');
      expect(formatSymbol('BTC')).toBe('BTC');
    });

    it('should handle invalid input', () => {
      expect(formatSymbol(null)).toBe('');
      expect(formatSymbol(undefined)).toBe('');
      expect(formatSymbol(123)).toBe('');
    });
  });

  // ============================================
  // Crypto Name Formatting Tests
  // ============================================

  describe('Crypto Name Formatting', () => {
    it('should truncate long names', () => {
      const result = formatCryptoName('Very Long Cryptocurrency Name', 10);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('should preserve short names', () => {
      expect(formatCryptoName('Bitcoin', 15)).toBe('Bitcoin');
    });

    it('should handle invalid input', () => {
      expect(formatCryptoName(null, 10)).toBe('');
      expect(formatCryptoName(undefined, 10)).toBe('');
      expect(formatCryptoName(123, 10)).toBe('');
    });
  });

  // ============================================
  // Data Parsing Tests
  // ============================================

  describe('Data Parsing', () => {
    it('should parse Coinlore API response correctly', () => {
      const apiResponse = {
        data: [
          {
            id: '90',
            symbol: 'BTC',
            name: 'Bitcoin',
            rank: 1,
            price_usd: '92958.04',
            percent_change_24h: '-0.11',
            percent_change_1h: '0.05',
            percent_change_7d: '2.5',
            market_cap_usd: '1800000000000',
            volume24: '50000000000',
          },
        ],
      };

      const parsed = parseCryptoData(apiResponse);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('90');
      expect(parsed[0].symbol).toBe('BTC');
      expect(parsed[0].name).toBe('Bitcoin');
      expect(parsed[0].price).toBe(92958.04);
      expect(parsed[0].change24h).toBe(-0.11);
      expect(parsed[0].rank).toBe(1);
    });

    it('should limit to MAX_CRYPTOS', () => {
      const manyCoins = Array(20).fill(null).map((_, i) => ({
        id: String(i),
        symbol: `COIN${i}`,
        name: `Coin ${i}`,
        price_usd: '100',
      }));

      const parsed = parseCryptoData({ data: manyCoins });
      expect(parsed.length).toBeLessThanOrEqual(MAX_CRYPTOS);
    });

    it('should handle empty data', () => {
      expect(parseCryptoData({ data: [] })).toHaveLength(0);
      expect(parseCryptoData({})).toHaveLength(0);
      expect(parseCryptoData(null)).toHaveLength(0);
    });

    it('should handle array directly (without data wrapper)', () => {
      const coins = [
        { id: '1', symbol: 'BTC', name: 'Bitcoin', price_usd: '50000' },
      ];
      const parsed = parseCryptoData(coins);
      expect(parsed).toHaveLength(1);
    });
  });

  // ============================================
  // Display Formatting Tests
  // ============================================

  describe('Display Formatting', () => {
    it('should format crypto for display', () => {
      const crypto = {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 92958.04,
        change24h: -0.11,
        rank: 1,
      };

      const formatted = formatCryptoForDisplay(crypto);

      expect(formatted.symbol).toBe('BTC');
      expect(formatted.price).toBe('$92,958.04');
      expect(formatted.change).toBe('-0.11%');
      expect(formatted.isNegative).toBe(true);
      expect(formatted.rank).toBe('#1');
    });

    it('should return null for invalid input', () => {
      expect(formatCryptoForDisplay(null)).toBeNull();
      expect(formatCryptoForDisplay(undefined)).toBeNull();
    });

    it('should format all cryptos for display', () => {
      const cryptos = [
        { symbol: 'BTC', name: 'Bitcoin', price: 92958.04, change24h: -0.11, rank: 1 },
        { symbol: 'ETH', name: 'Ethereum', price: 3174.54, change24h: 2.82, rank: 2 },
      ];

      const formatted = formatAllCryptosForDisplay(cryptos);

      expect(formatted).toHaveLength(2);
      expect(formatted[0].symbol).toBe('BTC');
      expect(formatted[1].symbol).toBe('ETH');
    });

    it('should handle empty array', () => {
      expect(formatAllCryptosForDisplay([])).toHaveLength(0);
    });

    it('should handle non-array input', () => {
      expect(formatAllCryptosForDisplay(null)).toHaveLength(0);
      expect(formatAllCryptosForDisplay(undefined)).toHaveLength(0);
    });
  });

  // ============================================
  // Color Class Tests (Req 7.3)
  // ============================================

  describe('Change Color Class (Req 7.3)', () => {
    it('should return positive for positive changes', () => {
      expect(getChangeColorClass(2.5)).toBe('positive');
      expect(getChangeColorClass(0.01)).toBe('positive');
    });

    it('should return negative for negative changes', () => {
      expect(getChangeColorClass(-1.5)).toBe('negative');
      expect(getChangeColorClass(-0.01)).toBe('negative');
    });

    it('should return empty for zero', () => {
      expect(getChangeColorClass(0)).toBe('');
    });

    it('should return empty for invalid input', () => {
      expect(getChangeColorClass(null)).toBe('');
      expect(getChangeColorClass(NaN)).toBe('');
    });
  });

  // ============================================
  // Last Updated Formatting Tests (Req 7.6)
  // ============================================

  describe('Last Updated Formatting (Req 7.6)', () => {
    it('should format ISO string to HH:MM:SS', () => {
      const date = new Date('2025-12-04T14:30:45Z');
      const result = formatLastUpdated(date.toISOString());
      // Result depends on timezone, just check format
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('should return N/A for invalid input', () => {
      expect(formatLastUpdated(null)).toBe('N/A');
      expect(formatLastUpdated(undefined)).toBe('N/A');
      expect(formatLastUpdated('')).toBe('N/A');
      expect(formatLastUpdated('invalid')).toBe('N/A');
    });
  });

  // ============================================
  // Rate Limit Notice Tests (Req 7.7)
  // ============================================

  describe('Rate Limit Notice (Req 7.7)', () => {
    it('should show cached data message when no reset time', () => {
      expect(getRateLimitNotice(0)).toBe('USING CACHED DATA');
      expect(getRateLimitNotice(null)).toBe('USING CACHED DATA');
    });

    it('should show seconds when under 60s', () => {
      expect(getRateLimitNotice(30000)).toBe('USING CACHED DATA - REFRESH IN 30S');
      expect(getRateLimitNotice(5000)).toBe('USING CACHED DATA - REFRESH IN 5S');
    });

    it('should show minutes when 60s or more', () => {
      expect(getRateLimitNotice(60000)).toBe('USING CACHED DATA - REFRESH IN 1M');
      expect(getRateLimitNotice(120000)).toBe('USING CACHED DATA - REFRESH IN 2M');
    });
  });

  // ============================================
  // Finance Page Helper Tests
  // ============================================

  describe('Finance Page Helpers', () => {
    it('should identify finance pages correctly', () => {
      expect(isFinancePage(300)).toBe(true);
      expect(isFinancePage(305)).toBe(true);
      expect(isFinancePage(309)).toBe(true);
    });

    it('should reject non-finance pages', () => {
      expect(isFinancePage(299)).toBe(false);
      expect(isFinancePage(310)).toBe(false);
      expect(isFinancePage(100)).toBe(false);
      expect(isFinancePage(200)).toBe(false);
    });
  });

  // ============================================
  // Mock Data Tests
  // ============================================

  describe('Mock Data', () => {
    it('should return mock crypto data', () => {
      const mockData = getMockCryptoPrices();

      expect(mockData.cryptos).toBeInstanceOf(Array);
      expect(mockData.cryptos.length).toBe(7);
      expect(mockData.lastUpdated).toBeDefined();
      expect(mockData._stale).toBe(false);
      expect(mockData._rateLimited).toBe(false);
    });

    it('should have correct mock crypto structure', () => {
      const mockData = getMockCryptoPrices();
      const btc = mockData.cryptos[0];

      expect(btc.symbol).toBe('BTC');
      expect(btc.name).toBe('Bitcoin');
      expect(typeof btc.price).toBe('number');
      expect(typeof btc.change24h).toBe('number');
    });

    it('should have MOCK_CRYPTO_DATA constant', () => {
      expect(MOCK_CRYPTO_DATA).toBeDefined();
      expect(MOCK_CRYPTO_DATA.cryptos).toHaveLength(7);
    });
  });

  // ============================================
  // Property-Based Tests
  // ============================================

  describe('Property: Price Formatting', () => {
    /**
     * Property: For any valid number, formatPrice should return a string starting with $
     */
    it('should always return string starting with $ for valid numbers', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1000000, noNaN: true }),
          (price) => {
            const result = formatPrice(price);
            return result.startsWith('$');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Change Formatting', () => {
    /**
     * Property: For any valid number, formatChange should return correct sign
     */
    it('should correctly identify positive/negative changes', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -100, max: 100, noNaN: true }),
          (change) => {
            const result = formatChange(change);
            if (change > 0) return result.isPositive === true;
            if (change < 0) return result.isNegative === true;
            return result.isPositive === false && result.isNegative === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Symbol Formatting', () => {
    /**
     * Property: For any string, formatSymbol should return uppercase
     */
    it('should always return uppercase symbols', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }),
          (symbol) => {
            const result = formatSymbol(symbol);
            return result === result.toUpperCase();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================
  // Integration Tests (with mocked fetch)
  // ============================================

  describe('API Integration', () => {
    it('should handle API errors gracefully', async () => {
      // Mock fetch to fail
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      // Should throw when no cache available
      await expect(getCryptoPrices()).rejects.toThrow();
    });

    it('should return cached data when available', () => {
      // Set up cache
      localStorage.setItem('teletext_cache_crypto_prices', JSON.stringify({
        data: {
          data: [
            { id: '90', symbol: 'BTC', name: 'Bitcoin', price_usd: '50000', percent_change_24h: '1.5' },
          ],
        },
        timestamp: Date.now(),
        ttl: CACHE_TTL,
      }));

      const cached = getCachedCryptoPrices();
      expect(cached).not.toBeNull();
      expect(cached.cryptos).toHaveLength(1);
      expect(cached._cached).toBe(true);
    });

    it('should return null when no cache exists', () => {
      localStorage.clear();
      const cached = getCachedCryptoPrices();
      expect(cached).toBeNull();
    });
  });
});
