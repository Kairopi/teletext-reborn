/**
 * Teletext Reborn - Time Machine Pages (Pages 500-502)
 * 
 * The Time Machine feature allows users to explore historical events
 * and weather for any date from 1940 to yesterday.
 * 
 * Pages:
 * - 500: Date Selection - Choose a date to travel to
 * - 501: Historical Events - Events, births, deaths from Wikipedia
 * - 502: Historical Weather - Weather data for the selected date
 * 
 * @module pages/timeMachine
 * Requirements: 8.1-8.11, 9.1-9.7, 10.1-10.5, 11.1-11.10
 */

import gsap from 'gsap';
import { PAGE_NUMBERS, getRouter } from '../router.js';
import { getStateManager } from '../state.js';
import { 
  isValidDate, 
  isInValidRange, 
  createDate,
  formatTimeMachineDate,
  getDefaultTimeMachineDate,
  MIN_YEAR,
  MONTH_NAMES
} from '../utils/date.js';
import { truncateToWidth, createSeparator, formatDottedLeader } from '../utils/teletext.js';
import { getOnThisDay, isBirthday, formatEntry } from '../services/wikipediaApi.js';
import { getHistoricalWeather, formatTemperature, getTemperatureComparison, isHistoricalDataAvailable } from '../services/weatherApi.js';
import { getLocation } from '../services/geoApi.js';
import { playTimeTravelAnimation, playReverseTimeTravelAnimation, cleanupTimeTravelAnimation } from '../animations/timeTravel.js';

// ============================================
// Constants
// ============================================

/**
 * Page numbers for Time Machine pages
 */
export const TIME_MACHINE_PAGES = {
  DATE_SELECTION: PAGE_NUMBERS.TIME_MACHINE,        // 500
  EVENTS: PAGE_NUMBERS.TIME_MACHINE_EVENTS,         // 501
  WEATHER: PAGE_NUMBERS.TIME_MACHINE_WEATHER,       // 502
};

/**
 * Page titles
 */
const TITLES = {
  DATE_SELECTION: '⏰ TIME MACHINE ⏰',
  EVENTS: 'ON THIS DAY',
  WEATHER: 'HISTORICAL WEATHER',
};

/**
 * Famous dates for quick jumps (Req 8.5)
 */
const FAMOUS_DATES = [
  { label: 'Moon Landing', month: 7, day: 20, year: 1969 },
  { label: 'Berlin Wall Falls', month: 11, day: 9, year: 1989 },
  { label: 'Y2K', month: 1, day: 1, year: 2000 },
  { label: '9/11', month: 9, day: 11, year: 2001 },
  { label: 'COVID Lockdown', month: 3, day: 23, year: 2020 },
];

/**
 * Days in each month (non-leap year)
 */
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// ============================================
// State
// ============================================

/**
 * Currently selected date components
 */
let selectedMonth = 1;
let selectedDay = 1;
let selectedYear = 1975;

/**
 * Current page being displayed (500, 501, or 502)
 */
let currentSubPage = TIME_MACHINE_PAGES.DATE_SELECTION;

/**
 * Historical events data
 */
let eventsData = null;

/**
 * Historical weather data
 */
let weatherData = null;

/**
 * Loading state
 */
let isLoading = false;

/**
 * Error message
 */
let errorMessage = null;

/**
 * GSAP timeline for animations
 */
let animationTimeline = null;

/**
 * Event category being viewed (events, births, deaths)
 */
let currentCategory = 'events';

// ============================================
// Initialization
// ============================================

/**
 * Initialize the Time Machine with default date
 * Req 8.10: Default to today minus 50 years
 */
