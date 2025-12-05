/**
 * Teletext Reborn - Enhanced Time Machine
 * 
 * A completely redesigned Time Machine experience inspired by History.com
 * Features:
 * - Simplified date selection (month/day only, like History.com)
 * - Featured "Event of the Day" highlight
 * - Rich event details with full descriptions
 * - Holidays support
 * - Event detail pages with Wikipedia links
 * - Better visual hierarchy and animations
 * 
 * @module pages/timeMachineEnhanced
 */

import gsap from 'gsap';
import { PAGE_NUMBERS, getRouter } from '../router.js';
import { getStateManager } from '../state.js';
import { MONTH_NAMES } from '../utils/date.js';
import { truncateToWidth, createSeparator } from '../utils/teletext.js';
import { getEnhancedOnThisDay } from '../services/wikipediaApi.js';
import { cleanupTimeTravelAnimation } from '../animations/timeTravel.js';

// ============================================
// Constants
// ============================================

/** Page numbers for enhanced Time Machine */
export const TM_PAGES = {
  DATE_SELECT: 500,    // Simplified date picker
  OVERVIEW: 501,       // On This Day overview with featured event
  DETAIL: 503,         // Event detail view (NEW!)
  TIMELINE: 504,       // Timeline view by century (NEW!)
};

/** Days in each month (non-leap year) */
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Items per page for pagination */
const ITEMS_PER_PAGE = 8;

// ============================================
// State
// ============================================

let selectedMonth = new Date().getMonth() + 1;  // Default to today
let selectedDay = new Date().getDate();
let currentPage = TM_PAGES.DATE_SELECT;
let currentCategory = 'events';  // events, births, deaths, holidays
let currentPageNum = 0;          // Pagination
let selectedEventIndex = -1;     // For detail view
let historyData = null;
let isLoading = false;
let errorMessage = null;
let animationTimeline = null;

// ============================================
// Helper Functions
// ============================================

function getDaysInMonth(month) {
  if (month === 2) {
    // February - use 29 for leap year safety
    return 29;
  }
  return DAYS_IN_MONTH[month - 1];
}

function getDateString() {
  return `${MONTH_NAMES[selectedMonth - 1]} ${selectedDay}`;
}

function getTodayMonth() {
  return new Date().getMonth() + 1;
}

function getTodayDay() {
  return new Date().getDate();
}

function isToday() {
  return selectedMonth === getTodayMonth() && selectedDay === getTodayDay();
}

// ============================================
// Render: Date Selection (Page 500)
// ============================================

function renderDateSelection() {
  const dateStr = getDateString();
  const todayHint = isToday() ? '(TODAY)' : '';
  
  return `
    <div class="tm-page tm-date-select" data-page="500">
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-cyan);">
        ★ TODAY IN HISTORY ★
      </div>
      
      <div class="content-line" style="text-align: center; color: var(--tt-white); margin: 8px 0;">
        DISCOVER WHAT HAPPENED ON ANY DAY
      </div>
      
      <div class="separator" style="color: var(--tt-cyan);">
        ${createSeparator('━', 40)}
      </div>
      
      <!-- Big Date Display -->
      <div class="tm-date-display" style="text-align: center; margin: 16px 0;">
        <div class="double-height phosphor-glow" style="color: var(--tt-yellow);">
          ${dateStr}
        </div>
        <div style="color: var(--tt-white); opacity: 0.7; margin-top: 8px;">
          ${todayHint}
        </div>
      </div>
      
      <!-- Simple Date Picker -->
      <div class="tm-picker" style="display: flex; justify-content: center; gap: 12px; margin: 16px 0;">
        <select id="tm-month" class="teletext-select" style="width: 140px;">
          ${MONTH_NAMES.map((name, i) => 
            `<option value="${i + 1}" ${i + 1 === selectedMonth ? 'selected' : ''}>${name}</option>`
          ).join('')}
        </select>
        <select id="tm-day" class="teletext-select" style="width: 70px;">
          ${Array.from({length: getDaysInMonth(selectedMonth)}, (_, i) => 
            `<option value="${i + 1}" ${i + 1 === selectedDay ? 'selected' : ''}>${String(i + 1).padStart(2, '0')}</option>`
          ).join('')}
        </select>
      </div>
      
      <!-- Explore Button -->
      <div style="text-align: center; margin: 20px 0;">
        <button id="tm-explore-btn" class="fastext-button fastext-button--green" style="padding: 12px 24px; font-size: 1.1em;">
          🔍 EXPLORE THIS DAY
        </button>
      </div>
      
      <div class="separator" style="color: var(--tt-cyan);">
        ${createSeparator('─', 40)}
      </div>
      
      <!-- Quick Actions -->
      <div class="tm-quick-actions" style="margin: 12px 0;">
        <div class="content-line" style="color: var(--tt-yellow);">QUICK JUMPS:</div>
        ${renderQuickJumps()}
      </div>
      
      <div class="teletext-page-footer" style="text-align: center; color: var(--tt-white); opacity: 0.7;">
        SELECT A DATE TO EXPLORE HISTORY
      </div>
    </div>
  `;
}

