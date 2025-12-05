/**
 * Teletext Reborn - Wikipedia API Service Tests
 * 
 * Tests for Wikipedia On This Day API integration including:
 * - Date validation
 * - Response parsing
 * - Property-based tests
 * 
 * @module services/wikipediaApi.test
 * Requirements: 9.1-9.7
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import {
  getOnThisDay,
  getEvents,
  getBirths,
  getDeaths,
  isBirthday,
  formatEntry,
  getRandomEvent,
  getEventsForYear,
  CACHE_TTL,
  DEFAULT_LIMITS,
  MAX_DESCRIPTION_LENGTH,
  zeroPad,
  truncateText,
  getCacheKey,
  parseEntry,
  parseOnThisDayResponse,
  isValidDate,
} from './wikipediaApi.js';
import { CacheTTL } from './api.js';
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
 * Create mock Wikipedia On This Day API response
 */
function createMockOnThisDayResponse(options = {}) {
  const { 
    eventsCount = 50, 
    birthsCount = 25, 
    deathsCount = 15,
    selectedCount = 3,
    holidaysCount = 2
  } = options;
  return {
    events: Array.from({ length: eventsCount }, (_, i) => ({
      year: 1900 + i * 2,
      text: `Event ${i + 1} description that happened on this day`,
      pages: [{ title: `Event_${i}`, content_urls: { desktop: { page: `https://en.wikipedia.org/wiki/Event_${i}` } } }],
    })),
    births: Array.from({ length: birthsCount }, (_, i) => ({
      year: 1950 + i * 2,
      text: `Birth ${i + 1} - Famous person born on this day`,
      pages: [{ title: `Person_${i}`, description: `Famous person ${i}` }],
    })),
    deaths: Array.from({ length: deathsCount }, (_, i) => ({
      year: 1980 + i * 2,
      text: `Death ${i + 1} - Notable figure who passed on this day`,
      pages: [],
    })),
    selected: Array.from({ length: selectedCount }, (_, i) => ({
      year: 1969 + i,
      text: `Featured event ${i + 1} - A curated historical moment`,
      pages: [{ title: `Featured_${i}`, thumbnail: { source: `https://example.com/img${i}.jpg` } }],
    })),
    holidays: Array.from({ length: holidaysCount }, (_, i) => ({
      text: `Holiday ${i + 1} - A celebration day`,
      pages: [],
    })),
  };
}

// ============================================
// Unit Tests: zeroPad
// ============================================

describe('zeroPad', () => {
  it('should pad single digit numbers with leading zero', () => {
    expect(zeroPad(1)).toBe('01');
    expect(zeroPad(9)).toBe('09');
  });

  it('should not pad double digit numbers', () => {
    expect(zeroPad(10)).toBe('10');
    expect(zeroPad(12)).toBe('12');
    expect(zeroPad(31)).toBe('31');
  });
});


// ============================================
// Unit Tests: isValidDate
// ============================================

describe('isValidDate', () => {
  it('should return true for valid dates', () => {
    expect(isValidDate(1, 1)).toBe(true);
    expect(isValidDate(6, 15)).toBe(true);
    expect(isValidDate(12, 31)).toBe(true);
  });

  it('should return false for invalid months', () => {
    expect(isValidDate(0, 15)).toBe(false);
    expect(isValidDate(13, 15)).toBe(false);
    expect(isValidDate(-1, 15)).toBe(false);
  });

  it('should return false for invalid days', () => {
    expect(isValidDate(1, 0)).toBe(false);
    expect(isValidDate(1, 32)).toBe(false);
    expect(isValidDate(6, -1)).toBe(false);
  });

  it('should return false for invalid month/day combinations', () => {
    expect(isValidDate(2, 30)).toBe(false);
    expect(isValidDate(2, 31)).toBe(false);
    expect(isValidDate(4, 31)).toBe(false);
    expect(isValidDate(6, 31)).toBe(false);
    expect(isValidDate(9, 31)).toBe(false);
    expect(isValidDate(11, 31)).toBe(false);
  });

  it('should allow Feb 29 (leap year consideration)', () => {
    expect(isValidDate(2, 29)).toBe(true);
  });

  it('should return false for non-number inputs', () => {
    expect(isValidDate('1', 15)).toBe(false);
    expect(isValidDate(1, '15')).toBe(false);
    expect(isValidDate(null, 15)).toBe(false);
    expect(isValidDate(1, undefined)).toBe(false);
  });
});

