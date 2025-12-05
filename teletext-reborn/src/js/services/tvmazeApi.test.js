/**
 * Teletext Reborn - TVmaze API Service Tests
 * 
 * Property-based tests for TV schedule functions.
 * 
 * @module services/tvmazeApi.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import {
  parseSchedule,
  getGenreIcon,
  formatShowForDisplay,
  formatShowsForDisplay,
  isShowCurrentlyAiring,
  filterShowsByTimeRange,
  getPrimeTimeShows,
  groupShowsByHour,
  getHighlights,
  isCacheFresh,
  getCacheAge,
  clearScheduleCache,
  CACHE_TTL,
  getCacheKey
} from './tvmazeApi.js';

// ============================================
// Test Helpers
// ============================================

/**
 * Generate a valid time string (HH:MM)
 */
const timeArbitrary = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 })
).map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);

/**
 * Generate a mock TVmaze API show item
 */
const showItemArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 99999 }),
  airtime: timeArbitrary,
  runtime: fc.integer({ min: 15, max: 180 }),
  show: fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    network: fc.option(fc.record({ name: fc.string({ minLength: 1, maxLength: 20 }) })),
    genres: fc.array(fc.constantFrom('Drama', 'Comedy', 'Action', 'Sports', 'News', 'Documentary', 'Thriller'), { minLength: 0, maxLength: 3 }),
    summary: fc.option(fc.string({ maxLength: 200 }))
  })
});


