/**
 * Teletext Reborn - Finance Pages (Pages 300-309)
 * 
 * Displays cryptocurrency prices with:
 * - Bitcoin, Ethereum, and top 5 cryptocurrencies by market cap
 * - Price changes with green/red color coding
 * - Current price, 24h change percentage
 * - Last updated timestamp
 * - Rate limit handling with cached data notice
 * 
 * @module pages/finance
 * Requirements: 7.1-7.7
 */

import gsap from 'gsap';
import { PAGE_NUMBERS } from '../router.js';
import { createSeparator } from '../utils/teletext.js';
import { 
  getCryptoPrices, 
  formatPrice, 
  formatChange, 
  formatLastUpdated,
  getRateLimitNotice,
  formatCryptoName
} from '../services/financeApi.js';

// ============================================
// Constants
// ============================================

/**
 * Page number for finance page
 * @constant {number}
 */
export const PAGE_NUMBER = PAGE_NUMBERS.FINANCE;

/**
 * Page title
 * @constant {string}
 */
export const TITLE = 'FINANCE';

/**
 * Auto-refresh interval (1 minute - matches cache TTL)
 * @constant {number}
 */
const AUTO_REFRESH_INTERVAL = 60 * 1000;

// ============================================
// State
// ============================================

/**
 * Current crypto data
 * @type {Object|null}
 */
let cryptoData = null;

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
// Render Functions
// ============================================

/**
 * Render the loading state with animated placeholder blocks
 * Requirements: 7.5
 * @returns {string} HTML for loading state
 */
