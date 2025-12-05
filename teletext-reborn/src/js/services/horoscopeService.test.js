/**
 * Teletext Reborn - Horoscope Service Tests
 * 
 * Property-based tests for horoscope generation functions.
 * 
 * @module services/horoscopeService.test
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  generateLuckyNumbers,
  generateRating,
  ZODIAC_SIGNS,
  getAllSigns,
  getSignById,
  getDailyHoroscope,
  formatStarRating
} from './horoscopeService.js';

describe('Horoscope Service', () => {
  
  // ============================================
  // Property 1: Lucky Numbers Uniqueness and Range
  // **Feature: teletext-classic-features, Property 1: Lucky Numbers Uniqueness**
  // **Validates: Requirements 28.6, 29.2**
  // ============================================
  
  describe('generateLuckyNumbers', () => {
    it('should generate exactly 6 unique numbers between 1-49 for any sign and date', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 12 }),   // signId
          fc.integer({ min: 0, max: 999 }),  // dateHash
          (signId, dateHash) => {
            const numbers = generateLuckyNumbers(signId, dateHash);
            
            // Must have exactly 6 numbers
            expect(numbers).toHaveLength(6);
            
            // All numbers must be unique
            const unique = new Set(numbers);
            expect(unique.size).toBe(6);
            
            // All numbers must be in range 1-49
            for (const num of numbers) {
              expect(num).toBeGreaterThanOrEqual(1);
              expect(num).toBeLessThanOrEqual(49);
            }
            
            // Numbers should be sorted
            for (let i = 1; i < numbers.length; i++) {
              expect(numbers[i]).toBeGreaterThanOrEqual(numbers[i - 1]);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should be deterministic - same inputs produce same outputs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 0, max: 999 }),
          (signId, dateHash) => {
            const result1 = generateLuckyNumbers(signId, dateHash);
            const result2 = generateLuckyNumbers(signId, dateHash);
            
            expect(result1).toEqual(result2);
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
  
  // ============================================
  // Property 6: Star Rating Range
  // **Feature: teletext-classic-features, Property 6: Star Rating Range**
  // **Validates: Requirements 28.5**
  // ============================================
  
  describe('generateRating', () => {
    it('should generate ratings between 1-5 for any sign, date, and type', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 0, max: 999 }),
          fc.constantFrom('love', 'money', 'health'),
          (signId, dateHash, type) => {
            const rating = generateRating(signId, dateHash, type);
            
            expect(rating).toBeGreaterThanOrEqual(1);
            expect(rating).toBeLessThanOrEqual(5);
            expect(Number.isInteger(rating)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // ============================================
  // Property 3: Zodiac Sign Coverage
  // **Feature: teletext-classic-features, Property 3: Zodiac Sign Coverage**
  // **Validates: Requirements 27.3**
  // ============================================
  
  describe('ZODIAC_SIGNS', () => {
    it('should contain exactly 12 zodiac signs', () => {
      expect(ZODIAC_SIGNS).toHaveLength(12);
      expect(getAllSigns()).toHaveLength(12);
    });
    
    it('should have unique IDs from 1-12', () => {
      const ids = ZODIAC_SIGNS.map(s => s.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(12);
      
      for (let i = 1; i <= 12; i++) {
        expect(ids).toContain(i);
      }
    });
    
    it('should have all required properties for each sign', () => {
      for (const sign of ZODIAC_SIGNS) {
        expect(sign).toHaveProperty('id');
        expect(sign).toHaveProperty('name');
        expect(sign).toHaveProperty('symbol');
        expect(sign).toHaveProperty('element');
        expect(sign).toHaveProperty('dateRange');
        
        expect(['fire', 'earth', 'air', 'water']).toContain(sign.element);
        expect(sign.symbol).toMatch(/^[♈♉♊♋♌♍♎♏♐♑♒♓]$/);
      }
    });
  });
  
  describe('getSignById', () => {
    it('should return correct sign for valid IDs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 12 }),
          (signId) => {
            const sign = getSignById(signId);
            
            expect(sign).not.toBeNull();
            expect(sign.id).toBe(signId);
            
            return true;
          }
        ),
        { numRuns: 12 }
      );
    });
    
    it('should return null for invalid IDs', () => {
      expect(getSignById(0)).toBeNull();
      expect(getSignById(13)).toBeNull();
      expect(getSignById(-1)).toBeNull();
    });
  });
  
  describe('getDailyHoroscope', () => {
    it('should return complete horoscope for valid sign IDs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 12 }),
          (signId) => {
            const horoscope = getDailyHoroscope(signId);
            
            expect(horoscope).not.toBeNull();
            expect(horoscope.sign.id).toBe(signId);
            expect(horoscope.prediction).toBeTruthy();
            expect(horoscope.loveRating).toBeGreaterThanOrEqual(1);
            expect(horoscope.loveRating).toBeLessThanOrEqual(5);
            expect(horoscope.moneyRating).toBeGreaterThanOrEqual(1);
            expect(horoscope.moneyRating).toBeLessThanOrEqual(5);
            expect(horoscope.healthRating).toBeGreaterThanOrEqual(1);
            expect(horoscope.healthRating).toBeLessThanOrEqual(5);
            expect(horoscope.luckyNumbers).toHaveLength(6);
            expect(horoscope.luckyColor).toBeTruthy();
            expect(horoscope.bestMatch).toHaveLength(2);
            
            return true;
          }
        ),
        { numRuns: 12 }
      );
    });
  });
  
  describe('formatStarRating', () => {
    it('should format ratings correctly', () => {
      expect(formatStarRating(1)).toBe('★☆☆☆☆');
      expect(formatStarRating(3)).toBe('★★★☆☆');
      expect(formatStarRating(5)).toBe('★★★★★');
    });
    
    it('should handle edge cases', () => {
      expect(formatStarRating(0)).toBe('☆☆☆☆☆');
      expect(formatStarRating(6)).toBe('★★★★★');
    });
  });
});
