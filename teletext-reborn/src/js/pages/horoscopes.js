/**
 * Teletext Reborn - Horoscopes Pages (Pages 450-463)
 * 
 * Displays mystical Oracle-style zodiac readings with:
 * - Index page (450) with 4x3 zodiac grid
 * - Individual sign pages (451-462) with full horoscope
 * - Lucky numbers page (463) with slot machine animation
 * - Star twinkle animations and GSAP effects
 * 
 * @module pages/horoscopes
 * Requirements: 27.1-27.9, 28.1-28.11, 29.1-29.6
 */

import gsap from 'gsap';
import { PAGE_NUMBERS } from '../router.js';
import { getStateManager } from '../state.js';
import { truncateToWidth, centerText, createSeparator } from '../utils/teletext.js';
import { formatTeletextDate } from '../utils/date.js';
import {
  ZODIAC_SIGNS,
  ELEMENT_COLORS,
  getDailyHoroscope,
  getSignById,
  getSignFromBirthday,
  generateLuckyNumbers,
  hashDate,
  formatStarRating,
  getAllSigns
} from '../services/horoscopeService.js';

// ============================================
// Constants
// ============================================

/**
 * Page numbers for horoscope pages
 * @constant {Object}
 */
export const HOROSCOPE_PAGES = {
  INDEX: 450,
  ARIES: 451,
  TAURUS: 452,
  GEMINI: 453,
  CANCER: 454,
  LEO: 455,
  VIRGO: 456,
  LIBRA: 457,
  SCORPIO: 458,
  SAGITTARIUS: 459,
  CAPRICORN: 460,
  AQUARIUS: 461,
  PISCES: 462,
  LUCKY_NUMBERS: 463
};

/**
 * Page title for index
 * @constant {string}
 */
export const TITLE = '* MYSTIC STARS *';

/**
 * Moon phase icons for display
 * @constant {string[]}
 */
const MOON_PHASES = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

// ============================================
// State
// ============================================

/**
 * GSAP timeline for animations
 * @type {gsap.core.Timeline|null}
 */
let animationTimeline = null;

/**
 * Star twinkle animation tweens
 * @type {gsap.core.Tween[]|null}
 */
let starTweens = [];

/**
 * Lucky numbers animation timeline
 * @type {gsap.core.Timeline|null}
 */
let luckyNumbersTimeline = null;


// ============================================
// Helper Functions
// ============================================

/**
 * Get sign ID from page number (451-462 maps to 1-12)
 * @param {number} pageNumber - Page number
 * @returns {number|null} Sign ID or null
 */
function getSignIdFromPage(pageNumber) {
  if (pageNumber >= 451 && pageNumber <= 462) {
    return pageNumber - 450;
  }
  return null;
}

/**
 * Get page number from sign ID
 * @param {number} signId - Sign ID (1-12)
 * @returns {number} Page number
 */
function getPageFromSignId(signId) {
  return 450 + signId;
}

/**
 * Get current moon phase icon based on date
 * @returns {string} Moon phase emoji
 */
function getMoonPhase() {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const phaseIndex = Math.floor((dayOfMonth % 30) / 3.75);
  return MOON_PHASES[phaseIndex % MOON_PHASES.length];
}

/**
 * Get user's zodiac sign from settings
 * @returns {Object|null} User's zodiac sign or null
 */
function getUserSign() {
  const stateManager = getStateManager();
  const settings = stateManager.getSettings();
  
  if (settings.birthday && settings.birthday.month && settings.birthday.day) {
    return getSignFromBirthday(settings.birthday.month, settings.birthday.day);
  }
  return null;
}

/**
 * Get element color class for a sign
 * @param {string} element - Element name (fire, earth, air, water)
 * @returns {string} CSS color variable
 */
function getElementColorVar(element) {
  const colorMap = {
    fire: 'var(--tt-red)',
    earth: 'var(--tt-green)',
    air: 'var(--tt-cyan)',
    water: 'var(--tt-magenta)'
  };
  return colorMap[element] || 'var(--tt-yellow)';
}

// ============================================
// Render Functions - Index Page (450)
// ============================================

/**
 * Render the horoscopes index page (450)
 * Requirements: 27.1-27.9
 * @returns {string} HTML content
 */
