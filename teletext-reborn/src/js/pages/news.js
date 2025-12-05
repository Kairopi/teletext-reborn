/**
 * Teletext Reborn - News Pages (Pages 101-109)
 * 
 * Displays current news headlines in authentic Teletext format.
 * Supports multiple categories: Top Stories, World, Technology, Business, Sports.
 * 
 * @module pages/news
 * Requirements: 5.1-5.7
 */

import gsap from 'gsap';
import { PAGE_NUMBERS } from '../router.js';
import { 
  getNews, 
  getNewsByPage,
  formatHeadlines,
  NEWS_CATEGORIES,
  PAGE_TO_CATEGORY,
  startAutoRefresh,
  stopAutoRefresh,
  isNewsPage,
  getCategoryForPage,
  getMockNews,
} from '../services/newsApi.js';
import { truncateToWidth, centerText, createSeparator } from '../utils/teletext.js';

// ============================================
// Constants
// ============================================

/**
 * Page number range for news pages
 * @constant {Object}
 */
export const PAGE_RANGE = {
  START: 101,
  END: 109,
};

/**
 * Maximum headlines to display per page
 * @constant {number}
 */
const MAX_HEADLINES_DISPLAY = 8;

/**
 * Maximum headline title length for display
 * @constant {number}
 */
const MAX_TITLE_LENGTH = 42;

/**
 * Maximum source name length
 * @constant {number}
 */
const MAX_SOURCE_LENGTH = 14;

// ============================================
// State
// ============================================

/**
 * Current news data cache
 * @type {Object|null}
 */
let newsData = null;

/**
 * Current page number being displayed
 * @type {number}
 */
let currentPageNumber = PAGE_NUMBERS.NEWS_TOP;

/**
 * Loading state
 * @type {boolean}
 */
let isLoading = false;

/**
 * Error state
 * @type {Object|null}
 */
let errorState = null;

/**
 * Auto-refresh unsubscribe function
 * @type {Function|null}
 */
let autoRefreshUnsubscribe = null;

/**
 * GSAP timeline for animations
 * @type {gsap.core.Timeline|null}
 */
let animationTimeline = null;

/**
 * Loading animation tween
 * @type {gsap.core.Tween|null}
 */
let loadingTween = null;

// ============================================
// Helper Functions
// ============================================

/**
 * Get category info for current page
 * @returns {Object} Category info
 */
function getCurrentCategory() {
  return getCategoryForPage(currentPageNumber) || {
    id: 'top',
    label: 'TOP STORIES',
    page: 101,
  };
}

/**
 * Format a single headline for display (Req 5.3, 5.6)
 * @param {Object} headline - Headline data
 * @param {number} index - Headline index
 * @returns {string} Formatted HTML
 */
function formatHeadlineHTML(headline, index) {
  const title = truncateToWidth(headline.title.toUpperCase(), MAX_TITLE_LENGTH);
  const source = truncateToWidth(headline.source.toUpperCase(), MAX_SOURCE_LENGTH);
  const timeAgo = headline.timeAgo ? headline.timeAgo.toUpperCase() : '';
  
  return `
    <div class="headline-item" data-index="${index}" style="margin-bottom: 4px; padding: 3px 0; border-bottom: 1px solid rgba(0,255,255,0.15);">
      <div class="headline-title" style="color: var(--tt-yellow); line-height: 1.35;">
        ► ${title}
      </div>
      <div class="headline-meta" style="color: var(--tt-cyan); font-size: 0.85em; opacity: 0.8;">
        ${source}${timeAgo ? ` • ${timeAgo}` : ''}
      </div>
    </div>
  `;
}

/**
 * Format loading state HTML (Req 5.4)
 * @returns {string} Loading HTML
 */
function formatLoadingHTML() {
  return `
    <div class="loading-container" style="text-align: center; padding: 40px 0;">
      <div class="loading-text" style="color: var(--tt-yellow);">
        LOADING<span class="loading-dots">…</span>
      </div>
      <div class="loading-cursor" style="color: var(--tt-cyan);">█</div>
    </div>
  `;
}

/**
 * Format error state HTML (Req 5.5)
 * @param {string} message - Error message
 * @returns {string} Error HTML
 */
function formatErrorHTML(message) {
  return `
    <div class="error-container" style="text-align: center; padding: 20px 0;">
      <div class="error-icon" style="color: var(--tt-red); font-size: 24px;">⚠</div>
      <div class="error-title double-height" style="color: var(--tt-red); margin: 16px 0;">
        ${centerText('SERVICE ERROR', 40)}
      </div>
      <div class="error-message content-line" style="color: var(--tt-white);">
        ${centerText(message.toUpperCase(), 40)}
      </div>
      <div class="error-actions" style="margin-top: 24px;">
        <button class="retry-button fastext-button fastext-button--cyan" style="margin-right: 8px;">
          RETRY
        </button>
        <button class="home-button fastext-button fastext-button--yellow">
          HOME
        </button>
      </div>
    </div>
  `;
}

