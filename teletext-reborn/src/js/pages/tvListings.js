/**
 * Teletext Reborn - TV Listings Pages (Pages 600-609)
 * 
 * Displays TV schedule data from TVmaze API with:
 * - Index page (600) with menu and highlights
 * - Now On TV page (601) with current shows
 * - Tonight page (602) with prime time schedule
 * - Tomorrow page (603) with next day schedule
 * - Loading states and error handling
 * - Auto-refresh every 5 minutes
 * 
 * @module pages/tvListings
 * Requirements: 24.1-24.8, 25.1-25.9, 26.1-26.8
 */

import gsap from 'gsap';
import { PAGE_NUMBERS } from '../router.js';
import { createSeparator, formatDottedLeader } from '../utils/teletext.js';
import { formatTeletextDate, formatTimestampShort } from '../utils/date.js';
import {
  getSchedule,
  formatShowForDisplay,
  getHighlights,
  getCurrentShows,
  getPrimeTimeShows,
  isShowCurrentlyAiring,
  groupShowsByHour,
  getGenreIcon
} from '../services/tvmazeApi.js';

// ============================================
// Constants
// ============================================

/**
 * Page numbers for TV listings pages
 * @constant {Object}
 */
export const TV_PAGES = {
  INDEX: 600,
  NOW: 601,
  TONIGHT: 602,
  TOMORROW: 603,
  FULL_SCHEDULE: 604
};

/**
 * Page title for index
 * @constant {string}
 */
export const TITLE = '=== TV GUIDE ===';

/**
 * Auto-refresh interval (5 minutes in ms) - Req 25.9
 * @constant {number}
 */
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;

/**
 * Maximum shows to display per page
 * @constant {number}
 */
const MAX_SHOWS_PER_PAGE = 8;

// ============================================
// State
// ============================================

/**
 * GSAP timeline for animations
 * @type {gsap.core.Timeline|null}
 */
let animationTimeline = null;

/**
 * Auto-refresh interval ID
 * @type {number|null}
 */
let refreshIntervalId = null;

/**
 * Current page data
 * @type {Object|null}
 */
let currentData = null;

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
 * Cursor blink animation
 * @type {gsap.core.Tween|null}
 */
let cursorTween = null;


// ============================================
// Helper Functions
// ============================================

/**
 * Get tomorrow's date string in YYYY-MM-DD format
 * @returns {string} Tomorrow's date
 */
function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

/**
 * Get today's date string in YYYY-MM-DD format
 * @returns {string} Today's date
 */
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format last updated timestamp
 * @param {string} isoString - ISO timestamp
 * @returns {string} Formatted time (HH:MM)
 */
function formatLastUpdated(isoString) {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return formatTimestampShort(date);
}

/**
 * Get genre color class for a show
 * @param {string[]} genres - Array of genres
 * @returns {string} CSS color variable
 */
function getGenreColor(genres) {
  if (!Array.isArray(genres) || genres.length === 0) {
    return 'var(--tt-yellow)';
  }
  
  const genresLower = genres.map(g => (g || '').toLowerCase());
  
  // Film/Drama (Req 26.5)
  if (genresLower.some(g => g.includes('drama') || g.includes('thriller') || g.includes('horror') || g.includes('romance') || g.includes('action'))) {
    return 'var(--tt-magenta)';
  }
  
  // Sports (Req 26.6)
  if (genresLower.some(g => g.includes('sport'))) {
    return 'var(--tt-green)';
  }
  
  // News (Req 26.7)
  if (genresLower.some(g => g.includes('news') || g.includes('documentary'))) {
    return 'var(--tt-red)';
  }
  
  return 'var(--tt-yellow)';
}

// ============================================
// Render Functions - Index Page (600)
// ============================================

/**
 * Render the TV listings index page (600)
 * Requirements: 24.1-24.8
 * @param {Object|null} data - Schedule data
 * @returns {string} HTML content
 */