// ============================================
// Unit Tests: truncateText
// ============================================

describe('truncateText', () => {
  it('should return text unchanged if under max length', () => {
    const text = 'Short text';
    expect(truncateText(text)).toBe(text);
  });

  it('should truncate text over max length with ellipsis', () => {
    const longText = 'A'.repeat(100);
    const result = truncateText(longText);
    expect(result.length).toBe(MAX_DESCRIPTION_LENGTH);
    expect(result.endsWith('…')).toBe(true);
  });

  it('should handle empty string', () => {
    expect(truncateText('')).toBe('');
  });

  it('should handle null/undefined', () => {
    expect(truncateText(null)).toBe('');
    expect(truncateText(undefined)).toBe('');
  });

  it('should respect custom max length', () => {
    const text = 'Hello World';
    expect(truncateText(text, 5)).toBe('Hell…');
  });
});

// ============================================
// Unit Tests: getCacheKey
// ============================================

describe('getCacheKey', () => {
  it('should generate consistent cache keys', () => {
    expect(getCacheKey(7, 20)).toBe('wikipedia_onthisday_7_20');
    expect(getCacheKey(12, 4)).toBe('wikipedia_onthisday_12_4');
  });
});

// ============================================
// Unit Tests: parseEntry
// ============================================

describe('parseEntry', () => {
  it('should parse event entry correctly', () => {
    const entry = { year: 1969, text: 'Moon landing' };
    const result = parseEntry(entry, 'event');
    expect(result).toEqual({
      year: 1969,
      description: 'Moon landing',
      type: 'event',
      fullDescription: 'Moon landing',
      wikipediaUrl: null,
      thumbnailUrl: null,
      pageTitle: null,
      pageDescription: null,
      relatedPages: [],
    });
  });

  it('should truncate long descriptions', () => {
    const longText = 'A'.repeat(100);
    const entry = { year: 2000, text: longText };
    const result = parseEntry(entry, 'birth');
    expect(result.description.length).toBe(MAX_DESCRIPTION_LENGTH);
    expect(result.fullDescription).toBe(longText);
  });
});

// ============================================
// Unit Tests: parseOnThisDayResponse
// ============================================

describe('parseOnThisDayResponse', () => {
  it('should parse API response with default limits', () => {
    // Create mock with more data than limits to test truncation
    const mockData = createMockOnThisDayResponse({ eventsCount: 60, birthsCount: 30, deathsCount: 20 });
    const result = parseOnThisDayResponse(mockData);
    
    // Should be capped at default limits
    expect(result.events.length).toBe(DEFAULT_LIMITS.events);
    expect(result.births.length).toBe(DEFAULT_LIMITS.births);
    expect(result.deaths.length).toBe(DEFAULT_LIMITS.deaths);
    // Totals should reflect original data size
    expect(result.totalEvents).toBe(60);
    expect(result.totalBirths).toBe(30);
    expect(result.totalDeaths).toBe(20);
  });

  it('should respect custom limits', () => {
    const mockData = createMockOnThisDayResponse({ eventsCount: 20, birthsCount: 10, deathsCount: 5 });
    const result = parseOnThisDayResponse(mockData, { events: 5, births: 2, deaths: 1 });
    
    expect(result.events.length).toBe(5);
    expect(result.births.length).toBe(2);
    expect(result.deaths.length).toBe(1);
  });

  it('should handle empty arrays', () => {
    const result = parseOnThisDayResponse({});
    expect(result.events).toEqual([]);
    expect(result.births).toEqual([]);
    expect(result.deaths).toEqual([]);
  });
});


