/**
 * Teletext Reborn - Geolocation API Service Tests
 * 
 * Tests for IP-based location detection service.
 * 
 * Requirements: 6.1, 12.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import {
  detectLocation,
  getLocation,
  createLocation,
  isValidLocation,
  formatLocation,
  clearLocationCache,
  DEFAULT_LOCATION,
  GEO_API,
  CACHE_KEY,
  parseLocationResponse,
} from './geoApi.js';
import { resetStateManager } from '../state.js';

// ============================================
// Test Setup
// ============================================

describe('Geolocation API Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    resetStateManager();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // ============================================
  // Constants Tests
  // ============================================

  describe('Constants', () => {
    it('should have correct API endpoint', () => {
      expect(GEO_API).toBe('http://ip-api.com/json');
    });

    it('should have valid default location', () => {
      expect(DEFAULT_LOCATION).toEqual({
        city: 'LONDON',
        lat: 51.5074,
        lon: -0.1278,
        country: 'UK',
        isDefault: true,
      });
      expect(isValidLocation(DEFAULT_LOCATION)).toBe(true);
    });

    it('should have cache key defined', () => {
      expect(CACHE_KEY).toBe('geolocation');
    });
  });

  // ============================================
  // parseLocationResponse Tests
  // ============================================

  describe('parseLocationResponse', () => {
    it('should parse successful IP-API response', () => {
      const response = {
        status: 'success',
        city: 'London',
        lat: 51.5074,
        lon: -0.1278,
        countryCode: 'GB',
        regionName: 'England',
        timezone: 'Europe/London',
        isp: 'Test ISP',
      };

      const result = parseLocationResponse(response);

      expect(result).toEqual({
        city: 'LONDON',
        lat: 51.5074,
        lon: -0.1278,
        country: 'GB',
        region: 'ENGLAND',
        timezone: 'Europe/London',
        isp: 'Test ISP',
        isDefault: false,
      });
    });

    it('should return null for failed response', () => {
      const response = {
        status: 'fail',
        message: 'invalid query',
      };

      const result = parseLocationResponse(response);
      expect(result).toBeNull();
    });

    it('should handle missing optional fields', () => {
      const response = {
        status: 'success',
        city: 'Paris',
        lat: 48.8566,
        lon: 2.3522,
      };

      const result = parseLocationResponse(response);

      expect(result.city).toBe('PARIS');
      expect(result.lat).toBe(48.8566);
      expect(result.lon).toBe(2.3522);
      expect(result.country).toBe('');
      expect(result.region).toBe('');
      expect(result.timezone).toBeNull();
    });

    it('should uppercase city names', () => {
      const response = {
        status: 'success',
        city: 'new york',
        lat: 40.7128,
        lon: -74.006,
      };

      const result = parseLocationResponse(response);
      expect(result.city).toBe('NEW YORK');
    });
  });

  // ============================================
  // isValidLocation Tests
  // ============================================

  describe('isValidLocation', () => {
    it('should return true for valid location', () => {
      const location = {
        city: 'LONDON',
        lat: 51.5074,
        lon: -0.1278,
      };
      expect(isValidLocation(location)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isValidLocation(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidLocation(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isValidLocation('string')).toBe(false);
      expect(isValidLocation(123)).toBe(false);
      expect(isValidLocation([])).toBe(false);
    });

    it('should return false for missing city', () => {
      expect(isValidLocation({ lat: 51.5, lon: -0.1 })).toBe(false);
    });

    it('should return false for empty city', () => {
      expect(isValidLocation({ city: '', lat: 51.5, lon: -0.1 })).toBe(false);
      expect(isValidLocation({ city: '   ', lat: 51.5, lon: -0.1 })).toBe(false);
    });

    it('should return false for missing lat', () => {
      expect(isValidLocation({ city: 'LONDON', lon: -0.1 })).toBe(false);
    });

    it('should return false for missing lon', () => {
      expect(isValidLocation({ city: 'LONDON', lat: 51.5 })).toBe(false);
    });

    it('should return false for invalid lat (out of range)', () => {
      expect(isValidLocation({ city: 'TEST', lat: 91, lon: 0 })).toBe(false);
      expect(isValidLocation({ city: 'TEST', lat: -91, lon: 0 })).toBe(false);
    });

    it('should return false for invalid lon (out of range)', () => {
      expect(isValidLocation({ city: 'TEST', lat: 0, lon: 181 })).toBe(false);
      expect(isValidLocation({ city: 'TEST', lat: 0, lon: -181 })).toBe(false);
    });

    it('should return false for NaN coordinates', () => {
      expect(isValidLocation({ city: 'TEST', lat: NaN, lon: 0 })).toBe(false);
      expect(isValidLocation({ city: 'TEST', lat: 0, lon: NaN })).toBe(false);
    });

    it('should accept boundary values for coordinates', () => {
      expect(isValidLocation({ city: 'NORTH POLE', lat: 90, lon: 0 })).toBe(true);
      expect(isValidLocation({ city: 'SOUTH POLE', lat: -90, lon: 0 })).toBe(true);
      expect(isValidLocation({ city: 'DATE LINE', lat: 0, lon: 180 })).toBe(true);
      expect(isValidLocation({ city: 'DATE LINE', lat: 0, lon: -180 })).toBe(true);
    });
  });

  // ============================================
  // formatLocation Tests
  // ============================================

  describe('formatLocation', () => {
    it('should format location with city and country', () => {
      const location = { city: 'London', country: 'UK' };
      expect(formatLocation(location)).toBe('LONDON, UK');
    });

    it('should format location with city only', () => {
      const location = { city: 'Paris' };
      expect(formatLocation(location)).toBe('PARIS');
    });

    it('should return UNKNOWN for null', () => {
      expect(formatLocation(null)).toBe('UNKNOWN');
    });

    it('should return UNKNOWN for missing city', () => {
      expect(formatLocation({ country: 'UK' })).toBe('UNKNOWN');
    });

    it('should not duplicate city and country if same', () => {
      const location = { city: 'Singapore', country: 'Singapore' };
      expect(formatLocation(location)).toBe('SINGAPORE');
    });

    it('should uppercase all text', () => {
      const location = { city: 'new york', country: 'usa' };
      expect(formatLocation(location)).toBe('NEW YORK, USA');
    });
  });

  // ============================================
  // createLocation Tests
  // ============================================

  describe('createLocation', () => {
    it('should create location with all fields', () => {
      const location = createLocation('London', 51.5074, -0.1278, 'UK');
      
      expect(location).toEqual({
        city: 'LONDON',
        lat: 51.5074,
        lon: -0.1278,
        country: 'UK',
        isDefault: false,
      });
    });

    it('should create location without coordinates', () => {
      const location = createLocation('Paris');
      
      expect(location).toEqual({
        city: 'PARIS',
        lat: null,
        lon: null,
        country: '',
        isDefault: false,
        needsGeocoding: true,
      });
    });

    it('should return null for empty city', () => {
      expect(createLocation('')).toBeNull();
      expect(createLocation('   ')).toBeNull();
    });

    it('should return null for null city', () => {
      expect(createLocation(null)).toBeNull();
    });

    it('should return null for non-string city', () => {
      expect(createLocation(123)).toBeNull();
      expect(createLocation({})).toBeNull();
    });

    it('should return null for invalid coordinates', () => {
      expect(createLocation('Test', 91, 0)).toBeNull();
      expect(createLocation('Test', 0, 181)).toBeNull();
      expect(createLocation('Test', NaN, 0)).toBeNull();
    });

    it('should uppercase city name', () => {
      const location = createLocation('new york');
      expect(location.city).toBe('NEW YORK');
    });

    it('should trim city name', () => {
      const location = createLocation('  London  ');
      expect(location.city).toBe('LONDON');
    });
  });

  // ============================================
  // getLocation Tests
  // ============================================

  describe('getLocation', () => {
    it('should return saved location if valid', async () => {
      const savedLocation = {
        city: 'Paris',
        lat: 48.8566,
        lon: 2.3522,
        country: 'FR',
      };

      const result = await getLocation(savedLocation);

      expect(result.city).toBe('PARIS');
      expect(result.lat).toBe(48.8566);
      expect(result.lon).toBe(2.3522);
      expect(result.isDefault).toBe(false);
    });

    it('should uppercase saved location city', async () => {
      const savedLocation = {
        city: 'tokyo',
        lat: 35.6762,
        lon: 139.6503,
      };

      const result = await getLocation(savedLocation);
      expect(result.city).toBe('TOKYO');
    });

    it('should detect location if no saved location', async () => {
      // Mock fetch to return a location
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          city: 'Berlin',
          lat: 52.52,
          lon: 13.405,
          countryCode: 'DE',
        }),
      });

      const result = await getLocation(null);

      expect(result.city).toBe('BERLIN');
      expect(result.lat).toBe(52.52);
      expect(result.lon).toBe(13.405);
    });

    it('should detect location if saved location is invalid', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          city: 'Madrid',
          lat: 40.4168,
          lon: -3.7038,
          countryCode: 'ES',
        }),
      });

      const invalidLocation = { city: '' }; // Invalid - no coordinates

      const result = await getLocation(invalidLocation);

      expect(result.city).toBe('MADRID');
    });
  });

  // ============================================
  // detectLocation Tests
  // ============================================

  describe('detectLocation', () => {
    it('should return location from API', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          city: 'Amsterdam',
          lat: 52.3676,
          lon: 4.9041,
          countryCode: 'NL',
          regionName: 'North Holland',
          timezone: 'Europe/Amsterdam',
        }),
      });

      const result = await detectLocation();

      expect(result.city).toBe('AMSTERDAM');
      expect(result.lat).toBe(52.3676);
      expect(result.lon).toBe(4.9041);
      expect(result.country).toBe('NL');
      expect(result.isDefault).toBe(false);
    });

    it('should return default location on API failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await detectLocation();

      expect(result).toEqual(DEFAULT_LOCATION);
    });

    it('should return default location on invalid API response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: 'fail',
          message: 'invalid query',
        }),
      });

      const result = await detectLocation();

      expect(result).toEqual(DEFAULT_LOCATION);
    });

    it('should use cached response on subsequent calls', async () => {
      // Pre-populate the cache directly to test cache retrieval
      const cachedData = {
        status: 'success',
        city: 'Rome',
        lat: 41.9028,
        lon: 12.4964,
        countryCode: 'IT',
      };
      
      // Use a large TTL (24 hours in ms) - Infinity doesn't serialize to JSON
      localStorage.setItem(`teletext_cache_${CACHE_KEY}`, JSON.stringify({
        data: cachedData,
        timestamp: Date.now(),
        ttl: 24 * 60 * 60 * 1000,
      }));

      // Mock fetch to track if it's called
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          city: 'Different City',
          lat: 0,
          lon: 0,
        }),
      });

      // Call detectLocation - should use cache, not fetch
      const result = await detectLocation();

      // Should return cached data
      expect(result.city).toBe('ROME');
      expect(result.lat).toBe(41.9028);
      
      // Fetch should NOT have been called because cache was used
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // clearLocationCache Tests
  // ============================================

  describe('clearLocationCache', () => {
    it('should clear cached location', async () => {
      // Set up cache
      localStorage.setItem(`teletext_cache_${CACHE_KEY}`, JSON.stringify({
        data: { status: 'success', city: 'Test' },
        timestamp: Date.now(),
        ttl: Infinity,
      }));

      clearLocationCache();

      expect(localStorage.getItem(`teletext_cache_${CACHE_KEY}`)).toBeNull();
    });

    it('should not throw if cache does not exist', () => {
      expect(() => clearLocationCache()).not.toThrow();
    });
  });

  // ============================================
  // Property-Based Tests
  // ============================================

  describe('Property-Based Tests', () => {
    describe('isValidLocation properties', () => {
      it('should accept any valid coordinates within bounds', () => {
        fc.assert(
          fc.property(
            // Filter out whitespace-only strings since they're invalid city names
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            fc.double({ min: -90, max: 90, noNaN: true }),
            fc.double({ min: -180, max: 180, noNaN: true }),
            (city, lat, lon) => {
              const location = { city, lat, lon };
              return isValidLocation(location) === true;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject coordinates outside latitude bounds', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1 }),
            fc.oneof(
              fc.double({ min: 90.001, max: 1000, noNaN: true }),
              fc.double({ min: -1000, max: -90.001, noNaN: true })
            ),
            fc.double({ min: -180, max: 180, noNaN: true }),
            (city, lat, lon) => {
              const location = { city, lat, lon };
              return isValidLocation(location) === false;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject coordinates outside longitude bounds', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1 }),
            fc.double({ min: -90, max: 90, noNaN: true }),
            fc.oneof(
              fc.double({ min: 180.001, max: 1000, noNaN: true }),
              fc.double({ min: -1000, max: -180.001, noNaN: true })
            ),
            (city, lat, lon) => {
              const location = { city, lat, lon };
              return isValidLocation(location) === false;
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('createLocation properties', () => {
      it('should always uppercase city names', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            (city) => {
              const location = createLocation(city);
              return location !== null && location.city === city.trim().toUpperCase();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should create valid location when given valid coordinates', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            fc.double({ min: -90, max: 90, noNaN: true }),
            fc.double({ min: -180, max: 180, noNaN: true }),
            (city, lat, lon) => {
              const location = createLocation(city, lat, lon);
              return location !== null && isValidLocation(location);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('formatLocation properties', () => {
      it('should always return uppercase string', () => {
        fc.assert(
          fc.property(
            fc.record({
              city: fc.string({ minLength: 1 }),
              country: fc.option(fc.string(), { nil: undefined }),
            }),
            (location) => {
              const result = formatLocation(location);
              return result === result.toUpperCase();
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
