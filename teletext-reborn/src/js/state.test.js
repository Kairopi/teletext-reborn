/**
 * Teletext Reborn - State Management Property Tests
 * 
 * Property-based tests to verify:
 * - Property 3: Settings Persistence (save/load round-trip)
 * - Property 4: Cache Validity (TTL-based cache expiration)
 * 
 * Validates: Requirements 12.4, 12.5, 14.2, 14.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import {
  StateManager,
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  getStateManager,
  resetStateManager,
} from './state.js';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    },
  };
})();

// Replace global localStorage with mock
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('StateManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    resetStateManager();
  });

  afterEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    resetStateManager();
  });

  describe('Settings Persistence (Property 3)', () => {
    /**
     * Property 3: Settings Persistence
     * *For any* settings change, saving to localStorage and then reloading
     * the application SHALL restore the exact same settings values.
     * 
     * **Feature: teletext-reborn, Property 3: Settings Persistence**
     * **Validates: Requirements 12.4, 12.5**
     */

    // Helper to filter out -0 (negative zero) which JSON cannot distinguish from 0
    const noNegativeZero = (n) => !Object.is(n, -0);
    
    // Arbitrary for location object
    // Note: JSON.stringify converts -0 to 0, so we filter out -0
    const locationArb = fc.option(
      fc.record({
        city: fc.string({ minLength: 1, maxLength: 50 }),
        lat: fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }).filter(noNegativeZero),
        lon: fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }).filter(noNegativeZero),
      }),
      { nil: null }
    );

    // Arbitrary for birthday object
    const birthdayArb = fc.option(
      fc.record({
        month: fc.integer({ min: 1, max: 12 }),
        day: fc.integer({ min: 1, max: 31 }),
        year: fc.integer({ min: 1900, max: 2024 }),
      }),
      { nil: null }
    );

    // Arbitrary for complete settings object
    const settingsArb = fc.record({
      location: locationArb,
      birthday: birthdayArb,
      temperatureUnit: fc.constantFrom('celsius', 'fahrenheit'),
      theme: fc.constantFrom('classic', 'color'),
      soundEnabled: fc.boolean(),
      scanlinesEnabled: fc.boolean(),
      hasSeenIntro: fc.boolean(),
      hasSeenOnboarding: fc.boolean(),
    });

    it('PROPERTY: Save/load round-trip returns identical settings', () => {
      fc.assert(
        fc.property(settingsArb, (settings) => {
          // Clear storage and reset manager
          localStorageMock.clear();
          resetStateManager();

          // Create a new StateManager and update settings
          const manager1 = new StateManager();
          manager1.updateSettings(settings);

          // Verify settings were saved to localStorage
          const savedData = localStorageMock.getItem(STORAGE_KEYS.SETTINGS);
          expect(savedData).not.toBeNull();

          // Create a new StateManager (simulates app reload)
          const manager2 = new StateManager();
          const loadedSettings = manager2.getSettings();

          // Verify all settings match
          expect(loadedSettings.temperatureUnit).toBe(settings.temperatureUnit);
          expect(loadedSettings.theme).toBe(settings.theme);
          expect(loadedSettings.soundEnabled).toBe(settings.soundEnabled);
          expect(loadedSettings.scanlinesEnabled).toBe(settings.scanlinesEnabled);
          expect(loadedSettings.hasSeenIntro).toBe(settings.hasSeenIntro);
          expect(loadedSettings.hasSeenOnboarding).toBe(settings.hasSeenOnboarding);

          // Check location
          if (settings.location === null) {
            expect(loadedSettings.location).toBeNull();
          } else {
            expect(loadedSettings.location).not.toBeNull();
            expect(loadedSettings.location.city).toBe(settings.location.city);
            expect(loadedSettings.location.lat).toBe(settings.location.lat);
            expect(loadedSettings.location.lon).toBe(settings.location.lon);
          }

          // Check birthday
          if (settings.birthday === null) {
            expect(loadedSettings.birthday).toBeNull();
          } else {
            expect(loadedSettings.birthday).not.toBeNull();
            expect(loadedSettings.birthday.month).toBe(settings.birthday.month);
            expect(loadedSettings.birthday.day).toBe(settings.birthday.day);
            expect(loadedSettings.birthday.year).toBe(settings.birthday.year);
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('PROPERTY: Partial settings updates preserve other settings', () => {
      fc.assert(
        fc.property(
          settingsArb,
          fc.constantFrom('celsius', 'fahrenheit'),
          (initialSettings, newTempUnit) => {
            localStorageMock.clear();
            resetStateManager();

            const manager = new StateManager();
            manager.updateSettings(initialSettings);

            // Update only temperature unit
            manager.updateSettings({ temperatureUnit: newTempUnit });

            const loadedSettings = manager.getSettings();

            // Temperature unit should be updated
            expect(loadedSettings.temperatureUnit).toBe(newTempUnit);

            // Other settings should be preserved
            expect(loadedSettings.theme).toBe(initialSettings.theme);
            expect(loadedSettings.soundEnabled).toBe(initialSettings.soundEnabled);
            expect(loadedSettings.scanlinesEnabled).toBe(initialSettings.scanlinesEnabled);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should return default settings when localStorage is empty', () => {
      localStorageMock.clear();
      resetStateManager();

      const manager = new StateManager();
      const settings = manager.getSettings();

      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.setItem(STORAGE_KEYS.SETTINGS, 'invalid json {{{');
      resetStateManager();

      const manager = new StateManager();
      const settings = manager.getSettings();

      // Should fall back to defaults
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should reset settings to defaults', () => {
      localStorageMock.clear();
      resetStateManager();

      const manager = new StateManager();
      manager.updateSettings({
        temperatureUnit: 'fahrenheit',
        theme: 'classic',
        soundEnabled: true,
      });

      const resetSettings = manager.resetSettings();

      expect(resetSettings).toEqual(DEFAULT_SETTINGS);
      expect(manager.getSettings()).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('Cache Validity (Property 4)', () => {
    /**
     * Property 4: Cache Validity
     * *For any* cached API response, if the cache TTL has not expired,
     * the cached data SHALL be returned instead of making a new API call.
     * 
     * **Feature: teletext-reborn, Property 4: Cache Validity**
     * **Validates: Requirements 14.2, 14.3**
     */

    // Arbitrary for cache data (any JSON-serializable value)
    // Note: JSON.stringify cannot handle Infinity, -Infinity, NaN (they become null)
    // and cannot distinguish -0 from 0. So we filter these out.
    const noNegativeZero = (n) => !Object.is(n, -0);
    const finiteDoubleArb = fc.double({ noNaN: true, noDefaultInfinity: true })
      .filter(n => Number.isFinite(n) && noNegativeZero(n));
    
    const cacheDataArb = fc.oneof(
      fc.string(),
      fc.integer().filter(noNegativeZero),
      finiteDoubleArb,
      fc.boolean(),
      fc.array(fc.string()),
      fc.record({
        id: fc.integer().filter(noNegativeZero),
        name: fc.string(),
        value: finiteDoubleArb,
      })
    );

    // Arbitrary for cache key
    const cacheKeyArb = fc.string({ minLength: 1, maxLength: 50 })
      .filter(s => /^[a-zA-Z0-9_-]+$/.test(s));

    // Arbitrary for TTL (1 second to 1 hour)
    const ttlArb = fc.integer({ min: 1000, max: 3600000 });

    it('PROPERTY: Cached data is returned when TTL not expired', () => {
      fc.assert(
        fc.property(cacheKeyArb, cacheDataArb, ttlArb, (key, data, ttl) => {
          localStorageMock.clear();
          resetStateManager();

          const manager = new StateManager();

          // Set cache
          manager.setCache(key, data, ttl);

          // Get cache immediately (should not be expired)
          const cachedData = manager.getCache(key);

          // Data should be returned
          expect(cachedData).not.toBeNull();

          // For primitive types, direct comparison
          if (typeof data !== 'object' || data === null) {
            expect(cachedData).toBe(data);
          } else {
            // For objects/arrays, deep comparison
            expect(cachedData).toEqual(data);
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('PROPERTY: Expired cache returns null', () => {
      fc.assert(
        fc.property(cacheKeyArb, cacheDataArb, (key, data) => {
          localStorageMock.clear();
          resetStateManager();

          const manager = new StateManager();

          // Set cache with very short TTL (1ms)
          manager.setCache(key, data, 1);

          // Manually create an expired cache entry
          const cacheKey = STORAGE_KEYS.CACHE_PREFIX + key;
          const expiredEntry = {
            data: data,
            timestamp: Date.now() - 10000, // 10 seconds ago
            ttl: 1, // 1ms TTL
          };
          localStorageMock.setItem(cacheKey, JSON.stringify(expiredEntry));

          // Get cache (should be expired)
          const cachedData = manager.getCache(key);

          // Should return null for expired cache
          expect(cachedData).toBeNull();

          return true;
        }),
        { numRuns: 50 }
      );
    });

    it('should return null for non-existent cache key', () => {
      localStorageMock.clear();
      resetStateManager();

      const manager = new StateManager();
      const result = manager.getCache('non_existent_key');

      expect(result).toBeNull();
    });

    it('should clear specific cache entry', () => {
      localStorageMock.clear();
      resetStateManager();

      const manager = new StateManager();
      manager.setCache('test_key', { value: 123 }, 60000);

      // Verify cache exists
      expect(manager.getCache('test_key')).toEqual({ value: 123 });

      // Clear cache
      manager.clearCache('test_key');

      // Verify cache is cleared
      expect(manager.getCache('test_key')).toBeNull();
    });

    it('should clear all cache entries', () => {
      localStorageMock.clear();
      resetStateManager();

      const manager = new StateManager();
      manager.setCache('key1', 'value1', 60000);
      manager.setCache('key2', 'value2', 60000);
      manager.setCache('key3', 'value3', 60000);

      // Clear all cache
      manager.clearAllCache();

      // Verify all cache is cleared
      expect(manager.getCache('key1')).toBeNull();
      expect(manager.getCache('key2')).toBeNull();
      expect(manager.getCache('key3')).toBeNull();
    });

    it('should handle corrupted cache data gracefully', () => {
      localStorageMock.clear();
      resetStateManager();

      const manager = new StateManager();
      const cacheKey = STORAGE_KEYS.CACHE_PREFIX + 'corrupted';
      localStorageMock.setItem(cacheKey, 'invalid json {{{');

      const result = manager.getCache('corrupted');

      // Should return null for corrupted data
      expect(result).toBeNull();
    });
  });

  describe('Time Machine State', () => {
    it('should initially have no Time Machine date', () => {
      localStorageMock.clear();
      resetStateManager();

      const manager = new StateManager();

      expect(manager.getCurrentDate()).toBeNull();
      expect(manager.isTimeMachineActive()).toBe(false);
    });

    it('should set and get Time Machine date', () => {
      localStorageMock.clear();
      resetStateManager();

      const manager = new StateManager();
      const testDate = new Date('1969-07-20');

      manager.setTimeMachineDate(testDate);

      expect(manager.getCurrentDate()).toEqual(testDate);
      expect(manager.isTimeMachineActive()).toBe(true);
    });

    it('should clear Time Machine date', () => {
      localStorageMock.clear();
      resetStateManager();

      const manager = new StateManager();
      const testDate = new Date('1989-11-09');

      manager.setTimeMachineDate(testDate);
      manager.clearTimeMachineDate();

      expect(manager.getCurrentDate()).toBeNull();
      expect(manager.isTimeMachineActive()).toBe(false);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      resetStateManager();

      const instance1 = getStateManager();
      const instance2 = getStateManager();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = getStateManager();
      resetStateManager();
      const instance2 = getStateManager();

      expect(instance1).not.toBe(instance2);
    });
  });
});
