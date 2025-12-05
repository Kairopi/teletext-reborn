/**
 * Teletext Reborn - Home Page (Page 100)
 * 
 * The main landing page displaying:
 * - Double-height "★ TELETEXT REBORN ★" title
 * - Current date display
 * - Welcome message
 * - Navigation menu with dotted leaders
 * - Mini weather widget
 * - Rotating tips section
 * 
 * @module pages/home
 * Requirements: 4.1-4.10
 */

import gsap from 'gsap';
import { PAGE_NUMBERS } from '../router.js';
import { getStateManager } from '../state.js';
import { formatTeletextDate } from '../utils/date.js';
import { formatDottedLeader, createSeparator, BLOCK_CHARS } from '../utils/teletext.js';
import { getLocation } from '../services/geoApi.js';
import { getCurrentWeather, formatTemperature } from '../services/weatherApi.js';

// ============================================
// Constants
// ============================================

/**
 * Page number for home page
 * @constant {number}
 */
export const PAGE_NUMBER = PAGE_NUMBERS.HOME;

/**
 * Page title
 * @constant {string}
 */
export const TITLE = '★ TELETEXT REBORN ★';

/**
 * Navigation menu items with page numbers
 * @constant {Array<{label: string, page: number}>}
 */
const MENU_ITEMS = [
  { label: 'NEWS', page: PAGE_NUMBERS.NEWS_TOP },
  { label: 'WEATHER', page: PAGE_NUMBERS.WEATHER },
  { label: 'FINANCE', page: PAGE_NUMBERS.FINANCE },
  { label: 'TIME MACHINE', page: PAGE_NUMBERS.TIME_MACHINE },
  { label: 'SETTINGS', page: PAGE_NUMBERS.SETTINGS },
];

/**
 * Rotating tips about Teletext history and keyboard shortcuts
 * Requirements: 4.5, 4.10
 * @constant {string[]}
 */
const TIPS = [
  'TIP: Press ? for keyboard shortcuts',
  'TIP: ↑↑↓↓←→←→BA = RAINBOW BURST MODE!',
  'TIP: Teletext launched in 1974 on BBC',
  'TIP: Use number keys 1-9 for quick nav',
  'TIP: Ceefax served 20M UK viewers',
  'TIP: Arrow keys navigate between pages',
  'TIP: Teletext ran until 2012 in the UK',
  'TIP: Press ESC to return home anytime',
  'TIP: Time Machine goes back to 1940!',
  'TIP: Teletext used only 8 colours',
  'TIP: Each page had max 24 lines of text',
  'TIP: Press 7 for Easter Egg page!',
];

/**
 * Current tip index for rotation
 * @type {number}
 */
let currentTipIndex = 0;

/**
 * Weather data cache for the home page
 * @type {Object|null}
 */
let weatherCache = null;

/**
 * Weather loading state
 * @type {boolean}
 */
let isLoadingWeather = false;

/**
 * GSAP timeline for menu stagger animation
 * @type {gsap.core.Timeline|null}
 */
let menuTimeline = null;

// ============================================
// Helper Functions
// ============================================

/**
 * Get the next tip in rotation (Req 4.10)
 * @returns {string} Next tip text
 */
function getNextTip() {
  const tip = TIPS[currentTipIndex];
  currentTipIndex = (currentTipIndex + 1) % TIPS.length;
  return tip;
}

/**
 * Format weather for mini widget display (Req 4.6)
 * @param {Object|null} weather - Weather data
 * @param {Object|null} location - Location data
 * @param {string} unit - Temperature unit
 * @returns {string} Formatted weather string
 */
function formatWeatherWidget(weather, location, unit) {
  if (!weather || !weather.current || weather.current.temperature === null) {
    return '';
  }
  
  // Get city name - prioritize location object's city, then weather cache
  const city = location?.city || weather?.city || 'YOUR LOCATION';
  const temp = formatTemperature(weather.current.temperature, unit);
  const condition = weather.current.condition || '';
  
  return `☀ ${city.toUpperCase()}: ${temp} ${condition}`;
}

// ============================================
// Page Interface Implementation
// ============================================