// ============================================
// Unit Tests: isBirthday
// ============================================

describe('isBirthday', () => {
  it('should return true when date matches birthday', () => {
    expect(isBirthday(7, 20, { month: 7, day: 20 })).toBe(true);
  });

  it('should return false when date does not match', () => {
    expect(isBirthday(7, 20, { month: 7, day: 21 })).toBe(false);
    expect(isBirthday(7, 20, { month: 8, day: 20 })).toBe(false);
  });

  it('should return false for null/undefined birthday', () => {
    expect(isBirthday(7, 20, null)).toBe(false);
    expect(isBirthday(7, 20, undefined)).toBe(false);
  });

  it('should return false for invalid birthday object', () => {
    expect(isBirthday(7, 20, 'not an object')).toBe(false);
    expect(isBirthday(7, 20, 123)).toBe(false);
  });
});

// ============================================
// Unit Tests: formatEntry
// ============================================

describe('formatEntry', () => {
  it('should format entry with year and description', () => {
    const entry = { year: 1969, description: 'Moon landing' };
    expect(formatEntry(entry)).toBe('1969: Moon landing');
  });

  it('should handle missing description', () => {
    const entry = { year: 2000 };
    expect(formatEntry(entry)).toBe('2000: UNKNOWN EVENT');
  });

  it('should return empty string for invalid entry', () => {
    expect(formatEntry(null)).toBe('');
    expect(formatEntry({})).toBe('');
    expect(formatEntry({ year: 'not a number' })).toBe('');
  });
});

// ============================================
// Unit Tests: Constants
// ============================================

describe('Constants', () => {
  it('should have correct cache TTL (24 hours)', () => {
    expect(CACHE_TTL).toBe(CacheTTL.ONE_DAY);
  });

  it('should have correct default limits (enhanced for richer content)', () => {
    // Enhanced limits for better UX - more content to browse
    expect(DEFAULT_LIMITS.events).toBe(50);
    expect(DEFAULT_LIMITS.births).toBe(25);
    expect(DEFAULT_LIMITS.deaths).toBe(15);
    expect(DEFAULT_LIMITS.selected).toBe(5);
    expect(DEFAULT_LIMITS.holidays).toBe(10);
  });

  it('should have correct max description length (2 lines at 40 chars)', () => {
    expect(MAX_DESCRIPTION_LENGTH).toBe(80);
  });
});

// ============================================
// Integration Tests: getOnThisDay
// ============================================

describe('getOnThisDay', () => {
  it('should fetch and parse On This Day data', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(createMockOnThisDayResponse()));

    const result = await getOnThisDay(7, 20);

    expect(result.month).toBe(7);
    expect(result.day).toBe(20);
    expect(result.events.length).toBe(DEFAULT_LIMITS.events);
    expect(result.births.length).toBe(DEFAULT_LIMITS.births);
    expect(result.deaths.length).toBe(DEFAULT_LIMITS.deaths);
  });

  it('should throw error for invalid date', async () => {
    await expect(getOnThisDay(0, 15)).rejects.toThrow('INVALID DATE');
    await expect(getOnThisDay(13, 15)).rejects.toThrow('INVALID DATE');
    await expect(getOnThisDay(2, 30)).rejects.toThrow('INVALID DATE');
  });

  it('should use zero-padded month and day in URL', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(createMockOnThisDayResponse()));

    await getOnThisDay(7, 4);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/all/07/04'),
      expect.any(Object)
    );
  });

  it('should use cached data when available', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(createMockOnThisDayResponse()));

    // First call - should fetch
    await getOnThisDay(7, 20);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call - should use cache
    const result = await getOnThisDay(7, 20);
    expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1
    expect(result.events.length).toBe(DEFAULT_LIMITS.events);
  });

  it('should respect custom limits', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(createMockOnThisDayResponse({ eventsCount: 20 })));

    const result = await getOnThisDay(7, 20, { eventsLimit: 5 });

    expect(result.events.length).toBe(5);
  });
});