function renderQuickJumps() {
  const stateManager = getStateManager();
  const settings = stateManager.getSettings();
  
  const jumps = [];
  
  // User's birthday first
  if (settings.birthday) {
    jumps.push({
      label: '★ YOUR BIRTHDAY',
      month: settings.birthday.month,
      day: settings.birthday.day,
      color: 'var(--tt-magenta)'
    });
  }
  
  // Today
  jumps.push({
    label: '📅 TODAY',
    month: getTodayMonth(),
    day: getTodayDay(),
    color: 'var(--tt-green)'
  });
  
  // Famous dates (month/day only)
  const famous = [
    { label: '🌙 MOON LANDING', month: 7, day: 20 },
    { label: '🧱 BERLIN WALL', month: 11, day: 9 },
    { label: '🎆 NEW YEARS DAY', month: 1, day: 1 },
    { label: '💘 VALENTINES', month: 2, day: 14 },
    { label: '🎃 HALLOWEEN', month: 10, day: 31 },
    { label: '🎄 CHRISTMAS', month: 12, day: 25 },
  ];
  
  jumps.push(...famous.map(f => ({ ...f, color: 'var(--tt-cyan)' })));
  
  return jumps.slice(0, 6).map(jump => `
    <div class="tm-quick-jump content-line" 
         data-month="${jump.month}" 
         data-day="${jump.day}"
         style="color: ${jump.color}; cursor: pointer; padding: 2px 0;">
      • ${truncateToWidth(jump.label, 20)} - ${MONTH_NAMES[jump.month - 1].substring(0, 3)} ${jump.day}
    </div>
  `).join('');
}


// ============================================
// Render: Overview Page (Page 501)
// ============================================

