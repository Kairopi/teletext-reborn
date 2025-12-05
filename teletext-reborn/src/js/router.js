/**
 * Teletext Reborn - Page Router
 * 
 * Handles navigation between pages with:
 * - 3-digit page number navigation
 * - History management (back/forward)
 * - Keyboard shortcuts
 * - Navigation callbacks
 * 
 * Requirements: 3.1-3.7, 19.1-19.4
 */

/**
 * Page number constants
 */
const PAGE_NUMBERS = {
  HOME: 100,
  NEWS_TOP: 101,
  NEWS_WORLD: 102,
  NEWS_TECH: 103,
  NEWS_BUSINESS: 104,
  NEWS_SPORTS: 105,
  WEATHER: 200,
  FINANCE: 300,
  HOROSCOPES: 450,           // Horoscopes index
  HOROSCOPES_LUCKY: 463,     // Lucky numbers page
  TIME_MACHINE: 500,
  TIME_MACHINE_EVENTS: 501,
  TIME_MACHINE_WEATHER: 502,
  TV_GUIDE: 600,             // TV Listings index
  TV_NOW: 601,               // Now on TV
  TV_TONIGHT: 602,           // Tonight's schedule
  TV_TOMORROW: 603,          // Tomorrow's schedule
  EASTER_EGG: 888,
  SETTINGS: 900,
  ABOUT: 999,
  NOT_FOUND: 404,
};

/**
 * Quick access page mappings for number keys 1-9
 * Requirement 3.3: Number keys navigate to quick-access pages
 */
const QUICK_ACCESS_PAGES = {
  1: PAGE_NUMBERS.NEWS_TOP,      // 1 = News
  2: PAGE_NUMBERS.WEATHER,       // 2 = Weather
  3: PAGE_NUMBERS.FINANCE,       // 3 = Finance
  4: PAGE_NUMBERS.HOROSCOPES,    // 4 = Horoscopes (Req 31.3)
  5: PAGE_NUMBERS.TIME_MACHINE,  // 5 = Time Machine
  6: PAGE_NUMBERS.TV_GUIDE,      // 6 = TV Guide (Req 31.4)
  7: PAGE_NUMBERS.EASTER_EGG,    // 7 = Easter Egg
  8: PAGE_NUMBERS.SETTINGS,      // 8 = Settings
  9: PAGE_NUMBERS.ABOUT,         // 9 = About
};

/**
 * Valid page ranges
 */
const VALID_PAGE_RANGES = [
  { min: 100, max: 109 },  // Home and News
  { min: 200, max: 209 },  // Weather
  { min: 300, max: 309 },  // Finance
  { min: 404, max: 404 },  // Not Found (special)
  { min: 450, max: 463 },  // Horoscopes (Req 31.1)
  { min: 500, max: 504 },  // Time Machine (extended for event detail/timeline)
  { min: 600, max: 609 },  // TV Listings (Req 31.2)
  { min: 888, max: 888 },  // Easter Egg
  { min: 900, max: 900 },  // Settings
  { min: 999, max: 999 },  // About
];


/**
 * PageRouter class
 * Manages page navigation with history support and keyboard shortcuts.
 */
class PageRouter {
  constructor() {
    /** @type {number} Current page number */
    this._currentPage = PAGE_NUMBERS.HOME;
    
    /** @type {number[]} Navigation history stack */
    this._history = [PAGE_NUMBERS.HOME];
    
    /** @type {number} Current position in history */
    this._historyIndex = 0;
    
    /** @type {Function[]} Navigation callbacks */
    this._callbacks = [];
    
    /** @type {boolean} Whether navigation is currently disabled */
    this._navigationDisabled = false;
    
    /** @type {boolean} Whether keyboard listeners are attached */
    this._keyboardListenersAttached = false;
  }

  // ============================================
  // Navigation Methods
  // ============================================

  /**
   * Navigate to a specific page number
   * Requirement 3.2: Navigate directly to page by number
   * Requirement 3.5: Display "Page Not Found" for non-existent pages
   * 
   * @param {number} pageNumber - The 3-digit page number to navigate to
   * @returns {Promise<boolean>} True if navigation succeeded, false otherwise
   */
  async navigate(pageNumber) {
    console.log(`[Router] navigate() called with: ${pageNumber}`);
    
    // Don't navigate if disabled (e.g., during animations)
    if (this._navigationDisabled) {
      console.log('[Router] Navigation disabled, returning false');
      return false;
    }

    // Validate page number is a number
    // Wrap in try-catch to handle objects with throwing toString methods
    let page;
    try {
      page = parseInt(pageNumber, 10);
    } catch {
      // If conversion fails (e.g., object with throwing toString), return false
      console.log('[Router] Failed to parse page number');
      return false;
    }
    
    if (isNaN(page)) {
      console.log('[Router] Page is NaN, returning false');
      return false;
    }

    // Check if page is valid
    if (!this._isValidPage(page)) {
      console.log(`[Router] Page ${page} is not valid, navigating to 404`);
      // Navigate to 404 page for invalid pages (Requirement 3.5)
      return this._performNavigation(PAGE_NUMBERS.NOT_FOUND);
    }

    console.log(`[Router] Page ${page} is valid, performing navigation`);
    return this._performNavigation(page);
  }

