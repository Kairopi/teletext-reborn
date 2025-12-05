/**
 * Teletext Reborn - Main Application Component
 * 
 * TeletextScreen is the main container component that renders:
 * - Header bar with service name, page number, and live clock
 * - Content area with 40x22 character grid
 * - Navigation bar with Fastext buttons and page controls
 * - All CRT effects as overlays
 * 
 * Requirements: 0.1-0.8, 2.6, 32.7
 */

import gsap from 'gsap';
import { getRouter, PAGE_NUMBERS } from './router.js';
import { attachAllEffects } from './animations/effects.js';
import { playClick } from './services/soundManager.js';

// Import page components
import * as homePage from './pages/home.js';
import * as newsPage from './pages/news.js';
import * as weatherPage from './pages/weather.js';
import * as financePage from './pages/finance.js';
// Use enhanced Time Machine for better UX
import * as timeMachinePage from './pages/timeMachineEnhanced.js';
import * as settingsPage from './pages/settings.js';
import * as aboutPage from './pages/about.js';
// Easter Egg pages
import * as easterEggPage from './pages/easterEgg.js';
import * as notFoundPage from './pages/notFound.js';
// Easter Eggs system
import { initKonamiCode, destroyKonamiCode } from './utils/easterEggs.js';
import { initKeyboardShortcutsOverlay, destroyKeyboardShortcutsOverlay } from './utils/keyboardShortcuts.js';

/**
 * Page registry - maps page numbers to page modules
 */
const PAGE_REGISTRY = {
  [PAGE_NUMBERS.HOME]: homePage,
  [PAGE_NUMBERS.NEWS_TOP]: newsPage,
  [PAGE_NUMBERS.NEWS_WORLD]: newsPage,
  [PAGE_NUMBERS.NEWS_TECH]: newsPage,
  [PAGE_NUMBERS.NEWS_BUSINESS]: newsPage,
  [PAGE_NUMBERS.NEWS_SPORTS]: newsPage,
  [PAGE_NUMBERS.WEATHER]: weatherPage,
  [PAGE_NUMBERS.FINANCE]: financePage,
  [PAGE_NUMBERS.TIME_MACHINE]: timeMachinePage,
  [PAGE_NUMBERS.TIME_MACHINE_EVENTS]: timeMachinePage,
  [PAGE_NUMBERS.TIME_MACHINE_WEATHER]: timeMachinePage,
  // Enhanced Time Machine pages
  503: timeMachinePage,  // Event Detail page
  504: timeMachinePage,  // Timeline view
  // Easter Egg and 404 pages - use literal numbers to ensure they work
  888: easterEggPage,  // Page 888 Easter Egg
  404: notFoundPage,   // Page 404 Not Found
  // Settings and About
  [PAGE_NUMBERS.SETTINGS]: settingsPage,
  [PAGE_NUMBERS.ABOUT]: aboutPage,
};

console.log('[PAGE_REGISTRY] Initialized with keys:', Object.keys(PAGE_REGISTRY));
console.log('[PAGE_REGISTRY] PAGE_NUMBERS.EASTER_EGG =', PAGE_NUMBERS.EASTER_EGG);

/**
 * Current mounted page module
 * @type {Object|null}
 */
let currentPageModule = null;

/**
 * Current page number
 * @type {number}
 */
let currentMountedPage = null;

/**
 * Fastext button configuration per page
 * Each page can have custom labels for the four colored buttons
 */
