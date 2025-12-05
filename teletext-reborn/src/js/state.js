/**
 * Teletext Reborn - State Management
 * 
 * Manages application state including:
 * - User settings and preferences
 * - Time Machine date state
 * - Cache management with TTL
 * 
 * Requirements: 12.4, 12.5, 14.2, 14.3
 */

/**
 * Storage key constants
 */
const STORAGE_KEYS = {
  SETTINGS: 'teletext_settings',
  CACHE_PREFIX: 'teletext_cache_',
};

/**
 * Default settings values
 * @type {Settings}
 */
const DEFAULT_SETTINGS = {
  location: null,
  birthday: null,
  temperatureUnit: 'celsius',
  theme: 'color',
  soundEnabled: false,
  scanlinesEnabled: true,
  hasSeenIntro: false,
  hasSeenOnboarding: false,
};

/**
 * StateManager class
 * Manages application state and settings with localStorage persistence.
 */
class StateManager {
  constructor() {
    /** @type {Settings} */
    this._settings = { ...DEFAULT_SETTINGS };
    
    /** @type {Date|null} */
    this._timeMachineDate = null;
    
    /** @type {boolean} */
    this._timeMachineActive = false;
    
    // Load settings from localStorage on initialization
    this._loadSettings();
  }

  // ============================================
  // Settings Management
  // ============================================

  /**
   * Get current settings
   * @returns {Settings} Current settings object
   */
  getSettings() {
    return { ...this._settings };
  }

  /**
   * Update settings with partial values
   * Saves to localStorage immediately (Requirement 12.4)
   * @param {Partial<Settings>} newSettings - Settings to update
   */
  updateSettings(newSettings) {
    this._settings = {
      ...this._settings,
      ...newSettings,
    };
    this._saveSettings();
  }

  /**
   * Reset all settings to defaults
   * @returns {Settings} The default settings
   */
  resetSettings() {
    this._settings = { ...DEFAULT_SETTINGS };
    this._saveSettings();
    return this.getSettings();
  }

  /**
   * Load settings from localStorage (Requirement 12.5)
   * @private
   */
  _loadSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new settings fields
        this._settings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
        };
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
      this._settings = { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Save settings to localStorage (Requirement 12.4)
   * @private
   */
  _saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this._settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }

  // ============================================
  // Time Machine State
  // ============================================

  /**
   * Get the current Time Machine date
   * @returns {Date|null} The selected date or null if not set
   */
  getCurrentDate() {
    return this._timeMachineDate;
  }

  /**
   * Set the Time Machine date
   * @param {Date} date - The date to travel to
   */
  setTimeMachineDate(date) {
    this._timeMachineDate = date;
    this._timeMachineActive = true;
  }

  /**
   * Clear the Time Machine date and return to present
   */
  clearTimeMachineDate() {
    this._timeMachineDate = null;
    this._timeMachineActive = false;
  }

  /**
   * Check if Time Machine is currently active
   * @returns {boolean} True if viewing historical date
   */
  isTimeMachineActive() {
    return this._timeMachineActive;
  }

  // ============================================
  // Cache Management
  // ============================================

  /**
   * Get cached data if it exists and is not expired (Requirement 14.3)
   * @param {string} key - Cache key
   * @returns {any|null} Cached data or null if not found/expired
   */
  getCache(key) {
    try {
      const cacheKey = STORAGE_KEYS.CACHE_PREFIX + key;
      const stored = localStorage.getItem(cacheKey);
      
      if (!stored) {
        return null;
      }
      
      const entry = JSON.parse(stored);
      
      // Check if cache has expired
      if (this._isCacheExpired(entry)) {
        // Remove expired cache entry
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.warn(`Failed to get cache for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set cache data with TTL (Requirement 14.2)
   * @param {string} key - Cache key
   * @param {any} value - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  setCache(key, value, ttl) {
    try {
      const cacheKey = STORAGE_KEYS.CACHE_PREFIX + key;
      const entry = {
        data: value,
        timestamp: Date.now(),
        ttl: ttl,
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(entry));
    } catch (error) {
      console.error(`Failed to set cache for key "${key}":`, error);
      // If localStorage is full, try to clear old cache entries
      this._clearOldCache();
    }
  }

  /**
   * Check if a cache entry has expired
   * @param {CacheEntry} entry - Cache entry to check
   * @returns {boolean} True if expired
   * @private
   */
  _isCacheExpired(entry) {
    if (!entry || typeof entry.timestamp !== 'number' || typeof entry.ttl !== 'number') {
      return true;
    }
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Clear a specific cache entry
   * @param {string} key - Cache key to clear
   */
  clearCache(key) {
    try {
      const cacheKey = STORAGE_KEYS.CACHE_PREFIX + key;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn(`Failed to clear cache for key "${key}":`, error);
    }
  }

  /**
   * Clear all cache entries
   */
  clearAllCache() {
    try {
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEYS.CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear all cache:', error);
    }
  }

  /**
   * Clear old/expired cache entries to free up space
   * @private
   */
  _clearOldCache() {
    try {
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEYS.CACHE_PREFIX)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              const entry = JSON.parse(stored);
              if (this._isCacheExpired(entry)) {
                keysToRemove.push(key);
              }
            } catch {
              // Invalid entry, remove it
              keysToRemove.push(key);
            }
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear old cache:', error);
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

/**
 * Singleton instance of StateManager
 * @type {StateManager|null}
 */
let stateManagerInstance = null;

/**
 * Get the StateManager singleton instance
 * @returns {StateManager}
 */
export function getStateManager() {
  if (!stateManagerInstance) {
    stateManagerInstance = new StateManager();
  }
  return stateManagerInstance;
}

/**
 * Reset the StateManager instance (useful for testing)
 */
export function resetStateManager() {
  stateManagerInstance = null;
}

// ============================================
// Exports
// ============================================

export {
  StateManager,
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
};