// ============================================
// Integration Tests: getEvents, getBirths, getDeaths
// ============================================

describe('getEvents', () => {
  it('should fetch only events', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(createMockOnThisDayResponse()));

    const events = await getEvents(7, 20);

    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBe(DEFAULT_LIMITS.events);
    expect(events[0].type).toBe('event');
  });
});

describe('getBirths', () => {
  it('should fetch only births', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(createMockOnThisDayResponse()));

    const births = await getBirths(7, 20);

    expect(Array.isArray(births)).toBe(true);
    expect(births.length).toBe(DEFAULT_LIMITS.births);
    expect(births[0].type).toBe('birth');
  });
});

describe('getDeaths', () => {
  it('should fetch only deaths', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(createMockOnThisDayResponse()));

    const deaths = await getDeaths(7, 20);

    expect(Array.isArray(deaths)).toBe(true);
    expect(deaths.length).toBe(DEFAULT_LIMITS.deaths);
    expect(deaths[0].type).toBe('death');
  });
});

// ============================================
// Integration Tests: getRandomEvent
// ============================================

describe('getRandomEvent', () => {
  it('should return a random event', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(createMockOnThisDayResponse()));

    const event = await getRandomEvent(7, 20);

    expect(event).not.toBeNull();
    expect(event.type).toBe('event');
    expect(typeof event.year).toBe('number');
  });

  it('should return null on error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const event = await getRandomEvent(7, 20);

    expect(event).toBeNull();
  });

  it('should return null for empty events', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({ events: [], births: [], deaths: [] }));

    const event = await getRandomEvent(7, 20);

    expect(event).toBeNull();
  });
});

// ============================================
// Integration Tests: getEventsForYear
// ============================================

describe('getEventsForYear', () => {
  it('should filter events by year', async () => {
    const mockData = {
      events: [
        { year: 1969, text: 'Moon landing' },
        { year: 1969, text: 'Another 1969 event' },
        { year: 2000, text: 'Y2K event' },
      ],
      births: [],
      deaths: [],
    };
    mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

    const events = await getEventsForYear(7, 20, 1969);

    expect(events.length).toBe(2);
    expect(events.every(e => e.year === 1969)).toBe(true);
  });

  it('should return empty array if no events for year', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(createMockOnThisDayResponse()));

    const events = await getEventsForYear(7, 20, 1800);

    expect(events).toEqual([]);
  });
});

// ============================================
// Property-Based Tests
// ============================================

describe('Property-Based Tests', () => {
  it('zeroPad should always return 2-character string for valid inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 31 }),
        (num) => {
          const result = zeroPad(num);
          return result.length === 2 && !isNaN(parseInt(result, 10));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('isValidDate should accept all valid month/day combinations', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 28 }), // 28 is safe for all months
        (month, day) => {
          return isValidDate(month, day) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('truncateText should never exceed max length', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        fc.integer({ min: 10, max: 100 }),
        (text, maxLen) => {
          const result = truncateText(text, maxLen);
          return result.length <= maxLen;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('parseEntry should preserve year and add type', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 2100 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.constantFrom('event', 'birth', 'death'),
        (year, text, type) => {
          const entry = { year, text };
          const result = parseEntry(entry, type);
          return result.year === year && result.type === type;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getCacheKey should be deterministic', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 31 }),
        (month, day) => {
          const key1 = getCacheKey(month, day);
          const key2 = getCacheKey(month, day);
          return key1 === key2;
        }
      ),
      { numRuns: 50 }
    );
  });
});