const FASTEXT_CONFIG = {
  [PAGE_NUMBERS.HOME]: {
    red: { label: 'NEWS', page: PAGE_NUMBERS.NEWS_TOP },
    green: { label: 'WEATHER', page: PAGE_NUMBERS.WEATHER },
    yellow: { label: 'FINANCE', page: PAGE_NUMBERS.FINANCE },
    cyan: { label: 'TIME', page: PAGE_NUMBERS.TIME_MACHINE },
  },
  [PAGE_NUMBERS.NEWS_TOP]: {
    red: { label: 'HOME', page: PAGE_NUMBERS.HOME },
    green: { label: 'WORLD', page: PAGE_NUMBERS.NEWS_WORLD },
    yellow: { label: 'TECH', page: PAGE_NUMBERS.NEWS_TECH },
    cyan: { label: 'SPORTS', page: PAGE_NUMBERS.NEWS_SPORTS },
  },
  [PAGE_NUMBERS.WEATHER]: {
    red: { label: 'HOME', page: PAGE_NUMBERS.HOME },
    green: { label: 'NEWS', page: PAGE_NUMBERS.NEWS_TOP },
    yellow: { label: 'FINANCE', page: PAGE_NUMBERS.FINANCE },
    cyan: { label: 'TIME', page: PAGE_NUMBERS.TIME_MACHINE },
  },
  [PAGE_NUMBERS.FINANCE]: {
    red: { label: 'HOME', page: PAGE_NUMBERS.HOME },
    green: { label: 'NEWS', page: PAGE_NUMBERS.NEWS_TOP },
    yellow: { label: 'WEATHER', page: PAGE_NUMBERS.WEATHER },
    cyan: { label: 'TIME', page: PAGE_NUMBERS.TIME_MACHINE },
  },
  [PAGE_NUMBERS.TIME_MACHINE]: {
    red: { label: 'TODAY', page: PAGE_NUMBERS.HOME },
    green: { label: 'EVENTS', page: PAGE_NUMBERS.TIME_MACHINE_EVENTS },
    yellow: { label: 'WEATHER', page: PAGE_NUMBERS.TIME_MACHINE_WEATHER },
    cyan: { label: 'RANDOM', page: null }, // Special action
  },
  [PAGE_NUMBERS.SETTINGS]: {
    red: { label: 'HOME', page: PAGE_NUMBERS.HOME },
    green: { label: 'SAVE', page: null }, // Special action
    yellow: { label: 'RESET', page: null }, // Special action
    cyan: { label: 'ABOUT', page: PAGE_NUMBERS.ABOUT },
  },
  default: {
    red: { label: 'HOME', page: PAGE_NUMBERS.HOME },
    green: { label: 'NEWS', page: PAGE_NUMBERS.NEWS_TOP },
    yellow: { label: 'WEATHER', page: PAGE_NUMBERS.WEATHER },
    cyan: { label: 'TIME', page: PAGE_NUMBERS.TIME_MACHINE },
  },
};


/**
 * TeletextScreen class
 * Main container component for the Teletext application
 */
class TeletextScreen {
  /**
   * Create a TeletextScreen instance
   * @param {string} containerId - ID of the container element
   */
  constructor(containerId) {
    /** @type {string} Container element ID */
    this._containerId = containerId;
    
    /** @type {HTMLElement|null} Container element */
    this._container = null;
    
    /** @type {HTMLElement|null} Screen element */
    this._screen = null;
    
    /** @type {HTMLElement|null} Content area element */
    this._contentArea = null;
    
    /** @type {HTMLElement|null} Clock element */
    this._clockElement = null;
    
    /** @type {HTMLElement|null} Page number element */
    this._pageNumberElement = null;
    
    /** @type {HTMLInputElement|null} Page input element */
    this._pageInput = null;
    
    /** @type {number|null} Clock interval ID */
    this._clockInterval = null;
    
    /** @type {gsap.core.Tween|null} Clock digit animation */
    this._clockTween = null;
    
    /** @type {string} Previous clock value for digit change detection */
    this._previousClockValue = '';
    
    /** @type {number} Current page number */
    this._currentPage = PAGE_NUMBERS.HOME;
    
    /** @type {boolean} Whether the screen is rendered */
    this._isRendered = false;
    
    /** @type {Function|null} Router unsubscribe function */
    this._routerUnsubscribe = null;
    
    /** @type {string} Current theme */
    this._theme = 'color';
    
    /** @type {boolean} Whether loading state is shown */
    this._isLoading = false;
  }

  // ============================================
  // Rendering Methods
  // ============================================