function renderOverview() {
  if (isLoading) {
    return renderLoading('LOADING HISTORY...');
  }
  
  if (errorMessage) {
    return renderError(errorMessage);
  }
  
  if (!historyData) {
    return renderLoading('FETCHING DATA...');
  }
  
  const dateStr = getDateString();
  const featured = historyData.featuredEvent;
  const holidays = historyData.holidays || [];
  
  // Get current category data
  const categoryData = historyData[currentCategory] || [];
  const startIdx = currentPageNum * ITEMS_PER_PAGE;
  const pageItems = categoryData.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  const totalPages = Math.ceil(categoryData.length / ITEMS_PER_PAGE);
  
  return `
    <div class="tm-page tm-overview" data-page="501">
      <!-- Date Header -->
      <div class="tm-date-header" style="text-align: center; margin-bottom: 8px;">
        <div class="double-height phosphor-glow" style="color: var(--tt-magenta);">
          ★ ${dateStr} ★
        </div>
      </div>
      
      <!-- Holidays Banner -->
      ${holidays.length > 0 ? `
        <div class="tm-holidays" style="background: var(--tt-blue); padding: 4px 8px; margin: 4px 0;">
          <span style="color: var(--tt-yellow);">🎉 ${truncateToWidth(holidays[0].name, 35)}</span>
        </div>
      ` : ''}
      
      <!-- Featured Event -->
      ${featured ? `
        <div class="tm-featured" style="border: 1px solid var(--tt-cyan); padding: 8px; margin: 8px 0;">
          <div style="color: var(--tt-cyan); font-size: 0.9em;">★ FEATURED EVENT</div>
          <div style="color: var(--tt-yellow); margin: 4px 0;">
            <span style="color: var(--tt-cyan);">${featured.year}:</span>
            ${truncateToWidth(featured.fullDescription, 120)}
          </div>
          ${featured.wikipediaUrl ? `
            <div style="color: var(--tt-green); font-size: 0.85em; margin-top: 4px;">
              ▶ CLICK FOR DETAILS
            </div>
          ` : ''}
        </div>
      ` : ''}
      
      <!-- Category Tabs -->
      <div class="tm-tabs" style="display: flex; gap: 4px; margin: 8px 0; flex-wrap: wrap;">
        ${renderCategoryTab('events', 'EVENTS', historyData.totalEvents)}
        ${renderCategoryTab('births', 'BIRTHS', historyData.totalBirths)}
        ${renderCategoryTab('deaths', 'DEATHS', historyData.totalDeaths)}
        ${holidays.length > 0 ? renderCategoryTab('holidays', 'HOLIDAYS', holidays.length) : ''}
      </div>
      
      <div class="separator" style="color: var(--tt-cyan);">
        ${createSeparator('─', 40)}
      </div>
      
      <!-- Events List -->
      <div class="tm-events-list" style="margin: 4px 0;">
        ${pageItems.length > 0 ? pageItems.map((item, idx) => 
          renderEventItem(item, startIdx + idx)
        ).join('') : `
          <div class="content-line" style="color: var(--tt-white); opacity: 0.7;">
            NO ${currentCategory.toUpperCase()} FOUND
          </div>
        `}
      </div>
      
      <!-- Pagination -->
      ${totalPages > 1 ? `
        <div class="tm-pagination" style="text-align: center; margin: 8px 0; color: var(--tt-white);">
          PAGE ${currentPageNum + 1}/${totalPages}
          ${currentPageNum > 0 ? '<span class="tm-page-prev" style="color: var(--tt-cyan); cursor: pointer;"> [◄PREV]</span>' : ''}
          ${currentPageNum < totalPages - 1 ? '<span class="tm-page-next" style="color: var(--tt-cyan); cursor: pointer;"> [NEXT►]</span>' : ''}
        </div>
      ` : ''}
      
      <!-- Footer -->
      <div class="teletext-page-footer" style="text-align: center; color: var(--tt-white); opacity: 0.7;">
        SOURCE: WIKIPEDIA • CLICK EVENT FOR DETAILS
      </div>
    </div>
  `;
}

function renderCategoryTab(category, label, count) {
  const isActive = currentCategory === category;
  const bgColor = isActive ? 'var(--tt-cyan)' : 'transparent';
  const textColor = isActive ? 'var(--tt-black)' : 'var(--tt-cyan)';
  const border = isActive ? 'none' : '1px solid var(--tt-cyan)';
  
  return `
    <div class="tm-tab" 
         data-category="${category}"
         style="padding: 4px 8px; background: ${bgColor}; color: ${textColor}; 
                border: ${border}; cursor: pointer; font-size: 0.85em;">
      ${label} (${count})
    </div>
  `;
}

function renderEventItem(item, index) {
  const yearColor = item.type === 'birth' ? 'var(--tt-green)' : 
                    item.type === 'death' ? 'var(--tt-red)' : 'var(--tt-cyan)';
  
  return `
    <div class="tm-event-item content-line" 
         data-index="${index}"
         data-category="${currentCategory}"
         style="padding: 3px 0; cursor: pointer;">
      <span style="color: ${yearColor}; font-weight: bold;">${item.year || ''}:</span>
      <span style="color: var(--tt-white);">${truncateToWidth(item.description, 32)}</span>
    </div>
  `;
}


// ============================================
// Render: Event Detail Page (Page 503) - NEW!
// ============================================