function renderIndexPage(data) {
  const currentDate = formatTeletextDate(new Date());
  const highlights = data ? getHighlights(data.shows, 3) : [];
  
  return `
    <div class="tv-listings-page teletext-page">
      <!-- Title (Req 24.1) -->
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-yellow);">
        ${TITLE}
      </div>
      
      <!-- Date (Req 24.5) -->
      <div class="content-line" style="text-align: center; color: var(--tt-cyan); margin-bottom: 6px;">
        ${currentDate}
      </div>
      
      <div class="content-line separator" style="color: var(--tt-cyan);">
        ${createSeparator('━', 40)}
      </div>
      
      <!-- Scrollable Content -->
      <div class="teletext-page-content">
        <!-- Menu (Req 24.2) -->
        <div class="tv-menu" style="margin: 8px 0;">
          <div class="menu-item content-line" data-page="601" style="cursor: pointer; color: var(--tt-yellow);">
            ${formatDottedLeader('► NOW ON TV', '601', 40)}
          </div>
          <div class="menu-item content-line" data-page="602" style="cursor: pointer; color: var(--tt-yellow);">
            ${formatDottedLeader('► TONIGHT', '602', 40)}
          </div>
          <div class="menu-item content-line" data-page="603" style="cursor: pointer; color: var(--tt-yellow);">
            ${formatDottedLeader('► TOMORROW', '603', 40)}
          </div>
          <div class="menu-item content-line" data-page="604" style="cursor: pointer; color: var(--tt-yellow);">
            ${formatDottedLeader('► FULL SCHEDULE', '604', 40)}
          </div>
        </div>
        
        <div class="content-line separator" style="color: var(--tt-cyan); margin: 8px 0;">
          ${createSeparator('━', 40)}
        </div>
        
        <!-- Highlights Section (Req 24.3, 24.4) -->
        <div class="content-line section-header" style="color: var(--tt-cyan);">
          TODAY'S HIGHLIGHTS
        </div>
        
        <div class="highlights-section" style="margin: 6px 0;">
          ${highlights.length > 0 ? highlights.map(show => {
            const formatted = formatShowForDisplay(show);
            return `
              <div class="highlight-row content-line" style="margin: 4px 0;">
                <span style="color: var(--tt-cyan);">${formatted.time}</span>
                <span style="color: var(--tt-white); margin-left: 8px;">${formatted.channel}</span>
                <span style="color: var(--tt-yellow); margin-left: 8px;">${formatted.title}</span>
              </div>
            `;
          }).join('') : `
            <div class="content-line" style="color: var(--color-secondary-70);">
              No highlights available
            </div>
          `}
        </div>
        
        <!-- Attribution (Req 24.8) -->
        <div class="content-line attribution" style="text-align: center; color: var(--tt-white); opacity: 0.7; margin-top: 12px;">
          VIA TVMAZE
        </div>
      </div>
    </div>
  `;
}

// ============================================
// Render Functions - Now On TV Page (601)
// ============================================

/**
 * Render the Now On TV page (601)
 * Requirements: 25.1-25.9
 * @param {Object|null} data - Schedule data
 * @returns {string} HTML content
 */
