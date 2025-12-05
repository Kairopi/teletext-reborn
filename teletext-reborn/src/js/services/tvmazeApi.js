/**
 * Teletext Reborn - TVmaze API Service
 * 
 * Provides TV schedule data from TVmaze API with:
 * - Schedule fetching by country and date
 * - 15-minute cache TTL
 * - Error handling with cache fallback
 * - Display formatting helpers
 * 
 * @module services/tvmazeApi
 * Requirements: 32.1, 32.2, 32.3, 32.4, 25.3, 26.4-26.7
 */

import { getStateManager } from '../state.js';

// ============================================
// Constants
// ============================================

/** TVmaze API base URL (Req 32.1) */
const TVMAZE_API = 'https://api.tvmaze.com';

/** Cache TTL: 15 minutes (Req 32.3) */
const CACHE_TTL = 15 * 60 * 1000;

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT = 10000;

/** Maximum shows to display per page */
const MAX_SHOWS_PER_PAGE = 8;

/** Maximum title length for display */
const MAX_TITLE_LENGTH = 22;

/** Maximum channel name length for display */
const MAX_CHANNEL_LENGTH = 6;

/** Debug mode flag */
const DEBUG = import.meta.env?.DEV || false;

/**
 * Debug logging helper
 * @param {string} message - Log message
 * @param {any} [data] - Optional data to log
 */
function debugLog(message, data) {
  if (DEBUG) console.debug(`[TVmazeAPI] ${message}`, data !== undefined ? data : '');
}

// ============================================
// Cache Management
// ============================================

/**
 * Generate cache key for TV schedule
 * @param {string} country - Country code
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {string} Cache key
 */
function getCacheKey(country, date) {
  return `tv_schedule_${country}_${date}`;
}

/**
 * Get data from cache if not expired
 * @param {string} key - Cache key
 * @returns {Object|null} Cached data or null
 */
function getFromCache(key) {
  try {
    const cacheKey = `teletext_cache_${key}`;
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      const entry = JSON.parse(stored);
      const isExpired = Date.now() - entry.timestamp > entry.ttl;
      if (!isExpired) {
        debugLog('Cache hit', key);
        return entry.data;
      }
      debugLog('Cache expired', key);
    }
  } catch (e) {
    debugLog('Cache read error', e);
  }
  return null;
}

/**
 * Save data to cache with TTL
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 * @param {number} ttl - Time to live in milliseconds
 */
function saveToCache(key, data, ttl) {
  try {
    const cacheKey = `teletext_cache_${key}`;
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now(),
      ttl
    }));
    debugLog('Cache saved', key);
  } catch (e) {
    debugLog('Cache save error', e);
  }
}

/**
 * Get stale cache data (ignoring TTL expiration)
 * Used as fallback when API fails (Req 32.4)
 * @param {string} key - Cache key
 * @returns {Object|null} Cached data or null
 */
function getStaleCache(key) {
  try {
    const cacheKey = `teletext_cache_${key}`;
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      const entry = JSON.parse(stored);
      debugLog('Using stale cache', key);
      return { ...entry.data, _stale: true };
    }
  } catch (e) {
    debugLog('Stale cache read error', e);
  }
  return null;
}

/**
 * Check if cache is fresh (not expired)
 * @param {string} key - Cache key
 * @returns {boolean} True if cache is fresh
 */
export function isCacheFresh(key) {
  try {
    const cacheKey = `teletext_cache_${key}`;
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      const entry = JSON.parse(stored);
      return Date.now() - entry.timestamp <= entry.ttl;
    }
  } catch (e) {
    // Ignore errors
  }
  return false;
}

/**
 * Get cache age in milliseconds
 * @param {string} key - Cache key
 * @returns {number|null} Cache age in ms or null if not cached
 */
export function getCacheAge(key) {
  try {
    const cacheKey = `teletext_cache_${key}`;
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      const entry = JSON.parse(stored);
      return Date.now() - entry.timestamp;
    }
  } catch (e) {
    // Ignore errors
  }
  return null;
}

// ============================================
// API Functions
// ============================================

/**
 * Parse TVmaze API response into our data model
 * @param {Array} data - Raw API response
 * @returns {Array<TVShow>} Parsed shows sorted by airtime
 */
export function parseSchedule(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map(item => ({
      id: item.id,
      name: item.show?.name || 'Unknown',
      channel: item.show?.network?.name || item.show?.webChannel?.name || 'N/A',
      airtime: item.airtime || '00:00',
      runtime: item.runtime || 30,
      genres: item.show?.genres || [],
      summary: (item.show?.summary || '').replace(/<[^>]*>/g, '').trim()
    }))
    .sort((a, b) => a.airtime.localeCompare(b.airtime));
}