function renderEventDetail() {
  if (isLoading) {
    return renderLoading('LOADING DETAILS...');
  }
  
  if (!historyData || selectedEventIndex < 0) {
    return renderError('EVENT NOT FOUND');
  }
  
  const categoryData = historyData[currentCategory] || [];
  const event = categoryData[selectedEventIndex];
  
  if (!event) {
    return renderError('EVENT NOT FOUND');
  }
  
  const dateStr = getDateString();
  const hasNext = selectedEventIndex < categoryData.length - 1;
  const hasPrev = selectedEventIndex > 0;
  
  // Format the full description with word wrapping
  const fullDesc = event.fullDescription || event.description;
  const wrappedDesc = wrapText(fullDesc, 38);
  
  return `
    <div class="tm-page tm-detail" data-page="503">
      <!-- Header -->
      <div class="tm-detail-header" style="margin-bottom: 8px;">
        <div style="color: var(--tt-cyan); font-size: 0.85em;">${dateStr}</div>
        <div style="color: var(--tt-white); opacity: 0.7; font-size: 0.8em;">
          ${currentCategory.toUpperCase()} ${selectedEventIndex + 1}/${categoryData.length}
        </div>
      </div>
      
      <!-- Year Display -->
      <div class="tm-detail-year" style="text-align: center; margin: 12px 0;">
        <div class="double-height phosphor-glow" style="color: var(--tt-yellow);">
          ${event.year || 'UNKNOWN'}
        </div>
      </div>
      
      <div class="separator" style="color: var(--tt-cyan);">
        ${createSeparator('═', 40)}
      </div>
      
      <!-- Full Description -->
      <div class="tm-detail-content" style="margin: 12px 0; max-height: 200px; overflow-y: auto;">
        ${wrappedDesc.map(line => `
          <div class="content-line" style="color: var(--tt-white);">${line}</div>
        `).join('')}
      </div>
      
      <!-- Related Info -->
      ${event.pageTitle ? `
        <div class="separator" style="color: var(--tt-cyan);">
          ${createSeparator('─', 40)}
        </div>
        <div style="margin: 8px 0;">
          <div style="color: var(--tt-yellow); font-size: 0.9em;">RELATED:</div>
          <div style="color: var(--tt-cyan);">${truncateToWidth(event.pageTitle, 38)}</div>
          ${event.pageDescription ? `
            <div style="color: var(--tt-white); opacity: 0.8; font-size: 0.85em;">
              ${truncateToWidth(event.pageDescription, 38)}
            </div>
          ` : ''}
        </div>
      ` : ''}
      
      <!-- Wikipedia Link -->
      ${event.wikipediaUrl ? `
        <div class="tm-wiki-link" style="margin: 12px 0; text-align: center;">
          <a href="${event.wikipediaUrl}" target="_blank" rel="noopener"
             style="color: var(--tt-green); text-decoration: none;">
            📖 READ MORE ON WIKIPEDIA
          </a>
        </div>
      ` : ''}
      
      <!-- Navigation -->
      <div class="tm-detail-nav" style="display: flex; justify-content: space-between; margin-top: 12px;">
        <span class="tm-nav-prev" style="color: ${hasPrev ? 'var(--tt-cyan)' : 'var(--tt-white)'}; 
              opacity: ${hasPrev ? '1' : '0.3'}; cursor: ${hasPrev ? 'pointer' : 'default'};">
          ◄ PREV
        </span>
        <span class="tm-nav-back" style="color: var(--tt-yellow); cursor: pointer;">
          ▲ BACK TO LIST
        </span>
        <span class="tm-nav-next" style="color: ${hasNext ? 'var(--tt-cyan)' : 'var(--tt-white)'}; 
              opacity: ${hasNext ? '1' : '0.3'}; cursor: ${hasNext ? 'pointer' : 'default'};">
          NEXT ►
        </span>
      </div>
    </div>
  `;
}

/**
 * Wrap text to specified width
 */
function wrapText(text, maxWidth) {
  if (!text) return [''];
  
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    if ((currentLine + ' ' + word).trim().length <= maxWidth) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word.length > maxWidth ? word.substring(0, maxWidth - 1) + '…' : word;
    }
  });
  
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
}

// ============================================
// Common Render Functions
// ============================================

