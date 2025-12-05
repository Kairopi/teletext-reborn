/**
 * Teletext Reborn - Text Formatting Property Tests
 * 
 * Property-based tests to verify the line width constraint:
 * No formatted line shall exceed 40 characters in width.
 * 
 * Property 7: Line Width Constraint
 * Validates: Requirements 2.10, 5.6
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  MAX_LINE_WIDTH,
  ELLIPSIS,
  truncateToWidth,
  formatDottedLeader,
  wrapText,
  centerText,
  rightAlign,
  padText,
  createSeparator,
} from './teletext.js';

describe('Line Width Constraint (Property 7)', () => {
  describe('Constants', () => {
    it('MAX_LINE_WIDTH should be 40', () => {
      expect(MAX_LINE_WIDTH).toBe(40);
    });

    it('ELLIPSIS should be a single character', () => {
      expect(ELLIPSIS).toBe('…');
      expect(ELLIPSIS.length).toBe(1);
    });
  });

  describe('truncateToWidth', () => {
    it('PROPERTY: Output never exceeds maxWidth', () => {
      /**
       * Feature: teletext-reborn, Property 7: Line Width Constraint
       * For any text and maxWidth, truncateToWidth output length <= maxWidth
       * Validates: Requirements 2.10, 5.6
       */
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 200 }),
          fc.integer({ min: 1, max: 100 }),
          (text, maxWidth) => {
            const result = truncateToWidth(text, maxWidth);
            return result.length <= maxWidth;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('PROPERTY: Output never exceeds default 40 chars when no width specified', () => {
      /**
       * Feature: teletext-reborn, Property 7: Line Width Constraint
       * For any text, truncateToWidth with default width <= 40
       * Validates: Requirements 2.10, 5.6
       */
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 200 }),
          (text) => {
            const result = truncateToWidth(text);
            return result.length <= MAX_LINE_WIDTH;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('PROPERTY: Short text is preserved unchanged', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 39 }),
          (text) => {
            const result = truncateToWidth(text, 40);
            return result === text;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle null and undefined', () => {
      expect(truncateToWidth(null)).toBe('');
      expect(truncateToWidth(undefined)).toBe('');
    });

    it('should handle non-string inputs', () => {
      expect(truncateToWidth(123, 10)).toBe('123');
      expect(truncateToWidth(true, 10)).toBe('true');
    });

    it('should truncate with ellipsis when text exceeds width', () => {
      expect(truncateToWidth('Hello World', 8)).toBe('Hello W…');
      expect(truncateToWidth('ABCDEFGHIJ', 5)).toBe('ABCD…');
    });

    it('should handle edge case of width 1', () => {
      expect(truncateToWidth('Hello', 1)).toBe('…');
    });

    it('should handle invalid maxWidth values', () => {
      const result1 = truncateToWidth('Hello World', -5);
      expect(result1.length).toBeLessThanOrEqual(MAX_LINE_WIDTH);
      
      const result2 = truncateToWidth('Hello World', NaN);
      expect(result2.length).toBeLessThanOrEqual(MAX_LINE_WIDTH);
      
      const result3 = truncateToWidth('Hello World', Infinity);
      expect(result3.length).toBeLessThanOrEqual(MAX_LINE_WIDTH);
    });
  });


  describe('formatDottedLeader', () => {
    it('PROPERTY: Output never exceeds specified width', () => {
      /**
       * Feature: teletext-reborn, Property 7: Line Width Constraint
       * For any label, value, and width, formatDottedLeader output length <= width
       * Validates: Requirements 2.10, 5.6
       */
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 20 }),
          fc.integer({ min: 10, max: 100 }),
          (label, value, width) => {
            const result = formatDottedLeader(label, value, width);
            return result.length <= width;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('PROPERTY: Output never exceeds default 40 chars', () => {
      /**
       * Feature: teletext-reborn, Property 7: Line Width Constraint
       * For any label and value, formatDottedLeader with default width <= 40
       * Validates: Requirements 2.10, 5.6
       */
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 20 }),
          (label, value) => {
            const result = formatDottedLeader(label, value);
            return result.length <= MAX_LINE_WIDTH;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format with dotted leaders correctly', () => {
      const result = formatDottedLeader('NEWS', '101', 20);
      expect(result).toMatch(/^NEWS \.+ 101$/);
      expect(result.length).toBe(20);
    });

    it('should handle null and undefined inputs', () => {
      expect(formatDottedLeader(null, '101').length).toBeLessThanOrEqual(MAX_LINE_WIDTH);
      expect(formatDottedLeader('NEWS', null).length).toBeLessThanOrEqual(MAX_LINE_WIDTH);
      expect(formatDottedLeader(null, null).length).toBeLessThanOrEqual(MAX_LINE_WIDTH);
    });

    it('should truncate long labels to fit', () => {
      const result = formatDottedLeader('VERY LONG LABEL TEXT', '101', 25);
      expect(result.length).toBeLessThanOrEqual(25);
      expect(result).toContain('101');
    });
  });

  describe('wrapText', () => {
    it('PROPERTY: All wrapped lines never exceed maxWidth', () => {
      /**
       * Feature: teletext-reborn, Property 7: Line Width Constraint
       * For any text and maxWidth, all lines from wrapText have length <= maxWidth
       * Validates: Requirements 2.10, 5.6
       */
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 200 }),
          fc.integer({ min: 5, max: 100 }),
          (text, maxWidth) => {
            const lines = wrapText(text, maxWidth);
            return lines.every(line => line.length <= maxWidth);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('PROPERTY: All wrapped lines never exceed default 40 chars', () => {
      /**
       * Feature: teletext-reborn, Property 7: Line Width Constraint
       * For any text, all lines from wrapText with default width <= 40
       * Validates: Requirements 2.10, 5.6
       */
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 200 }),
          (text) => {
            const lines = wrapText(text);
            return lines.every(line => line.length <= MAX_LINE_WIDTH);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('PROPERTY: Wrapped text preserves all non-whitespace words', () => {
      // Generate words that are non-empty and non-whitespace
      const wordArb = fc.string({ minLength: 1, maxLength: 10 })
        .filter(s => s.trim().length > 0 && !/\s/.test(s));
      
      fc.assert(
        fc.property(
          fc.array(wordArb, { minLength: 1, maxLength: 10 }),
          (words) => {
            const text = words.join(' ');
            const lines = wrapText(text, 40);
            const rejoined = lines.join(' ');
            // All original non-whitespace words should be present
            return words.every(word => rejoined.includes(word));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should wrap text at word boundaries', () => {
      const lines = wrapText('Hello World', 6);
      expect(lines).toEqual(['Hello', 'World']);
    });

    it('should handle long words by breaking them', () => {
      const lines = wrapText('ABCDEFGHIJKLMNOP', 5);
      expect(lines.every(line => line.length <= 5)).toBe(true);
    });

    it('should handle null and undefined', () => {
      expect(wrapText(null)).toEqual([]);
      expect(wrapText(undefined)).toEqual([]);
    });

    it('should handle empty string', () => {
      expect(wrapText('')).toEqual([]);
    });

    it('should handle multiple spaces', () => {
      const lines = wrapText('Hello    World', 20);
      expect(lines).toEqual(['Hello World']);
    });
  });


  describe('centerText', () => {
    it('PROPERTY: Output length equals specified width', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.integer({ min: 1, max: 100 }),
          (text, width) => {
            const result = centerText(text, width);
            return result.length === width || (text.length > width && result.length === width);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('PROPERTY: Output never exceeds default 40 chars', () => {
      /**
       * Feature: teletext-reborn, Property 7: Line Width Constraint
       * Validates: Requirements 2.10, 5.6
       */
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          (text) => {
            const result = centerText(text);
            return result.length <= MAX_LINE_WIDTH;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should center text correctly', () => {
      expect(centerText('HELLO', 10)).toBe('  HELLO   ');
      expect(centerText('AB', 6)).toBe('  AB  ');
    });

    it('should handle null and undefined', () => {
      expect(centerText(null, 10)).toBe('          ');
      expect(centerText(undefined, 10)).toBe('          ');
    });

    it('should truncate text longer than width', () => {
      const result = centerText('Hello World', 5);
      expect(result.length).toBe(5);
    });
  });

  describe('rightAlign', () => {
    it('PROPERTY: Output length equals specified width', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.integer({ min: 1, max: 100 }),
          (text, width) => {
            const result = rightAlign(text, width);
            return result.length === width || (text.length > width && result.length === width);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('PROPERTY: Output never exceeds default 40 chars', () => {
      /**
       * Feature: teletext-reborn, Property 7: Line Width Constraint
       * Validates: Requirements 2.10, 5.6
       */
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          (text) => {
            const result = rightAlign(text);
            return result.length <= MAX_LINE_WIDTH;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should right-align text correctly', () => {
      expect(rightAlign('123', 10)).toBe('       123');
      expect(rightAlign('AB', 5)).toBe('   AB');
    });

    it('should handle null and undefined', () => {
      expect(rightAlign(null, 10)).toBe('          ');
      expect(rightAlign(undefined, 10)).toBe('          ');
    });
  });

  describe('padText', () => {
    it('PROPERTY: Output length equals specified width', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.integer({ min: 1, max: 100 }),
          (text, width) => {
            const result = padText(text, width);
            return result.length === width || (text.length > width && result.length === width);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('PROPERTY: Output never exceeds default 40 chars', () => {
      /**
       * Feature: teletext-reborn, Property 7: Line Width Constraint
       * Validates: Requirements 2.10, 5.6
       */
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          (text) => {
            const result = padText(text);
            return result.length <= MAX_LINE_WIDTH;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should left-align and pad text correctly', () => {
      expect(padText('Hello', 10)).toBe('Hello     ');
      expect(padText('AB', 5)).toBe('AB   ');
    });

    it('should handle null and undefined', () => {
      expect(padText(null, 10)).toBe('          ');
      expect(padText(undefined, 10)).toBe('          ');
    });
  });

  describe('createSeparator', () => {
    it('PROPERTY: Output length equals specified width', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('━', '═', '─', '-', '*'),
          fc.integer({ min: 1, max: 100 }),
          (char, width) => {
            const result = createSeparator(char, width);
            return result.length === width;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('PROPERTY: Output never exceeds default 40 chars', () => {
      /**
       * Feature: teletext-reborn, Property 7: Line Width Constraint
       * Validates: Requirements 2.10, 5.6
       */
      fc.assert(
        fc.property(
          fc.constantFrom('━', '═', '─', '-', '*'),
          (char) => {
            const result = createSeparator(char);
            return result.length === MAX_LINE_WIDTH;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create separator with default character', () => {
      const result = createSeparator();
      expect(result.length).toBe(40);
      expect(result).toBe('━'.repeat(40));
    });

    it('should create separator with custom character', () => {
      const result = createSeparator('═', 20);
      expect(result).toBe('═'.repeat(20));
    });

    it('should use first character if string is longer', () => {
      const result = createSeparator('ABC', 10);
      expect(result).toBe('A'.repeat(10));
    });
  });
});


// ============================================
// BLOCK CHARACTER UTILITIES TESTS (Req 32.3, 32.5, 32.6)
// ============================================

import {
  BLOCK_CHARS,
  SEPARATOR_STYLES,
  createBlockBorder,
  createProgressBar,
  createBulletPoint,
  createBulletList,
  createBlockHeader,
  createSkeleton,
  formatValueIndicator,
} from './teletext.js';

describe('Block Character Utilities (Req 32.3, 32.5, 32.6)', () => {
  describe('BLOCK_CHARS constant', () => {
    it('should have all required block characters', () => {
      expect(BLOCK_CHARS.FULL).toBe('█');
      expect(BLOCK_CHARS.UPPER_HALF).toBe('▀');
      expect(BLOCK_CHARS.LOWER_HALF).toBe('▄');
      expect(BLOCK_CHARS.LEFT_HALF).toBe('▌');
      expect(BLOCK_CHARS.RIGHT_HALF).toBe('▐');
      expect(BLOCK_CHARS.LIGHT_SHADE).toBe('░');
      expect(BLOCK_CHARS.MEDIUM_SHADE).toBe('▒');
      expect(BLOCK_CHARS.DARK_SHADE).toBe('▓');
      expect(BLOCK_CHARS.BULLET).toBe('►');
    });
  });

  describe('SEPARATOR_STYLES constant', () => {
    it('should have all separator styles', () => {
      expect(SEPARATOR_STYLES.HEAVY).toBe('━');
      expect(SEPARATOR_STYLES.DOUBLE).toBe('═');
      expect(SEPARATOR_STYLES.LIGHT).toBe('─');
      expect(SEPARATOR_STYLES.BLOCK).toBe('█');
    });
  });

  describe('createProgressBar', () => {
    it('PROPERTY: Progress bar length equals specified width', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 5, max: 40 }),
          (progress, width) => {
            const result = createProgressBar(progress, width, false);
            return result.length === width;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('PROPERTY: Filled blocks count matches progress percentage', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 10, max: 40 }),
          (progress, width) => {
            const result = createProgressBar(progress, width, false);
            const filledCount = (result.match(/█/g) || []).length;
            const expectedFilled = Math.round((progress / 100) * width);
            return filledCount === expectedFilled;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create progress bar at 0%', () => {
      const result = createProgressBar(0, 10);
      expect(result).toBe('░░░░░░░░░░');
    });

    it('should create progress bar at 50%', () => {
      const result = createProgressBar(50, 10);
      expect(result).toBe('█████░░░░░');
    });

    it('should create progress bar at 100%', () => {
      const result = createProgressBar(100, 10);
      expect(result).toBe('██████████');
    });

    it('should show percentage when requested', () => {
      const result = createProgressBar(75, 10, true);
      expect(result).toContain('75%');
    });

    it('should clamp progress to 0-100 range', () => {
      expect(createProgressBar(-10, 10)).toBe('░░░░░░░░░░');
      expect(createProgressBar(150, 10)).toBe('██████████');
    });
  });

  describe('createBulletPoint', () => {
    it('should create bullet point with default bullet', () => {
      const result = createBulletPoint('Item');
      expect(result).toBe('► Item');
    });

    it('should create bullet point with custom bullet', () => {
      const result = createBulletPoint('Item', '•');
      expect(result).toBe('• Item');
    });

    it('should handle null and undefined', () => {
      expect(createBulletPoint(null)).toBe('► ');
      expect(createBulletPoint(undefined)).toBe('► ');
    });
  });

  describe('createBulletList', () => {
    it('should create list of bullet points', () => {
      const result = createBulletList(['One', 'Two', 'Three']);
      expect(result).toEqual(['► One', '► Two', '► Three']);
    });

    it('should handle empty array', () => {
      expect(createBulletList([])).toEqual([]);
    });

    it('should handle non-array input', () => {
      expect(createBulletList(null)).toEqual([]);
      expect(createBulletList('string')).toEqual([]);
    });
  });

  describe('createBlockBorder', () => {
    it('should create single-style border', () => {
      const result = createBlockBorder('TEST', 'single');
      expect(result).toHaveLength(3);
      expect(result[0]).toContain('━');
      expect(result[1]).toContain('TEST');
    });

    it('should create block-style border', () => {
      const result = createBlockBorder('TEST', 'block');
      expect(result).toHaveLength(3);
      expect(result[0]).toContain('█');
    });

    it('should handle null and undefined', () => {
      const result = createBlockBorder(null);
      expect(result).toHaveLength(3);
    });
  });

  describe('createBlockHeader', () => {
    it('should create underline-style header', () => {
      const result = createBlockHeader('TITLE', 'underline');
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('TITLE');
      expect(result[1]).toContain('═');
    });

    it('should create box-style header', () => {
      const result = createBlockHeader('TITLE', 'box');
      expect(result).toHaveLength(3);
    });

    it('should uppercase the text', () => {
      const result = createBlockHeader('title');
      expect(result[0]).toBe('TITLE');
    });
  });

  describe('createSkeleton', () => {
    it('should create skeleton lines', () => {
      const result = createSkeleton(10, 3);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('░░░░░░░░░░');
    });

    it('should use default values', () => {
      const result = createSkeleton();
      expect(result).toHaveLength(1);
      expect(result[0].length).toBe(20);
    });
  });

  describe('formatValueIndicator', () => {
    it('should format positive values with arrow', () => {
      const result = formatValueIndicator(10, 'arrow');
      expect(result).toContain('↑');
      expect(result).toContain('+10');
    });

    it('should format negative values with arrow', () => {
      const result = formatValueIndicator(-5, 'arrow');
      expect(result).toContain('↓');
      expect(result).toContain('-5');
    });

    it('should format with block style', () => {
      const result = formatValueIndicator(10, 'block');
      expect(result).toContain('▀');
    });

    it('should handle zero as positive', () => {
      const result = formatValueIndicator(0, 'arrow');
      expect(result).toContain('+');
    });
  });
});