/**
 * Render the home page content
 * Requirements: 4.1-4.10
 * 
 * @returns {string} HTML content for the home page
 */
export function render() {
  const stateManager = getStateManager();
  const settings = stateManager.getSettings();
  const unit = settings.temperatureUnit || 'celsius';
  
  // Get current date (Req 4.2)
  const currentDate = formatTeletextDate(new Date());
  
  // Get current tip (Req 4.5, 4.10)
  const tip = getNextTip();
  
  // Format weather widget (Req 4.6)
  const weatherText = formatWeatherWidget(weatherCache, settings.location, unit);
  
  // Build menu items with dotted leaders (Req 4.4)
  // Using block character bullet from BLOCK_CHARS for authentic Teletext feel
  const menuHTML = MENU_ITEMS.map((item, index) => {
    const formattedLine = formatDottedLeader(`${BLOCK_CHARS.BULLET} ${item.label}`, item.page.toString(), 36);
    return `<div class="menu-item content-line" data-page="${item.page}" data-index="${index}">${formattedLine}</div>`;
  }).join('\n');
  
  // Build the page content - consistent layout
  return `
    <div class="home-page teletext-page">
      <!-- Title (Req 4.1) -->
      <div class="teletext-page-title phosphor-glow">
        ${TITLE}
      </div>
      
      <!-- Current Date (Req 4.2) -->
      <div class="content-line date-display" style="text-align: center; color: var(--tt-cyan);">
        ${currentDate}
      </div>
      
      <!-- Welcome Message (Req 4.3) -->
      <div class="content-line welcome-message" style="text-align: center; color: var(--tt-white); margin-top: 4px;">
        WELCOME TO TELETEXT REBORN
      </div>
      <div class="content-line welcome-subtitle" style="text-align: center; color: var(--color-secondary-70);">
        YOUR RETRO INFORMATION SERVICE
      </div>
      
      <!-- Separator -->
      <div class="content-line separator" style="color: var(--tt-cyan); margin: 6px 0;">
        ${createSeparator('━', 40)}
      </div>
      
      <!-- Scrollable Content -->
      <div class="teletext-page-content">
        <!-- Navigation Menu (Req 4.4) -->
        <div class="menu-container" style="margin: 4px 0;">
          ${menuHTML}
        </div>
        
        <!-- Separator -->
        <div class="content-line separator" style="color: var(--tt-cyan); margin: 6px 0;">
          ${createSeparator('━', 40)}
        </div>
        
        <!-- Tip Section (Req 4.5, 4.9) -->
        <div class="content-line tip-section" style="color: var(--tt-green);">
          ${tip}
        </div>
        
        <!-- Weather Widget (Req 4.6) -->
        ${weatherText ? `
        <div class="content-line weather-widget" style="color: var(--tt-cyan); margin-top: 6px;">
          ${weatherText}
        </div>
        ` : `
        <div class="content-line weather-widget weather-loading" style="color: var(--color-secondary-70); margin-top: 6px;">
          ${isLoadingWeather ? 'LOADING WEATHER…' : ''}
        </div>
        `}
      </div>
      
      <!-- Footer for consistency -->
      <div class="teletext-page-footer" style="text-align: center;">
        PRESS ? FOR HELP
      </div>
    </div>
  `;
}

/**
 * Called after the page is rendered and mounted to the DOM
 * Initializes animations and loads weather data
 * Requirements: 4.6, 4.7
 */
export async function onMount() {
  // Animate menu items with stagger (Req 4.7)
  animateMenuItems();
  
  // Attach click handlers to menu items
  attachMenuClickHandlers();
  
  // Load weather data if location is known (Req 4.6)
  await loadWeatherData();
}

/**
 * Called before the page is unmounted
 * Cleans up animations and event listeners
 */
export function onUnmount() {
  // Kill any running animations
  if (menuTimeline) {
    menuTimeline.kill();
    menuTimeline = null;
  }
  
  // Kill any tweens on menu items
  const menuItems = document.querySelectorAll('.menu-item');
  if (menuItems.length > 0) {
    gsap.killTweensOf(menuItems);
  }
}

/**
 * Get Fastext button configuration for this page
 * Requirements: 4.8
 * 
 * @returns {Object} Fastext button configuration
 */