/**
 * Format stale data notice
 * @param {Date} lastUpdated - Last update time
 * @returns {string} Notice HTML
 */
function formatStaleNotice(lastUpdated) {
  if (!lastUpdated) return '';
  
  const now = new Date();
  const diffMs = now - lastUpdated;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return '';
  
  const timeText = diffMins === 1 ? '1 MIN AGO' : `${diffMins} MINS AGO`;
  
  return `
    <div class="stale-notice content-line" style="color: var(--color-secondary-70); text-align: center; margin-top: 8px;">
      LAST UPDATED: ${timeText}
    </div>
  `;
}

/**
 * Format category navigation tabs
 * @returns {string} Navigation HTML
 */
function formatCategoryNav() {
  const categories = Object.values(NEWS_CATEGORIES);
  
  const tabs = categories.map(cat => {
    const isActive = cat.page === currentPageNumber;
    const style = isActive 
      ? 'color: var(--tt-black); background: var(--tt-cyan); padding: 2px 6px;'
      : 'color: var(--tt-cyan); padding: 2px 6px; border: 1px solid var(--tt-cyan);';
    
    return `<span class="category-tab" data-page="${cat.page}" style="${style} cursor: pointer; font-size: 0.9em; margin: 0 2px;">${cat.label.split(' ')[0]}</span>`;
  }).join('');
  
  return `
    <div class="category-nav content-line" style="margin-bottom: 6px; text-align: center; display: flex; justify-content: center; gap: 4px; flex-wrap: wrap;">
      ${tabs}
    </div>
  `;
}

// ============================================
// Page Interface Implementation
// ============================================

/**
 * Render the news page content
 * Requirements: 5.1-5.7
 * 
 * @param {number} [pageNumber=101] - Page number to render
 * @returns {string} HTML content for the news page
 */
export function render(pageNumber = PAGE_NUMBERS.NEWS_TOP) {
  currentPageNumber = pageNumber;
  const category = getCurrentCategory();
  
  // Build page content based on state
  let contentHTML;
  
  // Show loading if no data yet (initial render)
  const shouldShowLoading = isLoading || (!newsData && !errorState);
  
  if (shouldShowLoading) {
    contentHTML = formatLoadingHTML();
  } else if (errorState) {
    contentHTML = formatErrorHTML(errorState.message || 'UNABLE TO LOAD NEWS');
  } else if (newsData && newsData.articles && newsData.articles.length > 0) {
    const headlines = formatHeadlines(newsData.articles.slice(0, MAX_HEADLINES_DISPLAY));
    const headlinesHTML = headlines.map((h, i) => formatHeadlineHTML(h, i)).join('');
    const staleNotice = newsData._stale ? formatStaleNotice(newsData.lastUpdated) : '';
    const rateLimitNotice = newsData._rateLimited 
      ? `<div class="rate-limit-notice content-line" style="color: var(--tt-yellow); text-align: center;">⚡ ${newsData._message || 'USING CACHED DATA'}</div>`
      : '';
    
    contentHTML = `
      <div class="headlines-container">
        ${headlinesHTML}
      </div>
      ${staleNotice}
      ${rateLimitNotice}
    `;
  } else {
    contentHTML = `
      <div class="empty-state content-line" style="text-align: center; color: var(--color-secondary-70); padding: 40px 0;">
        NO NEWS AVAILABLE
      </div>
    `;
  }
  
  // Build the full page - compact layout with consistent frame
  return `
    <div class="news-page teletext-page" data-page="${pageNumber}">
      <!-- Title -->
      <div class="teletext-page-title phosphor-glow">
        📰 ${category.label} 📰
      </div>
      
      <!-- Category Navigation (Req 5.2) -->
      ${formatCategoryNav()}
      
      <!-- Separator -->
      <div class="content-line separator" style="color: var(--tt-cyan); margin: 4px 0;">
        ${createSeparator('═', 40)}
      </div>
      
      <!-- Scrollable Content -->
      <div class="teletext-page-content news-content">
        ${contentHTML}
      </div>
      
      <!-- Attribution (Req 22.1) -->
      <div class="teletext-page-footer" style="text-align: center;">
        VIA NEWSDATA.IO
      </div>
    </div>
  `;
}

/**
 * Called after the page is rendered and mounted to the DOM
 * Initializes animations and loads news data
 * Requirements: 5.1, 5.4, 5.7
 * 
 * @param {number} [pageNumber=101] - Page number being mounted
 */