function renderIndexPage() {
  const userSign = getUserSign();
  const currentDate = formatTeletextDate(new Date());
  const moonPhase = getMoonPhase();
  
  // Build 4x3 zodiac grid (Req 27.3)
  const gridHTML = renderZodiacGrid(userSign);
  
  return `
    <div class="horoscopes-page teletext-page">
      <!-- Title (Req 27.1) -->
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-magenta);">
        ${TITLE}
      </div>
      
      <!-- Tagline (Req 27.2) -->
      <div class="content-line tagline" style="text-align: center; color: var(--tt-cyan); margin-bottom: 8px;">
        The stars reveal your destiny...
      </div>
      
      <div class="content-line separator" style="color: var(--tt-cyan);">
        ${createSeparator('━', 40)}
      </div>
      
      <!-- Scrollable Content -->
      <div class="teletext-page-content">
        <!-- Zodiac Grid (Req 27.3, 27.4) -->
        <div class="zodiac-grid" style="margin: 8px 0;">
          ${gridHTML}
        </div>
        
        <!-- User's Sign Highlight (Req 27.5) -->
        ${userSign ? `
        <div class="content-line user-sign-notice" style="text-align: center; color: var(--tt-magenta); margin-top: 8px;">
          * YOUR SIGN: ${userSign.symbol} ${userSign.name.toUpperCase()} *
        </div>
        ` : ''}
        
        <div class="content-line separator" style="color: var(--tt-cyan); margin-top: 8px;">
          ${createSeparator('━', 40)}
        </div>
        
        <!-- Date and Moon Phase (Req 27.9) -->
        <div class="content-line date-display" style="text-align: center; color: var(--tt-yellow); margin-top: 6px;">
          * ${currentDate} ${moonPhase} *
        </div>
        
        <!-- Decorative Stars (Req 27.7) -->
        <div class="star-decorations" style="text-align: center; color: var(--tt-yellow); margin-top: 4px;">
          <span class="star-decoration">*</span>
          <span class="star-decoration" style="margin: 0 8px;">+</span>
          <span class="star-decoration">*</span>
          <span class="star-decoration" style="margin: 0 8px;">+</span>
          <span class="star-decoration">*</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render the 4x3 zodiac grid
 * Requirements: 27.3, 27.4
 * @param {Object|null} userSign - User's zodiac sign
 * @returns {string} HTML for zodiac grid
 */
function renderZodiacGrid(userSign) {
  const signs = getAllSigns();
  const rows = [];
  
  // Create 4 rows of 3 signs each
  for (let row = 0; row < 4; row++) {
    const rowSigns = signs.slice(row * 3, row * 3 + 3);
    const rowHTML = rowSigns.map(sign => {
      const isUserSign = userSign && userSign.id === sign.id;
      const elementColor = getElementColorVar(sign.element);
      const pageNum = getPageFromSignId(sign.id);
      
      return `
        <div class="zodiac-sign menu-item" data-page="${pageNum}" data-sign-id="${sign.id}" 
             style="cursor: pointer; padding: 4px; text-align: center; ${isUserSign ? 'background: rgba(255,0,255,0.1);' : ''}">
          <div class="zodiac-symbol" style="color: var(--tt-cyan); font-size: 16px;">${sign.symbol}</div>
          <div class="zodiac-name" style="color: var(--tt-yellow); font-size: 10px;">${sign.name.toUpperCase()}</div>
          <div class="zodiac-dates" style="color: var(--tt-white); font-size: 8px; opacity: 0.7;">${sign.dateRange}</div>
          ${isUserSign ? '<div style="color: var(--tt-magenta); font-size: 8px;">*YOUR SIGN</div>' : ''}
        </div>
      `;
    }).join('');
    
    rows.push(`<div class="zodiac-row" style="display: flex; justify-content: space-around; margin: 6px 0;">${rowHTML}</div>`);
  }
  
  return rows.join('');
}


// ============================================
// Render Functions - Individual Sign Pages (451-462)
// ============================================

/**
 * Render individual horoscope page (451-462)
 * Requirements: 28.1-28.11
 * @param {number} pageNumber - Page number
 * @returns {string} HTML content
 */
function renderSignPage(pageNumber) {
  const signId = getSignIdFromPage(pageNumber);
  if (!signId) {
    return renderError('INVALID SIGN');
  }
  
  const horoscope = getDailyHoroscope(signId);
  if (!horoscope) {
    return renderError('HOROSCOPE UNAVAILABLE');
  }
  
  const { sign, prediction, loveRating, moneyRating, healthRating, luckyNumbers, luckyColor, bestMatch } = horoscope;
  const elementColor = getElementColorVar(sign.element);
  
  // Get prev/next sign for navigation (Req 28.10)
  const prevSignId = signId === 1 ? 12 : signId - 1;
  const nextSignId = signId === 12 ? 1 : signId + 1;
  const prevSign = getSignById(prevSignId);
  const nextSign = getSignById(nextSignId);
  
  return `
    <div class="horoscopes-page horoscope-sign-page teletext-page">
      <!-- Title (Req 28.1) -->
      <div class="teletext-page-title phosphor-glow" style="color: ${elementColor};">
        ${sign.symbol} ${sign.name.toUpperCase()} ${sign.symbol}
      </div>
      
      <!-- Date Range -->
      <div class="content-line" style="text-align: center; color: var(--tt-white); margin-bottom: 6px;">
        ${sign.dateRange}
      </div>
      
      <div class="content-line separator" style="color: ${elementColor};">
        ${createSeparator('━', 40)}
      </div>
      
      <!-- Scrollable Content -->
      <div class="teletext-page-content">
        <!-- Today's Reading Section (Req 28.3) -->
        <div class="content-line section-header" style="color: var(--tt-cyan); margin-top: 4px;">
          TODAY'S READING
        </div>
        
        <!-- Prediction Text (Req 28.4) -->
        <div class="prediction-text" style="color: var(--tt-yellow); margin: 6px 0; line-height: 1.4;">
          ${truncateToWidth(prediction, 160)}
        </div>
        
        <div class="content-line separator" style="color: ${elementColor}; margin: 8px 0;">
          ${createSeparator('─', 40)}
        </div>
        
        <!-- Star Ratings (Req 28.5) -->
        <div class="ratings-section" style="margin: 6px 0;">
          <div class="rating-row" style="display: flex; justify-content: space-between; margin: 4px 0;">
            <span style="color: var(--tt-cyan);">LOVE:</span>
            <span class="star-rating" style="color: var(--tt-magenta);">${formatStarRating(loveRating)}</span>
          </div>
          <div class="rating-row" style="display: flex; justify-content: space-between; margin: 4px 0;">
            <span style="color: var(--tt-cyan);">MONEY:</span>
            <span class="star-rating" style="color: var(--tt-green);">${formatStarRating(moneyRating)}</span>
          </div>
          <div class="rating-row" style="display: flex; justify-content: space-between; margin: 4px 0;">
            <span style="color: var(--tt-cyan);">HEALTH:</span>
            <span class="star-rating" style="color: var(--tt-cyan);">${formatStarRating(healthRating)}</span>
          </div>
        </div>
        
        <div class="content-line separator" style="color: ${elementColor}; margin: 8px 0;">
          ${createSeparator('─', 40)}
        </div>
        
        <!-- Lucky Numbers (Req 28.6) -->
        <div class="content-line" style="margin: 4px 0;">
          <span style="color: var(--tt-cyan);">LUCKY NUMBERS:</span>
          <span style="color: var(--tt-yellow); margin-left: 8px;">${luckyNumbers.join(' ')}</span>
        </div>
        
        <!-- Lucky Color (Req 28.7) -->
        <div class="content-line" style="margin: 4px 0;">
          <span style="color: var(--tt-cyan);">LUCKY COLOR:</span>
          <span style="color: var(--tt-yellow); margin-left: 8px;">${luckyColor}</span>
        </div>
        
        <!-- Best Match (Req 28.8) -->
        <div class="content-line" style="margin: 4px 0;">
          <span style="color: var(--tt-cyan);">BEST MATCH:</span>
          <span style="color: var(--tt-yellow); margin-left: 8px;">${bestMatch.join(', ').toUpperCase()}</span>
        </div>
        
        <div class="content-line separator" style="color: ${elementColor}; margin: 8px 0;">
          ${createSeparator('━', 40)}
        </div>
        
        <!-- Navigation (Req 28.10) -->
        <div class="sign-navigation" style="display: flex; justify-content: space-between; margin-top: 6px;">
          <span class="nav-prev menu-item" data-page="${getPageFromSignId(prevSignId)}" style="color: var(--tt-cyan); cursor: pointer;">
            ◄ ${prevSign.name.toUpperCase()}
          </span>
          <span class="nav-next menu-item" data-page="${getPageFromSignId(nextSignId)}" style="color: var(--tt-cyan); cursor: pointer;">
            ${nextSign.name.toUpperCase()} ►
          </span>
        </div>
      </div>
    </div>
  `;
}


// ============================================
// Render Functions - Lucky Numbers Page (463)
// ============================================

/**
 * Render lucky numbers page (463)
 * Requirements: 29.1-29.6
 * @returns {string} HTML content
 */
function renderLuckyNumbersPage() {
  const userSign = getUserSign();
  const today = new Date();
  const dateHash = hashDate(today);
  
  // Generate initial numbers based on user's sign or default
  const signId = userSign ? userSign.id : 1;
  const numbers = generateLuckyNumbers(signId, dateHash);
  
  return `
    <div class="horoscopes-page lucky-numbers-page teletext-page">
      <!-- Title (Req 29.1) -->
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-yellow);">
        === LUCKY NUMBERS ===
      </div>
      
      <div class="content-line separator" style="color: var(--tt-cyan);">
        ${createSeparator('━', 40)}
      </div>
      
      <!-- Scrollable Content -->
      <div class="teletext-page-content">
        <!-- Lucky Numbers Display (Req 29.2) -->
        <div class="lucky-numbers-display" style="text-align: center; margin: 16px 0;">
          <div class="lucky-numbers-container" style="display: flex; justify-content: center; gap: 12px;">
            ${numbers.map((num, i) => `
              <span class="lucky-number" data-index="${i}" style="
                font-size: 20px;
                color: var(--tt-yellow);
                background: var(--tt-black);
                border: 2px solid var(--tt-cyan);
                padding: 8px 12px;
                min-width: 32px;
                text-align: center;
              ">${num.toString().padStart(2, '0')}</span>
            `).join('')}
          </div>
        </div>
        
        <!-- Sign-based message (Req 29.6) -->
        ${userSign ? `
        <div class="content-line" style="text-align: center; color: var(--tt-magenta); margin: 12px 0;">
          Based on ${userSign.symbol} ${userSign.name.toUpperCase()} energy
        </div>
        ` : `
        <div class="content-line" style="text-align: center; color: var(--color-secondary-70); margin: 12px 0;">
          Set your birthday in Settings for personalized numbers
        </div>
        `}
        
        <div class="content-line separator" style="color: var(--tt-cyan); margin: 12px 0;">
          ${createSeparator('─', 40)}
        </div>
        
        <!-- Generate Button (Req 29.4, 29.5) -->
        <div style="text-align: center; margin: 16px 0;">
          <button class="generate-numbers-btn fastext-button fastext-button--cyan" style="
            padding: 10px 20px;
            font-size: 12px;
            cursor: pointer;
          ">
            * GENERATE NEW *
          </button>
        </div>
        
        <!-- Decorative Stars -->
        <div class="star-decorations" style="text-align: center; color: var(--tt-yellow); margin-top: 12px;">
          <span class="star-decoration">*</span>
          <span class="star-decoration" style="margin: 0 6px;">+</span>
          <span class="star-decoration">*</span>
          <span class="star-decoration" style="margin: 0 6px;">+</span>
          <span class="star-decoration">*</span>
          <span class="star-decoration" style="margin: 0 6px;">+</span>
          <span class="star-decoration">*</span>
        </div>
        
        <!-- Disclaimer -->
        <div class="content-line" style="text-align: center; color: var(--color-secondary-70); margin-top: 16px; font-size: 10px;">
          FOR ENTERTAINMENT PURPOSES ONLY
        </div>
      </div>
    </div>
  `;
}

/**
 * Render error state
 * @param {string} message - Error message
 * @returns {string} HTML for error state
 */
function renderError(message) {
  return `
    <div class="horoscopes-page teletext-page">
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-magenta);">
        ${TITLE}
      </div>
      
      <div class="teletext-page-content">
        <div class="error-container" style="text-align: center; margin-top: 20px; border: 2px solid var(--tt-red); padding: 12px;">
          <div class="error-icon" style="color: var(--tt-red); font-size: 18px;">⚠</div>
          <div class="error-title" style="color: var(--tt-red); margin-top: 6px;">
            ${message}
          </div>
          <div class="error-actions" style="margin-top: 12px;">
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
 * Render loading state
 * Requirements: 28.9
 * @returns {string} HTML for loading state
 */
