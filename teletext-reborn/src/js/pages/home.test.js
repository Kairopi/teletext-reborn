/**
 * Teletext Reborn - Home Page Tests
 * 
 * Tests for the home page (Page 100) implementation.
 * Requirements: 4.1-4.10
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  render,
  onMount,
  onUnmount,
  getFastextButtons,
  resetHomePageState,
  getCurrentTipIndex,
  getTips,
  PAGE_NUMBER,
  TITLE,
  MENU_ITEMS,
  TIPS,
} from './home.js';
import { PAGE_NUMBERS } from '../router.js';

// Mock GSAP
vi.mock('gsap', () => ({
  default: {
    timeline: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      to: vi.fn().mockReturnThis(),
      kill: vi.fn(),
    })),
    from: vi.fn(),
    to: vi.fn(),
    killTweensOf: vi.fn(),
  },
}));

// Mock services
vi.mock('../services/geoApi.js', () => ({
  getLocation: vi.fn().mockResolvedValue({
    city: 'LONDON',
    lat: 51.5074,
    lon: -0.1278,
    country: 'UK',
  }),
  formatLocation: vi.fn((loc) => loc?.city || 'UNKNOWN'),
}));

vi.mock('../services/weatherApi.js', () => ({
  getCurrentWeather: vi.fn().mockResolvedValue({
    location: 'LONDON',
    current: {
      temperature: 15,
      condition: 'PARTLY CLOUDY',
      humidity: 65,
      windSpeed: 12,
    },
  }),
  formatTemperature: vi.fn((temp, unit) => {
    const symbol = unit === 'fahrenheit' ? '°F' : '°C';
    return `${Math.round(temp)}${symbol}`;
  }),
}));

// Mock state manager
vi.mock('../state.js', () => ({
  getStateManager: vi.fn(() => ({
    getSettings: vi.fn(() => ({
      location: null,
      temperatureUnit: 'celsius',
    })),
  })),
}));

describe('Home Page', () => {
  beforeEach(() => {
    // Reset state before each test
    resetHomePageState();
    
    // Set up DOM
    document.body.innerHTML = '<div id="content-grid"></div>';
  });

  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Constants', () => {
    it('should have correct page number (100)', () => {
      expect(PAGE_NUMBER).toBe(100);
      expect(PAGE_NUMBER).toBe(PAGE_NUMBERS.HOME);
    });

    it('should have correct title with stars', () => {
      expect(TITLE).toBe('★ TELETEXT REBORN ★');
    });

    it('should have 5 menu items', () => {
      expect(MENU_ITEMS).toHaveLength(5);
    });

    it('should have menu items with correct pages', () => {
      const expectedPages = [
        PAGE_NUMBERS.NEWS_TOP,
        PAGE_NUMBERS.WEATHER,
        PAGE_NUMBERS.FINANCE,
        PAGE_NUMBERS.TIME_MACHINE,
        PAGE_NUMBERS.SETTINGS,
      ];
      
      MENU_ITEMS.forEach((item, index) => {
        expect(item.page).toBe(expectedPages[index]);
      });
    });

    it('should have at least 5 tips (Req 4.10)', () => {
      expect(TIPS.length).toBeGreaterThanOrEqual(5);
    });

    it('should have tips starting with "TIP:"', () => {
      TIPS.forEach(tip => {
        expect(tip.startsWith('TIP:')).toBe(true);
      });
    });
  });

  describe('render()', () => {
    it('should return HTML string', () => {
      const html = render();
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    it('should include double-height title (Req 4.1)', () => {
      const html = render();
      // Uses teletext-page-title class which has scaleY(1.4) for double-height effect
      expect(html).toContain('teletext-page-title');
      expect(html).toContain('★ TELETEXT REBORN ★');
    });

    it('should include current date display (Req 4.2)', () => {
      const html = render();
      expect(html).toContain('date-display');
      // Should contain day name (e.g., MONDAY, TUESDAY, etc.)
      const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const containsDay = dayNames.some(day => html.includes(day));
      expect(containsDay).toBe(true);
    });

    it('should include welcome message (Req 4.3)', () => {
      const html = render();
      expect(html).toContain('WELCOME TO TELETEXT REBORN');
      expect(html).toContain('YOUR RETRO INFORMATION SERVICE');
    });

    it('should include navigation menu with dotted leaders (Req 4.4)', () => {
      const html = render();
      expect(html).toContain('menu-container');
      expect(html).toContain('menu-item');
      // Check for dotted leaders (periods between label and page number)
      expect(html).toContain('.');
      // Check for menu items
      expect(html).toContain('NEWS');
      expect(html).toContain('WEATHER');
      expect(html).toContain('FINANCE');
      expect(html).toContain('TIME MACHINE');
      expect(html).toContain('SETTINGS');
    });

    it('should include tip section (Req 4.5)', () => {
      const html = render();
      expect(html).toContain('tip-section');
      expect(html).toContain('TIP:');
    });

    it('should include weather widget area (Req 4.6)', () => {
      const html = render();
      expect(html).toContain('weather-widget');
    });

    it('should include separators', () => {
      const html = render();
      expect(html).toContain('separator');
      expect(html).toContain('━');
    });

    it('should include menu item bullet points (►)', () => {
      const html = render();
      expect(html).toContain('►');
    });
  });

  describe('Tip Rotation (Req 4.10)', () => {
    it('should rotate through tips on each render', () => {
      resetHomePageState();
      
      const firstTipIndex = getCurrentTipIndex();
      render(); // Advances tip index
      const secondTipIndex = getCurrentTipIndex();
      
      expect(secondTipIndex).toBe((firstTipIndex + 1) % TIPS.length);
    });

    it('should wrap around to first tip after last', () => {
      resetHomePageState();
      const tips = getTips();
      
      // Render enough times to cycle through all tips
      for (let i = 0; i < tips.length; i++) {
        render();
      }
      
      // Should be back at index 0
      expect(getCurrentTipIndex()).toBe(0);
    });
  });

  describe('getFastextButtons() (Req 4.8)', () => {
    it('should return correct Fastext configuration', () => {
      const buttons = getFastextButtons();
      
      expect(buttons.red).toEqual({ label: 'NEWS', page: PAGE_NUMBERS.NEWS_TOP });
      expect(buttons.green).toEqual({ label: 'WEATHER', page: PAGE_NUMBERS.WEATHER });
      expect(buttons.yellow).toEqual({ label: 'FINANCE', page: PAGE_NUMBERS.FINANCE });
      expect(buttons.cyan).toEqual({ label: 'TIME', page: PAGE_NUMBERS.TIME_MACHINE });
    });

    it('should have all four colors', () => {
      const buttons = getFastextButtons();
      
      expect(buttons).toHaveProperty('red');
      expect(buttons).toHaveProperty('green');
      expect(buttons).toHaveProperty('yellow');
      expect(buttons).toHaveProperty('cyan');
    });
  });

  describe('onMount()', () => {
    it('should be a function', () => {
      expect(typeof onMount).toBe('function');
    });

    it('should return a promise', () => {
      const result = onMount();
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('onUnmount()', () => {
    it('should be a function', () => {
      expect(typeof onUnmount).toBe('function');
    });

    it('should not throw when called', () => {
      expect(() => onUnmount()).not.toThrow();
    });
  });

  describe('Menu Items', () => {
    it('should have NEWS linking to page 101', () => {
      const newsItem = MENU_ITEMS.find(item => item.label === 'NEWS');
      expect(newsItem).toBeDefined();
      expect(newsItem.page).toBe(101);
    });

    it('should have WEATHER linking to page 200', () => {
      const weatherItem = MENU_ITEMS.find(item => item.label === 'WEATHER');
      expect(weatherItem).toBeDefined();
      expect(weatherItem.page).toBe(200);
    });

    it('should have FINANCE linking to page 300', () => {
      const financeItem = MENU_ITEMS.find(item => item.label === 'FINANCE');
      expect(financeItem).toBeDefined();
      expect(financeItem.page).toBe(300);
    });

    it('should have TIME MACHINE linking to page 500', () => {
      const timeMachineItem = MENU_ITEMS.find(item => item.label === 'TIME MACHINE');
      expect(timeMachineItem).toBeDefined();
      expect(timeMachineItem.page).toBe(500);
    });

    it('should have SETTINGS linking to page 900', () => {
      const settingsItem = MENU_ITEMS.find(item => item.label === 'SETTINGS');
      expect(settingsItem).toBeDefined();
      expect(settingsItem.page).toBe(900);
    });
  });

  describe('Line Width Constraint', () => {
    it('should not exceed 40 characters per line in rendered content', () => {
      const html = render();
      
      // Extract text content from menu items (the main content lines)
      const menuItemMatches = html.match(/data-page="\d+"[^>]*>([^<]+)</g);
      
      if (menuItemMatches) {
        menuItemMatches.forEach(match => {
          // Extract the text content
          const textMatch = match.match(/>([^<]+)$/);
          if (textMatch) {
            const text = textMatch[1];
            expect(text.length).toBeLessThanOrEqual(40);
          }
        });
      }
    });
  });

  describe('resetHomePageState()', () => {
    it('should reset tip index to 0', () => {
      // Advance tip index
      render();
      render();
      
      // Reset
      resetHomePageState();
      
      expect(getCurrentTipIndex()).toBe(0);
    });
  });

  describe('Menu Stagger Animation (Req 4.7)', () => {
    it('should animate menu items with GSAP stagger', async () => {
      // Render the page content
      const html = render();
      document.getElementById('content-grid').innerHTML = html;
      
      // Call onMount which triggers the animation
      await onMount();
      
      // Verify GSAP was called (mocked)
      const gsap = await import('gsap');
      expect(gsap.default.timeline).toHaveBeenCalled();
    });

    it('should have menu items with data-index attributes for animation', () => {
      const html = render();
      
      // Check that menu items have data-index for stagger ordering
      expect(html).toContain('data-index="0"');
      expect(html).toContain('data-index="1"');
      expect(html).toContain('data-index="2"');
      expect(html).toContain('data-index="3"');
      expect(html).toContain('data-index="4"');
    });
  });
});