export async function onMount(pageNumber = PAGE_NUMBERS.NEWS_TOP) {
  currentPageNumber = pageNumber;
  
  // Attach event handlers
  attachEventHandlers();
  
  // Start loading animation if loading
  if (isLoading) {
    startLoadingAnimation();
  }
  
  // Load news data if not already loaded
  if (!newsData || newsData.pageNumber !== pageNumber) {
    await loadNewsData(pageNumber);
  }
  
  // Animate headlines appearing
  animateHeadlines();
  
  // Start auto-refresh (Req 5.7)
  startNewsAutoRefresh();
}

/**
 * Called before the page is unmounted
 * Cleans up animations and event listeners
 */
export function onUnmount() {
  // Kill animations
  if (animationTimeline) {
    animationTimeline.kill();
    animationTimeline = null;
  }
  
  if (loadingTween) {
    loadingTween.kill();
    loadingTween = null;
  }
  
  // Kill any tweens on headlines
  const headlines = document.querySelectorAll('.headline-item');
  if (headlines.length > 0) {
    gsap.killTweensOf(headlines);
  }
  
  // Stop auto-refresh
  if (autoRefreshUnsubscribe) {
    autoRefreshUnsubscribe();
    autoRefreshUnsubscribe = null;
  }
}

/**
 * Get Fastext button configuration for this page
 * 
 * @returns {Object} Fastext button configuration
 */
export function getFastextButtons() {
  return {
    red: { label: 'TOP', page: PAGE_NUMBERS.NEWS_TOP },
    green: { label: 'WORLD', page: PAGE_NUMBERS.NEWS_WORLD },
    yellow: { label: 'TECH', page: PAGE_NUMBERS.NEWS_TECH },
    cyan: { label: 'HOME', page: PAGE_NUMBERS.HOME },
  };
}

// ============================================
// Data Loading Functions
// ============================================

/**
 * Load news data for the current page
 * Requirements: 5.1, 5.4, 5.5
 * 
 * @param {number} pageNumber - Page number to load
 */
async function loadNewsData(pageNumber) {
  isLoading = true;
  errorState = null;
  
  // Update UI to show loading
  updateContent();
  startLoadingAnimation();
  
  try {
    // Fetch news data (Req 5.1)
    const data = await getNewsByPage(pageNumber);
    
    newsData = data;
    isLoading = false;
    
    // Update UI with data
    updateContent();
    animateHeadlines();
    
  } catch (error) {
    console.error('[NewsPage] Failed to load news:', error);
    
    isLoading = false;
    errorState = {
      message: error.message || 'UNABLE TO LOAD NEWS',
      retryable: true,
    };
    
    // Update UI with error (Req 5.5)
    updateContent();
    attachErrorHandlers();
  }
}

/**
 * Retry loading news data
 */
async function retryLoadNews() {
  errorState = null;
  await loadNewsData(currentPageNumber);
}

/**
 * Update the content area with current state
 */
function updateContent() {
  // Look for the scrollable content area
  const contentArea = document.querySelector('.news-content') || document.querySelector('.teletext-page-content');
  if (!contentArea) return;
  
  let contentHTML;
  
  if (isLoading) {
    contentHTML = formatLoadingHTML();
  } else if (errorState) {
    contentHTML = formatErrorHTML(errorState.message);
  } else if (newsData && newsData.articles && newsData.articles.length > 0) {
    const headlines = formatHeadlines(newsData.articles.slice(0, MAX_HEADLINES_DISPLAY));
    const headlinesHTML = headlines.map((h, i) => formatHeadlineHTML(h, i)).join('');
    const staleNotice = newsData._stale ? formatStaleNotice(newsData.lastUpdated) : '';
    const rateLimitNotice = newsData._rateLimited 
      ? `<div class="rate-limit-notice content-line" style="color: var(--tt-yellow); text-align: center;">⚡ ${newsData._message || 'USING CACHED DATA'}</div>`
      : '';
    
    contentHTML = `
      <div class="headlines-container">
        ${headlinesHTML}
      </div>
      ${staleNotice}
      ${rateLimitNotice}
    `;
  } else {
    contentHTML = `
      <div class="empty-state content-line" style="text-align: center; color: var(--color-secondary-70); padding: 20px 0;">
        NO NEWS AVAILABLE
      </div>
    `;
  }
  
  contentArea.innerHTML = contentHTML;
  
  // Re-attach handlers if needed
  if (errorState) {
    attachErrorHandlers();
  }
  
  // Start loading animation if loading
  if (isLoading) {
    startLoadingAnimation();
  }
}