function renderNowPage(data) {
  const shows = data ? getCurrentShows(data.shows).slice(0, MAX_SHOWS_PER_PAGE) : [];
  const lastUpdated = data ? formatLastUpdated(data.lastUpdated) : '--:--';
  
  return `
    <div class="tv-listings-page now-page teletext-page">
      <!-- Title (Req 25.1) -->
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-cyan);">
        NOW ON TV
      </div>
      
      <div class="content-line separator" style="color: var(--tt-cyan);">
        ${createSeparator('━', 40)}
      </div>
      
      <!-- Scrollable Content -->
      <div class="teletext-page-content">
        <!-- Shows List (Req 25.3, 25.4, 25.5) -->
        <div class="shows-list" style="margin: 6px 0;">
          ${shows.length > 0 ? shows.map(show => {
            const formatted = formatShowForDisplay(show);
            const isAiring = isShowCurrentlyAiring(show);
            const indicator = isAiring ? '►' : ' ';
            
            return `
              <div class="show-row content-line" style="margin: 3px 0; display: flex; align-items: center;">
                <span class="now-indicator" style="color: var(--tt-green); width: 12px;">${indicator}</span>
                <span class="show-time" style="color: var(--tt-cyan); width: 45px;">${formatted.time}</span>
                <span class="show-channel" style="color: var(--tt-white); width: 55px; overflow: hidden;">${formatted.channel}</span>
                <span class="show-title" style="color: var(--tt-yellow); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${formatted.title}</span>
              </div>
            `;
          }).join('') : `
            <div class="content-line" style="color: var(--color-secondary-70); text-align: center;">
              No shows currently available
            </div>
          `}
        </div>
        
        <div class="content-line separator" style="color: var(--tt-cyan); margin: 8px 0;">
          ${createSeparator('━', 40)}
        </div>
        
        <!-- Last Updated (Req 25.8) -->
        <div class="content-line" style="color: var(--tt-white); opacity: 0.7;">
          LAST UPDATED: ${lastUpdated}
        </div>
        
        <!-- Stale/Cached Notice (Req 32.4) -->
        ${data && data._stale ? `
          <div class="content-line" style="color: var(--tt-yellow);">
            * USING CACHED DATA
          </div>
        ` : ''}
        
        <!-- Attribution -->
        <div class="content-line attribution" style="text-align: center; color: var(--tt-white); opacity: 0.7; margin-top: 8px;">
          VIA TVMAZE
        </div>
      </div>
    </div>
  `;
}


// ============================================
// Render Functions - Tonight Page (602)
// ============================================

/**
 * Render the Tonight page (602)
 * Requirements: 26.1-26.8
 * @param {Object|null} data - Schedule data
 * @returns {string} HTML content
 */
function renderTonightPage(data) {
  const primeTimeShows = data ? getPrimeTimeShows(data.shows) : [];
  const groupedShows = groupShowsByHour(primeTimeShows);
  const hours = Object.keys(groupedShows).sort();
  
  return `
    <div class="tv-listings-page tonight-page teletext-page">
      <!-- Title (Req 26.1) -->
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-yellow);">
        TONIGHT ON TV
      </div>
      
      <div class="content-line separator" style="color: var(--tt-yellow);">
        ${createSeparator('━', 40)}
      </div>
      
      <!-- Scrollable Content -->
      <div class="teletext-page-content">
        <!-- Prime Time Schedule (Req 26.2, 26.3) -->
        <div class="tonight-schedule" style="margin: 6px 0;">
          ${hours.length > 0 ? hours.map(hour => {
            const showsInHour = groupedShows[hour].slice(0, 4); // Max 4 per hour
            return `
              <!-- Hour Header (Req 26.3) -->
              <div class="hour-header content-line" style="color: var(--tt-cyan); margin-top: 6px; margin-bottom: 2px;">
                ${hour}
              </div>
              ${showsInHour.map(show => {
                const formatted = formatShowForDisplay(show);
                const genreIcon = getGenreIcon(show.genres);
                const genreColor = getGenreColor(show.genres);
                
                return `
                  <div class="show-row content-line" style="margin: 2px 0; display: flex; align-items: center;">
                    <span class="show-time" style="color: var(--tt-cyan); width: 45px;">${formatted.time}</span>
                    <span class="show-channel" style="color: var(--tt-white); width: 50px; overflow: hidden;">${formatted.channel}</span>
                    <span class="genre-icon" style="width: 20px;">${genreIcon}</span>
                    <span class="show-title" style="color: ${genreColor}; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${formatted.title}</span>
                  </div>
                `;
              }).join('')}
            `;
          }).join('') : `
            <div class="content-line" style="color: var(--color-secondary-70); text-align: center;">
              No prime time shows available
            </div>
          `}
        </div>
        
        <!-- Legend -->
        <div class="content-line separator" style="color: var(--tt-yellow); margin: 8px 0;">
          ${createSeparator('─', 40)}
        </div>
        
        <div class="legend" style="font-size: 10px; margin: 4px 0;">
          <span style="color: var(--tt-magenta);">[F] FILM</span>
          <span style="color: var(--tt-green); margin-left: 12px;">[S] SPORTS</span>
          <span style="color: var(--tt-red); margin-left: 12px;">[N] NEWS</span>
        </div>
        
        <!-- Attribution -->
        <div class="content-line attribution" style="text-align: center; color: var(--tt-white); opacity: 0.7; margin-top: 8px;">
          VIA TVMAZE
        </div>
      </div>
    </div>
  `;
}