function renderLoading() {
  // Create 8 placeholder rows for the cryptos as table rows
  const placeholderRows = Array(8).fill(0).map((_, index) => `
    <tr class="crypto-row placeholder-row" data-index="${index}">
      <td class="placeholder-block" style="color: var(--tt-cyan); padding: 6px 4px;">░░░░</td>
      <td class="placeholder-block" style="color: var(--tt-white); padding: 6px 4px;">░░░░░░░░</td>
      <td class="placeholder-block" style="color: var(--tt-yellow); padding: 6px 4px; text-align: right;">░░░░░░░░</td>
      <td class="placeholder-block" style="color: var(--color-secondary-70); padding: 6px 4px; text-align: right;">░░░░░░</td>
    </tr>
  `).join('');

  return `
    <div class="finance-page teletext-page">
      <div class="teletext-page-title phosphor-glow">
        ${TITLE}
      </div>
      
      <div class="content-line" style="color: var(--tt-cyan); text-align: center;">
        CRYPTOCURRENCY PRICES
      </div>
      
      <div class="content-line separator" style="color: var(--tt-cyan); margin: 4px 0;">
        ${createSeparator('═', 40)}
      </div>
      
      <div class="teletext-page-content">
        <div class="loading-container" style="text-align: center; margin-bottom: 8px;">
          <div class="loading-text" style="color: var(--tt-yellow);">
            LOADING CRYPTO DATA<span class="loading-dots">…</span>
          </div>
        </div>
        
        <!-- Placeholder Table (Req 7.5) -->
        <div class="crypto-list">
          <table class="crypto-table" style="width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 0.95em;">
            <colgroup>
              <col style="width: 15%;">
              <col style="width: 30%;">
              <col style="width: 30%;">
              <col style="width: 25%;">
            </colgroup>
            <thead>
              <tr style="background: rgba(0,0,255,0.2);">
                <th style="color: var(--tt-cyan); padding: 6px 4px; text-align: left; font-weight: normal;">COIN</th>
                <th style="color: var(--tt-cyan); padding: 6px 4px; text-align: left; font-weight: normal;">NAME</th>
                <th style="color: var(--tt-cyan); padding: 6px 4px; text-align: right; font-weight: normal;">PRICE</th>
                <th style="color: var(--tt-cyan); padding: 6px 4px; text-align: right; font-weight: normal;">24H</th>
              </tr>
            </thead>
            <tbody>
              ${placeholderRows}
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="teletext-page-footer" style="text-align: center;">
        <div style="color: var(--color-secondary-70);">FETCHING DATA…</div>
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
    <div class="finance-page teletext-page">
      <div class="teletext-page-title phosphor-glow">
        ${TITLE}
      </div>
      
      <div class="teletext-page-content">
        <div class="error-container" style="text-align: center; margin-top: 20px; border: 2px solid var(--tt-red); padding: 12px;">
          <div class="error-icon" style="color: var(--tt-red); font-size: 18px;">⚠</div>
          <div class="error-title" style="color: var(--tt-red); margin-top: 6px;">
            ${message || 'CRYPTO DATA UNAVAILABLE'}
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
 * Render a single crypto row as a table row
 * Requirements: 7.2, 7.3, 7.4
 * @param {Object} crypto - Crypto data
 * @param {number} index - Row index
 * @returns {string} HTML for crypto table row
 */
function renderCryptoRow(crypto, index) {
  const change = formatChange(crypto.change24h);
  const changeColor = change.isPositive ? 'var(--tt-green)' : 
                      change.isNegative ? 'var(--tt-red)' : 
                      'var(--color-secondary-70)';
  const changeIcon = change.isPositive ? '▲' : change.isNegative ? '▼' : '─';
  
  return `
    <tr class="crypto-row" data-index="${index}">
      <td style="color: var(--tt-cyan); padding: 6px 4px;">${crypto.symbol}</td>
      <td style="color: var(--tt-white); padding: 6px 4px;">${formatCryptoName(crypto.name, 10)}</td>
      <td style="color: var(--tt-yellow); padding: 6px 4px; text-align: right;">${formatPrice(crypto.price)}</td>
      <td style="color: ${changeColor}; padding: 6px 4px; text-align: right;">${changeIcon} ${change.text}</td>
    </tr>
  `;
}

/**
 * Render the crypto list as a proper HTML table
 * Requirements: 7.2
 * @param {Array} cryptos - Array of crypto data
 * @returns {string} HTML for crypto table
 */
function renderCryptoList(cryptos) {
  if (!cryptos || cryptos.length === 0) {
    return `
      <div class="content-line" style="color: var(--color-secondary-70); text-align: center; padding: 16px 0;">
        NO CRYPTO DATA AVAILABLE
      </div>
    `;
  }
  
  const rows = cryptos.map((crypto, index) => renderCryptoRow(crypto, index)).join('');
  
  return `
    <table class="crypto-table" style="width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 0.95em;">
      <colgroup>
        <col style="width: 15%;">
        <col style="width: 30%;">
        <col style="width: 30%;">
        <col style="width: 25%;">
      </colgroup>
      <thead>
        <tr style="background: rgba(0,0,255,0.2);">
          <th style="color: var(--tt-cyan); padding: 6px 4px; text-align: left; font-weight: normal;">COIN</th>
          <th style="color: var(--tt-cyan); padding: 6px 4px; text-align: left; font-weight: normal;">NAME</th>
          <th style="color: var(--tt-cyan); padding: 6px 4px; text-align: right; font-weight: normal;">PRICE</th>
          <th style="color: var(--tt-cyan); padding: 6px 4px; text-align: right; font-weight: normal;">24H</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

/**
 * Render rate limit or stale data notice
 * Requirements: 7.7
 * @param {Object} data - Crypto data with metadata
 * @returns {string} HTML for notice
 */
function renderDataNotice(data) {
  if (data._rateLimited) {
    const notice = getRateLimitNotice(data._rateLimitResetIn);
    return `
      <div class="content-line rate-limit-notice" style="color: var(--tt-yellow); text-align: center; margin-top: 8px;">
        ⚠ ${notice}
      </div>
    `;
  }
  
  if (data._stale) {
    return `
      <div class="content-line stale-notice" style="color: var(--tt-yellow); text-align: center; margin-top: 8px;">
        ⚠ USING CACHED DATA
      </div>
    `;
  }
  
  return '';
}

/**
 * Render the main finance page content
 * Requirements: 7.1-7.7
 * @returns {string} HTML content for the finance page
 */
export function render() {
  // Show loading state
  if (isLoading && !cryptoData) {
    return renderLoading();
  }
  
  // Show error state
  if (errorMessage && !cryptoData) {
    return renderError(errorMessage);
  }
  
  // Show crypto data
  if (!cryptoData) {
    return renderLoading();
  }
  
  const lastUpdated = formatLastUpdated(cryptoData.lastUpdated);
  
  return `
    <div class="finance-page teletext-page">
      <!-- Title -->
      <div class="teletext-page-title phosphor-glow">
        ${TITLE}
      </div>
      
      <!-- Subtitle -->
      <div class="content-line" style="color: var(--tt-cyan); text-align: center;">
        CRYPTOCURRENCY PRICES
      </div>
      
      <div class="content-line separator" style="color: var(--tt-cyan); margin: 4px 0;">
        ${createSeparator('═', 40)}
      </div>
      
      <!-- Scrollable Content -->
      <div class="teletext-page-content">
        <!-- Crypto Table (Req 7.2, 7.3, 7.4) - Header is inside the table -->
        <div class="crypto-list">
          ${renderCryptoList(cryptoData.cryptos)}
        </div>
        
        <!-- Rate Limit / Stale Data Notice (Req 7.7) -->
        ${renderDataNotice(cryptoData)}
      </div>
      
      <!-- Footer with Last Updated (Req 7.6) -->
      <div class="teletext-page-footer" style="text-align: center;">
        <div>UPDATED: ${lastUpdated} • VIA COINLORE</div>
      </div>
    </div>
  `;
}

// ============================================
// Page Interface Implementation
// ============================================

/**
 * Called after the page is rendered and mounted to the DOM
 * Initializes data loading and animations
 * Requirements: 7.1
 */
export async function onMount() {
  try {
    // Attach event handlers first
    attachEventHandlers();
    
    // Load crypto data if not already loaded
    if (!cryptoData && !isLoading) {
      await loadCryptoData();
    } else {
      // If data already loaded, animate the existing content
      animateContent();
    }
    
    // Set up auto-refresh
    startAutoRefresh();
  } catch (error) {
    console.error('Finance page onMount error:', error);
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
  
  // Kill any tweens on finance elements
  const elements = document.querySelectorAll('.finance-page *');
  if (elements.length > 0) {
    gsap.killTweensOf(elements);
  }
}

/**
 * Get Fastext button configuration for this page
 * @returns {Object} Fastext button configuration
 */
export function getFastextButtons() {
  return {
    red: { label: 'HOME', page: PAGE_NUMBERS.HOME },
    green: { label: 'NEWS', page: PAGE_NUMBERS.NEWS_TOP },
    yellow: { label: 'WEATHER', page: PAGE_NUMBERS.WEATHER },
    cyan: { label: 'TIME', page: PAGE_NUMBERS.TIME_MACHINE },
  };
}

// ============================================
// Data Loading Functions
// ============================================

/**
 * Load cryptocurrency data
 * Requirements: 7.1
 */
async function loadCryptoData() {
  isLoading = true;
  errorMessage = null;
  updatePage();
  
  // Start placeholder animation
  animatePlaceholders();
  
  try {
    // Fetch crypto prices (Req 7.1)
    cryptoData = await getCryptoPrices();
    
    isLoading = false;
    errorMessage = null;
    updatePage();
    
    // Animate the new content
    animateContent();
    
  } catch (error) {
    console.error('Failed to load crypto data:', error);
    isLoading = false;
    errorMessage = error.message || 'FAILED TO LOAD CRYPTO DATA';
    updatePage();
  }
}

/**
 * Retry loading crypto data
 */
async function retryLoad() {
  cryptoData = null;
  await loadCryptoData();
}

/**
 * Update the page content in the DOM
 */
function updatePage() {
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
 * Crypto data refreshes every minute without disrupting UX
 */
function startAutoRefresh() {
  stopAutoRefresh();
  refreshTimer = setInterval(async () => {
    try {
      const newData = await getCryptoPrices();
      
      // Only update if data changed
      if (JSON.stringify(newData.cryptos) !== JSON.stringify(cryptoData?.cryptos)) {
        cryptoData = newData;
        updatePage();
      } else {
        // Update timestamp even if prices haven't changed
        cryptoData = newData;
      }
    } catch (error) {
      console.warn('Auto-refresh failed:', error);
      // Don't show error, just keep existing data
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
}

// ============================================
// Animation Functions
// ============================================

/**
 * Animate placeholder blocks while loading
 * Requirements: 7.5
 */
function animatePlaceholders() {
  const placeholders = document.querySelectorAll('.placeholder-block');
  
  if (placeholders.length === 0) return;
  
  // Kill any existing animation
  if (animationTimeline) {
    animationTimeline.kill();
  }
  
  animationTimeline = gsap.timeline({ repeat: -1 });
  
  // Animate opacity to create a pulsing effect
  animationTimeline.to(placeholders, {
    opacity: 0.4,
    duration: 0.5,
    ease: 'power1.inOut',
    stagger: 0.05
  }).to(placeholders, {
    opacity: 1,
    duration: 0.5,
    ease: 'power1.inOut',
    stagger: 0.05
  });
}

/**
 * Animate crypto content appearing
 */
function animateContent() {
  const cryptoRows = document.querySelectorAll('.crypto-row:not(.placeholder-row)');
  
  if (cryptoRows.length === 0) return;
  
  // Kill any existing animation
  if (animationTimeline) {
    animationTimeline.kill();
    animationTimeline = null;
  }
  
  // Kill any existing tweens on these elements
  gsap.killTweensOf(cryptoRows);
  
  animationTimeline = gsap.timeline();
  
  // Stagger crypto rows using fromTo for reliability
  animationTimeline.fromTo(cryptoRows, 
    { opacity: 0, x: -10 },
    { 
      opacity: 1, 
      x: 0, 
      duration: 0.2, 
      stagger: 0.05, 
      ease: 'power2.out',
      clearProps: 'all'
    }
  );
}

// ============================================
// Utility Functions (for testing)
// ============================================

/**
 * Reset the finance page state
 */
export function resetFinancePageState() {
  cryptoData = null;
  isLoading = false;
  errorMessage = null;
  stopAutoRefresh();
  if (animationTimeline) {
    animationTimeline.kill();
    animationTimeline = null;
  }
}

/**
 * Get current crypto data (for testing)
 * @returns {Object|null} Current crypto data
 */
export function getCryptoData() {
  return cryptoData;
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
 * Set crypto data directly (for testing)
 * @param {Object} data - Crypto data
 */
export function setCryptoData(data) {
  cryptoData = data;
}
