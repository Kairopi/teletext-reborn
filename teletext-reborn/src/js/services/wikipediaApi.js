/**
 * Teletext Reborn - Wikipedia API Service
 * 
 * Integrates with Wikipedia's "On This Day" API to fetch
 * historical events, births, and deaths for any date.
 * 
 * @module services/wikipediaApi
 * @see https://api.wikimedia.org/wiki/Feed_API/Reference/On_this_day
 * Requirements: 9.1-9.7
 */

import { get, CacheTTL, ApiError, ErrorTypes } from './api.js';

// ============================================
// Constants
// ============================================

/**
 * Wikipedia On This Day API endpoint
 * Format: /feed/v1/wikipedia/{language}/onthisday/{type}/{MM}/{DD}
 */
const WIKIPEDIA_API_BASE = 'https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday';

/**
 * Cache TTL for Wikipedia data (24 hours)
 * Historical data doesn't change, so long cache is appropriate
 */
const CACHE_TTL = CacheTTL.ONE_DAY;

/**
 * Enhanced limits for richer content
 * Increased from original to provide more engaging experience
 */
const DEFAULT_LIMITS = {
  events: 50,      // Was 10 - now fetch many more for browsing
  births: 25,      // Was 5 - more famous birthdays
  deaths: 15,      // Was 3 - more notable deaths
  selected: 5,     // NEW: Featured/curated events
  holidays: 10,    // NEW: Holidays for the date
};

/**
 * Maximum description length for list view (2 lines at 40 chars = 80 chars)
 */
const MAX_DESCRIPTION_LENGTH = 80;

/**
 * Maximum description length for detail view (much longer for full reading)
 */
const MAX_DETAIL_LENGTH = 500;

// ============================================
// Helper Functions
// ============================================

/**
 * Zero-pad a number to 2 digits
 * Required by Wikipedia API (e.g., month 1 -> "01")
 * @param {number} num - Number to pad
 * @returns {string} Zero-padded string
 */
function zeroPad(num) {
  return String(num).padStart(2, '0');
}

/**
 * Truncate text to maximum length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = MAX_DESCRIPTION_LENGTH) {
  if (!text || text.length <= maxLength) {
    return text || '';
  }
  return text.substring(0, maxLength - 1).trim() + '…';
}


/**
 * Generate cache key for On This Day data
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @returns {string} Cache key
 */
function getCacheKey(month, day) {
  return `wikipedia_onthisday_${month}_${day}`;
}

/**
 * Parse a single event/birth/death entry from Wikipedia API
 * Enhanced to extract rich data including Wikipedia links and related pages
 * @param {Object} entry - API entry with text, year, and pages
 * @param {string} type - Entry type ('event', 'birth', 'death', 'selected', 'holiday')
 * @returns {Object} Parsed entry with rich data
 */
function parseEntry(entry, type) {
  // Extract the first related page for Wikipedia link
  const firstPage = entry.pages?.[0];
  const wikipediaUrl = firstPage?.content_urls?.desktop?.page || null;
  const thumbnailUrl = firstPage?.thumbnail?.source || null;
  const pageTitle = firstPage?.titles?.display || firstPage?.title || null;
  const pageDescription = firstPage?.description || null;
  
  return {
    year: entry.year,
    description: truncateText(entry.text),
    type,
    // Rich data for detail view
    fullDescription: entry.text || '',
    wikipediaUrl,
    thumbnailUrl,
    pageTitle,
    pageDescription,
    // Store all related pages for advanced features
    relatedPages: (entry.pages || []).map(page => ({
      title: page.titles?.display || page.title,
      description: page.description,
      url: page.content_urls?.desktop?.page,
      thumbnail: page.thumbnail?.source,
    })),
  };
}

/**
 * Parse a holiday entry from Wikipedia API
 * @param {Object} entry - Holiday entry
 * @returns {Object} Parsed holiday
 */
function parseHoliday(entry) {
  return {
    name: entry.text || 'UNKNOWN HOLIDAY',
    description: truncateText(entry.text),
    fullDescription: entry.text || '',
    type: 'holiday',
    relatedPages: (entry.pages || []).map(page => ({
      title: page.titles?.display || page.title,
      description: page.description,
      url: page.content_urls?.desktop?.page,
    })),
  };
}