// ============================================
// Render Functions - Tomorrow Page (603)
// ============================================

/**
 * Render the Tomorrow page (603)
 * @param {Object|null} data - Schedule data
 * @returns {string} HTML content
 */
function renderTomorrowPage(data) {
  const shows = data ? data.shows.slice(0, MAX_SHOWS_PER_PAGE) : [];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = formatTeletextDate(tomorrow);
  
  return `
    <div class="tv-listings-page tomorrow-page teletext-page">
      <!-- Title -->
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-yellow);">
        TOMORROW
      </div>
      
      <!-- Date -->
      <div class="content-line" style="text-align: center; color: var(--tt-cyan); margin-bottom: 6px;">
        ${tomorrowDate}
      </div>
      
      <div class="content-line separator" style="color: var(--tt-yellow);">
        ${createSeparator('━', 40)}
      </div>
      
      <!-- Scrollable Content -->
      <div class="teletext-page-content">
        <!-- Shows List -->
        <div class="shows-list" style="margin: 6px 0;">
          ${shows.length > 0 ? shows.map(show => {
            const formatted = formatShowForDisplay(show);
            const genreIcon = getGenreIcon(show.genres);
            const genreColor = getGenreColor(show.genres);
            
            return `
              <div class="show-row content-line" style="margin: 3px 0; display: flex; align-items: center;">
                <span class="show-time" style="color: var(--tt-cyan); width: 45px;">${formatted.time}</span>
                <span class="show-channel" style="color: var(--tt-white); width: 50px; overflow: hidden;">${formatted.channel}</span>
                <span class="genre-icon" style="width: 20px;">${genreIcon}</span>
                <span class="show-title" style="color: ${genreColor}; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${formatted.title}</span>
              </div>
            `;
          }).join('') : `
            <div class="content-line" style="color: var(--color-secondary-70); text-align: center;">
              No shows available for tomorrow
            </div>
          `}
        </div>
        
        <!-- Attribution -->
        <div class="content-line attribution" style="text-align: center; color: var(--tt-white); opacity: 0.7; margin-top: 12px;">
          VIA TVMAZE
        </div>
      </div>
    </div>
  `;
}

// ============================================
// Render Functions - Loading & Error States
// ============================================

/**
 * Render loading state (Req 25.6)
 * @returns {string} HTML for loading state
 */
