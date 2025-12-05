/**
 * Teletext Reborn - Weather API Service Tests
 * 
 * Tests for weather API integration including:
 * - Current weather fetching
 * - Historical weather fetching
 * - Property-based tests for historical weather range
 * 
 * @module services/weatherApi.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import {
  getCurrentWeather,
  getHistoricalWeather,
  isHistoricalDataAvailable,
  weatherCodeToCondition,
  convertTemperature,
  formatTemperature,
  getTemperatureComparison,
  getCacheKey,
  parseCurrentWeather,
  parseHistoricalWeather,
  formatDateISO,
} from './weatherApi.js';
import { MIN_YEAR } from '../utils/date.js';
import { resetStateManager } from '../state.js';

// ============================================
// Test Setup
// ============================================

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  // Reset state manager and clear localStorage
  resetStateManager();
  localStorage.clear();
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================
// Helper Functions
// ============================================

/**
 * Create a mock successful API response
 */
function createMockResponse(data, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
  });
}

/**
 * Create mock current weather API response
 */
function createMockCurrentWeatherResponse() {
  return {
    current: {
      temperature_2m: 15.5,
      weather_code: 2,
      relative_humidity_2m: 65,
      wind_speed_10m: 12.3,
    },
    daily: {
      time: ['2025-12-03', '2025-12-04', '2025-12-05', '2025-12-06', '2025-12-07'],
      temperature_2m_max: [18, 17, 19, 16, 15],
      temperature_2m_min: [10, 9, 11, 8, 7],
      weather_code: [2, 3, 0, 61, 3],
    },
  };
}

/**
 * Create mock historical weather API response
 */
function createMockHistoricalWeatherResponse() {
  return {
    daily: {
      time: ['1969-07-20'],
      temperature_2m_max: [22],
      temperature_2m_min: [14],
      precipitation_sum: [0],
      weather_code: [0],
    },
  };
}

// ============================================
// Unit Tests: Weather Code Conversion
// ============================================

describe('weatherCodeToCondition', () => {
  it('should return correct condition for known weather codes', () => {
    expect(weatherCodeToCondition(0)).toEqual({ condition: 'CLEAR SKY', icon: 'sunny' });
    expect(weatherCodeToCondition(2)).toEqual({ condition: 'PARTLY CLOUDY', icon: 'partlyCloudy' });
    expect(weatherCodeToCondition(45)).toEqual({ condition: 'FOG', icon: 'foggy' });
    expect(weatherCodeToCondition(63)).toEqual({ condition: 'MODERATE RAIN', icon: 'rainy' });
    expect(weatherCodeToCondition(73)).toEqual({ condition: 'MODERATE SNOW', icon: 'snowy' });
    expect(weatherCodeToCondition(95)).toEqual({ condition: 'THUNDERSTORM', icon: 'stormy' });
  });

  it('should return default for unknown weather codes', () => {
    expect(weatherCodeToCondition(999)).toEqual({ condition: 'UNKNOWN', icon: 'cloudy' });
    expect(weatherCodeToCondition(-1)).toEqual({ condition: 'UNKNOWN', icon: 'cloudy' });
  });
});

// ============================================
// Unit Tests: Temperature Conversion
// ============================================

describe('convertTemperature', () => {
  it('should return same value for celsius', () => {
    expect(convertTemperature(20, 'celsius')).toBe(20);
    expect(convertTemperature(0, 'celsius')).toBe(0);
    expect(convertTemperature(-10, 'celsius')).toBe(-10);
  });

  it('should convert to fahrenheit correctly', () => {
    expect(convertTemperature(0, 'fahrenheit')).toBe(32);
    expect(convertTemperature(100, 'fahrenheit')).toBe(212);
    expect(convertTemperature(-40, 'fahrenheit')).toBe(-40); // Same in both scales
  });

  it('should round to nearest integer', () => {
    expect(convertTemperature(20.6, 'celsius')).toBe(21);
    expect(convertTemperature(20.4, 'celsius')).toBe(20);
  });
});

