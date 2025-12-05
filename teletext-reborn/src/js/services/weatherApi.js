/**
 * Teletext Reborn - Weather API Service
 * 
 * Integrates with Open-Meteo API for current weather and
 * Open-Meteo Archive API for historical weather data.
 * 
 * @module services/weatherApi
 * Requirements: 6.1-6.7, 10.1-10.5
 */

import { get, buildUrl, CacheTTL, ApiError, ErrorTypes } from './api.js';
import { MIN_YEAR, isInValidRange } from '../utils/date.js';

// ============================================
// Constants
// ============================================

/**
 * Open-Meteo API endpoints
 */
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const HISTORICAL_API = 'https://archive-api.open-meteo.com/v1/archive';

/**
 * Cache TTL values
 */
const CACHE_TTL = {
  CURRENT: CacheTTL.FIFTEEN_MINUTES, // 15 minutes for current weather (Req 6.1-6.7)
  HISTORICAL: CacheTTL.ONE_DAY,      // 24 hours for historical data
};

/**
 * WMO Weather interpretation codes
 * @see https://open-meteo.com/en/docs
 */
const WEATHER_CODES = {
  0: { condition: 'CLEAR SKY', icon: 'sunny' },
  1: { condition: 'MAINLY CLEAR', icon: 'sunny' },
  2: { condition: 'PARTLY CLOUDY', icon: 'partlyCloudy' },
  3: { condition: 'OVERCAST', icon: 'cloudy' },
  45: { condition: 'FOG', icon: 'foggy' },
  48: { condition: 'DEPOSITING RIME FOG', icon: 'foggy' },
  51: { condition: 'LIGHT DRIZZLE', icon: 'rainy' },
  53: { condition: 'MODERATE DRIZZLE', icon: 'rainy' },
  55: { condition: 'DENSE DRIZZLE', icon: 'rainy' },
  56: { condition: 'LIGHT FREEZING DRIZZLE', icon: 'rainy' },
  57: { condition: 'DENSE FREEZING DRIZZLE', icon: 'rainy' },
  61: { condition: 'SLIGHT RAIN', icon: 'rainy' },
  63: { condition: 'MODERATE RAIN', icon: 'rainy' },
  65: { condition: 'HEAVY RAIN', icon: 'rainy' },
  66: { condition: 'LIGHT FREEZING RAIN', icon: 'rainy' },
  67: { condition: 'HEAVY FREEZING RAIN', icon: 'rainy' },
  71: { condition: 'SLIGHT SNOW', icon: 'snowy' },
  73: { condition: 'MODERATE SNOW', icon: 'snowy' },
  75: { condition: 'HEAVY SNOW', icon: 'snowy' },
  77: { condition: 'SNOW GRAINS', icon: 'snowy' },
  80: { condition: 'SLIGHT RAIN SHOWERS', icon: 'rainy' },
  81: { condition: 'MODERATE RAIN SHOWERS', icon: 'rainy' },
  82: { condition: 'VIOLENT RAIN SHOWERS', icon: 'rainy' },
  85: { condition: 'SLIGHT SNOW SHOWERS', icon: 'snowy' },
  86: { condition: 'HEAVY SNOW SHOWERS', icon: 'snowy' },
  95: { condition: 'THUNDERSTORM', icon: 'stormy' },
  96: { condition: 'THUNDERSTORM WITH SLIGHT HAIL', icon: 'stormy' },
  99: { condition: 'THUNDERSTORM WITH HEAVY HAIL', icon: 'stormy' },
};

/**
 * Default weather code for unknown codes
 */
const DEFAULT_WEATHER = { condition: 'UNKNOWN', icon: 'cloudy' };

// ============================================
// Helper Functions
// ============================================

/**
 * Convert WMO weather code to human-readable condition
 * @param {number} code - WMO weather code
 * @returns {{ condition: string, icon: string }}
 */
export function weatherCodeToCondition(code) {
  return WEATHER_CODES[code] || DEFAULT_WEATHER;
}

/**
 * Convert temperature between Celsius and Fahrenheit
 * @param {number} celsius - Temperature in Celsius
 * @param {string} unit - Target unit ('celsius' or 'fahrenheit')
 * @returns {number} Converted temperature
 */