// ============================================
// Animation Functions
// ============================================

/**
 * Animate headlines appearing with stagger
 */
function animateHeadlines() {
  const headlines = document.querySelectorAll('.headline-item');
  
  if (headlines.length === 0) return;
  
  // Kill any existing animation
  if (animationTimeline) {
    animationTimeline.kill();
  }
  
  // Create stagger animation
  animationTimeline = gsap.timeline();
  
  animationTimeline.from(headlines, {
    opacity: 0,
    x: -10,
    duration: 0.3,
    stagger: 0.05,
    ease: 'power2.out',
  });
}

/**
 * Start loading animation (Req 5.4)
 */
function startLoadingAnimation() {
  const cursor = document.querySelector('.loading-cursor');
  const dots = document.querySelector('.loading-dots');
  
  if (cursor) {
    // Kill existing tween
    if (loadingTween) {
      loadingTween.kill();
    }
    
    // Blinking cursor
    loadingTween = gsap.to(cursor, {
      opacity: 0,
      duration: 0.53,
      repeat: -1,
      yoyo: true,
      ease: 'steps(1)',
    });
  }
  
  if (dots) {
    // Animated dots
    gsap.to(dots, {
      text: { value: '…', delimiter: '' },
      duration: 1.5,
      repeat: -1,
      ease: 'none',
    });
  }
}

// ============================================
// Event Handlers
// ============================================

/**
 * Attach event handlers to page elements
 */
function attachEventHandlers() {
  // Category tab clicks
  const tabs = document.querySelectorAll('.category-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', handleCategoryClick);
  });
}

/**
 * Attach error state handlers
 */
function attachErrorHandlers() {
  const retryBtn = document.querySelector('.retry-button');
  const homeBtn = document.querySelector('.home-button');
  
  if (retryBtn) {
    retryBtn.addEventListener('click', retryLoadNews);
  }
  
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      import('../router.js').then(({ getRouter }) => {
        getRouter().navigate(PAGE_NUMBERS.HOME);
      });
    });
  }
}

/**
 * Handle category tab click
 * @param {Event} event - Click event
 */
function handleCategoryClick(event) {
  const pageNumber = parseInt(event.target.dataset.page, 10);
  if (!isNaN(pageNumber) && pageNumber !== currentPageNumber) {
    import('../router.js').then(({ getRouter }) => {
      getRouter().navigate(pageNumber);
    });
  }
}

// ============================================
// Auto-Refresh (Req 5.7)
// ============================================

/**
 * Start auto-refresh for news data
 * Refreshes every 5 minutes without disrupting user experience
 */
function startNewsAutoRefresh() {
  // Stop any existing auto-refresh
  if (autoRefreshUnsubscribe) {
    autoRefreshUnsubscribe();
  }
  
  // Start new auto-refresh
  autoRefreshUnsubscribe = startAutoRefresh((category, data) => {
    // Only update if we're still on a news page and it's the current category
    const currentCategory = PAGE_TO_CATEGORY[currentPageNumber];
    if (currentCategory === category) {
      newsData = data;
      updateContent();
      animateHeadlines();
    }
  });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Reset the news page state (useful for testing)
 */
export function resetNewsPageState() {
  newsData = null;
  currentPageNumber = PAGE_NUMBERS.NEWS_TOP;
  isLoading = false;
  errorState = null;
  
  if (animationTimeline) {
    animationTimeline.kill();
    animationTimeline = null;
  }
  
  if (loadingTween) {
    loadingTween.kill();
    loadingTween = null;
  }
  
  if (autoRefreshUnsubscribe) {
    autoRefreshUnsubscribe();
    autoRefreshUnsubscribe = null;
  }
}

/**
 * Check if a page number is a news page
 * @param {number} pageNumber - Page number to check
 * @returns {boolean} True if it's a news page
 */
export function isNewsPageNumber(pageNumber) {
  return isNewsPage(pageNumber);
}

/**
 * Get current news data (for testing)
 * @returns {Object|null} Current news data
 */
export function getCurrentNewsData() {
  return newsData;
}

/**
 * Get current loading state (for testing)
 * @returns {boolean} Loading state
 */
export function getIsLoading() {
  return isLoading;
}

/**
 * Get current error state (for testing)
 * @returns {Object|null} Error state
 */
export function getErrorState() {
  return errorState;
}

/**
 * Set mock news data (for testing)
 * @param {Object} data - Mock news data
 */
export function setMockNewsData(data) {
  newsData = data;
  isLoading = false;
  errorState = null;
}

// ============================================
// Exports
// ============================================

export {
  NEWS_CATEGORIES,
  PAGE_TO_CATEGORY,
  MAX_HEADLINES_DISPLAY,
};