  /**
   * Perform the actual navigation
   * @param {number} page - Page number to navigate to
   * @returns {Promise<boolean>} True if navigation succeeded
   * @private
   */
  async _performNavigation(page) {
    const previousPage = this._currentPage;
    
    // Don't navigate if already on the page
    if (page === previousPage) {
      return true;
    }

    // Update current page
    this._currentPage = page;

    // Add to history (truncate forward history if navigating from middle)
    if (this._historyIndex < this._history.length - 1) {
      this._history = this._history.slice(0, this._historyIndex + 1);
    }
    this._history.push(page);
    this._historyIndex = this._history.length - 1;

    // Notify callbacks
    await this._notifyCallbacks(page, previousPage);

    return true;
  }

  /**
   * Get the current page number
   * @returns {number} Current page number
   */
  getCurrentPage() {
    return this._currentPage;
  }

  /**
   * Navigate to the previous page in history
   * Requirement 3.4: Previous button navigates to adjacent page
   */
  goBack() {
    if (this._navigationDisabled) {
      return false;
    }

    if (this._historyIndex > 0) {
      this._historyIndex--;
      const page = this._history[this._historyIndex];
      const previousPage = this._currentPage;
      this._currentPage = page;
      this._notifyCallbacks(page, previousPage);
      return true;
    }
    return false;
  }

  /**
   * Navigate to the next page in history
   * Requirement 3.4: Next button navigates to adjacent page
   */
  goForward() {
    if (this._navigationDisabled) {
      return false;
    }

    if (this._historyIndex < this._history.length - 1) {
      this._historyIndex++;
      const page = this._history[this._historyIndex];
      const previousPage = this._currentPage;
      this._currentPage = page;
      this._notifyCallbacks(page, previousPage);
      return true;
    }
    return false;
  }

  /**
   * Navigate to the previous sequential page number
   * @returns {boolean} True if navigation succeeded
   */
  goToPreviousPage() {
    if (this._navigationDisabled) {
      return false;
    }

    const prevPage = this._findAdjacentPage(this._currentPage, -1);
    if (prevPage !== null) {
      return this.navigate(prevPage);
    }
    return false;
  }

  /**
   * Navigate to the next sequential page number
   * @returns {boolean} True if navigation succeeded
   */
  goToNextPage() {
    if (this._navigationDisabled) {
      return false;
    }

    const nextPage = this._findAdjacentPage(this._currentPage, 1);
    if (nextPage !== null) {
      return this.navigate(nextPage);
    }
    return false;
  }

  /**
   * Navigate to home page
   * Requirement 3.7: Escape key returns to Home page (100)
   */
  goHome() {
    return this.navigate(PAGE_NUMBERS.HOME);
  }

  // ============================================
  // Callback Management
  // ============================================