/**
 * Parse Wikipedia API response with enhanced data
 * Now includes selected (featured) events and holidays
 * @param {Object} data - API response
 * @param {Object} limits - Limits for each category
 * @returns {Object} Parsed data with events, births, deaths, selected, holidays
 */
function parseOnThisDayResponse(data, limits = DEFAULT_LIMITS) {
  // Parse regular events
  const events = (data.events || [])
    .slice(0, limits.events)
    .map(e => parseEntry(e, 'event'));
  
  // Parse births
  const births = (data.births || [])
    .slice(0, limits.births)
    .map(e => parseEntry(e, 'birth'));
  
  // Parse deaths
  const deaths = (data.deaths || [])
    .slice(0, limits.deaths)
    .map(e => parseEntry(e, 'death'));
  
  // NEW: Parse selected/featured events (curated by Wikipedia)
  const selected = (data.selected || [])
    .slice(0, limits.selected)
    .map(e => parseEntry(e, 'selected'));
  
  // NEW: Parse holidays
  const holidays = (data.holidays || [])
    .slice(0, limits.holidays)
    .map(h => parseHoliday(h));
  
  // Get the featured event (first selected, or first event)
  const featuredEvent = selected[0] || events[0] || null;
  
  return {
    events,
    births,
    deaths,
    selected,
    holidays,
    featuredEvent,
    // Totals for display
    totalEvents: data.events?.length || 0,
    totalBirths: data.births?.length || 0,
    totalDeaths: data.deaths?.length || 0,
    totalSelected: data.selected?.length || 0,
    totalHolidays: data.holidays?.length || 0,
  };
}

/**
 * Validate month and day parameters
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @returns {boolean} True if valid
 */
function isValidDate(month, day) {
  if (typeof month !== 'number' || typeof day !== 'number') {
    return false;
  }
  if (isNaN(month) || isNaN(day)) {
    return false;
  }
  if (month < 1 || month > 12) {
    return false;
  }
  if (day < 1 || day > 31) {
    return false;
  }
  // Check for invalid day/month combinations
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > daysInMonth[month - 1]) {
    return false;
  }
  return true;
}

// ============================================
// Main API Functions
// ============================================

/**
 * Fetch "On This Day" data from Wikipedia
 * 
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @param {Object} [options] - Options
 * @param {number} [options.eventsLimit] - Max events to return (default: 10)
 * @param {number} [options.birthsLimit] - Max births to return (default: 5)
 * @param {number} [options.deathsLimit] - Max deaths to return (default: 3)
 * @returns {Promise<Object>} Historical data
 * @throws {ApiError} On API failure or invalid date
 * 
 * Requirements: 9.1-9.5
 * 
 * @example
 * const data = await getOnThisDay(7, 20);
 * // Returns:
 * // {
 * //   events: [{ year: 1969, description: 'Apollo 11 lands...', type: 'event' }, ...],
 * //   births: [{ year: 1938, description: 'Diana Rigg...', type: 'birth' }, ...],
 * //   deaths: [{ year: 1973, description: 'Bruce Lee...', type: 'death' }, ...]
 * // }
 */
export async function getOnThisDay(month, day, options = {}) {
  // Validate date parameters
  if (!isValidDate(month, day)) {
    throw new ApiError(
      ErrorTypes.VALIDATION,
      'INVALID DATE',
      { retryable: false }
    );
  }
  
  const limits = {
    events: options.eventsLimit ?? DEFAULT_LIMITS.events,
    births: options.birthsLimit ?? DEFAULT_LIMITS.births,
    deaths: options.deathsLimit ?? DEFAULT_LIMITS.deaths,
  };
  
  // Wikipedia API requires zero-padded month/day: /all/{MM}/{DD}
  const paddedMonth = zeroPad(month);
  const paddedDay = zeroPad(day);
  const url = `${WIKIPEDIA_API_BASE}/all/${paddedMonth}/${paddedDay}`;
  const cacheKey = getCacheKey(month, day);
  
  const data = await get(url, {
    cacheKey,
    cacheTTL: CACHE_TTL,
  });
  
  const parsed = parseOnThisDayResponse(data, limits);
  
  return {
    ...parsed,
    month,
    day,
    _stale: data._stale || false,
  };
}