function renderLoading(message = 'LOADING...') {
  return `
    <div class="tm-page tm-loading">
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-cyan);">
        ★ TODAY IN HISTORY ★
      </div>
      <div style="text-align: center; margin-top: 40px;">
        <div class="loading-text" style="color: var(--tt-yellow);">${message}</div>
        <div class="loading-cursor" style="color: var(--tt-cyan);">█</div>
        <div class="loading-bar" style="color: var(--tt-cyan); margin-top: 12px;">
          ░░░░░░░░░░░░░░░░░░░░
        </div>
      </div>
    </div>
  `;
}

function renderError(message) {
  return `
    <div class="tm-page tm-error">
      <div class="teletext-page-title phosphor-glow" style="color: var(--tt-cyan);">
        ★ TODAY IN HISTORY ★
      </div>
      <div style="text-align: center; margin-top: 30px; border: 2px solid var(--tt-red); padding: 16px;">
        <div style="color: var(--tt-red); font-size: 1.2em;">⚠ ERROR</div>
        <div style="color: var(--tt-white); margin: 12px 0;">${message}</div>
        <div style="margin-top: 16px;">
          <button class="tm-retry fastext-button fastext-button--red" style="margin-right: 8px;">RETRY</button>
          <button class="tm-home fastext-button fastext-button--cyan">HOME</button>
        </div>
      </div>
    </div>
  `;
}


// ============================================
// Page Interface
// ============================================

/**
 * Main render function
 */
export function render(pageNumber = null) {
  const page = pageNumber || currentPage;
  
  switch (page) {
    case TM_PAGES.OVERVIEW:
      return renderOverview();
    case TM_PAGES.DETAIL:
      return renderEventDetail();
    case TM_PAGES.DATE_SELECT:
    default:
      return renderDateSelection();
  }
}

/**
 * Called after page is mounted
 */
export async function onMount(pageNumber = null) {
  const page = pageNumber || currentPage;
  currentPage = page;
  
  attachEventHandlers();
  
  // Load data if on overview page
  if (page === TM_PAGES.OVERVIEW && !historyData) {
    await loadHistoryData();
  }
  
  animateContent();
}

/**
 * Called before page unmounts
 */
export function onUnmount() {
  if (animationTimeline) {
    animationTimeline.kill();
    animationTimeline = null;
  }
  cleanupTimeTravelAnimation();
  
  const elements = document.querySelectorAll('.tm-page *');
  if (elements.length > 0) {
    gsap.killTweensOf(elements);
  }
}

/**
 * Get Fastext buttons for current page
 */
export function getFastextButtons(pageNumber = null) {
  const page = pageNumber || currentPage;
  
  switch (page) {
    case TM_PAGES.OVERVIEW:
      return {
        red: { label: 'EVENTS', action: () => switchCategory('events') },
        green: { label: 'BIRTHS', action: () => switchCategory('births') },
        yellow: { label: 'DEATHS', action: () => switchCategory('deaths') },
        cyan: { label: 'NEW DATE', page: TM_PAGES.DATE_SELECT },
      };
    case TM_PAGES.DETAIL:
      return {
        red: { label: 'PREV', action: () => navigateEvent(-1) },
        green: { label: 'NEXT', action: () => navigateEvent(1) },
        yellow: { label: 'BACK', action: () => goToOverview() },
        cyan: { label: 'HOME', page: PAGE_NUMBERS.HOME },
      };
    case TM_PAGES.DATE_SELECT:
    default:
      return {
        red: { label: 'TODAY', action: () => setToday() },
        green: { label: 'EXPLORE', action: () => exploreDate() },
        yellow: { label: 'RANDOM', action: () => randomDate() },
        cyan: { label: 'HOME', page: PAGE_NUMBERS.HOME },
      };
  }
}

// ============================================
// Data Loading
// ============================================

async function loadHistoryData() {
  if (isLoading) return;
  
  isLoading = true;
  errorMessage = null;
  updatePage();
  
  try {
    historyData = await getEnhancedOnThisDay(selectedMonth, selectedDay);
    isLoading = false;
    currentPageNum = 0;
    updatePage();
    animateContent();
  } catch (error) {
    isLoading = false;
    errorMessage = error.message || 'FAILED TO LOAD DATA';
    updatePage();
  }
}