function renderLoading() {
  return `
    <div class="horoscopes-page teletext-page">
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-magenta);">
        ${TITLE}
      </div>
      
      <div class="teletext-page-content">
        <div class="loading-container" style="text-align: center; margin-top: 24px;">
          <div class="loading-text" style="color: var(--tt-magenta);">
            * READING THE STARS *
          </div>
          <div class="loading-dots" style="color: var(--tt-cyan); margin-top: 8px;">...</div>
        </div>
      </div>
    </div>
  `;
}


// ============================================
// Page Interface Implementation
// ============================================

/**
 * Render the horoscopes page content
 * Requirements: 27.1-27.9, 28.1-28.11, 29.1-29.6
 * 
 * @param {number} pageNumber - Page number (450-463)
 * @returns {string} HTML content for the page
 */
export function render(pageNumber) {
  // Index page (450)
  if (pageNumber === HOROSCOPE_PAGES.INDEX) {
    return renderIndexPage();
  }
  
  // Lucky numbers page (463)
  if (pageNumber === HOROSCOPE_PAGES.LUCKY_NUMBERS) {
    return renderLuckyNumbersPage();
  }
  
  // Individual sign pages (451-462)
  if (pageNumber >= 451 && pageNumber <= 462) {
    return renderSignPage(pageNumber);
  }
  
  // Unknown page
  return renderError('PAGE NOT FOUND');
}