describe('formatTemperature', () => {
  it('should format with celsius symbol', () => {
    expect(formatTemperature(15, 'celsius')).toBe('15°C');
    expect(formatTemperature(-5, 'celsius')).toBe('-5°C');
  });

  it('should format with fahrenheit symbol', () => {
    expect(formatTemperature(59, 'fahrenheit')).toBe('59°F');
    expect(formatTemperature(32, 'fahrenheit')).toBe('32°F');
  });

  it('should default to celsius', () => {
    expect(formatTemperature(20)).toBe('20°C');
  });
});

// ============================================
// Unit Tests: Temperature Comparison
// ============================================

describe('getTemperatureComparison', () => {
  it('should return warmer message when above average', () => {
    expect(getTemperatureComparison(25, 20, 'celsius')).toBe('5°C WARMER THAN USUAL');
    expect(getTemperatureComparison(80, 70, 'fahrenheit')).toBe('10°F WARMER THAN USUAL');
  });

  it('should return cooler message when below average', () => {
    expect(getTemperatureComparison(15, 20, 'celsius')).toBe('5°C COOLER THAN USUAL');
    expect(getTemperatureComparison(60, 70, 'fahrenheit')).toBe('10°F COOLER THAN USUAL');
  });

  it('should return average message when equal', () => {
    expect(getTemperatureComparison(20, 20)).toBe('AVERAGE FOR THIS DATE');
  });

  it('should return empty string for invalid inputs', () => {
    expect(getTemperatureComparison(NaN, 20)).toBe('');
    expect(getTemperatureComparison(20, NaN)).toBe('');
    expect(getTemperatureComparison('20', 20)).toBe('');
  });
});

// ============================================
// Unit Tests: Cache Key Generation
// ============================================

describe('getCacheKey', () => {
  it('should generate correct key for current weather', () => {
    const key = getCacheKey('current', 51.5074, -0.1278);
    expect(key).toBe('weather_current_51.51_-0.13');
  });

  it('should generate correct key for historical weather', () => {
    const key = getCacheKey('historical', 51.5074, -0.1278, '1969-07-20');
    expect(key).toBe('weather_historical_51.51_-0.13_1969-07-20');
  });

  it('should round coordinates to 2 decimal places', () => {
    const key = getCacheKey('current', 51.50739, -0.12775);
    expect(key).toBe('weather_current_51.51_-0.13');
  });
});

// ============================================
// Unit Tests: Date Formatting
// ============================================

describe('formatDateISO', () => {
  it('should format date as YYYY-MM-DD', () => {
    expect(formatDateISO(new Date(2025, 11, 3))).toBe('2025-12-03');
    expect(formatDateISO(new Date(1969, 6, 20))).toBe('1969-07-20');
    expect(formatDateISO(new Date(2000, 0, 1))).toBe('2000-01-01');
  });

  it('should pad single digit months and days', () => {
    expect(formatDateISO(new Date(2025, 0, 5))).toBe('2025-01-05');
    expect(formatDateISO(new Date(2025, 8, 9))).toBe('2025-09-09');
  });
});

// ============================================
// Unit Tests: Historical Data Availability
// ============================================

describe('isHistoricalDataAvailable', () => {
  it('should return true for dates from 1940 onwards', () => {
    expect(isHistoricalDataAvailable(new Date(1940, 0, 1))).toBe(true);
    expect(isHistoricalDataAvailable(new Date(1969, 6, 20))).toBe(true);
    expect(isHistoricalDataAvailable(new Date(2000, 0, 1))).toBe(true);
  });

  it('should return false for dates before 1940', () => {
    expect(isHistoricalDataAvailable(new Date(1939, 11, 31))).toBe(false);
    expect(isHistoricalDataAvailable(new Date(1900, 0, 1))).toBe(false);
  });

  it('should return false for future dates', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    expect(isHistoricalDataAvailable(futureDate)).toBe(false);
  });

  it('should return false for invalid dates', () => {
    expect(isHistoricalDataAvailable(null)).toBe(false);
    expect(isHistoricalDataAvailable(undefined)).toBe(false);
    expect(isHistoricalDataAvailable(new Date('invalid'))).toBe(false);
  });
});

// ============================================
// Unit Tests: Response Parsing
// ============================================