function updatePage() {
  const contentGrid = document.querySelector('#content-grid');
  const contentArea = document.querySelector('.content-area');
  const target = contentGrid || contentArea;
  
  if (target) {
    target.innerHTML = render(currentPage);
    attachEventHandlers();
  }
}

// ============================================
// Event Handlers
// ============================================

function attachEventHandlers() {
  // Month/Day selects
  const monthSelect = document.getElementById('tm-month');
  const daySelect = document.getElementById('tm-day');
  
  if (monthSelect) {
    monthSelect.addEventListener('change', (e) => {
      selectedMonth = parseInt(e.target.value, 10);
      updateDayOptions();
      updateDateDisplay();
    });
  }
  
  if (daySelect) {
    daySelect.addEventListener('change', (e) => {
      selectedDay = parseInt(e.target.value, 10);
      updateDateDisplay();
    });
  }
  
  // Explore button
  const exploreBtn = document.getElementById('tm-explore-btn');
  if (exploreBtn) {
    exploreBtn.addEventListener('click', exploreDate);
  }
  
  // Quick jumps
  document.querySelectorAll('.tm-quick-jump').forEach(el => {
    el.addEventListener('click', (e) => {
      const month = parseInt(e.currentTarget.dataset.month, 10);
      const day = parseInt(e.currentTarget.dataset.day, 10);
      selectedMonth = month;
      selectedDay = day;
      updatePage();
    });
  });
  
  // Category tabs
  document.querySelectorAll('.tm-tab').forEach(el => {
    el.addEventListener('click', (e) => {
      const category = e.currentTarget.dataset.category;
      switchCategory(category);
    });
  });
  
  // Event items (click for detail)
  document.querySelectorAll('.tm-event-item').forEach(el => {
    el.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index, 10);
      showEventDetail(index);
    });
  });
  
  // Featured event click
  const featured = document.querySelector('.tm-featured');
  if (featured) {
    featured.addEventListener('click', () => {
      // Show first selected event or first event
      if (historyData?.selected?.length > 0) {
        currentCategory = 'selected';
        showEventDetail(0);
      } else if (historyData?.events?.length > 0) {
        currentCategory = 'events';
        showEventDetail(0);
      }
    });
    featured.style.cursor = 'pointer';
  }
  
  // Pagination
  const prevPage = document.querySelector('.tm-page-prev');
  const nextPage = document.querySelector('.tm-page-next');
  if (prevPage) prevPage.addEventListener('click', () => changePage(-1));
  if (nextPage) nextPage.addEventListener('click', () => changePage(1));
  
  // Detail navigation
  const navPrev = document.querySelector('.tm-nav-prev');
  const navNext = document.querySelector('.tm-nav-next');
  const navBack = document.querySelector('.tm-nav-back');
  if (navPrev) navPrev.addEventListener('click', () => navigateEvent(-1));
  if (navNext) navNext.addEventListener('click', () => navigateEvent(1));
  if (navBack) navBack.addEventListener('click', goToOverview);
  
  // Error buttons
  const retryBtn = document.querySelector('.tm-retry');
  const homeBtn = document.querySelector('.tm-home');
  if (retryBtn) retryBtn.addEventListener('click', () => loadHistoryData());
  if (homeBtn) homeBtn.addEventListener('click', () => getRouter().navigate(PAGE_NUMBERS.HOME));
}

function updateDayOptions() {
  const daySelect = document.getElementById('tm-day');
  if (!daySelect) return;
  
  const maxDays = getDaysInMonth(selectedMonth);
  if (selectedDay > maxDays) selectedDay = maxDays;
  
  daySelect.innerHTML = Array.from({length: maxDays}, (_, i) => 
    `<option value="${i + 1}" ${i + 1 === selectedDay ? 'selected' : ''}>${String(i + 1).padStart(2, '0')}</option>`
  ).join('');
}

function updateDateDisplay() {
  const display = document.querySelector('.tm-date-display .double-height');
  if (display) {
    display.textContent = getDateString();
  }
}