function renderLoading() {
  return `
    <div class="tv-listings-page teletext-page">
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-yellow);">
        ${TITLE}
      </div>
      
      <div class="teletext-page-content">
        <div class="loading-container" style="text-align: center; margin-top: 24px;">
          <div class="loading-text" style="color: var(--tt-cyan);">
            CHECKING SCHEDULES<span class="loading-cursor">█</span>
          </div>
          <div class="loading-dots" style="color: var(--tt-yellow); margin-top: 8px;">...</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render error state (Req 25.7)
 * @param {string} message - Error message
 * @returns {string} HTML for error state
 */
function renderError(message) {
  return `
    <div class="tv-listings-page teletext-page">
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-yellow);">
        ${TITLE}
      </div>
      
      <div class="teletext-page-content">
        <div class="error-container" style="text-align: center; margin-top: 20px; border: 2px solid var(--tt-red); padding: 12px;">
          <div class="error-icon" style="color: var(--tt-red); font-size: 18px;">!</div>
          <div class="error-title" style="color: var(--tt-red); margin-top: 6px;">
            SERVICE UNAVAILABLE
          </div>
          <div class="error-message" style="color: var(--tt-white); margin-top: 6px; opacity: 0.8;">
            ${message || 'Unable to fetch TV listings'}
          </div>
          <div class="error-actions" style="margin-top: 12px; display: flex; justify-content: center; gap: 12px;">
            <button class="retry-button fastext-button fastext-button--red" style="cursor: pointer;">
              RETRY
            </button>
            <button class="home-button fastext-button fastext-button--cyan" style="cursor: pointer;">
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
 * Render the TV listings page content
 * Requirements: 24.1-24.8, 25.1-25.9, 26.1-26.8
 * 
 * @param {number} pageNumber - Page number (600-609)
 * @returns {string} HTML content for the page
 */
export function render(pageNumber) {
  // Show loading state if loading
  if (isLoading) {
    return renderLoading();
  }
  
  // Show error state if error
  if (errorMessage) {
    return renderError(errorMessage);
  }
  
  // Index page (600)
  if (pageNumber === TV_PAGES.INDEX) {
    return renderIndexPage(currentData);
  }
  
  // Now On TV page (601)
  if (pageNumber === TV_PAGES.NOW) {
    return renderNowPage(currentData);
  }
  
  // Tonight page (602)
  if (pageNumber === TV_PAGES.TONIGHT) {
    return renderTonightPage(currentData);
  }
  
  // Tomorrow page (603)
  if (pageNumber === TV_PAGES.TOMORROW) {
    return renderTomorrowPage(currentData);
  }
  
  // Full Schedule page (604) - same as index for now
  if (pageNumber === TV_PAGES.FULL_SCHEDULE) {
    return renderIndexPage(currentData);
  }
  
  // Unknown page - show index
  return renderIndexPage(currentData);
}

/**
 * Called after the page is rendered and mounted to the DOM
 * Initializes data fetching and animations
 * Requirements: 24.7, 25.9
 * 
 * @param {number} pageNumber - Page number
 */
export async function onMount(pageNumber) {
  // Attach click handlers for navigation
  attachClickHandlers(pageNumber);
  
  // Fetch data for the page
  await fetchDataForPage(pageNumber);
  
  // Animate content
  animateMenuItems();
  
  // Start cursor blink animation
  startCursorBlink();
  
  // Start auto-refresh for live pages (Req 25.9)
  if (pageNumber === TV_PAGES.NOW || pageNumber === TV_PAGES.INDEX) {
    startAutoRefresh(pageNumber);
  }
}

/**
 * Called before the page is unmounted
 * Cleans up animations and intervals
 */
export function onUnmount() {
  // Kill main animation timeline
  if (animationTimeline) {
    animationTimeline.kill();
    animationTimeline = null;
  }
  
  // Kill cursor animation
  if (cursorTween) {
    cursorTween.kill();
    cursorTween = null;
  }
  
  // Stop auto-refresh
  stopAutoRefresh();
  
  // Kill any tweens on TV listings elements
  const elements = document.querySelectorAll('.tv-listings-page *');
  if (elements.length > 0) {
    gsap.killTweensOf(elements);
  }
  
  // Reset state
  isLoading = false;
  errorMessage = null;
}

/**
 * Get Fastext button configuration for this page
 * Requirements: 24.6, 25.8, 26.8
 * 
 * @param {number} pageNumber - Current page number
 * @returns {Object} Fastext button configuration
 */