/**
 * Fetch TV schedule from TVmaze API
 * @param {string} [country='US'] - Country code (Req 32.2)
 * @param {string|null} [date=null] - Date in YYYY-MM-DD format (Req 32.2)
 * @returns {Promise<TVSchedule>} Schedule data
 * @throws {Error} On network failure with no cache available
 * 
 * Requirements: 32.1, 32.2, 32.3, 32.4
 */
export async function getSchedule(country = 'US', date = null) {
  // Default to today's date if not provided
  const dateStr = date || new Date().toISOString().split('T')[0];
  const cacheKey = getCacheKey(country, dateStr);

  // Check cache first (Req 32.3)
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  // Build API URL (Req 32.1, 32.2)
  const url = `${TVMAZE_API}/schedule?country=${encodeURIComponent(country)}&date=${encodeURIComponent(dateStr)}`;
  debugLog('Fetching schedule', { country, date: dateStr, url });

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const rawData = await response.json();
    const shows = parseSchedule(rawData);

    const result = {
      date: dateStr,
      country,
      shows,
      totalResults: shows.length,
      lastUpdated: new Date().toISOString(),
      _cached: false,
      _stale: false
    };

    // Save to cache (Req 32.3)
    saveToCache(cacheKey, result, CACHE_TTL);
    debugLog('Schedule fetched', { country, date: dateStr, showCount: shows.length });

    return result;

  } catch (error) {
    debugLog('API error', error.message);

    // Try stale cache on error (Req 32.4)
    const staleData = getStaleCache(cacheKey);
    if (staleData) {
      return staleData;
    }

    // Re-throw if no cache available
    throw new Error(`Failed to fetch TV schedule: ${error.message}`);
  }
}

// ============================================
// Display Helpers
// ============================================

/**
 * Get genre icon for display (Req 26.5, 26.6, 26.7)
 * @param {string[]} genres - Array of genre strings
 * @returns {string} Genre icon emoji or empty string
 */
export function getGenreIcon(genres) {
  if (!Array.isArray(genres) || genres.length === 0) {
    return '';
  }

  const genresLower = genres.map(g => (g || '').toLowerCase());

  // Film/Movie (Req 26.5)
  if (genresLower.some(g => g.includes('drama') || g.includes('thriller') || g.includes('horror') || g.includes('romance') || g.includes('comedy') || g.includes('action'))) {
    return '[F]';
  }

  // Sports (Req 26.6)
  if (genresLower.some(g => g.includes('sport') || g.includes('football') || g.includes('basketball') || g.includes('baseball') || g.includes('soccer') || g.includes('tennis') || g.includes('golf'))) {
    return '[S]';
  }

  // News (Req 26.7)
  if (genresLower.some(g => g.includes('news') || g.includes('documentary') || g.includes('talk show'))) {
    return '[N]';
  }

  return '';
}

/**
 * Format a show for Teletext display
 * @param {TVShow} show - Show object
 * @returns {FormattedShow} Formatted show for display
 * 
 * Requirements: 25.3, 26.4
 */
export function formatShowForDisplay(show) {
  if (!show) {
    return {
      time: '00:00',
      channel: 'N/A',
      title: 'Unknown',
      genreIcon: '',
      fullTitle: 'Unknown',
      runtime: 30,
      genres: []
    };
  }

  // Truncate title to max length (Req 25.3)
  let title = show.name || 'Unknown';
  if (title.length > MAX_TITLE_LENGTH) {
    title = title.substring(0, MAX_TITLE_LENGTH - 1) + '…';
  }

  // Truncate channel name
  let channel = show.channel || 'N/A';
  if (channel.length > MAX_CHANNEL_LENGTH) {
    channel = channel.substring(0, MAX_CHANNEL_LENGTH);
  }

  return {
    time: show.airtime || '00:00',
    channel: channel.toUpperCase(),
    title,
    genreIcon: getGenreIcon(show.genres),
    fullTitle: show.name || 'Unknown',
    runtime: show.runtime || 30,
    genres: show.genres || []
  };
}

/**
 * Format multiple shows for display
 * @param {TVShow[]} shows - Array of shows
 * @param {number} [limit=MAX_SHOWS_PER_PAGE] - Maximum shows to return
 * @returns {FormattedShow[]} Formatted shows
 */