  /**
   * Render the Teletext screen
   * Requirements: 0.1-0.8
   */
  async render() {
    this._container = document.getElementById(this._containerId);
    
    if (!this._container) {
      console.error(`Container #${this._containerId} not found`);
      return;
    }

    // Create the screen HTML structure
    this._container.innerHTML = this._createScreenHTML();
    
    // Cache DOM references
    this._cacheElements();
    
    // Initialize components
    this._initializeClock();
    this._initializePageInput();
    this._initializeFastextButtons();
    this._initializeNavArrows();
    
    // Subscribe to router navigation events
    this._subscribeToRouter();
    
    // Attach micro-interaction effects
    attachAllEffects(this._container);
    
    // Initialize router keyboard shortcuts (number keys 1-9, arrows, Escape)
    const router = getRouter();
    router.initKeyboardShortcuts();
    console.log('[TeletextScreen] Router keyboard shortcuts initialized');
    
    // Initialize Easter eggs (Konami code detection)
    initKonamiCode();
    console.log('[TeletextScreen] Konami code detection initialized');
    
    // Initialize keyboard shortcuts overlay (? key)
    initKeyboardShortcutsOverlay();
    console.log('[TeletextScreen] Keyboard shortcuts overlay initialized');
    
    this._isRendered = true;
    
    // Render the initial page (home page)
    await this._renderPage(this._currentPage);
  }

