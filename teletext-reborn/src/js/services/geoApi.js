/**
 * Teletext Reborn - Geolocation API Service
 * 
 * Integrates with IP-API for IP-based location detection.
 * Returns city, latitude, and longitude for weather and other location-based features.
 * 
 * @module services/geoApi
 * Requirements: 6.1, 12.3
 */

import { get, CacheTTL } from './api.js';

// ============================================
// Constants
// ============================================

/**
 * IP-API endpoint for geolocation
 * Note: Using HTTP as IP-API free tier doesn't support HTTPS
 * @see https://ip-api.com/docs/api:json
 */
const GEO_API = 'http://ip-api.com/json';

/**
 * Cache key for geolocation data
 * Session-based caching - location doesn't change during a session
 */
const CACHE_KEY = 'geolocation';

/**
 * Cache TTL - 24 hours (effectively session-based for most users)
 * IP-API has 45 requests/minute limit, so we cache aggressively
 * Note: Using ONE_DAY instead of SESSION because Infinity doesn't serialize to JSON
 */
const CACHE_TTL = CacheTTL.ONE_DAY;

/**
 * Default location when geolocation fails (London, UK)
 * Per Req 10.5: Default to a major city
 */
export const DEFAULT_LOCATION = {
  city: 'LONDON',
  lat: 51.5074,
  lon: -0.1278,
  country: 'UK',
  isDefault: true,
};

// ============================================
// Helper Functions
// ============================================

/**
 * Parse IP-API response into location object
 * @param {Object} data - Raw API response
 * @returns {Object} Parsed location data
 */
function parseLocationResponse(data) {
  // IP-API returns status: 'success' or 'fail'
  if (data.status === 'fail') {
    return null;
  }
  
  return {
    city: (data.city || 'UNKNOWN').toUpperCase(),
    lat: data.lat,
    lon: data.lon,
    country: (data.countryCode || data.country || '').toUpperCase(),
    region: (data.regionName || data.region || '').toUpperCase(),
    timezone: data.timezone || null,
    isp: data.isp || null,
    isDefault: false,
  };
}

/**
 * Validate location object has required fields
 * @param {Object} location - Location object to validate
 * @returns {boolean} True if valid
 */
export function isValidLocation(location) {
  if (!location || typeof location !== 'object') {
    return false;
  }
  
  const { city, lat, lon } = location;
  
  // City must be a non-empty string
  if (typeof city !== 'string' || city.trim().length === 0) {
    return false;
  }
  
  // Latitude must be a number between -90 and 90
  if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) {
    return false;
  }
  
  // Longitude must be a number between -180 and 180
  if (typeof lon !== 'number' || isNaN(lon) || lon < -180 || lon > 180) {
    return false;
  }
  
  return true;
}

/**
 * Format location for display
 * @param {Object} location - Location object
 * @returns {string} Formatted location string (e.g., "LONDON, UK")
 */
export function formatLocation(location) {
  if (!location || !location.city) {
    return 'UNKNOWN';
  }
  
  const city = location.city.toUpperCase();
  const country = location.country ? location.country.toUpperCase() : '';
  
  if (country && country !== city) {
    return `${city}, ${country}`;
  }
  
  return city;
}

// ============================================
// Main API Functions
// ============================================

/**
 * Detect user's location via IP geolocation
 * 
 * Uses IP-API to determine the user's approximate location based on their IP address.
 * Results are cached for the session to minimize API calls (45/min rate limit).
 * 
 * @returns {Promise<Object>} Location data with city, lat, lon
 * @throws {ApiError} On API failure (after returning default location)
 * 
 * Requirements: 6.1, 12.3
 * 
 * @example
 * const location = await detectLocation();
 * // Returns:
 * // {
 * //   city: 'LONDON',
 * //   lat: 51.5074,
 * //   lon: -0.1278,
 * //   country: 'UK',
 * //   region: 'ENGLAND',
 * //   timezone: 'Europe/London',
 * //   isDefault: false
 * // }
 */
export async function detectLocation() {
  try {
    const data = await get(GEO_API, {
      cacheKey: CACHE_KEY,
      cacheTTL: CACHE_TTL,
    });
    
    const location = parseLocationResponse(data);
    
    if (!location || !isValidLocation(location)) {
      // API returned invalid data, return default
      return { ...DEFAULT_LOCATION };
    }
    
    return location;
    
  } catch {
    // On any error, return default location
    // This ensures the app continues to work even without geolocation
    return { ...DEFAULT_LOCATION };
  }
}

/**
 * Get location from saved settings or detect via IP
 * 
 * First checks if user has a saved location preference.
 * If not, attempts IP-based detection.
 * Falls back to default location if all else fails.
 * 
 * @param {Object|null} savedLocation - Saved location from settings
 * @returns {Promise<Object>} Location data
 * 
 * Requirements: 6.1
 * 
 * @example
 * const settings = stateManager.getSettings();
 * const location = await getLocation(settings.location);
 */
export async function getLocation(savedLocation = null) {
  // If user has a valid saved location, use it
  if (savedLocation && isValidLocation(savedLocation)) {
    return {
      ...savedLocation,
      city: savedLocation.city.toUpperCase(),
      isDefault: false,
    };
  }
  
  // Otherwise, detect via IP
  return detectLocation();
}

/**
 * Create a location object from user input
 * 
 * Used when user manually enters a city name.
 * Note: This creates a location without coordinates - 
 * the weather API will need to geocode the city name.
 * 
 * @param {string} cityName - City name entered by user
 * @param {number} [lat] - Optional latitude
 * @param {number} [lon] - Optional longitude
 * @param {string} [country] - Optional country code
 * @returns {Object|null} Location object or null if invalid
 */
export function createLocation(cityName, lat = null, lon = null, country = '') {
  if (!cityName || typeof cityName !== 'string') {
    return null;
  }
  
  const city = cityName.trim().toUpperCase();
  
  if (city.length === 0) {
    return null;
  }
  
  // If coordinates provided, validate them
  if (lat !== null && lon !== null) {
    if (typeof lat !== 'number' || typeof lon !== 'number' ||
        isNaN(lat) || isNaN(lon) ||
        lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return null;
    }
    
    return {
      city,
      lat,
      lon,
      country: country ? country.toUpperCase() : '',
      isDefault: false,
    };
  }
  
  // Without coordinates, return partial location
  // The weather service will need to handle geocoding
  return {
    city,
    lat: null,
    lon: null,
    country: country ? country.toUpperCase() : '',
    isDefault: false,
    needsGeocoding: true,
  };
}

/**
 * Clear cached geolocation data
 * Useful when user wants to re-detect their location
 */
export function clearLocationCache() {
  try {
    localStorage.removeItem(`teletext_cache_${CACHE_KEY}`);
  } catch {
    // Ignore localStorage errors
  }
}

// ============================================
// Exports for Testing
// ============================================

export {
  GEO_API,
  CACHE_KEY,
  CACHE_TTL,
  parseLocationResponse,
};
