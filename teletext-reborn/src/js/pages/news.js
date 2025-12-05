/**
 * Teletext Reborn - News Pages (Pages 101-109)
 * 
 * Enhanced news display with:
 * - Multi-source fallback (BBC RSS -> NewsData -> Demo)
 * - Category tabs with visual feedback
 * - Demo mode indicator
 * - Smooth animations
 * 
 * @module pages/news
 * Requirements: 5.1-5.7
 */

import gsap from 'gsap';
import { PAGE_NUMBERS } from '../router.js';
import { 
  getNewsByPage,
  formatHeadlines,
  NEWS_CATEGORIES,
  PAGE_TO_CATEGORY,
  startAutoRefresh,
  isNewsPage,
  getCategoryForPage,
  isInDemoMode,
} from '../services/newsApi.js';
import { truncateToWidth, createSeparator } from '../utils/teletext.js';

// ============================================
// Constants
// ============================================

export const PAGE_RANGE = { START: 101, END: 109 };
const MAX_HEADLINES_DISPLAY = 8;
const MAX_TITLE_LENGTH = 38;

// ============================================
// State
// ============================================

let newsData = null;
let currentPageNumber = PAGE_NUMBERS.NEWS_TOP;
let isLoading = false;
let errorState = null;
let autoRefreshUnsubscribe = null;
let animationTimeline = null;
let loadingTween = null;

// ============================================
// Helper Functions
// ============================================

function getCurrentCategory() {
  return getCategoryForPage(currentPageNumber) || { id: 'top', label: 'TOP STORIES', page: 101 };
}

function formatHeadlineHTML(headline, index) {
  const title = truncateToWidth(headline.title.toUpperCase(), MAX_TITLE_LENGTH);
  const source = truncateToWidth(headline.source.toUpperCase(), 10);
  const timeAgo = headline.timeAgo ? headline.timeAgo.toUpperCase() : '';
  
  return `
    <tr class="headline-item" data-index="${index}">
      <td style="color: var(--tt-cyan); padding: 4px 2px; vertical-align: top; width: 20px;">►</td>
      <td style="padding: 4px 2px;">
        <div style="color: var(--tt-yellow); line-height: 1.3;">${title}</div>
        <div style="color: var(--tt-cyan); font-size: 0.8em; opacity: 0.8;">${source}${timeAgo ? ` • ${timeAgo}` : ''}</div>
      </td>
    </tr>
  `;
}

function formatLoadingHTML() {
  const placeholders = Array(6).fill(0).map((_, i) => `
    <tr class="placeholder-row" data-index="${i}">
      <td style="color: var(--tt-cyan); padding: 4px 2px;">►</td>
      <td style="padding: 4px 2px;">
        <div class="placeholder-block" style="color: var(--tt-yellow); opacity: 0.5;">░░░░░░░░░░░░░░░░░░░░░░░░░░░░</div>
        <div class="placeholder-block" style="color: var(--tt-cyan); font-size: 0.8em; opacity: 0.3;">░░░░░ • ░░░░░</div>
      </td>
    </tr>
  `).join('');
  
  return `
    <div class="loading-container" style="text-align: center; margin-bottom: 8px;">
      <div class="loading-text" style="color: var(--tt-yellow);">
        LOADING NEWS<span class="loading-dots">…</span>
      </div>
    </div>
    <table style="width: 100%; border-collapse: collapse;">
      <tbody>${placeholders}</tbody>
    </table>
  `;
}

function formatErrorHTML(message) {
  return `
    <div class="error-container" style="text-align: center; padding: 16px; border: 2px solid var(--tt-red);">
      <div style="color: var(--tt-red); font-size: 1.2em;">⚠</div>
      <div style="color: var(--tt-red); margin: 8px 0;">${message.toUpperCase()}</div>
      <div style="margin-top: 12px;">
        <button class="retry-button fastext-button fastext-button--cyan" style="margin-right: 8px;">RETRY</button>
        <button class="home-button fastext-button fastext-button--yellow">HOME</button>
      </div>
    </div>
  `;
}

function formatCategoryNav() {
  const categories = Object.values(NEWS_CATEGORIES);
  const tabs = categories.map(cat => {
    const isActive = cat.page === currentPageNumber;
    const bg = isActive ? 'var(--tt-cyan)' : 'transparent';
    const color = isActive ? 'var(--tt-black)' : 'var(--tt-cyan)';
    const border = isActive ? 'none' : '1px solid var(--tt-cyan)';
    return `<span class="category-tab" data-page="${cat.page}" 
      style="padding: 3px 6px; background: ${bg}; color: ${color}; border: ${border}; 
             cursor: pointer; font-size: 0.85em;">${cat.label}</span>`;
  }).join('');
  
  return `<div class="category-nav" style="display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; margin-bottom: 6px;">${tabs}</div>`;
}

