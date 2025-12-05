/**
 * Teletext Reborn - Date Utilities
 * 
 * Utilities for date validation and formatting for the Time Machine feature.
 * Validates dates are real calendar dates within the valid range (1940-yesterday).
 * 
 * @module utils/date
 * Requirements: 8.3, 8.4
 */

/**
 * Minimum year for Time Machine (historical weather data availability)
 * @constant {number}
 */
export const MIN_YEAR = 1940;

/**
 * Month names for Teletext date formatting
 * @constant {string[]}
 */
export const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

/**
 * Short month names for compact display
 * @constant {string[]}
 */
export const MONTH_NAMES_SHORT = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

/**
 * Day names for Teletext date formatting
 * @constant {string[]}
 */
export const DAY_NAMES = [
  'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 
  'THURSDAY', 'FRIDAY', 'SATURDAY'
];

/**
 * Get the number of days in a given month
 * 
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (for leap year calculation)
 * @returns {number} Number of days in the month
 */
export function getDaysInMonth(month, year) {
  // Validate inputs
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return 0;
  }
  if (!Number.isInteger(year)) {
    return 0;
  }
  
  // Days in each month (non-leap year)
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // Check for leap year in February
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  
  return daysInMonth[month - 1];
}

/**
 * Check if a year is a leap year
 * 
 * @param {number} year - Year to check
 * @returns {boolean} True if leap year
 */
export function isLeapYear(year) {
  if (!Number.isInteger(year)) {
    return false;
  }
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Validate if a date is a real calendar date
 * 
 * Checks that:
 * - Month is 1-12
 * - Day is valid for the given month (accounting for leap years)
 * - Year is a valid integer
 * 
 * @param {number} month - Month (1-12)
 * @param {number} day - Day of month (1-31)
 * @param {number} year - Year
 * @returns {boolean} True if the date is valid
 * 
 * @example
 * isValidDate(2, 29, 2024) // true (leap year)
 * isValidDate(2, 29, 2023) // false (not a leap year)
 * isValidDate(2, 30, 2024) // false (Feb never has 30 days)
 * isValidDate(13, 1, 2024) // false (invalid month)
 */
export function isValidDate(month, day, year) {
  // Check for valid integers
  if (!Number.isInteger(month) || !Number.isInteger(day) || !Number.isInteger(year)) {
    return false;
  }
  
  // Check month range
  if (month < 1 || month > 12) {
    return false;
  }
  
  // Check day range
  if (day < 1) {
    return false;
  }
  
  // Get max days for this month
  const maxDays = getDaysInMonth(month, year);
  if (day > maxDays) {
    return false;
  }
  
  return true;
}

/**
 * Check if a date is within the valid Time Machine range (1940 to yesterday)
 * 
 * @param {Date} date - Date object to validate
 * @returns {boolean} True if date is within valid range
 * 
 * @example
 * isInValidRange(new Date(1969, 6, 20)) // true (Moon landing)
 * isInValidRange(new Date(1939, 0, 1)) // false (before 1940)
 * isInValidRange(new Date()) // false (today is not valid, only yesterday and before)
 */
export function isInValidRange(date) {
  // Handle invalid input
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return false;
  }
  
  // Get yesterday's date (end of day)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);
  
  // Get minimum date (start of 1940)
  const minDate = new Date(MIN_YEAR, 0, 1, 0, 0, 0, 0);
  
  // Check if date is within range
  return date >= minDate && date <= yesterday;
}

/**
 * Create a Date object from month, day, year components
 * Returns null if the date is invalid
 * 
 * @param {number} month - Month (1-12)
 * @param {number} day - Day of month
 * @param {number} year - Year
 * @returns {Date|null} Date object or null if invalid
 */
export function createDate(month, day, year) {
  if (!isValidDate(month, day, year)) {
    return null;
  }
  // Note: JavaScript months are 0-indexed
  return new Date(year, month - 1, day);
}

/**
 * Format a date in Teletext style: "WEDNESDAY 03 DECEMBER 2025"
 * 
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 * 
 * @example
 * formatTeletextDate(new Date(2025, 11, 3)) // 'WEDNESDAY 03 DECEMBER 2025'
 */
export function formatTeletextDate(date) {
  // Handle invalid input
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  
  const dayName = DAY_NAMES[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  
  return `${dayName} ${day} ${month} ${year}`;
}

/**
 * Format a date in short Teletext style: "03 DEC 2025"
 * 
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatTeletextDateShort(date) {
  // Handle invalid input
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES_SHORT[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
}

/**
 * Format a date for Time Machine display: "DECEMBER 03, 1969"
 * 
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatTimeMachineDate(date) {
  // Handle invalid input
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  
  return `${month} ${day}, ${year}`;
}

/**
 * Format a timestamp in Teletext style: "HH:MM:SS"
 * 
 * @param {Date} date - Date to format
 * @returns {string} Formatted time string
 * 
 * @example
 * formatTimestamp(new Date(2025, 11, 3, 14, 30, 45)) // '14:30:45'
 */
export function formatTimestamp(date) {
  // Handle invalid input
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format a timestamp in short format: "HH:MM"
 * 
 * @param {Date} date - Date to format
 * @returns {string} Formatted time string
 */
export function formatTimestampShort(date) {
  // Handle invalid input
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Format relative time: "X mins ago", "X hours ago", etc.
 * 
 * @param {Date} date - Date to format relative to now
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  // Handle invalid input
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  // Future dates
  if (diffMs < 0) {
    return 'IN THE FUTURE';
  }
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) {
    return 'JUST NOW';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} MIN${diffMinutes === 1 ? '' : 'S'} AGO`;
  } else if (diffHours < 24) {
    return `${diffHours} HOUR${diffHours === 1 ? '' : 'S'} AGO`;
  } else if (diffDays < 7) {
    return `${diffDays} DAY${diffDays === 1 ? '' : 'S'} AGO`;
  } else {
    return formatTeletextDateShort(date);
  }
}

/**
 * Get yesterday's date (for Time Machine default max date)
 * 
 * @returns {Date} Yesterday's date at midnight
 */
export function getYesterday() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday;
}

/**
 * Get the default Time Machine date (today minus 50 years)
 * Per Requirement 8.10
 * 
 * @returns {Date} Default date for Time Machine
 */
export function getDefaultTimeMachineDate() {
  const today = new Date();
  const defaultDate = new Date(
    today.getFullYear() - 50,
    today.getMonth(),
    today.getDate()
  );
  
  // Ensure it's within valid range
  if (!isInValidRange(defaultDate)) {
    // Fall back to a safe date
    return new Date(1975, 0, 1);
  }
  
  return defaultDate;
}

/**
 * Parse a date string in various formats
 * Supports: "YYYY-MM-DD", "MM/DD/YYYY", "DD-MM-YYYY"
 * 
 * @param {string} dateString - Date string to parse
 * @returns {Date|null} Parsed date or null if invalid
 */
export function parseDate(dateString) {
  if (typeof dateString !== 'string' || dateString.trim() === '') {
    return null;
  }
  
  const str = dateString.trim();
  
  // Try ISO format: YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch.map(Number);
    return createDate(month, day, year);
  }
  
  // Try US format: MM/DD/YYYY
  const usMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [, month, day, year] = usMatch.map(Number);
    return createDate(month, day, year);
  }
  
  // Try European format: DD-MM-YYYY
  const euMatch = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (euMatch) {
    const [, day, month, year] = euMatch.map(Number);
    return createDate(month, day, year);
  }
  
  return null;
}
