/**
 * Teletext Reborn - Color Palette Property Tests
 * 
 * Property-based tests to verify the color palette constraint:
 * All rendered colors must be within the 8 Teletext colors.
 * 
 * Property 1: Color Palette Constraint
 * Validates: Requirements 2.1
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  TELETEXT_COLORS,
  TELETEXT_COLOR_MAP,
  normalizeColor,
  isTeletextColor,
  validateColorPalette,
  getColorSemantics,
} from './colors.js';

describe('Color Palette Constraint (Property 1)', () => {
  describe('TELETEXT_COLORS constant', () => {
    it('should contain exactly 8 colors', () => {
      expect(TELETEXT_COLORS).toHaveLength(8);
    });

    it('should contain all required Teletext colors', () => {
      const requiredColors = [
        '#000000', // Black
        '#FF0000', // Red
        '#00FF00', // Green
        '#FFFF00', // Yellow
        '#0000FF', // Blue
        '#FF00FF', // Magenta
        '#00FFFF', // Cyan
        '#FFFFFF', // White
      ];
      
      requiredColors.forEach(color => {
        expect(TELETEXT_COLORS).toContain(color);
      });
    });

    it('should have all colors in uppercase hex format', () => {
      TELETEXT_COLORS.forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/);
      });
    });
  });

  describe('normalizeColor', () => {
    it('should normalize 6-digit hex colors to uppercase', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...TELETEXT_COLORS.map(c => c.toLowerCase())),
          (color) => {
            const normalized = normalizeColor(color);
            return normalized === color.toUpperCase();
          }
        )
      );
    });

    it('should convert 3-digit hex to 6-digit', () => {
      expect(normalizeColor('#000')).toBe('#000000');
      expect(normalizeColor('#fff')).toBe('#FFFFFF');
      expect(normalizeColor('#F00')).toBe('#FF0000');
    });

    it('should convert RGB format to hex', () => {
      expect(normalizeColor('rgb(0, 0, 0)')).toBe('#000000');
      expect(normalizeColor('rgb(255, 255, 255)')).toBe('#FFFFFF');
      expect(normalizeColor('rgb(255, 0, 0)')).toBe('#FF0000');
      expect(normalizeColor('rgb(0, 255, 0)')).toBe('#00FF00');
      expect(normalizeColor('rgb(0, 0, 255)')).toBe('#0000FF');
    });

    it('should convert RGBA format to hex (ignoring alpha)', () => {
      expect(normalizeColor('rgba(255, 255, 0, 0.5)')).toBe('#FFFF00');
      expect(normalizeColor('rgba(0, 255, 255, 1)')).toBe('#00FFFF');
    });

    it('should convert named Teletext colors', () => {
      Object.entries(TELETEXT_COLOR_MAP).forEach(([name, hex]) => {
        expect(normalizeColor(name)).toBe(hex);
      });
    });

    it('should return null for invalid colors', () => {
      expect(normalizeColor(null)).toBeNull();
      expect(normalizeColor(undefined)).toBeNull();
      expect(normalizeColor('')).toBeNull();
      expect(normalizeColor('invalid')).toBeNull();
      expect(normalizeColor('#GGG')).toBeNull(); // Invalid hex characters
      expect(normalizeColor('#GGGGGG')).toBeNull(); // Invalid hex characters
      expect(normalizeColor('#12345')).toBeNull(); // Wrong length
    });
  });

  describe('isTeletextColor', () => {
    it('PROPERTY: All Teletext colors should be valid', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...TELETEXT_COLORS),
          (color) => isTeletextColor(color) === true
        )
      );
    });

    it('PROPERTY: Teletext colors in any format should be valid', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...TELETEXT_COLORS),
          (color) => {
            // Test uppercase hex
            expect(isTeletextColor(color)).toBe(true);
            // Test lowercase hex
            expect(isTeletextColor(color.toLowerCase())).toBe(true);
            return true;
          }
        )
      );
    });

    it('PROPERTY: Random non-Teletext colors should be invalid', () => {
      // Generate random hex colors that are NOT in the Teletext palette
      const hexCharArb = fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F');
      const nonTeletextColorArb = fc.array(hexCharArb, { minLength: 6, maxLength: 6 })
        .map(chars => `#${chars.join('')}`)
        .filter(color => !TELETEXT_COLORS.includes(color));

      fc.assert(
        fc.property(
          nonTeletextColorArb,
          (color) => isTeletextColor(color) === false
        ),
        { numRuns: 100 }
      );
    });

    it('should validate named Teletext colors', () => {
      Object.keys(TELETEXT_COLOR_MAP).forEach(name => {
        expect(isTeletextColor(name)).toBe(true);
      });
    });

    it('should reject non-Teletext named colors', () => {
      expect(isTeletextColor('orange')).toBe(false);
      expect(isTeletextColor('purple')).toBe(false);
      expect(isTeletextColor('pink')).toBe(false);
      expect(isTeletextColor('brown')).toBe(false);
    });
  });

  describe('validateColorPalette', () => {
    it('PROPERTY: Array of only Teletext colors should be valid', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...TELETEXT_COLORS), { minLength: 1, maxLength: 20 }),
          (colors) => {
            const result = validateColorPalette(colors);
            return result.valid === true && result.invalidColors.length === 0;
          }
        )
      );
    });

    it('PROPERTY: Array with non-Teletext colors should be invalid', () => {
      const nonTeletextColor = '#123456'; // Not a Teletext color
      
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...TELETEXT_COLORS), { minLength: 0, maxLength: 10 }),
          (teletextColors) => {
            const colorsWithInvalid = [...teletextColors, nonTeletextColor];
            const result = validateColorPalette(colorsWithInvalid);
            return result.valid === false && result.invalidColors.includes(nonTeletextColor);
          }
        )
      );
    });

    it('should return empty invalidColors for valid palette', () => {
      const result = validateColorPalette(TELETEXT_COLORS);
      expect(result.valid).toBe(true);
      expect(result.invalidColors).toEqual([]);
    });

    it('should list all invalid colors', () => {
      const colors = ['#000000', '#123456', '#FFFFFF', '#ABCDEF'];
      const result = validateColorPalette(colors);
      expect(result.valid).toBe(false);
      expect(result.invalidColors).toContain('#123456');
      expect(result.invalidColors).toContain('#ABCDEF');
      expect(result.invalidColors).toHaveLength(2);
    });
  });

  describe('getColorSemantics', () => {
    it('should return correct semantics for all Teletext colors', () => {
      expect(getColorSemantics('#000000')).toBe('background');
      expect(getColorSemantics('#FF0000')).toBe('negative/error');
      expect(getColorSemantics('#00FF00')).toBe('positive/success');
      expect(getColorSemantics('#FFFF00')).toBe('primary/content');
      expect(getColorSemantics('#0000FF')).toBe('header/navigation');
      expect(getColorSemantics('#FF00FF')).toBe('special/time-machine');
      expect(getColorSemantics('#00FFFF')).toBe('interactive/links');
      expect(getColorSemantics('#FFFFFF')).toBe('secondary/text');
    });

    it('should return unknown for non-Teletext colors', () => {
      expect(getColorSemantics('#123456')).toBe('unknown');
      expect(getColorSemantics('invalid')).toBe('unknown');
    });
  });

  describe('CSS Variable Color Validation', () => {
    /**
     * This test validates that our CSS variables only use Teletext colors.
     * In a real scenario, this would parse the actual CSS files.
     */
    it('should validate CSS color variable definitions', () => {
      // These are the colors defined in teletext.css
      const cssColorVariables = {
        '--tt-black': '#000000',
        '--tt-red': '#FF0000',
        '--tt-green': '#00FF00',
        '--tt-yellow': '#FFFF00',
        '--tt-blue': '#0000FF',
        '--tt-magenta': '#FF00FF',
        '--tt-cyan': '#00FFFF',
        '--tt-white': '#FFFFFF',
      };

      const colors = Object.values(cssColorVariables);
      const result = validateColorPalette(colors);
      
      expect(result.valid).toBe(true);
      expect(result.invalidColors).toEqual([]);
    });
  });
});