function formatDemoNotice() {
  if (!isInDemoMode()) return '';
  return `
    <div class="demo-notice" style="background: var(--tt-magenta); color: var(--tt-black); 
         padding: 4px 8px; text-align: center; margin-bottom: 6px; font-size: 0.85em;">
      ⚡ DEMO MODE - SAMPLE HEADLINES
    </div>
  `;
}

function formatTimeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'JUST NOW';
  if (diffMins === 1) return '1 MIN AGO';
  if (diffMins < 60) return `${diffMins} MINS AGO`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 HOUR AGO';
  return `${diffHours} HOURS AGO`;
}


// ============================================
// Page Interface
// ============================================

export function render(pageNumber = PAGE_NUMBERS.NEWS_TOP) {
  currentPageNumber = pageNumber;
  const category = getCurrentCategory();
  
  let contentHTML;
  const shouldShowLoading = isLoading || (!newsData && !errorState);
  
  if (shouldShowLoading) {
    contentHTML = formatLoadingHTML();
  } else if (errorState) {
    contentHTML = formatErrorHTML(errorState.message || 'UNABLE TO LOAD NEWS');
  } else if (newsData?.articles?.length > 0) {
    const headlines = formatHeadlines(newsData.articles.slice(0, MAX_HEADLINES_DISPLAY));
    const rows = headlines.map((h, i) => formatHeadlineHTML(h, i)).join('');
    const sourceInfo = newsData._source || 'VIA NEWSDATA.IO';
    const staleNotice = newsData._stale ? `<div style="color: var(--tt-yellow); text-align: center; margin-top: 4px;">⚠ LAST UPDATED: ${formatTimeAgo(newsData.lastUpdated)}</div>` : '';
    const rateLimitNotice = newsData._rateLimited ? `<div style="color: var(--tt-yellow); text-align: center;">⚡ ${newsData._message || 'USING CACHED DATA'}</div>` : '';
    
    contentHTML = `
      <div class="headlines-container">
        <table class="headlines-table" style="width: 100%; border-collapse: collapse;">
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${staleNotice}
      ${rateLimitNotice}
    `;
  } else {
    contentHTML = '<div style="text-align: center; color: var(--color-secondary-70); padding: 20px;">NO NEWS AVAILABLE</div>';
  }
  
  return `
    <div class="news-page teletext-page" data-page="${pageNumber}">
      <div class="teletext-page-title phosphor-glow">📰 ${category.label} 📰</div>
      
      ${formatDemoNotice()}
      ${formatCategoryNav()}
      
      <div class="separator" style="color: var(--tt-cyan); margin: 4px 0;">${createSeparator('═', 40)}</div>
      
      <div class="teletext-page-content news-content">${contentHTML}</div>
      
      <div class="teletext-page-footer" style="text-align: center; color: var(--color-secondary-70);">
        VIA NEWSDATA.IO
      </div>
    </div>
  `;
}

export async function onMount(pageNumber = PAGE_NUMBERS.NEWS_TOP) {
  currentPageNumber = pageNumber;
  attachEventHandlers();
  
  if (isLoading) startLoadingAnimation();
  
  if (!newsData || newsData.pageNumber !== pageNumber) {
    await loadNewsData(pageNumber);
  }
  
  animateHeadlines();
  startNewsAutoRefresh();
}

export function onUnmount() {
  if (animationTimeline) { animationTimeline.kill(); animationTimeline = null; }
  if (loadingTween) { loadingTween.kill(); loadingTween = null; }
  
  const headlines = document.querySelectorAll('.headline-item');
  if (headlines.length > 0) gsap.killTweensOf(headlines);
  
  if (autoRefreshUnsubscribe) { autoRefreshUnsubscribe(); autoRefreshUnsubscribe = null; }
}

export function getFastextButtons() {
  return {
    red: { label: 'TOP', page: PAGE_NUMBERS.NEWS_TOP },
    green: { label: 'WORLD', page: 102 },
    yellow: { label: 'TECH', page: 103 },
    cyan: { label: 'HOME', page: PAGE_NUMBERS.HOME },
  };
}

// ============================================
// Data Loading
// ============================================

async function loadNewsData(pageNumber) {
  isLoading = true;
  errorState = null;
  updateContent();
  startLoadingAnimation();
  
  try {
    const data = await getNewsByPage(pageNumber);
    newsData = data;
    isLoading = false;
    updateContent();
    animateHeadlines();
  } catch (error) {
    console.error('[NewsPage] Load failed:', error);
    isLoading = false;
    errorState = { message: error.message || 'UNABLE TO LOAD NEWS', retryable: true };
    updateContent();
    attachErrorHandlers();
  }
}