  /**
   * Create the HTML structure for the screen
   * @returns {string} HTML string
   * @private
   */
  _createScreenHTML() {
    const fastextButtons = this._getFastextConfig(this._currentPage);
    
    return `
      <div class="teletext-app">
        <div class="tv-bezel">
          <div class="teletext-screen crt-container">
            <!-- CRT Effects Overlays -->
            <div class="scanlines"></div>
            <div class="vignette"></div>
            <div class="glass-reflection"></div>
            <div class="noise-overlay"></div>
            <div class="static-overlay"></div>
            <div class="flash-overlay"></div>
            
            <!-- Header Bar (Req 0.2) -->
            <header class="header-bar" role="banner" aria-label="Teletext header">
              <span class="header-service-name phosphor-glow">TELETEXT</span>
              <span class="header-page-number phosphor-glow" id="page-number">P.${this._formatPageNumber(this._currentPage)}</span>
              <span class="header-clock phosphor-glow" id="clock" aria-live="polite" aria-atomic="true">00:00:00</span>
            </header>
            
            <!-- Content Area (Req 0.3) -->
            <main class="content-area" role="main" aria-label="Main content" data-page="${this._currentPage}" id="content-area">
              <div class="content-grid" id="content-grid">
                <!-- Content will be rendered by page components -->
              </div>
            </main>
            
            <!-- Navigation Bar (Req 0.4) -->
            <nav class="navigation-bar" role="navigation" aria-label="Page navigation">
              <!-- Fastext Buttons (Row 1) -->
              <div class="fastext-bar" role="group" aria-label="Quick navigation buttons">
                <button class="fastext-button fastext-button--red" data-page="${fastextButtons.red.page}" aria-label="Navigate to ${fastextButtons.red.label}">${fastextButtons.red.label}</button>
                <button class="fastext-button fastext-button--green" data-page="${fastextButtons.green.page}" aria-label="Navigate to ${fastextButtons.green.label}">${fastextButtons.green.label}</button>
                <button class="fastext-button fastext-button--yellow" data-page="${fastextButtons.yellow.page}" aria-label="Navigate to ${fastextButtons.yellow.label}">${fastextButtons.yellow.label}</button>
                <button class="fastext-button fastext-button--cyan" data-page="${fastextButtons.cyan.page}" aria-label="Navigate to ${fastextButtons.cyan.label}">${fastextButtons.cyan.label}</button>
              </div>
              
              <!-- Page Navigation (Row 2) (Req 0.5) -->
              <div class="page-nav-bar" role="group" aria-label="Page number navigation">
                <button class="nav-arrow nav-arrow--prev" aria-label="Previous page">◄ PREV</button>
                <input 
                  type="text" 
                  class="page-input" 
                  id="page-input"
                  maxlength="3" 
                  placeholder="___" 
                  aria-label="Enter page number (3 digits)"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  autocomplete="off"
                >
                <button class="nav-arrow nav-arrow--next" aria-label="Next page">NEXT ►</button>
              </div>
            </nav>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Cache DOM element references
   * @private
   */
  _cacheElements() {
    this._screen = this._container.querySelector('.teletext-screen');
    this._contentArea = this._container.querySelector('#content-area');
    this._clockElement = this._container.querySelector('#clock');
    this._pageNumberElement = this._container.querySelector('#page-number');
    this._pageInput = this._container.querySelector('#page-input');
  }


  // ============================================
  // Clock Methods (Req 2.6, 32.7)
  // ============================================

  /**
   * Initialize the live clock
   * Updates every second in HH:MM:SS format
   * @private
   */
  _initializeClock() {
    // Update immediately
    this._updateClock();
    
    // Update every second
    this._clockInterval = setInterval(() => {
      this._updateClock();
    }, 1000);
  }

  /**
   * Update the clock display
   * Animates digit changes (Req 32.7)
   * @private
   */
  _updateClock() {
    if (!this._clockElement) return;
    
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const newValue = `${hours}:${minutes}:${seconds}`;
    
    // Check if any digit changed for animation
    if (this._previousClockValue && this._previousClockValue !== newValue) {
      this._animateClockChange(newValue);
    } else {
      this._clockElement.textContent = newValue;
    }
    
    this._previousClockValue = newValue;
  }

  /**
   * Animate clock digit changes
   * @param {string} newValue - New clock value
   * @private
   */
  _animateClockChange(newValue) {
    if (!this._clockElement) return;
    
    // Kill any existing animation
    if (this._clockTween) {
      this._clockTween.kill();
    }
    
    // Brief flash effect on digit change
    this._clockTween = gsap.to(this._clockElement, {
      opacity: 0.7,
      duration: 0.05,
      ease: 'power1.out',
      onComplete: () => {
        this._clockElement.textContent = newValue;
        gsap.to(this._clockElement, {
          opacity: 1,
          duration: 0.1,
          ease: 'power1.in'
        });
      }
    });
  }

  /**
   * Stop the clock
   * @private
   */
  _stopClock() {
    if (this._clockInterval) {
      clearInterval(this._clockInterval);
      this._clockInterval = null;
    }
    if (this._clockTween) {
      this._clockTween.kill();
      this._clockTween = null;
    }
  }

  // ============================================
  // Page Input Methods (Req 0.5)
  // ============================================

  /**
   * Initialize the page number input
   * @private
   */
  _initializePageInput() {
    if (!this._pageInput) return;
    
    // Handle input - only allow numeric
    this._pageInput.addEventListener('input', (e) => {
      // Remove non-numeric characters
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      
      // Auto-navigate when 3 digits entered
      if (e.target.value.length === 3) {
        this._navigateToInputPage();
      }
    });
    
    // Handle Enter key
    this._pageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this._navigateToInputPage();
      }
      
      // Prevent non-numeric keys (except control keys)
      if (!/^[0-9]$/.test(e.key) && 
          !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }
    });
    
    // Clear on focus
    this._pageInput.addEventListener('focus', () => {
      this._pageInput.value = '';
    });
    
    // Restore placeholder on blur if empty
    this._pageInput.addEventListener('blur', () => {
      if (!this._pageInput.value) {
        this._pageInput.placeholder = '___';
      }
    });
  }

  /**
   * Navigate to the page number entered in the input
   * @private
   */
  _navigateToInputPage() {
    if (!this._pageInput) return;
    
    const pageNumber = parseInt(this._pageInput.value, 10);
    
    if (!isNaN(pageNumber) && pageNumber >= 100 && pageNumber <= 999) {
      const router = getRouter();
      router.navigate(pageNumber);
      this._pageInput.blur();
    }
    
    // Clear input after navigation attempt
    this._pageInput.value = '';
  }

  // ============================================
  // Fastext Button Methods
  // ============================================

  /**
   * Initialize Fastext button click handlers
   * @private
   */
  _initializeFastextButtons() {
    const buttons = this._container.querySelectorAll('.fastext-button');
    
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        // Play click sound for tactile feedback
        playClick();
        
        const pageNumber = parseInt(button.dataset.page, 10);
        
        if (!isNaN(pageNumber)) {
          const router = getRouter();
          router.navigate(pageNumber);
        }
      });
    });
  }

  /**
   * Update Fastext button labels for current page
   * @private
   */
  _updateFastextButtons() {
    const config = this._getFastextConfig(this._currentPage);
    const buttons = this._container.querySelectorAll('.fastext-button');
    
    const colors = ['red', 'green', 'yellow', 'cyan'];
    buttons.forEach((button, index) => {
      const color = colors[index];
      const buttonConfig = config[color];
      
      button.textContent = buttonConfig.label;
      button.dataset.page = buttonConfig.page;
      button.setAttribute('aria-label', `Navigate to ${buttonConfig.label}`);
    });
  }

  /**
   * Get Fastext configuration for a page
   * @param {number} pageNumber - Page number
   * @returns {Object} Fastext configuration
   * @private
   */
  _getFastextConfig(pageNumber) {
    return FASTEXT_CONFIG[pageNumber] || FASTEXT_CONFIG.default;
  }

  // ============================================
  // Navigation Arrow Methods
  // ============================================

  /**
   * Initialize navigation arrow click handlers
   * @private
   */
  _initializeNavArrows() {
    const prevButton = this._container.querySelector('.nav-arrow--prev');
    const nextButton = this._container.querySelector('.nav-arrow--next');
    
    if (prevButton) {
      prevButton.addEventListener('click', () => {
        playClick();
        const router = getRouter();
        router.goToPreviousPage();
      });
    }
    
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        playClick();
        const router = getRouter();
        router.goToNextPage();
      });
    }
  }


  // ============================================
  // Router Integration
  // ============================================

  /**
   * Subscribe to router navigation events
   * @private
   */
  _subscribeToRouter() {
    const router = getRouter();
    
    this._routerUnsubscribe = router.onNavigate((newPage, previousPage) => {
      this._onPageChange(newPage, previousPage);
    });
  }

  /**
   * Handle page change from router
   * @param {number} newPage - New page number
   * @param {number} previousPage - Previous page number
   * @private
   */
  async _onPageChange(newPage, previousPage) {
    console.log(`[TeletextScreen] _onPageChange: ${previousPage} -> ${newPage}`);
    this._currentPage = newPage;
    
    // Update page number display (Req 0.7)
    this._updatePageNumber(newPage);
    
    // Update content area data attribute
    if (this._contentArea) {
      this._contentArea.dataset.page = newPage;
    }
    
    // Render the new page content (this will also update Fastext buttons)
    await this._renderPage(newPage);
    
    // Fallback: Update Fastext buttons from config if page didn't provide them
    // This ensures buttons are always updated even if page doesn't have getFastextButtons
    const pageModule = PAGE_REGISTRY[newPage];
    if (!pageModule || typeof pageModule.getFastextButtons !== 'function') {
      this._updateFastextButtons();
    }
  }
  
  /**
   * Render a page by its page number
   * @param {number} pageNumber - Page number to render
   * @private
   */
  async _renderPage(pageNumber) {
    console.log(`[TeletextScreen] _renderPage called with: ${pageNumber}`);
    console.log(`[TeletextScreen] PAGE_REGISTRY keys:`, Object.keys(PAGE_REGISTRY));
    
    // Unmount current page if exists
    if (currentPageModule && typeof currentPageModule.onUnmount === 'function') {
      try {
        currentPageModule.onUnmount();
      } catch (error) {
        console.error('Error unmounting page:', error);
      }
    }
    
    // Find the page module
    const pageModule = PAGE_REGISTRY[pageNumber];
    console.log(`[TeletextScreen] Found pageModule for ${pageNumber}:`, pageModule ? 'YES' : 'NO');
    
    if (pageModule) {
      // Render the page content
      const contentGrid = this.getContentGrid();
      console.log(`[TeletextScreen] contentGrid found:`, contentGrid ? 'YES' : 'NO');
      console.log(`[TeletextScreen] pageModule.render exists:`, typeof pageModule.render === 'function');
      
      if (contentGrid && typeof pageModule.render === 'function') {
        try {
          const html = pageModule.render(pageNumber);
          console.log(`[TeletextScreen] Rendered HTML length:`, html?.length || 0);
          contentGrid.innerHTML = html;
          console.log(`[TeletextScreen] Content updated successfully`);
        } catch (error) {
          console.error('Error rendering page:', error);
          contentGrid.innerHTML = '<div class="error-container">ERROR LOADING PAGE</div>';
        }
      } else {
        console.error(`[TeletextScreen] Cannot render: contentGrid=${!!contentGrid}, render=${typeof pageModule.render}`);
      }
      
      // Update Fastext buttons from page if available
      if (typeof pageModule.getFastextButtons === 'function') {
        try {
          const buttons = pageModule.getFastextButtons();
          this._updateFastextButtonsFromPage(buttons);
        } catch (error) {
          console.error('Error updating Fastext buttons:', error);
        }
      }
      
      // Mount the page
      if (typeof pageModule.onMount === 'function') {
        try {
          await pageModule.onMount(pageNumber);
        } catch (error) {
          console.error('Error mounting page:', error);
        }
      }
      
      currentPageModule = pageModule;
      currentMountedPage = pageNumber;
    } else {
      // Show placeholder for unimplemented pages
      this._renderPlaceholderPage(pageNumber);
    }
  }
  
  /**
   * Render a placeholder for unimplemented pages
   * @param {number} pageNumber - Page number
   * @private
   */
  _renderPlaceholderPage(pageNumber) {
    const contentGrid = this.getContentGrid();
    if (!contentGrid) return;
    
    contentGrid.innerHTML = `
      <div class="placeholder-page teletext-page">
        <div class="teletext-page-title phosphor-glow">
          PAGE ${pageNumber}
        </div>
        <div class="teletext-page-content" style="text-align: center; padding-top: 20px;">
          <div class="content-line" style="color: var(--tt-cyan);">
            COMING SOON
          </div>
          <div class="content-line" style="color: var(--color-secondary-70); margin-top: 12px;">
            THIS PAGE IS UNDER CONSTRUCTION
          </div>
        </div>
      </div>
    `;
    
    currentPageModule = null;
    currentMountedPage = pageNumber;
  }
  
  /**
   * Update Fastext buttons from page configuration
   * @param {Object} buttons - Button configuration from page
   * @private
   */
  _updateFastextButtonsFromPage(buttons) {
    if (!buttons) {
      console.warn('No button configuration provided to _updateFastextButtonsFromPage');
      return;
    }
    
    const buttonElements = this._container.querySelectorAll('.fastext-button');
    const colors = ['red', 'green', 'yellow', 'cyan'];
    
    if (buttonElements.length !== 4) {
      console.warn(`Expected 4 Fastext buttons, found ${buttonElements.length}`);
    }
    
    buttonElements.forEach((button, index) => {
      const color = colors[index];
      const config = buttons[color];
      
      if (config) {
        button.textContent = config.label;
        button.dataset.page = config.page;
        button.setAttribute('aria-label', `Navigate to ${config.label}`);
      } else {
        console.warn(`No config for button color: ${color}`);
      }
    });
  }

  // ============================================
  // Page Display Methods
  // ============================================

  /**
   * Set the current page
   * @param {number} pageNumber - Page number to display
   */
  setPage(pageNumber) {
    const router = getRouter();
    router.navigate(pageNumber);
  }

  /**
   * Get the current page number
   * @returns {number} Current page number
   */
  getCurrentPage() {
    return this._currentPage;
  }

  /**
   * Update the page number display
   * @param {number} pageNumber - Page number
   * @private
   */
  _updatePageNumber(pageNumber) {
    if (!this._pageNumberElement) return;
    
    const formattedNumber = this._formatPageNumber(pageNumber);
    
    // Animate the page number change
    gsap.to(this._pageNumberElement, {
      opacity: 0.5,
      duration: 0.1,
      ease: 'power1.out',
      onComplete: () => {
        this._pageNumberElement.textContent = `P.${formattedNumber}`;
        gsap.to(this._pageNumberElement, {
          opacity: 1,
          duration: 0.15,
          ease: 'power1.in'
        });
      }
    });
  }

  /**
   * Format page number as 3-digit string
   * @param {number} pageNumber - Page number
   * @returns {string} Formatted page number
   * @private
   */
  _formatPageNumber(pageNumber) {
    return pageNumber.toString().padStart(3, '0');
  }

  // ============================================
  // Content Methods
  // ============================================

  /**
   * Set the content of the content area
   * @param {string} html - HTML content to display
   */
  setContent(html) {
    const contentGrid = this._container.querySelector('#content-grid');
    if (contentGrid) {
      contentGrid.innerHTML = html;
    }
  }

  /**
   * Get the content area element
   * @returns {HTMLElement|null} Content area element
   */
  getContentArea() {
    return this._contentArea;
  }

  /**
   * Get the content grid element
   * @returns {HTMLElement|null} Content grid element
   */
  getContentGrid() {
    return this._container?.querySelector('#content-grid') || null;
  }

  // ============================================
  // Loading State Methods
  // ============================================

  /**
   * Show loading state in content area
   */
  showLoading() {
    this._isLoading = true;
    
    const contentGrid = this.getContentGrid();
    if (!contentGrid) return;
    
    contentGrid.innerHTML = `
      <div class="loading-container">
        <div class="loading-text">LOADING<span class="loading-cursor">█</span></div>
        <div class="loading-progress">░░░░░░░░░░</div>
      </div>
    `;
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this._isLoading = false;
    // Content will be replaced by page component
  }

  /**
   * Check if loading state is shown
   * @returns {boolean} True if loading
   */
  isLoading() {
    return this._isLoading;
  }

  // ============================================
  // Theme Methods
  // ============================================

  /**
   * Apply a theme to the screen
   * @param {'classic'|'color'} theme - Theme name
   */
  applyTheme(theme) {
    this._theme = theme;
    
    if (!this._screen) return;
    
    // Remove existing theme classes
    this._screen.classList.remove('theme-classic', 'theme-color');
    
    // Add new theme class
    this._screen.classList.add(`theme-${theme}`);
    
    // Classic theme uses green on black
    if (theme === 'classic') {
      this._screen.style.setProperty('--color-primary', 'var(--tt-green)');
    } else {
      this._screen.style.setProperty('--color-primary', 'var(--tt-yellow)');
    }
  }

  /**
   * Get the current theme
   * @returns {string} Current theme name
   */
  getTheme() {
    return this._theme;
  }

  // ============================================
  // CRT Effect Methods
  // ============================================

  /**
   * Toggle scanlines effect
   * @param {boolean} enabled - Whether to enable scanlines
   */
  toggleScanlines(enabled) {
    const scanlines = this._container?.querySelector('.scanlines');
    if (scanlines) {
      scanlines.classList.toggle('scanlines-disabled', !enabled);
    }
  }

  /**
   * Get the screen element
   * @returns {HTMLElement|null} Screen element
   */
  getScreen() {
    return this._screen;
  }

  // ============================================
  // Lifecycle Methods
  // ============================================

  /**
   * Check if the screen is rendered
   * @returns {boolean} True if rendered
   */
  isRendered() {
    return this._isRendered;
  }

  /**
   * Destroy the screen and clean up resources
   */
  destroy() {
    // Stop clock
    this._stopClock();
    
    // Unsubscribe from router
    if (this._routerUnsubscribe) {
      this._routerUnsubscribe();
      this._routerUnsubscribe = null;
    }
    
    // Clean up Easter eggs
    destroyKonamiCode();
    destroyKeyboardShortcutsOverlay();
    
    // Clear container
    if (this._container) {
      this._container.innerHTML = '';
    }
    
    // Clear references
    this._screen = null;
    this._contentArea = null;
    this._clockElement = null;
    this._pageNumberElement = null;
    this._pageInput = null;
    this._isRendered = false;
  }
}

// ============================================
// Singleton Instance
// ============================================

/**
 * Singleton instance of TeletextScreen
 * @type {TeletextScreen|null}
 */
let screenInstance = null;

/**
 * Get the TeletextScreen singleton instance
 * @param {string} [containerId='app'] - Container element ID
 * @returns {TeletextScreen}
 */
export function getTeletextScreen(containerId = 'app') {
  if (!screenInstance) {
    screenInstance = new TeletextScreen(containerId);
  }
  return screenInstance;
}

/**
 * Reset the TeletextScreen instance (useful for testing)
 */
export function resetTeletextScreen() {
  if (screenInstance) {
    screenInstance.destroy();
  }
  screenInstance = null;
}

// ============================================
// Exports
// ============================================

export {
  TeletextScreen,
  FASTEXT_CONFIG,
};