/**
 * Called after the page is rendered and mounted to the DOM
 * Initializes animations and event handlers
 * Requirements: 27.7, 28.9, 29.3
 * 
 * @param {number} pageNumber - Page number
 */
export async function onMount(pageNumber) {
  // Attach click handlers for navigation
  attachClickHandlers();
  
  // Animate content based on page type
  if (pageNumber === HOROSCOPE_PAGES.INDEX) {
    // Animate menu items with stagger (Req 24.7)
    animateMenuItems();
    // Start star twinkle animation (Req 27.7)
    startStarTwinkle();
  } else if (pageNumber === HOROSCOPE_PAGES.LUCKY_NUMBERS) {
    // Attach generate button handler
    attachGenerateHandler();
    // Start star twinkle
    startStarTwinkle();
  } else if (pageNumber >= 451 && pageNumber <= 462) {
    // Animate sign page content
    animateSignPageContent();
  }
}

/**
 * Called before the page is unmounted
 * Cleans up animations and event listeners
 */
export function onUnmount() {
  // Kill main animation timeline
  if (animationTimeline) {
    animationTimeline.kill();
    animationTimeline = null;
  }
  
  // Kill star twinkle animations
  if (starTweens && starTweens.length > 0) {
    starTweens.forEach(tween => tween.kill());
    starTweens = [];
  }
  
  // Kill lucky numbers animation
  if (luckyNumbersTimeline) {
    luckyNumbersTimeline.kill();
    luckyNumbersTimeline = null;
  }
  
  // Kill any tweens on horoscope elements
  const elements = document.querySelectorAll('.horoscopes-page *');
  if (elements.length > 0) {
    gsap.killTweensOf(elements);
  }
}