async function retryLoadNews() {
  errorState = null;
  await loadNewsData(currentPageNumber);
}

function updateContent() {
  const contentArea = document.querySelector('.news-content') || document.querySelector('.teletext-page-content');
  if (!contentArea) return;
  
  let contentHTML;
  if (isLoading) {
    contentHTML = formatLoadingHTML();
  } else if (errorState) {
    contentHTML = formatErrorHTML(errorState.message);
  } else if (newsData?.articles?.length > 0) {
    const headlines = formatHeadlines(newsData.articles.slice(0, MAX_HEADLINES_DISPLAY));
    const rows = headlines.map((h, i) => formatHeadlineHTML(h, i)).join('');
    const staleNotice = newsData._stale ? `<div style="color: var(--tt-yellow); text-align: center; margin-top: 4px;">⚠ LAST UPDATED: ${formatTimeAgo(newsData.lastUpdated)}</div>` : '';
    const rateLimitNotice = newsData._rateLimited ? `<div style="color: var(--tt-yellow); text-align: center;">⚡ ${newsData._message || 'USING CACHED DATA'}</div>` : '';
    contentHTML = `
      <div class="headlines-container">
        <table class="headlines-table" style="width: 100%; border-collapse: collapse;">
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${staleNotice}
      ${rateLimitNotice}
    `;
  } else {
    contentHTML = '<div style="text-align: center; color: var(--color-secondary-70); padding: 20px;">NO NEWS AVAILABLE</div>';
  }
  
  contentArea.innerHTML = contentHTML;
  if (errorState) attachErrorHandlers();
  if (isLoading) startLoadingAnimation();
}


// ============================================
// Animations
// ============================================

function animateHeadlines() {
  const headlines = document.querySelectorAll('.headline-item');
  if (headlines.length === 0) return;
  
  if (animationTimeline) animationTimeline.kill();
  gsap.killTweensOf(headlines);
  
  animationTimeline = gsap.timeline();
  animationTimeline.fromTo(headlines,
    { opacity: 0, x: -10 },
    { opacity: 1, x: 0, duration: 0.25, stagger: 0.04, ease: 'power2.out', clearProps: 'all' }
  );
}

function startLoadingAnimation() {
  const placeholders = document.querySelectorAll('.placeholder-block');
  if (placeholders.length === 0) return;
  
  if (loadingTween) loadingTween.kill();
  
  loadingTween = gsap.to(placeholders, {
    opacity: 0.3, duration: 0.5, repeat: -1, yoyo: true, ease: 'power1.inOut', stagger: 0.05
  });
}

// ============================================
// Event Handlers
// ============================================

function attachEventHandlers() {
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', handleCategoryClick);
  });
}

function attachErrorHandlers() {
  const retryBtn = document.querySelector('.retry-button');
  const homeBtn = document.querySelector('.home-button');
  
  if (retryBtn) retryBtn.addEventListener('click', retryLoadNews);
  if (homeBtn) homeBtn.addEventListener('click', () => {
    import('../router.js').then(({ getRouter }) => getRouter().navigate(PAGE_NUMBERS.HOME));
  });
}

function handleCategoryClick(event) {
  const pageNumber = parseInt(event.target.dataset.page, 10);
  if (!isNaN(pageNumber) && pageNumber !== currentPageNumber) {
    import('../router.js').then(({ getRouter }) => getRouter().navigate(pageNumber));
  }
}

// ============================================
// Auto-Refresh
// ============================================

function startNewsAutoRefresh() {
  if (autoRefreshUnsubscribe) autoRefreshUnsubscribe();
  
  autoRefreshUnsubscribe = startAutoRefresh((category, data) => {
    const currentCategory = PAGE_TO_CATEGORY[currentPageNumber];
    if (currentCategory === category) {
      newsData = data;
      updateContent();
      animateHeadlines();
    }
  });
}

// ============================================
// Exports for Testing
// ============================================

export function resetNewsPageState() {
  newsData = null;
  currentPageNumber = PAGE_NUMBERS.NEWS_TOP;
  isLoading = false;
  errorState = null;
  if (animationTimeline) { animationTimeline.kill(); animationTimeline = null; }
  if (loadingTween) { loadingTween.kill(); loadingTween = null; }
  if (autoRefreshUnsubscribe) { autoRefreshUnsubscribe(); autoRefreshUnsubscribe = null; }
}

export function isNewsPageNumber(pageNumber) { return isNewsPage(pageNumber); }
export function getCurrentNewsData() { return newsData; }
export function getIsLoading() { return isLoading; }
export function getErrorState() { return errorState; }
export function setMockNewsData(data) { newsData = data; isLoading = false; errorState = null; }

export { NEWS_CATEGORIES, PAGE_TO_CATEGORY, MAX_HEADLINES_DISPLAY };
