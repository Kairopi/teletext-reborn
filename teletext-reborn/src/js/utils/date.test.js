/**
 * Teletext Reborn - Date Utilities Property Tests
 * 
 * Property-based tests to verify date validation:
 * - Valid dates are correctly identified
 * - Invalid dates are correctly rejected
 * - Dates within range (1940-yesterday) are accepted
 * - Dates outside range are rejected
 * 
 * Property 5: Date Validation
 * Validates: Requirements 8.3, 8.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import {
  MIN_YEAR,
  MONTH_NAMES,
  MONTH_NAMES_SHORT,
  DAY_NAMES,
  getDaysInMonth,
  isLeapYear,
  isValidDate,
  isInValidRange,
  createDate,
  formatTeletextDate,
  formatTeletextDateShort,
  formatTimeMachineDate,
  formatTimestamp,
  formatTimestampShort,
  formatRelativeTime,
  getYesterday,
  getDefaultTimeMachineDate,
  parseDate,
} from './date.js';

describe('Date Validation (Property 5)', () => {
  describe('Constants', () => {
    it('MIN_YEAR should be 1940', () => {
      expect(MIN_YEAR).toBe(1940);
    });

    it('MONTH_NAMES should have 12 months', () => {
      expect(MONTH_NAMES).toHaveLength(12);
      expect(MONTH_NAMES[0]).toBe('JANUARY');
      expect(MONTH_NAMES[11]).toBe('DECEMBER');
    });

    it('MONTH_NAMES_SHORT should have 12 months', () => {
      expect(MONTH_NAMES_SHORT).toHaveLength(12);
      expect(MONTH_NAMES_SHORT[0]).toBe('JAN');
      expect(MONTH_NAMES_SHORT[11]).toBe('DEC');
    });

    it('DAY_NAMES should have 7 days', () => {
      expect(DAY_NAMES).toHaveLength(7);
      expect(DAY_NAMES[0]).toBe('SUNDAY');
      expect(DAY_NAMES[6]).toBe('SATURDAY');
    });
  });

  describe('isLeapYear', () => {
    it('should identify leap years correctly', () => {
      // Divisible by 4 but not 100
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2020)).toBe(true);
      expect(isLeapYear(1996)).toBe(true);
      
      // Divisible by 100 but not 400
      expect(isLeapYear(1900)).toBe(false);
      expect(isLeapYear(2100)).toBe(false);
      
      // Divisible by 400
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(1600)).toBe(true);
      
      // Not divisible by 4
      expect(isLeapYear(2023)).toBe(false);
      expect(isLeapYear(2019)).toBe(false);
    });

    it('should handle invalid inputs', () => {
      expect(isLeapYear(NaN)).toBe(false);
      expect(isLeapYear(null)).toBe(false);
      expect(isLeapYear(undefined)).toBe(false);
      expect(isLeapYear('2024')).toBe(false);
      expect(isLeapYear(2024.5)).toBe(false);
    });
  });

  describe('getDaysInMonth', () => {
    it('should return correct days for each month', () => {
      // Non-leap year
      expect(getDaysInMonth(1, 2023)).toBe(31);  // January
      expect(getDaysInMonth(2, 2023)).toBe(28);  // February
      expect(getDaysInMonth(3, 2023)).toBe(31);  // March
      expect(getDaysInMonth(4, 2023)).toBe(30);  // April
      expect(getDaysInMonth(5, 2023)).toBe(31);  // May
      expect(getDaysInMonth(6, 2023)).toBe(30);  // June
      expect(getDaysInMonth(7, 2023)).toBe(31);  // July
      expect(getDaysInMonth(8, 2023)).toBe(31);  // August
      expect(getDaysInMonth(9, 2023)).toBe(30);  // September
      expect(getDaysInMonth(10, 2023)).toBe(31); // October
      expect(getDaysInMonth(11, 2023)).toBe(30); // November
      expect(getDaysInMonth(12, 2023)).toBe(31); // December
    });

    it('should return 29 for February in leap years', () => {
      expect(getDaysInMonth(2, 2024)).toBe(29);
      expect(getDaysInMonth(2, 2000)).toBe(29);
    });

    it('should return 0 for invalid months', () => {
      expect(getDaysInMonth(0, 2023)).toBe(0);
      expect(getDaysInMonth(13, 2023)).toBe(0);
      expect(getDaysInMonth(-1, 2023)).toBe(0);
    });

    it('should handle invalid inputs', () => {
      expect(getDaysInMonth(NaN, 2023)).toBe(0);
      expect(getDaysInMonth(1, NaN)).toBe(0);
      expect(getDaysInMonth(null, 2023)).toBe(0);
    });
  });

  describe('isValidDate', () => {
    it('PROPERTY: Valid dates within month bounds are accepted', () => {
      /**
       * Feature: teletext-reborn, Property 5: Date Validation
       * For any valid month (1-12) and day within that month's bounds,
       * isValidDate should return true
       * Validates: Requirements 8.3, 8.4
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1940, max: 2100 }),
          (month, year) => {
            const maxDays = getDaysInMonth(month, year);
            // Test a random valid day within the month
            for (let day = 1; day <= maxDays; day++) {
              if (!isValidDate(month, day, year)) {
                return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('PROPERTY: Days exceeding month bounds are rejected', () => {
      /**
       * Feature: teletext-reborn, Property 5: Date Validation
       * For any month, days exceeding the month's maximum should be rejected
       * Validates: Requirements 8.3, 8.4
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1940, max: 2100 }),
          fc.integer({ min: 1, max: 10 }),
          (month, year, extraDays) => {
            const maxDays = getDaysInMonth(month, year);
            const invalidDay = maxDays + extraDays;
            return isValidDate(month, invalidDay, year) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('PROPERTY: Invalid months are rejected', () => {
      /**
       * Feature: teletext-reborn, Property 5: Date Validation
       * Months outside 1-12 should be rejected
       * Validates: Requirements 8.3, 8.4
       */
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ min: -100, max: 0 }),
            fc.integer({ min: 13, max: 100 })
          ),
          fc.integer({ min: 1, max: 28 }),
          fc.integer({ min: 1940, max: 2100 }),
          (month, day, year) => {
            return isValidDate(month, day, year) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('PROPERTY: Days less than 1 are rejected', () => {
      /**
       * Feature: teletext-reborn, Property 5: Date Validation
       * Days less than 1 should be rejected
       * Validates: Requirements 8.3, 8.4
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: -100, max: 0 }),
          fc.integer({ min: 1940, max: 2100 }),
          (month, day, year) => {
            return isValidDate(month, day, year) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly validate February 29 in leap years', () => {
      expect(isValidDate(2, 29, 2024)).toBe(true);  // Leap year
      expect(isValidDate(2, 29, 2023)).toBe(false); // Not a leap year
      expect(isValidDate(2, 29, 2000)).toBe(true);  // Divisible by 400
      expect(isValidDate(2, 29, 1900)).toBe(false); // Divisible by 100 but not 400
    });

    it('should reject February 30 always', () => {
      expect(isValidDate(2, 30, 2024)).toBe(false);
      expect(isValidDate(2, 30, 2023)).toBe(false);
    });

    it('should handle non-integer inputs', () => {
      expect(isValidDate(1.5, 15, 2024)).toBe(false);
      expect(isValidDate(1, 15.5, 2024)).toBe(false);
      expect(isValidDate(1, 15, 2024.5)).toBe(false);
      expect(isValidDate(NaN, 15, 2024)).toBe(false);
      expect(isValidDate(1, NaN, 2024)).toBe(false);
      expect(isValidDate(1, 15, NaN)).toBe(false);
    });
  });

  describe('isInValidRange', () => {
    // Use fake timers to control "now"
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 11, 4, 12, 0, 0)); // Dec 4, 2025
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('PROPERTY: Dates from 1940 to yesterday are valid', () => {
      /**
       * Feature: teletext-reborn, Property 5: Date Validation
       * For any date from Jan 1, 1940 to yesterday, isInValidRange should return true
       * Validates: Requirements 8.3, 8.4
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 1940, max: 2025 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 28 }), // Use 28 to avoid invalid dates
          (year, month, day) => {
            const date = new Date(year, month - 1, day);
            const yesterday = new Date(2025, 11, 3, 23, 59, 59, 999);
            const minDate = new Date(1940, 0, 1);
            
            // Only test dates that are actually in range
            if (date >= minDate && date <= yesterday) {
              return isInValidRange(date) === true;
            }
            return true; // Skip dates outside our test range
          }
        ),
        { numRuns: 100 }
      );
    });

    it('PROPERTY: Dates before 1940 are invalid', () => {
      /**
       * Feature: teletext-reborn, Property 5: Date Validation
       * For any date before Jan 1, 1940, isInValidRange should return false
       * Validates: Requirements 8.3, 8.4
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 1800, max: 1939 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 28 }),
          (year, month, day) => {
            const date = new Date(year, month - 1, day);
            return isInValidRange(date) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject today and future dates', () => {
      const today = new Date(2025, 11, 4);
      const tomorrow = new Date(2025, 11, 5);
      const nextYear = new Date(2026, 0, 1);
      
      expect(isInValidRange(today)).toBe(false);
      expect(isInValidRange(tomorrow)).toBe(false);
      expect(isInValidRange(nextYear)).toBe(false);
    });

    it('should accept yesterday', () => {
      const yesterday = new Date(2025, 11, 3);
      expect(isInValidRange(yesterday)).toBe(true);
    });

    it('should accept Jan 1, 1940', () => {
      const minDate = new Date(1940, 0, 1);
      expect(isInValidRange(minDate)).toBe(true);
    });

    it('should reject Dec 31, 1939', () => {
      const beforeMin = new Date(1939, 11, 31);
      expect(isInValidRange(beforeMin)).toBe(false);
    });

    it('should handle invalid inputs', () => {
      expect(isInValidRange(null)).toBe(false);
      expect(isInValidRange(undefined)).toBe(false);
      expect(isInValidRange('2024-01-01')).toBe(false);
      expect(isInValidRange(new Date('invalid'))).toBe(false);
    });
  });

  describe('createDate', () => {
    it('should create valid dates', () => {
      const date = createDate(7, 20, 1969);
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(1969);
      expect(date.getMonth()).toBe(6); // 0-indexed
      expect(date.getDate()).toBe(20);
    });

    it('should return null for invalid dates', () => {
      expect(createDate(2, 30, 2024)).toBeNull();
      expect(createDate(13, 1, 2024)).toBeNull();
      expect(createDate(0, 1, 2024)).toBeNull();
    });
  });

  describe('formatTeletextDate', () => {
    it('should format dates correctly', () => {
      const date = new Date(2025, 11, 3); // Dec 3, 2025 (Wednesday)
      expect(formatTeletextDate(date)).toBe('WEDNESDAY 03 DECEMBER 2025');
    });

    it('should pad single-digit days', () => {
      const date = new Date(2025, 0, 5); // Jan 5, 2025
      expect(formatTeletextDate(date)).toMatch(/05 JANUARY/);
    });

    it('should handle invalid inputs', () => {
      expect(formatTeletextDate(null)).toBe('');
      expect(formatTeletextDate(undefined)).toBe('');
      expect(formatTeletextDate(new Date('invalid'))).toBe('');
    });
  });

  describe('formatTeletextDateShort', () => {
    it('should format dates in short format', () => {
      const date = new Date(2025, 11, 3);
      expect(formatTeletextDateShort(date)).toBe('03 DEC 2025');
    });

    it('should handle invalid inputs', () => {
      expect(formatTeletextDateShort(null)).toBe('');
      expect(formatTeletextDateShort(new Date('invalid'))).toBe('');
    });
  });

  describe('formatTimeMachineDate', () => {
    it('should format dates for Time Machine display', () => {
      const date = new Date(1969, 6, 20); // July 20, 1969
      expect(formatTimeMachineDate(date)).toBe('JULY 20, 1969');
    });

    it('should handle invalid inputs', () => {
      expect(formatTimeMachineDate(null)).toBe('');
    });
  });

  describe('formatTimestamp', () => {
    it('should format time correctly', () => {
      const date = new Date(2025, 11, 3, 14, 30, 45);
      expect(formatTimestamp(date)).toBe('14:30:45');
    });

    it('should pad single-digit values', () => {
      const date = new Date(2025, 11, 3, 9, 5, 3);
      expect(formatTimestamp(date)).toBe('09:05:03');
    });

    it('should handle invalid inputs', () => {
      expect(formatTimestamp(null)).toBe('');
      expect(formatTimestamp(new Date('invalid'))).toBe('');
    });
  });

  describe('formatTimestampShort', () => {
    it('should format time without seconds', () => {
      const date = new Date(2025, 11, 3, 14, 30, 45);
      expect(formatTimestampShort(date)).toBe('14:30');
    });

    it('should handle invalid inputs', () => {
      expect(formatTimestampShort(null)).toBe('');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 11, 4, 12, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format recent times', () => {
      expect(formatRelativeTime(new Date(2025, 11, 4, 11, 59, 30))).toBe('JUST NOW');
      expect(formatRelativeTime(new Date(2025, 11, 4, 11, 55, 0))).toBe('5 MINS AGO');
      expect(formatRelativeTime(new Date(2025, 11, 4, 10, 0, 0))).toBe('2 HOURS AGO');
      expect(formatRelativeTime(new Date(2025, 11, 3, 12, 0, 0))).toBe('1 DAY AGO');
    });

    it('should handle singular forms', () => {
      expect(formatRelativeTime(new Date(2025, 11, 4, 11, 59, 0))).toBe('1 MIN AGO');
      expect(formatRelativeTime(new Date(2025, 11, 4, 11, 0, 0))).toBe('1 HOUR AGO');
    });

    it('should fall back to date for old times', () => {
      const oldDate = new Date(2025, 10, 1);
      expect(formatRelativeTime(oldDate)).toBe('01 NOV 2025');
    });

    it('should handle future dates', () => {
      const future = new Date(2025, 11, 5);
      expect(formatRelativeTime(future)).toBe('IN THE FUTURE');
    });

    it('should handle invalid inputs', () => {
      expect(formatRelativeTime(null)).toBe('');
    });
  });

  describe('getYesterday', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 11, 4, 12, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return yesterday at midnight', () => {
      const yesterday = getYesterday();
      expect(yesterday.getFullYear()).toBe(2025);
      expect(yesterday.getMonth()).toBe(11);
      expect(yesterday.getDate()).toBe(3);
      expect(yesterday.getHours()).toBe(0);
      expect(yesterday.getMinutes()).toBe(0);
      expect(yesterday.getSeconds()).toBe(0);
    });
  });

  describe('getDefaultTimeMachineDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 11, 4, 12, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return date 50 years ago', () => {
      const defaultDate = getDefaultTimeMachineDate();
      expect(defaultDate.getFullYear()).toBe(1975);
      expect(defaultDate.getMonth()).toBe(11);
      expect(defaultDate.getDate()).toBe(4);
    });

    it('should return a date within valid range', () => {
      const defaultDate = getDefaultTimeMachineDate();
      expect(isInValidRange(defaultDate)).toBe(true);
    });
  });

  describe('parseDate', () => {
    it('should parse ISO format (YYYY-MM-DD)', () => {
      const date = parseDate('1969-07-20');
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(1969);
      expect(date.getMonth()).toBe(6);
      expect(date.getDate()).toBe(20);
    });

    it('should parse US format (MM/DD/YYYY)', () => {
      const date = parseDate('07/20/1969');
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(1969);
      expect(date.getMonth()).toBe(6);
      expect(date.getDate()).toBe(20);
    });

    it('should parse European format (DD-MM-YYYY)', () => {
      const date = parseDate('20-07-1969');
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(1969);
      expect(date.getMonth()).toBe(6);
      expect(date.getDate()).toBe(20);
    });

    it('should return null for invalid formats', () => {
      expect(parseDate('invalid')).toBeNull();
      expect(parseDate('2024/01/01')).toBeNull();
      expect(parseDate('')).toBeNull();
      expect(parseDate(null)).toBeNull();
    });

    it('should return null for invalid dates', () => {
      expect(parseDate('2024-02-30')).toBeNull(); // Feb 30 doesn't exist
      expect(parseDate('2024-13-01')).toBeNull(); // Month 13 doesn't exist
    });
  });
});