/**
 * Get Fastext button configuration for this page
 * Requirements: 27.8, 28.11
 * 
 * @param {number} pageNumber - Current page number
 * @returns {Object} Fastext button configuration
 */
export function getFastextButtons(pageNumber) {
  const userSign = getUserSign();
  const userSignPage = userSign ? getPageFromSignId(userSign.id) : HOROSCOPE_PAGES.INDEX;
  
  // Index page (450)
  if (pageNumber === HOROSCOPE_PAGES.INDEX) {
    return {
      red: { label: 'HOME', page: PAGE_NUMBERS.HOME },
      green: { label: 'YOUR SIGN', page: userSignPage },
      yellow: { label: 'LUCKY #', page: HOROSCOPE_PAGES.LUCKY_NUMBERS },
      cyan: { label: 'LOVE', page: HOROSCOPE_PAGES.INDEX } // Could link to compatibility
    };
  }
  
  // Lucky numbers page (463)
  if (pageNumber === HOROSCOPE_PAGES.LUCKY_NUMBERS) {
    return {
      red: { label: 'ALL SIGNS', page: HOROSCOPE_PAGES.INDEX },
      green: { label: 'YOUR SIGN', page: userSignPage },
      yellow: { label: 'GENERATE', page: null }, // Special action
      cyan: { label: 'HOME', page: PAGE_NUMBERS.HOME }
    };
  }
  
  // Individual sign pages (451-462)
  const signId = getSignIdFromPage(pageNumber);
  if (signId) {
    const prevSignId = signId === 1 ? 12 : signId - 1;
    const nextSignId = signId === 12 ? 1 : signId + 1;
    
    return {
      red: { label: 'ALL SIGNS', page: HOROSCOPE_PAGES.INDEX },
      green: { label: 'PREV', page: getPageFromSignId(prevSignId) },
      yellow: { label: 'NEXT', page: getPageFromSignId(nextSignId) },
      cyan: { label: 'LUCKY #', page: HOROSCOPE_PAGES.LUCKY_NUMBERS }
    };
  }
  
  // Default
  return {
    red: { label: 'HOME', page: PAGE_NUMBERS.HOME },
    green: { label: 'SIGNS', page: HOROSCOPE_PAGES.INDEX },
    yellow: { label: 'LUCKY #', page: HOROSCOPE_PAGES.LUCKY_NUMBERS },
    cyan: { label: 'NEWS', page: PAGE_NUMBERS.NEWS_TOP }
  };
}


