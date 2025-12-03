/**
 * Teletext Reborn - Color Utilities
 * 
 * Utilities for validating and working with the Teletext color palette.
 * All colors must be strictly limited to the 8 original Teletext colors.
 * 
 * @module utils/colors
 * Requirements: 2.1, 28.1-28.10
 */

/**
 * The 8 authentic Teletext colors (Req 2.1)
 * @constant {string[]}
 */
export const TELETEXT_COLORS = [
  '#000000', // Black
  '#FF0000', // Red
  '#00FF00', // Green
  '#FFFF00', // Yellow
  '#0000FF', // Blue
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFFFFF', // White
];

/**
 * Teletext color names mapped to hex values
 * @constant {Object}
 */
export const TELETEXT_COLOR_MAP = {
  black: '#000000',
  red: '#FF0000',
  green: '#00FF00',
  yellow: '#FFFF00',
  blue: '#0000FF',
  magenta: '#FF00FF',
  cyan: '#00FFFF',
  white: '#FFFFFF',
};

/**
 * Normalize a color value to uppercase hex format
 * @param {string} color - Color value (hex, rgb, or named)
 * @returns {string|null} Normalized hex color or null if invalid
 */
export function normalizeColor(color) {
  if (!color || typeof color !== 'string') {
    return null;
  }

  // Already hex format
  if (color.startsWith('#')) {
    const hex = color.toUpperCase();
    // Validate hex characters
    const hexPattern3 = /^#[0-9A-F]{3}$/;
    const hexPattern6 = /^#[0-9A-F]{6}$/;
    
    // Convert 3-digit hex to 6-digit
    if (hexPattern3.test(hex)) {
      return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    // Return 6-digit hex if valid
    if (hexPattern6.test(hex)) {
      return hex;
    }
    return null;
  }

  // RGB format: rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }

  // Named Teletext color
  const namedColor = TELETEXT_COLOR_MAP[color.toLowerCase()];
  if (namedColor) {
    return namedColor;
  }

  return null;
}

/**
 * Check if a color is a valid Teletext color
 * @param {string} color - Color value to check
 * @returns {boolean} True if color is one of the 8 Teletext colors
 */
export function isTeletextColor(color) {
  const normalized = normalizeColor(color);
  if (!normalized) {
    return false;
  }
  return TELETEXT_COLORS.includes(normalized);
}

/**
 * Validate that all colors in an array are valid Teletext colors
 * @param {string[]} colors - Array of color values
 * @returns {{valid: boolean, invalidColors: string[]}} Validation result
 */
export function validateColorPalette(colors) {
  const invalidColors = [];
  
  for (const color of colors) {
    if (!isTeletextColor(color)) {
      invalidColors.push(color);
    }
  }

  return {
    valid: invalidColors.length === 0,
    invalidColors,
  };
}

/**
 * Get the semantic meaning of a Teletext color
 * @param {string} color - Color value
 * @returns {string} Semantic meaning or 'unknown'
 */
export function getColorSemantics(color) {
  const normalized = normalizeColor(color);
  
  const semantics = {
    '#000000': 'background',
    '#FF0000': 'negative/error',
    '#00FF00': 'positive/success',
    '#FFFF00': 'primary/content',
    '#0000FF': 'header/navigation',
    '#FF00FF': 'special/time-machine',
    '#00FFFF': 'interactive/links',
    '#FFFFFF': 'secondary/text',
  };

  return semantics[normalized] || 'unknown';
}
