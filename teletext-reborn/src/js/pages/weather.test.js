/**
 * Teletext Reborn - Weather Page Tests
 * 
 * Tests for the weather page component including:
 * - ASCII weather icons using block characters
 * - Weather data rendering
 * - Temperature unit display
 * - Location display
 * 
 * @module pages/weather.test
 * Requirements: 6.1-6.7, 32.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import {
  PAGE_NUMBER,
  TITLE,
  WEATHER_ICONS,
  getWeatherIcon,
  render,
  onMount,
  onUnmount,
  getFastextButtons,
  resetWeatherPageState,
  setWeatherData,
  setLocationData,
  getWeatherData,
  getLocationData,
  getIsLoading,
  getErrorMessage,
  DAY_NAMES,
  getDayName,
  formatWindSpeed,
  formatHumidity,
  getIconChar,
} from './weather.js';
import { PAGE_NUMBERS } from '../router.js';
import { resetStateManager, getStateManager } from '../state.js';

// ============================================
// Test Setup
// ============================================

describe('Weather Page', () => {
  beforeEach(() => {
    // Reset state before each test
    resetStateManager();
    resetWeatherPageState();
    
    // Mock DOM
    document.body.innerHTML = '<div class="content-area"></div>';
  });
  
  afterEach(() => {
    // Clean up
    resetWeatherPageState();
    document.body.innerHTML = '';
  });
  
  // ============================================
  // Constants Tests
  // ============================================
  
  describe('Constants', () => {
    it('should have correct page number', () => {
      expect(PAGE_NUMBER).toBe(PAGE_NUMBERS.WEATHER);
      expect(PAGE_NUMBER).toBe(200);
    });
    
    it('should have correct title', () => {
      expect(TITLE).toBe('☀ WEATHER ☀');
    });
    
    it('should have all day names', () => {
      expect(DAY_NAMES).toHaveLength(7);
      expect(DAY_NAMES).toContain('SUN');
      expect(DAY_NAMES).toContain('MON');
      expect(DAY_NAMES).toContain('SAT');
    });
  });
  
  // ============================================
  // ASCII Weather Icons Tests (Req 6.4, 32.4)
  // ============================================
  
  describe('ASCII Weather Icons', () => {
    it('should have all required icon types', () => {
      const requiredIcons = ['sunny', 'cloudy', 'rainy', 'snowy', 'stormy', 'unknown'];
      requiredIcons.forEach(iconType => {
        expect(WEATHER_ICONS).toHaveProperty(iconType);
      });
    });
    
    it('should have additional icon types for variety', () => {
      expect(WEATHER_ICONS).toHaveProperty('partlyCloudy');
      expect(WEATHER_ICONS).toHaveProperty('foggy');
    });
    
    it('should have 5 lines per icon for consistent display', () => {
      Object.entries(WEATHER_ICONS).forEach(([name, lines]) => {
        expect(lines).toHaveLength(5);
      });
    });
    
    it('should use block characters in icons (Req 32.4)', () => {
      // Block characters: █ ▀ ▄ ▌ ▐ ░ ▒ ▓
      const blockChars = ['█', '▀', '▄', '▌', '▐', '░', '▒', '▓'];
      
      // Check that at least some icons use block characters
      const sunnyIcon = WEATHER_ICONS.sunny.join('');
      const hasBlockChars = blockChars.some(char => sunnyIcon.includes(char));
      expect(hasBlockChars).toBe(true);
    });
    
    it('should return correct icon for known types', () => {
      expect(getWeatherIcon('sunny')).toBe(WEATHER_ICONS.sunny);
      expect(getWeatherIcon('cloudy')).toBe(WEATHER_ICONS.cloudy);
      expect(getWeatherIcon('rainy')).toBe(WEATHER_ICONS.rainy);
      expect(getWeatherIcon('snowy')).toBe(WEATHER_ICONS.snowy);
      expect(getWeatherIcon('stormy')).toBe(WEATHER_ICONS.stormy);
    });
    
    it('should return unknown icon for invalid types', () => {
      expect(getWeatherIcon('invalid')).toBe(WEATHER_ICONS.unknown);
      expect(getWeatherIcon('')).toBe(WEATHER_ICONS.unknown);
      expect(getWeatherIcon(null)).toBe(WEATHER_ICONS.unknown);
    });
  });
  
  // ============================================
  // Icon Character Tests
  // ============================================
  
  describe('Icon Characters', () => {
    it('should return correct character for each icon type', () => {
      expect(getIconChar('sunny')).toBe('☀');
      expect(getIconChar('cloudy')).toBe('▓');
      expect(getIconChar('rainy')).toBe('│');
      expect(getIconChar('snowy')).toBe('*');
      expect(getIconChar('stormy')).toBe('⚡');
      expect(getIconChar('partlyCloudy')).toBe('░');
      expect(getIconChar('foggy')).toBe('▒');
    });
    
    it('should return ? for unknown icon types', () => {
      expect(getIconChar('unknown')).toBe('?');
      expect(getIconChar('invalid')).toBe('?');
      expect(getIconChar('')).toBe('?');
    });
  });
  
  // ============================================
  // Helper Function Tests
  // ============================================
  
  describe('Helper Functions', () => {
    describe('getDayName', () => {
      it('should return correct day name for date strings', () => {
        // Sunday
        expect(getDayName('2025-12-07')).toBe('SUN');
        // Monday
        expect(getDayName('2025-12-08')).toBe('MON');
        // Saturday
        expect(getDayName('2025-12-06')).toBe('SAT');
      });
    });
    
    describe('formatWindSpeed', () => {
      it('should format wind speed with KM/H', () => {
        expect(formatWindSpeed(10)).toBe('10 KM/H');
        expect(formatWindSpeed(15.7)).toBe('16 KM/H');
        expect(formatWindSpeed(0)).toBe('0 KM/H');
      });
      
      it('should return -- for null/undefined', () => {
        expect(formatWindSpeed(null)).toBe('--');
        expect(formatWindSpeed(undefined)).toBe('--');
      });
    });
    
    describe('formatHumidity', () => {
      it('should format humidity with %', () => {
        expect(formatHumidity(65)).toBe('65%');
        expect(formatHumidity(100)).toBe('100%');
        expect(formatHumidity(0)).toBe('0%');
      });
      
      it('should round humidity values', () => {
        expect(formatHumidity(65.7)).toBe('66%');
        expect(formatHumidity(65.2)).toBe('65%');
      });
      
      it('should return -- for null/undefined', () => {
        expect(formatHumidity(null)).toBe('--');
        expect(formatHumidity(undefined)).toBe('--');
      });
    });
  });
  
  // ============================================
  // Render Tests
  // ============================================
  
  describe('render()', () => {
    it('should render location prompt when no location set', () => {
      const html = render();
      expect(html).toContain('LOCATION REQUIRED');
      expect(html).toContain('DETECT MY LOCATION');
    });
    
    it('should render loading state when loading', () => {
      // Set loading state by setting location but no weather data
      setLocationData({ city: 'LONDON', lat: 51.5, lon: -0.1 });
      
      const html = render();
      // Should show loading since weatherData is null
      expect(html).toContain('LOADING');
    });
    
    it('should render weather data when available', () => {
      setLocationData({ city: 'LONDON', lat: 51.5, lon: -0.1, country: 'UK' });
      setWeatherData({
        current: {
          temperature: 15,
          condition: 'PARTLY CLOUDY',
          icon: 'partlyCloudy',
          humidity: 65,
          windSpeed: 12,
        },
        forecast: [
          { date: '2025-12-04', high: 18, low: 10, condition: 'SUNNY', icon: 'sunny' },
          { date: '2025-12-05', high: 16, low: 8, condition: 'CLOUDY', icon: 'cloudy' },
        ],
      });
      
      const html = render();
      
      // Check location display (Req 6.6)
      expect(html).toContain('LONDON');
      
      // Check current conditions (Req 6.2)
      expect(html).toContain('15');
      expect(html).toContain('PARTLY CLOUDY');
      expect(html).toContain('65%');
      expect(html).toContain('12 KM/H');
      
      // Check forecast section (Req 6.3)
      expect(html).toContain('5-DAY FORECAST');
    });
    
    it('should show temperature unit info (Req 6.7)', () => {
      setLocationData({ city: 'LONDON', lat: 51.5, lon: -0.1 });
      setWeatherData({
        current: { temperature: 15, condition: 'SUNNY', icon: 'sunny', humidity: 50, windSpeed: 10 },
        forecast: [],
      });
      
      const html = render();
      expect(html).toContain('CELSIUS');
      expect(html).toContain('SETTINGS');
    });
    
    it('should show stale data notice when data is stale', () => {
      setLocationData({ city: 'LONDON', lat: 51.5, lon: -0.1 });
      setWeatherData({
        current: { temperature: 15, condition: 'SUNNY', icon: 'sunny', humidity: 50, windSpeed: 10 },
        forecast: [],
        _stale: true,
      });
      
      const html = render();
      expect(html).toContain('CACHED DATA');
    });
  });
  
  // ============================================
  // Fastext Buttons Tests
  // ============================================
  
  describe('getFastextButtons()', () => {
    it('should return correct button configuration', () => {
      const buttons = getFastextButtons();
      
      expect(buttons.red).toEqual({ label: 'HOME', page: PAGE_NUMBERS.HOME });
      expect(buttons.green).toEqual({ label: 'NEWS', page: PAGE_NUMBERS.NEWS_TOP });
      expect(buttons.yellow).toEqual({ label: 'FINANCE', page: PAGE_NUMBERS.FINANCE });
      expect(buttons.cyan).toEqual({ label: 'TIME', page: PAGE_NUMBERS.TIME_MACHINE });
    });
  });
  
  // ============================================
  // State Management Tests
  // ============================================
  
  describe('State Management', () => {
    it('should reset state correctly', () => {
      setWeatherData({ current: { temperature: 20 } });
      setLocationData({ city: 'PARIS' });
      
      resetWeatherPageState();
      
      expect(getWeatherData()).toBeNull();
      expect(getLocationData()).toBeNull();
      expect(getIsLoading()).toBe(false);
      expect(getErrorMessage()).toBeNull();
    });
    
    it('should set and get weather data', () => {
      const data = { current: { temperature: 25 } };
      setWeatherData(data);
      expect(getWeatherData()).toEqual(data);
    });
    
    it('should set and get location data', () => {
      const data = { city: 'BERLIN', lat: 52.5, lon: 13.4 };
      setLocationData(data);
      expect(getLocationData()).toEqual(data);
    });
  });
  
  // ============================================
  // Property-Based Tests
  // ============================================
  
  describe('Property-Based Tests', () => {
    /**
     * Property: All weather icons should have consistent line count
     * For any icon type, the icon should have exactly 5 lines
     */
    it('Property: All icons have 5 lines', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(WEATHER_ICONS)),
          (iconType) => {
            const icon = WEATHER_ICONS[iconType];
            return icon.length === 5;
          }
        ),
        { numRuns: 100 }
      );
    });
    
    /**
     * Property: formatWindSpeed should always return a string
     * For any numeric input, the result should be a string
     */
    it('Property: formatWindSpeed returns string for any number', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.integer(), fc.float(), fc.constant(null), fc.constant(undefined)),
          (speed) => {
            const result = formatWindSpeed(speed);
            return typeof result === 'string';
          }
        ),
        { numRuns: 100 }
      );
    });
    
    /**
     * Property: formatHumidity should always return a string
     * For any numeric input, the result should be a string
     */
    it('Property: formatHumidity returns string for any number', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.integer(), fc.float(), fc.constant(null), fc.constant(undefined)),
          (humidity) => {
            const result = formatHumidity(humidity);
            return typeof result === 'string';
          }
        ),
        { numRuns: 100 }
      );
    });
    
    /**
     * Property: getWeatherIcon should never throw
     * For any valid icon type, the function should return an array without throwing
     */
    it('Property: getWeatherIcon never throws', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'sunny', 'cloudy', 'rainy', 'snowy', 'stormy', 
            'partlyCloudy', 'foggy', 'unknown',
            'invalid', '', 'random', 'test', 'foo', 'bar'
          ),
          (iconType) => {
            try {
              const result = getWeatherIcon(iconType);
              return Array.isArray(result);
            } catch {
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
    
    /**
     * Property: getWeatherIcon handles null/undefined gracefully
     */
    it('Property: getWeatherIcon handles null/undefined', () => {
      // Test null
      const nullResult = getWeatherIcon(null);
      expect(Array.isArray(nullResult)).toBe(true);
      
      // Test undefined
      const undefinedResult = getWeatherIcon(undefined);
      expect(Array.isArray(undefinedResult)).toBe(true);
    });
    
    /**
     * Property: getIconChar should always return a single character or ?
     * For any valid icon type, the result should be a string of length 1
     */
    it('Property: getIconChar returns single character', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'sunny', 'cloudy', 'rainy', 'snowy', 'stormy', 
            'partlyCloudy', 'foggy', 'unknown',
            'invalid', '', 'random', 'test'
          ),
          (iconType) => {
            const result = getIconChar(iconType);
            return typeof result === 'string' && result.length === 1;
          }
        ),
        { numRuns: 100 }
      );
    });
    
    /**
     * Property: getIconChar handles any string input without throwing
     */
    it('Property: getIconChar never throws for any input', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.constant(null),
            fc.constant(undefined)
          ),
          (iconType) => {
            try {
              const result = getIconChar(iconType);
              return typeof result === 'string';
            } catch {
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