// ============================================
// Animation Functions
// ============================================

/**
 * Animate menu items appearing with GSAP stagger
 * Requirements: 24.7
 */
function animateMenuItems() {
  const menuItems = document.querySelectorAll('.zodiac-sign');
  
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
    y: 10,
    duration: 0.3,
    stagger: 0.05, // 0.05s delay between items
    ease: 'power2.out'
  });
}

/**
 * Start star twinkle animation
 * Requirements: 27.7
 */
function startStarTwinkle() {
  const stars = document.querySelectorAll('.star-decoration');
  
  if (stars.length === 0) {
    return;
  }
  
  // Kill any existing star tweens
  if (starTweens && starTweens.length > 0) {
    starTweens.forEach(tween => tween.kill());
    starTweens = [];
  }
  
  // Create twinkle animation for each star
  stars.forEach((star, index) => {
    const tween = gsap.to(star, {
      opacity: 0.3,
      duration: 0.5 + (index * 0.1),
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
      delay: index * 0.2
    });
    starTweens.push(tween);
  });
}

/**
 * Animate sign page content
 */
function animateSignPageContent() {
  const contentLines = document.querySelectorAll('.horoscope-sign-page .content-line');
  const ratingRows = document.querySelectorAll('.rating-row');
  
  if (contentLines.length === 0 && ratingRows.length === 0) {
    return;
  }
  
  // Kill any existing animation
  if (animationTimeline) {
    animationTimeline.kill();
  }
  
  animationTimeline = gsap.timeline();
  
  // Stagger content lines
  if (contentLines.length > 0) {
    animationTimeline.from(contentLines, {
      opacity: 0,
      y: 10,
      duration: 0.2,
      stagger: 0.03,
      ease: 'power2.out'
    });
  }
  
  // Stagger rating rows
  if (ratingRows.length > 0) {
    animationTimeline.from(ratingRows, {
      opacity: 0,
      x: -10,
      duration: 0.2,
      stagger: 0.1,
      ease: 'power2.out'
    }, '-=0.1');
  }
}

/**
 * Animate lucky numbers with slot machine effect
 * Requirements: 29.3
 * @param {number[]} finalNumbers - Final numbers to display
 */