describe('TVmaze API Service', () => {
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });
  
  afterEach(() => {
    localStorage.clear();
  });

  // ============================================
  // Property 4: TV Schedule Time Ordering
  // **Feature: teletext-classic-features, Property 4: TV Schedule Time Ordering**
  // **Validates: Requirements 25.3**
  // ============================================
  
  describe('parseSchedule - Time Ordering', () => {
    it('should sort shows by airtime in ascending order for any input', () => {
      fc.assert(
        fc.property(
          fc.array(showItemArbitrary, { minLength: 0, maxLength: 20 }),
          (rawShows) => {
            const parsed = parseSchedule(rawShows);
            
            // Verify shows are sorted by airtime
            for (let i = 1; i < parsed.length; i++) {
              const prevTime = parsed[i - 1].airtime;
              const currTime = parsed[i].airtime;
              expect(currTime >= prevTime).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should preserve all shows from input', () => {
      fc.assert(
        fc.property(
          fc.array(showItemArbitrary, { minLength: 0, maxLength: 20 }),
          (rawShows) => {
            const parsed = parseSchedule(rawShows);
            
            // Same number of shows
            expect(parsed.length).toBe(rawShows.length);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
    
    it('should handle empty array', () => {
      expect(parseSchedule([])).toEqual([]);
    });
    
    it('should handle non-array input', () => {
      expect(parseSchedule(null)).toEqual([]);
      expect(parseSchedule(undefined)).toEqual([]);
      expect(parseSchedule('invalid')).toEqual([]);
    });
  });


  // ============================================
  // Property 5: Cache TTL Compliance
  // **Feature: teletext-classic-features, Property 5: Cache TTL Compliance**
  // **Validates: Requirements 32.3**
  // ============================================
  
  describe('Cache TTL Compliance', () => {
    it('should return cached data when cache age is less than TTL', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2, maxLength: 10 }),  // country
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),  // date
          fc.array(showItemArbitrary, { minLength: 1, maxLength: 5 }),  // shows
          (country, date, shows) => {
            const dateStr = date.toISOString().split('T')[0];
            const cacheKey = getCacheKey(country, dateStr);
            const fullCacheKey = `teletext_cache_${cacheKey}`;
            
            // Create cache entry with fresh timestamp
            const cacheData = {
              date: dateStr,
              country,
              shows: parseSchedule(shows),
              lastUpdated: new Date().toISOString(),
              _cached: false,
              _stale: false
            };
            
            localStorage.setItem(fullCacheKey, JSON.stringify({
              data: cacheData,
              timestamp: Date.now(),
              ttl: CACHE_TTL
            }));
            
            // Cache should be fresh
            expect(isCacheFresh(cacheKey)).toBe(true);
            
            // Cache age should be less than TTL
            const age = getCacheAge(cacheKey);
            expect(age).not.toBeNull();
            expect(age).toBeLessThan(CACHE_TTL);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
    
    it('should report cache as stale when age exceeds TTL', () => {
      const cacheKey = getCacheKey('US', '2025-01-01');
      const fullCacheKey = `teletext_cache_${cacheKey}`;
      
      // Create cache entry with old timestamp (expired)
      localStorage.setItem(fullCacheKey, JSON.stringify({
        data: { shows: [] },
        timestamp: Date.now() - CACHE_TTL - 1000,  // Expired by 1 second
        ttl: CACHE_TTL
      }));
      
      // Cache should not be fresh
      expect(isCacheFresh(cacheKey)).toBe(false);
    });
    
    it('should have correct TTL value of 15 minutes', () => {
      expect(CACHE_TTL).toBe(15 * 60 * 1000);
    });
  });


  // ============================================
  // Unit Tests for getGenreIcon
  // ============================================
  
  describe('getGenreIcon', () => {
    it('should return film icon for drama/thriller/comedy genres', () => {
      expect(getGenreIcon(['Drama'])).toBe('[F]');
      expect(getGenreIcon(['Thriller'])).toBe('[F]');
      expect(getGenreIcon(['Comedy'])).toBe('[F]');
      expect(getGenreIcon(['Action'])).toBe('[F]');
      expect(getGenreIcon(['Horror'])).toBe('[F]');
      expect(getGenreIcon(['Romance'])).toBe('[F]');
    });
    
    it('should return sports icon for sports genres', () => {
      expect(getGenreIcon(['Sports'])).toBe('[S]');
    });
    
    it('should return news icon for news/documentary genres', () => {
      expect(getGenreIcon(['News'])).toBe('[N]');
      expect(getGenreIcon(['Documentary'])).toBe('[N]');
    });
    
    it('should return empty string for empty or unknown genres', () => {
      expect(getGenreIcon([])).toBe('');
      expect(getGenreIcon(['Reality'])).toBe('');
      expect(getGenreIcon(null)).toBe('');
      expect(getGenreIcon(undefined)).toBe('');
    });
    
    it('should be case-insensitive', () => {
      expect(getGenreIcon(['DRAMA'])).toBe('[F]');
      expect(getGenreIcon(['sports'])).toBe('[S]');
      expect(getGenreIcon(['NEWS'])).toBe('[N]');
    });
  });

  // ============================================
  // Unit Tests for formatShowForDisplay
  // ============================================
  
  describe('formatShowForDisplay', () => {
    it('should truncate long titles', () => {
      const show = {
        name: 'This Is A Very Long Show Title That Exceeds The Limit',
        channel: 'CBS',
        airtime: '20:00',
        runtime: 60,
        genres: ['Drama']
      };
      
      const formatted = formatShowForDisplay(show);
      expect(formatted.title.length).toBeLessThanOrEqual(22);
      expect(formatted.title.endsWith('…')).toBe(true);
    });
    
    it('should truncate long channel names', () => {
      const show = {
        name: 'Test Show',
        channel: 'Very Long Network Name',
        airtime: '20:00',
        runtime: 60,
        genres: []
      };
      
      const formatted = formatShowForDisplay(show);
      expect(formatted.channel.length).toBeLessThanOrEqual(6);
    });
    
    it('should handle null/undefined show', () => {
      const formatted = formatShowForDisplay(null);
      expect(formatted.time).toBe('00:00');
      expect(formatted.channel).toBe('N/A');
      expect(formatted.title).toBe('Unknown');
    });
    
    it('should include genre icon', () => {
      const show = {
        name: 'Drama Show',
        channel: 'CBS',
        airtime: '20:00',
        runtime: 60,
        genres: ['Drama']
      };
      
      const formatted = formatShowForDisplay(show);
      expect(formatted.genreIcon).toBe('[F]');
    });
  });


  // ============================================
  // Unit Tests for filterShowsByTimeRange
  // ============================================
  
  describe('filterShowsByTimeRange', () => {
    const testShows = [
      { name: 'Morning Show', airtime: '08:00', runtime: 60, genres: [] },
      { name: 'Noon Show', airtime: '12:00', runtime: 60, genres: [] },
      { name: 'Evening Show', airtime: '19:00', runtime: 60, genres: [] },
      { name: 'Night Show', airtime: '22:00', runtime: 60, genres: [] }
    ];
    
    it('should filter shows within time range', () => {
      const filtered = filterShowsByTimeRange(testShows, '10:00', '20:00');
      expect(filtered).toHaveLength(2);
      expect(filtered[0].name).toBe('Noon Show');
      expect(filtered[1].name).toBe('Evening Show');
    });
    
    it('should return empty array for non-array input', () => {
      expect(filterShowsByTimeRange(null, '10:00', '20:00')).toEqual([]);
    });
  });

  // ============================================
  // Unit Tests for getPrimeTimeShows
  // ============================================
  
  describe('getPrimeTimeShows', () => {
    it('should return shows between 19:00 and 23:00', () => {
      const shows = [
        { name: 'Early Show', airtime: '18:00', runtime: 60, genres: [] },
        { name: 'Prime Show 1', airtime: '19:30', runtime: 60, genres: [] },
        { name: 'Prime Show 2', airtime: '21:00', runtime: 60, genres: [] },
        { name: 'Late Show', airtime: '23:30', runtime: 60, genres: [] }
      ];
      
      const primeTime = getPrimeTimeShows(shows);
      expect(primeTime).toHaveLength(2);
      expect(primeTime[0].name).toBe('Prime Show 1');
      expect(primeTime[1].name).toBe('Prime Show 2');
    });
  });

  // ============================================
  // Unit Tests for groupShowsByHour
  // ============================================
  
  describe('groupShowsByHour', () => {
    it('should group shows by hour', () => {
      const shows = [
        { name: 'Show 1', airtime: '20:00', runtime: 30, genres: [] },
        { name: 'Show 2', airtime: '20:30', runtime: 30, genres: [] },
        { name: 'Show 3', airtime: '21:00', runtime: 60, genres: [] }
      ];
      
      const grouped = groupShowsByHour(shows);
      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['20:00']).toHaveLength(2);
      expect(grouped['21:00']).toHaveLength(1);
    });
    
    it('should handle empty array', () => {
      expect(groupShowsByHour([])).toEqual({});
    });
    
    it('should handle non-array input', () => {
      expect(groupShowsByHour(null)).toEqual({});
    });
  });

  // ============================================
  // Unit Tests for clearScheduleCache
  // ============================================
  
  describe('clearScheduleCache', () => {
    it('should clear specific cache entry', () => {
      const cacheKey = `teletext_cache_${getCacheKey('US', '2025-01-01')}`;
      localStorage.setItem(cacheKey, JSON.stringify({ data: {}, timestamp: Date.now(), ttl: CACHE_TTL }));
      
      clearScheduleCache('US', '2025-01-01');
      
      expect(localStorage.getItem(cacheKey)).toBeNull();
    });
    
    it('should clear all TV schedule cache when no params', () => {
      localStorage.setItem('teletext_cache_tv_schedule_US_2025-01-01', JSON.stringify({ data: {} }));
      localStorage.setItem('teletext_cache_tv_schedule_UK_2025-01-02', JSON.stringify({ data: {} }));
      localStorage.setItem('teletext_cache_other_key', JSON.stringify({ data: {} }));
      
      clearScheduleCache();
      
      expect(localStorage.getItem('teletext_cache_tv_schedule_US_2025-01-01')).toBeNull();
      expect(localStorage.getItem('teletext_cache_tv_schedule_UK_2025-01-02')).toBeNull();
      // Other cache should remain
      expect(localStorage.getItem('teletext_cache_other_key')).not.toBeNull();
    });
  });
});