/**
 * Fetch only events for a specific date
 * 
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @param {number} [limit] - Max events to return (default: 10)
 * @returns {Promise<Array>} Array of events
 * @throws {ApiError} On API failure
 * 
 * Requirements: 9.2
 */
export async function getEvents(month, day, limit = DEFAULT_LIMITS.events) {
  const data = await getOnThisDay(month, day, { eventsLimit: limit });
  return data.events;
}

/**
 * Fetch only births for a specific date
 * 
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @param {number} [limit] - Max births to return (default: 5)
 * @returns {Promise<Array>} Array of births
 * @throws {ApiError} On API failure
 * 
 * Requirements: 9.3
 */
export async function getBirths(month, day, limit = DEFAULT_LIMITS.births) {
  const data = await getOnThisDay(month, day, { birthsLimit: limit });
  return data.births;
}

/**
 * Fetch only deaths for a specific date
 * 
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @param {number} [limit] - Max deaths to return (default: 3)
 * @returns {Promise<Array>} Array of deaths
 * @throws {ApiError} On API failure
 * 
 * Requirements: 9.3
 */
export async function getDeaths(month, day, limit = DEFAULT_LIMITS.deaths) {
  const data = await getOnThisDay(month, day, { deathsLimit: limit });
  return data.deaths;
}

/**
 * Check if a date matches the user's birthday
 * 
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @param {Object} birthday - User's birthday { month, day }
 * @returns {boolean} True if date matches birthday
 * 
 * Requirements: 9.6
 */
export function isBirthday(month, day, birthday) {
  if (!birthday || typeof birthday !== 'object') {
    return false;
  }
  return birthday.month === month && birthday.day === day;
}

/**
 * Format an event for Teletext display
 * 
 * @param {Object} entry - Event/birth/death entry
 * @returns {string} Formatted string for display
 * 
 * @example
 * formatEntry({ year: 1969, description: 'Apollo 11 lands on the Moon' })
 * // Returns: "1969: Apollo 11 lands on the Moon"
 */
export function formatEntry(entry) {
  if (!entry || typeof entry.year !== 'number') {
    return '';
  }
  return `${entry.year}: ${entry.description || 'UNKNOWN EVENT'}`;
}

/**
 * Get a random historical event for a date
 * Useful for "Random Date" feature
 * 
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @returns {Promise<Object|null>} Random event or null
 */
export async function getRandomEvent(month, day) {
  try {
    const data = await getOnThisDay(month, day, { eventsLimit: 50 });
    if (data.events.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * data.events.length);
    return data.events[randomIndex];
  } catch {
    return null;
  }
}

/**
 * Get events for a specific year on a date
 * 
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @param {number} year - Year to filter by
 * @returns {Promise<Array>} Events from that year
 */
export async function getEventsForYear(month, day, year) {
  const data = await getOnThisDay(month, day, { eventsLimit: 100 });
  return data.events.filter(e => e.year === year);
}

// ============================================
// NEW: Enhanced API Functions
// ============================================

/**
 * Get comprehensive "On This Day" data with all categories
 * This is the main function for the enhanced Time Machine
 * 
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @returns {Promise<Object>} Complete historical data for the date
 */
export async function getEnhancedOnThisDay(month, day) {
  // Validate date parameters
  if (!isValidDate(month, day)) {
    throw new ApiError(
      ErrorTypes.VALIDATION,
      'INVALID DATE',
      { retryable: false }
    );
  }
  
  const paddedMonth = zeroPad(month);
  const paddedDay = zeroPad(day);
  const url = `${WIKIPEDIA_API_BASE}/all/${paddedMonth}/${paddedDay}`;
  const cacheKey = `wikipedia_enhanced_${month}_${day}`;
  
  const data = await get(url, {
    cacheKey,
    cacheTTL: CACHE_TTL,
  });
  
  const parsed = parseOnThisDayResponse(data, DEFAULT_LIMITS);
  
  return {
    ...parsed,
    month,
    day,
    dateString: formatDateString(month, day),
    _stale: data._stale || false,
  };
}

