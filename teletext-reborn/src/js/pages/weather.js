/**
 * Teletext Reborn - Weather Pages (Pages 200-209)
 * 
 * Displays current weather conditions and 5-day forecast with:
 * - ASCII art weather icons
 * - Current conditions (temperature, humidity, wind)
 * - 5-day forecast with high/low temperatures
 * - Location display
 * - Temperature unit toggle support
 * 
 * @module pages/weather
 * Requirements: 6.1-6.7
 */

import gsap from 'gsap';
import { PAGE_NUMBERS } from '../router.js';
import { getStateManager } from '../state.js';
import { truncateToWidth, centerText, createSeparator } from '../utils/teletext.js';
import { getLocation, formatLocation } from '../services/geoApi.js';
import { getCurrentWeather, formatTemperature } from '../services/weatherApi.js';

// ============================================
// Constants
// ============================================

/**
 * Page number for weather page
 * @constant {number}
 */
export const PAGE_NUMBER = PAGE_NUMBERS.WEATHER;

/**
 * Page title
 * @constant {string}
 */
export const TITLE = '☀ WEATHER ☀';

/**
 * ASCII art weather icons using block characters
 * Requirements: 6.4, 32.4
 * Uses Unicode block characters: █ ▀ ▄ ▌ ▐ ░ ▒ ▓
 * @constant {Object}
 */
export const WEATHER_ICONS = {
  sunny: [
    '    ░ ░▓░ ░      ',
    '   ░ ▓███▓ ░     ',
    '  ░▓███████▓░    ',
    '   ░ ▓███▓ ░     ',
    '    ░ ░▓░ ░      '
  ],
  
  cloudy: [
    '                 ',
    '     ░▒▓▓▒░      ',
    '   ░▒▓████▓▒░    ',
    '  ▒▓██████████▓  ',
    '   ░▒▓▓▓▓▓▓▒░    '
  ],
  
  rainy: [
    '     ░▒▓▓▒░      ',
    '   ░▒▓████▓▒░    ',
    '  ▒▓██████████▓  ',
    '   │ │ │ │ │     ',
    '  │ │ │ │ │ │    '
  ],
  
  snowy: [
    '     ░▒▓▓▒░      ',
    '   ░▒▓████▓▒░    ',
    '  ▒▓██████████▓  ',
    '   * ░ * ░ *     ',
    '  ░ * ░ * ░ *    '
  ],
  
  stormy: [
    '     ░▒▓▓▒░      ',
    '   ░▒▓████▓▒░    ',
    '  ▒▓██████████▓  ',
    '    ⚡│ ⚡│      ',
    '   │ ⚡│ ⚡│     '
  ],
  
  partlyCloudy: [
    '   ░▓██▓░        ',
    '  ▓████▓ ░▒▓▒░   ',
    '   ░▓█▓▒▓███▓▒   ',
    '     ▒▓██████▓   ',
    '      ░▒▓▓▒░     '
  ],
  
  foggy: [
    '  ░░░░░░░░░░░░   ',
    '  ▒▒▒▒▒▒▒▒▒▒▒▒   ',
    '  ░░░░░░░░░░░░   ',
    '  ▒▒▒▒▒▒▒▒▒▒▒▒   ',
    '  ░░░░░░░░░░░░   '
  ],
  
  unknown: [
    '                 ',
    '      ░▒▓▒░      ',
    '     ▓█ ? █▓     ',
    '      ░▒▓▒░      ',
    '                 '
  ]
};

/**
 * Day names for forecast display
 * @constant {string[]}
 */
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * Auto-refresh interval (5 minutes)
 * @constant {number}
 */
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;

// ============================================
// State
// ============================================

/**
 * Current weather data
 * @type {Object|null}
 */
let weatherData = null;

/**
 * Current location data
 * @type {Object|null}
 */
let locationData = null;

/**
 * Loading state
 * @type {boolean}
 */
let isLoading = false;

/**
 * Error state
 * @type {string|null}
 */
let errorMessage = null;

/**
 * Auto-refresh timer
 * @type {number|null}
 */
let refreshTimer = null;

/**
 * GSAP timeline for animations
 * @type {gsap.core.Timeline|null}
 */
let animationTimeline = null;

// ============================================
// Helper Functions
// ============================================

/**
 * Get ASCII art icon for weather condition
 * @param {string} iconType - Icon type (sunny, cloudy, rainy, snowy, stormy)
 * @returns {string[]} Array of icon lines
 */