describe('parseCurrentWeather', () => {
  it('should parse current weather response correctly', () => {
    const mockData = createMockCurrentWeatherResponse();
    const result = parseCurrentWeather(mockData, 'London');

    expect(result.location).toBe('London');
    expect(result.current.temperature).toBe(15.5);
    expect(result.current.condition).toBe('PARTLY CLOUDY');
    expect(result.current.icon).toBe('partlyCloudy');
    expect(result.current.humidity).toBe(65);
    expect(result.current.windSpeed).toBe(12.3);
    expect(result.forecast).toHaveLength(5);
  });

  it('should handle missing data gracefully', () => {
    const result = parseCurrentWeather({}, 'London');

    expect(result.location).toBe('London');
    expect(result.current.temperature).toBeNull();
    expect(result.forecast).toEqual([]);
  });
});

describe('parseHistoricalWeather', () => {
  it('should parse historical weather response correctly', () => {
    const mockData = createMockHistoricalWeatherResponse();
    const result = parseHistoricalWeather(mockData, 'London', '1969-07-20');

    expect(result.location).toBe('London');
    expect(result.date).toBe('1969-07-20');
    expect(result.high).toBe(22);
    expect(result.low).toBe(14);
    expect(result.precipitation).toBe(0);
    expect(result.condition).toBe('CLEAR SKY');
    expect(result.icon).toBe('sunny');
  });

  it('should handle missing data gracefully', () => {
    const result = parseHistoricalWeather({}, 'London', '1969-07-20');

    expect(result.location).toBe('London');
    expect(result.date).toBe('1969-07-20');
    expect(result.high).toBeNull();
    expect(result.low).toBeNull();
  });
});

// ============================================
// Integration Tests: getCurrentWeather
// ============================================

describe('getCurrentWeather', () => {
  it('should fetch and parse current weather', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(createMockCurrentWeatherResponse()));

    const result = await getCurrentWeather(51.5074, -0.1278, 'London');

    expect(result.location).toBe('London');
    expect(result.current.temperature).toBe(15.5);
    expect(result.current.condition).toBe('PARTLY CLOUDY');
    expect(result.forecast).toHaveLength(5);
  });

  it('should throw error for invalid coordinates', async () => {
    await expect(getCurrentWeather(NaN, -0.1278)).rejects.toThrow('INVALID COORDINATES');
    await expect(getCurrentWeather(91, -0.1278)).rejects.toThrow('INVALID COORDINATES');
    await expect(getCurrentWeather(51.5074, 181)).rejects.toThrow('INVALID COORDINATES');
  });

  it('should use cached data when available', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(createMockCurrentWeatherResponse()));

    // First call - should fetch
    await getCurrentWeather(51.5074, -0.1278, 'London');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call - should use cache
    const result = await getCurrentWeather(51.5074, -0.1278, 'London');
    expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1
    expect(result.current.temperature).toBe(15.5);
  });
});

// ============================================
// Integration Tests: getHistoricalWeather
// ============================================

describe('getHistoricalWeather', () => {
  it('should fetch and parse historical weather', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(createMockHistoricalWeatherResponse()));

    const result = await getHistoricalWeather(51.5074, -0.1278, new Date(1969, 6, 20), 'London');

    expect(result.location).toBe('London');
    expect(result.date).toBe('1969-07-20');
    expect(result.high).toBe(22);
    expect(result.low).toBe(14);
    expect(result.condition).toBe('CLEAR SKY');
  });

  it('should return error object for dates before 1940', async () => {
    const result = await getHistoricalWeather(51.5074, -0.1278, new Date(1939, 0, 1), 'London');

    expect(result.error).toBe(true);
    expect(result.message).toContain('1940');
  });

  it('should throw error for invalid coordinates', async () => {
    await expect(getHistoricalWeather(NaN, -0.1278, new Date(1969, 6, 20))).rejects.toThrow('INVALID COORDINATES');
  });

  it('should throw error for invalid date', async () => {
    await expect(getHistoricalWeather(51.5074, -0.1278, null)).rejects.toThrow('INVALID DATE');
    await expect(getHistoricalWeather(51.5074, -0.1278, new Date('invalid'))).rejects.toThrow('INVALID DATE');
  });

  it('should throw error for future dates', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    await expect(getHistoricalWeather(51.5074, -0.1278, futureDate)).rejects.toThrow('1940 TO YESTERDAY');
  });
});