function animateLuckyNumbers(finalNumbers) {
  const numberElements = document.querySelectorAll('.lucky-number');
  
  if (numberElements.length === 0 || !finalNumbers || finalNumbers.length === 0) {
    return;
  }
  
  // Kill any existing animation
  if (luckyNumbersTimeline) {
    luckyNumbersTimeline.kill();
  }
  
  luckyNumbersTimeline = gsap.timeline();
  
  numberElements.forEach((el, index) => {
    const finalNum = finalNumbers[index];
    
    // Initial state - show ??
    luckyNumbersTimeline.set(el, { 
      innerText: '??',
      color: 'var(--tt-cyan)'
    }, index * 0.1);
    
    // Slot machine roll effect - cycle through random numbers
    for (let i = 0; i < 10; i++) {
      luckyNumbersTimeline.to(el, {
        innerText: Math.floor(Math.random() * 49) + 1,
        duration: 0.05,
        ease: 'none'
      });
    }
    
    // Final number reveal
    luckyNumbersTimeline.to(el, {
      innerText: finalNum.toString().padStart(2, '0'),
      duration: 0.1,
      ease: 'power2.out',
      color: 'var(--tt-yellow)'
    });
    
    // Flash effect on reveal
    luckyNumbersTimeline.to(el, {
      color: 'var(--tt-white)',
      duration: 0.1,
      yoyo: true,
      repeat: 1
    }, '-=0.1');
  });
}


// ============================================
// Event Handlers
// ============================================

/**
 * Attach click handlers to interactive elements
 */
function attachClickHandlers() {
  // Zodiac sign clicks (Req 27.6)
  const zodiacSigns = document.querySelectorAll('.zodiac-sign');
  zodiacSigns.forEach(sign => {
    sign.addEventListener('click', () => {
      const pageNumber = parseInt(sign.dataset.page, 10);
      if (!isNaN(pageNumber)) {
        navigateToPage(pageNumber);
      }
    });
  });
  
  // Navigation items (prev/next sign)
  const navItems = document.querySelectorAll('.nav-prev, .nav-next, .menu-item[data-page]');
  navItems.forEach(item => {
    if (!item.classList.contains('zodiac-sign')) { // Avoid double-binding
      item.addEventListener('click', () => {
        const pageNumber = parseInt(item.dataset.page, 10);
        if (!isNaN(pageNumber)) {
          navigateToPage(pageNumber);
        }
      });
    }
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
 * Attach generate button handler for lucky numbers page
 */
function attachGenerateHandler() {
  const generateBtn = document.querySelector('.generate-numbers-btn');
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      generateNewNumbers();
    });
  }
}

/**
 * Generate new lucky numbers with animation
 */
function generateNewNumbers() {
  const userSign = getUserSign();
  const signId = userSign ? userSign.id : Math.floor(Math.random() * 12) + 1;
  
  // Use current timestamp for variation
  const dateHash = hashDate(new Date()) + Date.now() % 1000;
  const newNumbers = generateLuckyNumbers(signId, dateHash);
  
  // Animate the new numbers
  animateLuckyNumbers(newNumbers);
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
 * Reset the horoscopes page state (useful for testing)
 */
export function resetHoroscopesPageState() {
  if (animationTimeline) {
    animationTimeline.kill();
    animationTimeline = null;
  }
  if (starTweens && starTweens.length > 0) {
    starTweens.forEach(tween => tween.kill());
    starTweens = [];
  }
  if (luckyNumbersTimeline) {
    luckyNumbersTimeline.kill();
    luckyNumbersTimeline = null;
  }
}

/**
 * Get sign ID from page number (exported for testing)
 * @param {number} pageNumber - Page number
 * @returns {number|null} Sign ID or null
 */
export function getSignIdFromPageNumber(pageNumber) {
  return getSignIdFromPage(pageNumber);
}

/**
 * Get all horoscope page numbers (for testing)
 * @returns {Object} Page numbers object
 */
export function getHoroscopePages() {
  return { ...HOROSCOPE_PAGES };
}

// ============================================
// Exports
// ============================================

export {
  HOROSCOPE_PAGES as PAGE_NUMBERS_HOROSCOPES,
  renderIndexPage,
  renderSignPage,
  renderLuckyNumbersPage,
  animateLuckyNumbers,
  getUserSign,
  getElementColorVar
};
