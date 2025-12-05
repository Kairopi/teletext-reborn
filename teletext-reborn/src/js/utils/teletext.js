/**
 * Teletext Reborn - Text Formatting Utilities
 * 
 * Utilities for formatting text to fit the Teletext 40-character line width constraint.
 * All text displayed in the content area must not exceed 40 characters per line.
 * 
 * @module utils/teletext
 * Requirements: 2.10, 5.6
 */

/**
 * Maximum line width for Teletext content (Req 2.10)
 * @constant {number}
 */
export const MAX_LINE_WIDTH = 40;

/**
 * Default ellipsis character for truncation
 * @constant {string}
 */
export const ELLIPSIS = '…';

/**
 * Truncate text to fit within a maximum width
 * 
 * @param {string} text - The text to truncate
 * @param {number} [maxWidth=40] - Maximum width in characters
 * @returns {string} Truncated text with ellipsis if needed
 * 
 * @example
 * truncateToWidth('Hello World', 8) // 'Hello W…'
 * truncateToWidth('Short', 40) // 'Short'
 */
export function truncateToWidth(text, maxWidth = MAX_LINE_WIDTH) {
  // Handle edge cases
  if (text === null || text === undefined) {
    return '';
  }
  
  const str = String(text);
  
  // Validate maxWidth
  if (typeof maxWidth !== 'number' || maxWidth < 1 || !Number.isFinite(maxWidth)) {
    return str.length <= MAX_LINE_WIDTH ? str : str.slice(0, MAX_LINE_WIDTH - 1) + ELLIPSIS;
  }
  
  const width = Math.floor(maxWidth);
  
  // No truncation needed
  if (str.length <= width) {
    return str;
  }
  
  // Truncate with ellipsis
  if (width <= 1) {
    return ELLIPSIS;
  }
  
  return str.slice(0, width - 1) + ELLIPSIS;
}


/**
 * Format a label and value with dotted leaders between them
 * 
 * Creates a line like: "NEWS .................. 101"
 * The dots fill the space between the label and value to reach the specified width.
 * 
 * @param {string} label - The left-aligned label
 * @param {string} value - The right-aligned value
 * @param {number} [width=40] - Total line width
 * @returns {string} Formatted line with dotted leaders
 * 
 * @example
 * formatDottedLeader('NEWS', '101', 40) // 'NEWS ................................. 101'
 * formatDottedLeader('WEATHER', '200', 30) // 'WEATHER .................... 200'
 */
export function formatDottedLeader(label, value, width = MAX_LINE_WIDTH) {
  // Handle edge cases
  const labelStr = label === null || label === undefined ? '' : String(label);
  const valueStr = value === null || value === undefined ? '' : String(value);
  
  // Validate width
  let targetWidth = MAX_LINE_WIDTH;
  if (typeof width === 'number' && Number.isFinite(width) && width >= 1) {
    targetWidth = Math.floor(width);
  }
  
  // Calculate space needed for dots (minimum 3 dots for readability)
  const minDots = 3;
  const spacesAroundDots = 2; // One space before and after dots
  const minContentWidth = labelStr.length + valueStr.length + minDots + spacesAroundDots;
  
  // If content is too long, truncate the label
  if (minContentWidth > targetWidth) {
    const availableForLabel = targetWidth - valueStr.length - minDots - spacesAroundDots;
    if (availableForLabel < 1) {
      // Even with truncation, can't fit - just return truncated combined
      return truncateToWidth(labelStr + ' ' + valueStr, targetWidth);
    }
    const truncatedLabel = truncateToWidth(labelStr, availableForLabel);
    const dotsNeeded = targetWidth - truncatedLabel.length - valueStr.length - spacesAroundDots;
    const dots = '.'.repeat(Math.max(minDots, dotsNeeded));
    return `${truncatedLabel} ${dots} ${valueStr}`;
  }
  
  // Calculate dots needed
  const dotsNeeded = targetWidth - labelStr.length - valueStr.length - spacesAroundDots;
  const dots = '.'.repeat(dotsNeeded);
  
  return `${labelStr} ${dots} ${valueStr}`;
}

/**
 * Wrap text to fit within a maximum width, breaking at word boundaries
 * 
 * @param {string} text - The text to wrap
 * @param {number} [maxWidth=40] - Maximum width per line
 * @returns {string[]} Array of lines, each within maxWidth
 * 
 * @example
 * wrapText('Hello World', 6) // ['Hello', 'World']
 * wrapText('A very long sentence', 10) // ['A very', 'long', 'sentence']
 */