function initializeDate() {
  const stateManager = getStateManager();
  const timeMachineDate = stateManager.getCurrentDate();
  
  if (timeMachineDate) {
    // Use existing Time Machine date
    selectedMonth = timeMachineDate.getMonth() + 1;
    selectedDay = timeMachineDate.getDate();
    selectedYear = timeMachineDate.getFullYear();
  } else {
    // Use default (today minus 50 years) - Req 8.10
    const defaultDate = getDefaultTimeMachineDate();
    selectedMonth = defaultDate.getMonth() + 1;
    selectedDay = defaultDate.getDate();
    selectedYear = defaultDate.getFullYear();
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get the maximum year (yesterday's year)
 */
function getMaxYear() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.getFullYear();
}

/**
 * Get days in a specific month accounting for leap years
 */
function getDaysInMonth(month, year) {
  if (month === 2) {
    // February - check for leap year
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    return isLeap ? 29 : 28;
  }
  return DAYS_IN_MONTH[month - 1];
}

/**
 * Validate and adjust day if needed when month/year changes
 */
function adjustDayForMonth() {
  const maxDays = getDaysInMonth(selectedMonth, selectedYear);
  if (selectedDay > maxDays) {
    selectedDay = maxDays;
  }
}

/**
 * Get the selected date as a Date object
 */
function getSelectedDate() {
  return createDate(selectedMonth, selectedDay, selectedYear);
}

/**
 * Check if user's birthday matches selected date
 */
function isUserBirthday() {
  const stateManager = getStateManager();
  const settings = stateManager.getSettings();
  return isBirthday(selectedMonth, selectedDay, settings.birthday);
}



// ============================================
// Render Functions - Date Selection (Page 500)
// ============================================

/**
 * Render month dropdown options
 */
function renderMonthOptions() {
  return MONTH_NAMES.map((name, index) => {
    const month = index + 1;
    const selected = month === selectedMonth ? 'selected' : '';
    return `<option value="${month}" ${selected}>${name}</option>`;
  }).join('');
}

/**
 * Render day dropdown options
 */
function renderDayOptions() {
  const maxDays = getDaysInMonth(selectedMonth, selectedYear);
  const options = [];
  for (let day = 1; day <= maxDays; day++) {
    const selected = day === selectedDay ? 'selected' : '';
    const padded = String(day).padStart(2, '0');
    options.push(`<option value="${day}" ${selected}>${padded}</option>`);
  }
  return options.join('');
}

/**
 * Render year dropdown options
 */
function renderYearOptions() {
  const maxYear = getMaxYear();
  const options = [];
  for (let year = maxYear; year >= MIN_YEAR; year--) {
    const selected = year === selectedYear ? 'selected' : '';
    options.push(`<option value="${year}" ${selected}>${year}</option>`);
  }
  return options.join('');
}

/**
 * Render quick jump buttons (Req 8.5)
 */
function renderQuickJumps() {
  const stateManager = getStateManager();
  const settings = stateManager.getSettings();
  
  let jumps = [];
  
  // Add user's birthday as first option if set (Req 8.6)
  if (settings.birthday) {
    const { month, day, year } = settings.birthday;
    const monthName = MONTH_NAMES[month - 1].substring(0, 3);
    jumps.push({
      label: `★ Your Birthday`,
      month,
      day,
      year: year || selectedYear,
      isBirthday: true
    });
  }
  
  // Add famous dates
  jumps = jumps.concat(FAMOUS_DATES);
  
  return jumps.map(jump => {
    const monthName = MONTH_NAMES[jump.month - 1].substring(0, 3);
    const dateStr = `${monthName} ${jump.day}, ${jump.year}`;
    const color = jump.isBirthday ? 'var(--tt-magenta)' : 'var(--tt-cyan)';
    return `
      <div class="quick-jump-item content-line" 
           data-month="${jump.month}" 
           data-day="${jump.day}" 
           data-year="${jump.year}"
           style="color: ${color}; cursor: pointer; padding: 2px 0;">
        • ${truncateToWidth(jump.label, 22)} - ${dateStr}
      </div>
    `;
  }).join('');
}

/**
 * Render the date selection page (Page 500)
 * Requirements: 8.1-8.11
 */
function renderDateSelection() {
  const formattedDate = formatTimeMachineDate(getSelectedDate());
  
  return `
    <div class="time-machine-page teletext-page" data-page="500">
      <!-- Title (Req 8.1) -->
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-cyan);">
        ${TITLES.DATE_SELECTION}
      </div>
      
      <!-- Tagline (Req 8.2) -->
      <div class="content-line" style="text-align: center; color: var(--tt-white); margin-top: 4px;">
        TRAVEL BACK IN TIME TO SEE WHAT
      </div>
      <div class="content-line" style="text-align: center; color: var(--tt-white);">
        HAPPENED ON ANY DATE IN HISTORY!
      </div>
      
      <div class="content-line separator" style="color: var(--tt-cyan); margin: 6px 0;">
        ${createSeparator('━', 40)}
      </div>
      
      <!-- Scrollable Content -->
      <div class="teletext-page-content">
        <!-- Date Picker (Req 8.3, 8.9) -->
        <div class="content-line" style="color: var(--tt-yellow);">
          SELECT DATE:
        </div>
        
        <div class="date-picker" style="display: flex; gap: 8px; margin: 8px 0; flex-wrap: wrap;">
          <select id="month-select" class="teletext-select" style="flex: 1; min-width: 100px;">
            ${renderMonthOptions()}
          </select>
          <select id="day-select" class="teletext-select" style="width: 60px;">
            ${renderDayOptions()}
          </select>
          <select id="year-select" class="teletext-select" style="width: 80px;">
            ${renderYearOptions()}
          </select>
        </div>
        
        <!-- Selected Date Display (Req 8.9) -->
        <div class="content-line selected-date" style="color: var(--tt-yellow); text-align: center; margin: 8px 0;">
          ${formattedDate}
        </div>
        
        <!-- Time Travel Button (Req 8.8) -->
        <div style="text-align: center; margin: 12px 0;">
          <button id="time-travel-btn" class="fastext-button fastext-button--green time-travel-button" style="padding: 8px 16px; font-size: 1em;">
            🚀 TIME TRAVEL
          </button>
        </div>
        
        <div class="content-line separator" style="color: var(--tt-cyan); margin: 8px 0;">
          ${createSeparator('━', 40)}
        </div>
        
        <!-- Quick Jumps (Req 8.5, 8.6, 8.7) -->
        <div class="content-line" style="color: var(--tt-yellow);">
          QUICK JUMPS:
        </div>
        <div class="quick-jumps" style="margin: 4px 0;">
          ${renderQuickJumps()}
        </div>
      </div>
      
      <!-- Footer -->
      <div class="teletext-page-footer" style="text-align: center;">
        SELECT A DATE AND PRESS TIME TRAVEL
      </div>
    </div>
  `;
}

// ============================================
// Render Functions - Historical Events (Page 501)
// ============================================

/**
 * Render events list
 */
function renderEventsList(events, type) {
  if (!events || events.length === 0) {
    return `<div class="content-line" style="color: var(--color-secondary-70);">NO ${type.toUpperCase()} FOUND</div>`;
  }
  
  return events.map((event, index) => {
    const yearStr = String(event.year).padStart(4, ' ');
    const desc = truncateToWidth(event.description, 34);
    return `
      <div class="event-item content-line" data-index="${index}" style="padding: 2px 0;">
        <span style="color: var(--tt-cyan);">${yearStr}:</span>
        <span style="color: var(--tt-white);">${desc}</span>
      </div>
    `;
  }).join('');
}

/**
 * Render birthday banner (Req 9.6)
 */
function renderBirthdayBanner() {
  if (!isUserBirthday()) {
    return '';
  }
  
  return `
    <div class="birthday-banner" style="background: var(--tt-magenta); color: var(--tt-black); padding: 8px; text-align: center; margin: 8px 0;">
      ★ HAPPY BIRTHDAY! ★
    </div>
  `;
}

/**
 * Render the historical events page (Page 501)
 * Requirements: 9.1-9.7
 */
function renderHistoricalEvents() {
  const formattedDate = formatTimeMachineDate(getSelectedDate());
  
  // Loading state
  if (isLoading) {
    return renderLoading('LOADING HISTORICAL EVENTS...');
  }
  
  // Error state
  if (errorMessage) {
    return renderError(errorMessage);
  }
  
  // No data state
  if (!eventsData) {
    return renderLoading('FETCHING EVENTS...');
  }
  
  // Get current category data
  let categoryData = [];
  let categoryTitle = '';
  
  switch (currentCategory) {
    case 'events':
      categoryData = eventsData.events || [];
      categoryTitle = 'EVENTS';
      break;
    case 'births':
      categoryData = eventsData.births || [];
      categoryTitle = 'FAMOUS BIRTHS';
      break;
    case 'deaths':
      categoryData = eventsData.deaths || [];
      categoryTitle = 'NOTABLE DEATHS';
      break;
  }
  
  return `
    <div class="time-machine-page teletext-page" data-page="501">
      <!-- Title with Date -->
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-magenta);">
        ★ ${formattedDate} ★
      </div>
      
      <!-- Birthday Banner (Req 9.6) -->
      ${renderBirthdayBanner()}
      
      <!-- Section Title -->
      <div class="content-line section-header" style="color: var(--tt-cyan); margin-top: 4px;">
        ${TITLES.EVENTS}
      </div>
      <div class="content-line separator" style="color: var(--tt-cyan);">
        ${createSeparator('═', 40)}
      </div>
      
      <!-- Scrollable Content -->
      <div class="teletext-page-content">
        <!-- Category Header (Req 9.3) -->
        <div class="content-line" style="color: var(--tt-yellow); margin: 4px 0;">
          ${categoryTitle}:
        </div>
        <div class="content-line separator" style="color: var(--tt-cyan);">
          ${createSeparator('─', 40)}
        </div>
        
        <!-- Events List (Req 9.2, 9.4, 9.5) -->
        <div class="events-list" style="margin: 4px 0;">
          ${renderEventsList(categoryData, currentCategory)}
        </div>
        
        <!-- Stale Data Notice -->
        ${eventsData._stale ? '<div class="content-line" style="color: var(--tt-yellow);">⚠ USING CACHED DATA</div>' : ''}
      </div>
      
      <!-- Footer with Attribution -->
      <div class="teletext-page-footer" style="text-align: center;">
        SOURCE: WIKIPEDIA
      </div>
    </div>
  `;
}



// ============================================
// Render Functions - Historical Weather (Page 502)
// ============================================

/**
 * Render the historical weather page (Page 502)
 * Requirements: 10.1-10.5
 */
function renderHistoricalWeather() {
  const formattedDate = formatTimeMachineDate(getSelectedDate());
  const stateManager = getStateManager();
  const settings = stateManager.getSettings();
  const unit = settings.temperatureUnit || 'celsius';
  
  // Loading state
  if (isLoading) {
    return renderLoading('LOADING HISTORICAL WEATHER...');
  }
  
  // Error state
  if (errorMessage) {
    return renderError(errorMessage);
  }
  
  // Check for pre-1940 date (Req 10.3)
  const selectedDate = getSelectedDate();
  if (selectedDate && selectedDate.getFullYear() < MIN_YEAR) {
    return renderDataLimitation();
  }
  
  // No data state
  if (!weatherData) {
    return renderLoading('FETCHING WEATHER DATA...');
  }
  
  // Error in weather data
  if (weatherData.error) {
    return renderDataLimitation(weatherData.message);
  }
  
  const high = weatherData.high !== null ? formatTemperature(weatherData.high, unit) : '--';
  const low = weatherData.low !== null ? formatTemperature(weatherData.low, unit) : '--';
  const precipitation = weatherData.precipitation !== null ? `${weatherData.precipitation}mm` : '--';
  const condition = weatherData.condition || 'UNKNOWN';
  const location = weatherData.location || 'UNKNOWN LOCATION';
  
  // Temperature comparison (Req 10.4) - simplified since we don't have average data
  const comparisonText = '';
  
  return `
    <div class="time-machine-page teletext-page" data-page="502">
      <!-- Title with Date -->
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-magenta);">
        ★ ${formattedDate} ★
      </div>
      
      <!-- Section Title -->
      <div class="content-line section-header" style="color: var(--tt-cyan); margin-top: 4px;">
        ${TITLES.WEATHER}
      </div>
      <div class="content-line separator" style="color: var(--tt-cyan);">
        ${createSeparator('═', 40)}
      </div>
      
      <!-- Scrollable Content -->
      <div class="teletext-page-content">
        <!-- Location (Req 10.5) -->
        <div class="content-line" style="color: var(--tt-cyan); margin: 4px 0;">
          📍 ${truncateToWidth(location, 36)}
        </div>
        
        <div class="content-line separator" style="color: var(--tt-cyan); margin: 4px 0;">
          ${createSeparator('─', 40)}
        </div>
        
        <!-- Weather Data (Req 10.2) -->
        <div class="weather-data" style="margin: 8px 0;">
          <div class="content-line" style="color: var(--tt-yellow);">
            CONDITION: <span style="color: var(--tt-white);">${condition}</span>
          </div>
          <div class="content-line" style="color: var(--tt-yellow); margin-top: 4px;">
            HIGH: <span style="color: var(--tt-green);">${high}</span>
          </div>
          <div class="content-line" style="color: var(--tt-yellow);">
            LOW: <span style="color: var(--tt-cyan);">${low}</span>
          </div>
          <div class="content-line" style="color: var(--tt-yellow); margin-top: 4px;">
            PRECIPITATION: <span style="color: var(--tt-white);">${precipitation}</span>
          </div>
        </div>
        
        ${comparisonText ? `
        <div class="content-line separator" style="color: var(--tt-cyan); margin: 8px 0;">
          ${createSeparator('─', 40)}
        </div>
        <div class="content-line" style="color: var(--tt-green);">
          ${comparisonText}
        </div>
        ` : ''}
        
        <!-- Stale Data Notice -->
        ${weatherData._stale ? '<div class="content-line" style="color: var(--tt-yellow); margin-top: 8px;">⚠ USING CACHED DATA</div>' : ''}
      </div>
      
      <!-- Footer with Attribution -->
      <div class="teletext-page-footer" style="text-align: center;">
        VIA OPEN-METEO ARCHIVE
      </div>
    </div>
  `;
}

/**
 * Render data limitation message (Req 10.3)
 */
function renderDataLimitation(message = null) {
  const formattedDate = formatTimeMachineDate(getSelectedDate());
  const limitMessage = message || `WEATHER DATA AVAILABLE FROM ${MIN_YEAR} ONLY`;
  
  return `
    <div class="time-machine-page teletext-page" data-page="502">
      <!-- Title with Date -->
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-magenta);">
        ★ ${formattedDate} ★
      </div>
      
      <!-- Section Title -->
      <div class="content-line section-header" style="color: var(--tt-cyan); margin-top: 4px;">
        ${TITLES.WEATHER}
      </div>
      <div class="content-line separator" style="color: var(--tt-cyan);">
        ${createSeparator('═', 40)}
      </div>
      
      <!-- Scrollable Content -->
      <div class="teletext-page-content">
        <div class="data-limitation" style="text-align: center; margin-top: 24px;">
          <div class="content-line" style="color: var(--tt-yellow);">
            ⚠ DATA LIMITATION ⚠
          </div>
          <div class="content-line" style="color: var(--tt-white); margin-top: 8px;">
            ${limitMessage}
          </div>
          <div class="content-line" style="color: var(--color-secondary-70); margin-top: 12px;">
            PLEASE SELECT A DATE FROM
          </div>
          <div class="content-line" style="color: var(--color-secondary-70);">
            ${MIN_YEAR} TO YESTERDAY
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="teletext-page-footer" style="text-align: center;">
        SELECT A DIFFERENT DATE
      </div>
    </div>
  `;
}

// ============================================
// Common Render Functions
// ============================================

/**
 * Render loading state
 */
function renderLoading(message = 'LOADING...') {
  return `
    <div class="time-machine-page teletext-page">
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-cyan);">
        ${TITLES.DATE_SELECTION}
      </div>
      
      <div class="teletext-page-content">
        <div class="loading-container" style="text-align: center; margin-top: 24px;">
          <div class="loading-text" style="color: var(--tt-yellow);">
            ${message}
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
 * Render error state
 */
function renderError(message) {
  return `
    <div class="time-machine-page teletext-page">
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-cyan);">
        ${TITLES.DATE_SELECTION}
      </div>
      
      <div class="teletext-page-content">
        <div class="error-container" style="text-align: center; margin-top: 20px; border: 2px solid var(--tt-red); padding: 12px;">
          <div class="error-icon" style="color: var(--tt-red); font-size: 18px;">⚠</div>
          <div class="error-title" style="color: var(--tt-red); margin-top: 6px;">
            ${message || 'AN ERROR OCCURRED'}
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

// ============================================
// Page Interface Implementation
// ============================================

/**
 * Render the Time Machine page content
 * Routes to appropriate sub-page based on current page number
 * 
 * @param {number} [pageNumber] - Page number to render (500, 501, or 502)
 * @returns {string} HTML content
 */
export function render(pageNumber = null) {
  // Determine which sub-page to render
  const page = pageNumber || currentSubPage;
  
  switch (page) {
    case TIME_MACHINE_PAGES.EVENTS:
      return renderHistoricalEvents();
    case TIME_MACHINE_PAGES.WEATHER:
      return renderHistoricalWeather();
    case TIME_MACHINE_PAGES.DATE_SELECTION:
    default:
      return renderDateSelection();
  }
}

/**
 * Called after the page is rendered and mounted to the DOM
 * @param {number} [pageNumber] - Page number being mounted
 */
export async function onMount(pageNumber = null) {
  try {
    const page = pageNumber || currentSubPage;
    currentSubPage = page;
    
    // Initialize date on first mount
    initializeDate();
    
    // Attach event handlers
    attachEventHandlers();
    
    // Load data for sub-pages
    if (page === TIME_MACHINE_PAGES.EVENTS) {
      await loadEventsData();
    } else if (page === TIME_MACHINE_PAGES.WEATHER) {
      await loadWeatherData();
    }
    
    // Animate content
    animateContent();
  } catch (error) {
    // Catch any unexpected errors during mount
    errorMessage = 'FAILED TO INITIALIZE PAGE';
    updatePage();
  }
}

/**
 * Called before the page is unmounted
 */
export function onUnmount() {
  // Kill any running animations
  if (animationTimeline) {
    animationTimeline.kill();
    animationTimeline = null;
  }
  
  // Clean up time travel animation
  cleanupTimeTravelAnimation();
  
  // Kill any tweens on page elements
  const elements = document.querySelectorAll('.time-machine-page *');
  if (elements.length > 0) {
    gsap.killTweensOf(elements);
  }
}

/**
 * Get Fastext button configuration for this page
 * Requirements: 8.11, 9.7
 * 
 * @param {number} [pageNumber] - Page number
 * @returns {Object} Fastext button configuration
 */
export function getFastextButtons(pageNumber = null) {
  const page = pageNumber || currentSubPage;
  
  switch (page) {
    case TIME_MACHINE_PAGES.EVENTS:
      // Req 9.7: Red=Events, Green=Births, Yellow=Deaths
      return {
        red: { label: 'EVENTS', action: () => setCategory('events') },
        green: { label: 'BIRTHS', action: () => setCategory('births') },
        yellow: { label: 'DEATHS', action: () => setCategory('deaths') },
        cyan: { label: 'WEATHER', page: TIME_MACHINE_PAGES.WEATHER },
      };
    case TIME_MACHINE_PAGES.WEATHER:
      return {
        red: { label: 'TODAY', action: returnToPresent },
        green: { label: 'EVENTS', page: TIME_MACHINE_PAGES.EVENTS },
        yellow: { label: 'DATE', page: TIME_MACHINE_PAGES.DATE_SELECTION },
        cyan: { label: 'HOME', page: PAGE_NUMBERS.HOME },
      };
    case TIME_MACHINE_PAGES.DATE_SELECTION:
    default:
      // Req 8.11: Red=Back to Today, Green=Events, Yellow=Weather, Cyan=Random Date
      return {
        red: { label: 'TODAY', action: returnToPresent },
        green: { label: 'EVENTS', page: TIME_MACHINE_PAGES.EVENTS },
        yellow: { label: 'WEATHER', page: TIME_MACHINE_PAGES.WEATHER },
        cyan: { label: 'RANDOM', action: selectRandomDate },
      };
  }
}



// ============================================
// Data Loading Functions
// ============================================

/**
 * Load historical events data from Wikipedia
 * Requirements: 9.1-9.5
 */
async function loadEventsData() {
  if (isLoading) return;
  
  isLoading = true;
  errorMessage = null;
  updatePage();
  
  try {
    eventsData = await getOnThisDay(selectedMonth, selectedDay);
    isLoading = false;
    updatePage();
    animateContent();
  } catch (error) {
    // Error logged for debugging - production would use proper logging service
    isLoading = false;
    errorMessage = error.message || 'FAILED TO LOAD EVENTS';
    updatePage();
  }
}

/**
 * Load historical weather data
 * Requirements: 10.1-10.5
 */
async function loadWeatherData() {
  if (isLoading) return;
  
  isLoading = true;
  errorMessage = null;
  updatePage();
  
  try {
    const stateManager = getStateManager();
    const settings = stateManager.getSettings();
    
    // Get location (Req 10.5)
    const location = await getLocation(settings.location);
    
    if (!location || location.lat === null || location.lon === null) {
      // Default to London if no location (Req 10.5)
      weatherData = await getHistoricalWeather(
        51.5074, // London lat
        -0.1278, // London lon
        getSelectedDate(),
        'LONDON (DEFAULT)'
      );
    } else {
      weatherData = await getHistoricalWeather(
        location.lat,
        location.lon,
        getSelectedDate(),
        location.city
      );
    }
    
    isLoading = false;
    updatePage();
    animateContent();
  } catch (error) {
    // Error logged for debugging - production would use proper logging service
    isLoading = false;
    errorMessage = error.message || 'FAILED TO LOAD WEATHER';
    updatePage();
  }
}

/**
 * Update the page content in the DOM
 */
function updatePage() {
  const contentGrid = document.querySelector('#content-grid');
  const contentArea = document.querySelector('.content-area');
  const target = contentGrid || contentArea;
  
  if (target) {
    target.innerHTML = render(currentSubPage);
    attachEventHandlers();
  }
}

// ============================================
// Event Handlers
// ============================================

/**
 * Attach event handlers to interactive elements
 */
function attachEventHandlers() {
  // Date picker selects
  const monthSelect = document.getElementById('month-select');
  const daySelect = document.getElementById('day-select');
  const yearSelect = document.getElementById('year-select');
  
  if (monthSelect) {
    monthSelect.addEventListener('change', handleMonthChange);
  }
  if (daySelect) {
    daySelect.addEventListener('change', handleDayChange);
  }
  if (yearSelect) {
    yearSelect.addEventListener('change', handleYearChange);
  }
  
  // Time travel button
  const timeTravelBtn = document.getElementById('time-travel-btn');
  if (timeTravelBtn) {
    timeTravelBtn.addEventListener('click', handleTimeTravel);
  }
  
  // Quick jump items
  const quickJumps = document.querySelectorAll('.quick-jump-item');
  quickJumps.forEach(item => {
    item.addEventListener('click', handleQuickJump);
  });
  
  // Retry button
  const retryButton = document.querySelector('.retry-button');
  if (retryButton) {
    retryButton.addEventListener('click', handleRetry);
  }
  
  // Home button
  const homeButton = document.querySelector('.home-button');
  if (homeButton) {
    homeButton.addEventListener('click', () => {
      getRouter().navigate(PAGE_NUMBERS.HOME);
    });
  }
}

/**
 * Handle month selection change
 */
function handleMonthChange(event) {
  selectedMonth = parseInt(event.target.value, 10);
  adjustDayForMonth();
  updateDateDisplay();
}

/**
 * Handle day selection change
 */
function handleDayChange(event) {
  selectedDay = parseInt(event.target.value, 10);
  updateDateDisplay();
}

/**
 * Handle year selection change
 */
function handleYearChange(event) {
  selectedYear = parseInt(event.target.value, 10);
  adjustDayForMonth();
  updateDateDisplay();
}

/**
 * Update the date display and day options
 */
function updateDateDisplay() {
  // Update day options if month/year changed
  const daySelect = document.getElementById('day-select');
  if (daySelect) {
    daySelect.innerHTML = renderDayOptions();
  }
  
  // Update selected date display
  const dateDisplay = document.querySelector('.selected-date');
  if (dateDisplay) {
    dateDisplay.textContent = formatTimeMachineDate(getSelectedDate());
  }
}

/**
 * Handle quick jump click (Req 8.7)
 */
function handleQuickJump(event) {
  const item = event.currentTarget;
  selectedMonth = parseInt(item.dataset.month, 10);
  selectedDay = parseInt(item.dataset.day, 10);
  selectedYear = parseInt(item.dataset.year, 10);
  
  // Update all selects
  const monthSelect = document.getElementById('month-select');
  const daySelect = document.getElementById('day-select');
  const yearSelect = document.getElementById('year-select');
  
  if (monthSelect) monthSelect.value = selectedMonth;
  if (daySelect) {
    daySelect.innerHTML = renderDayOptions();
    daySelect.value = selectedDay;
  }
  if (yearSelect) yearSelect.value = selectedYear;
  
  updateDateDisplay();
}

/**
 * Handle time travel button click (Req 8.8)
 */
function handleTimeTravel() {
  // Validate date
  if (!isValidDate(selectedMonth, selectedDay, selectedYear)) {
    errorMessage = 'INVALID DATE SELECTED';
    updatePage();
    return;
  }
  
  const date = getSelectedDate();
  if (!isInValidRange(date)) {
    errorMessage = 'DATE MUST BE 1940 TO YESTERDAY';
    updatePage();
    return;
  }
  
  // Save date to state
  const stateManager = getStateManager();
  stateManager.setTimeMachineDate(date);
  
  // Get router for navigation control
  const router = getRouter();
  
  // Play time travel animation (Req 11.1-11.10)
  const container = document.querySelector('.teletext-screen') || document.body;
  const screen = document.querySelector('.teletext-screen');
  
  playTimeTravelAnimation({
    container,
    targetYear: selectedYear,
    screen,
    disableNavigation: () => router.disableNavigation(),
    enableNavigation: () => router.enableNavigation(),
    onComplete: () => {
      // Navigate to events page after animation
      router.navigate(TIME_MACHINE_PAGES.EVENTS);
    }
  });
}

/**
 * Handle retry button click
 */
async function handleRetry() {
  try {
    errorMessage = null;
    
    if (currentSubPage === TIME_MACHINE_PAGES.EVENTS) {
      await loadEventsData();
    } else if (currentSubPage === TIME_MACHINE_PAGES.WEATHER) {
      await loadWeatherData();
    }
  } catch (error) {
    // Catch any unexpected errors during retry
    errorMessage = 'RETRY FAILED - PLEASE TRY AGAIN';
    updatePage();
  }
}

// ============================================
// Action Functions
// ============================================

/**
 * Return to present day (Req 11.7, 11.8)
 */
function returnToPresent() {
  const stateManager = getStateManager();
  
  if (!stateManager.isTimeMachineActive()) {
    // Not in time machine mode, just go home
    getRouter().navigate(PAGE_NUMBERS.HOME);
    return;
  }
  
  const fromYear = selectedYear;
  const router = getRouter();
  const container = document.querySelector('.teletext-screen') || document.body;
  const screen = document.querySelector('.teletext-screen');
  
  // Play reverse time travel animation
  playReverseTimeTravelAnimation({
    container,
    fromYear,
    screen,
    disableNavigation: () => router.disableNavigation(),
    enableNavigation: () => router.enableNavigation(),
    onComplete: () => {
      // Clear time machine state
      stateManager.clearTimeMachineDate();
      
      // Reset to default date
      initializeDate();
      
      // Navigate to home
      router.navigate(PAGE_NUMBERS.HOME);
    }
  });
}

/**
 * Select a random date
 */
function selectRandomDate() {
  const maxYear = getMaxYear();
  
  // Random year between MIN_YEAR and maxYear
  selectedYear = Math.floor(Math.random() * (maxYear - MIN_YEAR + 1)) + MIN_YEAR;
  
  // Random month
  selectedMonth = Math.floor(Math.random() * 12) + 1;
  
  // Random day (valid for the month)
  const maxDays = getDaysInMonth(selectedMonth, selectedYear);
  selectedDay = Math.floor(Math.random() * maxDays) + 1;
  
  // Update the page
  updatePage();
}

/**
 * Set the current event category (Req 9.7)
 */
function setCategory(category) {
  currentCategory = category;
  updatePage();
  animateContent();
}

// ============================================
// Animation Functions
// ============================================

/**
 * Animate page content appearing
 */
function animateContent() {
  const contentLines = document.querySelectorAll('.time-machine-page .content-line');
  const eventItems = document.querySelectorAll('.event-item');
  const quickJumps = document.querySelectorAll('.quick-jump-item');
  
  if (contentLines.length === 0 && eventItems.length === 0 && quickJumps.length === 0) {
    return;
  }
  
  // Kill any existing animation
  if (animationTimeline) {
    animationTimeline.kill();
    animationTimeline = null;
  }
  
  // Kill any existing tweens
  gsap.killTweensOf(contentLines);
  gsap.killTweensOf(eventItems);
  gsap.killTweensOf(quickJumps);
  
  animationTimeline = gsap.timeline();
  
  // Stagger content lines
  if (contentLines.length > 0) {
    animationTimeline.fromTo(contentLines, 
      { opacity: 0, y: 10 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.2, 
        stagger: 0.03, 
        ease: 'power2.out',
        clearProps: 'all'
      }
    );
  }
  
  // Stagger event items
  if (eventItems.length > 0) {
    animationTimeline.fromTo(eventItems, 
      { opacity: 0, x: -10 },
      { 
        opacity: 1, 
        x: 0, 
        duration: 0.2, 
        stagger: 0.05, 
        ease: 'power2.out',
        clearProps: 'all'
      }, 
      '-=0.1'
    );
  }
  
  // Stagger quick jumps
  if (quickJumps.length > 0) {
    animationTimeline.fromTo(quickJumps, 
      { opacity: 0, x: -10 },
      { 
        opacity: 1, 
        x: 0, 
        duration: 0.2, 
        stagger: 0.05, 
        ease: 'power2.out',
        clearProps: 'all'
      }, 
      '-=0.1'
    );
  }
}

// ============================================
// Utility Functions for Testing
// ============================================

/**
 * Reset the Time Machine page state
 */
export function resetTimeMachineState() {
  selectedMonth = 1;
  selectedDay = 1;
  selectedYear = 1975;
  currentSubPage = TIME_MACHINE_PAGES.DATE_SELECTION;
  eventsData = null;
  weatherData = null;
  isLoading = false;
  errorMessage = null;
  currentCategory = 'events';
  
  if (animationTimeline) {
    animationTimeline.kill();
    animationTimeline = null;
  }
}

/**
 * Get current selected date (for testing)
 */
export function getSelectedDateComponents() {
  return { month: selectedMonth, day: selectedDay, year: selectedYear };
}

/**
 * Set selected date (for testing)
 */
export function setSelectedDateComponents(month, day, year) {
  selectedMonth = month;
  selectedDay = day;
  selectedYear = year;
}

/**
 * Get current sub-page (for testing)
 */
export function getCurrentSubPage() {
  return currentSubPage;
}

/**
 * Set current sub-page (for testing)
 */
export function setCurrentSubPage(page) {
  currentSubPage = page;
}

/**
 * Get events data (for testing)
 */
export function getEventsData() {
  return eventsData;
}

/**
 * Set events data (for testing)
 */
export function setEventsData(data) {
  eventsData = data;
}

/**
 * Get weather data (for testing)
 */
export function getWeatherDataState() {
  return weatherData;
}

/**
 * Set weather data (for testing)
 */
export function setWeatherDataState(data) {
  weatherData = data;
}

/**
 * Get loading state (for testing)
 */
export function getIsLoading() {
  return isLoading;
}

/**
 * Get error message (for testing)
 */
export function getErrorMessage() {
  return errorMessage;
}

/**
 * Get current category (for testing)
 */
export function getCurrentCategory() {
  return currentCategory;
}

// ============================================
// Exports
// ============================================

export {
  TIME_MACHINE_PAGES as PAGE_NUMBERS_TM,
  TITLES,
  FAMOUS_DATES,
  initializeDate,
  getSelectedDate,
  isUserBirthday,
  returnToPresent,
  selectRandomDate,
  setCategory,
};