export function getWeatherIcon(iconType) {
  return WEATHER_ICONS[iconType] || WEATHER_ICONS.unknown;
}

/**
 * Get day name from date string
 * @param {string} dateStr - ISO date string (YYYY-MM-DD)
 * @returns {string} Day name (e.g., "MON")
 */
function getDayName(dateStr) {
  const date = new Date(dateStr);
  return DAY_NAMES[date.getDay()];
}

/**
 * Format wind speed for display
 * @param {number|null} speed - Wind speed in km/h
 * @returns {string} Formatted wind speed
 */
function formatWindSpeed(speed) {
  if (speed === null || speed === undefined) {
    return '--';
  }
  return `${Math.round(speed)} KM/H`;
}

/**
 * Format humidity for display
 * @param {number|null} humidity - Humidity percentage
 * @returns {string} Formatted humidity
 */
function formatHumidity(humidity) {
  if (humidity === null || humidity === undefined) {
    return '--';
  }
  return `${Math.round(humidity)}%`;
}


// ============================================
// Render Functions
// ============================================

/**
 * Render the loading state
 * @returns {string} HTML for loading state
 */
function renderLoading() {
  return `
    <div class="weather-page teletext-page">
      <div class="teletext-page-title phosphor-glow">
        ${TITLE}
      </div>
      
      <div class="teletext-page-content">
        <div class="loading-container" style="text-align: center; margin-top: 24px;">
          <div class="loading-text" style="color: var(--tt-yellow);">
            LOADING WEATHER DATA...
          </div>
          <div class="loading-cursor" style="color: var(--tt-cyan);">█</div>
          <div class="loading-progress" style="color: var(--tt-cyan); margin-top: 12px;">
            ░░░░░░░░░░░░░░░░░░░░
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render the error state
 * @param {string} message - Error message
 * @returns {string} HTML for error state
 */
function renderError(message) {
  return `
    <div class="weather-page teletext-page">
      <div class="teletext-page-title phosphor-glow">
        ${TITLE}
      </div>
      
      <div class="teletext-page-content">
        <div class="error-container" style="text-align: center; margin-top: 20px; border: 2px solid var(--tt-red); padding: 12px;">
          <div class="error-icon" style="color: var(--tt-red); font-size: 18px;">⚠</div>
          <div class="error-title" style="color: var(--tt-red); margin-top: 6px;">
            ${message || 'WEATHER DATA UNAVAILABLE'}
          </div>
          <div class="error-actions" style="margin-top: 12px;">
            <button class="fastext-button fastext-button--red retry-button" style="margin-right: 8px;">
              RETRY
            </button>
            <button class="fastext-button fastext-button--cyan home-button">
              HOME
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render location prompt when no location is set
 * Requirements: 6.5
 * @returns {string} HTML for location prompt
 */
function renderLocationPrompt() {
  return `
    <div class="weather-page teletext-page">
      <div class="teletext-page-title phosphor-glow">
        ${TITLE}
      </div>
      
      <div class="teletext-page-content">
        <div class="location-prompt" style="text-align: center; margin-top: 16px;">
          <div class="content-line" style="color: var(--tt-cyan);">
            LOCATION REQUIRED
          </div>
          <div class="content-line separator" style="color: var(--tt-cyan); margin: 8px 0;">
            ${createSeparator('━', 40)}
          </div>
          <div class="content-line" style="color: var(--tt-white);">
            TO DISPLAY WEATHER, WE NEED
          </div>
          <div class="content-line" style="color: var(--tt-white);">
            YOUR LOCATION.
          </div>
          <div class="content-line" style="margin-top: 16px;">
            <button class="fastext-button fastext-button--green detect-location-button">
              DETECT MY LOCATION
            </button>
          </div>
          <div class="content-line" style="color: var(--color-secondary-70); margin-top: 12px;">
            OR GO TO SETTINGS (PAGE 900)
          </div>
          <div class="content-line" style="color: var(--color-secondary-70);">
            TO ENTER A CITY MANUALLY
          </div>
        </div>
      </div>
    </div>
  `;
}  

/**
 * Render current weather conditions
 * Requirements: 6.2, 6.4, 6.6
 * @param {Object} weather - Weather data
 * @param {Object} location - Location data
 * @param {string} unit - Temperature unit
 * @returns {string} HTML for current conditions
 */
function renderCurrentConditions(weather, location, unit) {
  const current = weather.current || {};
  const icon = getWeatherIcon(current.icon || 'unknown');
  const temp = current.temperature !== null 
    ? formatTemperature(current.temperature, unit)
    : '--';
  const condition = current.condition || 'UNKNOWN';
  const humidity = formatHumidity(current.humidity);
  const wind = formatWindSpeed(current.windSpeed);
  const locationName = formatLocation(location);
  
  // Build icon HTML - compact version
  const iconHTML = icon.map(line => 
    `<div class="icon-line" style="color: var(--tt-yellow); font-family: monospace; white-space: pre; font-size: 0.8em; line-height: 1.0;">${line}</div>`
  ).join('');
  
  return `
    <!-- Location Header (Req 6.6) -->
    <div class="content-line location-header" style="color: var(--tt-cyan); font-size: 1.05em;">
      📍 ${locationName}
    </div>
    
    <div class="content-line separator" style="color: var(--tt-cyan); margin: 4px 0;">
      ${createSeparator('═', 40)}
    </div>
    
    <!-- Current Conditions Section using table for alignment -->
    <table class="current-weather-table" style="width: 100%; table-layout: fixed; border-collapse: collapse; margin: 8px 0;">
      <colgroup>
        <col style="width: 35%;">
        <col style="width: 65%;">
      </colgroup>
      <tr>
        <td style="vertical-align: top; padding: 4px;">
          <!-- Weather Icon (Req 6.4) -->
          <div class="weather-icon">
            ${iconHTML}
          </div>
        </td>
        <td style="vertical-align: top; padding: 4px;">
          <!-- Temperature -->
          <div class="temperature" style="color: var(--tt-yellow); font-size: 1.4em; line-height: 1.2; margin-bottom: 4px;">
            ${temp}
          </div>
          <!-- Condition -->
          <div class="condition" style="color: var(--tt-white); margin-bottom: 6px;">
            ${truncateToWidth(condition, 16)}
          </div>
          <!-- Details Table -->
          <table style="width: 100%; table-layout: fixed; font-size: 0.9em;">
            <tr>
              <td style="color: var(--tt-cyan); padding: 2px 0;">HUMIDITY:</td>
              <td style="color: var(--tt-white); padding: 2px 0;">${humidity}</td>
            </tr>
            <tr>
              <td style="color: var(--tt-cyan); padding: 2px 0;">WIND:</td>
              <td style="color: var(--tt-white); padding: 2px 0;">${wind}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Render 5-day forecast as a proper HTML table
 * Requirements: 6.3
 * @param {Array} forecast - Forecast data array
 * @param {string} unit - Temperature unit
 * @returns {string} HTML for forecast table
 */
function renderForecast(forecast, unit) {
  if (!forecast || forecast.length === 0) {
    return `
      <div class="content-line" style="color: var(--color-secondary-70); text-align: center;">
        FORECAST UNAVAILABLE
      </div>
    `;
  }
  
  // Take first 5 days
  const days = forecast.slice(0, 5);
  const symbol = unit === 'fahrenheit' ? '°F' : '°C';
  
  const forecastRows = days.map((day, index) => {
    const dayName = getDayName(day.date);
    const high = day.high !== null ? Math.round(day.high) : '--';
    const low = day.low !== null ? Math.round(day.low) : '--';
    const condition = truncateToWidth(day.condition || '', 14);
    const iconChar = getIconChar(day.icon);
    
    return `
      <tr class="forecast-day" data-index="${index}">
        <td style="color: var(--tt-cyan); padding: 5px 4px; font-weight: bold;">${dayName}</td>
        <td style="color: var(--tt-yellow); padding: 5px 4px; text-align: center;">${iconChar}</td>
        <td style="color: var(--tt-red); padding: 5px 4px; text-align: right;">${high}${symbol}</td>
        <td style="color: var(--tt-cyan); padding: 5px 4px; text-align: right;">${low}${symbol}</td>
        <td style="color: var(--tt-white); padding: 5px 4px;">${condition}</td>
      </tr>
    `;
  }).join('');
  
  return `
    <div class="content-line section-header" style="color: var(--tt-cyan); margin-top: 8px; font-weight: bold;">
      5-DAY FORECAST
    </div>
    <div class="content-line separator" style="color: var(--tt-cyan); margin: 4px 0;">
      ${createSeparator('─', 40)}
    </div>
    
    <!-- Forecast Table with fixed column widths -->
    <table class="forecast-table" style="width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 0.95em;">
      <colgroup>
        <col style="width: 15%;">
        <col style="width: 10%;">
        <col style="width: 20%;">
        <col style="width: 20%;">
        <col style="width: 35%;">
      </colgroup>
      <thead>
        <tr style="background: rgba(0,0,255,0.2);">
          <th style="color: var(--tt-cyan); padding: 5px 4px; text-align: left; font-weight: normal;">DAY</th>
          <th style="color: var(--tt-cyan); padding: 5px 4px; text-align: center; font-weight: normal;"></th>
          <th style="color: var(--tt-cyan); padding: 5px 4px; text-align: right; font-weight: normal;">HIGH</th>
          <th style="color: var(--tt-cyan); padding: 5px 4px; text-align: right; font-weight: normal;">LOW</th>
          <th style="color: var(--tt-cyan); padding: 5px 4px; text-align: left; font-weight: normal;">CONDITION</th>
        </tr>
      </thead>
      <tbody>
        ${forecastRows}
      </tbody>
    </table>
  `;
}

/**
 * Get single character icon for forecast display
 * Uses block characters for authentic Teletext feel
 * @param {string} iconType - Icon type
 * @returns {string} Single character icon
 */
function getIconChar(iconType) {
  const icons = {
    sunny: '☀',
    cloudy: '▓',
    rainy: '│',
    snowy: '*',
    stormy: '⚡',
    partlyCloudy: '░',
    foggy: '▒',
    unknown: '?'
  };
  // Use hasOwnProperty to avoid prototype pollution issues
  return Object.prototype.hasOwnProperty.call(icons, iconType) ? icons[iconType] : icons.unknown;
}

/**
 * Render temperature unit toggle info
 * Requirements: 6.7
 * @param {string} unit - Current temperature unit
 * @returns {string} HTML for unit toggle info
 */
function renderUnitToggle(unit) {
  const currentUnit = unit === 'fahrenheit' ? '°F FAHRENHEIT' : '°C CELSIUS';
  return `
    <div class="content-line separator" style="color: var(--tt-cyan); margin-top: 6px;">
      ${createSeparator('━', 40)}
    </div>
    <div class="content-line unit-info" style="color: var(--tt-white); font-size: 0.9em; margin-top: 4px;">
      SHOWING: <span style="color: var(--tt-cyan);">${currentUnit}</span>
    </div>
    <div class="content-line" style="color: var(--color-secondary-70); font-size: 0.85em;">
      CHANGE IN SETTINGS (PAGE 900)
    </div>
  `;
}

/**
 * Render stale data notice
 * @returns {string} HTML for stale data notice
 */
function renderStaleNotice() {
  return `
    <div class="content-line stale-notice" style="color: var(--tt-yellow); text-align: center; margin-top: 8px;">
      ⚠ USING CACHED DATA
    </div>
  `;
}


// ============================================
// Page Interface Implementation
// ============================================

/**
 * Render the weather page content
 * Requirements: 6.1-6.7
 * 
 * @returns {string} HTML content for the weather page
 */
export function render() {
  // Show loading state
  if (isLoading) {
    return renderLoading();
  }
  
  // Show error state
  if (errorMessage) {
    return renderError(errorMessage);
  }
  
  // Show location prompt if no location
  if (!locationData || (locationData.lat === null && locationData.lon === null)) {
    return renderLocationPrompt();
  }
  
  // Show weather data
  if (!weatherData) {
    return renderLoading();
  }
  
  const stateManager = getStateManager();
  const settings = stateManager.getSettings();
  const unit = settings.temperatureUnit || 'celsius';
  
  return `
    <div class="weather-page teletext-page">
      <!-- Title -->
      <div class="teletext-page-title phosphor-glow">
        ${TITLE}
      </div>
      
      <!-- Scrollable Content -->
      <div class="teletext-page-content">
        <!-- Current Conditions (Req 6.2, 6.4, 6.6) -->
        ${renderCurrentConditions(weatherData, locationData, unit)}
        
        <!-- 5-Day Forecast (Req 6.3) -->
        ${renderForecast(weatherData.forecast, unit)}
        
        <!-- Temperature Unit Info (Req 6.7) -->
        ${renderUnitToggle(unit)}
        
        <!-- Stale Data Notice -->
        ${weatherData._stale ? renderStaleNotice() : ''}
      </div>
      
      <!-- Footer for consistency -->
      <div class="teletext-page-footer" style="text-align: center;">
        VIA OPEN-METEO
      </div>
    </div>
  `;
}

/**
 * Called after the page is rendered and mounted to the DOM
 * Initializes data loading and animations
 * Requirements: 6.1
 */
export async function onMount() {
  try {
    // Attach event handlers first
    attachEventHandlers();
    
    // Load weather data if not already loaded
    if (!weatherData && !isLoading) {
      await loadWeatherData();
    } else {
      // If data already loaded, animate the existing content
      animateContent();
    }
    
    // Set up auto-refresh
    startAutoRefresh();
  } catch (error) {
    console.error('Weather page onMount error:', error);
    // Ensure page is still usable even if there's an error
    isLoading = false;
    errorMessage = 'FAILED TO INITIALIZE';
    updatePage();
  }
}

/**
 * Called before the page is unmounted
 * Cleans up animations and timers
 */
export function onUnmount() {
  // Kill any running animations
  if (animationTimeline) {
    animationTimeline.kill();
    animationTimeline = null;
  }
  
  // Clear auto-refresh timer
  stopAutoRefresh();
  
  // Kill any tweens on weather elements
  const elements = document.querySelectorAll('.weather-page *');
  if (elements.length > 0) {
    gsap.killTweensOf(elements);
  }
}

/**
 * Get Fastext button configuration for this page
 * 
 * @returns {Object} Fastext button configuration
 */
export function getFastextButtons() {
  return {
    red: { label: 'HOME', page: PAGE_NUMBERS.HOME },
    green: { label: 'NEWS', page: PAGE_NUMBERS.NEWS_TOP },
    yellow: { label: 'FINANCE', page: PAGE_NUMBERS.FINANCE },
    cyan: { label: 'TIME', page: PAGE_NUMBERS.TIME_MACHINE },
  };
}

// ============================================
// Data Loading Functions
// ============================================

/**
 * Load weather data
 * Requirements: 6.1
 */
async function loadWeatherData() {
  isLoading = true;
  errorMessage = null;
  updatePage();
  
  try {
    const stateManager = getStateManager();
    const settings = stateManager.getSettings();
    
    // Get location (from settings or detect) (Req 6.1)
    locationData = await getLocation(settings.location);
    
    // Check if we have valid coordinates
    if (!locationData || locationData.lat === null || locationData.lon === null) {
      isLoading = false;
      updatePage();
      return;
    }
    
    // Fetch current weather (Req 6.2)
    weatherData = await getCurrentWeather(
      locationData.lat,
      locationData.lon,
      locationData.city
    );
    
    isLoading = false;
    errorMessage = null;
    updatePage();
    
    // Animate the new content
    animateContent();
    
  } catch (error) {
    console.error('Failed to load weather data:', error);
    isLoading = false;
    errorMessage = error.message || 'FAILED TO LOAD WEATHER';
    updatePage();
  }
}

/**
 * Retry loading weather data
 */
async function retryLoad() {
  weatherData = null;
  locationData = null;
  await loadWeatherData();
}

/**
 * Detect location and load weather
 * Requirements: 6.1, 6.5
 */
async function detectAndLoadWeather() {
  isLoading = true;
  errorMessage = null;
  updatePage();
  
  try {
    // Force location detection
    const { detectLocation } = await import('../services/geoApi.js');
    locationData = await detectLocation();
    
    if (locationData && locationData.lat !== null && locationData.lon !== null) {
      // Save to settings
      const stateManager = getStateManager();
      stateManager.updateSettings({ location: locationData });
      
      // Load weather
      await loadWeatherData();
    } else {
      isLoading = false;
      errorMessage = 'COULD NOT DETECT LOCATION';
      updatePage();
    }
  } catch (error) {
    console.error('Failed to detect location:', error);
    isLoading = false;
    errorMessage = 'LOCATION DETECTION FAILED';
    updatePage();
  }
}

/**
 * Update the page content in the DOM
 */
function updatePage() {
  // Use content-grid if available (matches app.js structure), fallback to content-area
  const contentGrid = document.querySelector('#content-grid');
  const contentArea = document.querySelector('.content-area');
  const target = contentGrid || contentArea;
  
  if (target) {
    target.innerHTML = render();
    attachEventHandlers();
  }
}

// ============================================
// Auto-Refresh Functions
// ============================================

/**
 * Start auto-refresh timer
 * Weather data refreshes every 5 minutes without disrupting UX
 */
function startAutoRefresh() {
  stopAutoRefresh();
  refreshTimer = setInterval(async () => {
    // Only refresh if we have location data
    if (locationData && locationData.lat !== null) {
      try {
        const newWeather = await getCurrentWeather(
          locationData.lat,
          locationData.lon,
          locationData.city
        );
        
        // Only update if data changed
        if (JSON.stringify(newWeather) !== JSON.stringify(weatherData)) {
          weatherData = newWeather;
          updatePage();
        }
      } catch (error) {
        console.warn('Auto-refresh failed:', error);
        // Don't show error, just keep existing data
      }
    }
  }, AUTO_REFRESH_INTERVAL);
}

/**
 * Stop auto-refresh timer
 */
function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

// ============================================
// Event Handlers
// ============================================

/**
 * Attach event handlers to interactive elements
 */
function attachEventHandlers() {
  // Retry button
  const retryButton = document.querySelector('.retry-button');
  if (retryButton) {
    retryButton.addEventListener('click', retryLoad);
  }
  
  // Home button
  const homeButton = document.querySelector('.home-button');
  if (homeButton) {
    homeButton.addEventListener('click', () => {
      import('../router.js').then(({ getRouter }) => {
        getRouter().navigate(PAGE_NUMBERS.HOME);
      });
    });
  }
  
  // Detect location button
  const detectButton = document.querySelector('.detect-location-button');
  if (detectButton) {
    detectButton.addEventListener('click', detectAndLoadWeather);
  }
}

// ============================================
// Animation Functions
// ============================================

/**
 * Animate weather content appearing
 */
function animateContent() {
  const contentLines = document.querySelectorAll('.weather-page .content-line');
  const forecastDays = document.querySelectorAll('.forecast-day');
  
  if (contentLines.length === 0 && forecastDays.length === 0) {
    return;
  }
  
  // Kill any existing animation
  if (animationTimeline) {
    animationTimeline.kill();
    animationTimeline = null;
  }
  
  // Kill any existing tweens on these elements to prevent conflicts
  gsap.killTweensOf(contentLines);
  gsap.killTweensOf(forecastDays);
  
  // Use fromTo instead of from to ensure final state is always correct
  animationTimeline = gsap.timeline();
  
  // Stagger content lines using fromTo for reliability
  if (contentLines.length > 0) {
    animationTimeline.fromTo(contentLines, 
      { opacity: 0, y: 10 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.2, 
        stagger: 0.03, 
        ease: 'power2.out',
        clearProps: 'all' // Clear inline styles after animation
      }
    );
  }
  
  // Stagger forecast days using fromTo for reliability
  if (forecastDays.length > 0) {
    animationTimeline.fromTo(forecastDays, 
      { opacity: 0, x: -10 },
      { 
        opacity: 1, 
        x: 0, 
        duration: 0.2, 
        stagger: 0.05, 
        ease: 'power2.out',
        clearProps: 'all' // Clear inline styles after animation
      }, 
      '-=0.1'
    );
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Reset the weather page state (useful for testing)
 */
export function resetWeatherPageState() {
  weatherData = null;
  locationData = null;
  isLoading = false;
  errorMessage = null;
  stopAutoRefresh();
  if (animationTimeline) {
    animationTimeline.kill();
    animationTimeline = null;
  }
}

/**
 * Get current weather data (for testing)
 * @returns {Object|null} Current weather data
 */
export function getWeatherData() {
  return weatherData;
}

/**
 * Get current location data (for testing)
 * @returns {Object|null} Current location data
 */
export function getLocationData() {
  return locationData;
}

/**
 * Get loading state (for testing)
 * @returns {boolean} Loading state
 */
export function getIsLoading() {
  return isLoading;
}

/**
 * Get error message (for testing)
 * @returns {string|null} Error message
 */
export function getErrorMessage() {
  return errorMessage;
}

/**
 * Set weather data directly (for testing)
 * @param {Object} data - Weather data
 */
export function setWeatherData(data) {
  weatherData = data;
}

/**
 * Set location data directly (for testing)
 * @param {Object} data - Location data
 */
export function setLocationData(data) {
  locationData = data;
}

// ============================================
// Exports
// ============================================

export {
  DAY_NAMES,
  AUTO_REFRESH_INTERVAL,
  getDayName,
  formatWindSpeed,
  formatHumidity,
  getIconChar,
};