// ============================================
// Actions
// ============================================

function setToday() {
  selectedMonth = getTodayMonth();
  selectedDay = getTodayDay();
  updatePage();
}

function randomDate() {
  selectedMonth = Math.floor(Math.random() * 12) + 1;
  selectedDay = Math.floor(Math.random() * getDaysInMonth(selectedMonth)) + 1;
  updatePage();
}

async function exploreDate() {
  // Clear old data
  historyData = null;
  currentPageNum = 0;
  currentCategory = 'events';
  
  // Play animation and navigate
  const container = document.querySelector('.teletext-screen') || document.body;
  
  // Simple transition (no year animation since we're not using years)
  gsap.to(container, {
    filter: 'brightness(1.5) blur(5px)',
    duration: 0.3,
    ease: 'power2.in',
    onComplete: async () => {
      currentPage = TM_PAGES.OVERVIEW;
      await loadHistoryData();
      
      gsap.to(container, {
        filter: 'brightness(1) blur(0px)',
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  });
}

function switchCategory(category) {
  currentCategory = category;
  currentPageNum = 0;
  updatePage();
  animateContent();
}

function changePage(delta) {
  const categoryData = historyData?.[currentCategory] || [];
  const totalPages = Math.ceil(categoryData.length / ITEMS_PER_PAGE);
  
  currentPageNum = Math.max(0, Math.min(totalPages - 1, currentPageNum + delta));
  updatePage();
  animateContent();
}

function showEventDetail(index) {
  selectedEventIndex = index;
  currentPage = TM_PAGES.DETAIL;
  updatePage();
  animateContent();
}

function navigateEvent(delta) {
  const categoryData = historyData?.[currentCategory] || [];
  const newIndex = selectedEventIndex + delta;
  
  if (newIndex >= 0 && newIndex < categoryData.length) {
    selectedEventIndex = newIndex;
    updatePage();
    animateContent();
  }
}

function goToOverview() {
  selectedEventIndex = -1;
  currentPage = TM_PAGES.OVERVIEW;
  updatePage();
  animateContent();
}

// ============================================
// Animations
// ============================================

function animateContent() {
  const items = document.querySelectorAll('.tm-event-item, .tm-quick-jump, .content-line');
  
  if (items.length === 0) return;
  
  if (animationTimeline) {
    animationTimeline.kill();
  }
  
  gsap.killTweensOf(items);
  
  animationTimeline = gsap.timeline();
  
  animationTimeline.fromTo(items,
    { opacity: 0, y: 8 },
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

// ============================================
// Exports for Testing
// ============================================

export function resetState() {
  selectedMonth = new Date().getMonth() + 1;
  selectedDay = new Date().getDate();
  currentPage = TM_PAGES.DATE_SELECT;
  currentCategory = 'events';
  currentPageNum = 0;
  selectedEventIndex = -1;
  historyData = null;
  isLoading = false;
  errorMessage = null;
  
  if (animationTimeline) {
    animationTimeline.kill();
    animationTimeline = null;
  }
}

export function getState() {
  return {
    selectedMonth,
    selectedDay,
    currentPage,
    currentCategory,
    currentPageNum,
    selectedEventIndex,
    historyData,
    isLoading,
    errorMessage,
  };
}

export function setState(newState) {
  if (newState.selectedMonth !== undefined) selectedMonth = newState.selectedMonth;
  if (newState.selectedDay !== undefined) selectedDay = newState.selectedDay;
  if (newState.currentPage !== undefined) currentPage = newState.currentPage;
  if (newState.currentCategory !== undefined) currentCategory = newState.currentCategory;
  if (newState.currentPageNum !== undefined) currentPageNum = newState.currentPageNum;
  if (newState.selectedEventIndex !== undefined) selectedEventIndex = newState.selectedEventIndex;
  if (newState.historyData !== undefined) historyData = newState.historyData;
  if (newState.isLoading !== undefined) isLoading = newState.isLoading;
  if (newState.errorMessage !== undefined) errorMessage = newState.errorMessage;
}

// TM_PAGES is already exported at declaration
export { ITEMS_PER_PAGE };