// ============================================
// Property-Based Tests
// ============================================

describe('Property-Based Tests', () => {
  /**
   * **Feature: teletext-reborn, Property 6: Historical Weather Data Range**
   * 
   * *For any* date after 1940-01-01, the historical weather API SHALL return valid data
   * 
   * **Validates: Requirements 10.1, 10.3**
   */
  describe('Property 6: Historical Weather Data Range', () => {
    // Arbitrary for valid historical dates (1940 to yesterday)
    const validHistoricalDateArb = fc.date({
      min: new Date(MIN_YEAR, 0, 1),
      max: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    });

    // Arbitrary for valid coordinates
    const validCoordsArb = fc.record({
      lat: fc.double({ min: -90, max: 90, noNaN: true }),
      lon: fc.double({ min: -180, max: 180, noNaN: true }),
    });

    it('should return valid data for any date from 1940 to yesterday', async () => {
      // Filter out invalid dates (NaN) that fc.date() might generate
      const safeHistoricalDateArb = validHistoricalDateArb.filter(d => d instanceof Date && !isNaN(d.getTime()));
      
      await fc.assert(
        fc.asyncProperty(safeHistoricalDateArb, validCoordsArb, async (date, coords) => {
          // Mock the API response
          mockFetch.mockResolvedValueOnce(createMockResponse({
            daily: {
              time: [formatDateISO(date)],
              temperature_2m_max: [20],
              temperature_2m_min: [10],
              precipitation_sum: [0],
              weather_code: [0],
            },
          }));

          const result = await getHistoricalWeather(coords.lat, coords.lon, date, 'Test');

          // Should not have error flag
          expect(result.error).toBeUndefined();
          // Should have valid temperature data
          expect(typeof result.high).toBe('number');
          expect(typeof result.low).toBe('number');
          // Should have valid condition
          expect(typeof result.condition).toBe('string');
          expect(result.condition.length).toBeGreaterThan(0);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should return error for any date before 1940', async () => {
      const pre1940DateArb = fc.date({
        min: new Date(1800, 0, 1),
        max: new Date(1939, 11, 31),
      }).filter(d => !isNaN(d.getTime())); // Filter out invalid dates

      await fc.assert(
        fc.asyncProperty(pre1940DateArb, validCoordsArb, async (date, coords) => {
          const result = await getHistoricalWeather(coords.lat, coords.lon, date, 'Test');

          // Should have error flag
          expect(result.error).toBe(true);
          // Should have message about 1940
          expect(result.message).toContain('1940');

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('isHistoricalDataAvailable should return true for dates from 1940 to yesterday', () => {
      // Filter out invalid dates that fc.date() might generate
      const validDateArb = validHistoricalDateArb.filter(d => !isNaN(d.getTime()));
      
      fc.assert(
        fc.property(validDateArb, (date) => {
          return isHistoricalDataAvailable(date) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('isHistoricalDataAvailable should return false for dates before 1940', () => {
      const pre1940DateArb = fc.date({
        min: new Date(1800, 0, 1),
        max: new Date(1939, 11, 31),
      });

      fc.assert(
        fc.property(pre1940DateArb, (date) => {
          return isHistoricalDataAvailable(date) === false;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Temperature conversion round-trip
   * Converting to fahrenheit and back should preserve the value (within rounding)
   */
  describe('Temperature Conversion Properties', () => {
    it('should preserve temperature within rounding error', () => {
      fc.assert(
        fc.property(fc.integer({ min: -50, max: 50 }), (celsius) => {
          const fahrenheit = convertTemperature(celsius, 'fahrenheit');
          const backToCelsius = Math.round((fahrenheit - 32) * 5/9);
          // Allow for rounding differences
          return Math.abs(backToCelsius - celsius) <= 1;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Weather codes should always return valid condition
   */
  describe('Weather Code Properties', () => {
    it('should always return a valid condition object for any integer', () => {
      fc.assert(
        fc.property(fc.integer(), (code) => {
          const result = weatherCodeToCondition(code);
          return (
            typeof result.condition === 'string' &&
            result.condition.length > 0 &&
            typeof result.icon === 'string' &&
            result.icon.length > 0
          );
        }),
        { numRuns: 100 }
      );
    });
  });
});