export function convertTemperature(celsius, unit = 'celsius') {
  if (unit === 'fahrenheit') {
    return Math.round((celsius * 9/5) + 32);
  }
  return Math.round(celsius);
}

/**
 * Format temperature with unit symbol
 * @param {number} temp - Temperature value
 * @param {string} unit - Unit ('celsius' or 'fahrenheit')
 * @returns {string} Formatted temperature (e.g., "15°C")
 */
export function formatTemperature(temp, unit = 'celsius') {
  const symbol = unit === 'fahrenheit' ? '°F' : '°C';
  return `${Math.round(temp)}${symbol}`;
}

/**
 * Generate cache key for weather data
 * @param {string} type - 'current' or 'historical'
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} [dateStr] - Date string for historical data
 * @returns {string} Cache key
 */
function getCacheKey(type, lat, lon, dateStr = null) {
  const coords = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
  if (dateStr) {
    return `weather_${type}_${coords}_${dateStr}`;
  }
  return `weather_${type}_${coords}`;
}

/**
 * Parse current weather response from Open-Meteo API
 * @param {Object} data - API response
 * @param {string} location - Location name
 * @returns {Object} Parsed weather data
 */
function parseCurrentWeather(data, location) {
  const current = data.current || {};
  const daily = data.daily || {};
  const { condition, icon } = weatherCodeToCondition(current.weather_code);
  
  return {
    location,
    current: {
      temperature: current.temperature_2m ?? null,
      condition,
      icon,
      humidity: current.relative_humidity_2m ?? null,
      windSpeed: current.wind_speed_10m ?? null,
      weatherCode: current.weather_code ?? null,
    },
    forecast: parseForecast(daily),
    _stale: data._stale || false,
  };
}

/**
 * Parse forecast data from Open-Meteo API
 * @param {Object} daily - Daily forecast data
 * @returns {Array} Array of forecast objects
 */
function parseForecast(daily) {
  if (!daily || !daily.time) {
    return [];
  }
  
  return daily.time.map((date, i) => {
    const { condition, icon } = weatherCodeToCondition(daily.weather_code?.[i]);
    return {
      date,
      high: daily.temperature_2m_max?.[i] ?? null,
      low: daily.temperature_2m_min?.[i] ?? null,
      condition,
      icon,
      weatherCode: daily.weather_code?.[i] ?? null,
    };
  });
}

/**
 * Parse historical weather response from Open-Meteo Archive API
 * @param {Object} data - API response
 * @param {string} location - Location name
 * @param {string} dateStr - Date string
 * @returns {Object} Parsed historical weather data
 */
function parseHistoricalWeather(data, location, dateStr) {
  const daily = data.daily || {};
  const { condition, icon } = weatherCodeToCondition(daily.weather_code?.[0]);
  
  return {
    location,
    date: dateStr,
    high: daily.temperature_2m_max?.[0] ?? null,
    low: daily.temperature_2m_min?.[0] ?? null,
    precipitation: daily.precipitation_sum?.[0] ?? null,
    condition,
    icon,
    weatherCode: daily.weather_code?.[0] ?? null,
    _stale: data._stale || false,
  };
}

// ============================================
// Main API Functions
// ============================================

/**
 * Fetch current weather and 5-day forecast
 * 
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} [location=''] - Location name for display
 * @returns {Promise<Object>} Weather data
 * @throws {ApiError} On API failure
 * 
 * Requirements: 6.1-6.7
 * 
 * @example
 * const weather = await getCurrentWeather(51.5074, -0.1278, 'London');
 * // Returns:
 * // {
 * //   location: 'London',
 * //   current: { temperature: 15, condition: 'PARTLY CLOUDY', humidity: 65, windSpeed: 12 },
 * //   forecast: [{ date: '2025-12-03', high: 18, low: 10, condition: 'SUNNY' }, ...]
 * // }
 */
export async function getCurrentWeather(lat, lon, location = '') {
  // Validate coordinates
  if (typeof lat !== 'number' || typeof lon !== 'number' ||
      isNaN(lat) || isNaN(lon) ||
      lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new ApiError(
      ErrorTypes.VALIDATION,
      'INVALID COORDINATES',
      { retryable: false }
    );
  }
  
  const url = buildUrl(WEATHER_API, {
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code',
    forecast_days: 5,
    timezone: 'auto',
  });
  
  const cacheKey = getCacheKey('current', lat, lon);
  
  const data = await get(url, {
    cacheKey,
    cacheTTL: CACHE_TTL.CURRENT,
  });
  
  return parseCurrentWeather(data, location);
}