export function getFastextButtons(pageNumber) {
  // Index page (600) - Req 24.6
  if (pageNumber === TV_PAGES.INDEX) {
    return {
      red: { label: 'HOME', page: PAGE_NUMBERS.HOME },
      green: { label: 'NOW', page: TV_PAGES.NOW },
      yellow: { label: 'TONIGHT', page: TV_PAGES.TONIGHT },
      cyan: { label: 'TOMORROW', page: TV_PAGES.TOMORROW }
    };
  }
  
  // Now On TV page (601)
  if (pageNumber === TV_PAGES.NOW) {
    return {
      red: { label: 'INDEX', page: TV_PAGES.INDEX },
      green: { label: 'TONIGHT', page: TV_PAGES.TONIGHT },
      yellow: { label: 'TOMORROW', page: TV_PAGES.TOMORROW },
      cyan: { label: 'REFRESH', page: null } // Special action
    };
  }
  
  // Tonight page (602) - Req 26.8
  if (pageNumber === TV_PAGES.TONIGHT) {
    return {
      red: { label: 'NOW', page: TV_PAGES.NOW },
      green: { label: 'LATE', page: TV_PAGES.FULL_SCHEDULE },
      yellow: { label: 'TOMORROW', page: TV_PAGES.TOMORROW },
      cyan: { label: 'INDEX', page: TV_PAGES.INDEX }
    };
  }
  
  // Tomorrow page (603)
  if (pageNumber === TV_PAGES.TOMORROW) {
    return {
      red: { label: 'INDEX', page: TV_PAGES.INDEX },
      green: { label: 'NOW', page: TV_PAGES.NOW },
      yellow: { label: 'TONIGHT', page: TV_PAGES.TONIGHT },
      cyan: { label: 'HOME', page: PAGE_NUMBERS.HOME }
    };
  }
  
  // Default
  return {
    red: { label: 'HOME', page: PAGE_NUMBERS.HOME },
    green: { label: 'NOW', page: TV_PAGES.NOW },
    yellow: { label: 'TONIGHT', page: TV_PAGES.TONIGHT },
    cyan: { label: 'NEWS', page: PAGE_NUMBERS.NEWS_TOP }
  };
}

// ============================================
// Data Fetching
// ============================================

/**
 * Fetch data for the current page
 * @param {number} pageNumber - Page number
 */
async function fetchDataForPage(pageNumber) {
  // Determine which date to fetch
  let date = getTodayDate();
  if (pageNumber === TV_PAGES.TOMORROW) {
    date = getTomorrowDate();
  }
  
  // Set loading state
  isLoading = true;
  errorMessage = null;
  
  // Re-render to show loading
  updatePageContent(pageNumber);
  
  try {
    const data = await getSchedule('US', date);
    currentData = data;
    isLoading = false;
    
    // Re-render with data
    updatePageContent(pageNumber);
    
    // Animate content after data loads
    animateMenuItems();
    
  } catch (error) {
    isLoading = false;
    errorMessage = error.message || 'Failed to fetch TV schedule';
    currentData = null;
    
    // Re-render with error
    updatePageContent(pageNumber);
    
    // Attach retry handler
    attachRetryHandler(pageNumber);
  }
}

/**
 * Update page content in the DOM
 * @param {number} pageNumber - Page number
 */
function updatePageContent(pageNumber) {
  const contentArea = document.querySelector('.content-area');
  if (contentArea) {
    contentArea.innerHTML = render(pageNumber);
    attachClickHandlers(pageNumber);
  }
}

/**
 * Refresh data for the current page
 * @param {number} pageNumber - Page number
 */
async function refreshData(pageNumber) {
  await fetchDataForPage(pageNumber);
}

// ============================================
// Auto-Refresh
// ============================================

/**
 * Start auto-refresh interval (Req 25.9)
 * @param {number} pageNumber - Page number
 */
function startAutoRefresh(pageNumber) {
  // Clear any existing interval
  stopAutoRefresh();
  
  // Set up new interval
  refreshIntervalId = setInterval(() => {
    refreshData(pageNumber);
  }, AUTO_REFRESH_INTERVAL);
}