export function getFastextButtons() {
  return {
    red: { label: 'NEWS', page: PAGE_NUMBERS.NEWS_TOP },
    green: { label: 'WEATHER', page: PAGE_NUMBERS.WEATHER },
    yellow: { label: 'FINANCE', page: PAGE_NUMBERS.FINANCE },
    cyan: { label: 'TIME', page: PAGE_NUMBERS.TIME_MACHINE },
  };
}

// ============================================
// Animation Functions
// ============================================

/**
 * Animate menu items appearing with GSAP stagger
 * Requirements: 4.7
 */
function animateMenuItems() {
  const menuItems = document.querySelectorAll('.menu-item');
  
  if (menuItems.length === 0) {
    return;
  }
  
  // Kill any existing animation
  if (menuTimeline) {
    menuTimeline.kill();
  }
  
  // Create stagger animation (Req 4.7: 0.1s delay between items)
  menuTimeline = gsap.timeline();
  
  menuTimeline.from(menuItems, {
    opacity: 0,
    x: -10,
    duration: 0.3,
    stagger: 0.1, // 0.1s delay between items per Req 4.7
    ease: 'power2.out',
  });
}

/**
 * Attach click handlers to menu items for navigation
 */
function attachMenuClickHandlers() {
  const menuItems = document.querySelectorAll('.menu-item');
  
  menuItems.forEach(item => {
    item.style.cursor = 'pointer';
    
    item.addEventListener('click', () => {
      const pageNumber = parseInt(item.dataset.page, 10);
      if (!isNaN(pageNumber)) {
        // Import router dynamically to avoid circular dependency
        import('../router.js').then(({ getRouter }) => {
          const router = getRouter();
          router.navigate(pageNumber);
        });
      }
    });
  });
}

// ============================================
// Weather Functions
// ============================================

/**
 * Load weather data for the mini widget
 * Requirements: 4.6
 */
async function loadWeatherData() {
  const stateManager = getStateManager();
  const settings = stateManager.getSettings();
  
  // If we already have cached weather, don't reload
  if (weatherCache) {
    return;
  }
  
  isLoadingWeather = true;
  updateWeatherWidget();
  
  try {
    // Get location (from settings or detect)
    const location = await getLocation(settings.location);
    
    if (location && location.lat !== null && location.lon !== null) {
      // Fetch current weather
      const weather = await getCurrentWeather(
        location.lat,
        location.lon,
        location.city
      );
      
      weatherCache = weather;
      
      // Update the widget with weather data
      updateWeatherWidget();
    }
  } catch (error) {
    console.warn('Failed to load weather for home page:', error);
  } finally {
    isLoadingWeather = false;
  }
}

/**
 * Update the weather widget in the DOM
 */
function updateWeatherWidget() {
  const widget = document.querySelector('.weather-widget');
  if (!widget) return;
  
  const stateManager = getStateManager();
  const settings = stateManager.getSettings();
  const unit = settings.temperatureUnit || 'celsius';
  
  const weatherText = formatWeatherWidget(weatherCache, settings.location || weatherCache, unit);
  
  if (weatherText) {
    widget.textContent = weatherText;
    widget.style.color = 'var(--tt-cyan)';
    widget.classList.remove('weather-loading');
  } else if (isLoadingWeather) {
    widget.textContent = 'LOADING WEATHER…';
    widget.style.color = 'var(--color-secondary-70)';
    widget.classList.add('weather-loading');
  } else {
    widget.textContent = '';
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Reset the home page state (useful for testing)
 */
export function resetHomePageState() {
  currentTipIndex = 0;
  weatherCache = null;
  isLoadingWeather = false;
  if (menuTimeline) {
    menuTimeline.kill();
    menuTimeline = null;
  }
}

/**
 * Get the current tip index (for testing)
 * @returns {number} Current tip index
 */
export function getCurrentTipIndex() {
  return currentTipIndex;
}

/**
 * Get the tips array (for testing)
 * @returns {string[]} Tips array
 */
export function getTips() {
  return [...TIPS];
}

// ============================================
// Exports
// ============================================

export {
  MENU_ITEMS,
  TIPS,
};