/**
 * Get only featured/selected events for a date
 * These are Wikipedia's curated highlights
 * 
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @returns {Promise<Array>} Featured events
 */
export async function getFeaturedEvents(month, day) {
  const data = await getEnhancedOnThisDay(month, day);
  return data.selected;
}

/**
 * Get holidays for a specific date
 * 
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @returns {Promise<Array>} Holidays
 */
export async function getHolidays(month, day) {
  const data = await getEnhancedOnThisDay(month, day);
  return data.holidays;
}

/**
 * Get a single event by index for detail view
 * 
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @param {string} category - Category ('events', 'births', 'deaths', 'selected')
 * @param {number} index - Index in the category array
 * @returns {Promise<Object|null>} Event details or null
 */
export async function getEventDetail(month, day, category, index) {
  const data = await getEnhancedOnThisDay(month, day);
  const categoryData = data[category];
  
  if (!categoryData || index < 0 || index >= categoryData.length) {
    return null;
  }
  
  const event = categoryData[index];
  
  return {
    ...event,
    index,
    totalInCategory: categoryData.length,
    hasNext: index < categoryData.length - 1,
    hasPrev: index > 0,
    category,
  };
}

/**
 * Format date as readable string (e.g., "DECEMBER 4")
 * 
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @returns {string} Formatted date string
 */
function formatDateString(month, day) {
  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];
  return `${monthNames[month - 1]} ${day}`;
}

/**
 * Get summary statistics for a date
 * Useful for displaying counts in the UI
 * 
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @returns {Promise<Object>} Statistics
 */
export async function getDateStats(month, day) {
  const data = await getEnhancedOnThisDay(month, day);
  
  return {
    events: data.totalEvents,
    births: data.totalBirths,
    deaths: data.totalDeaths,
    holidays: data.totalHolidays,
    featured: data.totalSelected,
    total: data.totalEvents + data.totalBirths + data.totalDeaths,
  };
}

/**
 * Search events by keyword
 * 
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @param {string} keyword - Search keyword
 * @returns {Promise<Array>} Matching events
 */
export async function searchEvents(month, day, keyword) {
  const data = await getEnhancedOnThisDay(month, day);
  const lowerKeyword = keyword.toLowerCase();
  
  const allItems = [
    ...data.events,
    ...data.births,
    ...data.deaths,
  ];
  
  return allItems.filter(item => 
    item.fullDescription.toLowerCase().includes(lowerKeyword) ||
    item.pageTitle?.toLowerCase().includes(lowerKeyword)
  );
}

/**
 * Get events grouped by century
 * Useful for timeline view
 * 
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @returns {Promise<Object>} Events grouped by century
 */
export async function getEventsByCentury(month, day) {
  const data = await getEnhancedOnThisDay(month, day);
  
  const byCentury = {};
  
  data.events.forEach(event => {
    const century = Math.ceil(event.year / 100);
    const centuryLabel = `${century}${getOrdinalSuffix(century)} CENTURY`;
    
    if (!byCentury[centuryLabel]) {
      byCentury[centuryLabel] = [];
    }
    byCentury[centuryLabel].push(event);
  });
  
  return byCentury;
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 * @param {number} n - Number
 * @returns {string} Ordinal suffix
 */
function getOrdinalSuffix(n) {
  const s = ['TH', 'ST', 'ND', 'RD'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ============================================
// Exports for Testing
// ============================================

export {
  CACHE_TTL,
  DEFAULT_LIMITS,
  MAX_DESCRIPTION_LENGTH,
  MAX_DETAIL_LENGTH,
  zeroPad,
  truncateText,
  getCacheKey,
  parseEntry,
  parseHoliday,
  parseOnThisDayResponse,
  isValidDate,
  formatDateString,
  getOrdinalSuffix,
};