  /**
   * Register a callback for navigation events
   * @param {Function} callback - Function to call on navigation (page, previousPage)
   * @returns {Function} Unsubscribe function
   */
  onNavigate(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    this._callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this._callbacks.indexOf(callback);
      if (index > -1) {
        this._callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all registered callbacks
   * @param {number} page - New page number
   * @param {number} previousPage - Previous page number
   * @private
   */
  async _notifyCallbacks(page, previousPage) {
    for (const callback of this._callbacks) {
      try {
        await callback(page, previousPage);
      } catch (error) {
        console.error('Navigation callback error:', error);
      }
    }
  }

  // ============================================
  // Keyboard Shortcuts
  // ============================================

  /**
   * Initialize keyboard event listeners
   * Requirements 3.3, 3.7, 19.1-19.4
   */
  initKeyboardShortcuts() {
    if (this._keyboardListenersAttached) {
      console.log('[Router] Keyboard shortcuts already attached, skipping');
      return;
    }

    this._keyboardHandler = this._handleKeyDown.bind(this);
    document.addEventListener('keydown', this._keyboardHandler);
    this._keyboardListenersAttached = true;
    console.log('[Router] Keyboard shortcuts initialized');
  }

  /**
   * Remove keyboard event listeners
   */
  destroyKeyboardShortcuts() {
    if (this._keyboardHandler) {
      document.removeEventListener('keydown', this._keyboardHandler);
      this._keyboardHandler = null;
      this._keyboardListenersAttached = false;
    }
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} event - Keyboard event
   * @private
   */
  _handleKeyDown(event) {
    // Don't handle if navigation is disabled
    if (this._navigationDisabled) {
      return;
    }

    // Don't handle if user is typing in an input field
    const target = event.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const key = event.key;

    // Requirement 3.7: Escape returns to Home page (100)
    if (key === 'Escape') {
      event.preventDefault();
      this.goHome();
      return;
    }

    // Requirement 3.3: Number keys 1-9 navigate to quick-access pages
    if (/^[1-9]$/.test(key)) {
      const pageNumber = QUICK_ACCESS_PAGES[parseInt(key, 10)];
      console.log(`[Router] Number key ${key} pressed, navigating to page ${pageNumber}`);
      if (pageNumber) {
        event.preventDefault();
        event.stopPropagation();
        this.navigate(pageNumber);
      }
      return;
    }

    // Requirement 3.4: Arrow keys for prev/next navigation
    if (key === 'ArrowLeft') {
      event.preventDefault();
      this.goToPreviousPage();
      return;
    }

    if (key === 'ArrowRight') {
      event.preventDefault();
      this.goToNextPage();
      return;
    }

    // Arrow up/down for history navigation
    if (key === 'ArrowUp') {
      event.preventDefault();
      this.goBack();
      return;
    }

    if (key === 'ArrowDown') {
      event.preventDefault();
      this.goForward();
      return;
    }
  }

  // ============================================
  // Navigation Control
  // ============================================

  /**
   * Disable navigation (e.g., during animations)
   * Requirement 11.10: Disable navigation during time travel animation
   */
  disableNavigation() {
    this._navigationDisabled = true;
  }

  /**
   * Enable navigation
   */
  enableNavigation() {
    this._navigationDisabled = false;
  }

  /**
   * Check if navigation is currently disabled
   * @returns {boolean} True if navigation is disabled
   */
  isNavigationDisabled() {
    return this._navigationDisabled;
  }

  // ============================================
  // Validation Helpers
  // ============================================

  /**
   * Check if a page number is valid
   * @param {number} page - Page number to validate
   * @returns {boolean} True if page is valid
   * @private
   */
  _isValidPage(page) {
    // Page must be a 3-digit number (100-999)
    if (page < 100 || page > 999) {
      return false;
    }

    // Check if page is in any valid range
    return VALID_PAGE_RANGES.some(range => page >= range.min && page <= range.max);
  }

  /**
   * Find the adjacent valid page number
   * @param {number} currentPage - Current page number
   * @param {number} direction - Direction (-1 for previous, 1 for next)
   * @returns {number|null} Adjacent page number or null if none found
   * @private
   */
  _findAdjacentPage(currentPage, direction) {
    // Find which range the current page is in
    const currentRange = VALID_PAGE_RANGES.find(
      range => currentPage >= range.min && currentPage <= range.max
    );

    if (!currentRange) {
      return null;
    }

    const nextPage = currentPage + direction;

    // Check if next page is within the same range
    if (nextPage >= currentRange.min && nextPage <= currentRange.max) {
      return nextPage;
    }

    // If moving to a different range, find the appropriate boundary
    if (direction > 0) {
      // Moving forward - find next range
      const nextRange = VALID_PAGE_RANGES.find(range => range.min > currentRange.max);
      return nextRange ? nextRange.min : null;
    } else {
      // Moving backward - find previous range
      const prevRanges = VALID_PAGE_RANGES.filter(range => range.max < currentRange.min);
      if (prevRanges.length > 0) {
        const prevRange = prevRanges[prevRanges.length - 1];
        return prevRange.max;
      }
      return null;
    }
  }

  // ============================================
  // History Management
  // ============================================

  /**
   * Get the navigation history
   * @returns {number[]} Array of page numbers in history
   */
  getHistory() {
    return [...this._history];
  }

  /**
   * Get the current history index
   * @returns {number} Current position in history
   */
  getHistoryIndex() {
    return this._historyIndex;
  }

  /**
   * Check if can go back in history
   * @returns {boolean} True if can go back
   */
  canGoBack() {
    return this._historyIndex > 0;
  }

  /**
   * Check if can go forward in history
   * @returns {boolean} True if can go forward
   */
  canGoForward() {
    return this._historyIndex < this._history.length - 1;
  }

  /**
   * Clear navigation history and reset to home
   */
  clearHistory() {
    this._history = [PAGE_NUMBERS.HOME];
    this._historyIndex = 0;
    this._currentPage = PAGE_NUMBERS.HOME;
  }
}

// ============================================
// Singleton Instance
// ============================================

/**
 * Singleton instance of PageRouter
 * @type {PageRouter|null}
 */
let routerInstance = null;

/**
 * Get the PageRouter singleton instance
 * @returns {PageRouter}
 */
export function getRouter() {
  if (!routerInstance) {
    routerInstance = new PageRouter();
  }
  return routerInstance;
}

/**
 * Reset the PageRouter instance (useful for testing)
 */
export function resetRouter() {
  if (routerInstance) {
    routerInstance.destroyKeyboardShortcuts();
  }
  routerInstance = null;
}

// ============================================
// Exports
// ============================================

export {
  PageRouter,
  PAGE_NUMBERS,
  QUICK_ACCESS_PAGES,
  VALID_PAGE_RANGES,
};