export function formatShowsForDisplay(shows, limit = MAX_SHOWS_PER_PAGE) {
  if (!Array.isArray(shows)) {
    return [];
  }
  return shows.slice(0, limit).map(formatShowForDisplay);
}

/**
 * Check if a show is currently airing
 * @param {TVShow} show - Show object
 * @returns {boolean} True if show is currently on
 */
export function isShowCurrentlyAiring(show) {
  if (!show || !show.airtime) {
    return false;
  }

  const now = new Date();
  const [hours, minutes] = show.airtime.split(':').map(Number);
  
  const showStart = new Date();
  showStart.setHours(hours, minutes, 0, 0);
  
  const showEnd = new Date(showStart.getTime() + (show.runtime || 30) * 60 * 1000);

  return now >= showStart && now < showEnd;
}

/**
 * Filter shows by time range
 * @param {TVShow[]} shows - Array of shows
 * @param {string} startTime - Start time (HH:MM)
 * @param {string} endTime - End time (HH:MM)
 * @returns {TVShow[]} Filtered shows
 */
export function filterShowsByTimeRange(shows, startTime, endTime) {
  if (!Array.isArray(shows)) {
    return [];
  }

  return shows.filter(show => {
    const airtime = show.airtime || '00:00';
    return airtime >= startTime && airtime < endTime;
  });
}

/**
 * Get prime time shows (19:00-23:00)
 * @param {TVShow[]} shows - Array of shows
 * @returns {TVShow[]} Prime time shows
 */
export function getPrimeTimeShows(shows) {
  return filterShowsByTimeRange(shows, '19:00', '23:00');
}

/**
 * Get shows currently on or starting soon
 * @param {TVShow[]} shows - Array of shows
 * @returns {TVShow[]} Current and upcoming shows
 */
export function getCurrentShows(shows) {
  if (!Array.isArray(shows)) {
    return [];
  }

  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, '0');
  const currentMinute = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${currentHour}:${currentMinute}`;

  // Get shows that started in the last 2 hours or are starting soon
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const twoHoursAgoTime = `${twoHoursAgo.getHours().toString().padStart(2, '0')}:${twoHoursAgo.getMinutes().toString().padStart(2, '0')}`;

  return shows.filter(show => {
    const airtime = show.airtime || '00:00';
    return airtime >= twoHoursAgoTime;
  });
}

/**
 * Group shows by hour
 * @param {TVShow[]} shows - Array of shows
 * @returns {Object<string, TVShow[]>} Shows grouped by hour
 */
export function groupShowsByHour(shows) {
  if (!Array.isArray(shows)) {
    return {};
  }

  const grouped = {};
  shows.forEach(show => {
    const hour = (show.airtime || '00:00').split(':')[0] + ':00';
    if (!grouped[hour]) {
      grouped[hour] = [];
    }
    grouped[hour].push(show);
  });

  return grouped;
}

/**
 * Get today's highlights (featured shows)
 * @param {TVShow[]} shows - Array of shows
 * @param {number} [count=3] - Number of highlights
 * @returns {TVShow[]} Featured shows
 */
export function getHighlights(shows, count = 3) {
  if (!Array.isArray(shows) || shows.length === 0) {
    return [];
  }

  // Get prime time shows from major networks
  const majorNetworks = ['CBS', 'NBC', 'ABC', 'FOX', 'CW'];
  const primeTime = getPrimeTimeShows(shows);
  
  const highlights = primeTime
    .filter(show => majorNetworks.some(net => 
      (show.channel || '').toUpperCase().includes(net)
    ))
    .slice(0, count);

  // If not enough from major networks, fill with any prime time shows
  if (highlights.length < count) {
    const remaining = primeTime
      .filter(show => !highlights.includes(show))
      .slice(0, count - highlights.length);
    highlights.push(...remaining);
  }

  return highlights;
}

/**
 * Clear TV schedule cache
 * @param {string} [country] - Country code (optional, clears all if not provided)
 * @param {string} [date] - Date string (optional)
 */
export function clearScheduleCache(country, date) {
  try {
    if (country && date) {
      const cacheKey = `teletext_cache_${getCacheKey(country, date)}`;
      localStorage.removeItem(cacheKey);
    } else {
      // Clear all TV schedule cache entries
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('tv_schedule_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  } catch (e) {
    debugLog('Cache clear error', e);
  }
}

// ============================================
// Exports for Testing
// ============================================

export {
  TVMAZE_API,
  CACHE_TTL,
  MAX_SHOWS_PER_PAGE,
  MAX_TITLE_LENGTH,
  MAX_CHANNEL_LENGTH,
  getCacheKey
};