export function wrapText(text, maxWidth = MAX_LINE_WIDTH) {
  // Handle edge cases
  if (text === null || text === undefined) {
    return [];
  }
  
  const str = String(text);
  
  if (str.length === 0) {
    return [];
  }
  
  // Validate maxWidth
  let width = MAX_LINE_WIDTH;
  if (typeof maxWidth === 'number' && Number.isFinite(maxWidth) && maxWidth >= 1) {
    width = Math.floor(maxWidth);
  }
  
  const lines = [];
  const words = str.split(/\s+/);
  let currentLine = '';
  
  for (const word of words) {
    // Skip empty words (from multiple spaces)
    if (word.length === 0) {
      continue;
    }
    
    // If word itself is longer than width, force break it
    if (word.length > width) {
      // First, push current line if not empty
      if (currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = '';
      }
      
      // Break the long word into chunks
      let remaining = word;
      while (remaining.length > width) {
        lines.push(remaining.slice(0, width));
        remaining = remaining.slice(width);
      }
      if (remaining.length > 0) {
        currentLine = remaining;
      }
      continue;
    }
    
    // Check if word fits on current line
    if (currentLine.length === 0) {
      currentLine = word;
    } else if (currentLine.length + 1 + word.length <= width) {
      currentLine += ' ' + word;
    } else {
      // Word doesn't fit, start new line
      lines.push(currentLine);
      currentLine = word;
    }
  }
  
  // Don't forget the last line
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Center text within a given width
 * 
 * @param {string} text - The text to center
 * @param {number} [width=40] - Total width to center within
 * @returns {string} Centered text with padding
 * 
 * @example
 * centerText('HELLO', 10) // '  HELLO   '
 */
export function centerText(text, width = MAX_LINE_WIDTH) {
  // Handle edge cases
  if (text === null || text === undefined) {
    return ' '.repeat(width);
  }
  
  const str = String(text);
  
  // Validate width
  let targetWidth = MAX_LINE_WIDTH;
  if (typeof width === 'number' && Number.isFinite(width) && width >= 1) {
    targetWidth = Math.floor(width);
  }
  
  // Truncate if too long
  if (str.length >= targetWidth) {
    return truncateToWidth(str, targetWidth);
  }
  
  const totalPadding = targetWidth - str.length;
  const leftPadding = Math.floor(totalPadding / 2);
  const rightPadding = totalPadding - leftPadding;
  
  return ' '.repeat(leftPadding) + str + ' '.repeat(rightPadding);
}

/**
 * Right-align text within a given width
 * 
 * @param {string} text - The text to right-align
 * @param {number} [width=40] - Total width
 * @returns {string} Right-aligned text with left padding
 * 
 * @example
 * rightAlign('123', 10) // '       123'
 */
export function rightAlign(text, width = MAX_LINE_WIDTH) {
  // Handle edge cases
  if (text === null || text === undefined) {
    return ' '.repeat(width);
  }
  
  const str = String(text);
  
  // Validate width
  let targetWidth = MAX_LINE_WIDTH;
  if (typeof width === 'number' && Number.isFinite(width) && width >= 1) {
    targetWidth = Math.floor(width);
  }
  
  // Truncate if too long
  if (str.length >= targetWidth) {
    return truncateToWidth(str, targetWidth);
  }
  
  const padding = targetWidth - str.length;
  return ' '.repeat(padding) + str;
}

/**
 * Pad text to a specific width (left-aligned)
 * 
 * @param {string} text - The text to pad
 * @param {number} [width=40] - Total width
 * @returns {string} Left-aligned text with right padding
 * 
 * @example
 * padText('Hello', 10) // 'Hello     '
 */
export function padText(text, width = MAX_LINE_WIDTH) {
  // Handle edge cases
  if (text === null || text === undefined) {
    return ' '.repeat(width);
  }
  
  const str = String(text);
  
  // Validate width
  let targetWidth = MAX_LINE_WIDTH;
  if (typeof width === 'number' && Number.isFinite(width) && width >= 1) {
    targetWidth = Math.floor(width);
  }
  
  // Truncate if too long
  if (str.length >= targetWidth) {
    return truncateToWidth(str, targetWidth);
  }
  
  const padding = targetWidth - str.length;
  return str + ' '.repeat(padding);
}

/**
 * Create a horizontal separator line
 * 
 * @param {string} [char='━'] - Character to use for separator
 * @param {number} [width=40] - Width of separator
 * @returns {string} Separator line
 * 
 * @example
 * createSeparator() // '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
 * createSeparator('═', 20) // '════════════════════'
 */
export function createSeparator(char = '━', width = MAX_LINE_WIDTH) {
  // Validate width
  let targetWidth = MAX_LINE_WIDTH;
  if (typeof width === 'number' && Number.isFinite(width) && width >= 1) {
    targetWidth = Math.floor(width);
  }
  
  // Use first character if string is longer
  const sepChar = char && char.length > 0 ? char[0] : '━';
  
  return sepChar.repeat(targetWidth);
}