/**
 * Fetch historical weather for a specific date
 * 
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {Date} date - Historical date to fetch
 * @param {string} [location=''] - Location name for display
 * @returns {Promise<Object>} Historical weather data
 * @throws {ApiError} On API failure or invalid date
 * 
 * Requirements: 10.1-10.5
 * 
 * @example
 * const weather = await getHistoricalWeather(51.5074, -0.1278, new Date(1969, 6, 20), 'London');
 * // Returns:
 * // {
 * //   location: 'London',
 * //   date: '1969-07-20',
 * //   high: 22,
 * //   low: 14,
 * //   precipitation: 0,
 * //   condition: 'CLEAR SKY'
 * // }
 */
export async function getHistoricalWeather(lat, lon, date, location = '') {
  // Validate coordinates
  if (typeof lat !== 'number' || typeof lon !== 'number' ||
      isNaN(lat) || isNaN(lon) ||
      lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new ApiError(
      ErrorTypes.VALIDATION,
      'INVALID COORDINATES',
      { retryable: false }
    );
  }
  
  // Validate date object
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new ApiError(
      ErrorTypes.VALIDATION,
      'INVALID DATE',
      { retryable: false }
    );
  }
  
  // Check if date is before 1940 (Req 10.3)
  if (date.getFullYear() < MIN_YEAR) {
    return {
      location,
      date: formatDateISO(date),
      error: true,
      message: `WEATHER DATA FROM ${MIN_YEAR} ONLY`,
      _stale: false,
    };
  }
  
  // Check if date is in valid range (not in the future)
  if (!isInValidRange(date)) {
    throw new ApiError(
      ErrorTypes.VALIDATION,
      'DATE MUST BE 1940 TO YESTERDAY',
      { retryable: false }
    );
  }
  
  const dateStr = formatDateISO(date);
  
  const url = buildUrl(HISTORICAL_API, {
    latitude: lat,
    longitude: lon,
    start_date: dateStr,
    end_date: dateStr,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code',
  });
  
  const cacheKey = getCacheKey('historical', lat, lon, dateStr);
  
  const data = await get(url, {
    cacheKey,
    cacheTTL: CACHE_TTL.HISTORICAL,
  });
  
  return parseHistoricalWeather(data, location, dateStr);
}

/**
 * Format date as ISO string (YYYY-MM-DD)
 * @param {Date} date - Date to format
 * @returns {string} ISO date string
 */
function formatDateISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if historical weather data is available for a date
 * Data is available from 1940 onwards
 * 
 * @param {Date} date - Date to check
 * @returns {boolean} True if data is available
 * 
 * Requirements: 10.3
 */
export function isHistoricalDataAvailable(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return false;
  }
  return date.getFullYear() >= MIN_YEAR && isInValidRange(date);
}

/**
 * Get weather comparison text (e.g., "5°C warmer than usual")
 * 
 * @param {number} actual - Actual temperature
 * @param {number} average - Average temperature
 * @param {string} [unit='celsius'] - Temperature unit
 * @returns {string} Comparison text
 * 
 * Requirements: 10.4
 */
export function getTemperatureComparison(actual, average, unit = 'celsius') {
  if (typeof actual !== 'number' || typeof average !== 'number' ||
      isNaN(actual) || isNaN(average)) {
    return '';
  }
  
  const diff = Math.round(actual - average);
  const symbol = unit === 'fahrenheit' ? '°F' : '°C';
  
  if (diff === 0) {
    return 'AVERAGE FOR THIS DATE';
  } else if (diff > 0) {
    return `${diff}${symbol} WARMER THAN USUAL`;
  } else {
    return `${Math.abs(diff)}${symbol} COOLER THAN USUAL`;
  }
}

// ============================================
// Exports for Testing
// ============================================

export {
  WEATHER_CODES,
  CACHE_TTL,
  getCacheKey,
  parseCurrentWeather,
  parseHistoricalWeather,
  formatDateISO,
};