/**
 * Stop auto-refresh interval
 */
function stopAutoRefresh() {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }
}

// ============================================
// Animation Functions
// ============================================

/**
 * Animate menu items appearing with GSAP stagger (Req 24.7)
 */
function animateMenuItems() {
  const menuItems = document.querySelectorAll('.tv-listings-page .menu-item, .tv-listings-page .show-row');
  
  if (menuItems.length === 0) {
    return;
  }
  
  // Kill any existing animation
  if (animationTimeline) {
    animationTimeline.kill();
  }
  
  // Create stagger animation
  animationTimeline = gsap.timeline();
  
  animationTimeline.from(menuItems, {
    opacity: 0,
    x: -10,
    duration: 0.3,
    stagger: 0.05, // 0.05s delay between items
    ease: 'power2.out'
  });
}

/**
 * Start cursor blink animation
 */
function startCursorBlink() {
  const cursor = document.querySelector('.loading-cursor');
  if (!cursor) return;
  
  // Kill any existing cursor animation
  if (cursorTween) {
    cursorTween.kill();
  }
  
  cursorTween = gsap.to(cursor, {
    opacity: 0,
    duration: 0.53,
    repeat: -1,
    yoyo: true,
    ease: 'steps(1)'
  });
}

// ============================================
// Event Handlers
// ============================================

/**
 * Attach click handlers to interactive elements
 * @param {number} pageNumber - Current page number
 */
function attachClickHandlers(pageNumber) {
  // Menu item clicks
  const menuItems = document.querySelectorAll('.tv-listings-page .menu-item[data-page]');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetPage = parseInt(item.dataset.page, 10);
      if (!isNaN(targetPage)) {
        navigateToPage(targetPage);
      }
    });
  });
  
  // Home button in error state
  const homeButton = document.querySelector('.home-button');
  if (homeButton) {
    homeButton.addEventListener('click', () => {
      navigateToPage(PAGE_NUMBERS.HOME);
    });
  }
}

/**
 * Attach retry handler for error state
 * @param {number} pageNumber - Current page number
 */
function attachRetryHandler(pageNumber) {
  const retryButton = document.querySelector('.retry-button');
  if (retryButton) {
    retryButton.addEventListener('click', () => {
      fetchDataForPage(pageNumber);
    });
  }
}

/**
 * Navigate to a page using the router
 * @param {number} pageNumber - Page number to navigate to
 */
function navigateToPage(pageNumber) {
  import('../router.js').then(({ getRouter }) => {
    const router = getRouter();
    router.navigate(pageNumber);
  });
}

// ============================================
// Utility Functions for Testing
// ============================================

/**
 * Reset the TV listings page state (useful for testing)
 */
export function resetTVListingsPageState() {
  if (animationTimeline) {
    animationTimeline.kill();
    animationTimeline = null;
  }
  if (cursorTween) {
    cursorTween.kill();
    cursorTween = null;
  }
  stopAutoRefresh();
  currentData = null;
  isLoading = false;
  errorMessage = null;
}

/**
 * Get all TV page numbers (for testing)
 * @returns {Object} Page numbers object
 */
export function getTVPages() {
  return { ...TV_PAGES };
}

/**
 * Set loading state (for testing)
 * @param {boolean} loading - Loading state
 */
export function setLoadingState(loading) {
  isLoading = loading;
}

/**
 * Set error state (for testing)
 * @param {string|null} error - Error message
 */
export function setErrorState(error) {
  errorMessage = error;
}

/**
 * Set current data (for testing)
 * @param {Object|null} data - Schedule data
 */
export function setCurrentData(data) {
  currentData = data;
}

// ============================================
// Exports
// ============================================

export {
  TV_PAGES as PAGE_NUMBERS_TV,
  AUTO_REFRESH_INTERVAL
};
